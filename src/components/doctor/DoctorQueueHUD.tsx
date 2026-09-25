import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  PhoneCall, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  UserX, 
  Play, 
  Square, 
  Sparkles, 
  Timer, 
  Activity,
  ArrowRight,
  TrendingDown
} from '../icons';
import { TeleAppointment, QueueStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface DoctorQueueHUDProps {
  doctorId: string;
  onOpenVideoCall?: (appointment: TeleAppointment) => void;
  onOpenPrescriptionModal?: (appointment: TeleAppointment) => void;
}

export const DoctorQueueHUD: React.FC<DoctorQueueHUDProps> = ({
  doctorId,
  onOpenVideoCall,
  onOpenPrescriptionModal
}) => {
  const { 
    appointments, 
    doctorQueues, 
    callNextQueuePatient, 
    startPatientConsultation, 
    endPatientConsultation, 
    markPatientNoShow,
    cancelQueueAppointment 
  } = useApp();

  // Filter doctor's appointments
  const docAppointments = appointments.filter(a => a.doctorId === doctorId);

  // Active consultation
  const activeAppt = docAppointments.find(
    a => a.queueStatus === 'IN_CONSULTATION' || a.status === 'IN_CALL'
  );

  // Called patient (if any summoned but not yet in call)
  const calledAppt = docAppointments.find(
    a => a.queueStatus === 'CALLED' && a.id !== activeAppt?.id
  );

  // Waiting queue sorted by token sequence
  const waitingAppts = docAppointments
    .filter(a => a.queueStatus === 'WAITING')
    .sort((a, b) => (a.tokenSequence || 0) - (b.tokenSequence || 0));

  // Next patient in line
  const nextAppt = calledAppt || waitingAppts[0];

  // Doctor's queue metrics
  const queueState = doctorQueues[doctorId] || {
    doctorId,
    defaultDurationMinutes: 15,
    rollingWindowSize: 5,
    completedDurations: [14, 15, 13],
    currentRollingAvgMinutes: 14.0
  };

  // Live timer for active consultation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeAppt?.actualStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeAppt.actualStartTime).getTime();
    const updateElapsed = () => {
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeAppt?.actualStartTime]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    const summoned = callNextQueuePatient(doctorId);
    if (summoned && onOpenVideoCall) {
      // Optional: doctor can jump directly into video desk
    }
  };

  const handleStartConsult = (appt: TeleAppointment) => {
    startPatientConsultation(appt.id);
    if (onOpenVideoCall) {
      onOpenVideoCall(appt);
    }
  };

  const handleEndConsult = (appt: TeleAppointment) => {
    endPatientConsultation(appt.id);
    if (onOpenPrescriptionModal) {
      onOpenPrescriptionModal(appt);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-800/40 space-y-5">
      {/* Top Banner: HUD Title & Rolling Average Engine Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight font-heading">
                Virtual Queue OPD Command HUD
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Live Dynamic Sync
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Arrival Window Management • Sequential Token Progression • Rolling Average Recalculation
            </p>
          </div>
        </div>

        {/* Rolling Average Consultation Metric */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Rolling Avg Pace (N=5)
            </span>
            <span className="text-base font-black text-teal-300 font-mono">
              {queueState.currentRollingAvgMinutes.toFixed(1)} mins / pt
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid of Key HUD Metrics & Active Desk Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Box 1: Currently In Consultation */}
        <div className={`p-4 rounded-2xl border transition-all ${
          activeAppt 
            ? 'bg-gradient-to-br from-emerald-950/80 to-teal-900/60 border-emerald-500/40 ring-1 ring-emerald-500/30' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Active Desk Consultation
            </span>
            {activeAppt && (
              <span className="font-mono text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/50">
                ⏱ {formatTimer(elapsedSeconds)}
              </span>
            )}
          </div>

          {activeAppt ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-black text-xs">
                      #{activeAppt.tokenNumber}
                    </span>
                    <h4 className="font-black text-sm text-white">{activeAppt.patientName}</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {activeAppt.patientAge}y, {activeAppt.patientGender} • Window: {activeAppt.timeWindow || activeAppt.timeSlot}
                  </p>
                </div>
              </div>

              <div className="text-[11px] bg-black/30 p-2 rounded-xl border border-white/5 text-slate-300 line-clamp-1 italic">
                "{activeAppt.symptoms}"
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenVideoCall && onOpenVideoCall(activeAppt)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Open Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEndConsult(activeAppt)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End & Issue Rx</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-slate-400 text-xs space-y-2">
              <Activity className="w-7 h-7 mx-auto text-slate-500 opacity-60" />
              <p>Doctor desk is currently clear.</p>
              {nextAppt && (
                <button
                  type="button"
                  onClick={() => handleCallNext()}
                  className="py-1.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Next Patient (#{nextAppt.tokenNumber})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Box 2: Next Patient in Queue */}
        <div className={`p-4 rounded-2xl border transition-all ${
          calledAppt 
            ? 'bg-amber-950/40 border-amber-500/40' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">
              {calledAppt ? 'Patient Summoned (Called)' : 'Up Next in Line'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {waitingAppts.length} Waiting in Total
            </span>
          </div>

          {nextAppt ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
                      calledAppt ? 'bg-amber-600 text-white' : 'bg-teal-700 text-white'
                    }`}>
                      #{nextAppt.tokenNumber}
                    </span>
                    <h4 className="font-black text-sm text-white">{nextAppt.patientName}</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Est. Time: <strong className="text-teal-300 font-mono">{nextAppt.estimatedConsultationTime}</strong> • {nextAppt.timeWindow}
                  </p>
                </div>
              </div>

              <div className="text-[11px] bg-black/30 p-2 rounded-xl border border-white/5 text-slate-300 line-clamp-1 italic">
                "{nextAppt.symptoms}"
              </div>

              <div className="flex items-center gap-2 pt-1">
                {!calledAppt && (
                  <button
                    type="button"
                    onClick={() => handleCallNext()}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call to Desk</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleStartConsult(nextAppt)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Consultation</span>
                </button>

                <button
                  type="button"
                  onClick={() => markPatientNoShow(nextAppt.id)}
                  title="Mark patient as No-Show if not responding"
                  className="py-1.5 px-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700/50 font-bold text-xs transition cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-slate-400 text-xs space-y-1">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400 opacity-60" />
              <p>Queue is all caught up!</p>
              <span className="text-[11px] text-slate-500">No more waiting patients for this session.</span>
            </div>
          )}
        </div>

        {/* Box 3: Live Queue Control Hub & Action Buttons */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-teal-400 block mb-2">
              Queue Engine Controls
            </span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Waiting Count</span>
                <span className="text-xl font-black text-teal-300 font-mono">{waitingAppts.length}</span>
              </div>
              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Next Available ETA</span>
                <span className="text-sm font-black text-white font-mono mt-1 block">
                  {nextAppt ? nextAppt.estimatedConsultationTime : 'Available'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={waitingAppts.length === 0}
              onClick={() => handleCallNext()}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                waitingAppts.length > 0 
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:brightness-110 active:scale-98' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Next Patient (#{nextAppt?.tokenNumber || 'None'})</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Dynamic recalculation updates all patient wait times immediately upon call or completion.
            </p>
          </div>
        </div>

      </div>

      {/* Live OPD Queue Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-400" />
            <span>Virtual Queue Live Roster ({docAppointments.length} Total Registered Today)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {waitingAppts.length} Waiting • {docAppointments.filter(a => a.status === 'COMPLETED').length} Completed
          </span>
        </div>

        <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Token #</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Arrival Window</th>
                <th className="py-2.5 px-3">Queue Status</th>
                <th className="py-2.5 px-3">Dynamic ETA</th>
                <th className="py-2.5 px-3">Est. Wait</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {docAppointments.map(appt => {
                const isActive = appt.queueStatus === 'IN_CONSULTATION' || appt.status === 'IN_CALL';
                const isCalled = appt.queueStatus === 'CALLED';
                const isWait = appt.queueStatus === 'WAITING';
                const isDone = appt.queueStatus === 'COMPLETED' || appt.status === 'COMPLETED';
                const isNoShow = appt.queueStatus === 'NO_SHOW';
                const isCancel = appt.queueStatus === 'CANCELLED';

                return (
                  <tr 
                    key={appt.id}
                    className={`hover:bg-white/5 transition-colors ${
                      isActive ? 'bg-emerald-950/40 font-bold' : isCalled ? 'bg-amber-950/30' : ''
                    }`}
                  >
                    {/* Token */}
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded font-black text-xs ${
                        isActive 
                          ? 'bg-emerald-600 text-white' 
                          : isCalled 
                          ? 'bg-amber-600 text-white' 
                          : isDone
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-teal-700 text-white'
                      }`}>
                        #{appt.tokenNumber || `A-${appt.tokenSequence || 1}`}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{appt.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {appt.patientAge}y, {appt.patientGender} • {appt.patientPhone}
                      </div>
                    </td>

                    {/* Window */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {appt.timeWindow || appt.timeSlot}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5 animate-pulse" />
                          In Consultation
                        </span>
                      )}
                      {isCalled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                          <PhoneCall className="w-2.5 h-2.5 animate-bounce" />
                          Called
                        </span>
                      )}
                      {isWait && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Waiting ({appt.patientsAhead ?? 0} ahead)
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          ✓ Completed ({appt.actualDurationMinutes || 14}m)
                        </span>
                      )}
                      {isNoShow && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          No-Show
                        </span>
                      )}
                      {isCancel && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                          Cancelled
                        </span>
                      )}
                    </td>

                    {/* Dynamic ETA */}
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-300">
                      {isActive ? 'Active Now' : isDone ? 'Finished' : (appt.estimatedConsultationTime || 'Calculating...')}
                    </td>

                    {/* Est. Wait */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {isActive ? '0m' : isDone ? '-' : `~${appt.estimatedWaitMinutes ?? 0}m`}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleEndConsult(appt)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                          >
                            End Consult
                          </button>
                        )}
                        {(isWait || isCalled) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartConsult(appt)}
                              className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Start
                            </button>
                            <button
                              type="button"
                              onClick={() => markPatientNoShow(appt.id)}
                              title="Mark No-Show"
                              className="px-2 py-1 rounded bg-rose-900/50 hover:bg-rose-800 text-rose-300 font-bold text-[11px] border border-rose-700/40 transition cursor-pointer"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                        {isDone && onOpenPrescriptionModal && (
                          <button
                            type="button"
                            onClick={() => onOpenPrescriptionModal(appt)}
                            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] transition cursor-pointer"
                          >
                            Rx
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
