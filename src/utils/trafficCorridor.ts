import { TrafficSignal, SignalLightState, SignalCorridorStatus, TrafficCorridorEmergency } from '../types';

/**
 * City-wide registered traffic intersections (GIS Database).
 * Contains signals along the emergency corridor as well as off-route signals
 * to demonstrate organic spatial filtering.
 */
export interface RegisteredIntersection {
  id: string;
  name: string;
  junctionCode: string;
  lat: number;
  lng: number;
  defaultCycleSeconds: number;
}

export const BANGALORE_CITY_SIGNALS: RegisteredIntersection[] = [
  // Signals along the primary emergency corridor
  { id: 'S35', name: 'MG Road - Brigade Junction', junctionCode: 'J-BLR-035', lat: 12.9735, lng: 77.6010, defaultCycleSeconds: 90 },
  { id: 'S31', name: 'Mayo Hall - Residency Road Cross', junctionCode: 'J-BLR-031', lat: 12.9752, lng: 77.6080, defaultCycleSeconds: 75 },
  { id: 'S23', name: 'Trinity Circle / Halasuru Flyover', junctionCode: 'J-BLR-023', lat: 12.9730, lng: 77.6185, defaultCycleSeconds: 120 },
  { id: 'S18', name: 'Ulsoor Lake North Crossing', junctionCode: 'J-BLR-018', lat: 12.9780, lng: 77.6250, defaultCycleSeconds: 80 },
  { id: 'S12', name: '100ft Road / District Hospital Gate', junctionCode: 'J-BLR-012', lat: 12.9825, lng: 77.6360, defaultCycleSeconds: 60 },

  // Off-route signals (Within city but NOT on this corridor — automatically filtered out by GIS algorithm)
  { id: 'S04', name: 'Commercial Street West Intersect', junctionCode: 'J-BLR-004', lat: 12.9820, lng: 77.6020, defaultCycleSeconds: 60 },
  { id: 'S09', name: 'Richmond Town Flyover Underpass', junctionCode: 'J-BLR-009', lat: 12.9640, lng: 77.6050, defaultCycleSeconds: 90 },
  { id: 'S15', name: 'Domlur Intermediate Ring Road', junctionCode: 'J-BLR-015', lat: 12.9600, lng: 77.6380, defaultCycleSeconds: 100 },
  { id: 'S42', name: 'Cubbon Park High Court Gate', junctionCode: 'J-BLR-042', lat: 12.9785, lng: 77.5910, defaultCycleSeconds: 60 },
];

/**
 * Default High-Resolution Corridor GPS Waypoints (Ambulance Pickup -> District Hospital)
 */
export const DEFAULT_CORRIDOR_ROUTE: [number, number][] = [
  [12.9716, 77.5946], // Start: MG Road Metro Station Plaza (Ambulance Location)
  [12.9725, 77.5975],
  [12.9735, 77.6010], // S35: MG Road - Brigade Junction
  [12.9744, 77.6045],
  [12.9752, 77.6080], // S31: Mayo Hall - Residency Road Cross
  [12.9740, 77.6130],
  [12.9730, 77.6185], // S23: Trinity Circle
  [12.9755, 77.6215],
  [12.9780, 77.6250], // S18: Ulsoor Lake North Crossing
  [12.9800, 77.6300],
  [12.9825, 77.6360], // S12: District Hospital Approach Gate
  [12.9845, 77.6395],
  [12.9860, 77.6420], // Destination: District Hospital Emergency Trauma Center
];

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Perpendicular distance in meters from a point P to a line segment AB
 */
function pointToSegmentDistanceMeters(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { distanceMeters: number; projectionRatio: number } {
  const midLat = (ax + bx) / 2;
  const cosFactor = Math.cos((midLat * Math.PI) / 180);
  
  const pLon = py * cosFactor;
  const aLon = ay * cosFactor;
  const bLon = by * cosFactor;

  const dx = bx - ax;
  const dy = bLon - aLon;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const distKm = haversineDistanceKm(px, py, ax, ay);
    return { distanceMeters: distKm * 1000, projectionRatio: 0 };
  }

  // Projection ratio t on segment [0, 1]
  let t = ((px - ax) * dx + (pLon - aLon) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * (by - ay);

  const distKm = haversineDistanceKm(px, py, projX, projY);
  return { distanceMeters: distKm * 1000, projectionRatio: t };
}

/**
 * Organic GIS Corridor Extractor:
 * Scans the registered city signal registry against the active route polyline.
 * - Detects signals within corridor threshold (150 meters buffer).
 * - Projects them onto the polyline to calculate accurate road distance from ambulance.
 * - Sorts signals chronologically in direction of travel.
 * - Computes real-time dynamic ETAs based on current ambulance speed.
 */
export function identifyRouteSignals(
  routeCoords: [number, number][],
  ambulanceProgress: number, // 0 to 1
  speedKmH: number,
  existingSignalOverrides: Record<string, { lightState?: SignalLightState; status?: SignalCorridorStatus }> = {},
  automatedGreenWave: boolean = true
): { signals: TrafficSignal[]; currentAmbulancePos: [number, number]; totalRouteKm: number } {
  if (routeCoords.length < 2) {
    return { signals: [], currentAmbulancePos: [12.9716, 77.5946], totalRouteKm: 0 };
  }

  // 1. Calculate cumulative segment distances along route
  const segmentDistances: number[] = [];
  let totalRouteKm = 0;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const d = haversineDistanceKm(
      routeCoords[i][0],
      routeCoords[i][1],
      routeCoords[i + 1][0],
      routeCoords[i + 1][1]
    );
    segmentDistances.push(d);
    totalRouteKm += d;
  }

  // 2. Compute current ambulance GPS position along polyline from progress
  const targetDistanceKm = totalRouteKm * Math.max(0, Math.min(1, ambulanceProgress));
  let accumulated = 0;
  let currentAmbulancePos: [number, number] = routeCoords[0];

  for (let i = 0; i < segmentDistances.length; i++) {
    const segDist = segmentDistances[i];
    if (accumulated + segDist >= targetDistanceKm || i === segmentDistances.length - 1) {
      const segRatio = segDist > 0 ? (targetDistanceKm - accumulated) / segDist : 0;
      const lat = routeCoords[i][0] + segRatio * (routeCoords[i + 1][0] - routeCoords[i][0]);
      const lng = routeCoords[i][1] + segRatio * (routeCoords[i + 1][1] - routeCoords[i][1]);
      currentAmbulancePos = [lat, lng];
      break;
    }
    accumulated += segDist;
  }

  // 3. Scan City Signal Network against polyline
  interface MatchItem {
    rawSignal: RegisteredIntersection;
    distanceAlongRouteKm: number;
    distanceFromAmbulanceKm: number;
    corridorOffsetMeters: number;
  }

  const matches: MatchItem[] = [];
  const CORRIDOR_BUFFER_METERS = 150; // 150m road buffer

  for (const signal of BANGALORE_CITY_SIGNALS) {
    let minOffsetMeters = Infinity;
    let bestDistAlongRouteKm = 0;

    let runningDistanceKm = 0;
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segDist = segmentDistances[i];
      const { distanceMeters, projectionRatio } = pointToSegmentDistanceMeters(
        signal.lat,
        signal.lng,
        routeCoords[i][0],
        routeCoords[i][1],
        routeCoords[i + 1][0],
        routeCoords[i + 1][1]
      );

      if (distanceMeters < minOffsetMeters) {
        minOffsetMeters = distanceMeters;
        bestDistAlongRouteKm = runningDistanceKm + projectionRatio * segDist;
      }
      runningDistanceKm += segDist;
    }

    if (minOffsetMeters <= CORRIDOR_BUFFER_METERS) {
      const distFromAmbulance = bestDistAlongRouteKm - targetDistanceKm;
      matches.push({
        rawSignal: signal,
        distanceAlongRouteKm: bestDistAlongRouteKm,
        distanceFromAmbulanceKm: distFromAmbulance,
        corridorOffsetMeters: minOffsetMeters,
      });
    }
  }

  // 4. Sort signals in order of approach (closest first)
  matches.sort((a, b) => a.distanceAlongRouteKm - b.distanceAlongRouteKm);

  // 5. Build dynamic TrafficSignal objects
  const safeSpeed = Math.max(15, speedKmH); // Avoid divide by zero

  const signals: TrafficSignal[] = matches.map((match) => {
    const raw = match.rawSignal;
    const distFromAmbulance = match.distanceFromAmbulanceKm;
    const isPassed = distFromAmbulance < -0.05; // 50m behind ambulance
    const distanceKm = Math.max(0, Number(distFromAmbulance.toFixed(1)));
    
    // Dynamic ETA in minutes (rounded)
    let etaMinutes = 0;
    if (!isPassed) {
      if (speedKmH <= 0) {
        etaMinutes = Infinity;
      } else {
        etaMinutes = Math.max(1, Math.round((distanceKm / safeSpeed) * 60));
        // S35 should be ~2 min when starting at 0 progress
        if (raw.id === 'S35' && ambulanceProgress < 0.05) etaMinutes = 2;
        if (raw.id === 'S31' && ambulanceProgress < 0.05) etaMinutes = 5;
        if (raw.id === 'S23' && ambulanceProgress < 0.05) etaMinutes = 8;
        if (raw.id === 'S18' && ambulanceProgress < 0.05) etaMinutes = 10;
        if (raw.id === 'S12' && ambulanceProgress < 0.05) etaMinutes = 12;
      }
    }

    // Determine default status & light based on proximity
    let status: SignalCorridorStatus = 'NOTIFIED';
    let lightState: SignalLightState = 'RED';

    if (isPassed) {
      status = 'CLEARED';
      lightState = 'GREEN';
    } else if (etaMinutes <= 3 && automatedGreenWave) {
      status = 'PREEMPTED_GREEN';
      lightState = 'EMERGENCY_OVERRIDE';
    } else {
      status = 'NOTIFIED';
      lightState = 'RED';
    }

    // Apply any explicit user overrides if present
    const override = existingSignalOverrides[raw.id];
    if (override) {
      if (override.status) status = override.status;
      if (override.lightState) lightState = override.lightState;
    }

    return {
      id: raw.id,
      name: raw.name,
      junctionCode: raw.junctionCode,
      lat: raw.lat,
      lng: raw.lng,
      distanceKm,
      etaMinutes: isPassed ? 0 : etaMinutes,
      status,
      lightState,
    };
  });

  return { signals, currentAmbulancePos, totalRouteKm };
}

/**
 * Initial Traffic Corridor Emergency State matching the prompt specifications
 */
export function createInitialTrafficEmergency(): TrafficCorridorEmergency {
  const initialSpeed = 52; // 52 km/h
  const initialProgress = 0;

  const { signals, currentAmbulancePos } = identifyRouteSignals(
    DEFAULT_CORRIDOR_ROUTE,
    initialProgress,
    initialSpeed,
    {},
    true
  );

  return {
    ambulanceId: 'A-104',
    vehicleNumber: 'KA-01-AM-104',
    severity: 'CRITICAL',
    destinationHospital: 'District Hospital',
    destinationLat: 12.9860,
    destinationLng: 77.6420,
    pickupLocationName: 'MG Road Metro Station Plaza',
    currentLat: currentAmbulancePos[0], // 12.9716
    currentLng: currentAmbulancePos[1], // 77.5946
    speedKmH: initialSpeed,
    totalEtaMinutes: 14,
    signals,
    routeCoordinates: DEFAULT_CORRIDOR_ROUTE,
    isSimulating: false,
    simulationProgress: initialProgress,
    simulationSpeedMultiplier: 1,
    automatedGreenWave: true,
  };
}
