import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Hospital, Ambulance, TrafficSignal } from '../types';
import { Navigation, Locate, ExternalLink, MapPin, Compass, AlertCircle, Phone, Activity, Zap, ChevronUp, ChevronDown, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  const { userLocation: contextUserLocation, relocateToUserLocation, liveAmbulance } = useApp();
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);

  // User's detected real-time GPS location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(() => {
    return contextUserLocation ? { lat: contextUserLocation.lat, lng: contextUserLocation.lng } : null;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState<boolean>(false);

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

        if (mapInstanceRef.current && (forcePan || !hasCenteredOnUser)) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, {
            duration: 1.5
          });
          setHasCenteredOnUser(true);
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
  }, [hasCenteredOnUser, relocateToUserLocation]);

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

  // Determine current active anchor position for distance calculations
  const effectiveUserCoords = userLocation || (contextUserLocation ? { lat: contextUserLocation.lat, lng: contextUserLocation.lng } : null) || pickupLocation || { lat: 28.7080, lng: 77.0980 };

  // Calculate nearest hospital from user's current GPS position
  const nearestHospital = hospitals.reduce((closest, curr) => {
    const dist = calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, curr.lat, curr.lng);
    const closestDist = closest ? calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, closest.lat, closest.lng) : Infinity;
    return dist < closestDist ? curr : closest;
  }, hospitals[0]);

  // Target hospital for navigation route (either selected, or nearest)
  const targetHospital = hospitals.find(h => h.id === selectedHospitalId) || nearestHospital;

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : (pickupLocation ? [pickupLocation.lat, pickupLocation.lng] : [28.7180, 77.0900]);

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        scrollWheelZoom: true
      });

      // Google Maps style clean OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Google Maps Navigation Ready',
        maxZoom: 19
      }).addTo(map);

      // Add zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      userMarkerGroupRef.current = L.layerGroup().addTo(map);
      routeGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size on container changes
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [userLocation]);

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

    // 3.5. RENDER LIVE MOVING AMBULANCE (Uber/Rapido style real-time moving marker)
    if (liveAmbulance) {
      const isApproaching = liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT';
      const movingAmbHtml = `
        <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
          <span style="
            position: absolute;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background-color: rgba(239, 68, 68, 0.45);
            animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            color: white;
            z-index: 20;
          ">
            🚑
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
        iconSize: [46, 46],
        iconAnchor: [23, 23]
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
      markersGroup.addLayer(movingAmbMarker);

      // Render Live Ambulance Transit Polyline
      const ambRoutePoints: [number, number][] = [
        [liveAmbulance.originLat, liveAmbulance.originLng],
        [liveAmbulance.pickupLat, liveAmbulance.pickupLng],
        [liveAmbulance.hospLat, liveAmbulance.hospLng]
      ];

      const ambRouteLine = L.polyline(ambRoutePoints, {
        color: '#ef4444',
        weight: 3.5,
        opacity: 0.7,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(ambRouteLine);
    }

    // 4. DRAW GOOGLE-MAPS STYLE CONNECTING NAVIGATION ROUTE (if normal mode)
    if (targetHospital && !corridorRoute) {
      const isReroute = showReroutePath && rerouteDestination;
      const destination = isReroute ? rerouteDestination : targetHospital;

      // Simulated realistic street waypoints between GPS user and target hospital
      const midLat = (userLat + destination.lat) / 2 + 0.005;
      const midLng = (userLng + destination.lng) / 2 - 0.003;

      const routePoints: [number, number][] = [
        [userLat, userLng],
        [midLat, midLng],
        [destination.lat, destination.lng]
      ];

      // Outer shadow line for depth
      const shadowLine = L.polyline(routePoints, {
        color: '#0f172a',
        weight: 7,
        opacity: 0.15
      });
      routeGroup.addLayer(shadowLine);

      // Main vibrant route polyline
      const mainRouteLine = L.polyline(routePoints, {
        color: isReroute ? '#f97316' : '#10b981',
        weight: 5,
        opacity: 0.85,
        dashArray: isReroute ? '8, 8' : undefined
      });

      mainRouteLine.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <strong>${isReroute ? '⚡ AI Diverted Trauma Route' : '🧭 Direct Route to ' + destination.name}</strong><br>
          Distance: ~${calculateHaversineKm(userLat, userLng, destination.lat, destination.lng)} km
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

      // Fit map bounds to the corridor
      map.fitBounds(L.latLngBounds(corridorRoute), { padding: [35, 35] });
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

    // Auto-fit bounds to user's location and nearby local hospitals
    if (!corridorRoute && hospitals.length > 0) {
      const allPoints: [number, number][] = hospitals.map(h => [h.lat, h.lng]);
      allPoints.push([userLat, userLng]);
      try {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 14 });
      } catch (e) {}
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
    liveAmbulance
  ]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP FLOATING CONTROLS BAR: Google Maps Help + Locate Me */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        
        {/* Open in Google Maps Button */}
        <a
          href={`https://www.google.com/maps/search/hospitals/@${effectiveUserCoords.lat},${effectiveUserCoords.lng},13z`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm"
          title="Open surrounding area in Google Maps"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Google Maps View</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Locate My GPS Button */}
        <button
          type="button"
          onClick={() => detectUserLocation(true)}
          disabled={isLocating}
          className={`p-2 bg-white/95 hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer ${
            isLocating ? 'text-blue-600 animate-spin' : 'hover:text-blue-600'
          }`}
          title="Center on my current GPS location"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
          <span className="text-[11px] font-bold hidden md:inline">
            {isLocating ? 'Locating...' : 'My Location'}
          </span>
        </button>

      </div>

      {/* TOP LEFT: Real-time User Location & Nearest Hospital Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs max-w-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0"></span>
          <div className="truncate">
            <span className="font-extrabold text-slate-900 block truncate">
              {contextUserLocation?.areaName ? `📍 Near ${contextUserLocation.areaName}` : (userLocation ? '📍 GPS Position Active' : '📍 Current Location')}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block truncate">
              Nearest: {nearestHospital?.name} ({calculateHaversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, nearestHospital.lat, nearestHospital.lng)} km)
            </span>
          </div>
        </div>
      </div>

      {/* Location Error Toast (if any) */}
      {locationError && (
        <div className="absolute top-16 left-3 z-[1000] bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>{locationError}</span>
        </div>
      )}

      {/* UBER / RAPIDO STYLE LIVE MOVING AMBULANCE HUD OVERLAY */}
      {showRideHUD && liveAmbulance && (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-[1000] w-full max-w-[340px] sm:max-w-[380px] px-2 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 pointer-events-auto transition-all">
            
            {/* Header / Banner */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-white tracking-wide">LIVE AMBULANCE TRACKER</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-950 text-red-300 border border-red-700/60 font-mono">
                      {liveAmbulance.vehicleNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' ? '⚡ Phase 1: Approaching Patient Pickup' : '🚨 Phase 2: Rapid Transit to Apex Hospital'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isHudCollapsed ? 'Expand Tracker' : 'Collapse Tracker'}
              >
                {isHudCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {!isHudCollapsed ? (
              <>
                {/* 2 Distance & ETA Metric Cards (Uber / Rapido Style Live Countdowns) */}
                <div className="grid grid-cols-2 gap-2 my-2.5">
                  {/* Distance to Patient Pickup */}
                  <div className={`p-2.5 rounded-xl border transition ${liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' ? 'bg-amber-950/40 border-amber-600/70 shadow-sm shadow-amber-950/50' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-0.5">
                      <span>📍 TO PICKUP</span>
                      <span className="text-[9px] bg-amber-900/70 px-1.5 py-0.5 rounded-full text-amber-200 font-mono">~{liveAmbulance.etaToPatientMinutes}m ETA</span>
                    </div>
                    <div className="flex items-baseline gap-1 my-0.5">
                      <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">{liveAmbulance.distanceToPatientKm}</span>
                      <span className="text-xs font-bold text-amber-300">km</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 truncate block">
                      {liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' ? 'Ambulance is arriving' : 'Patient Picked Up ✓'}
                    </span>
                  </div>

                  {/* Distance from Patient to Destination Hospital */}
                  <div className={`p-2.5 rounded-xl border transition ${liveAmbulance.phase === 'TRANSPORTING_TO_HOSPITAL' ? 'bg-emerald-950/40 border-emerald-600/70 shadow-sm shadow-emerald-950/50' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold mb-0.5">
                      <span>🏥 TO HOSPITAL</span>
                      <span className="text-[9px] bg-emerald-900/70 px-1.5 py-0.5 rounded-full text-emerald-200 font-mono">~{liveAmbulance.etaToHospitalMinutes}m ETA</span>
                    </div>
                    <div className="flex items-baseline gap-1 my-0.5">
                      <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono">{liveAmbulance.distancePatientToHospitalKm}</span>
                      <span className="text-xs font-bold text-emerald-300">km</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 truncate block">
                      Apex Trauma Center
                    </span>
                  </div>
                </div>

                {/* Linear Route Progress Indicator */}
                <div className="mb-2 px-0.5">
                  <div className="flex justify-between text-[9.5px] text-slate-400 font-bold mb-1">
                    <span>Depot</span>
                    <span className={liveAmbulance.progress >= 0.45 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {liveAmbulance.progress < 0.45 ? '● Approaching Patient' : '● In Transit to Apex ER'}
                    </span>
                    <span>Hospital</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 transition-all duration-700 ease-linear rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, Math.round(liveAmbulance.progress * 100)))}%` }}
                    />
                  </div>
                </div>

                {/* Driver Card & Telemetry Strip */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-200 shrink-0">
                      JK
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 truncate">{liveAmbulance.driverName}</span>
                        <span className="text-[10px] text-amber-400 font-semibold shrink-0">★ 4.9</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        Speed: <b className="text-slate-200 font-mono">{liveAmbulance.speedKmH} km/h</b>
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${liveAmbulance.driverPhone}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="pt-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold text-[11px]">
                  Pickup: <b className="text-amber-400">{liveAmbulance.distanceToPatientKm}km</b> (~{liveAmbulance.etaToPatientMinutes}m) • Hosp: <b className="text-emerald-400">{liveAmbulance.distancePatientToHospitalKm}km</b>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{liveAmbulance.speedKmH} km/h</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex flex-wrap items-center gap-3 z-[1000] max-w-[calc(100%-360px)] hidden sm:flex">
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
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block animate-pulse"></span>
            <span className="text-slate-700 font-medium">Live Ambulance</span>
          </div>
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
  );
};
