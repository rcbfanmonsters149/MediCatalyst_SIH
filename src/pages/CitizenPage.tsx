import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  Bed, 
  AlertTriangle,
  HeartPulse,
  Navigation,
  Activity,
  Droplets,
  Zap,
  Scan,
  Disc,
  Mic
} from 'lucide-react';
import { useApp, calculateHaversineKm } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { LiveAmbulanceTrackerCard } from '../components/LiveAmbulanceTrackerCard';
import { getCapabilityFriendlyName } from '../utils/mlTriage';
import { VoiceSOSRecognitionModal } from '../components/VoiceSOSRecognitionModal';

interface CitizenPageProps {
  onOpenEmergency: () => void;
  onSelectHospitalForBooking?: (hospitalId: string) => void;
}

export const CitizenPage: React.FC<CitizenPageProps> = ({ onOpenEmergency }) => {
  const { hospitals, selectedHospitalId, setSelectedHospitalId, userLocation, activeDispatch } = useApp();
  const [expandedDoctorHospId, setExpandedDoctorHospId] = useState<string | null>('hosp-rampur-phc');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const memoizedPickupLocation = useMemo(() => {
    return userLocation ? {
      lat: userLocation.lat,
      lng: userLocation.lng,
      label: `Your Current Location (${userLocation.areaName || 'Live GPS'})`
    } : undefined;
  }, [userLocation?.lat, userLocation?.lng, userLocation?.areaName]);

  // Sorted nearest hospitals measured directly from the user's real GPS position
  const effectiveCoords = userLocation || { lat: 28.7080, lng: 77.0980 };
  const sortedHospitals = useMemo(() => {
    return [...hospitals].map(h => {
      const dist = calculateHaversineKm(effectiveCoords.lat, effectiveCoords.lng, h.lat, h.lng);
      const eta = Math.max(2, Math.round(dist * 2.1));
      return { ...h, distanceKm: dist, etaMinutes: eta };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [hospitals, effectiveCoords.lat, effectiveCoords.lng]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Hero Emergency Card with SOS Button */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading">
            Rural Healthcare & Immediate Ambulance Network
          </h1>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-6 py-3.5 rounded-xl font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 animate-emergency-beacon cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Request Immediate Ambulance (SOS)</span>
            </button>
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              title="Speak in Hindi, Marathi, or English (बोलकर सहायता लें / आवाजाने मदत मागा)"
            >
              <Mic className="w-5 h-5 animate-pulse text-amber-100" />
              <span>🎙️ Voice SOS (हिन्दी / मराठी / English)</span>
            </button>
            <a
              href="tel:108"
              className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 border border-white/30 text-white px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition"
            >
              <Phone className="w-4 h-4" />
              <span>Dial 108 Directly</span>
            </a>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <HeartPulse className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* 2. Available Healthcare Centers (Top) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Available Healthcare Centers ({sortedHospitals.length})</span>
          <span>Sorted by nearest distance</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortedHospitals.map(hosp => {
            const isSelected = hosp.id === selectedHospitalId;
            const availableDoctors = hosp.doctorsOnDuty.filter(d => d.statusDetail === 'AVAILABLE');

            return (
              <div
                key={hosp.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedHospitalId(hosp.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedHospitalId(hosp.id);
                  }
                }}
                className={`p-5 rounded-2xl bg-white border transition shadow-xs hover:shadow-md cursor-pointer ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                        {hosp.name}
                      </h3>
                      {hosp.id === sortedHospitals[0]?.id && (
                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs animate-pulse">
                          ⭐ Nearest Hospital (~{hosp.distanceKm} km)
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        hosp.type === 'Apex Multi-Specialty' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {hosp.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.address}</span>
                      <span className="font-bold text-emerald-700 ml-1">• {hosp.distanceKm} km away (ETA ~{hosp.etaMinutes} mins)</span>
                    </p>
                  </div>

                  {/* 24/7 or Hours Badge */}
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      hosp.is24x7Emergency 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{hosp.is24x7Emergency ? '24x7 Emergency Service' : hosp.openingHours}</span>
                    </span>
                  </div>
                </div>

                {/* Real-Time Bed Availability Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>General Beds</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className="text-emerald-600">{hosp.generalBedsAvail ?? 0}</span>
                      <span className="text-slate-500 text-xs font-normal"> Avail</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      <span>ICU Beds</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className={(hosp.icuBedsAvail ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {hosp.icuBedsAvail ?? 0}
                      </span>
                      <span className="text-slate-500 text-xs font-normal"> Avail</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Maternity Beds</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className="text-indigo-600">{hosp.maternityBedsAvail ?? 0}</span>
                      <span className="text-slate-500 text-xs font-normal"> Avail</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Ventilators</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className={(hosp.ventilatorsAvail ?? 0) > 0 ? 'text-sky-600' : 'text-slate-400'}>
                        {hosp.ventilatorsAvail ?? 0} Units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Critical Diagnostic & Life-Support Equipment Status */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-dashed border-slate-100 text-[11px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Equipment:</span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    (hosp.dialysisAvail ?? 0) > 0 ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Droplets className="w-3 h-3" />
                    <span>Dialysis: {hosp.dialysisAvail ?? 0}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    (hosp.ecgAvail ?? 0) > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Activity className="w-3 h-3" />
                    <span>ECG: {hosp.ecgAvail ?? 0}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    (hosp.ctScannerAvail ?? 0) > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Scan className="w-3 h-3" />
                    <span>CT Scan: {hosp.ctScannerAvail ?? 0}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    (hosp.defibrillatorAvail ?? 0) > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Zap className="w-3 h-3" />
                    <span>Defibrillator: {hosp.defibrillatorAvail ?? 0}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    (hosp.mriAvail ?? 0) > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Disc className="w-3 h-3" />
                    <span>MRI: {hosp.mriAvail ?? 0}</span>
                  </span>
                </div>

                {/* Interactive On-Duty Doctors & Medical Staff Roster */}
                <div className="mt-3 space-y-2">
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDoctorHospId(expandedDoctorHospId === hosp.id ? null : hosp.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedDoctorHospId(expandedDoctorHospId === hosp.id ? null : hosp.id);
                      }
                    }}
                    className="p-3 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 rounded-xl border border-emerald-200 cursor-pointer transition flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Doctors on Duty:</span>
                          <span className="text-emerald-700 bg-white px-2 py-0.2 rounded-full font-extrabold border border-emerald-300">
                            {availableDoctors.length} Available Now
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Total {hosp.doctorsOnDuty.length} staff registered • Click to see live availability
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-900 transition flex items-center gap-1">
                      {expandedDoctorHospId === hosp.id ? 'Hide Doctors ▲' : 'View Doctors ▼'}
                    </span>
                  </div>

                  {/* Expanded Live Doctors Roster */}
                  {expandedDoctorHospId === hosp.id && (
                    <div className="p-3 bg-white border border-emerald-300 rounded-xl shadow-xs space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Staff On-Duty at {hosp.name}:</span>
                        <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          Hospital Sync Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {hosp.doctorsOnDuty.map(doc => {
                          const isAvailable = doc.statusDetail === 'AVAILABLE';
                          const isBusy = doc.statusDetail === 'BUSY';

                          return (
                            <div 
                              key={doc.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                                isAvailable 
                                  ? 'bg-emerald-50/70 border-emerald-200' 
                                  : (isBusy ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200')
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-slate-900">{doc.name}</span>
                                  {isAvailable ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                      🟢 Available
                                    </span>
                                  ) : isBusy ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                                      🔴 Busy
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300 shrink-0">
                                      ⚪ Off Duty
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                                  {doc.designation}
                                </p>
                                {doc.department && (
                                  <p className="text-[10px] text-slate-500">{doc.department}</p>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                <span>Shift: {doc.shift}</span>
                                {doc.roomNumber && <span className="font-mono text-slate-700">{doc.roomNumber}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Capabilities Tags */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {hosp.capabilities.map(cap => (
                      <span 
                        key={cap} 
                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        title={getCapabilityFriendlyName(cap)}
                      >
                        ✓ {getCapabilityFriendlyName(cap)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${hosp.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{hosp.phone}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHospitalId(hosp.id);
                        const el = document.getElementById('map-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                      title="Locate this hospital on the map below"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate on Map</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEmergency();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      <span>Emergency SOS</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* 3. Nearby Hospitals Locator Map (Positioned at the bottom) */}
      <div id="map-section" className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Nearby Hospitals Locator Map</span>
              {userLocation?.areaName && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  📍 {userLocation.areaName}
                </span>
              )}
            </h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Showing {sortedHospitals.length} nearby healthcare facilities
          </span>
        </div>

        {!userLocation && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span>📍 Location access unavailable — showing default area. Enable GPS for accurate results.</span>
          </div>
        )}
        
        <LeafletMap
          hospitals={sortedHospitals}
          ambulances={[]}
          pickupLocation={memoizedPickupLocation}
          selectedHospitalId={selectedHospitalId}
          onSelectHospital={(id) => setSelectedHospitalId(id)}
          height="480px"
          showRideHUD={false}
          showRouteLine={false}
        />

        {/* Dedicated Separate Live Ambulance Telemetry & Route Tracker Card */}
        {activeDispatch && (
          <div className="pt-2">
            <LiveAmbulanceTrackerCard />
          </div>
        )}
      </div>

      {/* 3-Language Elderly Speech Recognition Voice SOS Modal */}
      <VoiceSOSRecognitionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialLanguage="hi-IN"
        onTranscriptSubmitted={() => {
          onOpenEmergency();
        }}
      />

    </div>
  );
};
