import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  Bed, 
  AlertTriangle,
  HeartPulse,
  Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { getCapabilityFriendlyName } from '../utils/mlTriage';

interface CitizenPageProps {
  onOpenEmergency: () => void;
  onSelectHospitalForBooking?: (hospitalId: string) => void;
}

export const CitizenPage: React.FC<CitizenPageProps> = ({ onOpenEmergency }) => {
  const { hospitals, selectedHospitalId, setSelectedHospitalId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter24x7, setFilter24x7] = useState(false);
  const [filterIcuOnly, setFilterIcuOnly] = useState(false);
  const [filterDoctorPresent, setFilterDoctorPresent] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedDoctorHospId, setExpandedDoctorHospId] = useState<string | null>('hosp-rampur-phc');

  const filteredHospitals = hospitals.filter(hosp => {
    const matchesSearch = hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hosp.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hosp.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matches24x7 = !filter24x7 || hosp.is24x7Emergency;
    const matchesIcu = !filterIcuOnly || hosp.icuBedsAvail > 0;
    const matchesDoc = !filterDoctorPresent || hosp.doctorsOnDuty.some(d => d.available);
    const matchesType = filterType === 'ALL' || hosp.type.includes(filterType);

    return matchesSearch && matches24x7 && matchesIcu && matchesDoc && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Hero Quick Emergency Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-rose-100 border border-white/10">
            <HeartPulse className="w-4 h-4 text-rose-300 animate-pulse" />
            <span>Golden Hour Emergency Rapid Response</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading">
            Rural Healthcare & Immediate Ambulance Network
          </h1>

          <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed">
            Find nearby government health centers, verify real-time bed availability & on-shift doctors, or trigger a 2-minute auto-escalating emergency ambulance dispatch.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-5 py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 animate-emergency-beacon"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Request Immediate Ambulance (SOS)</span>
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital name, village, or specialization (e.g., Rampur, CHC, ICU)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Facility Type Selector */}
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Facility Types</option>
              <option value="Primary Health">Primary Health Centers (PHC)</option>
              <option value="Community Health">Community Health Centers (CHC)</option>
              <option value="District">District Civil Hospitals</option>
              <option value="Apex Multi-Specialty">Apex Multi-Specialty</option>
            </select>
          </div>
        </div>

        {/* Filter Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setFilter24x7(!filter24x7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              filter24x7 
                ? 'bg-red-50 text-red-700 border-red-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🚨 24x7 Emergency Certified Only
          </button>

          <button
            onClick={() => setFilterIcuOnly(!filterIcuOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              filterIcuOnly 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🛏️ ICU Beds Available
          </button>

          <button
            onClick={() => setFilterDoctorPresent(!filterDoctorPresent)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              filterDoctorPresent 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            👨‍⚕️ Doctor On-Duty Right Now
          </button>

          {(filter24x7 || filterIcuOnly || filterDoctorPresent || filterType !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilter24x7(false);
                setFilterIcuOnly(false);
                setFilterDoctorPresent(false);
                setFilterType('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Hospital Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Geographic Hospital & Ambulance Radar</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Live GPS Coordinates</span>
            </div>
            
            <LeafletMap
              hospitals={hospitals}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={(id) => setSelectedHospitalId(id)}
              height="460px"
            />

            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800">
              💡 <strong>Tip for rural patients:</strong> Click any pin on the map to view real-time bed numbers and doctor duty hours before traveling.
            </div>
          </div>
        </div>

        {/* Right Column: Hospital Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing <strong>{filteredHospitals.length}</strong> hospitals matching criteria</span>
            <span>Sorted by nearest distance</span>
          </div>

          {filteredHospitals.map(hosp => {
            const isSelected = hosp.id === selectedHospitalId;
            const availableDoctors = hosp.doctorsOnDuty.filter(d => d.available);
            const todaySpecialists = hosp.visitingSpecialists.filter(s => s.isVisitingToday);

            return (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
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
                      <span className="text-emerald-600">{hosp.generalBedsAvail}</span>
                      <span className="text-slate-400 text-xs"> / {hosp.generalBedsTotal}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      <span>ICU Beds</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className={hosp.icuBedsAvail > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {hosp.icuBedsAvail}
                      </span>
                      <span className="text-slate-400 text-xs"> / {hosp.icuBedsTotal}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Maternity Beds</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className="text-indigo-600">{hosp.maternityBedsAvail}</span>
                      <span className="text-slate-400 text-xs"> / {hosp.maternityBedsTotal}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Ventilators</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      <span className={hosp.ventilatorsAvail > 0 ? 'text-sky-600' : 'text-slate-400'}>
                        {hosp.ventilatorsAvail} Free
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive On-Duty Doctors & Medical Staff Roster */}
                <div className="mt-3 space-y-2">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDoctorHospId(expandedDoctorHospId === hosp.id ? null : hosp.id);
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
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                          Hospital Sync Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {hosp.doctorsOnDuty.map(doc => {
                          const status = doc.statusDetail || (doc.available ? 'AVAILABLE' : 'OFF_DUTY');
                          return (
                            <div 
                              key={doc.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                                status === 'AVAILABLE' 
                                  ? 'bg-emerald-50/60 border-emerald-200' 
                                  : (status === 'BUSY_SURGERY' 
                                      ? 'bg-amber-50/60 border-amber-200' 
                                      : (status === 'BUSY_EMERGENCY' ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'))
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-slate-900">{doc.name}</span>
                                  {status === 'AVAILABLE' && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                      🟢 Available
                                    </span>
                                  )}
                                  {status === 'BUSY_SURGERY' && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                      🟡 In Surgery
                                    </span>
                                  )}
                                  {status === 'BUSY_EMERGENCY' && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                                      🔴 Emergency OT
                                    </span>
                                  )}
                                  {status === 'ON_ROUNDS' && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                                      🟠 On Rounds
                                    </span>
                                  )}
                                  {status === 'OFF_DUTY' && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
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

                  {/* Visiting Specialists Calendar (Critical for rural patients!) */}
                  {hosp.visitingSpecialists.length > 0 && (
                    <div className="text-xs bg-amber-50/70 text-amber-900 px-3 py-2 rounded-lg border border-amber-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Visiting Specialist Roster:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        {hosp.visitingSpecialists.map(spec => (
                          <div key={spec.id} className="flex items-center justify-between bg-white/70 px-2 py-1 rounded">
                            <span>{spec.specialty}: <strong>{spec.name}</strong></span>
                            <span className={spec.isVisitingToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                              {spec.isVisitingToday ? `TODAY (${spec.timing})` : spec.visitingDays.join(', ')}
                            </span>
                          </div>
                        ))}
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
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>View on Radar</span>
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

    </div>
  );
};
