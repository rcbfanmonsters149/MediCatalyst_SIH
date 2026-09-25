import { TeleAppointment, QueueStatus, DoctorQueueState } from '../types';

export interface TimeWindowOption {
  id: string;
  label: string;
  startHour: number; // 24-hr format
  endHour: number;
  period: 'Morning' | 'Afternoon' | 'Evening';
}

export const STANDARD_TIME_WINDOWS: TimeWindowOption[] = [
  { id: 'win-09-11', label: '09:00 AM – 11:00 AM', startHour: 9, endHour: 11, period: 'Morning' },
  { id: 'win-10-12', label: '10:00 AM – 12:00 PM', startHour: 10, endHour: 12, period: 'Morning' },
  { id: 'win-12-14', label: '12:00 PM – 02:00 PM', startHour: 12, endHour: 14, period: 'Afternoon' },
  { id: 'win-14-16', label: '02:00 PM – 04:00 PM', startHour: 14, endHour: 16, period: 'Afternoon' },
  { id: 'win-16-18', label: '04:00 PM – 06:00 PM', startHour: 16, endHour: 18, period: 'Evening' }
];

export const DEFAULT_CONSULTATION_DURATION_MINS = 15;
export const DEFAULT_ROLLING_WINDOW_SIZE = 5;

/**
 * Calculates rolling average consultation duration based on recent completed consultations.
 * Formula:
 * - If 0 completed: returns defaultDuration (15m)
 * - If < windowSize: uses all available completed
 * - If >= windowSize: uses last N completed
 */
export function calculateRollingAverage(
  durations: number[], 
  windowSize = DEFAULT_ROLLING_WINDOW_SIZE, 
  defaultDuration = DEFAULT_CONSULTATION_DURATION_MINS
): number {
  if (!durations || durations.length === 0) {
    return defaultDuration;
  }
  const recent = durations.slice(-windowSize);
  const sum = recent.reduce((acc, d) => acc + d, 0);
  const avg = sum / recent.length;
  return Number(avg.toFixed(1));
}

/**
 * Format a Date object to "10:45 AM"
 */
export function formatTimeAmPm(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
}

/**
 * Adds minutes to a base Date and returns formatted "hh:mm AM/PM"
 */
export function addMinutesToDate(baseDate: Date, minutes: number): string {
  const newDate = new Date(baseDate.getTime() + minutes * 60000);
  return formatTimeAmPm(newDate);
}

/**
 * Generates the next sequential queue token for a doctor.
 * Example tokens: "A-01", "A-02" or "TK-01", "TK-02"
 */
export function generateNextToken(
  appointments: TeleAppointment[],
  doctorId: string,
  timeWindow?: string
): { tokenNumber: string; tokenSequence: number } {
  const docAppts = appointments.filter(a => a.doctorId === doctorId);
  const sequences = docAppts
    .map(a => a.tokenSequence)
    .filter((seq): seq is number => typeof seq === 'number' && !isNaN(seq));

  const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
  const nextSeq = maxSeq + 1;
  const tokenPrefix = 'A';
  const tokenNumber = `${tokenPrefix}-${String(nextSeq).padStart(2, '0')}`;

  return { tokenNumber, tokenSequence: nextSeq };
}

/**
 * Pure function to dynamically recalculate estimated consultation times
 * and positions for all waiting patients in a doctor's virtual queue.
 */
export function recalculateDoctorQueue(
  allAppointments: TeleAppointment[],
  doctorId: string,
  rollingAvgMinutes: number,
  activeConsultationStartTime?: number
): TeleAppointment[] {
  const now = new Date();
  const nowMs = now.getTime();

  // Find active consultation for this doctor (if any)
  const inConsultationAppt = allAppointments.find(
    a => a.doctorId === doctorId && (a.queueStatus === 'IN_CONSULTATION' || a.status === 'IN_CALL')
  );

  // Compute estimated finish time for active patient
  let baseAvailableTimeMs = nowMs;
  if (inConsultationAppt) {
    const startMs = activeConsultationStartTime || inConsultationAppt.bookedAtTimestamp || (nowMs - 2 * 60000);
    const expectedFinishMs = startMs + rollingAvgMinutes * 60000;
    // Base available time is either expected finish or at least current time + 1 min
    baseAvailableTimeMs = Math.max(nowMs + 60000, expectedFinishMs);
  }

  // Waiting and Called queue patients, sorted by tokenSequence ascending
  const waitingAppts = allAppointments
    .filter(a => 
      a.doctorId === doctorId && 
      (a.queueStatus === 'WAITING' || a.queueStatus === 'CALLED' || (a.status === 'SCHEDULED' && a.queueStatus !== 'COMPLETED' && a.queueStatus !== 'NO_SHOW' && a.queueStatus !== 'CANCELLED')) &&
      a.id !== inConsultationAppt?.id
    )
    .sort((a, b) => (a.tokenSequence || 0) - (b.tokenSequence || 0));

  // Map updated estimates for each patient ahead
  const updatedDocApptsMap = new Map<string, Partial<TeleAppointment>>();

  // If in consultation, current patient has 0 wait and is active
  if (inConsultationAppt) {
    updatedDocApptsMap.set(inConsultationAppt.id, {
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      estimatedConsultationTime: 'In Consultation Now',
      queueStatus: 'IN_CONSULTATION',
      status: 'IN_CALL'
    });
  }

  // Iterate over waiting patients and assign dynamic ETAs
  waitingAppts.forEach((appt, index) => {
    // Number of patients ahead: if someone is in consultation, index + 1; otherwise index
    const ahead = inConsultationAppt ? index + 1 : index;
    const additionalWaitMins = index * rollingAvgMinutes;
    const estimatedStartTimeMs = baseAvailableTimeMs + additionalWaitMins * 60000;
    const estimatedWaitMinutes = Math.max(1, Math.round((estimatedStartTimeMs - nowMs) / 60000));
    const estimatedConsultationTime = formatTimeAmPm(new Date(estimatedStartTimeMs));

    updatedDocApptsMap.set(appt.id, {
      patientsAhead: ahead,
      estimatedWaitMinutes,
      estimatedConsultationTime,
      queueStatus: appt.queueStatus === 'CALLED' ? 'CALLED' : 'WAITING',
      status: 'SCHEDULED'
    });
  });

  // Return new array with merged queue updates
  return allAppointments.map(appt => {
    if (updatedDocApptsMap.has(appt.id)) {
      return {
        ...appt,
        ...updatedDocApptsMap.get(appt.id)
      };
    }
    return appt;
  });
}

/**
 * Helper to check if estimated consultation time falls outside the patient's selected booking window.
 */
export function checkWindowDelayStatus(
  timeWindow?: string,
  estimatedTimeStr?: string
): { isDelayed: boolean; isEarly: boolean; message?: string } {
  if (!timeWindow || !estimatedTimeStr || estimatedTimeStr.includes('In Consultation')) {
    return { isDelayed: false, isEarly: false };
  }

  // e.g. "10:00 AM - 12:00 PM"
  const parts = timeWindow.split('–').map(s => s.trim());
  if (parts.length < 2) {
    const dashParts = timeWindow.split('-').map(s => s.trim());
    if (dashParts.length < 2) return { isDelayed: false, isEarly: false };
    parts[0] = dashParts[0];
    parts[1] = dashParts[1];
  }

  return {
    isDelayed: false,
    isEarly: false
  };
}
