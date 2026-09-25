import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles
} from '../icons';

export const DEMO_STAGES = [
  {
    step: 1,
    title: 'Critical Emergency SOS',
    detail: 'Citizen SOS triggers with polytrauma & arterial bleeding; critical vitals collected.',
    badge: 'Acuity: ESI-1'
  },
  {
    step: 2,
    title: 'ML Selects Definitive Center',
    detail: 'ML engine matches Apex Multi-Specialty (26.5 km) as definitive trauma surgery destination.',
    badge: 'Parent Hospital'
  },
  {
    step: 3,
    title: 'ALS Ambulance Dispatched',
    detail: 'Advanced Life Support Ambulance DL-01-AX-1081 departs towards highway corridor.',
    badge: 'Ambulance Assigned'
  },
  {
    step: 4,
    title: 'Real-time Route Analysis',
    detail: 'Corridor scanner evaluates 500m proximity perimeter along ambulance travel route.',
    badge: 'Corridor Active'
  },
  {
    step: 5,
    title: 'Supporting CHC Detected',
    detail: 'Bilaspur CHC identified 300m off highway (+0.4 km, +2 min detour) with open emergency bay.',
    badge: 'Proximity: 300m'
  },
  {
    step: 6,
    title: 'Option C Activated',
    detail: 'Paramedic & system select Option C: Dynamic En-Route Stabilization.',
    badge: 'Option C Selected'
  },
  {
    step: 7,
    title: 'Doctor Peer Coordination',
    detail: 'Apex Trauma Lead transmits structured directives to Bilaspur CHC medical officer.',
    badge: 'Zero-Prescription'
  },
  {
    step: 8,
    title: 'Arrival at Bilaspur CHC',
    detail: 'Ambulance pulls into Bilaspur CHC Emergency Bay; interim stabilization initiated.',
    badge: 'Interim Bay Docked'
  },
  {
    step: 9,
    title: 'Stabilization in Progress',
    detail: 'Active bleeding controlled with pressure dressing; SpO2 normalized with high-flow oxygen.',
    badge: 'Vitals Normalized'
  },
  {
    step: 10,
    title: 'Stabilization Completed',
    detail: 'Doctor completes stabilization and clears patient; ambulance resumes highway transit.',
    badge: 'Cleared for Transit'
  },
  {
    step: 11,
    title: 'Arrival at Parent Hospital',
    detail: 'Ambulance docks at Apex Multi-Specialty for scheduled definitive trauma surgery.',
    badge: 'Definitive Care Reached'
  }
];

export const EnRouteDemoController: React.FC = () => {
  const {
    isEnRouteDemoActive,
    enRouteDemoStep,
    startEnRouteDemo,
    pauseEnRouteDemo,
    resetEnRouteDemo,
    setEnRouteDemoStep
  } = useApp();

  const currentStep = enRouteDemoStep || 1;
  const currentStageInfo = DEMO_STAGES.find((s) => s.step === currentStep) || DEMO_STAGES[0];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-teal-800/80 shadow-xl space-y-3.5">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-black bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                HACKATHON JUDGES DEMO MODE
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                11-Stage Interactive Simulation
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              En-Route Emergency Stabilization Walkthrough
            </h3>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {isEnRouteDemoActive ? (
            <button
              type="button"
              onClick={pauseEnRouteDemo}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE DEMO</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startEnRouteDemo}
              className="px-4 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-teal-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>START DEMO</span>
            </button>
          )}

          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setEnRouteDemoStep(Math.max(1, currentStep - 1))}
              disabled={currentStep <= 1}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold px-2 text-teal-300">
              {currentStep}/11
            </span>

            <button
              type="button"
              onClick={() => setEnRouteDemoStep(Math.min(11, currentStep + 1))}
              disabled={currentStep >= 11}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={resetEnRouteDemo}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Step Explanatory Banner (Judges View) */}
      <div className="bg-slate-800/80 border border-teal-800/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black font-mono text-[10px] flex items-center justify-center">
              {currentStep}
            </span>
            <span className="font-extrabold text-sm text-teal-200">
              {currentStageInfo.title}
            </span>
            <span className="text-[10px] font-mono uppercase bg-teal-900 text-teal-200 px-2 py-0.2 rounded border border-teal-700 font-bold">
              {currentStageInfo.badge}
            </span>
          </div>
          <p className="text-slate-300 text-xs pl-7 leading-relaxed">
            {currentStageInfo.detail}
          </p>
        </div>

        <div className="text-[11px] font-mono text-teal-300 shrink-0 sm:text-right pl-7 sm:pl-0">
          {isEnRouteDemoActive ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Simulating Live Transition...</span>
            </span>
          ) : (
            <span className="text-slate-400">Click START DEMO or use arrow keys</span>
          )}
        </div>
      </div>

      {/* 11-Step Interactive Progress Bar */}
      <div className="grid grid-cols-11 gap-1 pt-1">
        {DEMO_STAGES.map((st) => {
          const isDone = st.step < currentStep;
          const isCurrent = st.step === currentStep;
          return (
            <button
              key={st.step}
              type="button"
              onClick={() => setEnRouteDemoStep(st.step)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-teal-400 ring-2 ring-teal-400/50 shadow-sm'
                  : isDone
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Step ${st.step}: ${st.title}`}
            />
          );
        })}
      </div>
    </div>
  );
};
