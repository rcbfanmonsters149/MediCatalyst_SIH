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
  MessageSquare
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TollFreeBanner } from '../components/TollFreeBanner';
import { LeafletMap } from '../components/LeafletMap';
import { LiveAmbulanceTrackerCard } from '../components/LiveAmbulanceTrackerCard';
import { HandoverModeSelector } from '../components/HandoverModeSelector';
import { HandoverETAComparisonCard } from '../components/HandoverETAComparisonCard';
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
    cancelDispatch,
    createEmergencyDispatch,
    user
  } = useApp();
  const { tr, language } = useLanguage();

  const [chatMessage, setChatMessage] = useState('');

  const dispatch = activeDispatch;

  // Unconditionally call hook at top level to satisfy React Rules of Hooks
  const memoizedPickup = useMemo(() => {
    if (!dispatch) return undefined;
    return {
      lat: dispatch.pickupLat,
      lng: dispatch.pickupLng,
      label: dispatch.pickupAddress
    };
  }, [dispatch?.pickupLat, dispatch?.pickupLng, dispatch?.pickupAddress]);

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

  if (!dispatch) {
    return (
      <div className="space-y-6">
        {/* Pinned Top Toll Free Banner */}
        <TollFreeBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
          {/* Status Alert Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {language === 'mr' ? 'कोणतीही सक्रिय आपत्कालीन रवानगी सुरू नाही' : language === 'hi' ? 'कोई सक्रिय आपातकालीन केस नहीं है' : 'Emergency Network On Standby • No Active SOS'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'mr' 
                    ? 'आपत्कालीन SOS रद्द करण्यात आला आहे किंवा नेटवर्क स्टँडबायवर आहे. नवीन आपत्कालीन विनंती नोंदवण्यासाठी खालील बटण वापरा.' 
                    : language === 'hi' 
                    ? 'आपातकालीन अनुरोध रद्द कर दिया गया है अथवा नेटवर्क तत्पर अवस्था में है। नई आपातकालीन सहायता के लिए नीचे दिए गए बटन पर टैप करें।' 
                    : 'The emergency network is ready. Tap below to immediately broadcast a high-priority SOS alert.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  createEmergencyDispatch(
                    language === 'mr' ? 'तातडीचा आपत्कालीन कॉल (कॉल सेंटर / SOS)' : language === 'hi' ? 'गंभीर आपातकालीन सहायता अनुरोध (SOS)' : 'Acute Medical Emergency (SOS Dispatch)',
                    undefined,
                    'CRITICAL'
                  );
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{tr.emergency.triggerEmergency}</span>
              </button>
            </div>
          </div>

          {/* Quick Helplines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a 
              href="tel:108"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 transition flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  108
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">National Ambulance Hotline</h4>
                  <span className="text-[11px] text-slate-500">24/7 Immediate Dispatch</span>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-red-600 group-hover:scale-110 transition" />
            </a>

            <a 
              href="tel:112"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  112
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">All-India Emergency Help</h4>
                  <span className="text-[11px] text-slate-500">Police, Fire & Medical</span>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
            </a>

            <a 
              href="tel:102"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 transition flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
                  102
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Maternal & Infant Health</h4>
                  <span className="text-[11px] text-slate-500">Free Janani Shishu Express</span>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-pink-600 group-hover:scale-110 transition" />
            </a>
          </div>

          {/* Regional Emergency Radar Map */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  {language === 'mr' ? 'प्रादेशिक आपत्कालीन रुग्णालये व उपलब्ध रुग्णवाहिका' : language === 'hi' ? 'क्षेत्रीय आपातकालीन अस्पताल एवं उपलब्ध एम्बुलेंस' : 'Regional Emergency Facilities & Ready Ambulances'}
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {eligibleEmergencyHospitals.length} Active Centers
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {language === 'mr' ? 'सर्व २४/७ ट्रॉमा युनिट्स सज्ज स्थितीत आहेत' : language === 'hi' ? 'सभी 24/7 ट्रॉमा इकाइयां तत्पर अवस्था में हैं' : 'All 24/7 trauma & resuscitation units online'}
              </span>
            </div>

            <LeafletMap
              hospitals={eligibleEmergencyHospitals}
              ambulances={ambulances}
              height="460px"
              showRouteLine={false}
            />
          </div>
        </div>
      </div>
    );
  }

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

        {/* MIDWAY AMBULANCE HANDOVER MODE SELECTOR ("I can travel toward the ambulance") */}
        <HandoverModeSelector />

        {/* 3-WAY REAL-TIME ETA COMPARISON (When Meet Halfway Mode is Active) */}
        {dispatch.transportMode === 'MEET_HALFWAY' && (
          <HandoverETAComparisonCard />
        )}

        {/* LIVE INTERACTIVE GPS RADAR & TRACKING MAP */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <h3 className="font-bold text-slate-900 text-base font-heading">
                {language === 'mr' ? 'थेट रवानगी रडार व रुग्णवाहिका ट्रॅकिंग' : language === 'hi' ? 'लाइव प्रेषण रडार एवं एम्बुलेंस ट्रैकिंग' : 'Live Dispatch Radar & Moving Ambulance Tracking'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono">
                {tr.common.live}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {language === 'mr' ? 'रुग्णवाहिका प्रवासानुसार थेट अंतर सतत अद्यतनित होते' : language === 'hi' ? 'एम्बुलेंस यात्रा के दौरान वास्तविक दूरी निरंतर अद्यतन होती है' : 'Live distances update continuously as ambulance travels'}
              </span>
              <button
                type="button"
                onClick={cancelDispatch}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer shrink-0"
                title="Cancel emergency dispatch"
              >
                <span>{language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel SOS'}</span>
              </button>
            </div>
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
                    <span>{language === 'mr' ? 'वॉटरफॉल रवानगी इतिहास' : language === 'hi' ? 'वाटरफॉल प्रेषण ऑडिट ट्रेल' : 'Waterfall Dispatch Audit Trail'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'mr' ? 'कडक २-मिनिट एसएलए धोरण: त्वरित प्रवेश सज्जतेची खात्री' : language === 'hi' ? 'सख्त 2-मिनट एसएलए नीति: तत्काल भर्ती तत्परता सुनिश्चित करता है' : 'Strict 2-minute SLA policy: Cascades immediately to ensure immediate intake readiness.'}
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
                              {hop.sentAt}
                              {hop.responseTimeSeconds !== undefined && ` • ${hop.responseTimeSeconds}s`}
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
                          {isAccepted 
                            ? (language === 'mr' ? '✓ स्वीकारले' : language === 'hi' ? '✓ स्वीकृत' : '✓ INTAKE ACCEPTED') 
                            : isDeclined 
                            ? (language === 'mr' ? '✕ नाकारले' : language === 'hi' ? '✕ अस्वीकृत' : '✕ DECLINED') 
                            : (language === 'mr' ? '⏳ प्रतीक्षेत' : language === 'hi' ? '⏳ प्रतीक्षा में' : '⏳ AWAITING ACK')}
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
                      {tr.emergency.liveChat}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {language === 'mr' ? 'सुरक्षित संप्रेषण' : language === 'hi' ? 'सुरक्षित संचार' : 'Encrypted Tri-Party Link'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
                  {dispatch.messages.map((m, i) => {
                    const isCitizen = m.sender === 'CITIZEN';
                    const isHospital = m.sender === 'HOSPITAL';

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
                            {isCitizen 
                              ? (language === 'mr' ? 'तुम्ही (कॉलर)' : language === 'hi' ? 'आप (कॉलर)' : 'YOU (Caller)') 
                              : isHospital 
                              ? (language === 'mr' ? '🏥 प्राप्त रुग्णालय ER' : language === 'hi' ? '🏥 प्राप्तकर्ता अस्पताल ER' : '🏥 Receiving Hospital ER') 
                              : (language === 'mr' ? '🚑 पॅरामेडिक चमू' : language === 'hi' ? '🚑 पैरामेडिक टीम' : '🚑 Paramedic Crew')}
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
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={tr.emergency.typeMessage}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{tr.emergency.send}</span>
                  </button>
                </form>
              </div>

              {/* Patient Pre-Arrival Health Record Warnings */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">
                    {language === 'mr' ? 'जोडलेली नागरिक आरोग्य माहिती:' : language === 'hi' ? 'संबद्ध नागरिक बायो-डेटा:' : 'Linked Citizen Bio-Data:'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">ABHA ID: 91-8273-1928-3920</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">{tr.biodata.bloodGroup}:</span>
                    <strong className="text-slate-800 text-sm">O-Positive (O+)</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                    <span className="text-rose-400 block font-medium">{tr.biodata.allergies}:</span>
                    <strong>Penicillin & Sulfa Drugs</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">{tr.biodata.chronicConditions}:</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">Type 2 Diabetes</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">Mild Hypertension</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'mr' ? 'पॅरामेडिक तपासणी फॉर्म जोडला गेला आहे' : language === 'hi' ? 'पैरामेडिक मूल्यांकन फॉर्म जुड़ा हुआ है' : 'In-Ambulance Paramedic Assessment Form Linked'}</span>
                  </div>

                  <Link
                    to="/hospital?tab=ambulance"
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-200"
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{tr.nav.paramedicCrew}</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>

    </div>
  );
};
