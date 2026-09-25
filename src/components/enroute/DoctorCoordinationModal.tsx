import React, { useState } from 'react';
import { 
  DoctorStructuredOrder, 
  EnRouteStabilizationSession,
  DoctorCoordinationMessage
} from '../../types';
import { STRUCTURED_DOCTOR_ORDERS, getStructuredOrderConfig } from '../../utils/enRouteStabilization';
import { 
  X, 
  Send, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  CheckCircle2,
  Stethoscope
} from '../icons';

interface DoctorCoordinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: EnRouteStabilizationSession;
  onSendMessage: (order?: DoctorStructuredOrder, customText?: string) => void;
  onStartStabilization: () => void;
  onCompleteStabilization: () => void;
}

export const DoctorCoordinationModal: React.FC<DoctorCoordinationModalProps> = ({
  isOpen,
  onClose,
  session,
  onSendMessage,
  onStartStabilization,
  onCompleteStabilization
}) => {
  const [selectedOrder, setSelectedOrder] = useState<DoctorStructuredOrder>('CONTROL_ACTIVE_BLEEDING');
  const [customText, setCustomText] = useState('');
  const [activeDoctorPerspective, setActiveDoctorPerspective] = useState<'PARENT_HOSPITAL' | 'SUPPORTING_HOSPITAL'>('PARENT_HOSPITAL');

  if (!isOpen) return null;

  const currentOrderConfig = getStructuredOrderConfig(selectedOrder);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = customText.trim() ? customText.trim() : currentOrderConfig.recommendedText;
    onSendMessage(selectedOrder, textToSend);
    setCustomText('');
  };

  const isStabilizing = session.stabilizationStatus === 'PATIENT_ARRIVED_STABILIZATION';
  const isComplete = session.stabilizationStatus === 'STABILIZATION_COMPLETE' || session.stabilizationStatus === 'RESUMING_TRANSIT_TO_PARENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-teal-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                  DOCTOR-TO-DOCTOR CLINICAL TELEMETRY
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                  Zero-Prescription Protocol
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                <span>En-Route Clinical Stabilization Coordination</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Perspective Switcher */}
            <div className="hidden sm:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveDoctorPerspective('PARENT_HOSPITAL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeDoctorPerspective === 'PARENT_HOSPITAL'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Parent Doctor
              </button>
              <button
                type="button"
                onClick={() => setActiveDoctorPerspective('SUPPORTING_HOSPITAL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeDoctorPerspective === 'SUPPORTING_HOSPITAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Supporting Doctor
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clinical Info Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-slate-600 uppercase font-black block">Parent Hospital (Definitive Destination)</span>
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                🏛️ {session.parentHospitalName}
                <span className="text-[10px] font-medium text-slate-600 font-mono">({session.parentDoctorName})</span>
              </span>
            </div>
            <div className="hidden md:block text-slate-600 font-bold">➔</div>
            <div>
              <span className="text-[10px] text-slate-600 uppercase font-black block">Supporting Interim Facility (300m off-route)</span>
              <span className="font-extrabold text-teal-800 flex items-center gap-1.5">
                🏥 {session.supportingHospitalName}
                <span className="text-[10px] font-medium text-slate-600 font-mono">({session.supportingDoctorName || 'Duty Medical Officer'})</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-bold">
              Detour: +{session.detourDistance || 0.4} km (~{session.detourTime || 2} min)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
              isComplete ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              isStabilizing ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
              'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {session.stabilizationStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Modal Body: Split 2-Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column (7 cols): Secure Live Message Transcript */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 h-[380px] lg:h-auto overflow-hidden bg-slate-50/50">
            <div className="p-3 px-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Clinical Directives & Audit Transcript</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {session.doctorMessages.length} Messages Logged
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {session.doctorMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                  <ShieldCheck className="w-10 h-10 mb-2 text-teal-600/40" />
                  <p className="font-bold text-slate-600">No Doctor Directives Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Select a structured clinical directive on the right to transmit doctor-approved stabilization orders.
                  </p>
                </div>
              ) : (
                session.doctorMessages.map((msg: DoctorCoordinationMessage) => {
                  const isParent = msg.senderRole === 'PARENT_HOSPITAL_DOCTOR';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isParent ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="font-extrabold text-[11px] text-slate-800">
                          {isParent ? '🏛️ ' : '🏥 '}
                          {msg.senderDoctorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.timestamp}
                        </span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                          isParent ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isParent ? 'Parent Tertiary' : 'Supporting Bay'}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-2xl max-w-[90%] shadow-xs border ${
                        isParent 
                          ? 'bg-white border-teal-100 text-slate-800 rounded-tl-xs' 
                          : 'bg-emerald-700 text-white border-emerald-800 rounded-tr-xs'
                      }`}>
                        {msg.structuredOrderLabel && (
                          <div className="mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${
                              isParent 
                                ? 'bg-teal-50 text-teal-900 border-teal-200' 
                                : 'bg-emerald-800/80 text-emerald-100 border-emerald-600'
                            }`}>
                              ⚡ {msg.structuredOrderLabel}
                            </span>
                          </div>
                        )}
                        <p className={`text-xs leading-relaxed ${isParent ? 'text-slate-700 font-medium' : 'text-emerald-50'}`}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Supporting Hospital Action Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-bold">
                Supporting Hospital Bed Actions:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onStartStabilization}
                  disabled={isStabilizing || isComplete}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isStabilizing
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isComplete
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isStabilizing ? 'Stabilization in Progress' : 'START STABILIZATION'}</span>
                </button>

                <button
                  type="button"
                  onClick={onCompleteStabilization}
                  disabled={!isStabilizing || isComplete}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : !isStabilizing
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isComplete ? 'STABILIZED & CLEARED' : 'STABILIZATION COMPLETE'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Structured Directives Form */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto bg-white">
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
                    Standard Doctor Directives
                  </label>
                  <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono font-bold">
                    Predefined Protocol
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Transmits peer-to-peer instructions from Parent Hospital trauma specialist to Supporting CHC medical officer.
                </p>

                {/* Structured order pills */}
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(STRUCTURED_DOCTOR_ORDERS) as DoctorStructuredOrder[]).map((key) => {
                    const cfg = STRUCTURED_DOCTOR_ORDERS[key];
                    const isSelected = selectedOrder === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedOrder(key);
                          if (!customText) {
                            setCustomText(cfg.recommendedText);
                          }
                        }}
                        className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-600' : 'bg-slate-300'}`} />
                          <span>{cfg.label}</span>
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono uppercase bg-teal-600 text-white px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Directive Details & Custom Doctor Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Clinical Directive Text
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomText(currentOrderConfig.recommendedText)}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
                  >
                    Reset Recommended
                  </button>
                </div>
                <textarea
                  value={customText || currentOrderConfig.recommendedText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white text-slate-800 resize-none font-sans"
                  placeholder="Enter specific doctor instructions for interim stabilization..."
                />
              </div>

              {/* Safety Disclaimers */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero-Prescription Safety Policy:</strong> Platform acts as a qualified peer clinical communication link. All actions are authorized directly by medical officers.
                </p>
              </div>

              {/* Submit Transmit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Directive to {session.supportingHospitalName}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
