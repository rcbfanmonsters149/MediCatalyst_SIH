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
  scheduleSettings?: DoctorScheduleSettings;
  profile?: DoctorProfileData;
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

export type LabTestStatus = 'NORMAL' | 'BORDERLINE' | 'ABNORMAL' | 'CRITICAL' | 'PENDING';

export type LabTestCategory = 
  | 'Hematology (Blood Count)' 
  | 'Biochemistry & Enzymes' 
  | 'Lipid Profile' 
  | 'Diabetic Profile' 
  | 'Renal / Kidney (KFT)' 
  | 'Liver Function (LFT)' 
  | 'Urine Analysis' 
  | 'Microbiology & Serology' 
  | 'Cardiology & ECG' 
  | 'Radiology / Imaging' 
  | 'Pathology' 
  | 'Other Diagnostic';

export interface LabRecordItem {
  id?: string;
  testName: string;
  category: LabTestCategory | string;
  sampleCollectedAt?: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  status: LabTestStatus;
  notes?: string;
  labTechnicianOrDoctor?: string;
  reportAttachmentName?: string;
  reportAttachmentUrl?: string;
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
  labRecords?: LabRecordItem[];
  clinicalAdvice?: string;
  abhaId?: string;

  // Blockchain & Decentralized IPFS Storage Layer
  blockchainTxHash?: string;
  blockNumber?: number;
  ipfsCID?: string;
  integrityHash?: string;
  isBlockchainVerified?: boolean;
  contractAddress?: string;
  networkName?: string;
  encryptedPayload?: string;
  mintedAtTimestamp?: number;
}

export type BlockchainActionType = 
  | 'RECORD_MINTED' 
  | 'RECORD_ACCESSED' 
  | 'ACCESS_GRANTED' 
  | 'ACCESS_REVOKED' 
  | 'EMERGENCY_BREAKGLASS' 
  | 'INTEGRITY_VERIFIED';

export interface BlockchainAuditEvent {
  id: string;
  recordIdHash: string;
  accessor: string;
  accessorName: string;
  actionType: BlockchainActionType;
  timestamp: string;
  blockNumber: number;
  txHash: string;
  details: string;
}

export interface ConsentGrant {
  providerAddress: string;
  providerName: string;
  providerType: 'HOSPITAL' | 'AMBULANCE' | 'SPECIALIST';
  validUntil: string;
  isActive: boolean;
  grantedAt: string;
}

export interface BlockchainNetworkStatus {
  network: string;
  chainId: number;
  contractAddress: string;
  currentBlock: number;
  gasPriceGwei: number;
  isLiveConnected: boolean;
  walletAddress: string;
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

export type ConsciousnessLevel = 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';

export interface StrokeSymptoms {
  facialDrooping: boolean;
  armWeakness: boolean;
  speechDifficulty: boolean;
}

export type EmergencySymptomType = 
  | 'CHEST_PAIN'
  | 'DIFFICULTY_BREATHING'
  | 'SEVERE_BLEEDING'
  | 'LOSS_OF_CONSCIOUSNESS'
  | 'SEIZURE'
  | 'STROKE_LIKE'
  | 'SEVERE_ABDOMINAL_PAIN'
  | 'MAJOR_TRAUMA'
  | 'BURNS'
  | 'SEVERE_ALLERGIC_REACTION'
  | 'POISONING_OVERDOSE'
  | 'HIGH_FEVER_WITH_CONFUSION'
  | 'PREGNANCY_RELATED';

export interface TransferredPatientData {
  patientId: string;
  fullName: string;
  healthId: string;
  bloodGroup: string;
  age: number;
  gender: string;
  address?: string;
  emergencyContacts?: {
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
  pastRecordsSummary?: string[];
  transferredAt?: string;
}

export interface AmbulanceAssessmentForm {
  // Essential Vitals (Measure These First)
  heart_rate: number;
  spo2: number;
  systolic_bp: number;
  diastolic_bp: number;
  resp_rate: number;
  body_temp: number;
  blood_glucose: number;
  consciousnessLevel: ConsciousnessLevel;
  gcs: number; // 3 to 15

  // Patient metadata
  age: number;
  is_pediatric: number;

  // Clinical emergency flags
  ecg_stemi: number; // 0 or 1
  trauma: number; // 0 or 1
  fast_score: number; // 0 to 3 (Stroke scale)

  // Clinical symptoms
  symptoms: EmergencySymptomType[];
  strokeSymptoms: StrokeSymptoms;

  // Auto-transferred patient medical history
  patientDataTransferred: boolean;
  patientData?: TransferredPatientData;

  paramedicNotes?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  isUploaded: boolean;
}

export type TelemetryVitals = AmbulanceAssessmentForm;

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
  
  // In-Ambulance Clinical Assessment & Triage state
  ambulanceAssessment?: AmbulanceAssessmentForm;
  vitals?: AmbulanceAssessmentForm;
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

  // Midway Ambulance Handover / Meet-Me Emergency Mode
  transportMode?: TransportMode;
  handoverStatus?: HandoverStatus;
  meetingPointCoordination?: MeetingPointCoordination;
  caretakerTelemetry?: CaretakerTelemetry;
  updatedAt?: string;
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

export type SignalLightState = 'RED' | 'YELLOW' | 'GREEN' | 'EMERGENCY_OVERRIDE';
export type SignalCorridorStatus = 'STANDBY' | 'NOTIFIED' | 'PREEMPTED_GREEN' | 'CLEARED';

export interface TrafficSignal {
  id: string; // e.g. 'S35', 'S31', 'S23', 'S18', 'S12'
  name: string; // e.g. 'MG Road Junction'
  junctionCode: string; // e.g. 'J-BLR-035'
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number;
  status: SignalCorridorStatus;
  lightState: SignalLightState;
  crossTrafficHalted?: boolean;
  clearedAt?: string;
}

export interface TrafficCorridorEmergency {
  ambulanceId: string; // e.g. 'A-104'
  vehicleNumber: string; // e.g. 'KA-01-AM-104'
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  destinationHospital: string; // e.g. 'District Hospital'
  destinationLat: number;
  destinationLng: number;
  pickupLocationName: string;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  totalEtaMinutes: number;
  signals: TrafficSignal[];
  routeCoordinates: [number, number][];
  isSimulating: boolean;
  simulationProgress: number; // 0 to 1
  simulationSpeedMultiplier: number;
  automatedGreenWave: boolean;
}

export interface LiveMovingAmbulance {
  lat: number;
  lng: number;
  speedKmH: number;
  heading: number;
  progress: number;
  phase: 'EN_ROUTE_TO_PATIENT' | 'TRANSPORTING_TO_HOSPITAL';
  distanceToPatientKm: number;
  distancePatientToHospitalKm: number;
  etaToPatientMinutes: number;
  etaToHospitalMinutes: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  originLat: number;
  originLng: number;
  pickupLat: number;
  pickupLng: number;
  hospLat: number;
  hospLng: number;
  roadRouteCoordinates?: [number, number][];
  phase1Route?: [number, number][];
  phase2Route?: [number, number][];
  // Midway Handover Fields
  isMeetHalfway?: boolean;
  meetingLat?: number;
  meetingLng?: number;
  distanceToMeetingKm?: number;
  etaToMeetingMinutes?: number;
  handoverStatus?: HandoverStatus;
}

export type AppointmentStatus = 'SCHEDULED' | 'IN_CALL' | 'COMPLETED' | 'CANCELLED';
export type UrgencyType = 'ROUTINE' | 'PRIORITY' | 'FOLLOW_UP';

export type QueueStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'IN_CONSULTATION' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED';

export interface DoctorQueueState {
  doctorId: string;
  defaultDurationMinutes: number; // default: 15
  rollingWindowSize: number; // default: 5
  completedDurations: number[]; // durations in minutes, e.g. [12, 15, 10, 18, 15]
  currentRollingAvgMinutes: number; // rolling average in minutes, e.g. 14
  activePatientId?: string;
  activeTokenNumber?: string;
  activeConsultationStartTime?: number; // epoch ms timestamp
}

export type DoctorDutyMode = 
  | 'AVAILABLE' 
  | 'HOSPITAL_EMERGENCY' 
  | 'ON_LEAVE' 
  | 'OFF_DUTY';

export type InHospitalEmergencyType = 
  | 'EMERGENCY_OT' 
  | 'TRAUMA_RESUSCITATION' 
  | 'ICU_CODE_RED' 
  | 'WARD_ROUNDS' 
  | 'OTHER_EMERGENCY';

export interface DoctorScheduleSettings {
  dutyMode: DoctorDutyMode;
  acceptingAppointments: boolean;
  readyForInstantConsult: boolean;
  
  // Emergency duty details
  emergencyType?: InHospitalEmergencyType;
  emergencyNote?: string;
  emergencyEstimatedResume?: string;

  // Leave details
  isOnLeave: boolean;
  leaveType?: 'CASUAL_LEAVE' | 'MEDICAL_LEAVE' | 'DUTY_TRAVEL' | 'EMERGENCY_LEAVE';
  leaveReason?: string;
  leaveDate?: string;

  // Consultation time slots
  availableTimeSlots: string[];
  customOPDHours?: string;
}

export interface TeleAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAbhaId: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup?: string;
  
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalId: string;
  hospitalName: string;
  
  date: string;
  timeSlot: string;
  timeWindow?: string; // e.g. "10:00 AM - 12:00 PM"
  
  // Virtual Queue & Token Data
  tokenNumber: string; // e.g. "TK-01", "A-07"
  tokenSequence: number; // 1, 2, 3...
  queueStatus: QueueStatus;
  
  // Dynamic ETAs & Queue Metrics
  estimatedConsultationTime?: string; // e.g. "10:42 AM"
  estimatedWaitMinutes?: number; // e.g. 24
  patientsAhead?: number; // e.g. 2
  
  // Timestamps for Actual Consultation Tracking
  bookedAt: string;
  bookedAtTimestamp?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  
  symptoms: string;
  urgency: UrgencyType;
  consultationType: 'VIDEO' | 'AUDIO';
  status: AppointmentStatus;
  isInstantConsult?: boolean;
  
  prescriptionIssued?: boolean;
  prescriptionId?: string;
  clinicalNotes?: string;
  prescription?: {
    id?: string;
    diagnosis?: string;
    medications: PrescriptionMedication[];
    instructions?: string;
    advice?: string;
    issuedAt?: string;
    doctorSignature?: string;
  };
}

export interface DoctorPatientReview {
  id: string;
  patientName: string;
  patientAbhaMasked: string;
  rating: number; // 1 to 5
  consultationType: 'VIDEO' | 'AUDIO' | 'IN_PERSON' | 'EMERGENCY';
  date: string;
  tags: string[];
  comment: string;
  isVerifiedPatient: boolean;
}

export interface DoctorProfileData {
  degrees: string[];
  primaryDegree: string;
  medicalCouncilRegNo: string;
  abhaHprId: string;
  experienceYears: number;
  department: string;
  specializations: string[];
  languagesSpoken: string[];
  bio: string;
  consultationFee: string;
  averageRating: number;
  totalReviews: number;
  recommendationRate: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: DoctorPatientReview[];
}

export interface DoctorUser {
  id: string;
  name: string;
  designation: string;
  department: string;
  shift: string;
  hospitalId: string;
  hospitalName: string;
  roomNumber?: string;
  isOnlineForTeleConsult: boolean;
  scheduleSettings?: DoctorScheduleSettings;
  profile?: DoctorProfileData;
}

// ============================================================================
// MIDWAY AMBULANCE HANDOVER / MEET-ME EMERGENCY MODE TYPES
// ============================================================================

export type TransportMode = 'DIRECT_AMBULANCE' | 'MEET_HALFWAY';

export type HandoverStatus = 
  | 'NOT_ACTIVE'
  | 'COORDINATING'
  | 'APPROACHING_MEETING_POINT'
  | 'ARRIVED_AT_MEETING_POINT'
  | 'HANDOVER_COMPLETED';

export type LandmarkType = 
  | 'PETROL_PUMP'
  | 'ROAD_JUNCTION'
  | 'PRIMARY_HEALTH_SUB_CENTER'
  | 'POLICE_OUTPOST'
  | 'VILLAGE_CHAURAHA'
  | 'TOLL_PLAZA';

export interface HandoverLandmark {
  id: string;
  name: string;
  type: LandmarkType;
  lat: number;
  lng: number;
  address: string;
  safetyRating: 'HIGH_SAFE_PULLOVER' | 'MODERATE_ROAD_SHOULDER';
  features: string[]; // e.g. ["24x7 Lit", "Wide Parking", "First Aid Kit", "Water Facility"]
  contactPhone?: string;
}

export interface CaretakerTelemetry {
  lat: number;
  lng: number;
  speedKmH: number;
  heading: number;
  vehicleType: 'BIKE' | 'AUTO_RICKSHAW' | 'TRACTOR' | 'CAR';
  isLiveTracking: boolean;
  accuracyMeters: number;
  lastUpdated: string;
  distanceToMeetingKm: number;
  etaToMeetingMinutes: number;
  isSimulated?: boolean;
}

export interface MeetingPointCoordination {
  active: boolean;
  transportMode: TransportMode;
  status: HandoverStatus;
  landmark: HandoverLandmark;
  meetingLat: number;
  meetingLng: number;
  ambulanceEtaMinutes: number;
  ambulanceDistanceKm: number;
  caretakerEtaMinutes: number;
  caretakerDistanceKm: number;
  timeSavedMinutes: number;
  distanceSavedKm: number;
  isDivergingOrBlocked: boolean;
  divergenceAlertMessage?: string;
  confirmedByParamedic: boolean;
  confirmedAt?: string;
  caretakerRouteCoordinates: [number, number][];
  ambulanceRouteCoordinates: [number, number][];
  hospitalRouteCoordinates: [number, number][];
  directPickupRecommended?: boolean;
  safetyRecommendationReason?: string;
  lastRecalculatedAt: string;
}
