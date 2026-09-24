/**
 * Real-world Road Routing Engine (powered by OSRM & OpenStreetMap)
 * Generates turn-by-turn road geometries, distance, duration, and vehicle bearing
 * matching Google Maps street navigation.
 */

export interface RoadRouteResult {
  coordinates: [number, number][]; // [lat, lng] pairs for Leaflet
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  source: 'osrm' | 'fallback';
}

// In-memory cache to prevent redundant API queries
const routeCache = new Map<string, RoadRouteResult>();

// Haversine formula for distance in kilometers
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Spherical forward bearing in degrees (0 to 360)
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Fetch a true turn-by-turn street navigation route from OSRM
 */
export async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RoadRouteResult> {
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}->${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // If start and destination are essentially the same
  const directDist = haversineKm(startLat, startLng, endLat, endLng);
  if (directDist < 0.02) {
    const trivial: RoadRouteResult = {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distanceMeters: directDist * 1000,
      distanceKm: directDist,
      durationSeconds: 10,
      durationMinutes: 1,
      source: 'fallback'
    };
    routeCache.set(cacheKey, trivial);
    return trivial;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    // OSRM Driving endpoint uses longitude,latitude order
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const rawCoords: [number, number][] = route.geometry.coordinates; // [lng, lat]

      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const leafCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

      const distMeters = Math.round(route.distance);
      const distKm = Math.round((route.distance / 1000) * 10) / 10;
      const durSec = Math.round(route.duration);
      const durMin = Math.max(1, Math.round(route.duration / 60));

      const result: RoadRouteResult = {
        coordinates: leafCoords,
        distanceMeters: distMeters,
        distanceKm: distKm,
        durationSeconds: durSec,
        durationMinutes: durMin,
        source: 'osrm'
      };

      routeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('OSRM road router notice (using high-density fallback):', err);
  }

  // Graceful fallback: interpolate intermediate points along the path
  const numSteps = 8;
  const fallbackPoints: [number, number][] = [];
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const curLat = startLat + (endLat - startLat) * t;
    const curLng = startLng + (endLng - startLng) * t;
    fallbackPoints.push([curLat, curLng]);
  }

  const fallbackResult: RoadRouteResult = {
    coordinates: fallbackPoints,
    distanceMeters: Math.round(directDist * 1000),
    distanceKm: Math.round(directDist * 10) / 10,
    durationSeconds: Math.round(directDist * 120),
    durationMinutes: Math.max(1, Math.round(directDist * 2)),
    source: 'fallback'
  };

  routeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

/**
 * Fetch two road routes for an active emergency:
 * 1. Depot to Patient Pickup
 * 2. Patient Pickup to Destination Hospital
 */
export async function fetchAmbulanceMissionRoadRoute(
  depotLat: number,
  depotLng: number,
  patientLat: number,
  patientLng: number,
  hospitalLat: number,
  hospitalLng: number
): Promise<{
  phase1: RoadRouteResult;
  phase2: RoadRouteResult;
  fullRouteCoordinates: [number, number][];
}> {
  const [phase1, phase2] = await Promise.all([
    fetchRoadRoute(depotLat, depotLng, patientLat, patientLng),
    fetchRoadRoute(patientLat, patientLng, hospitalLat, hospitalLng)
  ]);

  const fullRouteCoordinates: [number, number][] = [
    ...phase1.coordinates,
    ...phase2.coordinates.slice(1) // skip duplicate junction point
  ];

  return {
    phase1,
    phase2,
    fullRouteCoordinates
  };
}

/**
 * Traverses a real-world road polyline and computes exact position,
 * bearing/heading and remaining distance at any given progress [0..1]
 */
export function getPointAlongPolyline(
  points: [number, number][],
  progress: number
): {
  lat: number;
  lng: number;
  heading: number;
  remainingDistanceKm: number;
  totalDistanceKm: number;
} {
  if (!points || points.length === 0) {
    return { lat: 0, lng: 0, heading: 0, remainingDistanceKm: 0, totalDistanceKm: 0 };
  }
  if (points.length === 1) {
    return { lat: points[0][0], lng: points[0][1], heading: 0, remainingDistanceKm: 0, totalDistanceKm: 0 };
  }

  // Calculate distances for each segment
  const segmentLengths: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = haversineKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    segmentLengths.push(d);
    totalDist += d;
  }

  if (totalDist === 0) {
    return { lat: points[0][0], lng: points[0][1], heading: 0, remainingDistanceKm: 0, totalDistanceKm: 0 };
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDist = clampedProgress * totalDist;

  let accumulated = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const t = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      const clampedT = Math.max(0, Math.min(1, t));
      const p1 = points[i];
      const p2 = points[i + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * clampedT;
      const lng = p1[1] + (p2[1] - p1[1]) * clampedT;
      const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      const remainingDistanceKm = Math.round((totalDist - targetDist) * 10) / 10;

      return {
        lat: Math.round(lat * 100000) / 100000,
        lng: Math.round(lng * 100000) / 100000,
        heading: Math.round(heading),
        remainingDistanceKm,
        totalDistanceKm: Math.round(totalDist * 10) / 10
      };
    }
    accumulated += segLen;
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  return {
    lat: last[0],
    lng: last[1],
    heading: Math.round(calculateBearing(secondLast[0], secondLast[1], last[0], last[1])),
    remainingDistanceKm: 0,
    totalDistanceKm: Math.round(totalDist * 10) / 10
  };
}
