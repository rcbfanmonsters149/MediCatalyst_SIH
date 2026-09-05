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
  RotateCcw,
  User,
  ShieldCheck,
  Pill,
  RefreshCw,
  Check,
  Baby,
  Flame,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  evaluateAmbulanceAssessment, 
  checkHospitalCapabilities, 
  getCapabilityFriendlyName,
  EMERGENCY_SYMPTOMS_CONFIG
} from '../../utils/mlTriage';
import { LeafletMap } from '../LeafletMap';
import { Hospital, EmergencySymptomType, ConsciousnessLevel } from '../../types';

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
    transferPatientDataToAssessment,
    user
  } = useApp();

  const [formSavedSuccess, setFormSavedSuccess] = useState(false);
  const [syncNotice, setSyncNotice] = useState(false);

  // Form input local states initialized from context
  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospital;
  const isRerouted = activeDispatch?.status === 'REROUTED';
  const targetHospital = isRerouted 
    ? (hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[3])
    : currentHospital;

  const triagePrediction = evaluateAmbulanceAssessment(ambulanceAssessment);
  const matchResult = checkHospitalCapabilities(currentHospital, triagePrediction.requiredCapabilities, hospitals);

  // Auto-transferred patient data (from form or current context)
  const patientData = ambulanceAssessment.patientData || {
    patientId: user.id,
    fullName: user.fullName,
    healthId: user.healthId,
    bloodGroup: user.bloodGroup,
    age: user.age,
    gender: user.gender,
    address: user.address,
    emergencyContacts: user.emergencyContacts,
    allergies: user.allergies,
    chronicConditions: user.chronicConditions,
    currentMedications: user.currentMedications,
    pastRecordsSummary: (user.pastRecords || []).map(r => `${r.date} (${r.hospitalName}): ${r.diagnosis}`),
    transferredAt: 'Live Synced via ABHA'
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadAmbulanceAssessment({
      ...ambulanceAssessment,
      patientDataTransferred: true,
      patientData
    });
    setFormSavedSuccess(true);
    if (onNotify) {
      onNotify('Ambulance Assessment Form uploaded to hospital network! AI triage computed.');
    }
    setTimeout(() => setFormSavedSuccess(false), 4500);
  };

  const handleReSyncPatient = () => {
    transferPatientDataToAssessment();
    setSyncNotice(true);
    if (onNotify) onNotify('Patient Digital Health Record re-synced from ABHA Registry!');
    setTimeout(() => setSyncNotice(false), 3000);
  };

  const toggleSymptom = (symptomId: EmergencySymptomType) => {
    const currentList = ambulanceAssessment.symptoms || [];
    const exists = currentList.includes(symptomId);
    let updatedSymptoms: EmergencySymptomType[];

    if (exists) {
      updatedSymptoms = currentList.filter(s => s !== symptomId);
      if (symptomId === 'STROKE_LIKE') {
        updateAmbulanceAssessment({
          symptoms: updatedSymptoms,
          strokeSymptoms: { facialDrooping: false, armWeakness: false, speechDifficulty: false },
          fast_score: 0
        });
        return;
      }
    } else {
      updatedSymptoms = [...currentList, symptomId];
      if (symptomId === 'STROKE_LIKE') {
        updateAmbulanceAssessment({
          symptoms: updatedSymptoms,
          strokeSymptoms: { facialDrooping: true, armWeakness: true, speechDifficulty: false },
          fast_score: 2
        });
        return;
      }
    }

    updateAmbulanceAssessment({ symptoms: updatedSymptoms });
  };

  const toggleStrokeSign = (sign: 'facialDrooping' | 'armWeakness' | 'speechDifficulty') => {
    const current = ambulanceAssessment.strokeSymptoms || {
      facialDrooping: false,
      armWeakness: false,
      speechDifficulty: false
    };
    const updated = { ...current, [sign]: !current[sign] };
    const anyActive = updated.facialDrooping || updated.armWeakness || updated.speechDifficulty;
    const currentSymptoms = ambulanceAssessment.symptoms || [];
    
    let nextSymptoms = [...currentSymptoms];
    if (anyActive && !nextSymptoms.includes('STROKE_LIKE')) {
      nextSymptoms.push('STROKE_LIKE');
    } else if (!anyActive && nextSymptoms.includes('STROKE_LIKE')) {
      nextSymptoms = nextSymptoms.filter(s => s !== 'STROKE_LIKE');
    }

    const fastCount = (updated.facialDrooping ? 1 : 0) + (updated.armWeakness ? 1 : 0) + (updated.speechDifficulty ? 1 : 0);

    updateAmbulanceAssessment({
      strokeSymptoms: updated,
      symptoms: nextSymptoms,
      fast_score: fastCount
    });
  };

  const setConsciousness = (level: ConsciousnessLevel) => {
    let suggestedGcs = ambulanceAssessment.gcs;
    if (level === 'ALERT' && suggestedGcs < 14) suggestedGcs = 15;
    else if (level === 'VOICE' && (suggestedGcs < 9 || suggestedGcs > 13)) suggestedGcs = 12;
    else if (level === 'PAIN' && (suggestedGcs < 6 || suggestedGcs > 10)) suggestedGcs = 8;
    else if (level === 'UNRESPONSIVE') suggestedGcs = 3;

    updateAmbulanceAssessment({
      consciousnessLevel: level,
      gcs: suggestedGcs
    });
  };

  const handleGcsChange = (newGcs: number) => {
    let suggestedLevel: ConsciousnessLevel = 'ALERT';
    if (newGcs <= 5) suggestedLevel = 'UNRESPONSIVE';
    else if (newGcs <= 9) suggestedLevel = 'PAIN';
    else if (newGcs <= 13) suggestedLevel = 'VOICE';
    else suggestedLevel = 'ALERT';

    updateAmbulanceAssessment({
      gcs: newGcs,
      consciousnessLevel: suggestedLevel
    });
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
      </div>

      {/* AUTO-TRANSFERRED PATIENT MEDICAL DATA BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-2xl p-5 border border-blue-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-blue-950">
                  Previous Data of Patient is Automatically Transferred
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ABHA Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Connected Citizen Health Profile • Pre-loaded via Digital Health ID Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReSyncPatient}
            className="self-start sm:self-auto px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Re-Sync ABHA Records</span>
          </button>
        </div>

        {syncNotice && (
          <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold animate-in fade-in flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Latest Citizen EHR history fetched and linked to active assessment form.</span>
          </div>
        )}

        {/* Patient Demographics & Key History Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Identity & Blood Group */}
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Identity</span>
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>{patientData.fullName}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              {patientData.age} yrs • {patientData.gender} • <strong className="text-rose-700 font-bold">{patientData.bloodGroup}</strong>
            </div>
            <div className="text-[10px] font-mono text-slate-500 truncate">
              ABHA: {patientData.healthId}
            </div>
          </div>

          {/* Chronic Medical Conditions */}
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chronic Conditions</span>
            {patientData.chronicConditions && patientData.chronicConditions.length > 0 ? (
              <ul className="text-[11px] text-slate-700 space-y-0.5">
                {patientData.chronicConditions.map((cond, idx) => (
                  <li key={idx} className="truncate">• {cond}</li>
                ))}
              </ul>
            ) : (
              <span className="text-[11px] text-slate-500 italic">None recorded</span>
            )}
          </div>

          {/* Current Daily Medications */}
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Pill className="w-3 h-3 text-indigo-600" />
              <span>Current Medications</span>
            </span>
            {patientData.currentMedications && patientData.currentMedications.length > 0 ? (
              <ul className="text-[11px] text-slate-700 space-y-0.5">
                {patientData.currentMedications.map((med, idx) => (
                  <li key={idx} className="truncate">• {med.name} ({med.dosage})</li>
                ))}
              </ul>
            ) : (
              <span className="text-[11px] text-slate-500 italic">None recorded</span>
            )}
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

          <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
            
            {/* ========================================================= */}
            {/* SECTION 1: ESSENTIAL VITALS — MEASURE THESE FIRST          */}
            {/* ========================================================= */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>Essential vitals — measure these first</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Highest priority physiological parameters for immediate triage and resuscitation.
                  </p>
                </div>
                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Measure First
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Heart rate (HR) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-600" />
                        <span>Heart rate (HR)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Indicates cardiovascular stress</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Very high
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="20"
                      max="240"
                      value={ambulanceAssessment.heart_rate}
                      onChange={(e) => updateAmbulanceAssessment({ heart_rate: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                      placeholder="75"
                    />
                    <span className="font-mono text-xs text-slate-500 shrink-0">BPM</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal: 60-100 bpm</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      ambulanceAssessment.heart_rate > 105 ? 'bg-amber-100 text-amber-800' : (ambulanceAssessment.heart_rate < 55 ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ambulanceAssessment.heart_rate > 105 ? 'Tachycardia' : (ambulanceAssessment.heart_rate < 55 ? 'Bradycardia' : 'Normal')}
                    </span>
                  </div>
                </div>

                {/* 2. SpO2 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-sky-600" />
                        <span>Oxygen (SpO₂)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Indicates oxygenation</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Very high
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="40"
                      max="100"
                      value={ambulanceAssessment.spo2}
                      onChange={(e) => updateAmbulanceAssessment({ spo2: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                      placeholder="98"
                    />
                    <span className="font-mono text-xs text-slate-500 shrink-0">%</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal: &gt;94%</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      ambulanceAssessment.spo2 < 88 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.spo2 < 92 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ambulanceAssessment.spo2 < 88 ? 'Critical Hypoxia' : (ambulanceAssessment.spo2 < 92 ? 'Low Saturation' : 'Normal')}
                    </span>
                  </div>
                </div>

                {/* 3. Blood pressure — systolic/diastolic */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 sm:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>Blood pressure — systolic/diastolic</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Detects hypotension/hypertension</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Very high
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Systolic (SBP mmHg)</label>
                      <input
                        type="number"
                        min="40"
                        max="260"
                        value={ambulanceAssessment.systolic_bp}
                        onChange={(e) => updateAmbulanceAssessment({ systolic_bp: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Diastolic (DBP mmHg)</label>
                      <input
                        type="number"
                        min="20"
                        max="160"
                        value={ambulanceAssessment.diastolic_bp}
                        onChange={(e) => updateAmbulanceAssessment({ diastolic_bp: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Target normal: 120/80 mmHg</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      ambulanceAssessment.systolic_bp < 85 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.systolic_bp < 90 ? 'bg-amber-100 text-amber-800' : (ambulanceAssessment.systolic_bp > 180 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'))
                    }`}>
                      {ambulanceAssessment.systolic_bp < 85 ? 'Hypotensive Shock' : (ambulanceAssessment.systolic_bp < 90 ? 'Hypotension' : (ambulanceAssessment.systolic_bp > 180 ? 'Hypertensive Crisis' : 'Normotensive'))}
                    </span>
                  </div>
                </div>

                {/* 4. Respiratory rate (RR) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-indigo-600" />
                        <span>Respiratory rate (RR)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Strongest general deterioration indicator</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Very high
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="4"
                      max="60"
                      value={ambulanceAssessment.resp_rate}
                      onChange={(e) => updateAmbulanceAssessment({ resp_rate: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      placeholder="18"
                    />
                    <span className="font-mono text-xs text-slate-500 shrink-0">/min</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal adult: 12-20 /min</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      ambulanceAssessment.resp_rate > 30 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.resp_rate > 24 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ambulanceAssessment.resp_rate > 30 ? 'Severe Tachypnea' : (ambulanceAssessment.resp_rate > 24 ? 'Elevated' : 'Normal')}
                    </span>
                  </div>
                </div>

                {/* 5. Temperature */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-amber-600" />
                        <span>Temperature</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Infection/sepsis and other conditions</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Medium
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="44"
                      value={ambulanceAssessment.body_temp}
                      onChange={(e) => updateAmbulanceAssessment({ body_temp: parseFloat(e.target.value) || 37.0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                      placeholder="36.8"
                    />
                    <span className="font-mono text-xs text-slate-500 shrink-0">°C</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal: 36.5 - 37.5°C</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      ambulanceAssessment.body_temp > 38.5 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.body_temp > 37.8 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ambulanceAssessment.body_temp > 38.5 ? 'High Fever' : (ambulanceAssessment.body_temp > 37.8 ? 'Low Fever' : 'Normal')}
                    </span>
                  </div>
                </div>

                {/* 6. Blood glucose */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Droplet className="w-4 h-4 text-rose-500" />
                        <span>Blood glucose</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Critical for altered consciousness, diabetes, etc.</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      High
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="20"
                      max="700"
                      value={ambulanceAssessment.blood_glucose}
                      onChange={(e) => updateAmbulanceAssessment({ blood_glucose: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                      placeholder="110"
                    />
                    <span className="font-mono text-xs text-slate-500 shrink-0">mg/dL</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal: 70 - 140 mg/dL</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      ambulanceAssessment.blood_glucose < 60 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.blood_glucose > 250 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ambulanceAssessment.blood_glucose < 60 ? 'Hypoglycemia Alert' : (ambulanceAssessment.blood_glucose > 250 ? 'Hyperglycemia' : 'Normal')}
                    </span>
                  </div>
                </div>

                {/* 7. Level of consciousness */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span>Level of consciousness</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Indicates neurological/systemic deterioration</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Very high
                    </span>
                  </div>

                  {/* AVPU Scale Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">AVPU Quick Assessment:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'ALERT', label: 'Alert (A)', desc: 'Spontaneous eye opening & responsive' },
                        { id: 'VOICE', label: 'Voice (V)', desc: 'Responds to verbal stimuli' },
                        { id: 'PAIN', label: 'Pain (P)', desc: 'Responds to painful stimulus only' },
                        { id: 'UNRESPONSIVE', label: 'Unresponsive (U)', desc: 'Completely unresponsive / coma' },
                      ].map((avpu) => {
                        const isSelected = ambulanceAssessment.consciousnessLevel === avpu.id;
                        return (
                          <button
                            key={avpu.id}
                            type="button"
                            onClick={() => setConsciousness(avpu.id as ConsciousnessLevel)}
                            className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                              isSelected
                                ? (avpu.id === 'UNRESPONSIVE' || avpu.id === 'PAIN' 
                                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400/20' 
                                    : 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/20')
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="font-black text-xs">{avpu.label}</div>
                            <div className="text-[9px] text-slate-500 truncate">{avpu.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Glasgow Coma Scale (GCS 3-15) Slider */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Glasgow Coma Scale (GCS 3–15):</span>
                      <span className={`font-mono font-black px-2.5 py-0.5 rounded-full ${
                        ambulanceAssessment.gcs <= 8 ? 'bg-red-100 text-red-800' : (ambulanceAssessment.gcs <= 12 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                      }`}>
                        GCS {ambulanceAssessment.gcs}/15 ({ambulanceAssessment.gcs <= 8 ? 'Severe / Coma' : (ambulanceAssessment.gcs <= 12 ? 'Moderate' : 'Mild/Normal')})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={ambulanceAssessment.gcs}
                        onChange={(e) => handleGcsChange(parseInt(e.target.value))}
                        className="flex-1 accent-purple-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="3"
                        max="15"
                        value={ambulanceAssessment.gcs}
                        onChange={(e) => handleGcsChange(parseInt(e.target.value) || 3)}
                        className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 2: SYMPTOMS — EXTREMELY IMPORTANT                  */}
            {/* ========================================================= */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Symptoms — extremely important</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Vitals alone aren't enough. Have the ambulance worker select symptoms:
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {(ambulanceAssessment.symptoms || []).length} Selected
                </span>
              </div>

              {/* Grid of Symptoms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EMERGENCY_SYMPTOMS_CONFIG.map((sym) => {
                  const isChecked = (ambulanceAssessment.symptoms || []).includes(sym.id);
                  const isStroke = sym.id === 'STROKE_LIKE';
                  
                  return (
                    <div 
                      key={sym.id}
                      className={`p-3 rounded-xl border transition select-none ${
                        isChecked 
                          ? 'bg-rose-50/70 border-rose-400 ring-1 ring-rose-400/20 shadow-2xs' 
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div 
                        onClick={() => toggleSymptom(sym.id)}
                        className="flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base shrink-0 mt-0.5">{sym.emoji}</span>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{sym.label}</span>
                              {sym.relevance === 'Very high' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                  Critical
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                              {sym.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                          )}
                        </div>
                      </div>

                      {/* Specialized Stroke Sub-Symptoms FAST Checklist */}
                      {isStroke && isChecked && (
                        <div className="mt-2.5 pt-2 border-t border-rose-200 bg-white/70 p-2.5 rounded-lg space-y-1.5 animate-in fade-in">
                          <span className="text-[10px] font-bold text-purple-900 uppercase block tracking-wider">
                            🧠 Stroke-like Signs Checklist (Check all that apply):
                          </span>
                          <div className="grid grid-cols-1 gap-1">
                            {[
                              { key: 'facialDrooping', label: 'facial drooping', desc: 'Uneven smile or one side of face drooping' },
                              { key: 'armWeakness', label: 'arm weakness', desc: 'Inability to raise or maintain one arm elevated' },
                              { key: 'speechDifficulty', label: 'speech difficulty', desc: 'Slurred, garbled or absent speech' },
                            ].map(item => {
                              const subChecked = !!(ambulanceAssessment.strokeSymptoms?.[item.key as keyof typeof ambulanceAssessment.strokeSymptoms]);
                              return (
                                <label 
                                  key={item.key} 
                                  className="flex items-center justify-between p-1.5 rounded hover:bg-purple-50 cursor-pointer text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={subChecked}
                                      onChange={() => toggleStrokeSign(item.key as any)}
                                      className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                                    />
                                    <span className={`capitalize font-bold text-xs ${subChecked ? 'text-purple-900' : 'text-slate-700'}`}>
                                      {item.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 3: PARAMEDIC CLINICAL NOTES & ON-SCENE CARE        */}
            {/* ========================================================= */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Paramedic On-Scene Observations & Interventions</span>
              </label>
              <textarea
                rows={2}
                value={ambulanceAssessment.paramedicNotes || ''}
                onChange={(e) => updateAmbulanceAssessment({ paramedicNotes: e.target.value })}
                placeholder="Document visible trauma, pupil response, airway patency, on-scene medications administered (e.g., IV line, high-flow O2, Epinephrine, Cervical Collar)..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* UPLOAD ACTION BUTTON */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Paramedic Crew: <strong>{ambulanceAssessment.uploadedBy || 'Paramedic Unit HR-10-EM-1081'}</strong>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>SUBMIT IN-AMBULANCE FORM & RUN AI FACILITY MATCH</span>
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
