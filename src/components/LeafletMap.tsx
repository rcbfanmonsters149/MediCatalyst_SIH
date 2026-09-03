import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hospital, Ambulance } from '../types';

interface LeafletMapProps {
  hospitals: Hospital[];
  ambulances?: Ambulance[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospitalId: string) => void;
  pickupLocation?: { lat: number; lng: number; label: string };
  rerouteDestination?: Hospital | null;
  height?: string;
  showReroutePath?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  hospitals,
  ambulances = [],
  selectedHospitalId,
  onSelectHospital,
  pickupLocation,
  rerouteDestination,
  height = '400px',
  showReroutePath = false
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

    // 1. Render Hospitals
    hospitals.forEach(hosp => {
      const isSelected = hosp.id === selectedHospitalId;
      const isRerouteTarget = rerouteDestination?.id === hosp.id;

      const bgColor = isRerouteTarget 
        ? '#ea580c' // Orange for reroute
        : (isSelected ? '#dc2626' : (hosp.type === 'Apex Multi-Specialty' ? '#2563eb' : '#059669'));

      const markerHtml = `
        <div style="
          background-color: ${bgColor};
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
          ${isSelected || isRerouteTarget ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
        ">
          🏥
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-hosp-pin',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
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

    // 2. Render Patient Pickup if present
    if (pickupLocation) {
      const pickupHtml = `
        <div style="
          background-color: #ef4444;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
          border: 3px solid white;
        ">
          📍
        </div>
      `;

      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: 'pickup-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const pickupMarker = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon });
      pickupMarker.bindPopup(`<b>Emergency Pickup Location:</b><br>${pickupLocation.label}`);
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

      } else {
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

    // Invalidate size to ensure proper rendering inside dynamic containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [hospitals, ambulances, selectedHospitalId, pickupLocation, rerouteDestination, showReroutePath, onSelectHospital]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Overlay */}
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
        {showReroutePath && (
          <div className="flex items-center gap-1 font-bold text-orange-600">
            <span className="w-3 h-1 bg-orange-500 inline-block"></span>
            <span>AI Dynamic Reroute Path</span>
          </div>
        )}
      </div>
    </div>
  );
};
