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
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { evaluateAmbulanceTelemetry, checkHospitalCapabilities } from '../utils/mlTriage';
import { EmergencyTrackerCard } from '../components/EmergencyTrackerCard';

export const AmbulanceDashboard: React.FC = () => {
  const { 
    ambulanceUser, 
    logoutAmbulance, 
    ambulances, 
    updateAmbulanceStatus,
    activeDispatch, 
    hospitals, 
    vitals, 
    updateVitals, 
    executeDynamicReroute, 
    loadPresetScenario,
    greenCorridorActive,
    setGreenCorridorActive,
    updateDispatchStep,
    sendDispatchMessage
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const amb = ambulanceUser || ambulances[0];

  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospitals[0];
  const triagePrediction = evaluateAmbulanceTelemetry(vitals);
  const matchResult = checkHospitalCapabilities(currentHospital, triagePrediction.requiredCapabilities, hospitals);

  const isRerouted = activeDispatch?.status === 'REROUTED';
  const targetHospital = isRerouted 
    ? (hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[3])
    : currentHospital;

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendDispatchMessage('PARAMEDIC', chatInput.trim());
    setChatInput('');
    triggerNotify('Radio transmission sent to hospital ER & citizen!');
  };

  const isAssignedToThisAmbulance = activeDispatch && (activeDispatch.assignedAmbulanceId === amb.id || !activeDispatch.assignedAmbulanceId);

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
                  Med<span className="text-emerald-600">Catalyst</span> 108 Cockpit
                </span>
                <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {amb.vehicleNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Driver: <strong className="text-slate-700">{amb.driverName}</strong> • Base: {amb.hospitalName} ({amb.type.includes('ALS') ? 'ALS' : 'BLS'})
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
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="AVAILABLE">🟢 Available for Dispatch</option>
              <option value="DISPATCHED">🟡 Dispatched to Patient</option>
              <option value="PATIENT_ONBOARD">🔴 Patient Onboard</option>
              <option value="ARRIVED_HOSPITAL">🔵 Docked at Hospital</option>
              <option value="MAINTENANCE">⚪ Off-Duty / Maintenance</option>
            </select>

            <Link
              to="/"
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200 shadow-2xs font-semibold cursor-pointer hidden md:flex"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Portal</span>
            </Link>

            <button
              onClick={logoutAmbulance}
              className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-rose-200 cursor-pointer font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Cockpit</span>
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

        {/* ACTIVE DISPATCH INCIDENT CARD (If Assigned) */}
        {isAssignedToThisAmbulance && activeDispatch ? (
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
                    <span className="text-xs font-medium px-2.5 py-0.5 border border-slate-200 text-slate-600 rounded-full bg-white">
                      1 patient(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Google Maps GPS Navigation */}
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
                    className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold text-center transition border border-slate-200 shadow-2xs"
                  >
                    5. Patient Onboard
                  </button>
                  <button
                    onClick={() => {
                      updateDispatchStep(8);
                      triggerNotify('Marked: Ambulance docked at Hospital ER!');
                    }}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold text-center transition border border-slate-200 shadow-2xs"
                  >
                    8. Arrived at ER
                  </button>
                  <button
                    onClick={() => {
                      setGreenCorridorActive(!greenCorridorActive);
                      triggerNotify(greenCorridorActive ? 'Green corridor traffic deactivated' : 'Traffic Police Green Corridor Activated!');
                    }}
                    className={`col-span-2 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      greenCorridorActive 
                        ? 'bg-emerald-600 text-white shadow-xs animate-pulse' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{greenCorridorActive ? '🟢 Green Corridor Active' : 'Request Green Corridor Clearance'}</span>
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
                showControls={false}
                className="w-full shadow-xs text-slate-800"
              />
            </div>

          </div>
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-heading">
                  Ambulance Telemetry Cockpit Ready
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unit {amb.vehicleNumber} is on standby. Awaiting automated 108 GPS emergency dispatch.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              🟢 Fleet Ready
            </span>
          </div>
        )}

        {/* DYNAMIC REROUTE ALERT (If Hospital Lacks Life-Saving Facilities) */}
        {!matchResult.canHandle && !isRerouted && (
          <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-md animate-reroute-alert">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span>CRITICAL CAPABILITY DEFICIT DETECTED BY AI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-heading">
                  Destination [{currentHospital.name}] Cannot Handle Patient Severity!
                </h2>
                <p className="text-xs sm:text-sm text-orange-100">
                  {matchResult.mismatches.join(' • ')}. Continuing on this route wastes the patient's critical "Golden Hour".
                </p>
                <div className="text-xs bg-black/20 rounded-xl p-3 font-mono border border-white/10">
                  Recommended Tertiary Center: <strong>{matchResult.recommendedHospital?.name}</strong> (+{matchResult.recommendedHospital ? matchResult.recommendedHospital.etaMinutes - currentHospital.etaMinutes : 12} mins, has 24/7 Cath Lab & Neuro-ICU on active shift).
                </div>
              </div>

              <button
                onClick={executeDynamicReroute}
                className="px-6 py-4 bg-white text-rose-700 hover:bg-rose-50 rounded-xl font-extrabold text-sm shadow-xl transition transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 text-rose-600" />
                <span>ENACT DYNAMIC AI REROUTE & ALTER GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* Preset Evaluation Scenarios Bar */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            Patient Telemetry & Vitals Presets:
          </span>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => loadPresetScenario('BIKE_HEAD_TRAUMA')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition"
            >
              🏍️ Severe Head Trauma (GCS 8)
            </button>
            <button
              onClick={() => loadPresetScenario('ACUTE_STEMI_HEART')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition"
            >
              ❤️ Acute STEMI Heart Attack
            </button>
            <button
              onClick={() => loadPresetScenario('MILD_FEVER_CLINIC')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 rounded-xl font-bold border border-slate-200 transition"
            >
              🩺 Mild Vitals (Stable)
            </button>
          </div>
        </div>

        {/* Main Grid: Sensors + AI Inference + Radio Comms */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Sensor Controls (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  In-Ambulance IoT Telemetry Sensors
                </h3>
              </div>
              <span className="text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Sensors Active
              </span>
            </div>

            {/* GCS Slider */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>Glasgow Coma Scale (GCS 3-15)</span>
                </span>
                <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  vitals.gcs <= 8 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  Score: {vitals.gcs}/15 ({vitals.gcs <= 8 ? 'Comatose / Intubate' : 'Mild/Normal'})
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                value={vitals.gcs}
                onChange={(e) => updateVitals({ gcs: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Heart Rate & SpO2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Heart Rate (BPM)</span>
                  </span>
                  <span className="font-mono text-sm font-bold text-rose-700">{vitals.heart_rate}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={vitals.heart_rate}
                  onChange={(e) => updateVitals({ heart_rate: parseInt(e.target.value) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-sky-600" />
                    <span>Oxygen SpO2 (%)</span>
                  </span>
                  <span className={`font-mono text-sm font-bold ${vitals.spo2 < 90 ? 'text-rose-600' : 'text-sky-700'}`}>
                    {vitals.spo2}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={vitals.spo2}
                  onChange={(e) => updateVitals({ spo2: parseInt(e.target.value) })}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Clinical Condition Checkboxes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                vitals.ecg_stemi 
                  ? 'bg-rose-50 border-rose-300 text-rose-900' 
                  : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
              }`}>
                <span className="font-bold text-xs">ECG STEMI (Heart Attack)</span>
                <input
                  type="checkbox"
                  checked={vitals.ecg_stemi === 1}
                  onChange={(e) => updateVitals({ ecg_stemi: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
              </label>

              <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                vitals.trauma 
                  ? 'bg-amber-50 border-amber-300 text-amber-900' 
                  : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
              }`}>
                <span className="font-bold text-xs">Severe Trauma / Bleeding</span>
                <input
                  type="checkbox"
                  checked={vitals.trauma === 1}
                  onChange={(e) => updateVitals({ trauma: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Right: AI Triage Assessment + Radio Comms (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Machine Learning Triage Assessment Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Machine Learning Emergency Triage
              </span>
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-extrabold text-slate-900 font-heading">
                  {triagePrediction.acuityLabel}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
                  triagePrediction.acuity === 'ESI-1' 
                    ? 'bg-rose-50 text-rose-800 border-rose-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {triagePrediction.acuity}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Required Life-Saving Facilities:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {triagePrediction.requiredCapabilities.map((cap) => (
                  <span key={cap} className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-mono font-semibold">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* 2-Way Emergency Radio Channel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Emergency Radio Channel
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  LIVE COMMS
                </span>
              </div>

              {/* Chat Stream */}
              <div className="h-44 overflow-y-auto space-y-2 text-xs p-1">
                {activeDispatch?.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl ${
                      m.sender === 'PARAMEDIC' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 ml-4' 
                        : (m.sender === 'HOSPITAL' 
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 mr-4' 
                            : 'bg-slate-50 border border-slate-200 text-slate-800 mr-4')
                    }`}
                  >
                    <div className="flex justify-between text-[10px] font-bold opacity-75">
                      <span>{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="mt-0.5 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Radio Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Transmit message to Hospital ER..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
