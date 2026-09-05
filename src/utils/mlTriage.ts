import { CapabilityType, Hospital, AmbulanceAssessmentForm, TelemetryVitals } from '../types';

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
 * Evaluates vital signs and clinical assessment from the ambulance form.
 */
export function evaluateAmbulanceAssessment(vitals: AmbulanceAssessmentForm): TriagePrediction {
  const risks: string[] = [];
  const requiredCaps: CapabilityType[] = [];

  // Cardiac / STEMI evaluation
  if (vitals.ecg_stemi === 1) {
    risks.push('ST-Elevation Myocardial Infarction (STEMI) confirmed on 12-lead ECG');
    requiredCaps.push('CATH_LAB_24X7');
  }

  // Airway & Ventilator evaluation
  if (vitals.spo2 < 86 || vitals.gcs <= 8 || vitals.resp_rate > 38 || vitals.resp_rate < 8) {
    risks.push(`Severe respiratory/neurological compromise (SpO2: ${vitals.spo2}%, GCS: ${vitals.gcs})`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Neurological & Head Trauma evaluation
  if (vitals.trauma === 1 && vitals.gcs <= 10) {
    risks.push(`Severe Polytrauma with acute Intracranial / GCS depression (${vitals.gcs}/15)`);
    requiredCaps.push('NEURO_SURGERY_ICU');
    requiredCaps.push('TRAUMA_OT');
  } else if (vitals.trauma === 1) {
    risks.push('High-velocity traumatic injury requiring emergency surgical OT');
    requiredCaps.push('TRAUMA_OT');
  }

  // Stroke FAST score evaluation
  if (vitals.fast_score >= 2) {
    risks.push(`Acute Stroke symptoms (FAST Score: ${vitals.fast_score}/3) - Thrombolysis / Stroke ICU required`);
    if (!requiredCaps.includes('NEURO_SURGERY_ICU')) {
      requiredCaps.push('NEURO_SURGERY_ICU');
    }
  }

  // Hemodynamic Shock
  if (vitals.systolic_bp < 85 && vitals.heart_rate > 115) {
    risks.push(`Severe Hemodynamic Shock (BP: ${vitals.systolic_bp}/${vitals.diastolic_bp}, HR: ${vitals.heart_rate})`);
    requiredCaps.push('MECHANICAL_VENTILATOR');
  }

  // Pediatric Emergency
  if (vitals.is_pediatric === 1 && (vitals.spo2 < 90 || vitals.gcs < 12 || vitals.trauma === 1)) {
    risks.push('Pediatric emergency resuscitation protocol activated');
    requiredCaps.push('PEDIATRIC_ICU');
  }

  // Determine ESI Acuity level
  let acuity: 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4' = 'ESI-3';
  let acuityLabel = 'ESI-3: Urgent (Moderate Risk)';

  if (vitals.gcs <= 8 || vitals.spo2 < 82 || (vitals.systolic_bp < 75) || (vitals.ecg_stemi === 1 && vitals.systolic_bp < 85)) {
    acuity = 'ESI-1';
    acuityLabel = 'ESI-1: Resuscitation (Immediate Life Threat)';
  } else if (vitals.ecg_stemi === 1 || vitals.fast_score >= 2 || (vitals.trauma === 1 && vitals.gcs <= 12) || vitals.spo2 < 90) {
    acuity = 'ESI-2';
    acuityLabel = 'ESI-2: Emergent (High Risk / Time-Critical)';
  } else if (vitals.heart_rate > 105 || vitals.systolic_bp < 95) {
    acuity = 'ESI-3';
    acuityLabel = 'ESI-3: Urgent';
  } else {
    acuity = 'ESI-4';
    acuityLabel = 'ESI-4: Less Urgent';
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
