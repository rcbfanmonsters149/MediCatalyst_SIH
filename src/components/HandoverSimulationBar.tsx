import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Truck, 
  Compass 
} from './icons';

interface HandoverSimulationBarProps {
  className?: string;
}

export const HandoverSimulationBar: React.FC<HandoverSimulationBarProps> = ({ className = '' }) => {
  const {
    activeDispatch,
    activeHandover,
    isHandoverSimulating,
    handoverSimSpeed,
    toggleHandoverSimulation,
    setHandoverSimulationSpeed,
    resetHandoverSimulation,
    simulateHandoverDetour,
    confirmPatientHandover,
    setTransportMode
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!activeDispatch) return null;

  return (
    <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 p-3 sm:p-4 shadow-lg transition-all ${className}`}>
      
      {/* Top Controller Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-indigo-300 font-heading tracking-wide">
                HACKATHON EVALUATOR DEMO CONTROLLER
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 font-mono">
                SIMULATION MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive dual-vehicle simulator for hackathon judges & evaluators.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => toggleHandoverSimulation()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isHandoverSimulating 
                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isHandoverSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isHandoverSimulating ? 'Pause' : 'Play Sim'}</span>
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs font-mono">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setHandoverSimulationSpeed(spd)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  handoverSimSpeed === spd 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={resetHandoverSimulation}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Scenarios' : 'Scenarios'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Panel */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in">
          
          {/* Scenario 1: Switch to Meet Halfway */}
          <button
            type="button"
            onClick={() => setTransportMode('MEET_HALFWAY')}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-700/80 text-left transition flex items-start gap-2 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              1
            </div>
            <div>
              <span className="font-bold text-xs text-white block">Activate Meet Halfway</span>
              <span className="text-[10px] text-slate-400">Trigger rendezvous mode & OSRM dynamic routes</span>
            </div>
          </button>

          {/* Scenario 2: Simulate Detour / Recalculation */}
          <button
            type="button"
            onClick={simulateHandoverDetour}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-amber-950/70 border border-slate-700/80 text-left transition flex items-start gap-2 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              2
            </div>
            <div>
              <span className="font-bold text-xs text-white block">Simulate Caretaker Detour</span>
              <span className="text-[10px] text-slate-400">Triggers route diversion alert & dynamic recalculation</span>
            </div>
          </button>

          {/* Scenario 3: Confirm Patient Handover */}
          <button
            type="button"
            onClick={confirmPatientHandover}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700/80 text-left transition flex items-start gap-2 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              3
            </div>
            <div>
              <span className="font-bold text-xs text-white block">Confirm Patient Handover</span>
              <span className="text-[10px] text-slate-400">Transitions ambulance into Hospital Golden Hour transit</span>
            </div>
          </button>

        </div>
      )}

    </div>
  );
};
