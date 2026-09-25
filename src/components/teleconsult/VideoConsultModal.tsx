import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Stethoscope, 
  Camera, 
  Phone, 
  Mic, 
  AlertCircle, 
  Heart, 
  FileText, 
  ShieldCheck, 
  CheckCircle,
  Plus,
  Clock,
  Sparkles,
  Building2,
  Lock,
  Star,
  Check
} from '../icons';
import { TeleAppointment, UserBioData } from '../../types';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { HospitalPrescriptionModal } from '../hospital/HospitalPrescriptionModal';

interface VideoConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: TeleAppointment | null;
  userRole?: 'CITIZEN' | 'DOCTOR';
  onConsultationCompleted?: (apptId: string) => void;
}

export const VideoConsultModal: React.FC<VideoConsultModalProps> = ({
  isOpen,
  onClose,
  appointment,
  userRole = 'CITIZEN',
  onConsultationCompleted
}) => {
  const { user, hospitals, updateAppointmentStatus, submitDoctorReview } = useApp();
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Post-Consultation Rating State (Patient Feedback)
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [postCallRating, setPostCallRating] = useState(5);
  const [postCallComment, setPostCallComment] = useState('');
  const [postCallTags, setPostCallTags] = useState<string[]>(['Clear Advice', 'Punctual & Polite']);

  const activeHospital = hospitals.find(h => h.id === appointment?.hospitalId) || hospitals[0];

  // Request real camera & mic stream
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      })
      .catch(err => {
        console.warn('Camera/mic access:', err);
        setCameraError('Camera access not granted or unavailable. Showing simulated medical feed.');
        setCameraActive(false);
      });

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCallDuration(0);
    };
  }, [isOpen]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => {
        t.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleEndCall = () => {
    if (appointment) {
      const durationMins = Math.max(1, Math.round(callDuration / 60) || 1);
      const now = new Date();
      const startTime = new Date(now.getTime() - callDuration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const defaultPrescription = appointment.prescription || {
        id: `rx-${Date.now()}`,
        diagnosis: appointment.symptoms || 'Acute Symptomatic Management',
        medications: [
          { name: 'Paracetamol', dosage: '650 mg', frequency: '1-0-1 (Morning & Night)', duration: '3 Days', instructions: 'Take after meals with warm water' },
          { name: 'Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '5 Days', instructions: 'Take empty stomach 30 mins before breakfast' },
          { name: 'Cetirizine', dosage: '10 mg', frequency: '0-0-1 (Bedtime)', duration: '3 Days', instructions: 'At night if fever/cold symptoms persist' }
        ],
        instructions: 'Rest adequately, monitor vitals twice daily. Drink warm water.',
        advice: 'Follow up in 3 days if symptoms do not improve or visit nearest PHC.',
        issuedAt: `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${endTime}`,
        doctorSignature: `${appointment.doctorName} (Reg. No: MCI-2018-8821)`
      };

      updateAppointmentStatus(appointment.id, 'COMPLETED', {
        actualStartTime: appointment.actualStartTime || startTime,
        actualEndTime: endTime,
        actualDurationMinutes: durationMins,
        prescriptionIssued: true,
        prescription: defaultPrescription
      });
      if (onConsultationCompleted) onConsultationCompleted(appointment.id);
    }
    if (userRole === 'CITIZEN') {
      setShowRatingPrompt(true);
    } else {
      onClose();
    }
  };

  const handlePostCallRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appointment) {
      submitDoctorReview(appointment.doctorId, {
        patientName: user.fullName || appointment.patientName,
        patientAbhaMasked: appointment.patientAbhaId ? `ABHA: ${appointment.patientAbhaId.slice(0, 7)}****` : 'ABHA: Verified',
        rating: postCallRating,
        consultationType: appointment.consultationType || 'VIDEO',
        tags: postCallTags,
        comment: postCallComment.trim() || 'Consultation completed successfully. Very helpful advice and prescription.',
        isVerifiedPatient: true
      });
    }
    setShowRatingPrompt(false);
    onClose();
  };

  if (!isOpen || !appointment) return null;

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Call HUD Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base font-heading text-white">
                  {userRole === 'DOCTOR' 
                    ? `Tele-Consultation with ${appointment.patientName}` 
                    : `Consulting ${appointment.doctorName}`}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{formattedTime}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {appointment.hospitalName} • Slot: {appointment.timeSlot} ({appointment.date})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-800/40 px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Encrypted WebRTC</span>
            </span>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Call View Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
          
          {/* Main Video Screen Area (8 cols on desktop) */}
          <div className="lg:col-span-8 p-4 flex flex-col justify-between relative min-h-[340px] sm:min-h-[420px] bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800">
            
            {/* Main Remote Video Stream (Doctor or Patient) */}
            <div className="flex-1 rounded-2xl overflow-hidden relative bg-slate-950 flex items-center justify-center border border-slate-800">
              
              {userRole === 'CITIZEN' ? (
                // Citizen sees Doctor stream simulation
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-teal-500 to-blue-700 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-teal-500/20 ring-4 ring-teal-400/20 animate-pulse">
                    {appointment.doctorName.charAt(4) || 'D'}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{appointment.doctorName}</h4>
                    <p className="text-xs text-teal-400 font-medium">{appointment.doctorSpecialty}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                      Audio/Video Connected • 1080p e-Sanjeevani Tele-OPD
                    </span>
                  </div>
                </div>
              ) : (
                // Doctor sees Patient stream
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-400/20">
                    {appointment.patientName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{appointment.patientName}</h4>
                    <p className="text-xs text-indigo-300 font-mono">ABHA: {appointment.patientAbhaId}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                      Patient Connected via Citizen Web Portal
                    </span>
                  </div>
                </div>
              )}

              {/* PiP Local Camera Feed (User's real camera) */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-40 aspect-4/3 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl">
                {cameraActive && !isVideoOff ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[10px] text-center p-1">
                    <Camera className="w-4 h-4 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
                  You
                </div>
              </div>

            </div>

            {/* Bottom In-Call Controls Bar */}
            <div className="mt-4 pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-2xl transition cursor-pointer ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-2xl transition cursor-pointer ${
                  isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                <Camera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Phone className="w-5 h-5 rotate-[135deg]" />
                <span>End Call</span>
              </button>

              {userRole === 'DOCTOR' && (
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Write e-Rx</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Sidebar: Clinical EHR & Symptoms (4 cols on desktop) */}
          <div className="lg:col-span-4 p-5 overflow-y-auto space-y-4 bg-slate-900/90 text-xs">
            
            {/* Consultation Chief Complaint */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                Chief Symptoms & Patient Complaint
              </span>
              <p className="text-white font-medium leading-relaxed">
                "{appointment.symptoms}"
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[11px] text-slate-400">
                <span>Urgency: <strong className="text-amber-300">{appointment.urgency}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-teal-300">{appointment.consultationType} Call</strong></span>
              </div>
            </div>

            {/* Patient Clinical Profile & Allergies */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Patient Health Identity
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  {appointment.patientBloodGroup || user.bloodGroup}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Patient Name</span>
                  <strong className="text-white">{appointment.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Age & Gender</span>
                  <strong className="text-white">{appointment.patientAge} Yrs • {appointment.patientGender}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">ABHA ID</span>
                  <strong className="text-teal-300 font-mono">{appointment.patientAbhaId}</strong>
                </div>
              </div>

              {/* Critical Drug Allergies (Life-Saving Red Box) */}
              {user.allergies && user.allergies.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200">
                  <span className="font-bold flex items-center gap-1 text-[10px] uppercase text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Known Drug Allergies</span>
                  </span>
                  <p className="mt-1 font-semibold text-[11px]">
                    {user.allergies.map(a => `${a.allergen} (${a.reaction})`).join('; ')}
                  </p>
                </div>
              )}
            </div>

            {/* Doctor Note-Taking Pad */}
            {userRole === 'DOCTOR' && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Physician Consultation Notes
                </span>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Record provisional diagnosis, advised tests, or review timeline..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* In-Call Actions */}
            <div className="space-y-2 pt-2">
              {userRole === 'DOCTOR' ? (
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Official e-Prescription</span>
                </button>
              ) : (
                <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl text-center text-teal-200 text-[11px]">
                  Doctor will issue an official electronic prescription at the conclusion of this call.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Prescription Issue Modal */}
      <HospitalPrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          if (appointment) {
            updateAppointmentStatus(appointment.id, 'COMPLETED');
          }
        }}
        hospital={activeHospital}
        onNotify={(msg) => setToastMessage(msg)}
      />

      {/* Patient Post-Consultation Rating Modal */}
      {showRatingPrompt && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading">
                Rate Your Consultation
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                {appointment.doctorName}
              </p>
              <p className="text-[11px] text-slate-500">
                Your feedback is collected to update the doctor's verified rating profile.
              </p>
            </div>

            <form onSubmit={handlePostCallRatingSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPostCallRating(star)}
                    className="p-1.5 transition transform hover:scale-110 cursor-pointer"
                  >
                    <Star 
                      className={`w-7 h-7 ${
                        postCallRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  How was your experience?
                </label>
                <textarea
                  rows={2}
                  value={postCallComment}
                  onChange={(e) => setPostCallComment(e.target.value)}
                  placeholder="Doctor gave clear explanations and prescribed medicines..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingPrompt(false);
                    onClose();
                  }}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
