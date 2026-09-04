import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hospital, Ambulance, TrafficSignal } from '../types';

interface LeafletMapProps {
  hospitals?: Hospital[];
  ambulances?: Ambulance[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospitalId: string) => void;
  pickupLocation?: { lat: number; lng: number; label: string };
  rerouteDestination?: Hospital | null;
  height?: string;
  showReroutePath?: boolean;

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

export const LeafletMap: React.FC<LeafletMapProps> = ({
  hospitals = [],
  ambulances = [],
  selectedHospitalId,
  onSelectHospital,
  pickupLocation,
  rerouteDestination,
  height = '400px',
  showReroutePath = false,
  trafficSignals = [],
  selectedSignalId,
  onSelectSignal,
  corridorRoute,
  activeAmbulanceLocation,
  destinationLocation,
  showLegend = true,
  showRouteLine = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on Haryana / Rural Delhi NCR corridor
      const map = L.map(mapContainerRef.current, {
        center: [28.7500, 77.0700],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | MedCatalyst',
        maxZoom: 18
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      polylineGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const polylineGroup = polylineGroupRef.current;

    if (!map || !markersGroup || !polylineGroup) return;

    markersGroup.clearLayers();
    polylineGroup.clearLayers();

    // 1. Render Hospitals (Clean, static marker - Zero Blinking)
    hospitals.forEach(hosp => {
      const isSelected = hosp.id === selectedHospitalId;
      const isRerouteTarget = rerouteDestination?.id === hosp.id;

      const bgColor = isRerouteTarget 
        ? '#ea580c' // Orange for reroute
        : (isSelected ? '#0284c7' : (hosp.type === 'Apex Multi-Specialty' ? '#2563eb' : '#059669'));

      const markerHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
          user-select: none;
        ">
          <div style="
            background-color: ${bgColor};
            color: white;
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid ${isSelected ? '#fbbf24' : '#ffffff'};
            white-space: nowrap;
            box-shadow: ${isSelected ? '0 0 0 3px rgba(251, 191, 36, 0.4)' : 'none'};
          ">
            <span>🏥</span>
            <span>${hosp.name.split(' (')[0]}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 5px solid ${bgColor};
            margin-top: -1px;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'hospital-map-marker',
        iconSize: [160, 32],
        iconAnchor: [80, 32]
      });

      const marker = L.marker([hosp.lat, hosp.lng], { icon });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 4px; font-weight: bold; color: #1e293b; font-size: 14px;">${hosp.name}</h4>
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">${hosp.type}</p>
          <div style="font-size: 12px; line-height: 1.4;">
            <div><strong>General Beds:</strong> ${hosp.generalBedsAvail}/${hosp.generalBedsTotal}</div>
            <div><strong>ICU Beds:</strong> ${hosp.icuBedsAvail}/${hosp.icuBedsTotal}</div>
            <div><strong>Ventilators:</strong> ${hosp.ventilatorsAvail}</div>
            <div><strong>ETA:</strong> ${hosp.etaMinutes} mins (${hosp.distanceKm} km)</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectHospital) onSelectHospital(hosp.id);
      });

      markersGroup.addLayer(marker);
    });

    // 2. Render Current Location Pointer (No Blinking - Clean Pointer)
    if (pickupLocation) {
      const pickupHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
          user-select: none;
        ">
          <div style="
            background: #dc2626;
            color: #ffffff;
            padding: 3px 9px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>📍</span>
            <span>Your Current Location</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid #dc2626;
            margin-top: -1px;
          "></div>
        </div>
      `;

      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: 'current-location-marker',
        iconSize: [160, 32],
        iconAnchor: [80, 32]
      });

      const pickupMarker = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon, zIndexOffset: 1000 });
      pickupMarker.bindPopup(`<b>📍 Your Current Location:</b><br>${pickupLocation.label}`);
      markersGroup.addLayer(pickupMarker);
    }

    // 3. Render Ambulances
    ambulances.forEach(amb => {
      const ambHtml = `
        <div style="
          background-color: #0284c7;
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
        <b>${amb.vehicleNumber}</b> (${amb.type})<br>
        Status: <b>${amb.status}</b><br>
        Driver: ${amb.driverName}
      `);
      markersGroup.addLayer(ambMarker);
    });

    // 4. Render Dynamic Reroute Polyline
    if (pickupLocation) {
      const primaryHosp = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

      if (showReroutePath && rerouteDestination) {
        // Red / Orange dashed line to the new Apex Multi-Specialty hospital
        const rerouteCoords: [number, number][] = [
          [pickupLocation.lat, pickupLocation.lng],
          [28.7600, 77.0600], // intermediate road waypoint
          [rerouteDestination.lat, rerouteDestination.lng]
        ];

        const rerouteLine = L.polyline(rerouteCoords, {
          color: '#f97316',
          weight: 5,
          dashArray: '8, 8',
          opacity: 0.9
        });
        rerouteLine.bindPopup(`<b>⚡ MEDCATALYST REROUTE CORRIDOR</b><br>Diverting to ${rerouteDestination.name} (+12 mins) for specialized Cath Lab & Neuro-ICU care.`);
        polylineGroup.addLayer(rerouteLine);

        // Grayed out old initial route to show it was abandoned
        const oldCoords: [number, number][] = [
          [pickupLocation.lat, pickupLocation.lng],
          [primaryHosp.lat, primaryHosp.lng]
        ];
        const oldLine = L.polyline(oldCoords, {
          color: '#94a3b8',
          weight: 3,
          dashArray: '4, 6',
          opacity: 0.5
        });
        polylineGroup.addLayer(oldLine);

      } else if (showRouteLine) {
        // Normal green active route to primary hospital
        const normalCoords: [number, number][] = [
          [pickupLocation.lat, pickupLocation.lng],
          [primaryHosp.lat, primaryHosp.lng]
        ];
        const normalLine = L.polyline(normalCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.8
        });
        polylineGroup.addLayer(normalLine);
      }
    }

    // Auto-fit bounds to include current location and hospitals when not in dedicated corridor mode
    if (!corridorRoute && hospitals.length > 0) {
      const allPoints: [number, number][] = hospitals.map(h => [h.lat, h.lng]);
      if (pickupLocation) {
        allPoints.push([pickupLocation.lat, pickupLocation.lng]);
      }
      try {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [45, 45], maxZoom: 13 });
      } catch (e) {
        // Safe fallback
      }
    }

    // 5. Render Dedicated Traffic Corridor Route Polyline
    if (corridorRoute && corridorRoute.length > 1) {
      // Glow background line
      const corridorGlow = L.polyline(corridorRoute, {
        color: '#10b981',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });
      polylineGroup.addLayer(corridorGlow);

      // Foreground solid route
      const corridorLine = L.polyline(corridorRoute, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      corridorLine.bindPopup('<b>🚑 EMERGENCY AMBULANCE ROUTE</b><br>Designated route to destination hospital.');
      polylineGroup.addLayer(corridorLine);

      // Fit map bounds to the corridor
      map.fitBounds(L.latLngBounds(corridorRoute), { padding: [35, 35] });
    }

    // 6. Render Traffic Signals (Clear Location Marker with ID & Junction Name)
    trafficSignals.forEach(signal => {
      const isSelected = signal.id === selectedSignalId;
      // Get clear junction display name (e.g. 'MG Road' from 'MG Road - Brigade Junction')
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

    // Invalidate size to ensure proper rendering inside dynamic containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [
    hospitals, 
    ambulances, 
    selectedHospitalId, 
    pickupLocation, 
    rerouteDestination, 
    showReroutePath, 
    onSelectHospital,
    trafficSignals,
    selectedSignalId,
    onSelectSignal,
    corridorRoute,
    activeAmbulanceLocation,
    destinationLocation
  ]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs flex flex-wrap items-center gap-3 z-[1000]">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span className="text-slate-700">Primary / CHC</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-700">Apex Multi-Specialty</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
            <span className="text-slate-700">Ambulance</span>
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
              <span>AI Dynamic Reroute Path</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
