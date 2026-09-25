import React, { useState } from 'react';
import { 
  Clock, 
  Video, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  PhoneCall,
  Activity,
  X
} from '../icons';
import { TeleAppointment } from '../../types';
import { useApp } from '../../context/AppContext';

interface VirtualQueueTrackerCardProps {
  appointment: TeleAppointment;
  onJoinCall?: (appointment: TeleAppointment) => void;
  onReviewDoctor?: (appointment: TeleAppointment) => void;
}

export const VirtualQueueTrackerCard: React.FC<VirtualQueueTrackerCardProps> = ({
  appointment,
  onJoinCall,
  onReviewDoctor
}) => {
  const { cancelQueueAppointment } = useApp();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isCalled = appointment.queueStatus === 'CALLED';
  const isInConsultation = appointment.queueStatus === 'IN_CONSULTATION' || appointment.status === 'IN_CALL';
  const isWaiting = appointment.queueStatus === 'WAITING' && !isInConsultation;
  const isCompleted = appointment.queueStatus === 'COMPLETED' || appointment.status === 'COMPLETED';
  const isNoShow = appointment.queueStatus === 'NO_SHOW';
  const isCancelled = appointment.queueStatus === 'CANCELLED' || appointment.status === 'CANCELLED';

  const patientsAhead = appointment.patientsAhead ?? 0;
  const estimatedTime = appointment.estimatedConsultationTime || 'Calculating...';
  const estimatedWaitMins = appointment.estimatedWaitMinutes ?? 15;

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isInConsultation
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300 shadow-md shadow-emerald-100 ring-2 ring-emerald-500/20'
          : isCalled
          ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300 shadow-md shadow-amber-100 ring-2 ring-amber-500/30 animate-pulse-subtle'
          : isCompleted
          ? 'bg-slate-50 border-slate-200'
          : isCancelled || isNoShow
          ? 'bg-rose-50/50 border-rose-200 opacity-80'
          : 'bg-white border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md'
      }`}
    >
      {/* Top Banner for Urgent / Called Callouts */}
      {isCalled && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>DOCTOR IS CALLING YOU NOW</span>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            Token {appointment.tokenNumber}
          </span>
        </div>
      )}

      {isInConsultation && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>CONSULTATION IN PROGRESS</span>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            Room Active
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4">
        {/* Token Header & Doctor Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Queue Token
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-sm font-black font-mono tracking-tight shadow-xs ${
                isInConsultation
                  ? 'bg-emerald-600 text-white'
                  : isCalled
                  ? 'bg-amber-600 text-white'
                  : 'bg-teal-700 text-white'
              }`}>
                #{appointment.tokenNumber || `TK-${appointment.tokenSequence || 1}`}
              </span>
              
              {/* Status Badge */}
              {isInConsultation && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  Live in Call
                </span>
              )}
              {isCalled && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-amber-700 animate-bounce" />
                  Called - Join Desk
                </span>
              )}
              {isWaiting && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" />
                  Waiting in Queue
                </span>
              )}
              {isCompleted && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Completed
                </span>
              )}
              {isNoShow && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  Marked No-Show
                </span>
              )}
              {isCancelled && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                  Cancelled
                </span>
              )}
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {appointment.doctorName}
            </h3>
            <p className="text-xs text-slate-500">
              {appointment.doctorSpecialty} • {appointment.hospitalName}
            </p>
          </div>

          {/* Time Window Chip */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Arrival Window
            </span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md inline-block mt-0.5">
              {appointment.timeWindow || appointment.timeSlot}
            </span>
          </div>
        </div>

        {/* Dynamic Queue HUD Box (For Waiting and Called states) */}
        {(isWaiting || isCalled) && (
          <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/60 rounded-xl p-3.5 border border-teal-100/80">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-teal-200/60">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Patients Ahead</span>
                <p className="text-lg font-black text-teal-900 mt-0.5">
                  {patientsAhead === 0 ? 'Next!' : patientsAhead}
                </p>
                <span className="text-[9px] text-teal-700 block font-medium">
                  {patientsAhead === 0 ? 'You are up next' : `${patientsAhead} in front`}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Estimated Time</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {isCalled ? 'Now' : estimatedTime}
                </p>
                <span className="text-[9px] text-slate-600 block font-medium">
                  {isCalled ? 'Summoned' : 'Dynamic ETA'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Est. Wait</span>
                <p className="text-lg font-black text-teal-800 mt-0.5">
                  {isCalled ? '0m' : `~${estimatedWaitMins}m`}
                </p>
                <span className="text-[9px] text-teal-700 block font-medium">
                  Rolling Avg
                </span>
              </div>
            </div>

            {/* Visual Queue Progression Line */}
            <div className="mt-3.5 pt-3 border-t border-teal-200/50">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1 text-teal-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  Doctor Desk
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {patientsAhead > 0 ? `${patientsAhead} patients ahead` : 'Desk ready for your turn'}
                </span>
                <span className="flex items-center gap-1 text-slate-900 font-extrabold">
                  You (Token #{appointment.tokenNumber})
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                </span>
              </div>

              {/* Graphical Progress Track */}
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 rounded-full ${
                    isCalled 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 w-full' 
                      : patientsAhead === 0 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 w-[85%]' 
                      : patientsAhead === 1
                      ? 'bg-gradient-to-r from-teal-500 to-teal-400 w-[55%]'
                      : 'bg-teal-500 w-[30%]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
                <span>00:00 (Active)</span>
                <span>Dynamic Window Recalculation active</span>
                <span>{appointment.timeWindow}</span>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms & Urgency */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5">
          <div className="text-teal-600 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs space-y-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Reported Symptoms:</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                appointment.urgency === 'PRIORITY' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {appointment.urgency}
              </span>
            </div>
            <p className="text-slate-600 line-clamp-2">
              {appointment.symptoms}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Booked: {appointment.bookedAt}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Join Video Call Button for Called or In Consultation */}
            {(isCalled || isInConsultation) && onJoinCall && (
              <button
                type="button"
                onClick={() => onJoinCall(appointment)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2 cursor-pointer animate-bounce-subtle"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Video Room Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Waiting Actions: Preview or Cancel */}
            {isWaiting && (
              <>
                {showCancelConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-rose-600 font-bold">Cancel token?</span>
                    <button
                      type="button"
                      onClick={() => {
                        cancelQueueAppointment(appointment.id);
                        setShowCancelConfirm(false);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
                  >
                    Cancel Booking
                  </button>
                )}

                {onJoinCall && (
                  <button
                    type="button"
                    onClick={() => onJoinCall(appointment)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-teal-600 text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Enter Waiting Room</span>
                  </button>
                )}
              </>
            )}

            {/* Review Button for Completed */}
            {isCompleted && onReviewDoctor && (
              <button
                type="button"
                onClick={() => onReviewDoctor(appointment)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer"
              >
                <span>⭐ Rate & Review Doctor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
