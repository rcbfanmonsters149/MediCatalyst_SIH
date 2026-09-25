import React, { useState } from 'react';
import { 
  Truck, 
  Activity, 
  Heart, 
  Wind, 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  LogOut, 
  Navigation, 
  Phone, 
  MapPin, 
  ExternalLink,
  ShieldCheck, 
  Stethoscope, 
  Radio, 
  Send, 
  MessageSquare,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Link } from 'react-router-dom';
import { HospitalAmbulancePortalTab } from '../components/hospital/HospitalAmbulancePortalTab';
import { EmergencyTrackerCard } from '../components/EmergencyTrackerCard';
import { LeafletMap } from '../components/LeafletMap';

export type AmbulanceSubTab = 'assessment' | 'dispatch' | 'handover' | 'radio';

export const AmbulanceDashboard: React.FC = () => {
  const { tr } = useLanguage();
  const { 
    ambulanceUser, 
    logoutAmbulance, 
    ambulances, 
    updateAmbulanceStatus,
    activeDispatch, 
    hospitals, 
    loadPresetScenario,
    greenCorridorActive,
    setGreenCorridorActive,
    updateDispatchStep,
    sendDispatchMessage,
    activeHandover,
    caretakerTelemetry,
    recalculateMeetingPointManual,
    confirmPatientHandover,
    setTransportMode,
    liveAmbulance
  } = useApp();

  const [activeTab, setActiveTab] = useState<AmbulanceSubTab>('assessment');
  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const amb = ambulanceUser || ambulances[0];

  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) 
    || hospitals.find(h => h.name === amb.hospitalName) 
    || hospitals[0];

  const isRerouted = activeDispatch?.status === 'REROUTED';
  const targetHospital = isRerouted 
    ? (hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[3] || hospitals[0])
    : currentHospital;

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput.trim();
    if (!textToSend) return;
    sendDispatchMessage('PARAMEDIC', textToSend);
    setChatInput('');
    triggerNotify('Radio message transmitted to hospital ER desk & citizen!');
  };

  const pickupLocation = activeDispatch 
    ? { lat: activeDispatch.pickupLat, lng: activeDispatch.pickupLng, label: activeDispatch.pickupAddress }
    : { lat: 28.7080, lng: 77.0980, label: 'Near Village Rampur Chowk' };

  const messageCount = activeDispatch?.messages?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 font-heading tracking-tight">
                  {tr.ambulance.cockpit108}
                </span>
                <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {amb.vehicleNumber}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                  {amb.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {tr.ambulance.driverName}: <strong className="text-slate-700">{amb.driverName}</strong> • {tr.ambulance.baseHospital}: {amb.hospitalName}
              </p>
            </div>
          </div>

          {/* Controls & Switch Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Selector */}
            <select
              value={amb.status}
              onChange={(e) => {
                updateAmbulanceStatus(amb.id, e.target.value as any);
                triggerNotify(`Ambulance status updated to ${e.target.value}!`);
              }}
              className="h-10 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs transition cursor-pointer"
            >
              <option value="AVAILABLE">🟢 {tr.ambulance.statusAvailable}</option>
              <option value="DISPATCHED">🟡 {tr.ambulance.statusDispatched}</option>
              <option value="PATIENT_ONBOARD">🔴 {tr.ambulance.patientOnboard}</option>
              <option value="ARRIVED_HOSPITAL">🔵 {tr.ambulance.dockedAtHospital}</option>
              <option value="MAINTENANCE">⚪ {tr.ambulance.statusMaintenance}</option>
            </select>

            <LanguageSelector variant="light" />

            <Link
              to="/"
              className="h-10 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 rounded-xl transition flex items-center gap-2 border border-slate-200 shadow-xs font-semibold cursor-pointer hidden md:flex"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>{tr.common.publicPortal}</span>
            </Link>

            <button
              onClick={logoutAmbulance}
              className="h-10 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3.5 rounded-xl transition flex items-center gap-2 border border-rose-200 cursor-pointer font-semibold shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{tr.ambulance.exitCockpit}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Live Notification Banner */}
        {notification && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* ACTIVE DISPATCH PERSISTENT ALERT RIBBON */}
        {activeDispatch ? (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white animate-ping mt-1 sm:mt-0 shrink-0"></span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black font-mono uppercase px-2 py-0.5 bg-black/30 rounded border border-white/20">
                    CALL ID: {activeDispatch.id}
                  </span>
                  <span className="text-sm font-extrabold">
                    {activeDispatch.callerIssue}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                    {activeDispatch.urgencyLevel}
                  </span>
                  {isRerouted && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 animate-pulse">
                      ⚡ AI Diverted
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-100 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>{activeDispatch.pickupAddress}</span>
                  <span className="mx-1">•</span>
                  <span>Destination: <strong>{targetHospital.name}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeDispatch.pickupLat},${activeDispatch.pickupLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-red-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-red-600" />
                <span>Google Maps GPS</span>
              </a>

              <button
                onClick={() => {
                  setGreenCorridorActive(!greenCorridorActive);
                  triggerNotify(greenCorridorActive ? 'Green corridor traffic deactivated' : 'Traffic Police Green Corridor Clearance Active!');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  greenCorridorActive 
                    ? 'bg-emerald-500 text-white shadow-xs animate-pulse' 
                    : 'bg-black/30 hover:bg-black/40 text-white border border-white/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{greenCorridorActive ? tr.ambulance.greenCorridorActiveBadge : tr.ambulance.requestGreenWave}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {tr.ambulance.cockpitActive}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ambulance {amb.vehicleNumber} ({amb.type})
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {tr.ambulance.telemetryReady}
            </span>
          </div>
        )}

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'assessment'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{tr.ambulance.clinicalAssessmentTab}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'assessment' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
            }`}>
              Full Suite
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{tr.ambulance.dispatchTrackerTab}</span>
            {activeDispatch && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'dispatch' ? 'bg-blue-700 text-white' : 'bg-red-50 text-red-700'
              }`}>
                Step {activeDispatch.currentStep || 4}/10
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('handover')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'handover'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span>🤝</span>
            <span>Midway Handover</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeDispatch?.transportMode === 'MEET_HALFWAY'
                ? (activeTab === 'handover' ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse')
                : (activeTab === 'handover' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600')
            }`}>
              {activeDispatch?.transportMode === 'MEET_HALFWAY' ? 'MEET-ME ACTIVE' : 'READY'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('radio')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'radio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{tr.ambulance.radioCommsTab}</span>
            {messageCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'radio' ? 'bg-blue-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {messageCount} msgs
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: FULL PRE-HOSPITAL CLINICAL ASSESSMENT & AI TRIAGE   */}
        {/* ========================================================= */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            
            {/* Rapid Preset Evaluation Scenarios Bar */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  {tr.ambulance.quickPresets}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadPresetScenario('BIKE_HEAD_TRAUMA');
                    triggerNotify('Loaded Clinical Scenario: Severe Head Trauma (GCS 7, Major Bleeding)!');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                >
                  🏍️ {tr.ambulance.scenarioBikeTrauma}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadPresetScenario('ACUTE_STEMI_HEART');
                    triggerNotify('Loaded Clinical Scenario: Acute STEMI Heart Attack (Requires Cath Lab)!');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                >
                  ❤️ {tr.ambulance.scenarioStemi}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadPresetScenario('STROKE_FAST');
                    triggerNotify('Loaded Clinical Scenario: Stroke with Facial Droop & Arm Weakness (FAST 2)!');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                >
                  🧠 {tr.ambulance.scenarioStroke}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadPresetScenario('PREGNANCY_EMERGENCY');
                    triggerNotify('Loaded Clinical Scenario: High-Risk Labor / Obstetric Emergency!');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                >
                  👶 {tr.ambulance.scenarioPregnancy}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadPresetScenario('MILD_FEVER_CLINIC');
                    triggerNotify('Loaded Clinical Scenario: Mild Stable Vitals!');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                >
                  🩺 {tr.ambulance.scenarioMildFever}
                </button>
              </div>
            </div>

            {/* THE COMPLETE HOSPITAL AMBULANCE PORTAL COMPONENT */}
            <HospitalAmbulancePortalTab hospital={targetHospital} onNotify={triggerNotify} />

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INCIDENT DISPATCH & 10-STAGE PROGRESS TRACKER       */}
        {/* ========================================================= */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            
            {activeDispatch ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                
                {/* Header with Navigation Link */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping"></span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black font-mono px-2.5 py-1 bg-red-600 text-white rounded-md tracking-wider shadow-2xs">
                          {activeDispatch.id}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                          {activeDispatch.callerIssue}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
                          {activeDispatch.urgencyLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeDispatch.pickupLat},${activeDispatch.pickupLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 shrink-0"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Start Google Maps Navigation</span>
                  </a>
                </div>

                {/* Quick Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* Incident & Pickup */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Incident & Pickup Location:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{activeDispatch.callerName}</p>
                    <p className="text-slate-600 flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{activeDispatch.pickupAddress}</span>
                    </p>
                    <p className="text-slate-500 pt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${activeDispatch.callerPhone}`} className="text-emerald-700 hover:text-emerald-800 font-semibold underline font-mono">
                        {activeDispatch.callerPhone}
                      </a>
                    </p>
                  </div>

                  {/* Destination Hospital */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Destination Intake Hospital:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{targetHospital.name}</p>
                    <p className="text-slate-500 text-[11px]">{targetHospital.address}</p>
                    <div className="pt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isRerouted 
                          ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse' 
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {isRerouted ? '⚡ AI Diverted Tertiary Center' : 'Nearest Intake Center'}
                      </span>
                    </div>
                  </div>

                  {/* Driver Quick Actions */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Driver Quick Actions:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          updateDispatchStep(5);
                          triggerNotify('Marked: Patient Picked Up & Onboard!');
                        }}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold text-center transition border border-slate-200 shadow-2xs cursor-pointer"
                      >
                        5. {tr.ambulance.patientOnboard}
                      </button>
                      <button
                        onClick={() => {
                          updateDispatchStep(8);
                          triggerNotify('Marked: Ambulance docked at Hospital ER!');
                        }}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold text-center transition border border-slate-200 shadow-2xs cursor-pointer"
                      >
                        8. {tr.ambulance.dockedAtHospital}
                      </button>
                      <button
                        onClick={() => {
                          setGreenCorridorActive(!greenCorridorActive);
                          triggerNotify(greenCorridorActive ? 'Green corridor traffic deactivated' : 'Traffic Police Green Corridor Activated!');
                        }}
                        className={`col-span-2 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          greenCorridorActive 
                            ? 'bg-emerald-600 text-white shadow-xs animate-pulse' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{greenCorridorActive ? tr.ambulance.greenCorridorActiveBadge : tr.ambulance.requestGreenWave}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Embedded 10-Stage Incident Progress Tracker Card */}
                <div className="pt-2">
                  <EmergencyTrackerCard
                    incidentId={activeDispatch.id}
                    title={activeDispatch.callerIssue}
                    urgency={activeDispatch.urgencyLevel === 'CRITICAL' ? 'Critical' : (activeDispatch.urgencyLevel === 'HIGH' ? 'High' : 'Moderate')}
                    patientCount={activeDispatch.patientCount || 1}
                    currentStep={activeDispatch.currentStep || 4}
                    onStepChange={(step) => updateDispatchStep(step)}
                    showControls={true}
                    className="w-full shadow-xs text-slate-800"
                  />
                </div>

                {/* Map View */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Live Emergency Navigation Map</span>
                  </h4>
                  <div className="rounded-2xl overflow-hidden border border-slate-200">
                    <LeafletMap
                      hospitals={hospitals}
                      pickupLocation={pickupLocation}
                      selectedHospitalId={currentHospital.id}
                      rerouteDestination={isRerouted ? targetHospital : null}
                      showReroutePath={isRerouted}
                      height="350px"
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{tr.ambulance.noActiveDispatches}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ambulance {amb.vehicleNumber} is currently available in the fleet pool. When a citizen triggers an SOS or an ASHA worker reports an accident, the incident card and GPS route will show here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MIDWAY AMBULANCE HANDOVER / MEET-ME RENDEZVOUS       */}
        {/* ========================================================= */}
        {activeTab === 'handover' && (
          <div className="space-y-5 animate-in fade-in">
            {activeDispatch ? (
              <div className="space-y-5">
                
                {/* Paramedic Emergency Severity Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0">
                      🤝
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          PARAMEDIC HANDOVER COCKPIT
                        </span>
                        <span className="text-xs text-slate-400">
                          CALL #{activeDispatch.id} • {activeDispatch.callerName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base sm:text-lg text-white font-heading mt-0.5">
                        {activeDispatch.callerIssue}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Severity Urgency: <strong className="text-amber-400">{activeDispatch.urgencyLevel}</strong> • Triage Acuity: <strong className="text-emerald-400">{activeDispatch.mlAcuity || 'ESI-2 (Emergent)'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Paramedic Handover Action Buttons */}
                  <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
                    {activeDispatch.transportMode === 'MEET_HALFWAY' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => recalculateMeetingPointManual()}
                          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Recalculate Point</span>
                        </button>

                        <button
                          type="button"
                          onClick={confirmPatientHandover}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer transform active:scale-98"
                        >
                          <span>🤝</span>
                          <span>CONFIRM PATIENT HANDOVER</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTransportMode('DIRECT_AMBULANCE')}
                          className="px-3 py-2.5 bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-800 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Revert to Direct Pickup"
                        >
                          Revert Direct
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTransportMode('MEET_HALFWAY')}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <span>🤝</span>
                        <span>Activate Midway Handover Mode</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Handover Telemetry Grid */}
                {activeHandover && activeDispatch.transportMode === 'MEET_HALFWAY' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Left 5 Cols: Handover Landmark & Caretaker Live Metrics */}
                    <div className="lg:col-span-5 space-y-4">
                      
                      {/* Landmark Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-black uppercase text-emerald-800 font-mono tracking-wider">
                            📍 DESIGNATED SAFE RENDEZVOUS SPOT
                          </span>
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                            {activeHandover.landmark.safetyRating.replace('_', ' ')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {activeHandover.landmark.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {activeHandover.landmark.address}
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Caretaker ETA</span>
                            <span className="text-base font-black text-amber-700">~{caretakerTelemetry?.etaToMeetingMinutes ?? activeHandover.caretakerEtaMinutes} mins</span>
                            <span className="text-[10px] text-slate-500 block">({caretakerTelemetry?.distanceToMeetingKm ?? activeHandover.caretakerDistanceKm} km)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Ambulance ETA</span>
                            <span className="text-base font-black text-emerald-700">~{activeHandover.ambulanceEtaMinutes} mins</span>
                            <span className="text-[10px] text-slate-500 block">({activeHandover.ambulanceDistanceKm} km)</span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                          {activeHandover.landmark.features.map((f, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Caretaker Vehicle Telemetry Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-black uppercase text-amber-800 font-mono tracking-wider">
                            🚗 CARETAKER VEHICLE TELEMETRY
                          </span>
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            {caretakerTelemetry?.vehicleType || 'LOCAL TRANSPORT'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block">Speed</span>
                            <span className="font-mono font-bold text-slate-800 text-sm">{caretakerTelemetry?.speedKmH || 35} km/h</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block">Live GPS Accuracy</span>
                            <span className="font-mono font-bold text-slate-800 text-sm">±{caretakerTelemetry?.accuracyMeters || 8} meters</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500">
                          Driver & Paramedic Crew: The patient is actively traveling toward the highlighted rendezvous point using local transport. Rendezvous convergence saves ~{activeHandover.timeSavedMinutes} minutes of critical response time.
                        </p>
                      </div>

                    </div>

                    {/* Right 7 Cols: Live Route Map */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>DUAL-APPROACH RENDEZVOUS MAP</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Live OSRM Geometry
                        </span>
                      </div>

                      <div className="rounded-2xl overflow-hidden border border-slate-200">
                        <LeafletMap
                          hospitals={hospitals}
                          ambulances={ambulances}
                          pickupLocation={{ lat: activeHandover.meetingLat, lng: activeHandover.meetingLng, label: activeHandover.landmark.name }}
                          selectedHospitalId={currentHospital.id}
                          height="420px"
                          showRouteLine={true}
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
                      🤝
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Direct Ambulance Pickup Currently Active</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      The emergency is currently configured for direct pickup at the patient's home coordinates. If the caller or ASHA worker confirms local transport is available, tap below to activate Midway Rendezvous.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTransportMode('MEET_HALFWAY')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Activate Midway Handover (Meet-Me Mode)
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-xl">
                  🤝
                </div>
                <h3 className="font-bold text-base text-slate-900">No Active Emergency Handover</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a citizen requests an emergency ambulance and selects "Meet Ambulance Halfway", live dual tracking and the rendezvous cockpit will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 2-WAY EMERGENCY RADIO COMMUNICATIONS               */}
        {/* ========================================================= */}
        {activeTab === 'radio' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    {tr.ambulance.radioCommsTab}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Encrypted real-time communication channel with Hospital ER Command & Citizen Caller.
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {tr.ambulance.channelOpen}
              </span>
            </div>

            {/* Quick Canned Transmission Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {tr.ambulance.quickPresets}
              </span>
              <div className="flex items-center flex-wrap gap-2">
                {[
                  'Patient vitals stabilized; en route to ER gate.',
                  'Severe trauma identified; requesting resuscitation team on standby.',
                  'Patient experiencing chest pain & dyspnea; administering O2.',
                  'Arriving in 3 minutes. Please prepare triage trauma bay.',
                  'Traffic police green corridor active, signal posts cleared.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, preset)}
                    className="text-[11px] font-semibold px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="h-72 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              {activeDispatch?.messages && activeDispatch.messages.length > 0 ? (
                activeDispatch.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-2xl max-w-xl text-xs ${
                      m.sender === 'PARAMEDIC' 
                        ? 'bg-emerald-600 text-white ml-auto shadow-xs' 
                        : (m.sender === 'HOSPITAL' 
                            ? 'bg-blue-600 text-white mr-auto shadow-xs' 
                            : 'bg-white border border-slate-200 text-slate-800 mr-auto')
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4 text-[10px] font-bold opacity-80 pb-1 mb-1 border-b border-white/20">
                      <span>{m.sender === 'PARAMEDIC' ? `PARAMEDIC (${amb.vehicleNumber})` : m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-xs">{m.text}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No radio transmissions yet. Transmit a message using the input below.
                </div>
              )}
            </div>

            {/* Radio Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={tr.ambulance.radioPlaceholder}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{tr.common.transmit}</span>
              </button>
            </form>

          </div>
        )}

      </div>

    </div>
  );
};
