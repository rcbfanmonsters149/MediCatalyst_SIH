import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Hospital, Ambulance, TrafficSignal } from '../types';
import { Navigation, Locate, ExternalLink, MapPin, Compass, AlertCircle, Phone, Activity, Zap, ChevronUp, ChevronDown, Clock, ShieldCheck, Plus, Minus } from './icons';
import { useApp } from '../context/AppContext';
import { fetchRoadRoute, RoadRouteResult } from '../utils/routing';

interface LeafletMapProps {
  hospitals?: Hospital[];
  ambulances?: Ambulance[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospitalId: string) => void;
  pickupLocation?: { lat: number; lng: number; label: string };
  rerouteDestination?: Hospital | null;
  height?: string;
  showReroutePath?: boolean;
  showRideHUD?: boolean;

  // Traffic Corridor Specific Props
  trafficSignals?: TrafficSignal[];
  selectedSignalId?: string;
  onSelectSignal?: (signalId: string) => void;
  corridorRoute?: [number, number][];
  activeAmbulanceLocation?: {
    lat: number;
    lng: number;
    id: string;
    speedKmH: number;
    etaMinutes: number;
    severity?: string;
  };
  destinationLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  showLegend?: boolean;
  showRouteLine?: boolean;
}

// Haversine distance calculator in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  hospitals = [],
  ambulances = [],
  selectedHospitalId,
  onSelectHospital,
  pickupLocation,
  rerouteDestination,
  height = '460px',
  showReroutePath = false,
  showRideHUD = true,
  trafficSignals = [],
  selectedSignalId,
  onSelectSignal,
  corridorRoute,
  activeAmbulanceLocation,
  destinationLocation,
  showLegend = true,
  showRouteLine = false
}) => {
  const { 
    userLocation: contextUserLocation, 
    relocateToUserLocation, 
    liveAmbulance, 
    activeHandover, 
    caretakerTelemetry, 
    activeDispatch,
    stabilizationSession,
    activeTransportStrategy
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const liveAmbLayerRef = useRef<L.LayerGroup | null>(null);
  const hasUserInteractedRef = useRef<boolean>(false);
  const hasInitialFitHappenedRef = useRef<boolean>(false);
  const prevSelectedHospIdRef = useRef<string | undefined>(selectedHospitalId);

  // User's detected real-time GPS location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(() => {
    return contextUserLocation ? { lat: contextUserLocation.lat, lng: contextUserLocation.lng } : null;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request browser geolocation
  const detectUserLocation = useCallback((forcePan = false) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setUserLocation(coords);
        setIsLocating(false);

        // Dynamically relocate hospitals and ambulances to the user's immediate coordinates
        relocateToUserLocation(coords.lat, coords.lng);

        // Only pan if the user explicitly clicked "My Location" button
        if (mapInstanceRef.current && forcePan) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16, {
            duration: 1.2
          });
        }
      },
      (err) => {
        console.warn('Geolocation lookup notice:', err.message);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Using default regional center.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    );
  }, [relocateToUserLocation]);

  // Initial location detection on component mount
  useEffect(() => {
    detectUserLocation(false);
  }, [detectUserLocation]);

  // Keep synced with context userLocation
  useEffect(() => {
    if (contextUserLocation && (!userLocation || userLocation.lat !== contextUserLocation.lat || userLocation.lng !== contextUserLocation.lng)) {
      setUserLocation({ lat: contextUserLocation.lat, lng: contextUserLocation.lng });
    }
  }, [contextUserLocation]);

  // Stable memoized anchor position for distance & route calculations
  const effectiveUserCoords = useMemo(() => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    if (contextUserLocation) return { lat: contextUserLocation.lat, lng: contextUserLocation.lng };
    if (pickupLocation) return { lat: pickupLocation.lat, lng: pickupLocation.lng };
    return { lat: 28.7080, lng: 77.0980 };
  }, [userLocation?.lat, userLocation?.lng, contextUserLocation?.lat, contextUserLocation?.lng, pickupLocation?.lat, pickupLocation?.lng]);

  // Calculate nearest hospital from user's current GPS position
  const nearestHospital = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return undefined;
    return hospitals.reduce((closest, curr) => {
      const dist = calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, curr.lat, curr.lng);
      const closestDist = closest ? calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, closest.lat, closest.lng) : Infinity;
      return dist < closestDist ? curr : closest;
    }, hospitals[0]);
  }, [hospitals, effectiveUserCoords]);

  // Target hospital for navigation route (either selected, or nearest)
  const targetHospital = useMemo(() => {
    return hospitals.find(h => h.id === selectedHospitalId) || nearestHospital || hospitals[0];
  }, [hospitals, selectedHospitalId, nearestHospital]);

  // Turn-by-turn road geometry state (powered by OSRM real-world driving network)
  const [roadRouteData, setRoadRouteData] = useState<RoadRouteResult | null>(null);
  const [isLoadingRoad, setIsLoadingRoad] = useState<boolean>(false);

  // Fetch real-world street route geometries between user/patient and target hospital
  useEffect(() => {
    const destination = (showReroutePath && rerouteDestination) ? rerouteDestination : targetHospital;
    if (!destination || (corridorRoute && corridorRoute.length > 1)) {
      setRoadRouteData(null);
      return;
    }

    let active = true;
    setIsLoadingRoad(true);

    fetchRoadRoute(effectiveUserCoords.lat, effectiveUserCoords.lng, destination.lat, destination.lng)
      .then(res => {
        if (active) {
          setRoadRouteData(res);
          setIsLoadingRoad(false);
        }
      })
      .catch(err => {
        console.warn('Real-world road route fetch notice:', err);
        if (active) setIsLoadingRoad(false);
      });

    return () => {
      active = false;
    };
  }, [
    effectiveUserCoords.lat,
    effectiveUserCoords.lng,
    targetHospital?.id,
    targetHospital?.lat,
    targetHospital?.lng,
    rerouteDestination?.id,
    rerouteDestination?.lat,
    rerouteDestination?.lng,
    showReroutePath,
    corridorRoute
  ]);

  // Google Maps style auto-zoom to frame active trip (User ➔ Ambulance ➔ Hospital)
  const focusActiveRoute = useCallback((force = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (force) {
      hasUserInteractedRef.current = false;
    }

    if (corridorRoute && corridorRoute.length > 1) {
      try {
        map.flyToBounds(L.latLngBounds(corridorRoute), {
          padding: [50, 50],
          maxZoom: 15,
          duration: 1.2
        });
      } catch (e) {}
      return;
    }

    const destination = (showReroutePath && rerouteDestination) ? rerouteDestination : targetHospital;
    if (!destination) return;

    let points: [number, number][];
    if (roadRouteData && roadRouteData.coordinates && roadRouteData.coordinates.length > 1) {
      points = [...roadRouteData.coordinates];
    } else {
      points = [
        [effectiveUserCoords.lat, effectiveUserCoords.lng],
        [destination.lat, destination.lng]
      ];
    }

    if (liveAmbulance) {
      points.push([liveAmbulance.lat, liveAmbulance.lng]);
    }

    if (activeHandover) {
      points.push([activeHandover.meetingLat, activeHandover.meetingLng]);
      if (caretakerTelemetry) {
        points.push([caretakerTelemetry.lat, caretakerTelemetry.lng]);
      }
    }

    try {
      map.flyToBounds(L.latLngBounds(points), {
        padding: [60, 60],
        maxZoom: 15,
        duration: 1.2
      });
    } catch (e) {}
  }, [corridorRoute, showReroutePath, rerouteDestination, targetHospital, effectiveUserCoords, liveAmbulance, roadRouteData, activeHandover, caretakerTelemetry]);

  // When user actively switches hospital selection, smoothly glide to frame the new destination
  useEffect(() => {
    if (!mapInstanceRef.current || !hasInitialFitHappenedRef.current) return;
    if (selectedHospitalId && selectedHospitalId !== prevSelectedHospIdRef.current) {
      prevSelectedHospIdRef.current = selectedHospitalId;
      focusActiveRoute(true);
    }
  }, [selectedHospitalId, focusActiveRoute]);

  // Initialize Leaflet Map Instance with Perfect First-Time View & Slow Smooth Scrolling
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const destination = (showReroutePath && rerouteDestination) ? rerouteDestination : targetHospital;
      
      let initialBounds: L.LatLngBounds | null = null;
      if (corridorRoute && corridorRoute.length > 1) {
        initialBounds = L.latLngBounds(corridorRoute);
      } else if (showRouteLine && destination) {
        initialBounds = L.latLngBounds([
          [effectiveUserCoords.lat, effectiveUserCoords.lng],
          [destination.lat, destination.lng]
        ]);
      } else if (hospitals.length > 0) {
        const allPoints: [number, number][] = [
          [effectiveUserCoords.lat, effectiveUserCoords.lng],
          ...hospitals.map(h => [h.lat, h.lng] as [number, number])
        ];
        initialBounds = L.latLngBounds(allPoints);
      } else if (destination) {
        initialBounds = L.latLngBounds([
          [effectiveUserCoords.lat, effectiveUserCoords.lng],
          [destination.lat, destination.lng]
        ]);
      }

      const initialCenter: [number, number] = initialBounds 
        ? [initialBounds.getCenter().lat, initialBounds.getCenter().lng]
        : [effectiveUserCoords.lat, effectiveUserCoords.lng];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomSnap: 0.1,
        zoomDelta: 0.2,
        scrollWheelZoom: false, // Disables jerky default wheel zoom; handled smoothly via custom listener below
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true
      });

      // STRICTLY OPENSTREETMAP ONLY (Per user request)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add attribution in bottom-left to prevent overlap with live tracker card in bottom-right
      L.control.attribution({ position: 'bottomleft' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      userMarkerGroupRef.current = L.layerGroup().addTo(map);
      routeGroupRef.current = L.layerGroup().addTo(map);
      liveAmbLayerRef.current = L.layerGroup().addTo(map);

      // PERFECT FIRST-TIME VIEW: Zoom in to the correct extent framing all facilities
      if (initialBounds) {
        map.fitBounds(initialBounds, {
          padding: [50, 50],
          maxZoom: 13.5,
          animate: false
        });
        hasInitialFitHappenedRef.current = true;
      }

      // Track manual user drag / click so we do not override their chosen zoom level
      map.on('movestart', (e: any) => {
        if (e.originalEvent) {
          hasUserInteractedRef.current = true;
        }
      });

      // SILKY-SMOOTH SLOW TRACKPAD & MOUSE WHEEL ZOOM + ISOLATED PINCH-TO-ZOOM
      // Eliminates zoom oscillation ("zooming in and out simultaneously") and makes scrolling gentle and slow
      // Also handles trackpad pinch gestures smoothly directly inside the map container without zooming the browser UI
      let targetZoom = map.getZoom();
      let zoomRafId: number | null = null;

      const container = mapContainerRef.current;
      const onWheel = (e: WheelEvent) => {
        // Allow normal page scrolling when mouse wheel is used over map.
        // Only zoom map if user holds Ctrl/Cmd (standard map gesture behavior) or pinches.
        const isPinchOrCtrl = e.ctrlKey || e.metaKey;
        if (!isPinchOrCtrl) {
          return; // Let the browser scroll the page normally!
        }

        e.preventDefault();
        e.stopPropagation();

        hasUserInteractedRef.current = true;

        const zoomDelta = e.deltaY * -0.015;
        const currentZoom = map.getZoom();
        targetZoom = Math.min(18, Math.max(10, (zoomRafId !== null ? targetZoom : currentZoom) + zoomDelta));

        if (zoomRafId === null) {
          const mousePoint = map.mouseEventToContainerPoint(e);
          zoomRafId = requestAnimationFrame(() => {
            map.setZoomAround(mousePoint, targetZoom, { animate: false });
            zoomRafId = null;
          });
        }
      };

      // Safari macOS trackpad gestures
      let gestureStartZoom = map.getZoom();
      const onGestureStart = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        hasUserInteractedRef.current = true;
        gestureStartZoom = map.getZoom();
      };

      const onGestureChange = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.scale) return;
        const newZoom = Math.min(18, Math.max(10, gestureStartZoom + Math.log2(e.scale)));
        const mousePoint = map.mouseEventToContainerPoint(e);
        map.setZoomAround(mousePoint, newZoom, { animate: false });
      };

      const onGestureEnd = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
      };

      container.addEventListener('wheel', onWheel, { passive: false });
      container.addEventListener('gesturestart', onGestureStart, { passive: false });
      container.addEventListener('gesturechange', onGestureChange, { passive: false });
      container.addEventListener('gestureend', onGestureEnd, { passive: false });

      mapInstanceRef.current = map;

      return () => {
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('gesturestart', onGestureStart);
        container.removeEventListener('gesturechange', onGestureChange);
        container.removeEventListener('gestureend', onGestureEnd);
        if (zoomRafId !== null) cancelAnimationFrame(zoomRafId);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size on container changes
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, []);


  // Render Markers, Highlights, User GPS Pin, and Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const userMarkerGroup = userMarkerGroupRef.current;
    const routeGroup = routeGroupRef.current;

    if (!map || !markersGroup || !userMarkerGroup || !routeGroup) return;

    markersGroup.clearLayers();
    userMarkerGroup.clearLayers();
    routeGroup.clearLayers();

    // 1. RENDER USER'S CURRENT GPS LOCATION (Pulsing Radar Pin)
    const userLat = effectiveUserCoords.lat;
    const userLng = effectiveUserCoords.lng;

    const userPinHtml = `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="
          width: 22px; 
          height: 22px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #2563eb, #1d4ed8); 
          border: 3px solid #ffffff; 
          box-shadow: 0 0 12px rgba(37, 99, 235, 0.8);
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
          z-index: 10;
        ">
        </div>
        <div style="
          position: absolute;
          bottom: -18px;
          background: #1e293b;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          letter-spacing: 0.5px;
        ">
          YOU
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userPinHtml,
      className: 'user-gps-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 });
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #2563eb;"></span>
          <strong style="color: #0f172a; font-size: 13px;">Your Current GPS Position</strong>
        </div>
        <p style="margin: 0 0 8px; color: #64748b; font-size: 11px;">
          Coordinates: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}
        </p>
        <a 
          href="https://www.google.com/maps/search/hospitals/@${userLat},${userLng},14z" 
          target="_blank" 
          rel="noopener noreferrer"
          style="display: inline-flex; align-items: center; justify-content: center; width: 100%; background-color: #2563eb; color: white; padding: 6px 10px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: bold;"
        >
          🗺️ Search Hospitals in Google Maps
        </a>
      </div>
    `);
    userMarkerGroup.addLayer(userMarker);

    // Optional user accuracy circle
    if (userLocation?.accuracy && userLocation.accuracy < 1000) {
      const accuracyCircle = L.circle([userLat, userLng], {
        radius: Math.min(userLocation.accuracy, 250),
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.15,
        weight: 1
      });
      userMarkerGroup.addLayer(accuracyCircle);
    }

    // 2. HIGHLIGHT & RENDER HOSPITALS
    hospitals.forEach(hosp => {
      const isSelected = hosp.id === selectedHospitalId;
      const isNearest = hosp.id === nearestHospital?.id;
      const isRerouteTarget = rerouteDestination?.id === hosp.id;
      
      const distFromUser = calculateHaversineKm(userLat, userLng, hosp.lat, hosp.lng);
      const drivingEta = Math.max(2, Math.round(distFromUser * 2.1));

      // Theme Colors & Highlighting
      let primaryColor = '#059669'; // Emerald default for PHC / CHC
      let badgeLabel = 'PHC / CHC';

      if (hosp.type.includes('Apex') || hosp.type.includes('Tertiary') || hosp.type.includes('Sub-District')) {
        primaryColor = '#2563eb'; // Blue for Apex
        badgeLabel = 'Apex Trauma';
      }
      if (isRerouteTarget) {
        primaryColor = '#ea580c'; // Orange for reroute
        badgeLabel = 'Reroute Bay';
      }
      if (isNearest) {
        badgeLabel = '⭐ Nearest';
      }

      const isHighlighted = isSelected || isNearest || isRerouteTarget;

      const hospitalPinHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          
          ${isHighlighted ? `
            <span style="
              position: absolute; 
              width: 44px; 
              height: 44px; 
              border-radius: 50%; 
              background-color: ${isNearest ? 'rgba(16, 185, 129, 0.4)' : 'rgba(37, 99, 235, 0.4)'}; 
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
          ` : ''}

          <div style="
            background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);
            color: white;
            width: ${isHighlighted ? '38px' : '32px'};
            height: ${isHighlighted ? '38px' : '32px'};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isHighlighted ? '18px' : '15px'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 2.5px solid white;
            transition: all 0.2s;
            z-index: 5;
          ">
            🏥
          </div>

          <!-- Highlight Pill Tag Above Marker -->
          <div style="
            position: absolute;
            top: -14px;
            background: ${isNearest ? '#059669' : (isSelected ? '#dc2626' : '#1e293b')};
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1.5px 6px;
            border-radius: 8px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.7);
            letter-spacing: 0.3px;
          ">
            ${badgeLabel}
          </div>
        </div>
      `;

      const hospIcon = L.divIcon({
        html: hospitalPinHtml,
        className: 'custom-hosp-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([hosp.lat, hosp.lng], { 
        icon: hospIcon,
        zIndexOffset: isHighlighted ? 500 : 100 
      });

      // Google Maps Direct Navigation Link URL
      const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hosp.lat},${hosp.lng}&travelmode=driving`;
      const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.name + ', ' + hosp.address)}`;

      const popupContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 240px; padding: 4px;">
          
          <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div>
              <h4 style="margin: 0; font-weight: 800; color: #0f172a; font-size: 14px; line-height: 1.2;">${hosp.name}</h4>
              <span style="font-size: 11px; color: #64748b; font-weight: 500;">${hosp.type}</span>
            </div>
            ${isNearest ? '<span style="background: #ecfdf5; color: #065f46; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; border: 1px solid #a7f3d0; white-space: nowrap;">⚡ NEAREST</span>' : ''}
          </div>

          <!-- Distance & Driving ETA Bar -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <div>
              <span style="color: #64748b;">Distance:</span> <strong style="color: #0f172a;">${distFromUser} km</strong>
            </div>
            <div>
              <span style="color: #64748b;">Drive ETA:</span> <strong style="color: #059669;">~${drivingEta} mins</strong>
            </div>
          </div>

          <!-- Bed Availability Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Gen Beds:</span> <strong>${hosp.generalBedsAvail}/${hosp.generalBedsTotal}</strong>
            </div>
            <div style="background: ${hosp.icuBedsAvail > 0 ? '#ecfdf5' : '#fff1f2'}; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">ICU Beds:</span> <strong style="color: ${hosp.icuBedsAvail > 0 ? '#059669' : '#e11d48'};">${hosp.icuBedsAvail}/${hosp.icuBedsTotal}</strong>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Ventilators:</span> <strong>${hosp.ventilatorsAvail}</strong>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">24x7 ER:</span> <strong>${hosp.is24x7Emergency ? 'Yes' : 'On-Call'}</strong>
            </div>
          </div>

          <!-- Google Maps Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <a 
              href="${googleMapsDirectionsUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #059669; color: #ffffff; padding: 7px 10px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.15);"
            >
              🧭 Navigate with Google Maps
            </a>
            
            <a 
              href="${googleMapsSearchUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 4px; background-color: #f1f5f9; color: #334155; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: 600;"
            >
              🗺️ View Landmark on Google Maps
            </a>
          </div>

        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('click', () => {
        if (onSelectHospital) {
          onSelectHospital(hosp.id);
        }
      });

      markersGroup.addLayer(marker);
    });

    // 3. RENDER AMBULANCES
    ambulances.forEach(amb => {
      const isAvailable = amb.status === 'AVAILABLE';
      const ambHtml = `
        <div style="
          background-color: ${isAvailable ? '#0284c7' : '#f59e0b'};
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          🚑
        </div>
      `;

      const ambIcon = L.divIcon({
        html: ambHtml,
        className: 'amb-pin',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const ambMarker = L.marker([amb.currentLat, amb.currentLng], { icon: ambIcon });
      ambMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="font-size: 13px; color: #0f172a;">${amb.vehicleNumber}</strong> (${amb.type})<br>
          Status: <strong style="color: ${isAvailable ? '#0284c7' : '#f59e0b'};">${amb.status}</strong><br>
          Driver: ${amb.driverName} (${amb.driverPhone})<br>
          Base: ${amb.hospitalName}
        </div>
      `);
      markersGroup.addLayer(ambMarker);
    });

    // 4. DRAW GOOGLE-MAPS STYLE REAL-WORLD ROAD ROUTE (via OSRM)
    if (targetHospital && !corridorRoute) {
      const isReroute = showReroutePath && rerouteDestination;
      const destination = isReroute ? rerouteDestination : targetHospital;

      // Real road geometry matching Google Maps via OSRM turn-by-turn routing
      const hasRoadCoords = !!(roadRouteData && roadRouteData.coordinates && roadRouteData.coordinates.length > 1);
      const routePoints: [number, number][] = hasRoadCoords
        ? roadRouteData!.coordinates
        : [
            [userLat, userLng],
            [(userLat + destination.lat) / 2 + 0.005, (userLng + destination.lng) / 2 - 0.003],
            [destination.lat, destination.lng]
          ];

      // Google Maps style: Outer contrast casing line for realistic street depth
      const shadowLine = L.polyline(routePoints, {
        color: isReroute ? '#7c2d12' : '#1e3a8a',
        weight: 8,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(shadowLine);

      // Main vibrant route polyline (Google Maps Navigation Blue #2563eb or Emergency Orange)
      const mainRouteLine = L.polyline(routePoints, {
        color: isReroute ? '#ea580c' : '#2563eb',
        weight: 5.5,
        opacity: 0.95,
        dashArray: isReroute ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const routeDist = roadRouteData ? roadRouteData.distanceKm : calculateHaversineKm(userLat, userLng, destination.lat, destination.lng);
      const routeEta = roadRouteData ? roadRouteData.durationMinutes : Math.max(1, Math.round(routeDist * 2));

      mainRouteLine.bindPopup(`
        <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; padding: 4px; min-width: 220px;">
          <div style="font-weight: 800; color: ${isReroute ? '#ea580c' : '#1d4ed8'}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>${isReroute ? '⚡ AI Diverted Trauma Route' : '🧭 Real-World Road Navigation (OSRM)'}</span>
          </div>
          <div style="color: #334155; font-size: 11px; line-height: 1.5; margin-bottom: 6px;">
            Destination: <b>${destination.name}</b><br>
            Driving Road Distance: <b style="color: #0f172a;">${routeDist} km</b> • ETA: <b style="color: #059669;">~${routeEta} min</b>
          </div>
          <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Accurately tracks street roads and turns like Google Maps
          </div>
        </div>
      `);
      routeGroup.addLayer(mainRouteLine);
    }

    // 5. Dedicated Traffic Corridor Route Polyline
    if (corridorRoute && corridorRoute.length > 1) {
      // Glow background line
      const corridorGlow = L.polyline(corridorRoute, {
        color: '#10b981',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(corridorGlow);

      // Foreground solid route
      const corridorLine = L.polyline(corridorRoute, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      corridorLine.bindPopup('<b>🚑 EMERGENCY AMBULANCE ROUTE</b><br>Designated green corridor to destination hospital.');
      routeGroup.addLayer(corridorLine);
    }

    // 6. Traffic Police Signals (if in corridor mode)
    trafficSignals.forEach(signal => {
      const isSelected = signal.id === selectedSignalId;
      const cleanName = signal.name.split(' - ')[0].split(' / ')[0].trim();

      const signalHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          cursor: pointer;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
          user-select: none;
        ">
          <!-- Main Signal Pill Badge with ID and Junction Name -->
          <div style="
            background: #0f172a;
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: 2px solid ${isSelected ? '#3b82f6' : '#ffffff'};
            white-space: nowrap;
            box-shadow: ${isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.4)' : 'none'};
          ">
            <span style="
              background: #3b82f6;
              color: #ffffff;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-weight: 900;
              font-size: 10px;
              padding: 1px 5px;
              border-radius: 4px;
              letter-spacing: 0.5px;
              line-height: 1.2;
            ">${signal.id}</span>
            <span style="
              font-size: 11px;
              font-weight: 700;
              color: #f8fafc;
              letter-spacing: -0.2px;
              line-height: 1.2;
            ">${cleanName}</span>
          </div>

          <!-- Pointer triangle indicating exact road coordinate -->
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #0f172a;
            margin-top: -1px;
          "></div>
        </div>
      `;

      const signalIcon = L.divIcon({
        html: signalHtml,
        className: 'signal-map-marker',
        iconSize: [160, 32],
        iconAnchor: [80, 32]
      });

      const marker = L.marker([signal.lat, signal.lng], { icon: signalIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${signal.id} • ${signal.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Junction Code: ${signal.junctionCode}</div>
          <div style="font-size: 12px; line-height: 1.5;">
            <div><strong>Ambulance ETA:</strong> <b>${signal.etaMinutes} mins</b></div>
            <div><strong>Remaining Distance:</strong> ${signal.distanceKm} km</div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectSignal) onSelectSignal(signal.id);
      });

      markersGroup.addLayer(marker);
    });

    // 7. Render Active Ambulance Location (Live Siren Marker)
    if (activeAmbulanceLocation) {
      const ambPulseHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: rgba(239, 68, 68, 0.4);
            animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
            border: 2px solid white;
            z-index: 10;
          ">
            🚑
          </div>
        </div>
      `;

      const ambPulseIcon = L.divIcon({
        html: ambPulseHtml,
        className: 'active-amb-live-siren',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const liveAmbMarker = L.marker([activeAmbulanceLocation.lat, activeAmbulanceLocation.lng], {
        icon: ambPulseIcon,
        zIndexOffset: 1000
      });

      liveAmbMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 170px;">
          <div style="font-weight: 800; font-size: 13px; color: #b91c1c;">🚨 LIVE AMBULANCE [${activeAmbulanceLocation.id}]</div>
          <div style="font-size: 12px; margin-top: 4px; line-height: 1.4;">
            <div><strong>Hospital ETA:</strong> ${activeAmbulanceLocation.etaMinutes} mins</div>
            <div><strong>Coordinates:</strong> ${activeAmbulanceLocation.lat.toFixed(4)}, ${activeAmbulanceLocation.lng.toFixed(4)}</div>
          </div>
        </div>
      `);

      markersGroup.addLayer(liveAmbMarker);
    }

    // 8. Render Destination Hospital Location
    if (destinationLocation) {
      const destHtml = `
        <div style="
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          border: 2px solid white;
        ">
          <span>🏥</span>
          <span>${destinationLocation.name}</span>
        </div>
      `;

      const destIcon = L.divIcon({
        html: destHtml,
        className: 'dest-hospital-pin',
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });

      const destMarker = L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon });
      destMarker.bindPopup(`<b>Destination Hospital</b><br>${destinationLocation.name}<br>Emergency Trauma Center`);
      markersGroup.addLayer(destMarker);
    }

    // Invalidate size
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [
    hospitals,
    ambulances,
    selectedHospitalId,
    effectiveUserCoords,
    nearestHospital,
    targetHospital,
    rerouteDestination,
    showReroutePath,
    onSelectHospital,
    userLocation,
    trafficSignals,
    selectedSignalId,
    onSelectSignal,
    corridorRoute,
    activeAmbulanceLocation,
    destinationLocation,
    roadRouteData
  ]);

  // Dedicated real-time moving ambulance layer update
  // Runs every second without disturbing user zoom, closing popups, or resetting camera
  useEffect(() => {
    const liveGroup = liveAmbLayerRef.current;
    if (!liveGroup) return;

    liveGroup.clearLayers();

    if (!liveAmbulance) return;

    const isApproaching = liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT';
    const headingDeg = liveAmbulance.heading || 0;

    const movingAmbHtml = `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <span style="
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(239, 68, 68, 0.45);
          animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
          z-index: 20;
          position: relative;
        ">
          🚑
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 15px;
            height: 15px;
            background: #ffffff;
            color: #b91c1c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transform: rotate(${headingDeg}deg);
            font-size: 9px;
            font-weight: 900;
          ">
            ▲
          </div>
        </div>
        <div style="
          position: absolute;
          bottom: -16px;
          background: #991b1b;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
          letter-spacing: 0.5px;
        ">
          ${liveAmbulance.vehicleNumber} • ${liveAmbulance.speedKmH} km/h
        </div>
      </div>
    `;

    const movingAmbIcon = L.divIcon({
      html: movingAmbHtml,
      className: 'live-moving-amb-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const movingAmbMarker = L.marker([liveAmbulance.lat, liveAmbulance.lng], {
      icon: movingAmbIcon,
      zIndexOffset: 1200
    });

    movingAmbMarker.bindPopup(`
      <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 230px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px;">
          <strong style="color: #b91c1c; font-size: 13px;">🚨 Live Moving Ambulance</strong>
          <span style="background: #fee2e2; color: #991b1b; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">${liveAmbulance.vehicleNumber}</span>
        </div>
        <div style="font-size: 11px; color: #334155; margin-bottom: 6px; line-height: 1.4;">
          Driver: <b>${liveAmbulance.driverName}</b> (${liveAmbulance.driverPhone})<br>
          Current Speed: <b>${liveAmbulance.speedKmH} km/h</b> • Status: <b style="color: #ea580c;">${isApproaching ? 'EN ROUTE TO PATIENT' : 'TRANSPORTING TO APEX'}</b>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; display: flex; flex-direction: column; gap: 3px;">
          <div>📍 <b>Pickup Distance:</b> <span style="color: #ea580c; font-weight: 800;">${liveAmbulance.distanceToPatientKm} km</span> (~${liveAmbulance.etaToPatientMinutes} mins)</div>
          <div>🏥 <b>Hospital Distance:</b> <span style="color: #059669; font-weight: 800;">${liveAmbulance.distancePatientToHospitalKm} km</span> (~${liveAmbulance.etaToHospitalMinutes} mins)</div>
        </div>
      </div>
    `);
    liveGroup.addLayer(movingAmbMarker);

    // Render Live Ambulance Transit Polyline along real streets
    const ambRoutePoints: [number, number][] = (liveAmbulance.roadRouteCoordinates && liveAmbulance.roadRouteCoordinates.length > 1)
      ? liveAmbulance.roadRouteCoordinates
      : [
          [liveAmbulance.originLat, liveAmbulance.originLng],
          [liveAmbulance.pickupLat, liveAmbulance.pickupLng],
          [liveAmbulance.hospLat, liveAmbulance.hospLng]
        ];

    // Casing line for contrast
    const ambShadowLine = L.polyline(ambRoutePoints, {
      color: '#7f1d1d',
      weight: 7,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    });
    liveGroup.addLayer(ambShadowLine);

    const ambRouteLine = L.polyline(ambRoutePoints, {
      color: isApproaching ? '#ef4444' : '#10b981',
      weight: 4.5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    });
    liveGroup.addLayer(ambRouteLine);

    // =========================================================================
    // MIDWAY AMBULANCE HANDOVER / MEET-ME EMERGENCY MODE OVERLAYS
    // =========================================================================
    if (activeHandover && activeDispatch?.transportMode === 'MEET_HALFWAY') {
      const isArrived = activeHandover.status === 'ARRIVED_AT_MEETING_POINT';
      const isApproachingMeeting = activeHandover.status === 'APPROACHING_MEETING_POINT';

      // 1. Suggested Handover Landmark Meeting Point Marker
      const meetingHtml = `
        <div style="position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
          <span style="
            position: absolute;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background-color: ${isArrived ? 'rgba(16, 185, 129, 0.65)' : 'rgba(245, 158, 11, 0.45)'};
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
          <div style="
            position: relative;
            z-index: 10;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #059669, #047857);
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(4, 120, 87, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #ffffff;
          ">
            🤝
          </div>
          <div style="
            position: absolute;
            bottom: -18px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: #064e3b;
            color: #ecfdf5;
            font-size: 9px;
            font-weight: 800;
            padding: 1.5px 7px;
            border-radius: 6px;
            border: 1px solid #10b981;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            letter-spacing: 0.5px;
          ">
            ${isArrived ? 'MEETING POINT (ARRIVED)' : 'HANDOVER POINT'}
          </div>
        </div>
      `;
      const meetingIcon = L.divIcon({ html: meetingHtml, className: 'meeting-point-icon', iconSize: [52, 52], iconAnchor: [26, 26] });
      const meetingMarker = L.marker([activeHandover.meetingLat, activeHandover.meetingLng], { icon: meetingIcon, zIndexOffset: 1300 });
      meetingMarker.bindPopup(`
        <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 250px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px;">
            <strong style="color: #047857; font-size: 13px;">🤝 Suggested Ambulance Handover Point</strong>
            <span style="background: #d1fae5; color: #065f46; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">SAFE LANDMARK</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
            ${activeHandover.landmark.name}
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 6px;">
            📍 ${activeHandover.landmark.address}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 3px;">
            <div>🚗 <b>Your Vehicle:</b> <span style="color: #d97706; font-weight: 800;">${activeHandover.caretakerDistanceKm} km</span> (~${activeHandover.caretakerEtaMinutes} mins)</div>
            <div>🚑 <b>108 Ambulance:</b> <span style="color: #059669; font-weight: 800;">${activeHandover.ambulanceDistanceKm} km</span> (~${activeHandover.ambulanceEtaMinutes} mins)</div>
            <div style="color: #059669; font-weight: 800; margin-top: 2px;">⚡ Time Saved: ~${activeHandover.timeSavedMinutes} minutes</div>
          </div>
          <div style="font-size: 9px; color: #64748b; font-style: italic;">
            ⚠️ Suggested handover point. Final meeting spot may be adjusted by emergency paramedic.
          </div>
        </div>
      `);
      liveGroup.addLayer(meetingMarker);

      // 2. Caretaker Moving Vehicle Marker
      if (caretakerTelemetry && activeHandover.status !== 'HANDOVER_COMPLETED') {
        const caretakerHtml = `
          <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
            <span style="
              position: absolute;
              width: 46px;
              height: 46px;
              border-radius: 50%;
              background-color: rgba(245, 158, 11, 0.4);
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              position: relative;
              z-index: 10;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: linear-gradient(135deg, #d97706, #b45309);
              border: 2.5px solid #ffffff;
              box-shadow: 0 4px 10px rgba(180, 83, 9, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #ffffff;
            ">
              🛵
            </div>
            <div style="
              position: absolute;
              bottom: -16px;
              left: 50%;
              transform: translateX(-50%);
              white-space: nowrap;
              background: #78350f;
              color: #fef3c7;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 6px;
              border-radius: 6px;
              border: 1px solid #f59e0b;
              box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            ">
              YOU • ${caretakerTelemetry.speedKmH} km/h
            </div>
          </div>
        `;
        const caretakerIcon = L.divIcon({ html: caretakerHtml, className: 'caretaker-vehicle-icon', iconSize: [46, 46], iconAnchor: [23, 23] });
        const caretakerMarker = L.marker([caretakerTelemetry.lat, caretakerTelemetry.lng], { icon: caretakerIcon, zIndexOffset: 1250 });
        caretakerMarker.bindPopup(`
          <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 220px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #b45309; font-size: 13px;">🚗 Your Vehicle (En Route)</strong>
              <span style="background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">${caretakerTelemetry.vehicleType}</span>
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">
              Current Speed: <b>${caretakerTelemetry.speedKmH} km/h</b> • GPS Accuracy: ±${caretakerTelemetry.accuracyMeters}m
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px; font-size: 11px;">
              <div>🤝 <b>To Meeting Point:</b> <span style="color: #b45309; font-weight: 800;">${caretakerTelemetry.distanceToMeetingKm} km</span> (~${caretakerTelemetry.etaToMeetingMinutes} mins)</div>
            </div>
          </div>
        `);
        liveGroup.addLayer(caretakerMarker);
      }

      // 3. Render Caretaker Approach Polyline (Amber)
      if (activeHandover.caretakerRouteCoordinates && activeHandover.caretakerRouteCoordinates.length > 1) {
        const caretakerRouteLine = L.polyline(activeHandover.caretakerRouteCoordinates, {
          color: '#d97706',
          weight: 4,
          opacity: 0.9,
          dashArray: '6, 6',
          lineCap: 'round',
          lineJoin: 'round'
        });
        liveGroup.addLayer(caretakerRouteLine);
      }

      // 4. Render Onward Hospital Transit Route (Blue)
      if (activeHandover.hospitalRouteCoordinates && activeHandover.hospitalRouteCoordinates.length > 1) {
        const hospitalTransitLine = L.polyline(activeHandover.hospitalRouteCoordinates, {
          color: '#2563eb',
          weight: 3.5,
          opacity: 0.7,
          dashArray: '4, 8',
          lineCap: 'round',
          lineJoin: 'round'
        });
        liveGroup.addLayer(hospitalTransitLine);
      }
    }

    // =========================================================================
    // DYNAMIC EN-ROUTE EMERGENCY STABILIZATION OVERLAYS (OPTION C)
    // =========================================================================
    if (stabilizationSession && (activeTransportStrategy === 'OPTION_C_EN_ROUTE_STABILIZATION' || stabilizationSession.stabilizationStatus !== 'NOT_ACTIVATED')) {
      const candidate = stabilizationSession.selectedCandidate || stabilizationSession.candidateFacilities[0];
      if (candidate) {
        const hosp = candidate.hospital;
        const isDocked = stabilizationSession.stabilizationStatus === 'PATIENT_ARRIVED_STABILIZATION';

        // 1. Supporting Hospital Distinct Teal Marker with Badge
        const supportingHtml = `
          <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
            <span style="
              position: absolute;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background-color: ${isDocked ? 'rgba(245, 158, 11, 0.5)' : 'rgba(13, 148, 136, 0.45)'};
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              position: relative;
              z-index: 10;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: linear-gradient(135deg, #0d9488, #047857);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(13, 148, 136, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              color: #ffffff;
            ">
              🏥
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              left: 50%;
              transform: translateX(-50%);
              white-space: nowrap;
              background: #134e4a;
              color: #ccfbf1;
              font-size: 8.5px;
              font-weight: 800;
              padding: 1.5px 7px;
              border-radius: 6px;
              border: 1px solid #14b8a6;
              box-shadow: 0 2px 4px rgba(0,0,0,0.4);
              letter-spacing: 0.5px;
            ">
              ${isDocked ? 'STABILIZATION IN PROGRESS' : 'INTERIM STABILIZATION BAY'}
            </div>
          </div>
        `;
        const supportingIcon = L.divIcon({ html: supportingHtml, className: 'supporting-hospital-marker', iconSize: [50, 50], iconAnchor: [25, 25] });
        const supportingMarker = L.marker([hosp.lat, hosp.lng], { icon: supportingIcon, zIndexOffset: 1280 });
        supportingMarker.bindPopup(`
          <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 250px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px;">
              <strong style="color: #0d9488; font-size: 13px;">🏥 ${hosp.name}</strong>
              <span style="background: #ccfbf1; color: #115e59; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">EN-ROUTE BAY</span>
            </div>
            <div style="font-size: 10px; color: #475569; margin-bottom: 6px;">
              📍 ${hosp.address}
            </div>
            <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 6px; font-size: 11px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 3px;">
              <div>⚡ <b>Route Proximity:</b> <span style="color: #0d9488; font-weight: 800;">${candidate.distanceFromRouteMeters}m off highway</span></div>
              <div>⏱️ <b>Detour Cost:</b> <span style="color: #047857; font-weight: 800;">+${candidate.detourTimeMinutes} mins</span> (+${candidate.detourDistanceKm} km)</div>
              <div>🚨 <b>Status:</b> <span style="color: #0f766e; font-weight: 800;">${candidate.availabilityStatus}</span></div>
            </div>
            <div style="font-size: 10px; color: #047857; font-weight: 600;">
              ✓ Active Bleeding Control • Vitals Normalization • O2 Support
            </div>
          </div>
        `);
        liveGroup.addLayer(supportingMarker);

        // 2. 500m Route Proximity Perimeter Circle (Teal Dashed Circle)
        const proximityCircle = L.circle([hosp.lat, hosp.lng], {
          radius: 500,
          color: '#0d9488',
          weight: 2,
          dashArray: '5, 5',
          fillColor: '#14b8a6',
          fillOpacity: 0.12
        });
        liveGroup.addLayer(proximityCircle);

        // 3. Interim Detour Polyline (Teal)
        const ambCurrentLat = liveAmbulance ? liveAmbulance.lat : 28.7180;
        const ambCurrentLng = liveAmbulance ? liveAmbulance.lng : 77.0980;
        const detourLine = L.polyline([
          [ambCurrentLat, ambCurrentLng],
          [hosp.lat, hosp.lng]
        ], {
          color: '#0d9488',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '4, 6',
          lineCap: 'round',
          lineJoin: 'round'
        });
        liveGroup.addLayer(detourLine);
      }
    }
  }, [liveAmbulance, activeHandover, caretakerTelemetry, activeDispatch?.transportMode, hospitals, stabilizationSession, activeTransportStrategy]);

  return (
    <div className="w-full space-y-2.5">
      {/* Dedicated Location & Road Navigation Summary Bar (Positioned outside map so entire map canvas is 100% visible) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Current GPS Area & Facility Count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 truncate">
                {contextUserLocation?.areaName ? `Near ${contextUserLocation.areaName}` : (userLocation ? 'GPS Position Active' : 'Current Location')}
              </span>
              {hospitals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 text-slate-700">
                  {hospitals.length} {hospitals.length === 1 ? 'Hospital' : 'Hospitals'} in Range
                </span>
              )}
            </div>
            {nearestHospital && (
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                Nearest: <b className="text-emerald-700">{nearestHospital.name}</b> ({calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, nearestHospital.lat, nearestHospital.lng)} km)
              </span>
            )}
          </div>
        </div>

        {/* Right: Driving Road Navigation Details (when road route is active) */}
        {roadRouteData && targetHospital && !corridorRoute && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-slate-800 shadow-xs">
            <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="text-[11px] font-medium leading-tight">
              <div>Road Route to <b className="text-slate-900">{targetHospital.name}</b></div>
              <div className="text-blue-700 font-semibold">
                Driving: <b className="text-blue-950 font-mono">{roadRouteData.distanceKm} km</b> • ETA: <b className="text-emerald-700 font-mono">~{roadRouteData.durationMinutes} mins</b> (turn-by-turn road navigation)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Error alert (if any) */}
      {locationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Clean, Unobstructed Map Container */}
      <div className="relative isolate z-0 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
        
        {/* Map Container */}
        <div ref={mapContainerRef} className="relative isolate z-0 w-full h-full" />

      {/* TOP FLOATING CONTROLS BAR: OpenStreetMap Controls + Focus Route + Locate Me */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        
        {/* Open in OpenStreetMap Button */}
        <a
          href={`https://www.openstreetmap.org/?mlat=${effectiveUserCoords.lat}&mlon=${effectiveUserCoords.lng}#map=14/${effectiveUserCoords.lat}/${effectiveUserCoords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm"
          title="Open in OpenStreetMap"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">OpenStreetMap View</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Fit All Hospitals Button */}
        {hospitals.length > 1 && (
          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              const allPoints: [number, number][] = [
                [effectiveUserCoords.lat, effectiveUserCoords.lng],
                ...hospitals.map(h => [h.lat, h.lng] as [number, number])
              ];
              map.flyToBounds(L.latLngBounds(allPoints), {
                padding: [50, 50],
                maxZoom: 13.5,
                duration: 1.0
              });
            }}
            className="px-3 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
            title="Fit all nearby hospitals on map"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">All ({hospitals.length})</span>
          </button>
        )}

        {/* Focus Active Trip Route Button (Google Maps Style) */}
        {showRouteLine && (
          <button
            type="button"
            onClick={() => focusActiveRoute(true)}
            className="px-3 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
            title="Auto-zoom and frame active route (You ➔ Ambulance ➔ Hospital)"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Focus Route</span>
          </button>
        )}

        {/* Locate My GPS Button */}
        <button
          type="button"
          onClick={() => detectUserLocation(true)}
          disabled={isLocating}
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer disabled:opacity-60"
          title="Center on my current GPS location"
        >
          <Locate className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] font-bold hidden md:inline">
            {isLocating ? 'Locating...' : 'My Location'}
          </span>
        </button>

      </div>

      {/* MODERN ZOOM IN / OUT CONTROLS (Vertical stack on right side, safely positioned away from bottom tracker card) */}
      <div className="absolute top-16 right-3 z-30 flex flex-col items-center bg-white/95 hover:bg-white backdrop-blur-sm rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn(1)}
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-5 h-[1px] bg-slate-200" />
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut(1)}
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex flex-wrap items-center gap-3 z-30 hidden sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-700 font-medium">My Location</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
            <span className="text-slate-700 font-medium">Primary / CHC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-600 inline-block"></span>
            <span className="text-slate-700 font-medium">Apex Trauma</span>
          </div>
          {ambulances.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block animate-pulse"></span>
              <span className="text-slate-700 font-medium">Live Ambulance</span>
            </div>
          )}
          {stabilizationSession && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600 inline-block border border-teal-300"></span>
              <span className="text-teal-900 font-bold">En-Route Stabilization Bay (500m)</span>
            </div>
          )}
          {trafficSignals.length > 0 && (
            <>
              <div className="flex items-center gap-1 font-semibold text-slate-800">
                <span className="text-xs">🚦</span>
                <span>Signals ({trafficSignals.length})</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-3 h-1 bg-emerald-500 rounded inline-block"></span>
                <span>Emergency Route</span>
              </div>
            </>
          )}
          {showReroutePath && (
            <div className="flex items-center gap-1 font-bold text-orange-600">
              <span className="w-3 h-1 bg-orange-500 inline-block"></span>
              <span>AI Dynamic Reroute</span>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
};
