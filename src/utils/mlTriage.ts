import { CapabilityType, Hospital, AmbulanceAssessmentForm, TelemetryVitals, EmergencySymptomType } from '../types';

export interface TriagePrediction {
  acuity: 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4';
  acuityLabel: string;
  isLifeThreatening: boolean;
  requiredCapabilities: CapabilityType[];
  clinicalRiskSummary: string[];
}

export interface CapabilityMatchResult {
  canHandle: boolean;
  mismatches: string[];
  recommendedHospital?: Hospital;
  rerouteReason?: string;
}

/**
 * High-precision In-Ambulance Clinical Triage Evaluator
 * Evaluates essential vital signs, clinical symptoms, and auto-transferred medical history.
 */
export function evaluateAmbulanceAssessment(vitals: AmbulanceAssessmentForm): TriagePrediction {
  const risks: string[] = [];
  const requiredCaps: CapabilityType[] = [];
  const symptoms = vitals.symptoms || [];
  const stroke = vitals.strokeSymptoms || { facialDrooping: false, armWeakness: false, speechDifficulty: false };

  // --- 1. ESSENTIAL VITALS EVALUATION (Measure These First) ---

  // Heart Rate (HR) - Indicates cardiovascular stress (Emergency relevance: Very high)
  if (vitals.heart_rate > 130 || (vitals.heart_rate < 40 && vitals.heart_rate > 0)) {
    risks.push(`Extreme cardiovascular instability / Arrhythmia danger (HR: ${vitals.heart_rate} bpm)`);
  } else if (vitals.heart_rate > 105) {
    risks.push(`Tachycardia indicating hemodynamic strain (HR: ${vitals.heart_rate} bpm)`);
  } else if (vitals.heart_rate < 55 && vitals.heart_rate > 0) {
    risks.push(`Bradycardia alert (HR: ${vitals.heart_rate} bpm)`);
  }

  // SpO2 - Indicates oxygenation (Emergency relevance: Very high)
  if (vitals.spo2 < 85 && vitals.spo2 > 0) {
    risks.push(`Critical life-threatening hypoxemia (SpO2: ${vitals.spo2}%) - Mechanical ventilation required`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  } else if (vitals.spo2 < 90 && vitals.spo2 > 0) {
    risks.push(`Severe hypoxia (SpO2: ${vitals.spo2}%) - High-flow oxygen / CPAP needed`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Blood Pressure - Detects hypotension/hypertension (Emergency relevance: Very high)
  if (vitals.systolic_bp < 80 && vitals.systolic_bp > 0) {
    risks.push(`Profound hypotensive shock (BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg)`);
    requiredCaps.push('BLOOD_BANK_O_NEG');
  } else if (vitals.systolic_bp < 90 && vitals.systolic_bp > 0) {
    risks.push(`Hypotension detected (BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg)`);
  } else if (vitals.systolic_bp > 190 || vitals.diastolic_bp > 115) {
    risks.push(`Hypertensive crisis urgency (BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg)`);
  }

  // Respiratory Rate (RR) - General deterioration indicator (Emergency relevance: Very high)
  if (vitals.resp_rate > 35 || (vitals.resp_rate < 8 && vitals.resp_rate > 0)) {
    risks.push(`Imminent respiratory failure / Apnea threat (RR: ${vitals.resp_rate}/min)`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  } else if (vitals.resp_rate > 26) {
    risks.push(`Tachypnea / Respiratory distress (RR: ${vitals.resp_rate}/min)`);
  }

  // Temperature - Infection/sepsis indicator (Emergency relevance: Medium)
  if (vitals.body_temp > 39.4) {
    risks.push(`Hyperpyrexia / Severe sepsis fever alert (Temp: ${vitals.body_temp}°C)`);
  } else if (vitals.body_temp < 35.0 && vitals.body_temp > 0) {
    risks.push(`Severe hypothermia warning (Temp: ${vitals.body_temp}°C)`);
  }

  // Blood Glucose - Altered consciousness, diabetes (Emergency relevance: High)
  if (vitals.blood_glucose < 60 && vitals.blood_glucose > 0) {
    risks.push(`Severe hypoglycemia danger (RBS: ${vitals.blood_glucose} mg/dL) - Coma / seizure risk`);
  } else if (vitals.blood_glucose > 350) {
    risks.push(`Severe hyperglycemia derangement (RBS: ${vitals.blood_glucose} mg/dL) - DKA / HHS risk`);
  }

  // Level of Consciousness - Neurological/systemic deterioration (Emergency relevance: Very high)
  const isUnresponsive = vitals.consciousnessLevel === 'UNRESPONSIVE' || vitals.gcs <= 8;
  const isPainResponsive = vitals.consciousnessLevel === 'PAIN' || (vitals.gcs >= 9 && vitals.gcs <= 11);
  if (isUnresponsive) {
    risks.push(`Patient Comatose / Unresponsive (GCS: ${vitals.gcs}/15, AVPU: ${vitals.consciousnessLevel || 'U'}) - Loss of airway protection reflexes`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
    requiredCaps.push('NEURO_SURGERY_ICU');
  } else if (isPainResponsive) {
    risks.push(`Severe neurological depression / Responding to Pain only (GCS: ${vitals.gcs}/15)`);
  }

  // --- 2. CLINICAL SYMPTOMS EVALUATION (Vitals Alone Aren't Enough) ---

  // Chest pain / STEMI
  const hasChestPain = symptoms.includes('CHEST_PAIN') || vitals.ecg_stemi === 1;
  if (hasChestPain) {
    risks.push('Acute Coronary Syndrome / Ischemic Chest Pain Presentation - Cath Lab / Primary PCI pathway');
    requiredCaps.push('CATH_LAB_24X7');
  }

  // Difficulty breathing
  if (symptoms.includes('DIFFICULTY_BREATHING')) {
    risks.push('Acute respiratory distress symptom - Supplemental airway / ventilator readiness');
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Severe bleeding
  if (symptoms.includes('SEVERE_BLEEDING')) {
    risks.push('Severe external / internal hemorrhage - Massive transfusion protocol & Trauma OT');
    requiredCaps.push('BLOOD_BANK_O_NEG');
    requiredCaps.push('TRAUMA_OT');
  }

  // Major trauma
  if (symptoms.includes('MAJOR_TRAUMA') || vitals.trauma === 1) {
    risks.push('High-velocity polytrauma / blunt force injury requiring Level-1 Emergency OT');
    requiredCaps.push('TRAUMA_OT');
    if (vitals.gcs <= 10 || isUnresponsive || isPainResponsive) {
      requiredCaps.push('NEURO_SURGERY_ICU');
    }
  }

  // Hemodynamic Shock
  if (vitals.systolic_bp < 85 && vitals.heart_rate > 115) {
    risks.push(`Severe Hemodynamic Shock (BP: ${vitals.systolic_bp}/${vitals.diastolic_bp}, HR: ${vitals.heart_rate})`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Stroke-like symptoms (facial drooping, arm weakness, speech difficulty)
  const hasStrokeSigns = 
    symptoms.includes('STROKE_LIKE') || 
    vitals.fast_score >= 1 || 
    stroke.facialDrooping || 
    stroke.armWeakness || 
    stroke.speechDifficulty;

  if (hasStrokeSigns) {
    const signs = [];
    if (stroke.facialDrooping) signs.push('facial drooping');
    if (stroke.armWeakness) signs.push('arm weakness');
    if (stroke.speechDifficulty) signs.push('speech difficulty');
    const signsText = signs.length > 0 ? ` (${signs.join(', ')})` : '';
    risks.push(`Acute Stroke symptoms identified${signsText} - Hyperacute stroke unit / Neuro-intervention needed`);
    requiredCaps.push('NEURO_SURGERY_ICU');
  }

  // Loss of consciousness & Seizures
  if (symptoms.includes('LOSS_OF_CONSCIOUSNESS')) {
    risks.push('Sudden loss of consciousness / Syncope with persistent depression');
    requiredCaps.push('NEURO_SURGERY_ICU');
  }
  if (symptoms.includes('SEIZURE')) {
    risks.push('Acute ongoing or post-ictal seizure presentation - Status epilepticus protocol');
    requiredCaps.push('NEURO_SURGERY_ICU');
  }

  // Severe abdominal pain
  if (symptoms.includes('SEVERE_ABDOMINAL_PAIN')) {
    risks.push('Acute surgical abdomen / Visceral perforation or peritonitis concern');
    requiredCaps.push('TRAUMA_OT');
  }

  // Burns
  if (symptoms.includes('BURNS')) {
    risks.push('Major thermal/inhalation burn injury - Specialized trauma OT & resuscitation');
    requiredCaps.push('TRAUMA_OT');
  }

  // Severe allergic reaction
  if (symptoms.includes('SEVERE_ALLERGIC_REACTION')) {
    risks.push('Systemic anaphylaxis - Impending laryngeal edema & vascular collapse');
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Poisoning / overdose
  if (symptoms.includes('POISONING_OVERDOSE')) {
    risks.push('Toxicological overdose / Acute poisoning ingestion');
  }

  // High fever with confusion
  if (symptoms.includes('HIGH_FEVER_WITH_CONFUSION')) {
    risks.push('Febrile encephalopathy / Septic meningitis presentation');
    requiredCaps.push('NEURO_SURGERY_ICU');
  }

  // Pregnancy-related emergency
  if (symptoms.includes('PREGNANCY_RELATED')) {
    risks.push('Acute maternal/obstetric emergency (Eclampsia / Antepartum hemorrhage) - Urgent C-Section surgery required');
    requiredCaps.push('MATERNITY_SURGICAL');
  }

  // Pediatric emergency
  if (vitals.is_pediatric === 1 && (vitals.spo2 < 92 || vitals.gcs < 13 || vitals.trauma === 1 || symptoms.length > 0)) {
    risks.push('Pediatric high-acuity resuscitation protocol');
    requiredCaps.push('PEDIATRIC_ICU');
  }

  // --- 3. AUTO-TRANSFERRED PATIENT MEDICAL RECORD CONTEXT ---
  if (vitals.patientData) {
    if (vitals.patientData.allergies && vitals.patientData.allergies.length > 0) {
      const severeAllergies = vitals.patientData.allergies.map(a => a.allergen).join(', ');
      risks.push(`Transferred EHR Alert: Known severe allergy to [${severeAllergies}]. Verify before medication!`);
    }
  }

  // --- 4. COMPUTE OVERALL ACUITY LEVEL (ESI 1-4) ---
  let acuity: 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4' = 'ESI-3';
  let acuityLabel = 'ESI-3: Urgent (Moderate Risk)';

  const isEsi1 = 
    isUnresponsive ||
    vitals.spo2 < 84 ||
    vitals.systolic_bp < 75 ||
    (vitals.ecg_stemi === 1 && vitals.systolic_bp < 85) ||
    symptoms.includes('SEVERE_ALLERGIC_REACTION') ||
    (symptoms.includes('SEVERE_BLEEDING') && vitals.systolic_bp < 85);

  const isEsi2 = 
    hasChestPain ||
    hasStrokeSigns ||
    symptoms.includes('LOSS_OF_CONSCIOUSNESS') ||
    symptoms.includes('SEIZURE') ||
    symptoms.includes('PREGNANCY_RELATED') ||
    symptoms.includes('MAJOR_TRAUMA') ||
    symptoms.includes('BURNS') ||
    symptoms.includes('HIGH_FEVER_WITH_CONFUSION') ||
    (vitals.trauma === 1 && vitals.gcs <= 12) ||
    vitals.spo2 < 91 ||
    vitals.systolic_bp < 90 ||
    vitals.blood_glucose < 60;

  if (isEsi1) {
    acuity = 'ESI-1';
    acuityLabel = 'ESI-1: Resuscitation (Immediate Life Threat)';
  } else if (isEsi2) {
    acuity = 'ESI-2';
    acuityLabel = 'ESI-2: Emergent (Time-Critical / High Acuity)';
  } else if (vitals.heart_rate > 105 || vitals.systolic_bp < 95 || symptoms.length > 0) {
    acuity = 'ESI-3';
    acuityLabel = 'ESI-3: Urgent';
  } else {
    acuity = 'ESI-4';
    acuityLabel = 'ESI-4: Less Urgent / Stable';
  }

  return {
    acuity,
    acuityLabel,
    isLifeThreatening: acuity === 'ESI-1' || acuity === 'ESI-2',
    requiredCapabilities: Array.from(new Set(requiredCaps)),
    clinicalRiskSummary: risks
  };
}

/**
 * Checks if the destination hospital can handle the patient's triage needs.
 * If not, recommends the best alternative hospital that has all required facilities.
 */
export function checkHospitalCapabilities(
  targetHospital: Hospital,
  requiredCaps: CapabilityType[],
  allHospitals: Hospital[]
): CapabilityMatchResult {
  const mismatches: string[] = [];

  for (const cap of requiredCaps) {
    if (!targetHospital.capabilities.includes(cap)) {
      const friendlyName = getCapabilityFriendlyName(cap);
      mismatches.push(`Hospital lacks ${friendlyName}`);
    }
  }

  // If requires ventilator, check if target has at least 1 available
  if (requiredCaps.includes('MECHANICAL_VENTILATOR') && targetHospital.ventilatorsAvail <= 0) {
    mismatches.push('Zero free mechanical ventilators currently available');
  }

  // If requires ICU, check if target has ICU beds
  if (targetHospital.icuBedsAvail <= 0 && requiredCaps.length > 0) {
    mismatches.push('Zero ICU beds available');
  }

  if (mismatches.length === 0) {
    return { canHandle: true, mismatches: [] };
  }

  // Find alternative hospital that satisfies all required capabilities and has capacity
  const candidates = allHospitals
    .filter(h => h.id !== targetHospital.id)
    .filter(h => {
      // Must have all required capabilities
      const hasCaps = requiredCaps.every(cap => h.capabilities.includes(cap));
      const hasVent = !requiredCaps.includes('MECHANICAL_VENTILATOR') || h.ventilatorsAvail > 0;
      const hasIcu = h.icuBedsAvail > 0;
      return hasCaps && hasVent && hasIcu;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const bestAlternative = candidates[0] || allHospitals.find(h => h.type === 'Apex Multi-Specialty');

  return {
    canHandle: false,
    mismatches,
    recommendedHospital: bestAlternative,
    rerouteReason: `Critical mismatch: ${targetHospital.name} lacks critical capabilities [${mismatches.join(', ')}]. Dynamic reroute recommended to prevent preventable mortality.`
  };
}

export function getCapabilityFriendlyName(cap: CapabilityType): string {
  switch (cap) {
    case 'CATH_LAB_24X7':
      return '24/7 Cardiac Cath Lab (Angioplasty / PCI)';
    case 'NEURO_SURGERY_ICU':
      return 'Neuro-Surgeon & Neuro-ICU on Duty';
    case 'TRAUMA_OT':
      return 'Level-1 Emergency Trauma Operating Theater';
    case 'MECHANICAL_VENTILATOR':
      return 'Invasive Mechanical Ventilator';
    case 'PEDIATRIC_ICU':
      return 'Pediatric Intensive Care Unit (PICU)';
    case 'BLOOD_BANK_O_NEG':
      return '24/7 Emergency Blood Bank (O-ve in stock)';
    case 'MATERNITY_SURGICAL':
      return 'Emergency Obstetric / C-Section Surgery';
    default:
      return cap;
  }
}

export const evaluateAmbulanceTelemetry = evaluateAmbulanceAssessment;

export interface SymptomConfig {
  id: EmergencySymptomType;
  label: string;
  relevance: 'Very high' | 'High' | 'Medium';
  urgency: 'CRITICAL' | 'HIGH';
  description: string;
  emoji: string;
}

export const EMERGENCY_SYMPTOMS_CONFIG: SymptomConfig[] = [
  {
    id: 'CHEST_PAIN',
    label: 'Chest pain',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Crushing or radiating chest discomfort, potential STEMI / ACS',
    emoji: '💔'
  },
  {
    id: 'DIFFICULTY_BREATHING',
    label: 'Difficulty breathing',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Severe dyspnea, stridor, air hunger or impending respiratory arrest',
    emoji: '🫁'
  },
  {
    id: 'SEVERE_BLEEDING',
    label: 'Severe bleeding',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Arterial spurting, uncontrollable hemorrhage or massive bleeding',
    emoji: '🩸'
  },
  {
    id: 'LOSS_OF_CONSCIOUSNESS',
    label: 'Loss of consciousness',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Syncope, unresponsive episode, acute collapse or coma',
    emoji: '😵'
  },
  {
    id: 'SEIZURE',
    label: 'Seizure',
    relevance: 'Very high',
    urgency: 'HIGH',
    description: 'Active tonic-clonic convulsions or status epilepticus',
    emoji: '⚡'
  },
  {
    id: 'STROKE_LIKE',
    label: 'Stroke-like symptoms',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Acute neurological signs: facial drooping, arm weakness, speech difficulty',
    emoji: '🧠'
  },
  {
    id: 'SEVERE_ABDOMINAL_PAIN',
    label: 'Severe abdominal pain',
    relevance: 'High',
    urgency: 'HIGH',
    description: 'Acute surgical abdomen, rigid guarding, potential rupture',
    emoji: '⚡'
  },
  {
    id: 'MAJOR_TRAUMA',
    label: 'Major trauma',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'High-speed motor collision, fall from height, penetrating injury',
    emoji: '🚑'
  },
  {
    id: 'BURNS',
    label: 'Burns',
    relevance: 'High',
    urgency: 'HIGH',
    description: 'Severe thermal, electrical or chemical burns with shock',
    emoji: '🔥'
  },
  {
    id: 'SEVERE_ALLERGIC_REACTION',
    label: 'Severe allergic reaction',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Systemic anaphylaxis, throat swelling, airway compromise',
    emoji: '⚠️'
  },
  {
    id: 'POISONING_OVERDOSE',
    label: 'Poisoning/overdose',
    relevance: 'High',
    urgency: 'HIGH',
    description: 'Acute toxic ingestion, drug intoxication or pesticide poisoning',
    emoji: '🧪'
  },
  {
    id: 'HIGH_FEVER_WITH_CONFUSION',
    label: 'High fever with confusion',
    relevance: 'High',
    urgency: 'HIGH',
    description: 'Febrile delirium, severe sepsis or acute CNS infection',
    emoji: '🌡️'
  },
  {
    id: 'PREGNANCY_RELATED',
    label: 'Pregnancy-related emergency',
    relevance: 'Very high',
    urgency: 'CRITICAL',
    description: 'Maternal distress, eclampsia, antepartum hemorrhage or labor emergency',
    emoji: '🤰'
  }
];

export function getSymptomConfig(id: EmergencySymptomType): SymptomConfig | undefined {
  return EMERGENCY_SYMPTOMS_CONFIG.find(s => s.id === id);
}
