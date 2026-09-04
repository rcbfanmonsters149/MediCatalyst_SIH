export type HospitalType = 
  | 'Primary Health Center (PHC)'
  | 'Community Health Center (CHC)'
  | 'Sub-District Hospital'
  | 'District Hospital'
  | 'Apex Multi-Specialty';

export type CapabilityType = 
  | 'CATH_LAB_24X7'
  | 'NEURO_SURGERY_ICU'
  | 'TRAUMA_OT'
  | 'MECHANICAL_VENTILATOR'
  | 'PEDIATRIC_ICU'
  | 'BLOOD_BANK_O_NEG'
  | 'MATERNITY_SURGICAL';

export interface VisitingSpecialist {
  id: string;
  name: string;
  specialty: string;
  visitingDays: string[]; // e.g. ["Monday", "Thursday"]
  timing: string; // e.g. "10:00 AM - 02:00 PM"
  isVisitingToday: boolean;
}

export type DoctorStatusType = 
  | 'AVAILABLE'
  | 'BUSY'
  | 'OFF_DUTY';

export interface DoctorOnDuty {
  id: string;
  name: string;
  designation: string;
  department?: string;
  shift: string;
  available: boolean;
  statusDetail: DoctorStatusType;
  roomNumber?: string;
  contactNumber?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: HospitalType;
  address: string;
  distanceKm: number;
  etaMinutes: number;
  phone: string;
  lat: number;
  lng: number;
  is24x7Emergency: boolean;
  hasAmbulanceService: boolean;
  openingHours: string;
  
  // Bed capacity
  generalBedsTotal: number;
  generalBedsAvail: number;
  icuBedsTotal: number;
  icuBedsAvail: number;
  maternityBedsTotal: number;
  maternityBedsAvail: number;
  oxygenBedsAvail: number;
  ventilatorsAvail: number;

  // Medical Equipment & Diagnostic Machines
  dialysisAvail: number;
  ecgAvail: number;
  ctScannerAvail: number;
  defibrillatorAvail: number;
  mriAvail: number;

  // Facilities & capabilities
  capabilities: CapabilityType[];
  
  // Staff
  doctorsOnDuty: DoctorOnDuty[];
  visitingSpecialists: VisitingSpecialist[];
}

export interface UserBioData {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  healthId: string; // ABHA Mock
  bloodGroup: string;
  age: number;
  gender: string;
  address: string;
  emergencyContacts: {
    name: string;
    relation: string;
    phone: string;
  }[];
  allergies: {
    allergen: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE_ANAPHYLAXIS';
    reaction: string;
  }[];
  chronicConditions: string[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
  }[];
  pastRecords: PatientRecord[];
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PatientRecord {
  id: string;
  date: string;
  hospitalName: string;
  hospitalId?: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnosis: string;
  prescriptionSummary: string;
  medications?: PrescriptionMedication[];
  clinicalAdvice?: string;
  abhaId?: string;
}

export type AmbulanceStatus = 
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'EN_ROUTE_PICKUP'
  | 'PATIENT_ONBOARD'
  | 'REROUTING'
  | 'ARRIVED_HOSPITAL'
  | 'MAINTENANCE';

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  hospitalId: string;
  hospitalName: string;
  type: 'ALS (Advanced Life Support)' | 'BLS (Basic Life Support)';
  driverName: string;
  driverPhone: string;
  status: AmbulanceStatus;
  currentLat: number;
  currentLng: number;
  etaMinutes: number;
}

export interface TelemetryVitals {
  age: number;
  is_pediatric: number;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  resp_rate: number;
  gcs: number; // 3 to 15
  body_temp: number;
  ecg_stemi: number; // 0 or 1
  trauma: number; // 0 or 1
  fast_score: number; // 0 to 3 (Stroke scale)
  blood_glucose: number;
}

export interface WaterfallHop {
  hospitalId: string;
  hospitalName: string;
  sentAt: string;
  status: 'WAITING' | 'ACCEPTED' | 'TIMED_OUT' | 'DECLINED';
  responseTimeSeconds?: number;
  note?: string;
}

export interface EmergencyDispatch {
  id: string;
  callerName: string;
  callerPhone: string;
  callerVoiceTranscript?: string;
  callerIssue: string;
  urgencyLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  createdAt: string;
  status: 'PENDING_HOSPITAL_ACCEPT' | 'ACCEPTED' | 'AMBULANCE_EN_ROUTE' | 'PATIENT_ONBOARD' | 'REROUTED' | 'ARRIVED';
  currentHospitalId: string;
  assignedAmbulanceId?: string;
  currentStep?: number; // 1 to 10 incident lifecycle stage
  patientCount?: number;
  timeoutSecondsRemaining: number; // 120s down to 0
  waterfallHistory: WaterfallHop[];
  
  // Real-time Telemetry & ML Reroute state
  vitals?: TelemetryVitals;
  mlAcuity?: 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4';
  mlRequiredCapabilities?: CapabilityType[];
  rerouteAlert?: {
    triggered: boolean;
    reason: string;
    originalHospitalId: string;
    originalHospitalName: string;
    newHospitalId: string;
    newHospitalName: string;
    timestamp: string;
  };
  messages: {
    sender: 'CITIZEN' | 'HOSPITAL' | 'PARAMEDIC';
    text: string;
    timestamp: string;
    type?: 'TEXT' | 'VOICE';
  }[];
}

export interface PublicWorkerReport {
  id: string;
  workerType: 'POLICE' | 'TRAFFIC' | 'ASHA';
  workerName: string;
  badgeId: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  severity: 'NORMAL' | 'URGENT' | 'CRITICAL';
  metadata?: Record<string, any>;
}
