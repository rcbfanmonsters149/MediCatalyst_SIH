import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Mic, 
  MicOff, 
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
  RefreshCw,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TollFreeBanner } from '../components/TollFreeBanner';

interface EmergencyPageProps {
  onNavigateToAmbulance?: () => void;
}

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ onNavigateToAmbulance }) => {
  const { 
    hospitals, 
    activeDispatch, 
    createEmergencyDispatch, 
    declineOrTimeoutDispatch, 
    cancelDispatch, 
    sendDispatchMessage,
    acceptDispatchByHospital,
    user
  } = useApp();

  const [issueInput, setIssueInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<'CRITICAL' | 'HIGH' | 'MODERATE'>('CRITICAL');
  const [needsAls, setNeedsAls] = useState(true);
  const [chatMessage, setChatMessage] = useState('');

  // Speech-to-text integration using Web Speech API
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser. You can type your emergency in English, Hindi, or local language below.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Default to Hindi / Indian English

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIssueInput(transcript);
        setVoiceNoteRecorded(true);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleRequestSOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueInput.trim()) {
      alert('Please briefly describe what happened or select a quick emergency prompt.');
      return;
    }

    createEmergencyDispatch(
      issueInput + (needsAls ? ' [Requested ALS Ambulance with advanced life support]' : ''),
      voiceNoteRecorded ? issueInput : undefined,
      selectedUrgency
    );
  };

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

  // Only hospitals with 24/7 ambulance service + minimal emergency facilities
  const eligibleEmergencyHospitals = hospitals.filter(h => h.hasAmbulanceService);

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

        {/* If NO active dispatch: Show Request Form */}
        {!activeDispatch ? (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
            
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <AlertOctagon className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-heading">
                    Request Immediate Emergency Ambulance
                  </h2>
                  <p className="text-xs sm:text-sm text-red-100 mt-0.5">
                    Waterfall SLA: Nearest hospital alerted. If unacknowledged within 2 minutes, auto-cascades to next hospital.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRequestSOS} className="p-6 sm:p-8 space-y-6">
              
              {/* Voice Input & Plain Text Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Describe Condition in Plain / Local Language (Hindi or English)
                  </label>
                  <span className="text-[11px] text-slate-400">Speak or Type</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={issueInput}
                    onChange={(e) => setIssueInput(e.target.value)}
                    placeholder="e.g. 'Bike se gir gaye the, sir par chot aayi hai behosh hain' OR 'Sudden chest pain and sweating, unable to breathe'..."
                    className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                  />
                  
                  {/* Speech to text mic button */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`absolute right-3 top-3 p-2.5 rounded-xl transition ${
                      isListening 
                        ? 'bg-red-600 text-white animate-bounce' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title="Click to speak in Hindi or English (Voice Recognition)"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>

                {isListening && (
                  <p className="text-xs text-red-600 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                    <span>Listening... Speak now in Hindi or English</span>
                  </p>
                )}
              </div>

              {/* Quick Emergency Prompt Buttons (One Click) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Or select a common emergency:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIssueInput('Fell off bike on highway, head injury with profuse bleeding, patient semi-conscious');
                      setSelectedUrgency('CRITICAL');
                    }}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/40 transition text-xs font-semibold text-slate-800"
                  >
                    🏍️ <strong>Bike Accident:</strong> Head injury, bleeding & unconscious
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueInput('Severe crushing chest pain radiating to left arm, heavy cold sweating and shortness of breath');
                      setSelectedUrgency('CRITICAL');
                    }}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/40 transition text-xs font-semibold text-slate-800"
                  >
                    💔 <strong>Cardiac Chest Pain:</strong> Clutching chest, cold sweating
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueInput('Sudden extreme fatigue, facial droop, unable to move left arm, slurred speech');
                      setSelectedUrgency('HIGH');
                    }}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/40 transition text-xs font-semibold text-slate-800"
                  >
                    ⚡ <strong>Sudden Fatigue / Stroke:</strong> Arm weakness & slurred speech
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueInput('Severe farm machine injury with deep laceration and uncontrolled limb bleeding');
                      setSelectedUrgency('CRITICAL');
                    }}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/40 transition text-xs font-semibold text-slate-800"
                  >
                    🌾 <strong>Farm / Trauma Injury:</strong> Severe limb bleeding
                  </button>
                </div>
              </div>

              {/* Better Facilities / ALS Toggle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Request Advanced Life Support (ALS) Ambulance
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dispatches vehicle equipped with Cardiac Defibrillator, Ventilator, and trained Paramedic.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={needsAls}
                  onChange={(e) => setNeedsAls(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </div>

              {/* Submit SOS Button */}
              <button
                type="submit"
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-base rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 animate-emergency-beacon"
              >
                <AlertOctagon className="w-5 h-5" />
                <span>INITIATE EMERGENCY DISPATCH (START 2-MIN WATERFALL)</span>
              </button>

              <div className="text-center text-[11px] text-slate-400">
                Your GPS location ({user.address}) will be automatically pinned for the ambulance driver.
              </div>

            </form>

          </div>
        ) : (
          /* If ACTIVE dispatch exists: Show Live Waterfall SLA Tracker & Bi-directional Communication */
          <div className="space-y-6">
            
            {/* Top Status Alert Bar */}
            <div className={`p-5 rounded-2xl border text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              activeDispatch.status === 'REROUTED'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-400 animate-reroute-alert'
                : (activeDispatch.status === 'ACCEPTED' || activeDispatch.status === 'PATIENT_ONBOARD'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-400'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 border-red-400')
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="font-extrabold text-sm uppercase tracking-wider">
                    Emergency Dispatch #{activeDispatch.id} • Status: {activeDispatch.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading mt-1">
                  {activeDispatch.callerIssue}
                </h2>
                <p className="text-xs opacity-90 mt-0.5">
                  Pickup Point: {activeDispatch.pickupAddress}
                </p>
              </div>

              {/* Countdown or Paramedic Button */}
              <div className="flex items-center gap-3">
                {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
                  <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20">
                    <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                      2-Minute SLA Timeout
                    </div>
                    <div className="text-2xl font-mono font-extrabold">
                      {formatSeconds(activeDispatch.timeoutSecondsRemaining)}
                    </div>
                  </div>
                )}

                <div className="px-4 py-2 bg-black/25 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>Ambulance Unit Dispatched</span>
                </div>
              </div>
            </div>

            {/* Waterfall Hospital Dispatch Progression Tracker */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span>Waterfall Dispatch Audit Trail (Which hospitals received the request)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict 2-minute SLA policy: If the nearest facility does not respond within 120s, the call auto-escalates to the next nearest hospital.
                  </p>
                </div>

                {/* Simulation controls for Hackathon Demo */}
                <div className="flex items-center gap-2">
                  {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
                    <>
                      <button
                        onClick={() => acceptDispatchByHospital(activeDispatch.currentHospitalId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        ✓ Simulate Hospital Accepts
                      </button>

                      <button
                        onClick={() => declineOrTimeoutDispatch(activeDispatch.currentHospitalId, 'Staff currently occupied in emergency OT')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        ⚡ Simulate 2-Min Timeout / Failover
                      </button>
                    </>
                  )}

                  <button
                    onClick={cancelDispatch}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Reset Dispatch
                  </button>
                </div>
              </div>

              {/* Visual Hop Stepper */}
              <div className="space-y-3 pt-2">
                {activeDispatch.waterfallHistory.map((hop, idx) => {
                  const isCurrent = hop.hospitalId === activeDispatch.currentHospitalId;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        hop.status === 'ACCEPTED'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : (hop.status === 'TIMED_OUT' || hop.status === 'DECLINED'
                              ? 'bg-rose-50/60 border-rose-200'
                              : (isCurrent ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30' : 'bg-slate-50 border-slate-200'))
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          hop.status === 'ACCEPTED'
                            ? 'bg-emerald-600 text-white'
                            : (hop.status === 'TIMED_OUT' || hop.status === 'DECLINED'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-500 text-white')
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{hop.hospitalName}</h4>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              hop.status === 'ACCEPTED'
                                ? 'bg-emerald-200 text-emerald-900'
                                : (hop.status === 'TIMED_OUT' || hop.status === 'DECLINED'
                                    ? 'bg-rose-200 text-rose-900'
                                    : 'bg-amber-200 text-amber-900 animate-pulse')
                            }`}>
                              {hop.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{hop.note}</p>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-500 sm:self-center shrink-0">
                        <div>Dispatched at: <strong>{hop.sentAt}</strong></div>
                        {hop.responseTimeSeconds !== undefined && (
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            Response time: {hop.responseTimeSeconds}s
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bi-directional Communication: Voice Messages & Text Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Live Emergency Messages Feed */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-[400px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Direct Emergency Comms (Citizen ↔ Hospital ↔ Paramedic)
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Live Channel
                  </span>
                </div>

                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                  {activeDispatch.messages.map((msg, idx) => {
                    const isCitizen = msg.sender === 'CITIZEN';
                    const isParamedic = msg.sender === 'PARAMEDIC';

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[80%] ${
                          isCitizen ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-slate-600">{msg.sender}</span>
                          <span>• {msg.timestamp}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isCitizen
                              ? 'bg-red-600 text-white rounded-br-xs'
                              : (isParamedic
                                  ? 'bg-sky-50 text-sky-950 border border-sky-200 rounded-bl-xs'
                                  : 'bg-slate-100 text-slate-800 rounded-bl-xs')
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Send update (e.g., 'Bleeding stopped with pressure cloth')..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Pre-Arrival Triage & Cloud Bio-Data Shared */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transmitted Medical Bio-Data to Ambulance</span>
                </h3>

                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-xs space-y-1">
                  <span className="font-extrabold text-rose-800 uppercase text-[10px]">
                    ⚠️ High Alert Flagged for Paramedics:
                  </span>
                  <p className="text-rose-900 font-bold">
                    Patient has Severe Penicillin Anaphylaxis Allergy!
                  </p>
                  <p className="text-rose-700 text-[11px]">
                    Transmitted from Rameshwar Singh's Arogya Cloud Locker.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Blood Group:</span>
                    <strong className="text-slate-900 font-bold">{user.bloodGroup}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Chronic Illnesses:</span>
                    <strong className="text-slate-900 text-right">{user.chronicConditions.join(', ')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Next-of-Kin Notified:</span>
                    <strong className="text-emerald-700">Sunita Singh (+91 98765 43211)</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Live Biometrics & Vitals Linked with Responders</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
