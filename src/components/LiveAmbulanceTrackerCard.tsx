import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Zap, ChevronUp, ChevronDown, Activity } from 'lucide-react';

interface LiveAmbulanceTrackerCardProps {
  className?: string;
}

export const LiveAmbulanceTrackerCard: React.FC<LiveAmbulanceTrackerCardProps> = ({ className = '' }) => {
  const { liveAmbulance } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!liveAmbulance) return null;

  return (
    <div className={`bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 p-4 sm:p-5 transition-all ${className}`}>
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide font-heading">
                LIVE 108 AMBULANCE TRACKER
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-red-950 text-red-300 border border-red-700/60 font-mono">
                {liveAmbulance.vehicleNumber}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">
              {liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' 
                ? '⚡ Phase 1: Approaching Patient Pickup Location' 
                : '🚨 Phase 2: Rapid Transit to Apex Trauma Center'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1 text-xs"
          title={isCollapsed ? 'Expand Tracker Details' : 'Collapse Tracker Details'}
        >
          <span className="hidden sm:inline text-[11px] font-semibold text-slate-400">
            {isCollapsed ? 'Expand' : 'Collapse'}
          </span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="space-y-4 pt-3">
          {/* 2 Distance & ETA Metric Cards (Uber / Rapido Style Live Countdowns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Distance to Patient Pickup */}
            <div className={`p-3.5 rounded-xl border transition ${
              liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' 
                ? 'bg-amber-950/30 border-amber-600/60 shadow-sm shadow-amber-950/40' 
                : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>📍 DISTANCE TO PICKUP</span>
                </span>
                <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded-full text-amber-200 font-mono font-extrabold">
                  ~{liveAmbulance.etaToPatientMinutes}m ETA
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-black text-amber-400 tracking-tight font-mono">
                  {liveAmbulance.distanceToPatientKm}
                </span>
                <span className="text-sm font-bold text-amber-300">km remaining</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {liveAmbulance.phase === 'EN_ROUTE_TO_PATIENT' 
                  ? 'Ambulance is actively moving toward pickup coordinates' 
                  : 'Patient Picked Up ✓'}
              </span>
            </div>

            {/* Distance from Patient to Destination Hospital */}
            <div className={`p-3.5 rounded-xl border transition ${
              liveAmbulance.phase === 'TRANSPORTING_TO_HOSPITAL' 
                ? 'bg-emerald-950/30 border-emerald-600/60 shadow-sm shadow-emerald-950/40' 
                : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>🏥 DISTANCE TO HOSPITAL</span>
                </span>
                <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded-full text-emerald-200 font-mono font-extrabold">
                  ~{liveAmbulance.etaToHospitalMinutes}m ETA
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                  {liveAmbulance.distancePatientToHospitalKm}
                </span>
                <span className="text-sm font-bold text-emerald-300">km remaining</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                Apex Trauma Center & Emergency Department
              </span>
            </div>
          </div>

          {/* Linear Route Progress Indicator */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-bold">
              <span>Depot Station</span>
              <span className={liveAmbulance.progress >= 0.45 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {liveAmbulance.progress < 0.45 ? '● Approaching Patient Pickup' : '● In Transit to Apex Emergency'}
              </span>
              <span>Hospital OT</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 transition-all duration-700 ease-linear rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, Math.round(liveAmbulance.progress * 100)))}%` }}
              />
            </div>
          </div>

          {/* Driver Information & Actions Strip */}
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-slate-200 shrink-0">
                {liveAmbulance.driverName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AM'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{liveAmbulance.driverName}</span>
                  <span className="text-xs text-amber-400 font-semibold">★ 4.9</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Speed: <b className="text-slate-200 font-mono">{liveAmbulance.speedKmH} km/h</b>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    GPS Telemetry Active
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${liveAmbulance.driverPhone}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Call Paramedic Driver ({liveAmbulance.driverPhone})</span>
            </a>
          </div>
        </div>
      ) : (
        /* Collapsed Compact View */
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-300 font-medium">
              Pickup: <b className="text-amber-400 font-mono font-bold">{liveAmbulance.distanceToPatientKm} km</b> (~{liveAmbulance.etaToPatientMinutes}m)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-medium">
              Hospital: <b className="text-emerald-400 font-mono font-bold">{liveAmbulance.distancePatientToHospitalKm} km</b> (~{liveAmbulance.etaToHospitalMinutes}m)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">Speed: {liveAmbulance.speedKmH} km/h</span>
          </div>

          <a
            href={`tel:${liveAmbulance.driverPhone}`}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>Call Driver</span>
          </a>
        </div>
      )}
    </div>
  );
};
