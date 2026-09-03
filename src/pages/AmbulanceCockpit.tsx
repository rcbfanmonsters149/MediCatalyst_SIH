import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  Wind, 
  Brain, 
  Zap, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  RotateCcw, 
  ArrowRight, 
  Cpu, 
  Building2, 
  Sparkles,
  MapPin,
  Flame,
  Stethoscope
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { evaluateAmbulanceTelemetry, checkHospitalCapabilities, getCapabilityFriendlyName } from '../utils/mlTriage';
import { LeafletMap } from '../components/LeafletMap';

export const AmbulanceCockpit: React.FC = () => {
  const { 
    vitals, 
    updateVitals, 
    hospitals, 
    activeDispatch, 
    executeDynamicReroute,
    loadPresetScenario,
    greenCorridorActive
  } = useApp();

  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospitals[0];
  const triagePrediction = evaluateAmbulanceTelemetry(vitals);
  const matchResult = checkHospitalCapabilities(currentHospital, triagePrediction.requiredCapabilities, hospitals);

  const isRerouted = activeDispatch?.status === 'REROUTED';
  const targetHospital = isRerouted 
    ? (hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[3])
    : currentHospital;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Context */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
              In-Ambulance IoT Telemetry Cockpit
            </span>
            <span className="text-xs font-mono text-slate-500">Unit: HR-10-EM-1081 (ALS)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            Real-Time Machine Learning Triage & Hospital Rerouting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Paramedic sensor feed automatically matches patient acuity against receiving hospital capabilities.
          </p>
        </div>

        {/* Quick Scenario Buttons for Evaluators */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => loadPresetScenario('BIKE_HEAD_TRAUMA')}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition"
          >
            🏍️ Head Trauma (GCS 8)
          </button>
          <button
            onClick={() => loadPresetScenario('ACUTE_STEMI_HEART')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition"
          >
            ❤️ Acute STEMI
          </button>
          <button
            onClick={() => loadPresetScenario('MILD_FEVER_CLINIC')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition"
          >
            🩺 Mild Vitals (No Reroute)
          </button>
        </div>
      </div>

      {/* REROUTE ALERT BANNER (If Hospital Lacks Capabilities) */}
      {!matchResult.canHandle && !isRerouted && (
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-xl animate-reroute-alert">
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
                Recommended Center: <strong>{matchResult.recommendedHospital?.name}</strong> (+{matchResult.recommendedHospital ? matchResult.recommendedHospital.etaMinutes - currentHospital.etaMinutes : 12} mins, has 24/7 Cath Lab & Neuro-ICU on active shift).
              </div>
            </div>

            <button
              onClick={executeDynamicReroute}
              className="px-6 py-4 bg-white text-red-700 hover:bg-red-50 rounded-xl font-extrabold text-sm shadow-xl transition transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-red-600" />
              <span>ENACT DYNAMIC AI REROUTE & ALTER GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* If Reroute is ACTIVE */}
      {isRerouted && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-950">
                Dynamic Reroute Active: Diverted to {targetHospital.name}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Path altered in ambulance navigation. ICU Bed reserved. Traffic Police Green Corridor alert issued!
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300">
            Green Corridor Locked 🟢
          </span>
        </div>
      )}

      {/* Main Grid: Paramedic Telemetry Sliders + ML Model Inference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Paramedic Sliders / Inputs (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-base text-slate-900 font-heading">
                In-Ambulance Sensor Inputs (IoT Telemetry Stream)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Sync</span>
          </div>

          <div className="space-y-5 text-xs">
            
            {/* Glasgow Coma Scale (GCS) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>Glasgow Coma Scale (GCS 3-15)</span>
                </span>
                <span className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                  vitals.gcs <= 8 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {vitals.gcs} / 15 ({vitals.gcs <= 8 ? 'Severe Comatose / Intubation' : (vitals.gcs <= 12 ? 'Moderate' : 'Mild/Normal')})
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
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3 (Deep Unconscious)</span>
                <span>8 (Airway Compromise)</span>
                <span>15 (Fully Alert)</span>
              </div>
            </div>

            {/* SpO2 Oxygen Saturation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-sky-600" />
                  <span>Oxygen Saturation (SpO2 %)</span>
                </span>
                <span className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                  vitals.spo2 < 88 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {vitals.spo2}% ({vitals.spo2 < 88 ? 'Critical Hypoxia' : 'Adequate'})
                </span>
              </div>
              <input
                type="range"
                min="65"
                max="100"
                value={vitals.spo2}
                onChange={(e) => updateVitals({ spo2: parseInt(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>65% (Severe Failure)</span>
                <span>88% (Ventilator Threshold)</span>
                <span>100% (Normal)</span>
              </div>
            </div>

            {/* Heart Rate & Blood Pressure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Heart Rate (BPM)</span>
                  </span>
                  <span className="font-mono font-bold text-rose-700">{vitals.heart_rate} bpm</span>
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

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Systolic BP (mmHg)</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{vitals.systolic_bp} mmHg</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="220"
                  value={vitals.systolic_bp}
                  onChange={(e) => updateVitals({ systolic_bp: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* ECG Rhythm & Trauma Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* ECG STEMI Toggle */}
              <div 
                onClick={() => updateVitals({ ecg_stemi: vitals.ecg_stemi === 1 ? 0 : 1 })}
                className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                  vitals.ecg_stemi === 1 
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-800">12-Lead ECG: STEMI</h4>
                  <p className="text-[10px] text-slate-500">ST-Elevation Myocardial Infarction</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  vitals.ecg_stemi === 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {vitals.ecg_stemi === 1 ? 'ACTIVE' : 'NORMAL'}
                </span>
              </div>

              {/* Trauma Flag Toggle */}
              <div 
                onClick={() => updateVitals({ trauma: vitals.trauma === 1 ? 0 : 1 })}
                className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                  vitals.trauma === 1 
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-800">Severe Trauma Flag</h4>
                  <p className="text-[10px] text-slate-500">Polytrauma / Road Crash / Fall</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  vitals.trauma === 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {vitals.trauma === 1 ? 'TRAUMA' : 'NONE'}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* Right Column: ML Model Triage Prediction & Hospital Capability Matcher (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Machine Learning Model Output Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs">ML Triage Engine</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">RandomForest v1.0</span>
            </div>

            {/* Acuity Level Badge */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Acuity (ESI)</span>
                <h4 className="font-extrabold text-base text-slate-900">{triagePrediction.acuityLabel}</h4>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${
                triagePrediction.acuity === 'ESI-1'
                  ? 'bg-red-600 text-white animate-pulse'
                  : (triagePrediction.acuity === 'ESI-2' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white')
              }`}>
                {triagePrediction.acuity}
              </span>
            </div>

            {/* Derived Capabilities Required */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Critical Hospital Facilities Required by Patient:
              </span>
              <div className="space-y-1">
                {triagePrediction.requiredCapabilities.length > 0 ? (
                  triagePrediction.requiredCapabilities.map(cap => (
                    <div key={cap} className="flex items-center justify-between p-2 bg-indigo-50/60 rounded-lg text-xs border border-indigo-100 text-indigo-950 font-medium">
                      <span>• {getCapabilityFriendlyName(cap)}</span>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">MANDATORY</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded">
                    Standard primary care & observation sufficient.
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Risks Identified by Model */}
            {triagePrediction.clinicalRiskSummary.length > 0 && (
              <div className="space-y-1 text-xs text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400">Clinical Risk Signals:</span>
                {triagePrediction.clinicalRiskSummary.map((risk, idx) => (
                  <p key={idx} className="text-[11px] text-rose-700 bg-rose-50/70 p-1.5 rounded border border-rose-100">
                    ⚠️ {risk}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Capability Matching Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Facility Compatibility Check</span>
              </h3>
              <span className="text-xs text-slate-500">Destination</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 text-sm">{targetHospital.name}</div>
              <div className="text-slate-500">{targetHospital.type} • ETA: ~{targetHospital.etaMinutes} mins</div>
            </div>

            {/* Mismatch warnings */}
            {matchResult.canHandle ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>100% Match:</strong> {targetHospital.name} is fully equipped with all needed specialists and beds for this case.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="font-bold">Missing Critical Resources at Destination:</div>
                  {matchResult.mismatches.map((m, idx) => (
                    <div key={idx} className="text-[11px] text-rose-700">• {m}</div>
                  ))}
                </div>

                {!isRerouted && (
                  <button
                    onClick={executeDynamicReroute}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Reroute to {matchResult.recommendedHospital?.name}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dynamic Route Map */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Live Ambulance GPS Navigation & Reroute Path Alteration
            </h3>
          </div>
          {isRerouted && (
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 animate-pulse">
              ⚡ Path Altered to Apex Super-Specialty
            </span>
          )}
        </div>

        <LeafletMap
          hospitals={hospitals}
          pickupLocation={activeDispatch ? { lat: activeDispatch.pickupLat, lng: activeDispatch.pickupLng, label: activeDispatch.pickupAddress } : undefined}
          selectedHospitalId={currentHospital.id}
          rerouteDestination={isRerouted ? targetHospital : null}
          showReroutePath={isRerouted}
          height="380px"
        />
      </div>

    </div>
  );
};
