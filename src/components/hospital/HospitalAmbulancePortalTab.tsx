import React, { useState } from 'react';
import { 
  Truck, 
  Activity, 
  Heart, 
  Wind, 
  Brain, 
  Thermometer, 
  Droplet, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Building2, 
  MapPin, 
  Upload, 
  Clock, 
  FileText,
  Stethoscope,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateAmbulanceAssessment, checkHospitalCapabilities, getCapabilityFriendlyName } from '../../utils/mlTriage';
import { LeafletMap } from '../LeafletMap';
import { Hospital } from '../../types';

interface HospitalAmbulancePortalTabProps {
  hospital: Hospital;
  onNotify?: (msg: string) => void;
}

export const HospitalAmbulancePortalTab: React.FC<HospitalAmbulancePortalTabProps> = ({ 
  hospital, 
  onNotify 
}) => {
  const { 
    ambulanceAssessment, 
    updateAmbulanceAssessment, 
    uploadAmbulanceAssessment, 
    hospitals, 
    activeDispatch,
    loadPresetScenario
  } = useApp();

  const [formSavedSuccess, setFormSavedSuccess] = useState(false);

  // Form input local states initialized from context
  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospital;
  const isRerouted = activeDispatch?.status === 'REROUTED';
  const targetHospital = isRerouted 
    ? (hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[3])
    : currentHospital;

  const triagePrediction = evaluateAmbulanceAssessment(ambulanceAssessment);
  const matchResult = checkHospitalCapabilities(currentHospital, triagePrediction.requiredCapabilities, hospitals);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadAmbulanceAssessment(ambulanceAssessment);
    setFormSavedSuccess(true);
    if (onNotify) {
      onNotify('Ambulance Assessment Form uploaded to hospital network! AI triage computed.');
    }
    setTimeout(() => setFormSavedSuccess(false), 4000);
  };

  const pickupLocation = activeDispatch 
    ? { lat: activeDispatch.pickupLat, lng: activeDispatch.pickupLng, label: activeDispatch.pickupAddress }
    : { lat: 28.7080, lng: 77.0980, label: 'Near Village Rampur Chowk' };

  return (
    <div className="bg-white space-y-6">
      
      {/* AMBULANCE CREW IDENTITY & VEHICLE BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              In-Ambulance Paramedic Portal
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Unit: HR-10-EM-1081 (ALS)
            </span>
            <span className="text-xs text-slate-500">
              Paramedic: <strong>Jagdish Sharma</strong>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
            Patient Intake & Pre-Hospital Assessment Desk
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Fill the patient vital signs and emergency parameters below. Uploading this form enables backend AI to predict patient emergency severity and dynamically reroute to prior specialized facilities if necessary.
          </p>
        </div>

        {/* Quick Demo Pre-fill Presets */}
        <div className="space-y-1 self-stretch md:self-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
            Quick-Fill Clinical Cases:
          </span>
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                loadPresetScenario('BIKE_HEAD_TRAUMA');
                if (onNotify) onNotify('Loaded: Head Trauma Bike Crash (GCS 8)');
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 transition cursor-pointer"
            >
              🏍️ Trauma (GCS 8)
            </button>
            <button
              type="button"
              onClick={() => {
                loadPresetScenario('ACUTE_STEMI_HEART');
                if (onNotify) onNotify('Loaded: Acute STEMI Myocardial Infarction');
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
            >
              ❤️ Acute STEMI
            </button>
            <button
              type="button"
              onClick={() => {
                loadPresetScenario('MILD_FEVER_CLINIC');
                if (onNotify) onNotify('Loaded: Stable Outpatient Vitals');
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition cursor-pointer"
            >
              🩺 Mild / Stable
            </button>
          </div>
        </div>
      </div>

      {/* REROUTE ADVISORY BANNER (If facility deficit detected) */}
      {!matchResult.canHandle && (
        <div className="bg-white rounded-2xl p-6 border-2 border-red-500 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
              🚨 AI CLINICAL REROUTE ADVISORY
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              Assigned Facility [{currentHospital.name}] Lacks Critical Capabilities For This Patient!
            </h3>
            <p className="text-xs text-red-700 font-semibold">
              Deficit: {matchResult.mismatches.join(' • ')}
            </p>
            <p className="text-xs text-slate-600">
              Recommended Alternative: <strong className="text-slate-900">{matchResult.recommendedHospital?.name}</strong> (+{matchResult.recommendedHospital ? matchResult.recommendedHospital.etaMinutes - currentHospital.etaMinutes : 12} mins, fully staffed with 24/7 Cath Lab & Neuro-ICU on duty).
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500">
              Status: {isRerouted ? <strong className="text-emerald-700">Dynamic Reroute Active to {targetHospital.name}</strong> : 'Pending form upload / automatic reroute'}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              Green Corridor Activated 🟢
            </span>
          </div>
        </div>
      )}

      {/* FORM SUBMISSION SUCCESS ALERT */}
      {formSavedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-emerald-900 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>In-Ambulance Form successfully uploaded to hospital system and evaluated by AI triage engine!</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700">Live Synced</span>
        </div>
      )}

      {/* TWO COLUMN GRID: INTAKE FORM (7 COLS) + AI TRIAGE & ROUTING DECISION (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: THE DEFINITE AMBULANCE INTAKE FORM */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  Paramedic Clinical Assessment Form
                </h3>
                <p className="text-[11px] text-slate-500">
                  Record exact on-scene measurements taken inside the ambulance.
                </p>
              </div>
            </div>
            {ambulanceAssessment.isUploaded ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Uploaded ({ambulanceAssessment.uploadedAt})</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                Draft / Unsubmitted
              </span>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
            
            {/* SECTION 1: VITAL SIGNS */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Core Hemodynamic Vitals</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Blood Pressure (Systolic / Diastolic) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>Blood Pressure (mmHg)</span>
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      ambulanceAssessment.systolic_bp < 90 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ambulanceAssessment.systolic_bp < 90 ? 'Hypotension' : 'Normal'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Systolic (SBP)</label>
                      <input
                        type="number"
                        min="50"
                        max="240"
                        value={ambulanceAssessment.systolic_bp}
                        onChange={(e) => updateAmbulanceAssessment({ systolic_bp: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Diastolic (DBP)</label>
                      <input
                        type="number"
                        min="30"
                        max="140"
                        value={ambulanceAssessment.diastolic_bp}
                        onChange={(e) => updateAmbulanceAssessment({ diastolic_bp: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        placeholder="80"
                      />
                    </div>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>Heart Rate (BPM)</span>
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      {ambulanceAssessment.heart_rate} bpm
                    </span>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    value={ambulanceAssessment.heart_rate}
                    onChange={(e) => updateAmbulanceAssessment({ heart_rate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="75"
                  />
                  <div className="text-[10px] text-slate-500">
                    Range: 60-100 normal. Current: {ambulanceAssessment.heart_rate > 100 ? 'Tachycardia' : (ambulanceAssessment.heart_rate < 60 ? 'Bradycardia' : 'Normal')}
                  </div>
                </div>

                {/* Oxygen Saturation (SpO2) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Wind className="w-4 h-4 text-sky-600" />
                      <span>Oxygen Saturation (SpO2 %)</span>
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      ambulanceAssessment.spo2 < 90 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ambulanceAssessment.spo2}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={ambulanceAssessment.spo2}
                    onChange={(e) => updateAmbulanceAssessment({ spo2: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="98"
                  />
                  <div className="text-[10px] text-slate-500">
                    {ambulanceAssessment.spo2 < 88 ? 'Critical Hypoxia (Ventilator Threshold)' : 'Adequate saturation'}
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Wind className="w-4 h-4 text-indigo-600" />
                      <span>Respiratory Rate (bpm)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {ambulanceAssessment.resp_rate} /min
                    </span>
                  </div>
                  <input
                    type="number"
                    min="6"
                    max="60"
                    value={ambulanceAssessment.resp_rate}
                    onChange={(e) => updateAmbulanceAssessment({ resp_rate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="18"
                  />
                  <div className="text-[10px] text-slate-500">
                    Normal adult: 12-20 breaths per min.
                  </div>
                </div>

                {/* Body Temperature */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Thermometer className="w-4 h-4 text-amber-600" />
                      <span>Temperature (°C)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {ambulanceAssessment.body_temp}°C
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="32"
                    max="43"
                    value={ambulanceAssessment.body_temp}
                    onChange={(e) => updateAmbulanceAssessment({ body_temp: parseFloat(e.target.value) || 37.0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="36.8"
                  />
                </div>

                {/* Blood Glucose */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Droplet className="w-4 h-4 text-rose-500" />
                      <span>Random Blood Sugar (mg/dL)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {ambulanceAssessment.blood_glucose} mg/dL
                    </span>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    value={ambulanceAssessment.blood_glucose}
                    onChange={(e) => updateAmbulanceAssessment({ blood_glucose: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="110"
                  />
                </div>

              </div>
            </div>

            {/* SECTION 2: NEUROLOGICAL & CONSCIOUSNESS */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span>2. Neurological & Consciousness Evaluation</span>
              </span>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Glasgow Coma Scale (GCS 3–15)</h4>
                    <p className="text-[10px] text-slate-500">
                      Evaluates eye opening (1-4), verbal response (1-5), and motor response (1-6).
                    </p>
                  </div>
                  <span className={`font-mono text-xs font-black px-3 py-1 rounded-full ${
                    ambulanceAssessment.gcs <= 8 ? 'bg-red-100 text-red-800 border border-red-300' : (ambulanceAssessment.gcs <= 12 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                  }`}>
                    GCS: {ambulanceAssessment.gcs} / 15 ({ambulanceAssessment.gcs <= 8 ? 'Severe / Comatose' : (ambulanceAssessment.gcs <= 12 ? 'Moderate' : 'Mild/Normal')})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={ambulanceAssessment.gcs}
                    onChange={(e) => updateAmbulanceAssessment({ gcs: parseInt(e.target.value) })}
                    className="flex-1 accent-purple-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={ambulanceAssessment.gcs}
                    onChange={(e) => updateAmbulanceAssessment({ gcs: parseInt(e.target.value) || 3 })}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 text-[10px] text-slate-500 pt-1">
                  <span>3-8: Severe (Intubation & Neuro-ICU)</span>
                  <span className="text-center">9-12: Moderate Impairment</span>
                  <span className="text-right">13-15: Minor / Alert</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: CRITICAL EMERGENCY FLAGS */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>3. Critical Clinical Emergency Flags</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 12-Lead ECG Finding */}
                <div 
                  onClick={() => updateAmbulanceAssessment({ ecg_stemi: ambulanceAssessment.ecg_stemi === 1 ? 0 : 1 })}
                  className={`p-4 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                    ambulanceAssessment.ecg_stemi === 1 
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900">12-Lead ECG: STEMI</h4>
                    <p className="text-[10px] text-slate-500">ST-Elevation Myocardial Infarction</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ambulanceAssessment.ecg_stemi === 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ambulanceAssessment.ecg_stemi === 1 ? 'ACTIVE STEMI' : 'NORMAL'}
                  </span>
                </div>

                {/* Trauma Flag */}
                <div 
                  onClick={() => updateAmbulanceAssessment({ trauma: ambulanceAssessment.trauma === 1 ? 0 : 1 })}
                  className={`p-4 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                    ambulanceAssessment.trauma === 1 
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900">Severe Trauma / Polytrauma</h4>
                    <p className="text-[10px] text-slate-500">Road crash, heavy fall, or penetrating wound</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ambulanceAssessment.trauma === 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ambulanceAssessment.trauma === 1 ? 'SEVERE TRAUMA' : 'NONE'}
                  </span>
                </div>

              </div>
            </div>

            {/* SECTION 4: PARAMEDIC CLINICAL NOTES */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>4. Paramedic Field Notes & Observations</span>
              </label>
              <textarea
                rows={2}
                value={ambulanceAssessment.paramedicNotes || ''}
                onChange={(e) => updateAmbulanceAssessment({ paramedicNotes: e.target.value })}
                placeholder="Document patient consciousness, visible injuries, bleeding status, interventions administered on scene..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* UPLOAD ACTION BUTTON */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Uploaded by: <strong>{ambulanceAssessment.uploadedBy || 'Paramedic Unit HR-10-EM-1081'}</strong>
              </span>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>UPLOAD IN-AMBULANCE FORM & RUN AI FACILITY MATCH</span>
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: AI TRIAGE PREDICTION & FACILITY MATCH DECISION (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* AI Triage Acuity Assessment Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  AI Emergency Severity Index (ESI)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">RandomForest v1.0</span>
            </div>

            {/* Acuity Level Pill */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Computed Patient Acuity</span>
                <h4 className="font-black text-base text-slate-900 mt-0.5">{triagePrediction.acuityLabel}</h4>
              </div>
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-full shadow-2xs ${
                triagePrediction.acuity === 'ESI-1'
                  ? 'bg-red-600 text-white animate-pulse'
                  : (triagePrediction.acuity === 'ESI-2' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white')
              }`}>
                {triagePrediction.acuity}
              </span>
            </div>

            {/* Specialized Capabilities Required by Patient */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Required Specialized Facilities:
              </span>
              <div className="space-y-1.5">
                {triagePrediction.requiredCapabilities.length > 0 ? (
                  triagePrediction.requiredCapabilities.map(cap => (
                    <div key={cap} className="flex items-center justify-between p-2.5 bg-indigo-50/70 rounded-xl text-xs border border-indigo-100 text-indigo-950 font-semibold">
                      <span>• {getCapabilityFriendlyName(cap)}</span>
                      <span className="text-[10px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">MANDATORY</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    Standard primary care & observation sufficient. No specialized tertiary units needed.
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Risks Identified */}
            {triagePrediction.clinicalRiskSummary.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Identified High-Risk Triggers:</span>
                {triagePrediction.clinicalRiskSummary.map((risk, idx) => (
                  <p key={idx} className="text-[11px] text-rose-800 bg-rose-50/80 p-2 rounded-lg border border-rose-200">
                    ⚠️ {risk}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Capability Matcher & Rerouting Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Destination Compatibility Check
                </h3>
              </div>
              <span className="text-xs text-slate-500">Auto Evaluated</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">{targetHospital.name}</div>
              <div className="text-slate-500">{targetHospital.type} • ETA: ~{targetHospital.etaMinutes} mins</div>
            </div>

            {/* MATCH OUTCOME */}
            {matchResult.canHandle ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Destination Confirmed</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  {targetHospital.name} is fully equipped with required specialist doctors and beds to treat this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Missing Critical Resources at Initial Destination:</span>
                  </div>
                  {matchResult.mismatches.map((m, idx) => (
                    <div key={idx} className="text-[11px] text-red-700 font-medium">• {m}</div>
                  ))}
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800">
                    ⚡ Backend Reroute Decision:
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Diverting route to <strong>{matchResult.recommendedHospital?.name}</strong> to safeguard patient life and prevent catastrophic treatment delay.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* AMBULANCE GPS ROUTE TRACKING */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-900 font-heading">
              In-Transit Ambulance Navigation Map & Active Path
            </h3>
          </div>
          {isRerouted && (
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 animate-pulse">
              ⚡ Route Altered to Apex Super-Specialty Hospital
            </span>
          )}
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <LeafletMap
            hospitals={hospitals}
            pickupLocation={pickupLocation}
            selectedHospitalId={currentHospital.id}
            rerouteDestination={isRerouted ? targetHospital : null}
            showReroutePath={isRerouted}
            height="340px"
          />
        </div>
      </div>

    </div>
  );
};
