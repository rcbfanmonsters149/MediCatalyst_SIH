import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DoctorStructuredOrder,
  EmergencyTimelineEvent 
} from '../../types';
import { DoctorCoordinationModal } from './DoctorCoordinationModal';
import { 
  Clock, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Stethoscope
} from '../icons';

export const EnRouteStabilizationCard: React.FC = () => {
  const {
    activeDispatch,
    stabilizationSession,
    activeTransportStrategy,
    setTransportStrategy,
    requestEnRouteStabilization,
    sendDoctorCoordinationMessage,
    startStabilizationAtSupporting,
    completeStabilizationAtSupporting,
    bypassEnRouteStabilization
  } = useApp();

  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  if (!activeDispatch || !stabilizationSession) return null;

  const session = stabilizationSession;
  const candidate = session.selectedCandidate || session.candidateFacilities[0];

  const isBypassed = session.stabilizationStatus === 'BYPASS_OR_REJECTED';
  const isStabilizing = session.stabilizationStatus === 'PATIENT_ARRIVED_STABILIZATION';
  const isComplete = session.stabilizationStatus === 'STABILIZATION_COMPLETE' || session.stabilizationStatus === 'RESUMING_TRANSIT_TO_PARENT';

  return (
    <div className="w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. 3-WAY STRATEGY SWITCHER (Option A vs Option B vs Option C)            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-black font-mono border border-teal-200">
              3T
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Emergency Transport Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Select between Standard Pickup, Midway Rendezvous, or Highway En-Route Stabilization
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Strategy: {activeTransportStrategy.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* OPTION A */}
          <button
            type="button"
            onClick={() => setTransportStrategy('OPTION_A_DIRECT_PICKUP')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTransportStrategy === 'OPTION_A_DIRECT_PICKUP'
                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black font-mono uppercase tracking-wider text-blue-800">
                  OPTION A
                </span>
                <span className="text-sm">🚑</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Direct Ambulance Pickup</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Ambulance travels entire distance to caller’s home or emergency scene.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>Standard Response</span>
              <span className="font-bold text-blue-700">~24 mins</span>
            </div>
          </button>

          {/* OPTION B */}
          <button
            type="button"
            onClick={() => setTransportStrategy('OPTION_B_MIDWAY_HANDOVER')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTransportStrategy === 'OPTION_B_MIDWAY_HANDOVER'
                ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black font-mono uppercase tracking-wider text-amber-800">
                  OPTION B
                </span>
                <span className="text-sm">🤝</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Midway Handover (Meet-Me)</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Caretaker drives toward ambulance; rendezvous at roadside safe landmark.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>Dynamic Rendezvous</span>
              <span className="font-bold text-amber-700">Saves ~8 mins</span>
            </div>
          </button>

          {/* OPTION C */}
          <button
            type="button"
            onClick={() => setTransportStrategy('OPTION_C_EN_ROUTE_STABILIZATION')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTransportStrategy === 'OPTION_C_EN_ROUTE_STABILIZATION'
                ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black font-mono uppercase tracking-wider text-teal-800 flex items-center gap-1">
                  <span>OPTION C</span>
                  <span className="text-[9px] bg-teal-200/80 text-teal-900 px-1 py-0.2 rounded font-bold">500m Detour</span>
                </span>
                <span className="text-sm">🏥</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Dynamic En-Route Stabilization</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Interim stabilization at verified facility 300m off highway before definitive care.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>Bilaspur CHC</span>
              <span className="font-bold text-teal-700">+2 min Detour</span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RURAL-FRIENDLY NOTIFICATION BANNER (When Option C is recommended)     */}
      {/* ========================================================================= */}
      {candidate && !isBypassed && (
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-700/60 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-teal-400/20 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-300/30 font-black">
                  NEARBY EMERGENCY SUPPORT AVAILABLE
                </span>
                <span className="text-[10px] font-mono bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-300/30 font-semibold">
                  300m From Route
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {candidate.hospital.name} is on the Ambulance Route
              </h3>

              <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
                This facility is located <strong>300 meters</strong> from the ambulance travel path (adding only a <strong>+2 min detour</strong>). They can administer immediate emergency stabilization (control bleeding, provide oxygen, normalize vitals) before the ambulance continues to the main hospital for definitive surgery.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-teal-200/90 font-mono">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">📍 Detour: +{candidate.detourDistanceKm} km</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">⏱️ Added Time: ~{candidate.detourTimeMinutes} mins</span>
                <span className="bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-400/30 font-bold">
                  ✓ Emergency Bay Ready
                </span>
              </div>
            </div>

            {/* Prompt Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTransportStrategy('OPTION_C_EN_ROUTE_STABILIZATION');
                  requestEnRouteStabilization();
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-teal-950 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>STABILIZE EN-ROUTE (+2m)</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCoordModalOpen(true)}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
                  <span>Doctor Desk</span>
                </button>

                <button
                  type="button"
                  onClick={bypassEnRouteStabilization}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-teal-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue Direct
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FACILITY METRIC COMPARISON (Supporting Hospital vs Parent Hospital)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting Interim Facility */}
        <div className="bg-white rounded-3xl p-5 border border-teal-200 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <span className="text-[11px] font-black uppercase font-mono text-teal-900 tracking-wider">
                INTERIM STABILIZATION FACILITY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              300m Off Highway
            </span>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>🏥 {session.supportingHospitalName}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Bilaspur Tehsil Chowk, NH-44 Crossing • Community Health Center
            </p>
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-teal-800 uppercase block font-semibold">Ambulance ETA</span>
              <span className="text-base font-black text-teal-950">~{candidate?.estimatedArrivalTimeMinutes || 6} mins</span>
              <span className="text-[10px] text-slate-500 block">({candidate?.distanceFromAmbulanceKm || 4.8} km away)</span>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 uppercase block font-semibold">Detour Cost</span>
              <span className="text-base font-black text-emerald-800">+{candidate?.detourTimeMinutes || 2} mins</span>
              <span className="text-[10px] text-slate-500 block">(+{candidate?.detourDistanceKm || 0.4} km detour)</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
              Interim Stabilization Capabilities
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                ✓ Active Bleeding Control
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                ✓ Vital Signs Normalization
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                ✓ High-Flow Oxygen
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                ✓ IV Tranexamic Acid / Fluids
              </span>
            </div>
          </div>
        </div>

        {/* Parent Definitive Center */}
        <div className="bg-white rounded-3xl p-5 border border-blue-200 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <span className="text-[11px] font-black uppercase font-mono text-blue-900 tracking-wider">
                DEFINITIVE SURGICAL DESTINATION
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
              ML Optimal Match
            </span>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>🏛️ {session.parentHospitalName}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Sector 12 Institutional Area • Apex Tertiary Multi-Specialty
            </p>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-blue-800 uppercase block font-semibold">Total Highway Distance</span>
              <span className="text-base font-black text-blue-950">26.5 km</span>
              <span className="text-[10px] text-slate-500 block">(Direct transit route)</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-800 uppercase block font-semibold">Total Transit Time</span>
              <span className="text-base font-black text-blue-900">~32 mins</span>
              <span className="text-[10px] text-slate-500 block">(High-speed corridor)</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
              Definitive Treatment Facilities
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                ✓ Level-1 Trauma OT
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                ✓ 24x7 Cath Lab
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                ✓ Neuro-Surgery ICU
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                ✓ O-Negative Blood Bank
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 5-STAGE PROGRESSION PIPELINE                                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              En-Route Clinical Lifecycle Progression
            </h4>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            Phase Status: {session.stabilizationStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          {[
            {
              step: 1,
              title: 'Route Analysis',
              desc: 'Bilaspur CHC (300m)',
              done: true
            },
            {
              step: 2,
              title: 'Doctor Desk',
              desc: 'Directives Sent',
              done: session.doctorMessages.length > 0
            },
            {
              step: 3,
              title: 'Detour & Docking',
              desc: 'Arriving at CHC',
              done: isStabilizing || isComplete
            },
            {
              step: 4,
              title: 'Stabilization',
              desc: 'Bleeding & Vitals',
              done: isComplete,
              current: isStabilizing
            },
            {
              step: 5,
              title: 'Parent Highway',
              desc: 'Definitive Surgery',
              done: isComplete
            }
          ].map((st) => (
            <div
              key={st.step}
              className={`p-3 rounded-2xl border text-center transition ${
                st.current
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                  : st.done
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                  st.current ? 'bg-amber-500 text-white' : st.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {st.done && !st.current ? '✓' : st.step}
                </span>
                <span className="font-extrabold text-[11px] truncate">{st.title}</span>
              </div>
              <p className="text-[10px] truncate text-slate-500">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 12-EVENT AUDIT TRAIL TIMELINE (Hackathon Judges Showcase)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              12-Stage Emergency Audit Trail & Timeline
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowFullTimeline(!showFullTimeline)}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullTimeline ? 'Collapse Timeline' : 'View Full 12-Step Audit Log'}</span>
            {showFullTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {(showFullTimeline ? session.timeline : session.timeline.slice(0, 5)).map((evt, idx) => (
            <div key={evt.id} className="flex items-start gap-3 text-xs">
              <span className="font-mono font-bold text-[11px] text-slate-400 w-16 shrink-0 pt-0.5">
                {evt.timestamp}
              </span>
              <div className="relative flex flex-col items-center">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  evt.completed
                    ? 'bg-emerald-600 text-white'
                    : evt.active
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-200'
                }`}>
                  {evt.completed && <span className="text-[8px]">✓</span>}
                </span>
                {idx < (showFullTimeline ? session.timeline.length : 5) - 1 && (
                  <div className="w-0.5 h-8 bg-slate-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-[11px] ${evt.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                    {evt.title}
                  </span>
                  {evt.active && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {evt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Coordination Desk Modal */}
      <DoctorCoordinationModal
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        session={session}
        onSendMessage={sendDoctorCoordinationMessage}
        onStartStabilization={startStabilizationAtSupporting}
        onCompleteStabilization={completeStabilizationAtSupporting}
      />
    </div>
  );
};
