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
import { LeafletMap } from '../components/LeafletMap';
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
    triggerNotify('Radio transmission broadcast to hospital ER & citizen!');
  };

  const isAssignedToThisAmbulance = activeDispatch && (activeDispatch.assignedAmbulanceId === amb.id || !activeDispatch.assignedAmbulanceId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white font-heading">
                  Med<span className="text-emerald-400">Catalyst</span> 108 Fleet Cockpit
                </span>
                <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {amb.vehicleNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Driver: <strong className="text-slate-200">{amb.driverName}</strong> • Base: {amb.hospitalName} ({amb.type.includes('ALS') ? 'ALS' : 'BLS'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Selector */}
            <select
              value={amb.status}
              onChange={(e) => {
                updateAmbulanceStatus(amb.id, e.target.value as any);
                triggerNotify(`Ambulance status changed to ${e.target.value}!`);
              }}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-emerald-300 text-xs font-bold rounded-xl focus:outline-hidden"
            >
              <option value="AVAILABLE">🟢 Available for Dispatch</option>
              <option value="DISPATCHED">🟡 Dispatched to Patient</option>
              <option value="PATIENT_ONBOARD">🔴 Patient Onboard</option>
              <option value="ARRIVED_HOSPITAL">🔵 Docked at Hospital</option>
              <option value="MAINTENANCE">⚪ Off-Duty / Refueling</option>
            </select>

            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-slate-800 cursor-pointer hidden md:flex"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Portal</span>
            </Link>

            <button
              onClick={logoutAmbulance}
              className="text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-rose-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Cockpit</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Live Notification Banner */}
        {notification && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* ACTIVE DISPATCH INCIDENT CARD (If Assigned) */}
        {isAssignedToThisAmbulance && activeDispatch ? (
          <div className="bg-slate-950 border-2 border-red-500 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-red-500 animate-ping"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-950 px-2.5 py-0.5 rounded-full border border-red-800">
                      🚨 ACTIVE 108 EMERGENCY MISSION (#{activeDispatch.id})
                    </span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                      Urgency: {activeDispatch.urgencyLevel}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white font-heading mt-1">
                    {activeDispatch.callerIssue}
                  </h2>
                </div>
              </div>

              {/* GPS Navigation Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeDispatch.pickupLat},${activeDispatch.pickupLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Start Google Maps Navigation</span>
              </a>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Patient & Pickup Spot:</span>
                <p className="font-bold text-white text-sm mt-0.5">{activeDispatch.callerName}</p>
                <p className="text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{activeDispatch.pickupAddress}</span>
                </p>
                <p className="text-slate-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <a href={`tel:${activeDispatch.callerPhone}`} className="text-emerald-400 underline font-mono">
                    {activeDispatch.callerPhone}
                  </a>
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Assigned Destination Hospital:</span>
                <p className="font-bold text-white text-sm mt-0.5">{targetHospital.name}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{targetHospital.address}</p>
                <span className="inline-block mt-2 text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  {isRerouted ? '⚡ AI Diverted Destination' : 'Nearest Intake Center'}
                </span>
              </div>

              {/* Quick Driver Status Advance Buttons */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Crew Stage Action:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateDispatchStep(5);
                      triggerNotify('Marked: Patient Picked Up & Onboard!');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold text-center transition border border-slate-700"
                  >
                    5. Patient Onboard
                  </button>
                  <button
                    onClick={() => {
                      updateDispatchStep(8);
                      triggerNotify('Marked: Ambulance docked at Hospital ER Bay!');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold text-center transition border border-slate-700"
                  >
                    8. Arrived at ER
                  </button>
                  <button
                    onClick={() => {
                      setGreenCorridorActive(!greenCorridorActive);
                      triggerNotify(greenCorridorActive ? 'Green corridor traffic deactivated' : 'Traffic Police Green Corridor Activated!');
                    }}
                    className={`col-span-2 p-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      greenCorridorActive 
                        ? 'bg-emerald-600 text-white animate-pulse' 
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
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
                className="w-full shadow-lg text-slate-800"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Ambulance Telemetry Cockpit Ready</h3>
                <p className="text-xs text-slate-400">
                  Unit {amb.vehicleNumber} is on standby. Awaiting automated 108 GPS emergency dispatch.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800">
              🟢 Fleet Ready
            </span>
          </div>
        )}

        {/* REROUTE ALERT BANNER (If Destination Lacks Facilities) */}
        {!matchResult.canHandle && !isRerouted && (
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 shadow-xl animate-reroute-alert">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span>CRITICAL CAPABILITY DEFICIT DETECTED BY AI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-heading">
                  Destination [{currentHospital.name}] Cannot Handle Patient Severity!
                </h2>
                <p className="text-xs sm:text-sm text-orange-100">
                  {matchResult.mismatches.join(' • ')}. Continuing on this route wastes the patient's critical "Golden Hour".
                </p>
                <div className="text-xs bg-white/10 rounded-lg p-2.5 font-mono">
                  Recommended Tertiary Center: <strong>{matchResult.recommendedHospital?.name}</strong> (+{matchResult.recommendedHospital ? matchResult.recommendedHospital.etaMinutes - currentHospital.etaMinutes : 12} mins, has 24/7 Cath Lab & Neuro-ICU on active shift).
                </div>
              </div>

              <button
                onClick={executeDynamicReroute}
                className="px-6 py-4 bg-white text-red-700 hover:bg-red-50 rounded-xl font-extrabold text-sm shadow-xl transition transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 text-red-600" />
                <span>ENACT DYNAMIC AI REROUTE & ALTER GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* Preset Scenarios for Paramedic Testing */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">
            Simulate Patient Acuity Telemetry:
          </span>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => loadPresetScenario('BIKE_HEAD_TRAUMA')}
              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg font-bold border border-red-800 transition"
            >
              🏍️ Severe Head Trauma (GCS 8)
            </button>
            <button
              onClick={() => loadPresetScenario('ACUTE_STEMI_HEART')}
              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg font-bold border border-rose-800 transition"
            >
              ❤️ Acute STEMI Heart Attack
            </button>
            <button
              onClick={() => loadPresetScenario('MILD_FEVER_CLINIC')}
              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg font-bold border border-emerald-800 transition"
            >
              🩺 Mild Vitals (Stable)
            </button>
          </div>
        </div>

        {/* Main Grid: Sensor Controls + AI Inference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Vitals Sliders (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white font-heading">
                  In-Ambulance IoT Telemetry Sensors
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Connected
              </span>
            </div>

            {/* GCS */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>Glasgow Coma Scale (GCS 3-15)</span>
                </span>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  vitals.gcs <= 8 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  Score: {vitals.gcs}/15
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                value={vitals.gcs}
                onChange={(e) => updateVitals({ gcs: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Heart Rate & SpO2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Heart Rate (BPM)</span>
                  </span>
                  <span className="font-mono text-sm font-bold text-rose-400">{vitals.heart_rate}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={vitals.heart_rate}
                  onChange={(e) => updateVitals({ heart_rate: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-sky-400" />
                    <span>Oxygen SpO2 (%)</span>
                  </span>
                  <span className={`font-mono text-sm font-bold ${vitals.spo2 < 90 ? 'text-red-400' : 'text-sky-400'}`}>
                    {vitals.spo2}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={vitals.spo2}
                  onChange={(e) => updateVitals({ spo2: parseInt(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Clinical Criticality Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                vitals.ecg_stemi ? 'bg-rose-950/80 border-rose-600 text-rose-200' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="font-bold text-xs">ECG ST-Elevation (STEMI)</span>
                <input
                  type="checkbox"
                  checked={vitals.ecg_stemi === 1}
                  onChange={(e) => updateVitals({ ecg_stemi: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-rose-600"
                />
              </label>

              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                vitals.trauma ? 'bg-amber-950/80 border-amber-600 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="font-bold text-xs">Severe Trauma / Hemorrhage</span>
                <input
                  type="checkbox"
                  checked={vitals.trauma === 1}
                  onChange={(e) => updateVitals({ trauma: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-amber-600"
                />
              </label>
            </div>
          </div>

          {/* Right: AI Prediction & Emergency Radio Comms (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* AI Classification Card */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Machine Learning Triage Assessment
              </span>
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-black text-white font-heading">
                  {triagePrediction.acuityLabel}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                  triagePrediction.acuity === 'ESI-1' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                }`}>
                  {triagePrediction.acuity}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Required Life-Saving Capabilities:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {triagePrediction.requiredCapabilities.map((cap) => (
                  <span key={cap} className="px-2.5 py-1 bg-slate-900 text-slate-200 border border-slate-800 rounded-md text-[11px] font-mono">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* 2-Way Live Radio Communication */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Emergency Radio Channel
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">LIVE COMMS</span>
              </div>

              <div className="h-44 overflow-y-auto space-y-2 text-xs p-1">
                {activeDispatch?.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl ${
                      m.sender === 'PARAMEDIC' 
                        ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200 ml-4' 
                        : (m.sender === 'HOSPITAL' 
                            ? 'bg-blue-950/80 border border-blue-800 text-blue-200 mr-4' 
                            : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4')
                    }`}
                  >
                    <div className="flex justify-between text-[10px] font-bold opacity-75">
                      <span>{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="mt-0.5">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Transmit message to Hospital ER..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer"
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
