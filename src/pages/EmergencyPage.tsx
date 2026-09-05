import React, { useState, useMemo } from 'react';
import { 
  Send, 
  PhoneCall, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  Building2, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  Info,
  Mic,
  Languages
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TollFreeBanner } from '../components/TollFreeBanner';
import { EmergencyTrackerCard } from '../components/EmergencyTrackerCard';
import { VoiceSOSRecognitionModal } from '../components/VoiceSOSRecognitionModal';
import { LeafletMap } from '../components/LeafletMap';
import { LiveAmbulanceTrackerCard } from '../components/LiveAmbulanceTrackerCard';
import { Link } from 'react-router-dom';

interface EmergencyPageProps {
  onNavigateToAmbulance?: () => void;
}

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ onNavigateToAmbulance }) => {
  const { 
    hospitals, 
    activeDispatch, 
    ambulances,
    sendDispatchMessage,
    updateDispatchStep,
    user
  } = useApp();

  const [chatMessage, setChatMessage] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const dispatch = activeDispatch;

  if (!dispatch) {
    return (
      <div className="space-y-6">
        <TollFreeBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-700">No active emergency dispatch.</h2>
          <p className="text-sm text-slate-500">Use the SOS button to request an ambulance.</p>
          <button 
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Trigger Emergency SOS
          </button>
        </div>
        <VoiceSOSRecognitionModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          initialLanguage="hi-IN"
        />
      </div>
    );
  }

  const memoizedPickup = useMemo(() => ({
    lat: dispatch.pickupLat,
    lng: dispatch.pickupLng,
    label: dispatch.pickupAddress
  }), [dispatch.pickupLat, dispatch.pickupLng, dispatch.pickupAddress]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendDispatchMessage('CITIZEN', chatMessage);
    setChatMessage('');
  };

  // Format seconds to mm:ss
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Qualified hospitals with 24/7 ambulance service
  const eligibleEmergencyHospitals = hospitals.filter(h => h.hasAmbulanceService);
  const assignedAmb = ambulances.find(a => a.id === dispatch.assignedAmbulanceId) || ambulances[0];

  return (
    <div className="space-y-6">
      
      {/* Pinned Top Toll Free Banner */}
      <TollFreeBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

        {/* Emergency Dashboard Eligibility Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Emergency Verification Notice:</strong> Only verified hospitals with an active 24/7 ambulance fleet and resuscitation OT are registered under this rapid emergency network.
            </span>
          </div>
          <span className="font-bold text-amber-800 shrink-0 hidden sm:inline">
            {eligibleEmergencyHospitals.length} Qualified Facilities Active
          </span>
        </div>

        {/* Elderly & Hands-free Voice SOS Recognition Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-base sm:text-lg font-heading tracking-tight">
                  Elderly Voice Recognition SOS
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
                  🇮🇳 हिन्दी • 🚩 मराठी • 🌐 English
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                Can't type? Tap the microphone and speak naturally in <strong>Hindi</strong>, <strong>Marathi</strong>, or <strong>English</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-white text-red-700 hover:bg-red-50 rounded-xl font-extrabold text-sm shadow-md transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer animate-emergency-beacon"
          >
            <Mic className="w-4 h-4 text-red-600" />
            <span>बोलकर सहायता लें (Tap to Speak)</span>
          </button>
        </div>

        {/* ACTIVE EMERGENCY DISPATCH DISPLAY */}
        <div className="space-y-6">

          {/* Clean 10-Stage Incident Progress Stepper Card */}
          <div className="flex justify-center">
            <EmergencyTrackerCard
              incidentId={dispatch.id}
              title={dispatch.callerIssue}
              urgency={dispatch.urgencyLevel === 'CRITICAL' ? 'Critical' : (dispatch.urgencyLevel === 'HIGH' ? 'High' : 'Moderate')}
              patientCount={dispatch.patientCount || 1}
              currentStep={dispatch.currentStep || 4}
              onStepChange={(step) => updateDispatchStep(step)}
              showControls={false}
              className="w-full shadow-md"
            />
          </div>

          {/* Nearest Ambulance Live Response Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Truck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-extrabold text-white tracking-wide font-mono">
                    {assignedAmb.vehicleNumber}
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ⚡ Closest GPS Ambulance Assigned First
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {assignedAmb.type} • Home Depot: <strong className="text-slate-100">{assignedAmb.hospitalName}</strong>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paramedic/Driver: <span className="text-slate-200 font-semibold">{assignedAmb.driverName}</span> • Phone: <a href={`tel:${assignedAmb.driverPhone}`} className="text-emerald-400 underline font-mono">{assignedAmb.driverPhone}</a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <div className="text-right bg-slate-950/60 border border-slate-700 px-4 py-2.5 rounded-xl">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Pickup ETA to Coordinates
                </div>
                <div className="text-2xl font-mono font-black text-emerald-400">
                  ~{assignedAmb.etaMinutes || 3} mins
                </div>
              </div>

              {onNavigateToAmbulance && (
                <button
                  onClick={onNavigateToAmbulance}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Ambulance Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* INTERACTIVE LIVE MOVING GPS RADAR & TRACKING MAP */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Live Dispatch Radar & Moving Ambulance Tracking
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono">
                  LIVE TELEMETRY
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Live distances update continuously as ambulance travels
              </span>
            </div>

            <LeafletMap
              hospitals={hospitals}
              ambulances={ambulances}
              selectedHospitalId={dispatch.currentHospitalId}
              pickupLocation={memoizedPickup}
              height="460px"
              showRouteLine={true}
            />

            {/* DEDICATED SEPARATE LIVE AMBULANCE TELEMETRY & ROUTE TRACKER CARD */}
            <LiveAmbulanceTrackerCard />
          </div>

          {/* TWO-COLUMN LIVE COORDINATION & AUDIT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Cols: Waterfall Dispatch Audit Trail */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span>Waterfall Dispatch Audit Trail</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict 2-minute SLA policy: Cascades immediately to ensure immediate intake readiness.
                  </p>
                </div>
              </div>

              {/* Visual Hop Stepper */}
              <div className="space-y-3 pt-2">
                {dispatch.waterfallHistory.map((hop, idx) => {
                  const isAccepted = hop.status === 'ACCEPTED';
                  const isDeclined = hop.status === 'DECLINED';
                  const isWaiting = hop.status === 'WAITING';

                  return (
                    <div 
                      key={hop.hospitalId + idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isAccepted 
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20' 
                          : isDeclined 
                          ? 'bg-rose-50/60 border-rose-200 opacity-80' 
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isAccepted 
                              ? 'bg-emerald-600 text-white' 
                              : isDeclined 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {hop.hospitalName}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {hop.note}
                            </p>
                            <span className="text-[11px] text-slate-400 mt-1 inline-block">
                              Timestamp: {hop.sentAt}
                              {hop.responseTimeSeconds !== undefined && ` • Response time: ${hop.responseTimeSeconds}s`}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                          isAccepted 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : isDeclined 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}>
                          {isAccepted ? '✓ INTAKE ACCEPTED' : isDeclined ? '✕ DECLINED' : '⏳ AWAITING ACK'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Bi-directional Communication & Telemetry HUD */}
            <div className="lg:col-span-5 space-y-6">

              {/* Real-time Incident Communication Radio */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900 font-heading">
                      Live Incident Radio Comms
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Encrypted Tri-Party Link
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
                  {dispatch.messages.map((m, i) => {
                    const isCitizen = m.sender === 'CITIZEN';
                    const isHospital = m.sender === 'HOSPITAL';
                    const isParamedic = m.sender === 'PARAMEDIC';

                    return (
                      <div 
                        key={i}
                        className={`p-3 rounded-xl ${
                          isCitizen 
                            ? 'bg-slate-100 text-slate-800 ml-4' 
                            : isHospital 
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 mr-4' 
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-900 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-75">
                          <span>
                            {isCitizen ? 'YOU (Caller)' : isHospital ? '🏥 Receiving Hospital ER' : '🚑 Paramedic Crew'}
                          </span>
                          <span>{m.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Send Update Input */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                    title="Speak message in Hindi, Marathi, or English (बोलकर संदेश भेजें / आवाजाने पाठवा)"
                  >
                    <Mic className="w-4 h-4 text-red-600 animate-pulse" />
                  </button>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type or tap mic to speak in Hindi, Marathi, English..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Patient Pre-Arrival Health Record Warnings */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Linked Citizen Bio-Data:</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">ABHA ID: 91-8273-1928-3920</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Blood Group:</span>
                    <strong className="text-slate-800 text-sm">O-Positive (O+)</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                    <span className="text-rose-400 block font-medium">Critical Allergies:</span>
                    <strong>Penicillin & Sulfa Drugs</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">Chronic Conditions:</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">Type 2 Diabetes</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">Mild Hypertension</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Ambulance Paramedic Assessment Form Linked</span>
                  </div>

                  <Link
                    to="/hospital?tab=ambulance"
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-200"
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Open Ambulance Portal (Paramedic Crew Desk)</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 3-Language Elderly Speech Recognition Voice SOS Modal */}
      <VoiceSOSRecognitionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialLanguage="hi-IN"
      />

    </div>
  );
};
