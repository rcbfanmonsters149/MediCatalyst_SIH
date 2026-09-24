import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Building2, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Video, 
  Plus, 
  Search, 
  User, 
  ShieldCheck, 
  X, 
  ArrowRight,
  Filter,
  Sparkles,
  ExternalLink,
  Activity,
  Check
} from '../components/icons';
import { useApp, DEFAULT_DOCTOR_SLOTS } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { DoctorOnDuty, Hospital, TeleAppointment, UrgencyType } from '../types';
import { VideoConsultModal } from '../components/teleconsult/VideoConsultModal';

type ConsultMode = 'INSTANT' | 'SCHEDULE';

export const TeleConsultPage: React.FC = () => {
  const { 
    user, 
    hospitals, 
    appointments, 
    bookAppointment, 
    initiateInstantConsultation,
    updateAppointmentStatus 
  } = useApp();
  const { tr, language } = useLanguage();

  const [consultMode, setConsultMode] = useState<ConsultMode>('INSTANT');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<{ doctor: DoctorOnDuty; hospital: Hospital } | null>(null);
  const [instantDoctorModal, setInstantDoctorModal] = useState<{ doctor: DoctorOnDuty; hospital: Hospital } | null>(null);
  const [instantSymptom, setInstantSymptom] = useState<string>('');
  const [activeCallAppt, setActiveCallAppt] = useState<TeleAppointment | null>(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<TeleAppointment | null>(null);

  // Form States for Advance Booking
  const [selectedDate, setSelectedDate] = useState<'Today' | 'Tomorrow' | 'Day After'>('Today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM - 10:30 AM');
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyType>('ROUTINE');
  const [consultType, setConsultType] = useState<'VIDEO' | 'AUDIO'>('VIDEO');

  // Compile all doctors across all available hospitals
  const allDoctors = hospitals.flatMap(h => 
    h.doctorsOnDuty.map(d => ({ doctor: d, hospital: h }))
  );

  const specialties = [
    { id: 'ALL', label: 'All Specialties' },
    { id: 'General OPD & Emergency', label: 'General Medicine' },
    { id: 'Internal Medicine', label: 'Internal Medicine' },
    { id: '24x7 Emergency & Trauma', label: 'Trauma & Emergency' },
    { id: 'Maternity & C-Section OT', label: 'Gynecology & Maternity' },
    { id: 'Pediatric ICU (NICU)', label: 'Pediatrics' },
    { id: '24x7 Cath Lab & Heart Failure', label: 'Cardiology' },
    { id: 'Neurosurgery & Critical Trauma', label: 'Neurosurgery' }
  ];

  const filteredDoctors = allDoctors.filter(({ doctor, hospital }) => {
    const matchesSpecialty = selectedSpecialty === 'ALL' || 
      doctor.department?.includes(selectedSpecialty) || 
      doctor.designation.includes(selectedSpecialty);
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  // Filter appointments for current patient
  const myAppointments = appointments.filter(a => 
    a.patientId === user.id || a.patientAbhaId === user.healthId || a.patientName === user.fullName
  );

  const quickSymptoms = [
    'Fever and chills for 2 days',
    'Persistent dry cough & sore throat',
    'Headache and dizziness',
    'Stomach ache and nausea',
    'Hypertension follow-up consultation',
    'Joint pain and swelling'
  ];

  // Handler for Confirming Advance Booking
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    if (!symptomsInput.trim()) {
      alert('Please describe your symptoms or reason for consultation.');
      return;
    }

    const created = bookAppointment({
      patientId: user.id,
      patientName: user.fullName,
      patientPhone: user.phone,
      patientAbhaId: user.healthId,
      patientAge: user.age,
      patientGender: user.gender,
      patientBloodGroup: user.bloodGroup,
      doctorId: bookingDoctor.doctor.id,
      doctorName: bookingDoctor.doctor.name,
      doctorSpecialty: `${bookingDoctor.doctor.designation} (${bookingDoctor.doctor.department || 'OPD'})`,
      hospitalId: bookingDoctor.hospital.id,
      hospitalName: bookingDoctor.hospital.name,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      symptoms: symptomsInput.trim(),
      urgency,
      consultationType: consultType
    });

    setBookingDoctor(null);
    setSymptomsInput('');
    setBookingSuccessModal(created);
  };

  // Handler for Launching Instant Consultation
  const handleLaunchInstantCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantDoctorModal) return;

    const symptomText = instantSymptom.trim() || 'Instant Tele-OPD Video Consultation Request';
    const appt = initiateInstantConsultation(instantDoctorModal.doctor.id, symptomText);
    
    setInstantDoctorModal(null);
    setInstantSymptom('');
    setActiveCallAppt(appt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-lg overflow-hidden border border-teal-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>National e-Sanjeevani Tele-OPD Infrastructure</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-heading">
            Government Tele-Consultation OPD
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-2xl leading-relaxed">
            Connect immediately with certified on-duty medical officers or schedule a video OPD appointment beforehand. Fast, consent-based, and integrated with Ayushman Bharat (ABHA).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-teal-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Free Government Service (NHM / Ayushman Bharat)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Digital Rx Minted to Blockchain</span>
            </div>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none hidden md:block">
          <Stethoscope className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 2. MODE SELECTOR: Meet Now vs Schedule Ahead */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={() => setConsultMode('INSTANT')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            consultMode === 'INSTANT'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-base">⚡</span>
          <span>Meet Doctor Now (Instant Video Call)</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${
            consultMode === 'INSTANT' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            Live Wait &lt; 2m
          </span>
        </button>

        <button
          type="button"
          onClick={() => setConsultMode('SCHEDULE')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            consultMode === 'SCHEDULE'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Appointment (Advance Booking)</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${
            consultMode === 'SCHEDULE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            Choose Specific Slot
          </span>
        </button>
      </div>

      {/* 3. MY CONSULTATIONS QUEUE */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>My Consultations & Bookings Queue</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active video consultation rooms and scheduled appointments for {user.fullName}.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
            {myAppointments.length} Bookings
          </span>
        </div>

        {myAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAppointments.map(appt => {
              const isScheduled = appt.status === 'SCHEDULED' || appt.status === 'IN_CALL';
              const isCompleted = appt.status === 'COMPLETED';
              const isInstant = appt.isInstantConsult;

              return (
                <div 
                  key={appt.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isInstant && isScheduled
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20'
                      : isScheduled 
                        ? 'bg-teal-50/50 border-teal-200 ring-1 ring-teal-500/20' 
                        : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {appt.id.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isInstant && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            ⚡ Instant
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isScheduled 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                            : isCompleted
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-200 text-slate-600'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        {appt.doctorName}
                      </h4>
                      <p className="text-xs text-teal-700 font-semibold">
                        {appt.doctorSpecialty}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {appt.hospitalName}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{appt.date}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-blue-700 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{appt.timeSlot}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic line-clamp-1">
                        "{appt.symptoms}"
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    {isScheduled ? (
                      <button
                        type="button"
                        onClick={() => setActiveCallAppt(appt)}
                        className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                          isInstant ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span>{isInstant ? 'Enter Instant Video Room' : 'Join Video Consultation Call'}</span>
                      </button>
                    ) : (
                      <div className="text-center text-xs font-bold text-emerald-700 py-1 flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Consultation Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>You have no active appointments booked yet. Choose an on-duty doctor below to start or schedule a consultation.</p>
          </div>
        )}
      </div>

      {/* 4. DOCTOR DIRECTORY: Mode A (Instant) vs Mode B (Schedule) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                {consultMode === 'INSTANT' ? 'Meet an On-Duty Doctor Right Now' : 'Schedule a Tele-OPD Consultation Slot'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {consultMode === 'INSTANT' 
                ? 'Doctors currently logged in and ready for immediate 1-on-1 video consultations.' 
                : 'Select an on-duty specialist and choose from their active consultation hours.'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text"
              placeholder="Search doctor or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Specialty Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {specialties.map(spec => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedSpecialty === spec.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map(({ doctor, hospital }) => {
            const sched = doctor.scheduleSettings;
            const isAvailableForInstant = (!sched || sched.dutyMode === 'AVAILABLE') && doctor.available && sched?.readyForInstantConsult !== false;
            const isInEmergency = sched?.dutyMode === 'HOSPITAL_EMERGENCY';
            const isOnLeave = sched?.dutyMode === 'ON_LEAVE';
            const isOffDuty = sched?.dutyMode === 'OFF_DUTY' || !doctor.available;

            return (
              <div 
                key={`${hospital.id}-${doctor.id}`}
                className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                  isAvailableForInstant
                    ? 'bg-white border-emerald-200 hover:border-emerald-400 shadow-xs hover:shadow-md ring-1 ring-emerald-500/10'
                    : isInEmergency
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      : isOnLeave
                        ? 'bg-purple-50/40 border-purple-200'
                        : 'bg-slate-50 border-slate-200 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shrink-0 text-white ${
                        isAvailableForInstant
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : isInEmergency
                            ? 'bg-gradient-to-br from-rose-500 to-red-600'
                            : isOnLeave
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                              : 'bg-slate-400'
                      }`}>
                        {doctor.name.replace('Dr. ', '').charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">
                          {doctor.name}
                        </h4>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">
                          {doctor.designation}
                        </p>
                      </div>
                    </div>

                    {/* Status Ribbon */}
                    <div className="shrink-0">
                      {isAvailableForInstant && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Available Now</span>
                        </span>
                      )}
                      {isInEmergency && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <span>🚨 In Emergency OT</span>
                        </span>
                      )}
                      {isOnLeave && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                          <span>🏖️ On Leave</span>
                        </span>
                      )}
                      {isOffDuty && !isInEmergency && !isOnLeave && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Off Duty
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hospital & Location Details */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{hospital.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Shift: {doctor.shift}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-teal-700 font-semibold">
                        OPD Room: {doctor.roomNumber || 'Room 101'}
                      </span>
                      {sched?.availableTimeSlots && (
                        <span className="font-mono text-slate-500 text-[10px]">
                          {sched.availableTimeSlots.length} slots active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Advisory Notice (if in emergency or on leave) */}
                  {isInEmergency && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 space-y-0.5">
                      <span className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Resuming in {sched?.emergencyEstimatedResume || '~45 mins'}</span>
                      </span>
                      <p className="text-rose-700 text-[10px]">
                        "{sched?.emergencyNote || 'Operating in Emergency OT. Live calls delayed.'}"
                      </p>
                    </div>
                  )}

                  {isOnLeave && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 space-y-0.5">
                      <span className="font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>On Leave ({sched?.leaveDate || 'Today'})</span>
                      </span>
                      <p className="text-purple-700 text-[10px]">
                        "{sched?.leaveReason || 'Official approved leave.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Button Based on Mode */}
                <div className="pt-2">
                  {consultMode === 'INSTANT' ? (
                    isAvailableForInstant ? (
                      <button
                        type="button"
                        onClick={() => setInstantDoctorModal({ doctor, hospital })}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span className="text-sm">⚡</span>
                        <span>Meet Doctor Now (&lt; 2 min wait)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConsultMode('SCHEDULE');
                          setBookingDoctor({ doctor, hospital });
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Book Advance Slot Instead</span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookingDoctor({ doctor, hospital })}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Tele-Consult Slot</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 5. INSTANT VIDEO CALL CONFIRMATION MODAL */}
      {instantDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-heading">
                    Instant Video Consultation
                  </h3>
                  <p className="text-xs text-teal-100">
                    Connecting with {instantDoctorModal.doctor.name} ({instantDoctorModal.hospital.name})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInstantDoctorModal(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleLaunchInstantCall} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Doctor is currently Online and Ready at OPD Desk</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Room: {instantDoctorModal.doctor.roomNumber || 'Room 101'} • Average connection time: ~30 seconds.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Describe Your Current Symptoms or Urgent Need *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sudden severe fever with headache, nausea, and dehydration for the last 4 hours..."
                  value={instantSymptom}
                  onChange={(e) => setInstantSymptom(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  required
                />
              </div>

              {/* Quick Symptom Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Quick Select:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSymptoms.slice(0, 4).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInstantSymptom(s)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInstantDoctorModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Connect to Video Room Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADVANCE APPOINTMENT BOOKING MODAL */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-heading">
                    Schedule Tele-Consultation
                  </h3>
                  <p className="text-xs text-teal-100">
                    With {bookingDoctor.doctor.name} ({bookingDoctor.hospital.name})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBookingDoctor(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Emergency Advisory if doctor is in OT */}
              {bookingDoctor.doctor.scheduleSettings?.dutyMode === 'HOSPITAL_EMERGENCY' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Doctor is currently in Emergency OT ({bookingDoctor.doctor.scheduleSettings.emergencyEstimatedResume || '~45 mins'}). Advance bookings will be attended once emergency duty concludes.
                  </span>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  1. Select Consultation Date *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Today', 'Tomorrow', 'Day After'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer text-center ${
                        selectedDate === d
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Time Slot Selection from Doctor's Active Slots */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    2. Choose Available Time Slot *
                  </label>
                  <span className="text-[10px] text-teal-700 font-mono font-semibold">
                    Doctor's Active Hours
                  </span>
                </div>

                {(() => {
                  const slots = bookingDoctor.doctor.scheduleSettings?.availableTimeSlots || DEFAULT_DOCTOR_SLOTS;
                  if (slots.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-center text-xs">
                        Doctor has no active slots remaining for today. Please select Tomorrow or another doctor.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-2.5 rounded-xl font-mono text-[11px] font-bold transition cursor-pointer text-center ${
                            selectedTimeSlot === slot
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Symptoms Input */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  3. Describe Symptoms / Chief Complaint *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your health problem, duration, or any fever/pain..."
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  required
                />
              </div>

              {/* Quick Symptoms Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Quick Select Common Symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSymptoms.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSymptomsInput(s)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency and Consultation Mode */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Case Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="ROUTINE">Routine OPD</option>
                    <option value="PRIORITY">Priority (High Pain / Fever)</option>
                    <option value="FOLLOW_UP">Post-Discharge Follow Up</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Mode
                  </label>
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-teal-600" />
                    <span>HD Video Consultation</span>
                  </div>
                </div>
              </div>

              {/* Patient Info Footer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Booking for: {user.fullName}</span>
                  <p className="text-slate-500">ABHA: {user.healthId} • {user.phone}</p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Consent Granted
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingDoctor(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Book Slot</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. BOOKING SUCCESS PASS MODAL */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-extrabold text-xl text-slate-900 font-heading">
                Tele-OPD Slot Reserved!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your consultation has been confirmed in the e-Sanjeevani registry.
              </p>
            </div>

            {/* Pass details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Appointment ID:</span>
                <span className="font-mono font-bold text-slate-800">{bookingSuccessModal.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Consulting Doctor:</span>
                <span className="font-bold text-teal-800">{bookingSuccessModal.doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Hospital:</span>
                <span className="text-slate-800">{bookingSuccessModal.hospitalName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-bold text-blue-700">{bookingSuccessModal.date} ({bookingSuccessModal.timeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="text-slate-800">{bookingSuccessModal.patientName} ({bookingSuccessModal.patientAbhaId})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBookingSuccessModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Pass
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetAppt = bookingSuccessModal;
                  setBookingSuccessModal(null);
                  setActiveCallAppt(targetAppt);
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                <span>Test Video Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ACTIVE VIDEO CONSULTATION MODAL */}
      {activeCallAppt && (
        <VideoConsultModal
          isOpen={!!activeCallAppt}
          onClose={() => setActiveCallAppt(null)}
          appointment={activeCallAppt}
          userRole="CITIZEN"
          onConsultationCompleted={(apptId) => {
            updateAppointmentStatus(apptId, 'COMPLETED');
            setActiveCallAppt(null);
          }}
        />
      )}

    </div>
  );
};
