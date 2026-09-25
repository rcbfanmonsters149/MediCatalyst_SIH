import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  User, 
  Award, 
  Star, 
  Clock, 
  Building2, 
  ShieldCheck, 
  CheckCircle, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Video, 
  FileText, 
  Phone, 
  Filter,
  MessageSquare,
  AlertCircle
} from '../icons';
import { useApp, DEFAULT_DOCTOR_SLOTS, createDefaultScheduleSettings } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { DoctorDutyMode, DoctorPatientReview } from '../../types';

export const DoctorProfileTab: React.FC = () => {
  const { doctorUser, updateDoctorScheduleSettings, submitDoctorReview } = useApp();
  const { language } = useLanguage();

  const [activeSubSection, setActiveSubSection] = useState<'ratings' | 'credentials' | 'availability'>('ratings');
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'ALL'>('ALL');
  const [customSlotInput, setCustomSlotInput] = useState('');
  const [customSlotStart, setCustomSlotStart] = useState('06:00 PM');
  const [customSlotEnd, setCustomSlotEnd] = useState('06:30 PM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demo Patient Review Form Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewPatientName, setNewReviewPatientName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewType, setNewReviewType] = useState<'VIDEO' | 'AUDIO' | 'IN_PERSON' | 'EMERGENCY'>('VIDEO');
  const [newReviewSelectedTags, setNewReviewSelectedTags] = useState<string[]>(['Clear Advice', 'Punctual']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!doctorUser) return null;

  const profile = doctorUser.profile;
  const schedule = doctorUser.scheduleSettings || createDefaultScheduleSettings();
  const availableSlots = schedule.availableTimeSlots || [];
  const readyForCalls = schedule.readyForInstantConsult ?? true;
  const dutyMode = schedule.dutyMode || 'AVAILABLE';

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    if (!profile?.reviews) return [];
    if (reviewFilterRating === 'ALL') return profile.reviews;
    return profile.reviews.filter(r => r.rating === reviewFilterRating);
  }, [profile?.reviews, reviewFilterRating]);

  // Standard preset slots
  const standardMorning = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM'
  ];
  const standardAfternoon = [
    '01:30 PM - 02:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:30 PM - 04:00 PM'
  ];
  const standardEvening = [
    '04:00 PM - 04:30 PM',
    '04:30 PM - 05:00 PM',
    '05:00 PM - 05:30 PM',
    '05:30 PM - 06:00 PM',
    '06:00 PM - 06:30 PM',
    '06:30 PM - 07:00 PM'
  ];

  // Slot management
  const handleToggleSlot = (slot: string) => {
    const isPresent = availableSlots.includes(slot);
    let nextSlots: string[];
    if (isPresent) {
      nextSlots = availableSlots.filter(s => s !== slot);
      showToast(`Slot removed: ${slot}`);
    } else {
      nextSlots = [...availableSlots, slot];
      showToast(`Slot added: ${slot}`);
    }
    updateDoctorScheduleSettings({ availableTimeSlots: nextSlots });
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = `${customSlotStart.trim()} - ${customSlotEnd.trim()}`;
    if (!formatted.trim()) return;
    if (availableSlots.includes(formatted)) {
      showToast('This time slot already exists.');
      return;
    }
    const nextSlots = [...availableSlots, formatted];
    updateDoctorScheduleSettings({ availableTimeSlots: nextSlots });
    showToast(`Added custom call slot: ${formatted}`);
  };

  const handleQuickPresetSlots = (action: 'ALL_MORNING' | 'ALL_AFTERNOON' | 'ALL_EVENING' | 'STANDARD' | 'CLEAR') => {
    let nextSlots: string[] = [];
    if (action === 'STANDARD') {
      nextSlots = [...DEFAULT_DOCTOR_SLOTS];
    } else if (action === 'ALL_MORNING') {
      nextSlots = Array.from(new Set([...availableSlots, ...standardMorning]));
    } else if (action === 'ALL_AFTERNOON') {
      nextSlots = Array.from(new Set([...availableSlots, ...standardAfternoon]));
    } else if (action === 'ALL_EVENING') {
      nextSlots = Array.from(new Set([...availableSlots, ...standardEvening]));
    } else if (action === 'CLEAR') {
      nextSlots = [];
    }

    updateDoctorScheduleSettings({ availableTimeSlots: nextSlots });
    showToast(`Time slots updated: ${nextSlots.length} active slots.`);
  };

  const handleToggleInstantCalls = () => {
    const nextCalls = !readyForCalls;
    updateDoctorScheduleSettings({
      readyForInstantConsult: nextCalls,
      dutyMode: nextCalls ? 'AVAILABLE' : dutyMode
    });
    showToast(`Instant video/audio calls ${nextCalls ? 'ENABLED' : 'PAUSED'}.`);
  };

  // Submit new review from demo modal
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewPatientName.trim() || !newReviewComment.trim()) {
      alert('Please fill out patient name and feedback comment.');
      return;
    }

    submitDoctorReview(doctorUser.id, {
      patientName: newReviewPatientName.trim(),
      patientAbhaMasked: `ABHA: 91-****-${Math.floor(1000 + Math.random() * 9000)}`,
      rating: newReviewRating,
      consultationType: newReviewType,
      tags: newReviewSelectedTags,
      comment: newReviewComment.trim(),
      isVerifiedPatient: true
    });

    setShowReviewModal(false);
    setNewReviewPatientName('');
    setNewReviewComment('');
    showToast('Patient feedback submitted and added to doctor profile!');
  };

  const availableTags = [
    'Clear Advice',
    'Punctual & Polite',
    'Prescription Clarity',
    'Patient Listener',
    'Accurate Diagnosis',
    'Fast Response',
    'Compassionate'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Profile Header Hero Card with Distinct Boundaries */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Doctor Avatar & Identity Block */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 shrink-0 relative">
              <Stethoscope className="w-10 h-10" />
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                  {doctorUser.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
                  {profile?.primaryDegree || doctorUser.designation}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>ABHA Verified Doctor</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">{doctorUser.hospitalName}</span>
                <span>•</span>
                <span>{doctorUser.department}</span>
                {doctorUser.roomNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {doctorUser.roomNumber}
                    </span>
                  </>
                )}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <strong>{profile?.experienceYears || 12}+ Years</strong> Clinical Experience
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Reg No: <strong className="text-slate-700">{profile?.medicalCouncilRegNo || 'NMC-2016-084920'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Call Availability Toggle Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Call Reception Mode:
              </span>
              <button
                type="button"
                onClick={handleToggleInstantCalls}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  readyForCalls ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    readyForCalls ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {readyForCalls ? '🟢 Free to accept incoming tele-consults' : '⏸️ Incoming tele-consults paused'}
            </p>
          </div>

        </div>

        {/* Section Navigation Tabs with Distinct Boundaries */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubSection('ratings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubSection === 'ratings'
                  ? 'bg-white text-teal-700 shadow-xs border border-teal-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Patient Ratings & Feedback ({profile?.totalReviews || 148})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('credentials')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubSection === 'credentials'
                  ? 'bg-white text-teal-700 shadow-xs border border-teal-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Medical Degrees & Credentials</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('availability')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubSection === 'availability'
                  ? 'bg-white text-teal-700 shadow-xs border border-teal-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Edit Call Availability & Timings ({availableSlots.length} slots)</span>
            </button>
          </div>

          {activeSubSection === 'ratings' && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Patient Feedback (Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-SECTION 1: Patient Ratings & Reviews Collected from Patients */}
      {activeSubSection === 'ratings' && (
        <div className="space-y-6">
          
          {/* Ratings Metric Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Overall Rating Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Patient Rating Score
              </span>
              <div className="flex items-baseline gap-1 text-slate-900">
                <span className="text-5xl font-black font-heading text-teal-700">
                  {profile?.averageRating || 4.9}
                </span>
                <span className="text-slate-400 text-lg font-bold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Based on <strong>{profile?.totalReviews || 148}</strong> verified patient tele-consultations
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{profile?.recommendationRate || 98}% Recommend This Doctor</span>
                </span>
              </div>
            </div>

            {/* Rating Breakdown Histogram */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Rating Distribution
              </span>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = profile?.ratingDistribution?.[star as 1 | 2 | 3 | 4 | 5] || (star === 5 ? 130 : star === 4 ? 14 : star === 3 ? 3 : 1);
                const total = profile?.totalReviews || 148;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-10 font-bold text-slate-700 flex items-center gap-0.5">
                      <span>{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-[11px] text-slate-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Clinical Sentiment Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Patient Feedback Benchmarks
              </span>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Diagnosis & Care Accuracy</span>
                  <span className="font-black text-teal-700 font-mono">99.4%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Prescription & Advice Clarity</span>
                  <span className="font-black text-emerald-700 font-mono">100%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Punctuality & Response Time</span>
                  <span className="font-black text-indigo-700 font-mono">&lt; 3 mins</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Patient Empathy & Bedside</span>
                  <span className="font-black text-teal-700 font-mono">98.8%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Patient Reviews Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading">
                  Patient Reviews & Testimonials
                </h3>
                <p className="text-xs text-slate-500">
                  Real feedback collected from patients following tele-consultations and clinical appointments.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold mr-1 flex items-center gap-1 text-[11px]">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                {(['ALL', 5, 4] as const).map((opt) => (
                  <button
                    key={String(opt)}
                    type="button"
                    onClick={() => setReviewFilterRating(opt)}
                    className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer text-xs ${
                      reviewFilterRating === opt
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt === 'ALL' ? 'All Reviews' : `${opt} Stars`}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Reviews */}
            <div className="space-y-3.5">
              {filteredReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No reviews matching this filter.
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-extrabold text-xs flex items-center justify-center border border-teal-200">
                          {rev.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{rev.patientName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{rev.patientAbhaMasked}</span>
                            {rev.isVerifiedPatient && (
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Verified Patient
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{rev.date}</span>
                            <span>•</span>
                            <span className="capitalize">{rev.consultationType.toLowerCase()} Consultation</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                          />
                        ))}
                        <span className="ml-1 text-xs font-black text-amber-900">{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-10">
                      "{rev.comment}"
                    </p>

                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-10 pt-1">
                        {rev.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* SUB-SECTION 2: Doctor Academic Degrees, Registrations & Clinical Bio */}
      {activeSubSection === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Academic Degrees & Certifications */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                <span>Medical Qualifications & Certified Degrees</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verified medical degrees and academic registrations recognized by the National Medical Commission (NMC).
              </p>
            </div>

            <div className="space-y-3">
              {profile?.degrees?.map((deg, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl border border-teal-100 bg-teal-50/40 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{deg}</h4>
                    <p className="text-[11px] text-teal-800 font-medium">
                      Verified & Linked to National Healthcare Provider Registry (HPR)
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Specializations & Competencies */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Clinical Specializations & Key Competencies
              </span>
              <div className="flex flex-wrap gap-2">
                {profile?.specializations?.map((spec) => (
                  <span 
                    key={spec}
                    className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    🩺 {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Spoken */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Languages Spoken in Consultations
              </span>
              <div className="flex flex-wrap gap-2">
                {profile?.languagesSpoken?.map((lang) => (
                  <span 
                    key={lang}
                    className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                  >
                    🌐 {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Registry & Hospital Affiliation Sidebar */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Government Registry Verifications
              </span>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">State Medical Council Reg No.</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    {profile?.medicalCouncilRegNo || 'NMC-2016-084920'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">✓ Verified Active Practitioner</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ABDM Health Professional ID (HPR)</span>
                  <p className="font-mono font-bold text-teal-700 text-sm">
                    {profile?.abhaHprId || 'HPR-2026-99210@abdm'}
                  </p>
                  <p className="text-[10px] text-teal-700 font-semibold">✓ National Digital Health Stack Connected</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Charges</span>
                  <p className="font-bold text-emerald-700 text-sm">
                    {profile?.consultationFee || 'Free / Govt. Sponsored (ABHA OPD)'}
                  </p>
                  <p className="text-[10px] text-slate-500">Universal Health Coverage Tele-Medicine</p>
                </div>
              </div>
            </div>

            {/* Doctor Bio Statement */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Physician Bio & Statement
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                "{profile?.bio || 'Dedicated medical practitioner serving primary healthcare and tele-consultation OPDs.'}"
              </p>
            </div>

          </div>

        </div>
      )}

      {/* SUB-SECTION 3: Doctor Call Availability & Time Slot Editor */}
      {activeSubSection === 'availability' && (
        <div className="space-y-6">
          
          {/* Master Instant Calls & Duty Mode Controller */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Tele-Consultation Call Acceptance Controller</span>
              </h3>
              <p className="text-xs text-slate-500">
                Directly configure when you are free to accept incoming video and audio calls from citizens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* Instant Call Master Switch */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>⚡ Instant "Meet Now" Calls</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Patients can immediately call your video room if you are free.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleInstantCalls}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    readyForCalls ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      readyForCalls ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Advance Slot Booking Switch */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>📅 Advance Slot Bookings</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Allow patients to reserve available consultation slots for today and tomorrow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !schedule.acceptingAppointments;
                    updateDoctorScheduleSettings({ acceptingAppointments: next });
                    showToast(`Advance appointments ${next ? 'OPENED' : 'PAUSED'}.`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    schedule.acceptingAppointments ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      schedule.acceptingAppointments ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Interactive Free Call Time Slots Manager */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Interactive Call Time Slots Editor</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click any slot to mark it as <strong className="text-emerald-700">Free for Calls</strong> or <strong className="text-slate-500">Busy / Closed</strong>.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickPresetSlots('ALL_MORNING')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[11px]"
                >
                  + All Morning
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetSlots('ALL_AFTERNOON')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[11px]"
                >
                  + All Afternoon
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetSlots('ALL_EVENING')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[11px]"
                >
                  + All Evening
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetSlots('STANDARD')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold cursor-pointer text-[11px]"
                >
                  Standard Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetSlots('CLEAR')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer text-[11px]"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Morning Slots */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>🌅 Morning Call Slots:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {standardMorning.map((slot) => {
                  const isFree = availableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isFree
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 line-through'
                      }`}
                    >
                      {isFree && <Check className="w-3 h-3 text-white" />}
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon Slots */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>☀️ Afternoon Call Slots:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {standardAfternoon.map((slot) => {
                  const isFree = availableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isFree
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 line-through'
                      }`}
                    >
                      {isFree && <Check className="w-3 h-3 text-white" />}
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evening Slots */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>🌆 Evening Call Slots:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {standardEvening.map((slot) => {
                  const isFree = availableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isFree
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 line-through'
                      }`}
                    >
                      {isFree && <Check className="w-3 h-3 text-white" />}
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time Slot Adder Form */}
            <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>Add Custom Call Timing Window</span>
              </span>

              <form onSubmit={handleAddCustomSlot} className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600">Start:</label>
                  <input
                    type="text"
                    value={customSlotStart}
                    onChange={(e) => setCustomSlotStart(e.target.value)}
                    placeholder="e.g. 07:00 PM"
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-hidden focus:border-teal-500 w-28"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600">End:</label>
                  <input
                    type="text"
                    value={customSlotEnd}
                    onChange={(e) => setCustomSlotEnd(e.target.value)}
                    placeholder="e.g. 07:30 PM"
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-hidden focus:border-teal-500 w-28"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Free Slot</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* Demo Patient Rating Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading">
                  Submit Patient Consultation Feedback
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate a patient rating collected after a tele-consultation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Verma"
                  value={newReviewPatientName}
                  onChange={(e) => setNewReviewPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Star Rating Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className={`p-2 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                        newReviewRating >= star 
                          ? 'border-amber-300 bg-amber-50 text-amber-900 font-bold' 
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${newReviewRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      <span>{star}★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Consultation Mode
                </label>
                <select
                  value={newReviewType}
                  onChange={(e) => setNewReviewType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="VIDEO">Video Tele-OPD Consultation</option>
                  <option value="AUDIO">Audio Tele-Consultation</option>
                  <option value="IN_PERSON">In-Person OPD Clinic</option>
                  <option value="EMERGENCY">Emergency Triage Call</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Patient Feedback & Clinical Review
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Doctor explained the prescription and recovery timeline very thoroughly..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Positive Sentiment Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = newReviewSelectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewReviewSelectedTags(newReviewSelectedTags.filter(t => t !== tag));
                          } else {
                            setNewReviewSelectedTags([...newReviewSelectedTags, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition cursor-pointer"
                >
                  Submit & Record Feedback
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
