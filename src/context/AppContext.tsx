import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Hospital, 
  UserBioData, 
  Ambulance, 
  EmergencyDispatch, 
  PublicWorkerReport, 
  TelemetryVitals, 
  AmbulanceAssessmentForm,
  WaterfallHop,
  DoctorOnDuty,
  PatientRecord,
  TransferredPatientData,
  TrafficCorridorEmergency,
  TrafficSignal,
  SignalLightState,
  SignalCorridorStatus,
  LiveMovingAmbulance,
  BlockchainAuditEvent,
  ConsentGrant,
  BlockchainNetworkStatus,
  TeleAppointment,
  UrgencyType,
  QueueStatus,
  DoctorQueueState,
  DoctorUser,
  DoctorScheduleSettings,
  DoctorDutyMode,
  InHospitalEmergencyType,
  DoctorStatusType,
  DoctorProfileData,
  DoctorPatientReview
} from '../types';
import { 
  calculateRollingAverage, 
  generateNextToken, 
  recalculateDoctorQueue, 
  formatTimeAmPm 
} from '../utils/queueEngine';
import { evaluateAmbulanceAssessment, evaluateAmbulanceTelemetry, checkHospitalCapabilities } from '../utils/mlTriage';
import { 
  createInitialTrafficEmergency, 
  identifyRouteSignals 
} from '../utils/trafficCorridor';
import { computeSHA256, encryptMedicalRecord } from '../services/cryptoService';
import { uploadToIPFS } from '../services/ipfsService';
import { 
  publishRecordOnChain, 
  verifyRecordOnChain, 
  getAuditEvents, 
  getConsentGrants, 
  revokeConsentOnChain, 
  getBlockchainNetworkStatus,
  NATIONAL_EHR_CONTRACT_ADDRESS 
} from '../services/blockchainService';
import { fetchAmbulanceMissionRoadRoute, getPointAlongPolyline } from '../utils/routing';

export type HospitalResourceType = 
  | 'general' 
  | 'icu' 
  | 'maternity' 
  | 'ventilator' 
  | 'dialysis' 
  | 'ecg' 
  | 'ctScanner' 
  | 'defibrillator' 
  | 'mri';

interface AppContextType {
  // Hospitals
  hospitals: Hospital[];
  updateHospitalBeds: (hospitalId: string, bedType: HospitalResourceType, delta: number) => void;
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;

  // Hospital Authentication & Doctor Management
  hospitalUser: Hospital | null;
  loginHospital: (hospitalIdOrCode: string) => boolean;
  logoutHospital: () => void;
  addDoctorToHospital: (hospitalId: string, doctor: Omit<DoctorOnDuty, 'id'>) => void;
  updateDoctorStatus: (hospitalId: string, doctorId: string, status: { available: boolean; statusDetail: DoctorOnDuty['statusDetail'] }) => void;
  removeDoctorFromHospital: (hospitalId: string, doctorId: string) => void;

  // Citizen Bio-Data & Digital Health Records (Blockchain & IPFS Verified)
  user: UserBioData;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  loginUser: (identifier: string) => boolean;
  addPatientPrescription: (record: Omit<PatientRecord, 'id'>) => Promise<PatientRecord>;
  verifyPatientRecord: (record: PatientRecord) => Promise<{
    isVerified: boolean;
    onChainChecksum: string | null;
    currentChecksum: string;
    blockNumber: number | null;
    txHash: string | null;
    ipfsCID: string | null;
    timestamp: string | null;
    hospitalName: string | null;
  }>;
  auditLogs: BlockchainAuditEvent[];
  refreshAuditLogs: () => void;
  consentGrants: ConsentGrant[];
  revokeProviderConsent: (providerAddress: string) => Promise<void>;
  blockchainNetwork: BlockchainNetworkStatus;

  // Ambulances & Fleet Driver Authentication
  ambulances: Ambulance[];
  ambulanceUser: Ambulance | null;
  loginAmbulance: (vehicleNumber: string) => boolean;
  logoutAmbulance: () => void;
  updateAmbulanceStatus: (ambulanceId: string, status: Ambulance['status']) => void;

  // Emergency Dispatch Engine
  activeDispatch: EmergencyDispatch | null;
  createEmergencyDispatch: (issueText: string, voiceTranscript?: string, urgency?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') => void;
  acceptDispatchByHospital: (hospitalId: string) => void;
  declineOrTimeoutDispatch: (hospitalId: string, reason: string) => void;
  cancelDispatch: () => void;
  updateDispatchStep: (step: number) => void;
  sendDispatchMessage: (sender: 'CITIZEN' | 'HOSPITAL' | 'PARAMEDIC', text: string) => void;
  
  // In-Ambulance Patient Assessment Form & Dynamic Reroute
  ambulanceAssessment: AmbulanceAssessmentForm;
  vitals: AmbulanceAssessmentForm;
  updateAmbulanceAssessment: (partial: Partial<AmbulanceAssessmentForm>) => void;
  updateVitals: (partial: Partial<AmbulanceAssessmentForm>) => void;
  uploadAmbulanceAssessment: (form?: AmbulanceAssessmentForm) => void;
  executeDynamicReroute: () => void;
  loadPresetScenario: (scenario: 'BIKE_HEAD_TRAUMA' | 'ACUTE_STEMI_HEART' | 'MILD_FEVER_CLINIC' | 'STROKE_FAST' | 'PREGNANCY_EMERGENCY') => void;
  transferPatientDataToAssessment: (customUser?: UserBioData) => void;

  // Public Workers (Police, Traffic, ASHA)
  workerReports: PublicWorkerReport[];
  addWorkerReport: (report: Omit<PublicWorkerReport, 'id' | 'timestamp'>) => void;
  greenCorridorActive: boolean;
  setGreenCorridorActive: (active: boolean) => void;
  clearTrafficJunction: (junctionName: string) => void;
  clearedJunctions: string[];

  // Traffic Signal Police Post & Corridor Engine
  trafficCorridor: TrafficCorridorEmergency;
  overrideSignal: (signalId: string, lightState: SignalLightState) => void;
  confirmSignalCleared: (signalId: string) => void;
  toggleSimulation: (forcePlay?: boolean) => void;
  setSimulationSpeed: (multiplier: number) => void;
  resetSimulation: () => void;
  setSimulationProgressManual: (progress: number) => void;
  // Traffic Signal Police Authentication & Post Operations
  policeUserSignal: TrafficSignal | null;
  loginPoliceSignal: (signalIdOrCode: string) => boolean;
  logoutPoliceSignal: () => void;

  // Live GPS User Location & Proximity Localization
  userLocation: { lat: number; lng: number; areaName?: string } | null;
  relocateToUserLocation: (lat: number, lng: number, areaName?: string) => void;

  // Uber/Rapido-Style Live Moving Ambulance Tracking Telemetry
  liveAmbulance: LiveMovingAmbulance | null;

  // Scheduled & Instant Tele-Consultations & Virtual Queue Desk
  appointments: TeleAppointment[];
  bookAppointment: (appt: Omit<TeleAppointment, 'id' | 'bookedAt' | 'status' | 'tokenNumber' | 'tokenSequence' | 'queueStatus'> & { timeWindow?: string }) => TeleAppointment;
  initiateInstantConsultation: (doctorId: string, symptomText?: string) => TeleAppointment;
  updateAppointmentStatus: (id: string, status: TeleAppointment['status']) => void;
  doctorUser: DoctorUser | null;
  loginDoctor: (doctorId: string) => boolean;
  logoutDoctor: () => void;
  toggleDoctorTeleConsultStatus: (isOnline: boolean) => void;
  updateDoctorScheduleSettings: (settings: Partial<DoctorScheduleSettings>) => void;
  submitDoctorReview: (doctorId: string, review: Omit<DoctorPatientReview, 'id' | 'date'>) => void;

  // Virtual Queue & Time Window OPD Management
  doctorQueues: Record<string, DoctorQueueState>;
  callNextQueuePatient: (doctorId: string) => TeleAppointment | null;
  startPatientConsultation: (appointmentId: string) => void;
  endPatientConsultation: (appointmentId: string, consultationSummary?: string) => void;
  markPatientNoShow: (appointmentId: string) => void;
  cancelQueueAppointment: (appointmentId: string, reason?: string) => void;
}

export const DEFAULT_DOCTOR_SLOTS: string[] = [
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '04:00 PM - 04:30 PM'
];

export const createDefaultScheduleSettings = (): DoctorScheduleSettings => ({
  dutyMode: 'AVAILABLE',
  acceptingAppointments: true,
  readyForInstantConsult: true,
  isOnLeave: false,
  availableTimeSlots: [...DEFAULT_DOCTOR_SLOTS],
  customOPDHours: '09:00 AM - 01:00 PM & 02:00 PM - 05:00 PM'
});

export const getDoctorProfileForDoctor = (id: string, name: string, department?: string): DoctorProfileData => {
  if (id === 'doc-1' || name.toLowerCase().includes('kavita')) {
    return {
      degrees: [
        'MBBS (Gold Medalist) — AIIMS New Delhi',
        'MD (General Medicine) — PGIMER Chandigarh',
        'DNB (Internal Medicine) — National Board of Examinations',
        'Fellowship in Clinical Tele-Medicine & ABDM Protocols'
      ],
      primaryDegree: 'MBBS, MD (General Medicine)',
      medicalCouncilRegNo: 'NMC-2016-084920',
      abhaHprId: 'HPR-2026-99210@abdm',
      experienceYears: 12,
      department: department || 'General OPD & Emergency',
      specializations: [
        'Internal Medicine',
        'Preventive Family Healthcare',
        'Acute Respiratory Triage',
        'Hypertension & Diabetic Care',
        'e-Sanjeevani Digital Tele-Consultations'
      ],
      languagesSpoken: ['English', 'हिंदी (Hindi)', 'मराठी (Marathi)'],
      bio: 'Senior Clinical Medical Officer and clinical lead at Rampur PHC. Dedicated to accessible primary care, community epidemiology, and rapid tele-triage for rural and semi-urban patients under the Ayushman Bharat Digital Mission.',
      consultationFee: 'Free (Govt. ABHA Tele-OPD Service)',
      averageRating: 4.9,
      totalReviews: 148,
      recommendationRate: 98,
      ratingDistribution: {
        5: 130,
        4: 14,
        3: 3,
        2: 1,
        1: 0
      },
      reviews: [
        {
          id: 'rev-101',
          patientName: 'Rameshwar Singh',
          patientAbhaMasked: 'ABHA: 91-****-1092',
          rating: 5,
          consultationType: 'VIDEO',
          date: '22 Sep 2026',
          tags: ['Clear Advice', 'Punctual & Polite', 'Prescription Clarity'],
          comment: 'Dr. Kavita Sharma was extremely attentive to my persistent cough. She reviewed my oxygen saturation and prescribed the exact medicines. I feel much better within two days.',
          isVerifiedPatient: true
        },
        {
          id: 'rev-102',
          patientName: 'Anita Devi',
          patientAbhaMasked: 'ABHA: 91-****-7712',
          rating: 5,
          consultationType: 'VIDEO',
          date: '19 Sep 2026',
          tags: ['Compassionate', 'Fast Response', 'Explained in Hindi'],
          comment: 'Joined the video room immediately when I had high evening fever. She explained the medication schedule in simple Hindi for my family. Very reassuring doctor!',
          isVerifiedPatient: true
        },
        {
          id: 'rev-103',
          patientName: 'Vikas Patel',
          patientAbhaMasked: 'ABHA: 91-****-3319',
          rating: 4,
          consultationType: 'IN_PERSON',
          date: '14 Sep 2026',
          tags: ['Accurate Diagnosis', 'Good Follow-up'],
          comment: 'Very thorough checkup at the PHC desk. Recommended dietary changes that eliminated my chronic heartburn. Saved me from unnecessary scans.',
          isVerifiedPatient: true
        },
        {
          id: 'rev-104',
          patientName: 'Sunita Bai',
          patientAbhaMasked: 'ABHA: 91-****-6502',
          rating: 5,
          consultationType: 'VIDEO',
          date: '08 Sep 2026',
          tags: ['Patient Listener', 'Elderly Care Specialist'],
          comment: 'Doctor took 20 full minutes to explain my mother’s diabetes insulin schedule. The digitally signed prescription arrived in our ABHA PHR immediately.',
          isVerifiedPatient: true
        },
        {
          id: 'rev-105',
          patientName: 'Harish Chandra',
          patientAbhaMasked: 'ABHA: 91-****-9014',
          rating: 5,
          consultationType: 'VIDEO',
          date: '01 Sep 2026',
          tags: ['Life-Saving Advice', 'Quick Call'],
          comment: 'Identified that my brother’s breathing distress required immediate oxygen support and coordinated with the local ambulance dispatch. Exceptional clinical care.',
          isVerifiedPatient: true
        }
      ]
    };
  }

  if (id === 'doc-3' || name.toLowerCase().includes('rajesh mehta')) {
    return {
      degrees: [
        'MBBS — Maulana Azad Medical College, New Delhi',
        'MD (Emergency Medicine) — AIIMS New Delhi',
        'FACEM — Fellowship in Emergency & Trauma Care'
      ],
      primaryDegree: 'MBBS, MD (Emergency Medicine)',
      medicalCouncilRegNo: 'DMC-2012-049182',
      abhaHprId: 'HPR-2026-44109@abdm',
      experienceYears: 16,
      department: department || '24x7 Emergency & Trauma',
      specializations: [
        'Emergency Resuscitation & Trauma',
        'Advanced Cardiac Life Support (ACLS)',
        'Point-of-Care Ultrasound (POCUS)',
        'Disaster Triage Protocols'
      ],
      languagesSpoken: ['English', 'हिंदी (Hindi)'],
      bio: 'Senior Emergency Physician and Trauma Care Director at Bilaspur CHC with over 16 years leading high-acuity resuscitation units and acute emergency telemedicine responses.',
      consultationFee: 'Free (Emergency Triage / ABHA)',
      averageRating: 4.8,
      totalReviews: 210,
      recommendationRate: 97,
      ratingDistribution: {
        5: 180,
        4: 22,
        3: 6,
        2: 2,
        1: 0
      },
      reviews: [
        {
          id: 'rev-301',
          patientName: 'Mohd. Imran',
          patientAbhaMasked: 'ABHA: 91-****-4102',
          rating: 5,
          consultationType: 'EMERGENCY',
          date: '20 Sep 2026',
          tags: ['Life Saving', 'Fast Triage', 'Calm Under Pressure'],
          comment: 'Dr. Rajesh Mehta guided the paramedic crew while we rushed my father to the hospital. His rapid instructions made all the difference.',
          isVerifiedPatient: true
        },
        {
          id: 'rev-302',
          patientName: 'Pooja Rawat',
          patientAbhaMasked: 'ABHA: 91-****-8812',
          rating: 5,
          consultationType: 'VIDEO',
          date: '16 Sep 2026',
          tags: ['Expert Advice', 'Punctual'],
          comment: 'Very experienced trauma doctor. Reassured us and advised appropriate immediate wound dressing.',
          isVerifiedPatient: true
        }
      ]
    };
  }

  // Default fallback for any other doctor
  return {
    degrees: [
      'MBBS — Govt. Medical College',
      'MD / DNB — National Medical Commission Certified',
      'Fellowship in Emergency Critical Care'
    ],
    primaryDegree: 'MBBS, MD',
    medicalCouncilRegNo: `NMC-2018-0${id.replace(/[^0-9]/g, '492') || '8841'}`,
    abhaHprId: `HPR-2026-${id.replace(/[^0-9]/g, '9910') || '1029'}@abdm`,
    experienceYears: 10,
    department: department || 'Clinical OPD',
    specializations: ['General Medicine', 'Emergency Triage', 'Tele-Consultation'],
    languagesSpoken: ['English', 'हिंदी (Hindi)'],
    bio: `${name} is an experienced medical specialist providing compassionate, evidence-based outpatient consultations and tele-health triage.`,
    consultationFee: 'Free (ABHA Tele-OPD)',
    averageRating: 4.8,
    totalReviews: 86,
    recommendationRate: 96,
    ratingDistribution: {
      5: 70,
      4: 12,
      3: 3,
      2: 1,
      1: 0
    },
    reviews: [
      {
        id: `rev-${id}-1`,
        patientName: 'Priya Sharma',
        patientAbhaMasked: 'ABHA: 91-****-8821',
        rating: 5,
        consultationType: 'VIDEO',
        date: '20 Sep 2026',
        tags: ['Clear Advice', 'Punctual'],
        comment: `Excellent consultation with ${name}. All queries answered thoroughly.`,
        isVerifiedPatient: true
      },
      {
        id: `rev-${id}-2`,
        patientName: 'Deepak Verma',
        patientAbhaMasked: 'ABHA: 91-****-2209',
        rating: 5,
        consultationType: 'VIDEO',
        date: '15 Sep 2026',
        tags: ['Patient Listener', 'Accurate Diagnosis'],
        comment: 'Very helpful diagnosis and clear instructions on prescription.',
        isVerifiedPatient: true
      }
    ]
  };
};

const INITIAL_APPOINTMENTS: TeleAppointment[] = [
  {
    id: 'appt-2026-101',
    patientId: 'user-rameshwar-singh',
    patientName: 'Rameshwar Singh',
    patientPhone: '+91 98765 43210',
    patientAbhaId: '91-2849-5830-1092',
    patientAge: 52,
    patientGender: 'Male',
    patientBloodGroup: 'O+ (Positive)',
    doctorId: 'doc-1',
    doctorName: 'Dr. Kavita Sharma',
    doctorSpecialty: 'Medical Officer (MBBS) • General OPD',
    hospitalId: 'hosp-rampur-phc',
    hospitalName: 'Rampur Primary Health Center (PHC)',
    date: 'Today',
    timeSlot: '10:00 AM – 12:00 PM',
    timeWindow: '10:00 AM – 12:00 PM',
    tokenNumber: 'A-01',
    tokenSequence: 1,
    queueStatus: 'WAITING',
    estimatedConsultationTime: '10:05 AM',
    estimatedWaitMinutes: 5,
    patientsAhead: 0,
    symptoms: 'Persistent dry cough, mild chest tightness and evening fever for 3 days',
    urgency: 'PRIORITY',
    consultationType: 'VIDEO',
    status: 'SCHEDULED',
    bookedAt: 'Today, 08:30 AM',
    bookedAtTimestamp: Date.now() - 45 * 60000
  },
  {
    id: 'appt-2026-102',
    patientId: 'user-anita-devi',
    patientName: 'Anita Devi',
    patientPhone: '+91 98123 45678',
    patientAbhaId: '91-5521-9034-7712',
    patientAge: 38,
    patientGender: 'Female',
    patientBloodGroup: 'B+ (Positive)',
    doctorId: 'doc-1',
    doctorName: 'Dr. Kavita Sharma',
    doctorSpecialty: 'Medical Officer (MBBS) • General OPD',
    hospitalId: 'hosp-rampur-phc',
    hospitalName: 'Rampur Primary Health Center (PHC)',
    date: 'Today',
    timeSlot: '10:00 AM – 12:00 PM',
    timeWindow: '10:00 AM – 12:00 PM',
    tokenNumber: 'A-02',
    tokenSequence: 2,
    queueStatus: 'WAITING',
    estimatedConsultationTime: '10:19 AM',
    estimatedWaitMinutes: 19,
    patientsAhead: 1,
    symptoms: 'Hypertension follow-up and review of blood pressure records',
    urgency: 'ROUTINE',
    consultationType: 'VIDEO',
    status: 'SCHEDULED',
    bookedAt: 'Today, 08:45 AM',
    bookedAtTimestamp: Date.now() - 30 * 60000
  },
  {
    id: 'appt-2026-103',
    patientId: 'user-vikas-patel',
    patientName: 'Vikas Patel',
    patientPhone: '+91 98333 11223',
    patientAbhaId: '91-3319-8822-4411',
    patientAge: 44,
    patientGender: 'Male',
    patientBloodGroup: 'A+ (Positive)',
    doctorId: 'doc-1',
    doctorName: 'Dr. Kavita Sharma',
    doctorSpecialty: 'Medical Officer (MBBS) • General OPD',
    hospitalId: 'hosp-rampur-phc',
    hospitalName: 'Rampur Primary Health Center (PHC)',
    date: 'Today',
    timeSlot: '10:00 AM – 12:00 PM',
    timeWindow: '10:00 AM – 12:00 PM',
    tokenNumber: 'A-03',
    tokenSequence: 3,
    queueStatus: 'WAITING',
    estimatedConsultationTime: '10:33 AM',
    estimatedWaitMinutes: 33,
    patientsAhead: 2,
    symptoms: 'Recurring acid reflux and stomach cramps after meals',
    urgency: 'ROUTINE',
    consultationType: 'VIDEO',
    status: 'SCHEDULED',
    bookedAt: 'Today, 09:10 AM',
    bookedAtTimestamp: Date.now() - 15 * 60000
  },
  {
    id: 'appt-2026-104',
    patientId: 'user-priya-singh',
    patientName: 'Priya Singh',
    patientPhone: '+91 98777 55443',
    patientAbhaId: '91-6655-4433-2211',
    patientAge: 29,
    patientGender: 'Female',
    patientBloodGroup: 'B+ (Positive)',
    doctorId: 'doc-3',
    doctorName: 'Dr. Rajesh Mehta',
    doctorSpecialty: 'Senior Emergency Physician',
    hospitalId: 'hosp-bilaspur-chc',
    hospitalName: 'Bilaspur Community Health Center (CHC)',
    date: 'Today',
    timeSlot: '12:00 PM – 02:00 PM',
    timeWindow: '12:00 PM – 02:00 PM',
    tokenNumber: 'A-01',
    tokenSequence: 1,
    queueStatus: 'WAITING',
    estimatedConsultationTime: '12:10 PM',
    estimatedWaitMinutes: 10,
    patientsAhead: 0,
    symptoms: 'Acute sprained ankle from household fall with swelling',
    urgency: 'PRIORITY',
    consultationType: 'VIDEO',
    status: 'SCHEDULED',
    bookedAt: 'Yesterday, 04:15 PM',
    bookedAtTimestamp: Date.now() - 120 * 60000
  }
];

export const INITIAL_DOCTOR_QUEUES: Record<string, DoctorQueueState> = {
  'doc-1': {
    doctorId: 'doc-1',
    defaultDurationMinutes: 15,
    rollingWindowSize: 5,
    completedDurations: [14, 16, 12, 15, 13],
    currentRollingAvgMinutes: 14.0,
    activePatientId: undefined,
    activeTokenNumber: undefined
  },
  'doc-3': {
    doctorId: 'doc-3',
    defaultDurationMinutes: 15,
    rollingWindowSize: 5,
    completedDurations: [15, 18, 14, 16, 15],
    currentRollingAvgMinutes: 15.6,
    activePatientId: undefined,
    activeTokenNumber: undefined
  }
};

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-rampur-phc',
    name: 'Rampur Primary Health Center (PHC)',
    type: 'Primary Health Center (PHC)',
    address: 'Village Rampur, Block 2, GT Road',
    distanceKm: 3.8,
    etaMinutes: 8,
    phone: '+91 11 2894 1001',
    lat: 28.7041,
    lng: 77.1025,
    is24x7Emergency: false,
    hasAmbulanceService: true,
    openingHours: '08:00 AM - 08:00 PM (Emergency Staff On-Call)',
    generalBedsTotal: 12,
    generalBedsAvail: 4,
    icuBedsTotal: 0,
    icuBedsAvail: 0,
    maternityBedsTotal: 4,
    maternityBedsAvail: 2,
    oxygenBedsAvail: 2,
    ventilatorsAvail: 0,
    dialysisAvail: 0,
    ecgAvail: 1,
    ctScannerAvail: 0,
    defibrillatorAvail: 1,
    mriAvail: 0,
    capabilities: ['MATERNITY_SURGICAL'],
    doctorsOnDuty: [
      { id: 'doc-1', name: 'Dr. Kavita Sharma', designation: 'Medical Officer (MBBS)', department: 'General OPD & Emergency', shift: 'Day Shift (08:00 - 16:00)', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Room 102' },
      { id: 'doc-2', name: 'Dr. Naresh Verma', designation: 'General Physician', department: 'Internal Medicine', shift: 'Evening (16:00 - 20:00)', available: false, statusDetail: 'OFF_DUTY', roomNumber: 'Room 105' }
    ],
    visitingSpecialists: [
      { id: 'spec-1', name: 'Dr. Anupam Rao', specialty: 'Pediatrician', visitingDays: ['Monday', 'Thursday'], timing: '10:00 AM - 01:00 PM', isVisitingToday: true },
      { id: 'spec-2', name: 'Dr. Meenakshi Iyer', specialty: 'Gynecologist', visitingDays: ['Tuesday', 'Friday'], timing: '11:00 AM - 02:00 PM', isVisitingToday: false }
    ]
  },
  {
    id: 'hosp-bilaspur-chc',
    name: 'Bilaspur Community Health Center (CHC)',
    type: 'Community Health Center (CHC)',
    address: 'Bilaspur Tehsil Chowk, NH-44 Crossing',
    distanceKm: 9.5,
    etaMinutes: 16,
    phone: '+91 11 2894 2002',
    lat: 28.7350,
    lng: 77.0850,
    is24x7Emergency: true,
    hasAmbulanceService: true,
    openingHours: '24 Hours Open (24x7 Emergency)',
    generalBedsTotal: 35,
    generalBedsAvail: 11,
    icuBedsTotal: 4,
    icuBedsAvail: 1,
    maternityBedsTotal: 8,
    maternityBedsAvail: 3,
    oxygenBedsAvail: 8,
    ventilatorsAvail: 1,
    dialysisAvail: 2,
    ecgAvail: 3,
    ctScannerAvail: 0,
    defibrillatorAvail: 2,
    mriAvail: 0,
    capabilities: ['TRAUMA_OT', 'BLOOD_BANK_O_NEG', 'MATERNITY_SURGICAL', 'MECHANICAL_VENTILATOR'],
    doctorsOnDuty: [
      { id: 'doc-3', name: 'Dr. Rajesh Mehta', designation: 'Senior Emergency Physician', department: '24x7 Emergency & Trauma', shift: '24x7 Trauma Shift', available: true, statusDetail: 'AVAILABLE', roomNumber: 'ER Bay 1' },
      { id: 'doc-4', name: 'Dr. Sneha Patil', designation: 'Anesthetist & Critical Care', department: 'Anesthesia & Surgery', shift: 'Night On-Duty', available: false, statusDetail: 'BUSY', roomNumber: 'Operation Theater 2' }
    ],
    visitingSpecialists: [
      { id: 'spec-3', name: 'Dr. S. K. Roy', specialty: 'Cardiologist', visitingDays: ['Wednesday', 'Saturday'], timing: '09:30 AM - 01:30 PM', isVisitingToday: false },
      { id: 'spec-4', name: 'Dr. Alok Sen', specialty: 'Orthopedic Surgeon', visitingDays: ['Monday', 'Wednesday', 'Friday'], timing: '10:00 AM - 03:00 PM', isVisitingToday: true }
    ]
  },
  {
    id: 'hosp-sonipat-district',
    name: 'Sonipat District Civil Hospital',
    type: 'District Hospital',
    address: 'Civil Lines, Sonipat Central',
    distanceKm: 18.2,
    etaMinutes: 26,
    phone: '+91 11 2894 3003',
    lat: 28.7890,
    lng: 77.0500,
    is24x7Emergency: true,
    hasAmbulanceService: true,
    openingHours: '24 Hours Open (24x7 Emergency & Trauma)',
    generalBedsTotal: 150,
    generalBedsAvail: 34,
    icuBedsTotal: 16,
    icuBedsAvail: 3,
    maternityBedsTotal: 25,
    maternityBedsAvail: 6,
    oxygenBedsAvail: 25,
    ventilatorsAvail: 4,
    dialysisAvail: 8,
    ecgAvail: 10,
    ctScannerAvail: 2,
    defibrillatorAvail: 6,
    mriAvail: 1,
    capabilities: ['TRAUMA_OT', 'BLOOD_BANK_O_NEG', 'MATERNITY_SURGICAL', 'MECHANICAL_VENTILATOR', 'PEDIATRIC_ICU'],
    doctorsOnDuty: [
      { id: 'doc-5', name: 'Dr. Vivek Saxena', designation: 'Chief Medical Superintendent', department: 'Civil Administration & Medicine', shift: 'Full Time', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Admin Block C' },
      { id: 'doc-6', name: 'Dr. Priya Nambiar', designation: 'General Surgeon', department: 'General Surgery & Trauma', shift: 'Night On-Call', available: false, statusDetail: 'BUSY', roomNumber: 'Ward 4' }
    ],
    visitingSpecialists: [
      { id: 'spec-5', name: 'Dr. D. P. Singh', specialty: 'Neurologist', visitingDays: ['Saturday'], timing: '11:00 AM - 04:00 PM', isVisitingToday: false }
    ]
  },
  {
    id: 'hosp-apex-multispecialty',
    name: 'Apex MedCatalyst Multi-Specialty & Level-1 Trauma Center',
    type: 'Apex Multi-Specialty',
    address: 'Apex Healthcare Corridor, Super Highway Ring Road',
    distanceKm: 26.5,
    etaMinutes: 34,
    phone: '+91 11 2894 4004',
    lat: 28.8450,
    lng: 77.0100,
    is24x7Emergency: true,
    hasAmbulanceService: true,
    openingHours: '24 Hours Open (Apex Super-Specialty)',
    generalBedsTotal: 400,
    generalBedsAvail: 78,
    icuBedsTotal: 60,
    icuBedsAvail: 14,
    maternityBedsTotal: 40,
    maternityBedsAvail: 12,
    oxygenBedsAvail: 85,
    ventilatorsAvail: 18,
    dialysisAvail: 24,
    ecgAvail: 20,
    ctScannerAvail: 4,
    defibrillatorAvail: 14,
    mriAvail: 3,
    capabilities: [
      'CATH_LAB_24X7',
      'NEURO_SURGERY_ICU',
      'TRAUMA_OT',
      'MECHANICAL_VENTILATOR',
      'PEDIATRIC_ICU',
      'BLOOD_BANK_O_NEG',
      'MATERNITY_SURGICAL'
    ],
    doctorsOnDuty: [
      { id: 'doc-7', name: 'Dr. Arvind Singhal', designation: 'Interventional Cardiologist', department: '24x7 Cath Lab & Heart Failure', shift: '24x7 Cath Lab On-Duty', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Cath Lab Suite 1' },
      { id: 'doc-8', name: 'Dr. Tanya Bose', designation: 'Lead Neurosurgeon & Trauma Head', department: 'Neurosurgery & Critical Trauma', shift: '24x7 On-Duty', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Neuro OT 3' },
      { id: 'doc-9', name: 'Dr. Farooq Khan', designation: 'Intensivist / Critical Care', department: 'Medical Intensive Care Unit', shift: 'ICU Shift', available: true, statusDetail: 'AVAILABLE', roomNumber: 'ICU Control Desk' }
    ],
    visitingSpecialists: [
      { id: 'spec-6', name: 'Dr. Arvind Singhal', specialty: 'Interventional Cardiology', visitingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], timing: '24x7 Cath Lab', isVisitingToday: true },
      { id: 'spec-7', name: 'Dr. Tanya Bose', specialty: 'Neurosurgery & Stroke', visitingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], timing: '24x7 Neuro-OT', isVisitingToday: true }
    ]
  },
  {
    id: 'hosp-janani-mch',
    name: 'Janani Maternal & Pediatric Care Center',
    type: 'Sub-District Hospital',
    address: 'Near Old Tehsil Road, Rampur Sector 4',
    distanceKm: 4.8,
    etaMinutes: 10,
    phone: '+91 11 2894 2555',
    lat: 28.6950,
    lng: 77.1180,
    is24x7Emergency: true,
    hasAmbulanceService: true,
    openingHours: '24 Hours Open (Maternity & Pediatric ER)',
    generalBedsTotal: 50,
    generalBedsAvail: 16,
    icuBedsTotal: 8,
    icuBedsAvail: 3,
    maternityBedsTotal: 25,
    maternityBedsAvail: 8,
    oxygenBedsAvail: 18,
    ventilatorsAvail: 4,
    dialysisAvail: 0,
    ecgAvail: 5,
    ctScannerAvail: 1,
    defibrillatorAvail: 3,
    mriAvail: 0,
    capabilities: ['MATERNITY_SURGICAL', 'PEDIATRIC_ICU', 'MECHANICAL_VENTILATOR', 'BLOOD_BANK_O_NEG'],
    doctorsOnDuty: [
      { id: 'doc-mch-1', name: 'Dr. Suniti Deshmukh', designation: 'Senior Obstetrician & Gynecologist', department: 'Maternity & C-Section OT', shift: 'Day Shift (08:00 - 16:00)', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Maternity Bay 1' },
      { id: 'doc-mch-2', name: 'Dr. Rohan Mathur', designation: 'Neonatal / Pediatric Specialist', department: 'Pediatric ICU (NICU)', shift: '24x7 On-Duty', available: true, statusDetail: 'AVAILABLE', roomNumber: 'NICU 2' }
    ],
    visitingSpecialists: [
      { id: 'spec-mch-1', name: 'Dr. Neha Kapoor', specialty: 'Fetal Medicine Expert', visitingDays: ['Tuesday', 'Friday'], timing: '10:00 AM - 02:00 PM', isVisitingToday: true }
    ]
  },
  {
    id: 'hosp-greenfield-sdh',
    name: 'Greenfield Sub-District Civil Hospital',
    type: 'Sub-District Hospital',
    address: 'Greenfield Complex, West Crossing',
    distanceKm: 7.2,
    etaMinutes: 14,
    phone: '+91 11 2894 3444',
    lat: 28.7380,
    lng: 77.1350,
    is24x7Emergency: true,
    hasAmbulanceService: true,
    openingHours: '24 Hours Open (Emergency & Day Care)',
    generalBedsTotal: 90,
    generalBedsAvail: 22,
    icuBedsTotal: 12,
    icuBedsAvail: 4,
    maternityBedsTotal: 15,
    maternityBedsAvail: 5,
    oxygenBedsAvail: 22,
    ventilatorsAvail: 3,
    dialysisAvail: 6,
    ecgAvail: 8,
    ctScannerAvail: 1,
    defibrillatorAvail: 4,
    mriAvail: 0,
    capabilities: ['TRAUMA_OT', 'BLOOD_BANK_O_NEG', 'MECHANICAL_VENTILATOR', 'MATERNITY_SURGICAL'],
    doctorsOnDuty: [
      { id: 'doc-sdh-1', name: 'Dr. Ajay Bhatt', designation: 'Consultant Physician & Intensivist', department: 'Emergency Medicine', shift: 'Morning (08:00 - 16:00)', available: true, statusDetail: 'AVAILABLE', roomNumber: 'ER OPD 4' },
      { id: 'doc-sdh-2', name: 'Dr. Pooja Aggarwal', designation: 'Anesthesiologist', department: 'Critical OT', shift: 'Night Shift (20:00 - 08:00)', available: false, statusDetail: 'OFF_DUTY', roomNumber: 'OT Suite A' }
    ],
    visitingSpecialists: [
      { id: 'spec-sdh-1', name: 'Dr. R. C. Sen', specialty: 'Nephrologist', visitingDays: ['Monday', 'Thursday'], timing: '11:00 AM - 03:00 PM', isVisitingToday: false }
    ]
  }
];

const INITIAL_USER: UserBioData = {
  id: 'user-rameshwar-singh',
  fullName: 'Rameshwar Singh',
  phone: '+91 98765 43210',
  email: 'rameshwar.singh@gmail.com',
  healthId: '91-2849-5830-1092', // ABHA Mock
  bloodGroup: 'O+ (Positive)',
  age: 52,
  gender: 'Male',
  address: 'H.No 42, Village Rampur, Near Old Panchayat Ghar',
  emergencyContacts: [
    { name: 'Sunita Singh', relation: 'Wife', phone: '+91 98765 43211' },
    { name: 'Amit Singh', relation: 'Son', phone: '+91 98765 43212' }
  ],
  allergies: [
    { allergen: 'PENICILLIN & AMOXICILLIN', severity: 'SEVERE_ANAPHYLAXIS', reaction: 'Severe bronchospasm, facial edema, anaphylactic shock' },
    { allergen: 'DICLOFENAC / NSAIDs', severity: 'MODERATE', reaction: 'Gastric hemorrhage and acute peptic exacerbation' }
  ],
  chronicConditions: [
    'Type 2 Diabetes Mellitus (HbA1c: 7.8%)',
    'Essential Hypertension (Stage 2)',
    'Mild Chronic Obstructive Pulmonary / Asthma'
  ],
  currentMedications: [
    { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily after meals', purpose: 'Blood Glucose Control' },
    { name: 'Telmisartan', dosage: '40 mg', frequency: 'Once daily morning', purpose: 'Hypertension' },
    { name: 'Salbutamol Inhaler', dosage: '100 mcg', frequency: 'SOS (as needed during breathlessness)', purpose: 'Bronchospasm relief' }
  ],
  pastRecords: [
    {
      id: 'rec-1',
      date: '14 Nov 2025',
      hospitalName: 'Sonipat District Civil Hospital',
      diagnosis: 'Acute Cellulitis with Diabetic Foot Ulcer',
      doctorName: 'Dr. Priya Nambiar',
      doctorSpecialty: 'General Surgery & Trauma',
      prescriptionSummary: 'Strictly avoided Penicillins due to recorded allergy. Treated with Ciprofloxacin + Clindamycin. Ulcer debrided successfully.',
      medications: [
        { name: 'Ciprofloxacin', dosage: '500 mg', frequency: '1-0-1', duration: '7 Days', instructions: 'Take after food' },
        { name: 'Clindamycin', dosage: '300 mg', frequency: '1-1-1', duration: '5 Days', instructions: 'Complete full course' }
      ],
      labRecords: [
        {
          id: 'lab-101',
          testName: 'Fasting Blood Sugar (FBS)',
          category: 'Diabetic Profile',
          sampleCollectedAt: '14 Nov 2025, 08:30 AM',
          resultValue: '198',
          unit: 'mg/dL',
          referenceRange: '70 - 100 mg/dL',
          status: 'ABNORMAL',
          notes: 'Uncontrolled glycemic level aggravating diabetic foot wound.',
          labTechnicianOrDoctor: 'Pathology Lab, Sonipat Civil Hosp'
        },
        {
          id: 'lab-102',
          testName: 'HbA1c (Glycated Hemoglobin)',
          category: 'Diabetic Profile',
          sampleCollectedAt: '14 Nov 2025, 08:30 AM',
          resultValue: '9.2',
          unit: '%',
          referenceRange: '< 5.7 %',
          status: 'CRITICAL',
          notes: 'Severe chronic hyperglycemia over past 90 days.',
          labTechnicianOrDoctor: 'Dr. A. Verma, Biochemist'
        },
        {
          id: 'lab-103',
          testName: 'Total Leukocyte Count (TLC)',
          category: 'Hematology (Blood Count)',
          sampleCollectedAt: '14 Nov 2025, 08:30 AM',
          resultValue: '13,800',
          unit: '/mcL',
          referenceRange: '4,000 - 11,000 /mcL',
          status: 'ABNORMAL',
          notes: 'Leukocytosis secondary to active cellulitis infection.',
          labTechnicianOrDoctor: 'Pathology Lab, Sonipat Civil Hosp'
        },
        {
          id: 'lab-104',
          testName: 'Wound Pus Culture & Sensitivity',
          category: 'Microbiology & Serology',
          sampleCollectedAt: '14 Nov 2025, 10:15 AM',
          resultValue: 'Staphylococcus aureus (Sensitive to Ciprofloxacin & Clindamycin, Resistant to Penicillin)',
          unit: 'Qualitative',
          referenceRange: 'Sterile / No Pathogen',
          status: 'ABNORMAL',
          notes: 'Confirmed Penicillin resistance matching patient allergy profile.',
          labTechnicianOrDoctor: 'Dr. M. Sanyal, Microbiologist'
        }
      ],
      clinicalAdvice: 'Daily wound dressing with sterile saline. Strict glycemic monitoring.',
      abhaId: '91-2849-5830-1092',
      blockchainTxHash: '0x8f2de41098bca4192837bc901e1273948bf823901a842b10923e87123984ca3b',
      blockNumber: 4182880,
      ipfsCID: 'bafybeih4e9b81a293c00ef123d4e5f67a8b9c0d1e2f3a4b5c6d7e8f90medcatalyst',
      integrityHash: '0x4e9b81a293c00ef123d4e5f67a8b9c0d1e2f3a4b5c6d7e8f90123456789abcde',
      isBlockchainVerified: true,
      contractAddress: '0x8A72aB3416F848c2a3821035b80a4D66c0dD7B91',
      networkName: 'Polygon Amoy'
    },
    {
      id: 'rec-2',
      date: '22 Jan 2026',
      hospitalName: 'Bilaspur Community Health Center',
      diagnosis: 'Hypertensive Urgency (BP 170/105 mmHg)',
      doctorName: 'Dr. Rajesh Mehta',
      doctorSpecialty: 'Senior Emergency Physician',
      prescriptionSummary: 'Adjusted Telmisartan from 20mg to 40mg. ECG showed left ventricular hypertrophy, no acute ischemia at the time.',
      medications: [
        { name: 'Telmisartan', dosage: '40 mg', frequency: '1-0-0', duration: '30 Days', instructions: 'Morning after breakfast' },
        { name: 'Amlodipine', dosage: '5 mg', frequency: '0-0-1', duration: '15 Days', instructions: 'Bedtime' }
      ],
      labRecords: [
        {
          id: 'lab-201',
          testName: '12-Lead Electrocardiogram (ECG)',
          category: 'Cardiology & ECG',
          sampleCollectedAt: '22 Jan 2026, 11:15 AM',
          resultValue: 'Sinus rhythm, Left Ventricular Hypertrophy (LVH), No acute ST-T elevation',
          unit: 'Diagnostic Tracing',
          referenceRange: 'Normal Sinus Rhythm',
          status: 'ABNORMAL',
          notes: 'Hypertensive cardiac strain pattern noted. No acute myocardial infarction.',
          labTechnicianOrDoctor: 'Dr. Rajesh Mehta'
        },
        {
          id: 'lab-202',
          testName: 'Serum Creatinine (KFT)',
          category: 'Renal / Kidney (KFT)',
          sampleCollectedAt: '22 Jan 2026, 11:30 AM',
          resultValue: '1.1',
          unit: 'mg/dL',
          referenceRange: '0.7 - 1.3 mg/dL',
          status: 'NORMAL',
          notes: 'Renal filtration capacity intact despite hypertensive surge.',
          labTechnicianOrDoctor: 'Bilaspur CHC Clinical Lab'
        },
        {
          id: 'lab-203',
          testName: 'Serum Potassium (K+)',
          category: 'Biochemistry & Enzymes',
          sampleCollectedAt: '22 Jan 2026, 11:30 AM',
          resultValue: '4.4',
          unit: 'mmol/L',
          referenceRange: '3.5 - 5.0 mmol/L',
          status: 'NORMAL',
          notes: 'Electrolyte balance normal.',
          labTechnicianOrDoctor: 'Bilaspur CHC Clinical Lab'
        }
      ],
      clinicalAdvice: 'Low sodium diet, review BP charts weekly at nearest PHC.',
      abhaId: '91-2849-5830-1092',
      blockchainTxHash: '0x3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef012',
      blockNumber: 4182885,
      ipfsCID: 'bafybeih91a293c00ef123d4e5f67a8b9c0d1e2f3a4b5c6d7e8f90medcatalyst',
      integrityHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      isBlockchainVerified: true,
      contractAddress: '0x8A72aB3416F848c2a3821035b80a4D66c0dD7B91',
      networkName: 'Polygon Amoy'
    }
  ]
};

const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: 'amb-01',
    vehicleNumber: 'HR-10-EM-1081',
    hospitalId: 'hosp-rampur-phc',
    hospitalName: 'Rampur Primary Health Center',
    type: 'BLS (Basic Life Support)',
    driverName: 'Jagdish Kumar',
    driverPhone: '+91 98123 00001',
    status: 'AVAILABLE',
    currentLat: 28.7050,
    currentLng: 77.1010,
    etaMinutes: 7
  },
  {
    id: 'amb-02',
    vehicleNumber: 'HR-10-EM-1082',
    hospitalId: 'hosp-bilaspur-chc',
    hospitalName: 'Bilaspur Community Health Center',
    type: 'ALS (Advanced Life Support)',
    driverName: 'Suresh Pal',
    driverPhone: '+91 98123 00002',
    status: 'AVAILABLE',
    currentLat: 28.7340,
    currentLng: 77.0860,
    etaMinutes: 14
  },
  {
    id: 'amb-03',
    vehicleNumber: 'HR-10-EM-1083',
    hospitalId: 'hosp-apex-multispecialty',
    hospitalName: 'Apex MedCatalyst Multi-Specialty',
    type: 'ALS (Advanced Life Support)',
    driverName: 'Manoj Yadav (Paramedic: Sunita)',
    driverPhone: '+91 98123 00003',
    status: 'AVAILABLE',
    currentLat: 28.8400,
    currentLng: 77.0150,
    etaMinutes: 24
  }
];

const INITIAL_WORKER_REPORTS: PublicWorkerReport[] = [
  {
    id: 'rep-pol-1',
    workerType: 'POLICE',
    workerName: 'Sub-Inspector Vikram Rathore',
    badgeId: 'HP-POL-4482',
    title: 'NH-44 Flyover Two-Wheeler Skid Collision',
    description: 'Motorcyclist slipped in heavy rain, unconscious, head bleeding. Emergency 108 triggered via Police Pin SOS.',
    location: 'Milestone 38, NH-44 Bilaspur Bypass',
    lat: 28.7290,
    lng: 77.0910,
    timestamp: '15 mins ago',
    severity: 'CRITICAL',
    metadata: { vehicleType: 'Motorcycle', victimsCount: 1, highwayBlocked: false }
  },
  {
    id: 'rep-asha-1',
    workerType: 'ASHA',
    workerName: 'Sunita Devi (ASHA Worker)',
    badgeId: 'ASHA-VIL-08',
    title: 'High-Risk Pregnancy Flag - Severe Anemia',
    description: 'Patient Meena Devi (24w pregnant), Hb 7.1 g/dL, pedal edema. Scheduled for urgent iron sucrose infusion at Bilaspur CHC.',
    location: 'Village Kalyanpur, House No 19',
    lat: 28.6980,
    lng: 77.1140,
    timestamp: '1 hour ago',
    severity: 'URGENT',
    metadata: { gestationalAge: '24 weeks', hemoglobin: '7.1 g/dL', bloodPressure: '138/88' }
  },
  {
    id: 'rep-traffic-1',
    workerType: 'TRAFFIC',
    workerName: 'Traffic Constable R. K. Dahiya',
    badgeId: 'TRF-SNT-19',
    title: 'Green Corridor Junction Alert - Sector 14 Crossing',
    description: 'Green signal manual lock queued for inbound emergency ALS ambulance en route to Apex Hospital.',
    location: 'Sector 14 Major Junction, Sonipat',
    lat: 28.8120,
    lng: 77.0340,
    timestamp: 'Just now',
    severity: 'URGENT',
    metadata: { cleared: true, ambulanceId: 'amb-02' }
  }
];

// Initial in-ambulance clinical assessment form (severe trauma case)
const INITIAL_ASSESSMENT: AmbulanceAssessmentForm = {
  age: 52,
  is_pediatric: 0,
  heart_rate: 124,
  systolic_bp: 88,
  diastolic_bp: 56,
  spo2: 89,
  resp_rate: 26,
  body_temp: 36.5,
  blood_glucose: 128,
  consciousnessLevel: 'PAIN',
  gcs: 8, // Severe head injury / comatose threshold
  ecg_stemi: 0,
  trauma: 1, // Polytrauma bike crash
  fast_score: 0,
  symptoms: ['MAJOR_TRAUMA', 'SEVERE_BLEEDING', 'LOSS_OF_CONSCIOUSNESS'],
  strokeSymptoms: {
    facialDrooping: false,
    armWeakness: false,
    speechDifficulty: false
  },
  patientDataTransferred: true,
  patientData: {
    patientId: INITIAL_USER.id,
    fullName: INITIAL_USER.fullName,
    healthId: INITIAL_USER.healthId,
    bloodGroup: INITIAL_USER.bloodGroup,
    age: INITIAL_USER.age,
    gender: INITIAL_USER.gender,
    address: INITIAL_USER.address,
    emergencyContacts: INITIAL_USER.emergencyContacts,
    allergies: INITIAL_USER.allergies,
    chronicConditions: INITIAL_USER.chronicConditions,
    currentMedications: INITIAL_USER.currentMedications,
    pastRecordsSummary: INITIAL_USER.pastRecords.map(r => `${r.date} (${r.hospitalName}): ${r.diagnosis} - ${r.prescriptionSummary}`),
    transferredAt: 'Live Synced via ABHA'
  },
  paramedicNotes: 'Patient semi-conscious following highway bike crash. Forehead laceration, pupils unequal.',
  uploadedAt: '01:35 AM',
  uploadedBy: 'Paramedic Crew (Unit HR-10-EM-1081)',
  isUploaded: true
};

// Haversine distance calculator in kilometers
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function createLocalizedHospitals(baseLat: number, baseLng: number, areaName: string, template: Hospital[]): Hospital[] {
  const t0 = template[0] || INITIAL_HOSPITALS[0];
  const t1 = template[1] || INITIAL_HOSPITALS[1];
  const t2 = template[2] || INITIAL_HOSPITALS[2];
  const t3 = template[3] || INITIAL_HOSPITALS[3];
  const t4 = template[4] || INITIAL_HOSPITALS[4];
  const t5 = template[5] || INITIAL_HOSPITALS[5];

  const h1Lat = Math.round((baseLat + 0.0090) * 10000) / 10000;
  const h1Lng = Math.round((baseLng + 0.0075) * 10000) / 10000;
  const h1Dist = calculateHaversineKm(baseLat, baseLng, h1Lat, h1Lng);

  const h2Lat = Math.round((baseLat - 0.0160) * 10000) / 10000;
  const h2Lng = Math.round((baseLng + 0.0150) * 10000) / 10000;
  const h2Dist = calculateHaversineKm(baseLat, baseLng, h2Lat, h2Lng);

  const h3Lat = Math.round((baseLat - 0.0110) * 10000) / 10000;
  const h3Lng = Math.round((baseLng - 0.0130) * 10000) / 10000;
  const h3Dist = calculateHaversineKm(baseLat, baseLng, h3Lat, h3Lng);

  const h4Lat = Math.round((baseLat + 0.0190) * 10000) / 10000;
  const h4Lng = Math.round((baseLng - 0.0180) * 10000) / 10000;
  const h4Dist = calculateHaversineKm(baseLat, baseLng, h4Lat, h4Lng);

  const h5Lat = Math.round((baseLat + 0.0340) * 10000) / 10000;
  const h5Lng = Math.round((baseLng + 0.0260) * 10000) / 10000;
  const h5Dist = calculateHaversineKm(baseLat, baseLng, h5Lat, h5Lng);

  const h6Lat = Math.round((baseLat - 0.0450) * 10000) / 10000;
  const h6Lng = Math.round((baseLng + 0.0380) * 10000) / 10000;
  const h6Dist = calculateHaversineKm(baseLat, baseLng, h6Lat, h6Lng);

  return [
    {
      ...t0,
      id: 'hosp-rampur-phc',
      name: `${areaName} Primary Health Center (PHC)`,
      address: `${areaName} Sector Health Road`,
      lat: h1Lat,
      lng: h1Lng,
      distanceKm: h1Dist,
      etaMinutes: Math.max(2, Math.round(h1Dist * 2.2)),
    },
    {
      ...t1,
      id: 'hosp-bilaspur-chc',
      name: `${areaName} Community Health Center (CHC)`,
      address: `${areaName} NH Bypass Junction`,
      lat: h2Lat,
      lng: h2Lng,
      distanceKm: h2Dist,
      etaMinutes: Math.max(4, Math.round(h2Dist * 2.2)),
    },
    {
      ...t2,
      id: 'hosp-janani-mch',
      name: `${areaName} Mother & Pediatric Care Center`,
      address: `Tehsil Road, ${areaName}`,
      lat: h3Lat,
      lng: h3Lng,
      distanceKm: h3Dist,
      etaMinutes: Math.max(5, Math.round(h3Dist * 2.2)),
    },
    {
      ...t3,
      id: 'hosp-greenfield-sdh',
      name: `${areaName} Greenfield Sub-District Hospital`,
      address: `West Ring Corridor, ${areaName}`,
      lat: h4Lat,
      lng: h4Lng,
      distanceKm: h4Dist,
      etaMinutes: Math.max(7, Math.round(h4Dist * 2.2)),
    },
    {
      ...t4,
      id: 'hosp-sonipat-district',
      name: `${areaName} District Civil Hospital & Trauma Unit`,
      address: `Civil Lines Road, ${areaName}`,
      lat: h5Lat,
      lng: h5Lng,
      distanceKm: h5Dist,
      etaMinutes: Math.max(10, Math.round(h5Dist * 2.2)),
    },
    {
      ...t5,
      id: 'hosp-apex-multispecialty',
      name: `Apex MedCatalyst Multi-Specialty & Level-1 Trauma Center (${areaName})`,
      address: `Super Highway Ring Road, ${areaName}`,
      lat: h6Lat,
      lng: h6Lng,
      distanceKm: h6Dist,
      etaMinutes: Math.max(14, Math.round(h6Dist * 2.2)),
    }
  ];
}

function createLocalizedAmbulances(baseLat: number, baseLng: number, areaName: string, template: Ambulance[]): Ambulance[] {
  const a0 = template[0] || INITIAL_AMBULANCES[0];
  const a1 = template[1] || INITIAL_AMBULANCES[1];
  const a2 = template[2] || INITIAL_AMBULANCES[2];

  return [
    {
      ...a0,
      hospitalName: `${areaName} Primary Health Center`,
      currentLat: Math.round((baseLat + 0.0040) * 10000) / 10000,
      currentLng: Math.round((baseLng + 0.0030) * 10000) / 10000,
      etaMinutes: 2,
    },
    {
      ...a1,
      hospitalName: `${areaName} Community Health Center`,
      currentLat: Math.round((baseLat - 0.0095) * 10000) / 10000,
      currentLng: Math.round((baseLng + 0.0075) * 10000) / 10000,
      etaMinutes: 4,
    },
    {
      ...a2,
      hospitalName: `Apex MedCatalyst Multi-Specialty (${areaName})`,
      currentLat: Math.round((baseLat + 0.0165) * 10000) / 10000,
      currentLng: Math.round((baseLng - 0.0125) * 10000) / 10000,
      etaMinutes: 7,
    }
  ];
}

const INITIAL_VITALS: AmbulanceAssessmentForm = INITIAL_ASSESSMENT;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const saved = localStorage.getItem('medcatalyst_hospitals') || localStorage.getItem('sanjeevani_hospitals');
    if (saved) {
      try {
        const parsed: Hospital[] = JSON.parse(saved);
        if (parsed.length >= INITIAL_HOSPITALS.length) {
          return parsed.map(h => {
            const initMatch = INITIAL_HOSPITALS.find(ih => ih.id === h.id);
            return {
              ...h,
              dialysisAvail: h.dialysisAvail ?? (initMatch?.dialysisAvail ?? 0),
              ecgAvail: h.ecgAvail ?? (initMatch?.ecgAvail ?? 0),
              ctScannerAvail: h.ctScannerAvail ?? (initMatch?.ctScannerAvail ?? 0),
              defibrillatorAvail: h.defibrillatorAvail ?? (initMatch?.defibrillatorAvail ?? 0),
              mriAvail: h.mriAvail ?? (initMatch?.mriAvail ?? 0),
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_HOSPITALS;
  });

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-rampur-phc');
  const [user, setUser] = useState<UserBioData>(() => {
    const saved = localStorage.getItem('medcatalyst_user') || localStorage.getItem('sanjeevani_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USER;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Hospital Authentication State (for /hospital portal)
  const [hospitalUser, setHospitalUser] = useState<Hospital | null>(() => {
    const savedHospId = localStorage.getItem('medcatalyst_hospital_session') || localStorage.getItem('sanjeevani_hospital_session');
    if (savedHospId) {
      const savedHosp = hospitals.find(h => h.id === savedHospId);
      if (savedHosp) return savedHosp;
    }
    return null;
  });

  // Cross-tab real-time sync for hospitals, doctors, and user medical records
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'medcatalyst_hospitals' || e.key === 'sanjeevani_hospitals') && e.newValue) {
        try {
          const parsed: Hospital[] = JSON.parse(e.newValue);
          setHospitals(parsed);
          if (hospitalUser) {
            const updatedSelf = parsed.find(h => h.id === hospitalUser.id);
            if (updatedSelf) setHospitalUser(updatedSelf);
          }
        } catch (err) {
          console.error(err);
        }
      }
      if ((e.key === 'medcatalyst_user' || e.key === 'sanjeevani_user') && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [hospitalUser]);

  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => {
    const saved = localStorage.getItem('medcatalyst_ambulances') || localStorage.getItem('sanjeevani_ambulances');
    return saved ? JSON.parse(saved) : INITIAL_AMBULANCES;
  });

  const [ambulanceUser, setAmbulanceUser] = useState<Ambulance | null>(() => {
    const saved = localStorage.getItem('medcatalyst_ambulance_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Scheduled Tele-Consultations & Doctor Appointments
  const [appointments, setAppointments] = useState<TeleAppointment[]>(() => {
    const saved = localStorage.getItem('medcatalyst_tele_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [doctorUser, setDoctorUser] = useState<DoctorUser | null>(() => {
    const saved = localStorage.getItem('medcatalyst_doctor_user');
    if (saved) {
      try {
        const parsed: DoctorUser = JSON.parse(saved);
        if (parsed && !parsed.profile) {
          parsed.profile = getDoctorProfileForDoctor(parsed.id, parsed.name, parsed.department);
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [doctorQueues, setDoctorQueues] = useState<Record<string, DoctorQueueState>>(() => {
    const saved = localStorage.getItem('medcatalyst_doctor_queues');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_DOCTOR_QUEUES;
  });

  const getOrCreateDocQueue = (doctorId: string): DoctorQueueState => {
    return doctorQueues[doctorId] || {
      doctorId,
      defaultDurationMinutes: 15,
      rollingWindowSize: 5,
      completedDurations: [15],
      currentRollingAvgMinutes: 15.0
    };
  };

  const bookAppointment = (data: Omit<TeleAppointment, 'id' | 'bookedAt' | 'status' | 'tokenNumber' | 'tokenSequence' | 'queueStatus'> & { timeWindow?: string }): TeleAppointment => {
    const docId = data.doctorId;
    const docQueue = getOrCreateDocQueue(docId);
    const timeWindow = data.timeWindow || data.timeSlot || '10:00 AM – 12:00 PM';
    const { tokenNumber, tokenSequence } = generateNextToken(appointments, docId, timeWindow);

    const now = new Date();
    const newAppt: TeleAppointment = {
      ...data,
      id: `appt-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
      status: 'SCHEDULED',
      queueStatus: 'WAITING',
      timeSlot: timeWindow,
      timeWindow: timeWindow,
      tokenNumber,
      tokenSequence,
      bookedAt: 'Today, ' + formatTimeAmPm(now),
      bookedAtTimestamp: now.getTime()
    };

    const combined = [newAppt, ...appointments];
    const recalculated = recalculateDoctorQueue(
      combined,
      docId,
      docQueue.currentRollingAvgMinutes,
      docQueue.activeConsultationStartTime
    );

    const finalizedAppt = recalculated.find(a => a.id === newAppt.id) || newAppt;

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));

    return finalizedAppt;
  };

  const callNextQueuePatient = (doctorId: string): TeleAppointment | null => {
    const docAppts = appointments
      .filter(a => a.doctorId === doctorId && a.queueStatus === 'WAITING')
      .sort((a, b) => (a.tokenSequence || 0) - (b.tokenSequence || 0));

    if (docAppts.length === 0) return null;
    const nextPatient = docAppts[0];
    const docQueue = getOrCreateDocQueue(doctorId);

    const updatedQueues: Record<string, DoctorQueueState> = {
      ...doctorQueues,
      [doctorId]: {
        ...docQueue,
        activePatientId: nextPatient.id,
        activeTokenNumber: nextPatient.tokenNumber
      }
    };
    setDoctorQueues(updatedQueues);
    localStorage.setItem('medcatalyst_doctor_queues', JSON.stringify(updatedQueues));

    const updatedAppts = appointments.map(a => 
      a.id === nextPatient.id 
        ? { ...a, queueStatus: 'CALLED' as QueueStatus } 
        : a
    );

    const recalculated = recalculateDoctorQueue(
      updatedAppts,
      doctorId,
      docQueue.currentRollingAvgMinutes,
      docQueue.activeConsultationStartTime
    );

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));

    return recalculated.find(a => a.id === nextPatient.id) || null;
  };

  const startPatientConsultation = (appointmentId: string) => {
    const target = appointments.find(a => a.id === appointmentId);
    if (!target) return;

    const docId = target.doctorId;
    const nowMs = Date.now();
    const nowStr = new Date().toISOString();
    const docQueue = getOrCreateDocQueue(docId);

    const updatedQueues: Record<string, DoctorQueueState> = {
      ...doctorQueues,
      [docId]: {
        ...docQueue,
        activePatientId: target.id,
        activeTokenNumber: target.tokenNumber,
        activeConsultationStartTime: nowMs
      }
    };
    setDoctorQueues(updatedQueues);
    localStorage.setItem('medcatalyst_doctor_queues', JSON.stringify(updatedQueues));

    const updatedAppts = appointments.map(a => 
      a.id === appointmentId 
        ? { 
            ...a, 
            queueStatus: 'IN_CONSULTATION' as QueueStatus, 
            status: 'IN_CALL' as const,
            actualStartTime: nowStr,
            patientsAhead: 0,
            estimatedWaitMinutes: 0,
            estimatedConsultationTime: 'In Consultation Now'
          }
        : a
    );

    const recalculated = recalculateDoctorQueue(
      updatedAppts,
      docId,
      docQueue.currentRollingAvgMinutes,
      nowMs
    );

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));
  };

  const endPatientConsultation = (appointmentId: string, consultationSummary?: string) => {
    const target = appointments.find(a => a.id === appointmentId);
    if (!target) return;

    const docId = target.doctorId;
    const nowMs = Date.now();
    const nowStr = new Date().toISOString();

    let durationMins = 14;
    if (target.actualStartTime) {
      const startMs = new Date(target.actualStartTime).getTime();
      const elapsed = Math.round((nowMs - startMs) / 60000);
      durationMins = Math.max(1, elapsed);
    } else {
      durationMins = Math.floor(11 + Math.random() * 6);
    }

    const docQueue = getOrCreateDocQueue(docId);
    const newDurations = [...docQueue.completedDurations, durationMins];
    const newRollingAvg = calculateRollingAverage(newDurations, docQueue.rollingWindowSize, docQueue.defaultDurationMinutes);

    const updatedQueues: Record<string, DoctorQueueState> = {
      ...doctorQueues,
      [docId]: {
        ...docQueue,
        completedDurations: newDurations,
        currentRollingAvgMinutes: newRollingAvg,
        activePatientId: undefined,
        activeTokenNumber: undefined,
        activeConsultationStartTime: undefined
      }
    };
    setDoctorQueues(updatedQueues);
    localStorage.setItem('medcatalyst_doctor_queues', JSON.stringify(updatedQueues));

    const updatedAppts = appointments.map(a => 
      a.id === appointmentId 
        ? {
            ...a,
            queueStatus: 'COMPLETED' as QueueStatus,
            status: 'COMPLETED' as const,
            actualEndTime: nowStr,
            actualDurationMinutes: durationMins,
            clinicalNotes: consultationSummary || a.clinicalNotes || 'Tele-consultation completed and digitally signed.'
          }
        : a
    );

    const recalculated = recalculateDoctorQueue(
      updatedAppts,
      docId,
      newRollingAvg,
      undefined
    );

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));
  };

  const markPatientNoShow = (appointmentId: string) => {
    const target = appointments.find(a => a.id === appointmentId);
    if (!target) return;

    const docId = target.doctorId;
    const docQueue = getOrCreateDocQueue(docId);

    if (docQueue.activePatientId === appointmentId) {
      const updatedQueues: Record<string, DoctorQueueState> = {
        ...doctorQueues,
        [docId]: {
          ...docQueue,
          activePatientId: undefined,
          activeTokenNumber: undefined,
          activeConsultationStartTime: undefined
        }
      };
      setDoctorQueues(updatedQueues);
      localStorage.setItem('medcatalyst_doctor_queues', JSON.stringify(updatedQueues));
    }

    const updatedAppts = appointments.map(a => 
      a.id === appointmentId 
        ? {
            ...a,
            queueStatus: 'NO_SHOW' as QueueStatus,
            status: 'CANCELLED' as const,
            clinicalNotes: 'Patient marked as No-Show after queue summons.'
          }
        : a
    );

    const recalculated = recalculateDoctorQueue(
      updatedAppts,
      docId,
      docQueue.currentRollingAvgMinutes,
      docQueue.activeConsultationStartTime
    );

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));
  };

  const cancelQueueAppointment = (appointmentId: string, reason?: string) => {
    const target = appointments.find(a => a.id === appointmentId);
    if (!target) return;

    const docId = target.doctorId;
    const docQueue = getOrCreateDocQueue(docId);

    if (docQueue.activePatientId === appointmentId) {
      const updatedQueues: Record<string, DoctorQueueState> = {
        ...doctorQueues,
        [docId]: {
          ...docQueue,
          activePatientId: undefined,
          activeTokenNumber: undefined,
          activeConsultationStartTime: undefined
        }
      };
      setDoctorQueues(updatedQueues);
      localStorage.setItem('medcatalyst_doctor_queues', JSON.stringify(updatedQueues));
    }

    const updatedAppts = appointments.map(a => 
      a.id === appointmentId 
        ? {
            ...a,
            queueStatus: 'CANCELLED' as QueueStatus,
            status: 'CANCELLED' as const,
            clinicalNotes: reason ? `Cancelled: ${reason}` : 'Cancelled by patient.'
          }
        : a
    );

    const recalculated = recalculateDoctorQueue(
      updatedAppts,
      docId,
      docQueue.currentRollingAvgMinutes,
      docQueue.activeConsultationStartTime
    );

    setAppointments(recalculated);
    localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(recalculated));
  };

  const updateAppointmentStatus = (id: string, status: TeleAppointment['status']) => {
    setAppointments(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, status } : a);
      localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(updated));
      return updated;
    });
  };

  const initiateInstantConsultation = (doctorId: string, symptomText?: string): TeleAppointment => {
    let targetDoc: DoctorOnDuty | undefined;
    let targetHosp: Hospital | undefined;
    for (const h of hospitals) {
      const d = h.doctorsOnDuty.find(doc => doc.id === doctorId);
      if (d) {
        targetDoc = d;
        targetHosp = h;
        break;
      }
    }

    const docName = targetDoc?.name || (doctorUser?.id === doctorId ? doctorUser.name : 'Dr. Kavita Sharma');
    const docSpecialty = targetDoc?.designation || 'Medical Officer (MBBS)';
    const hospId = targetHosp?.id || (doctorUser?.id === doctorId ? doctorUser.hospitalId : 'hosp-rampur-phc');
    const hospName = targetHosp?.name || (doctorUser?.id === doctorId ? doctorUser.hospitalName : 'Rampur Primary Health Center');

    const instantAppt: TeleAppointment = {
      id: `instant-${Date.now()}`,
      patientId: user.id,
      patientName: user.fullName || 'Rameshwar Singh',
      patientPhone: user.phone || '+91 98765 43210',
      patientAbhaId: user.healthId || '91-2849-5830-1092',
      patientAge: user.age || 52,
      patientGender: user.gender || 'Male',
      patientBloodGroup: user.bloodGroup || 'O+ (Positive)',
      doctorId,
      doctorName: docName,
      doctorSpecialty: docSpecialty,
      hospitalId: hospId,
      hospitalName: hospName,
      date: 'Today',
      timeSlot: 'Instant (Right Now)',
      timeWindow: 'Instant Priority Room',
      tokenNumber: 'URGENT',
      tokenSequence: 0,
      queueStatus: 'IN_CONSULTATION',
      symptoms: symptomText || 'Instant Tele-OPD Video Consultation Request',
      urgency: 'PRIORITY',
      consultationType: 'VIDEO',
      status: 'IN_CALL',
      isInstantConsult: true,
      actualStartTime: new Date().toISOString(),
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      estimatedConsultationTime: 'In Consultation Now',
      bookedAt: 'Just now',
      bookedAtTimestamp: Date.now()
    };

    setAppointments(prev => {
      const updated = [instantAppt, ...prev];
      localStorage.setItem('medcatalyst_tele_appointments', JSON.stringify(updated));
      return updated;
    });

    return instantAppt;
  };

  const loginDoctor = (doctorIdOrName: string): boolean => {
    const clean = doctorIdOrName.trim().toLowerCase();
    for (const h of hospitals) {
      const doc = h.doctorsOnDuty.find(d => 
        d.id.toLowerCase() === clean || 
        d.name.toLowerCase().includes(clean) ||
        d.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
      );
      if (doc) {
        const defaultSettings = doc.scheduleSettings || createDefaultScheduleSettings();
        const docProfile = doc.profile || getDoctorProfileForDoctor(doc.id, doc.name, doc.department);
        const docUser: DoctorUser = {
          id: doc.id,
          name: doc.name,
          designation: doc.designation,
          department: doc.department || 'General Medicine',
          shift: doc.shift,
          hospitalId: h.id,
          hospitalName: h.name,
          roomNumber: doc.roomNumber,
          isOnlineForTeleConsult: defaultSettings.dutyMode === 'AVAILABLE' && defaultSettings.readyForInstantConsult,
          scheduleSettings: defaultSettings,
          profile: docProfile
        };
        setDoctorUser(docUser);
        localStorage.setItem('medcatalyst_doctor_user', JSON.stringify(docUser));
        return true;
      }
    }
    return false;
  };

  const logoutDoctor = () => {
    setDoctorUser(null);
    localStorage.removeItem('medcatalyst_doctor_user');
  };

  const toggleDoctorTeleConsultStatus = (isOnline: boolean) => {
    setDoctorUser(prev => {
      if (!prev) return null;
      const currentSettings = prev.scheduleSettings || createDefaultScheduleSettings();
      const updatedSettings: DoctorScheduleSettings = {
        ...currentSettings,
        dutyMode: isOnline ? 'AVAILABLE' : 'OFF_DUTY',
        readyForInstantConsult: isOnline
      };
      const updated = { 
        ...prev, 
        isOnlineForTeleConsult: isOnline,
        scheduleSettings: updatedSettings
      };
      localStorage.setItem('medcatalyst_doctor_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateDoctorScheduleSettings = (settings: Partial<DoctorScheduleSettings>) => {
    setDoctorUser(prev => {
      if (!prev) return null;
      const current = prev.scheduleSettings || createDefaultScheduleSettings();
      const updatedSettings: DoctorScheduleSettings = {
        ...current,
        ...settings
      };
      const isOnline = updatedSettings.dutyMode === 'AVAILABLE' && updatedSettings.readyForInstantConsult;
      const updatedUser: DoctorUser = {
        ...prev,
        isOnlineForTeleConsult: isOnline,
        scheduleSettings: updatedSettings
      };
      localStorage.setItem('medcatalyst_doctor_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    setHospitals(prev => {
      if (!doctorUser) return prev;
      const updated = prev.map(h => {
        if (h.id !== doctorUser.hospitalId) return h;
        return {
          ...h,
          doctorsOnDuty: h.doctorsOnDuty.map(d => {
            if (d.id !== doctorUser.id) return d;
            const current = d.scheduleSettings || createDefaultScheduleSettings();
            const updatedSettings: DoctorScheduleSettings = {
              ...current,
              ...settings
            };
            const isAvailable = updatedSettings.dutyMode === 'AVAILABLE';
            return {
              ...d,
              available: isAvailable,
              statusDetail: (isAvailable ? 'AVAILABLE' : (updatedSettings.dutyMode === 'ON_LEAVE' ? 'OFF_DUTY' : 'BUSY')) as DoctorStatusType,
              scheduleSettings: updatedSettings
            };
          })
        };
      });
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });
  };

  const submitDoctorReview = (doctorId: string, review: Omit<DoctorPatientReview, 'id' | 'date'>) => {
    const newReview: DoctorPatientReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'Today'
    };

    // Update in doctorUser if it matches the current logged-in doctor
    setDoctorUser(prev => {
      if (!prev) return null;
      if (prev.id === doctorId || prev.name.toLowerCase().includes(doctorId.toLowerCase())) {
        const currentProfile = prev.profile || getDoctorProfileForDoctor(prev.id, prev.name, prev.department);
        const updatedReviews = [newReview, ...currentProfile.reviews];
        const newTotal = updatedReviews.length;
        const sumRatings = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = Number((sumRatings / newTotal).toFixed(1));
        const dist = { ...currentProfile.ratingDistribution };
        const star = review.rating as 1 | 2 | 3 | 4 | 5;
        dist[star] = (dist[star] || 0) + 1;
        const positiveReviews = updatedReviews.filter(r => r.rating >= 4).length;
        const recRate = Math.round((positiveReviews / newTotal) * 100);

        const updatedProfile: DoctorProfileData = {
          ...currentProfile,
          averageRating: avg,
          totalReviews: newTotal,
          recommendationRate: recRate,
          ratingDistribution: dist,
          reviews: updatedReviews
        };

        const updatedDoctorUser = {
          ...prev,
          profile: updatedProfile
        };
        localStorage.setItem('medcatalyst_doctor_user', JSON.stringify(updatedDoctorUser));
        return updatedDoctorUser;
      }
      return prev;
    });

    // Also update in hospitals state
    setHospitals(prev => {
      const updated = prev.map(h => ({
        ...h,
        doctorsOnDuty: h.doctorsOnDuty.map(d => {
          if (d.id === doctorId || d.name.toLowerCase().includes(doctorId.toLowerCase())) {
            const currentProfile = d.profile || getDoctorProfileForDoctor(d.id, d.name, d.department);
            const updatedReviews = [newReview, ...currentProfile.reviews];
            const newTotal = updatedReviews.length;
            const sumRatings = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = Number((sumRatings / newTotal).toFixed(1));
            const dist = { ...currentProfile.ratingDistribution };
            const star = review.rating as 1 | 2 | 3 | 4 | 5;
            dist[star] = (dist[star] || 0) + 1;

            return {
              ...d,
              profile: {
                ...currentProfile,
                averageRating: avg,
                totalReviews: newTotal,
                recommendationRate: Math.round((updatedReviews.filter(r => r.rating >= 4).length / newTotal) * 100),
                ratingDistribution: dist,
                reviews: updatedReviews
              }
            };
          }
          return d;
        })
      }));
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });
  };

  const loginAmbulance = (vehicleNumber: string): boolean => {
    const cleanNum = vehicleNumber.trim().toUpperCase().replace(/\s+/g, '-');
    const matched = ambulances.find(a => 
      a.vehicleNumber.toUpperCase() === cleanNum ||
      a.id.toUpperCase() === cleanNum ||
      a.vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanNum.replace(/[^A-Z0-9]/g, '')
    );

    if (matched) {
      setAmbulanceUser(matched);
      localStorage.setItem('medcatalyst_ambulance_user', JSON.stringify(matched));
      return true;
    }
    return false;
  };

  const logoutAmbulance = () => {
    setAmbulanceUser(null);
    localStorage.removeItem('medcatalyst_ambulance_user');
  };

  useEffect(() => {
    if (ambulanceUser) {
      const updated = ambulances.find(a => a.id === ambulanceUser.id);
      if (updated) {
        setAmbulanceUser(updated);
        localStorage.setItem('medcatalyst_ambulance_user', JSON.stringify(updated));
      }
    }
  }, [ambulances]);

  const [activeDispatch, setActiveDispatch] = useState<EmergencyDispatch | null>(() => {
    // By default, NO ambulance moves without an explicit user-created emergency request
    const saved = localStorage.getItem('medcatalyst_active_dispatch');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== 'disp-2026-9041' && parsed.status && parsed.status !== 'ARRIVED' && parsed.status !== 'CANCELLED') {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Clean up any stale saved demo dispatches
    try {
      localStorage.removeItem('medcatalyst_active_dispatch');
      localStorage.removeItem('sanjeevani_active_dispatch');
    } catch (e) {}
    return null;
  });

  const [ambulanceAssessment, setAmbulanceAssessment] = useState<AmbulanceAssessmentForm>(INITIAL_ASSESSMENT);
  const vitals = ambulanceAssessment;
  const setVitals = setAmbulanceAssessment;
  const [workerReports, setWorkerReports] = useState<PublicWorkerReport[]>(INITIAL_WORKER_REPORTS);
  const [greenCorridorActive, setGreenCorridorActive] = useState<boolean>(false);
  const [clearedJunctions, setClearedJunctions] = useState<string[]>(['Rampur Toll Gate']);

  // Traffic Police Corridor State
  const [trafficCorridor, setTrafficCorridor] = useState<TrafficCorridorEmergency>(() => {
    return createInitialTrafficEmergency();
  });
  const [signalOverrides, setSignalOverrides] = useState<Record<string, { lightState?: SignalLightState; status?: SignalCorridorStatus }>>({});

  // Signal Post Officer Authentication State
  const [policeUserSignal, setPoliceUserSignal] = useState<TrafficSignal | null>(() => {
    const saved = localStorage.getItem('medcatalyst_police_signal');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // User's detected live GPS location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; areaName?: string } | null>(() => {
    const saved = localStorage.getItem('medcatalyst_user_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Relocate the entire hospital, ambulance, and emergency dispatch network dynamically around the user's real GPS position
  const relocateToUserLocation = useCallback((lat: number, lng: number, customAreaName?: string) => {
    const area = customAreaName || (userLocation?.areaName) || 'Local Area';
    const newLoc = { lat, lng, areaName: area };
    setUserLocation(newLoc);
    try {
      localStorage.setItem('medcatalyst_user_location', JSON.stringify(newLoc));
    } catch (e) {}

    setHospitals(prev => {
      const updated = createLocalizedHospitals(lat, lng, area, prev);
      try {
        localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAmbulances(prev => {
      const updated = createLocalizedAmbulances(lat, lng, area, prev);
      try {
        localStorage.setItem('medcatalyst_ambulances', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveDispatch(prev => {
      if (!prev) return prev;
      const updated: EmergencyDispatch = {
        ...prev,
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: `${area}, Near Current Location`,
        waterfallHistory: [
          {
            hospitalId: 'hosp-rampur-phc',
            hospitalName: `${area} Primary Health Center (PHC)`,
            sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'ACCEPTED',
            responseTimeSeconds: 28,
            note: `Nearest Ambulance HR-10-EM-1081 (0.5 km away) dispatched immediately; ${area} PHC confirmed intake`
          }
        ],
        messages: [
          { sender: 'CITIZEN', text: prev.callerIssue, timestamp: '01:31 AM', type: 'VOICE' },
          { sender: 'PARAMEDIC', text: `🚨 Nearest Ambulance HR-10-EM-1081 (0.5 km away, ETA 2 mins) dispatched immediately to your coordinates! Driver: Jagdish Kumar.`, timestamp: '01:31 AM', type: 'TEXT' },
          { sender: 'HOSPITAL', text: `${area} PHC confirmed bed readiness. Emergency staff alerted.`, timestamp: '01:32 AM', type: 'TEXT' },
          { sender: 'PARAMEDIC', text: 'Patient onboard. Vitals recorded in in-ambulance assessment form: GCS 8, SpO2 89%.', timestamp: '01:35 AM', type: 'TEXT' }
        ]
      };
      try {
        localStorage.setItem('medcatalyst_active_dispatch', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // In background, reverse-geocode using OpenStreetMap Nominatim
    if (!customAreaName) {
      try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            const addr = data.address || {};
            const resolvedCity = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.county || '';
            if (resolvedCity && resolvedCity.toLowerCase() !== 'local area') {
              relocateToUserLocation(lat, lng, resolvedCity);
            }
          })
          .catch(() => {
            // Fallback to client geocode
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
              .then(res => res.json())
              .then(data => {
                const resolvedCity = data.locality || data.city || data.principalSubdivision || '';
                if (resolvedCity && resolvedCity.toLowerCase() !== 'local area') {
                  relocateToUserLocation(lat, lng, resolvedCity);
                }
              })
              .catch(() => {});
          });
      } catch (e) {}
    }
  }, [userLocation?.areaName]);

  // Query browser geolocation on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          relocateToUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.log('GPS notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, [relocateToUserLocation]);

  // Uber/Rapido-Style Live Moving Ambulance State (Only active during an ongoing emergency dispatch)
  const [liveAmbulance, setLiveAmbulance] = useState<LiveMovingAmbulance | null>(null);

  // Cached road mission routes for active emergency dispatch (OSRM turn-by-turn road geometries)
  const ambulanceRoadMissionRef = useRef<{
    dispatchId: string;
    phase1: [number, number][];
    phase2: [number, number][];
    fullRoute: [number, number][];
    isLoading: boolean;
  } | null>(null);

  // Pre-fetch turn-by-turn street navigation road geometries when emergency is dispatched
  useEffect(() => {
    if (!activeDispatch || activeDispatch.status === 'ARRIVED') {
      ambulanceRoadMissionRef.current = null;
      return;
    }

    const patientLat = activeDispatch.pickupLat || userLocation?.lat || 18.7479;
    const patientLng = activeDispatch.pickupLng || userLocation?.lng || 73.7144;
    const targetHosp = hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[0] || INITIAL_HOSPITALS[0];
    const hospLat = targetHosp.lat;
    const hospLng = targetHosp.lng;

    const assignedAmb = ambulances.find(a => a.id === activeDispatch.assignedAmbulanceId) || ambulances[0];
    const originLat = assignedAmb?.currentLat ?? (patientLat + 0.0075);
    const originLng = assignedAmb?.currentLng ?? (patientLng + 0.0065);

    let active = true;
    ambulanceRoadMissionRef.current = {
      dispatchId: activeDispatch.id,
      phase1: [],
      phase2: [],
      fullRoute: [],
      isLoading: true
    };

    fetchAmbulanceMissionRoadRoute(originLat, originLng, patientLat, patientLng, hospLat, hospLng)
      .then(mission => {
        if (!active) return;
        ambulanceRoadMissionRef.current = {
          dispatchId: activeDispatch.id,
          phase1: mission.phase1.coordinates,
          phase2: mission.phase2.coordinates,
          fullRoute: mission.fullRouteCoordinates,
          isLoading: false
        };
      })
      .catch(err => {
        console.warn('Could not fetch real road mission coordinates (using straight fallback):', err);
      });

    return () => {
      active = false;
    };
  }, [
    activeDispatch?.id,
    activeDispatch?.status,
    activeDispatch?.pickupLat,
    activeDispatch?.pickupLng,
    activeDispatch?.currentHospitalId,
    activeDispatch?.assignedAmbulanceId,
    hospitals,
    ambulances,
    userLocation
  ]);

  // Smooth Live Ambulance Movement Simulation (Updates location & distances along real roads every second)
  useEffect(() => {
    if (!activeDispatch || activeDispatch.status === 'ARRIVED') {
      setLiveAmbulance(null);
      return;
    }

    const timer = setInterval(() => {
      setLiveAmbulance(prev => {
        const patientLat = activeDispatch.pickupLat || userLocation?.lat || 18.7479;
        const patientLng = activeDispatch.pickupLng || userLocation?.lng || 73.7144;
        const targetHosp = hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[0] || INITIAL_HOSPITALS[0];
        const hospLat = targetHosp.lat;
        const hospLng = targetHosp.lng;

        // Origin ambulance station/depot
        const assignedAmb = ambulances.find(a => a.id === activeDispatch.assignedAmbulanceId) || ambulances[0];
        const originLat = assignedAmb?.currentLat ?? (patientLat + 0.0075);
        const originLng = assignedAmb?.currentLng ?? (patientLng + 0.0065);

        let curProgress = prev?.progress ?? 0.02;
        let nextProgress = curProgress + 0.006;
        if (nextProgress >= 1.0) nextProgress = 0.0;

        const roadMission = ambulanceRoadMissionRef.current;
        const hasRoadRoute = !!(roadMission && !roadMission.isLoading && roadMission.phase1.length > 1 && roadMission.phase2.length > 1);

        let curLat: number;
        let curLng: number;
        let phase: 'EN_ROUTE_TO_PATIENT' | 'TRANSPORTING_TO_HOSPITAL';
        let heading: number;
        let distToPatient: number;
        let distToHosp: number;
        let etaPatient: number;
        let etaHosp: number;

        if (nextProgress < 0.45) {
          // Phase 1: Moving from depot to patient pickup along real roads
          phase = 'EN_ROUTE_TO_PATIENT';
          const subT = nextProgress / 0.45;

          if (hasRoadRoute && roadMission) {
            const pt = getPointAlongPolyline(roadMission.phase1, subT);
            curLat = pt.lat;
            curLng = pt.lng;
            heading = pt.heading;
            distToPatient = pt.remainingDistanceKm;
          } else {
            curLat = originLat + (patientLat - originLat) * subT;
            curLng = originLng + (patientLng - originLng) * subT;
            heading = 210;
            distToPatient = calculateHaversineKm(curLat, curLng, patientLat, patientLng);
          }

          distToHosp = calculateHaversineKm(patientLat, patientLng, hospLat, hospLng);
          etaPatient = Math.max(1, Math.round(distToPatient * 2.0));
          etaHosp = Math.max(1, Math.round(distToHosp * 2.0));
        } else {
          // Phase 2: Transporting patient to destination hospital along real roads
          phase = 'TRANSPORTING_TO_HOSPITAL';
          const subT = (nextProgress - 0.45) / 0.55;

          if (hasRoadRoute && roadMission) {
            const pt = getPointAlongPolyline(roadMission.phase2, subT);
            curLat = pt.lat;
            curLng = pt.lng;
            heading = pt.heading;
            distToHosp = pt.remainingDistanceKm;
          } else {
            curLat = patientLat + (hospLat - patientLat) * subT;
            curLng = patientLng + (hospLng - patientLng) * subT;
            heading = 45;
            distToHosp = calculateHaversineKm(curLat, curLng, hospLat, hospLng);
          }

          distToPatient = 0;
          etaPatient = 0;
          etaHosp = Math.max(1, Math.round(distToHosp * 2.0));
        }

        const distPatientToHosp = hasRoadRoute && roadMission && roadMission.phase2.length > 1
          ? getPointAlongPolyline(roadMission.phase2, 0).totalDistanceKm
          : calculateHaversineKm(patientLat, patientLng, hospLat, hospLng);

        const baseSpeed = 48;
        const jitter = Math.sin(Date.now() / 1500) * 4;
        const speed = Math.round(baseSpeed + jitter);

        return {
          lat: Math.round(curLat * 100000) / 100000,
          lng: Math.round(curLng * 100000) / 100000,
          speedKmH: speed,
          heading,
          progress: nextProgress,
          phase,
          distanceToPatientKm: distToPatient,
          distancePatientToHospitalKm: distPatientToHosp,
          etaToPatientMinutes: etaPatient,
          etaToHospitalMinutes: etaHosp,
          vehicleNumber: assignedAmb?.vehicleNumber || 'HR-10-EM-1081',
          driverName: assignedAmb?.driverName || 'Jagdish Kumar',
          driverPhone: assignedAmb?.driverPhone || '+91 98765 43210',
          originLat,
          originLng,
          pickupLat: patientLat,
          pickupLng: patientLng,
          hospLat,
          hospLng,
          roadRouteCoordinates: roadMission?.fullRoute && roadMission.fullRoute.length > 1 ? roadMission.fullRoute : undefined,
          phase1Route: roadMission?.phase1 && roadMission.phase1.length > 1 ? roadMission.phase1 : undefined,
          phase2Route: roadMission?.phase2 && roadMission.phase2.length > 1 ? roadMission.phase2 : undefined
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDispatch?.id, activeDispatch?.status, activeDispatch?.pickupLat, activeDispatch?.pickupLng, activeDispatch?.currentHospitalId, activeDispatch?.assignedAmbulanceId, hospitals, ambulances, userLocation]);

  // Keep logged-in police signal in sync with live corridor progress
  useEffect(() => {
    if (!policeUserSignal) return;
    const current = trafficCorridor.signals.find(s => s.id === policeUserSignal.id);
    if (current && (current.etaMinutes !== policeUserSignal.etaMinutes || current.distanceKm !== policeUserSignal.distanceKm || current.status !== policeUserSignal.status || current.lightState !== policeUserSignal.lightState)) {
      setPoliceUserSignal(current);
    }
  }, [trafficCorridor.signals, policeUserSignal]);

  // Simulation tick effect
  useEffect(() => {
    if (!trafficCorridor.isSimulating) return;

    const intervalMs = Math.max(150, Math.floor(1000 / (trafficCorridor.simulationSpeedMultiplier || 1)));
    const stepSize = 0.012; // progress delta per tick

    const interval = setInterval(() => {
      setTrafficCorridor(prev => {
        if (!prev.isSimulating) return prev;

        const nextProgress = Math.min(1.0, prev.simulationProgress + stepSize);
        const isDone = nextProgress >= 1.0;

        // Slight speed variance 50-54 km/h for realism
        const variance = (Math.random() - 0.5) * 4;
        const speed = Math.min(65, Math.max(42, Math.round(52 + variance)));

        const { signals, currentAmbulancePos, totalRouteKm } = identifyRouteSignals(
          prev.routeCoordinates,
          nextProgress,
          speed,
          signalOverrides,
          prev.automatedGreenWave
        );

        const remainingKm = Math.max(0, totalRouteKm * (1 - nextProgress));
        const totalEtaMinutes = Math.max(1, Math.round((remainingKm / speed) * 60));

        return {
          ...prev,
          simulationProgress: nextProgress,
          currentLat: currentAmbulancePos[0],
          currentLng: currentAmbulancePos[1],
          speedKmH: isDone ? 0 : speed,
          totalEtaMinutes: isDone ? 0 : totalEtaMinutes,
          signals,
          isSimulating: !isDone,
        };
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [trafficCorridor.isSimulating, trafficCorridor.simulationSpeedMultiplier, trafficCorridor.automatedGreenWave, signalOverrides]);


  // Persist changes
  useEffect(() => {
    localStorage.setItem('medcatalyst_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem('medcatalyst_ambulances', JSON.stringify(ambulances));
  }, [ambulances]);

  useEffect(() => {
    if (activeDispatch) {
      localStorage.setItem('medcatalyst_active_dispatch', JSON.stringify(activeDispatch));
    } else {
      localStorage.removeItem('medcatalyst_active_dispatch');
    }
  }, [activeDispatch]);

  // Reactive 2-Minute SLA Countdown Timer for Emergency Waterfall Dispatch
  useEffect(() => {
    if (activeDispatch?.status !== 'PENDING_HOSPITAL_ACCEPT') return;

    const timer = setInterval(() => {
      setActiveDispatch(prev => {
        if (!prev || prev.status !== 'PENDING_HOSPITAL_ACCEPT') return prev;

        if (prev.timeoutSecondsRemaining <= 1) {
          // Timeout reached! Trigger automatic waterfall failover to next nearest hospital!
          const currentHospIndex = hospitals.findIndex(h => h.id === prev.currentHospitalId);
          const nextHosp = hospitals[currentHospIndex + 1] || hospitals[0];

          const updatedHistory: WaterfallHop[] = [
            ...prev.waterfallHistory.map(hop => 
              hop.hospitalId === prev.currentHospitalId 
                ? { ...hop, status: 'TIMED_OUT' as const, note: 'Exceeded 2-minute SLA (120s) without acknowledgement' }
                : hop
            ),
            {
              hospitalId: nextHosp.id,
              hospitalName: nextHosp.name,
              sentAt: new Date().toLocaleTimeString(),
              status: 'WAITING' as const,
              note: 'Auto-escalated by Waterfall Engine to next nearest qualified hospital'
            }
          ];

          return {
            ...prev,
            currentHospitalId: nextHosp.id,
            timeoutSecondsRemaining: 120, // Reset to 2 minutes for next hop
            waterfallHistory: updatedHistory,
            messages: [
              ...prev.messages,
              {
                sender: 'HOSPITAL',
                text: `⚠️ SLA Timeout: First hospital did not respond within 120s. Request automatically escalated to ${nextHosp.name}!`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'TEXT'
              }
            ]
          };
        }

        return {
          ...prev,
          timeoutSecondsRemaining: prev.timeoutSecondsRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDispatch?.id, activeDispatch?.status, hospitals]);

  const updateHospitalBeds = (hospitalId: string, bedType: HospitalResourceType, delta: number) => {
    setHospitals(prev => {
      const updated = prev.map(h => {
        if (h.id !== hospitalId) return h;
        if (bedType === 'general') {
          return { ...h, generalBedsAvail: Math.max(0, (h.generalBedsAvail || 0) + delta) };
        }
        if (bedType === 'icu') {
          return { ...h, icuBedsAvail: Math.max(0, (h.icuBedsAvail || 0) + delta) };
        }
        if (bedType === 'maternity') {
          return { ...h, maternityBedsAvail: Math.max(0, (h.maternityBedsAvail || 0) + delta) };
        }
        if (bedType === 'ventilator') {
          return { ...h, ventilatorsAvail: Math.max(0, (h.ventilatorsAvail || 0) + delta) };
        }
        if (bedType === 'dialysis') {
          return { ...h, dialysisAvail: Math.max(0, (h.dialysisAvail || 0) + delta) };
        }
        if (bedType === 'ecg') {
          return { ...h, ecgAvail: Math.max(0, (h.ecgAvail || 0) + delta) };
        }
        if (bedType === 'ctScanner') {
          return { ...h, ctScannerAvail: Math.max(0, (h.ctScannerAvail || 0) + delta) };
        }
        if (bedType === 'defibrillator') {
          return { ...h, defibrillatorAvail: Math.max(0, (h.defibrillatorAvail || 0) + delta) };
        }
        if (bedType === 'mri') {
          return { ...h, mriAvail: Math.max(0, (h.mriAvail || 0) + delta) };
        }
        return h;
      });
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });

    setHospitalUser(prev => {
      if (!prev || prev.id !== hospitalId) return prev;
      if (bedType === 'general') {
        return { ...prev, generalBedsAvail: Math.max(0, (prev.generalBedsAvail || 0) + delta) };
      }
      if (bedType === 'icu') {
        return { ...prev, icuBedsAvail: Math.max(0, (prev.icuBedsAvail || 0) + delta) };
      }
      if (bedType === 'maternity') {
        return { ...prev, maternityBedsAvail: Math.max(0, (prev.maternityBedsAvail || 0) + delta) };
      }
      if (bedType === 'ventilator') {
        return { ...prev, ventilatorsAvail: Math.max(0, (prev.ventilatorsAvail || 0) + delta) };
      }
      if (bedType === 'dialysis') {
        return { ...prev, dialysisAvail: Math.max(0, (prev.dialysisAvail || 0) + delta) };
      }
      if (bedType === 'ecg') {
        return { ...prev, ecgAvail: Math.max(0, (prev.ecgAvail || 0) + delta) };
      }
      if (bedType === 'ctScanner') {
        return { ...prev, ctScannerAvail: Math.max(0, (prev.ctScannerAvail || 0) + delta) };
      }
      if (bedType === 'defibrillator') {
        return { ...prev, defibrillatorAvail: Math.max(0, (prev.defibrillatorAvail || 0) + delta) };
      }
      if (bedType === 'mri') {
        return { ...prev, mriAvail: Math.max(0, (prev.mriAvail || 0) + delta) };
      }
      return prev;
    });
  };

  const loginUser = (identifier: string): boolean => {
    if (identifier.trim().length > 0) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  // Blockchain Audit Logs, Consents, Network Status
  const [auditLogs, setAuditLogs] = useState<BlockchainAuditEvent[]>(() => getAuditEvents());
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>(() => getConsentGrants());
  const [blockchainNetwork] = useState<BlockchainNetworkStatus>(() => getBlockchainNetworkStatus());

  const refreshAuditLogs = useCallback(() => {
    setAuditLogs(getAuditEvents());
  }, []);

  const revokeProviderConsent = useCallback(async (providerAddress: string) => {
    const updated = await revokeConsentOnChain(providerAddress);
    setConsentGrants(updated);
    setAuditLogs(getAuditEvents());
  }, []);

  const verifyPatientRecord = useCallback(async (record: PatientRecord) => {
    const plainPayload: Record<string, any> = {
      id: record.id,
      date: record.date,
      hospitalName: record.hospitalName,
      doctorName: record.doctorName,
      diagnosis: record.diagnosis,
      medications: record.medications,
      prescriptionSummary: record.prescriptionSummary,
      clinicalAdvice: record.clinicalAdvice,
      abhaId: record.abhaId || user.healthId
    };
    if (record.labRecords && record.labRecords.length > 0) {
      plainPayload.labRecords = record.labRecords;
    }
    const plainString = JSON.stringify(plainPayload);
    const currentChecksum = await computeSHA256(plainString);
    const res = await verifyRecordOnChain({
      patientAbhaId: record.abhaId || user.healthId,
      recordId: record.id,
      currentComputedChecksum: currentChecksum
    });
    setAuditLogs(getAuditEvents());
    return res;
  }, [user.healthId]);

  const addPatientPrescription = async (record: Omit<PatientRecord, 'id'>): Promise<PatientRecord> => {
    const recordId = `rx-${Date.now()}`;
    const abhaId = record.abhaId || user.healthId;

    const plainPayload: Record<string, any> = {
      id: recordId,
      date: record.date,
      hospitalName: record.hospitalName,
      doctorName: record.doctorName,
      diagnosis: record.diagnosis,
      medications: record.medications,
      prescriptionSummary: record.prescriptionSummary,
      clinicalAdvice: record.clinicalAdvice,
      abhaId
    };
    if (record.labRecords && record.labRecords.length > 0) {
      plainPayload.labRecords = record.labRecords;
    }
    const plainString = JSON.stringify(plainPayload);
    const integrityHash = await computeSHA256(plainString);

    // 1. Client-Side Encryption with AES-GCM-256 and IPFS upload
    let ipfsCID = `bafybeih${integrityHash.slice(2, 28)}medcatalyst`;
    try {
      const encPkg = await encryptMedicalRecord(JSON.parse(plainString), abhaId);
      const ipfsRes = await uploadToIPFS(encPkg);
      ipfsCID = ipfsRes.cid;
    } catch (e) {
      console.warn('IPFS upload fallback:', e);
    }

    // 2. On-Chain Smart Contract Registration
    let txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    let blockNumber = 4182905;
    let contractAddress = NATIONAL_EHR_CONTRACT_ADDRESS;

    try {
      const chainRes = await publishRecordOnChain({
        patientAbhaId: abhaId,
        recordId,
        ipfsCID,
        integrityChecksum: integrityHash,
        hospitalName: record.hospitalName,
        doctorName: record.doctorName
      });
      txHash = chainRes.txHash;
      blockNumber = chainRes.blockNumber;
      contractAddress = chainRes.contractAddress;
    } catch (e) {
      console.warn('Blockchain registration fallback:', e);
    }

    const newRecord: PatientRecord = {
      ...record,
      id: recordId,
      blockchainTxHash: txHash,
      blockNumber,
      ipfsCID,
      integrityHash,
      isBlockchainVerified: true,
      contractAddress,
      networkName: 'Polygon Amoy',
      mintedAtTimestamp: Math.floor(Date.now() / 1000)
    };

    setUser(prev => {
      const updated: UserBioData = {
        ...prev,
        pastRecords: [newRecord, ...(prev.pastRecords || [])]
      };
      localStorage.setItem('medcatalyst_user', JSON.stringify(updated));
      return updated;
    });

    setAuditLogs(getAuditEvents());
    return newRecord;
  };

  const loginHospital = (identifier: string): boolean => {
    const clean = identifier.trim().toLowerCase().replace(/hosp/g, '').replace(/[-_ ]/g, '');
    const found = hospitals.find(h => {
      const hClean = h.id.toLowerCase().replace(/hosp/g, '').replace(/[-_ ]/g, '');
      const nameClean = h.name.toLowerCase();
      return (
        h.id.toLowerCase() === identifier.trim().toLowerCase() ||
        hClean.includes(clean) ||
        clean.includes(hClean) ||
        nameClean.includes(identifier.trim().toLowerCase())
      );
    });

    if (found) {
      setHospitalUser(found);
      setSelectedHospitalId(found.id);
      localStorage.setItem('medcatalyst_hospital_session', found.id);
      return true;
    }
    return false;
  };

  const logoutHospital = () => {
    setHospitalUser(null);
    localStorage.removeItem('medcatalyst_hospital_session');
  };

  const addDoctorToHospital = (hospitalId: string, doctorData: Omit<DoctorOnDuty, 'id'>) => {
    const newDoctor: DoctorOnDuty = {
      ...doctorData,
      id: `doc-${Date.now()}`
    };

    setHospitals(prev => {
      const updated = prev.map(h => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          doctorsOnDuty: [newDoctor, ...h.doctorsOnDuty]
        };
      });
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });

    if (hospitalUser && hospitalUser.id === hospitalId) {
      setHospitalUser(prev => prev ? {
        ...prev,
        doctorsOnDuty: [newDoctor, ...prev.doctorsOnDuty]
      } : null);
    }
  };

  const updateDoctorStatus = (
    hospitalId: string, 
    doctorId: string, 
    statusUpdate: { available: boolean; statusDetail: DoctorOnDuty['statusDetail'] }
  ) => {
    setHospitals(prev => {
      const updated = prev.map(h => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          doctorsOnDuty: h.doctorsOnDuty.map(doc => {
            if (doc.id !== doctorId) return doc;
            return {
              ...doc,
              available: statusUpdate.available,
              statusDetail: statusUpdate.statusDetail
            };
          })
        };
      });
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });

    if (hospitalUser && hospitalUser.id === hospitalId) {
      setHospitalUser(prev => prev ? {
        ...prev,
        doctorsOnDuty: prev.doctorsOnDuty.map(doc => {
          if (doc.id !== doctorId) return doc;
          return {
            ...doc,
            available: statusUpdate.available,
            statusDetail: statusUpdate.statusDetail
          };
        })
      } : null);
    }
  };

  const removeDoctorFromHospital = (hospitalId: string, doctorId: string) => {
    setHospitals(prev => {
      const updated = prev.map(h => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          doctorsOnDuty: h.doctorsOnDuty.filter(d => d.id !== doctorId)
        };
      });
      localStorage.setItem('medcatalyst_hospitals', JSON.stringify(updated));
      return updated;
    });

    if (hospitalUser && hospitalUser.id === hospitalId) {
      setHospitalUser(prev => prev ? {
        ...prev,
        doctorsOnDuty: prev.doctorsOnDuty.filter(d => d.id !== doctorId)
      } : null);
    }
  };

  const updateAmbulanceStatus = (ambulanceId: string, status: Ambulance['status']) => {
    setAmbulances(prev => prev.map(a => a.id === ambulanceId ? { ...a, status } : a));
  };

  const createEmergencyDispatch = (issueText: string, voiceTranscript?: string, urgency: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'CRITICAL') => {
    const pickupLat = userLocation?.lat ?? 28.7080;
    const pickupLng = userLocation?.lng ?? 77.0980;

    // 1. NEAREST AMBULANCE FIRST ARCHITECTURE:
    // Compute spherical distance (Haversine) from patient's GPS coordinates to ALL available fleet ambulances
    const availablePool = ambulances.filter(a => a.status === 'AVAILABLE');
    const fleet = availablePool.length > 0 ? availablePool : ambulances;

    const rankedAmbulances = fleet.map(amb => {
      // Haversine distance in kilometers
      const R = 6371;
      const dLat = (amb.currentLat - pickupLat) * (Math.PI / 180);
      const dLon = (amb.currentLng - pickupLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickupLat * (Math.PI / 180)) * Math.cos(amb.currentLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c * 10) / 10;
      const calculatedEta = Math.max(2, Math.round(dist * 2.2));
      return { ...amb, distanceKm: dist, calculatedEta };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    // Physically closest vehicle to the patient
    const nearestAmb = rankedAmbulances[0];

    // Immediately dispatch the closest ambulance to minimize critical pickup wait time
    updateAmbulanceStatus(nearestAmb.id, 'DISPATCHED');
    try {
      sessionStorage.removeItem('medcatalyst_dispatch_cancelled');
    } catch (e) {}

    // 2. Nearest hospital contacted in parallel for emergency bed reservation
    const nearestHosp = hospitals[0];

    const newDispatch: EmergencyDispatch = {
      id: `disp-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      callerName: user.fullName || 'Rameshwar Singh',
      callerPhone: user.phone || '+91 98765 43210',
      callerVoiceTranscript: voiceTranscript || issueText,
      callerIssue: issueText,
      urgencyLevel: urgency,
      pickupAddress: user.address,
      pickupLat,
      pickupLng,
      createdAt: new Date().toLocaleTimeString(),
      status: 'AMBULANCE_EN_ROUTE',
      currentHospitalId: nearestHosp.id,
      assignedAmbulanceId: nearestAmb.id,
      currentStep: 2, // Step 2: Ambulance Assigned & En Route immediately!
      patientCount: 1,
      timeoutSecondsRemaining: 120, // 2 minutes SLA for hospital bed confirmation
      waterfallHistory: [
        {
          hospitalId: nearestHosp.id,
          hospitalName: nearestHosp.name,
          sentAt: new Date().toLocaleTimeString(),
          status: 'WAITING',
          note: `Nearest Ambulance ${nearestAmb.vehicleNumber} (${nearestAmb.distanceKm} km away, ETA ~${nearestAmb.calculatedEta}m) dispatched from ${nearestAmb.hospitalName}. Awaiting bed confirmation.`
        }
      ],
      vitals: {
        ...ambulanceAssessment,
        patientDataTransferred: true,
        patientData: {
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
          transferredAt: 'Auto-Transferred from EHR Registry'
        }
      },
      ambulanceAssessment: {
        ...ambulanceAssessment,
        patientDataTransferred: true,
        patientData: {
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
          transferredAt: 'Auto-Transferred from EHR Registry'
        }
      },
      messages: [
        {
          sender: 'CITIZEN',
          text: voiceTranscript ? `Voice SOS: "${voiceTranscript}"` : issueText,
          timestamp: new Date().toLocaleTimeString(),
          type: voiceTranscript ? 'VOICE' : 'TEXT'
        },
        {
          sender: 'PARAMEDIC',
          text: `🚨 Closest Ambulance ${nearestAmb.vehicleNumber} (${nearestAmb.type}) dispatched immediately! Current distance: ${nearestAmb.distanceKm} km, ETA: ~${nearestAmb.calculatedEta} mins. Driver: ${nearestAmb.driverName} (${nearestAmb.driverPhone}). Heading to pickup point now.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'TEXT'
        }
      ]
    };

    setActiveDispatch(newDispatch);
  };

  const acceptDispatchByHospital = (hospitalId: string) => {
    if (!activeDispatch) return;

    // Retain the already dispatched nearest ambulance
    const assignedAmb = ambulances.find(a => a.id === activeDispatch.assignedAmbulanceId) || ambulances[0];
    const hospital = hospitals.find(h => h.id === hospitalId);

    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'ACCEPTED',
        currentStep: 4, // Step 4: Hospital Accepted
        currentHospitalId: hospitalId,
        waterfallHistory: prev.waterfallHistory.map(hop => 
          hop.hospitalId === hospitalId ? { 
            ...hop, 
            status: 'ACCEPTED', 
            responseTimeSeconds: 120 - prev.timeoutSecondsRemaining,
            note: `${hospital?.name} confirmed bed availability and approved patient intake.` 
          } : hop
        ),
        messages: [
          ...prev.messages,
          {
            sender: 'HOSPITAL',
            text: `✅ Dispatch Intake Accepted by ${hospital?.name || 'Hospital'}. Trauma team and emergency bay standing by!`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'TEXT'
          }
        ]
      };
    });

    updateAmbulanceStatus(assignedAmb.id, 'DISPATCHED');
  };

  const declineOrTimeoutDispatch = (hospitalId: string, reason: string) => {
    if (!activeDispatch) return;

    const currentHospIndex = hospitals.findIndex(h => h.id === hospitalId);
    const nextHosp = hospitals[(currentHospIndex + 1) % hospitals.length];

    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentHospitalId: nextHosp.id,
        timeoutSecondsRemaining: 120,
        waterfallHistory: [
          ...prev.waterfallHistory.map(hop => 
            hop.hospitalId === hospitalId ? { ...hop, status: 'DECLINED' as const, note: `Declined: ${reason}` } : hop
          ),
          {
            hospitalId: nextHosp.id,
            hospitalName: nextHosp.name,
            sentAt: new Date().toLocaleTimeString(),
            status: 'WAITING' as const,
            note: 'Cascaded via Waterfall Engine to next facility'
          }
        ],
        messages: [
          ...prev.messages,
          {
            sender: 'HOSPITAL',
            text: `⚠️ Request declined by ${hospitals.find(h => h.id === hospitalId)?.name} (${reason}). Cascading immediately to ${nextHosp.name}...`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'TEXT'
          }
        ]
      };
    });
  };

  const cancelDispatch = () => {
    try {
      sessionStorage.setItem('medcatalyst_dispatch_cancelled', 'true');
      localStorage.removeItem('medcatalyst_active_dispatch');
      localStorage.removeItem('sanjeevani_active_dispatch');
    } catch (e) {}
    setActiveDispatch(null);
    setLiveAmbulance(null);
  };

  const updateDispatchStep = (step: number) => {
    setActiveDispatch(prev => {
      if (!prev) return null;
      let newStatus: EmergencyDispatch['status'] = prev.status;
      if (step === 1) newStatus = 'PENDING_HOSPITAL_ACCEPT';
      else if (step === 2) newStatus = 'AMBULANCE_EN_ROUTE'; // Nearest Ambulance Assigned & Dispatched
      else if (step === 3) newStatus = 'PENDING_HOSPITAL_ACCEPT'; // Hospitals Contacted
      else if (step === 4) newStatus = 'ACCEPTED'; // Hospital Accepted
      else if (step >= 5 && step <= 7) newStatus = 'PATIENT_ONBOARD';
      else if (step >= 8) newStatus = 'ARRIVED';

      return {
        ...prev,
        currentStep: step,
        status: newStatus
      };
    });
  };

  const sendDispatchMessage = (sender: 'CITIZEN' | 'HOSPITAL' | 'PARAMEDIC', text: string) => {
    if (!activeDispatch) return;
    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          { sender, text, timestamp: new Date().toLocaleTimeString() }
        ]
      };
    });
  };

  const updateAmbulanceAssessment = (partial: Partial<AmbulanceAssessmentForm>) => {
    const nextForm = { ...ambulanceAssessment, ...partial };
    setAmbulanceAssessment(nextForm);

    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ambulanceAssessment: nextForm,
        vitals: nextForm
      };
    });
  };

  const updateVitals = updateAmbulanceAssessment;

  const uploadAmbulanceAssessment = (formToUpload?: AmbulanceAssessmentForm) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nextForm: AmbulanceAssessmentForm = {
      ...(formToUpload || ambulanceAssessment),
      isUploaded: true,
      uploadedAt: timeStr,
      uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)'
    };
    setAmbulanceAssessment(nextForm);

    const prediction = evaluateAmbulanceAssessment(nextForm);
    const targetHosp = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospitals[0];
    const match = checkHospitalCapabilities(targetHosp, prediction.requiredCapabilities, hospitals);

    setActiveDispatch(prev => {
      if (!prev) return null;

      if (!match.canHandle && match.recommendedHospital) {
        const newHosp = match.recommendedHospital;
        setGreenCorridorActive(true);
        return {
          ...prev,
          ambulanceAssessment: nextForm,
          vitals: nextForm,
          mlAcuity: prediction.acuity,
          mlRequiredCapabilities: prediction.requiredCapabilities,
          currentHospitalId: newHosp.id,
          status: 'REROUTED',
          rerouteAlert: {
            triggered: true,
            reason: match.rerouteReason || `Critical capability deficit: ${match.mismatches.join(', ')}`,
            originalHospitalId: targetHosp.id,
            originalHospitalName: targetHosp.name,
            newHospitalId: newHosp.id,
            newHospitalName: newHosp.name,
            timestamp: timeStr
          },
          messages: [
            ...prev.messages,
            {
              sender: 'PARAMEDIC',
              text: `📋 In-Ambulance Assessment Form Uploaded: BP ${nextForm.systolic_bp}/${nextForm.diastolic_bp}, HR ${nextForm.heart_rate} bpm, SpO2 ${nextForm.spo2}%, GCS ${nextForm.gcs}/15. Acuity: ${prediction.acuity}.`,
              timestamp: timeStr
            },
            {
              sender: 'PARAMEDIC',
              text: `🚨 AI DYNAMIC REROUTE TRIGGERED: Primary facility ${targetHosp.name} lacks ${match.mismatches.join('; ')}. Diverting ambulance to ${newHosp.name} (+${newHosp.etaMinutes} mins, equipped with 24/7 ICU & specialized care). Traffic Police Green Corridor requested!`,
              timestamp: timeStr
            }
          ]
        };
      } else {
        return {
          ...prev,
          ambulanceAssessment: nextForm,
          vitals: nextForm,
          mlAcuity: prediction.acuity,
          mlRequiredCapabilities: prediction.requiredCapabilities,
          messages: [
            ...prev.messages,
            {
              sender: 'PARAMEDIC',
              text: `📋 In-Ambulance Assessment Form Uploaded: BP ${nextForm.systolic_bp}/${nextForm.diastolic_bp}, HR ${nextForm.heart_rate} bpm, SpO2 ${nextForm.spo2}%, GCS ${nextForm.gcs}/15. Facility ${targetHosp.name} confirmed compatible.`,
              timestamp: timeStr
            }
          ]
        };
      }
    });
  };

  const executeDynamicReroute = () => {
    if (!activeDispatch) return;
    const targetHosp = hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[0];
    const prediction = evaluateAmbulanceAssessment(ambulanceAssessment);
    const match = checkHospitalCapabilities(targetHosp, prediction.requiredCapabilities, hospitals);

    if (match.recommendedHospital) {
      const newHosp = match.recommendedHospital;
      setActiveDispatch(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentHospitalId: newHosp.id,
          status: 'REROUTED',
          rerouteAlert: {
            triggered: true,
            reason: match.rerouteReason || 'Critical capability deficit at primary facility',
            originalHospitalId: targetHosp.id,
            originalHospitalName: targetHosp.name,
            newHospitalId: newHosp.id,
            newHospitalName: newHosp.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          messages: [
            ...prev.messages,
            {
              sender: 'PARAMEDIC',
              text: `🚨 MEDCATALYST REROUTE ENACTED: Diverting from ${targetHosp.name} to ${newHosp.name}. Reasons: ${match.mismatches.join('; ')}. Reserving Trauma ICU & Cath Lab!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      });

      // Automatically activate Traffic Green Corridor for this reroute!
      setGreenCorridorActive(true);
    }
  };

  const transferPatientDataToAssessment = (customUser?: UserBioData) => {
    const targetUser = customUser || user;
    const transferred: TransferredPatientData = {
      patientId: targetUser.id,
      fullName: targetUser.fullName,
      healthId: targetUser.healthId,
      bloodGroup: targetUser.bloodGroup,
      age: targetUser.age,
      gender: targetUser.gender,
      address: targetUser.address,
      emergencyContacts: targetUser.emergencyContacts,
      allergies: targetUser.allergies,
      chronicConditions: targetUser.chronicConditions,
      currentMedications: targetUser.currentMedications,
      pastRecordsSummary: (targetUser.pastRecords || []).map(r => `${r.date} (${r.hospitalName}): ${r.diagnosis}`),
      transferredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Auto-Transferred from ABHA / EHR Registry)'
    };

    updateAmbulanceAssessment({
      age: targetUser.age,
      patientDataTransferred: true,
      patientData: transferred
    });
  };

  const loadPresetScenario = (scenario: 'BIKE_HEAD_TRAUMA' | 'ACUTE_STEMI_HEART' | 'MILD_FEVER_CLINIC' | 'STROKE_FAST' | 'PREGNANCY_EMERGENCY') => {
    const transferred: TransferredPatientData = {
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
      transferredAt: 'Auto-Transferred from ABHA Network'
    };

    if (scenario === 'BIKE_HEAD_TRAUMA') {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 52,
        is_pediatric: 0,
        heart_rate: 128,
        systolic_bp: 82,
        diastolic_bp: 52,
        spo2: 88,
        resp_rate: 28,
        body_temp: 36.4,
        blood_glucose: 125,
        consciousnessLevel: 'PAIN',
        gcs: 7, // Comatose / severe traumatic brain injury
        ecg_stemi: 0,
        trauma: 1,
        fast_score: 0,
        symptoms: ['MAJOR_TRAUMA', 'SEVERE_BLEEDING', 'LOSS_OF_CONSCIOUSNESS'],
        strokeSymptoms: {
          facialDrooping: false,
          armWeakness: false,
          speechDifficulty: false
        },
        patientDataTransferred: true,
        patientData: transferred,
        paramedicNotes: 'Severe road crash, high impact head strike without helmet. Unconscious, bleeding from cranial scalp.',
        uploadedAt: undefined,
        uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)',
        isUploaded: false
      };
      setAmbulanceAssessment(scenarioForm);
      updateAmbulanceAssessment(scenarioForm);
    } else if (scenario === 'ACUTE_STEMI_HEART') {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 58,
        is_pediatric: 0,
        heart_rate: 118,
        systolic_bp: 92,
        diastolic_bp: 62,
        spo2: 92,
        resp_rate: 24,
        body_temp: 36.7,
        blood_glucose: 145,
        consciousnessLevel: 'ALERT',
        gcs: 14,
        ecg_stemi: 1, // ST-Elevation Myocardial Infarction
        trauma: 0,
        fast_score: 0,
        symptoms: ['CHEST_PAIN', 'DIFFICULTY_BREATHING'],
        strokeSymptoms: {
          facialDrooping: false,
          armWeakness: false,
          speechDifficulty: false
        },
        patientDataTransferred: true,
        patientData: transferred,
        paramedicNotes: 'Sudden severe retrosternal squeezing chest pain radiating to left jaw and arm. Diaphoretic and pale.',
        uploadedAt: undefined,
        uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)',
        isUploaded: false
      };
      setAmbulanceAssessment(scenarioForm);
      updateAmbulanceAssessment(scenarioForm);
    } else if (scenario === 'STROKE_FAST') {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 64,
        is_pediatric: 0,
        heart_rate: 96,
        systolic_bp: 178,
        diastolic_bp: 104,
        spo2: 94,
        resp_rate: 20,
        body_temp: 36.9,
        blood_glucose: 132,
        consciousnessLevel: 'VOICE',
        gcs: 12,
        ecg_stemi: 0,
        trauma: 0,
        fast_score: 3,
        symptoms: ['STROKE_LIKE'],
        strokeSymptoms: {
          facialDrooping: true,
          armWeakness: true,
          speechDifficulty: true
        },
        patientDataTransferred: true,
        patientData: transferred,
        paramedicNotes: 'Acute onset right-sided hemiparesis, facial asymmetry, and expressive aphasia within last 45 minutes.',
        uploadedAt: undefined,
        uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)',
        isUploaded: false
      };
      setAmbulanceAssessment(scenarioForm);
      updateAmbulanceAssessment(scenarioForm);
    } else if (scenario === 'PREGNANCY_EMERGENCY') {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 27,
        is_pediatric: 0,
        heart_rate: 112,
        systolic_bp: 154,
        diastolic_bp: 98,
        spo2: 96,
        resp_rate: 22,
        body_temp: 37.2,
        blood_glucose: 104,
        consciousnessLevel: 'ALERT',
        gcs: 15,
        ecg_stemi: 0,
        trauma: 0,
        fast_score: 0,
        symptoms: ['PREGNANCY_RELATED', 'SEVERE_ABDOMINAL_PAIN', 'SEVERE_BLEEDING'],
        strokeSymptoms: {
          facialDrooping: false,
          armWeakness: false,
          speechDifficulty: false
        },
        patientDataTransferred: true,
        patientData: {
          ...transferred,
          age: 27,
          gender: 'Female',
          fullName: 'Meena Devi',
          healthId: '91-4402-9918-3410'
        },
        paramedicNotes: 'Gravida 2, 34 weeks gestation with severe lower abdominal cramping, active bleeding, and pre-eclamptic elevated BP.',
        uploadedAt: undefined,
        uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)',
        isUploaded: false
      };
      setAmbulanceAssessment(scenarioForm);
      updateAmbulanceAssessment(scenarioForm);
    } else {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 26,
        is_pediatric: 0,
        heart_rate: 76,
        systolic_bp: 120,
        diastolic_bp: 78,
        spo2: 99,
        resp_rate: 16,
        body_temp: 37.1,
        blood_glucose: 98,
        consciousnessLevel: 'ALERT',
        gcs: 15,
        ecg_stemi: 0,
        trauma: 0,
        fast_score: 0,
        symptoms: [],
        strokeSymptoms: {
          facialDrooping: false,
          armWeakness: false,
          speechDifficulty: false
        },
        patientDataTransferred: true,
        patientData: transferred,
        paramedicNotes: 'Patient conscious, alert and oriented x4. Low-grade fever with mild dehydration. Stable vital parameters.',
        uploadedAt: undefined,
        uploadedBy: 'Ambulance Crew (Unit HR-10-EM-1081)',
        isUploaded: false
      };
      setAmbulanceAssessment(scenarioForm);
      updateAmbulanceAssessment(scenarioForm);
    }
  };

  const addWorkerReport = (report: Omit<PublicWorkerReport, 'id' | 'timestamp'>) => {
    const newReport: PublicWorkerReport = {
      ...report,
      id: `rep-${Date.now()}`,
      timestamp: 'Just now'
    };
    setWorkerReports(prev => [newReport, ...prev]);
  };

  const clearTrafficJunction = (junctionName: string) => {
    if (!clearedJunctions.includes(junctionName)) {
      setClearedJunctions(prev => [...prev, junctionName]);
    }
  };

  // Traffic Corridor Signal Actions
  const overrideSignal = (signalId: string, lightState: SignalLightState) => {
    const status: SignalCorridorStatus =
      lightState === 'EMERGENCY_OVERRIDE' || lightState === 'GREEN' ? 'PREEMPTED_GREEN' : 'NOTIFIED';

    setSignalOverrides(prev => ({
      ...prev,
      [signalId]: { lightState, status },
    }));

    setTrafficCorridor(prev => ({
      ...prev,
      signals: prev.signals.map(s =>
        s.id === signalId ? { ...s, lightState, status } : s
      ),
    }));
  };

  const confirmSignalCleared = (signalId: string) => {
    setSignalOverrides(prev => ({
      ...prev,
      [signalId]: { lightState: 'GREEN', status: 'CLEARED' },
    }));

    setTrafficCorridor(prev => ({
      ...prev,
      signals: prev.signals.map(s =>
        s.id === signalId
          ? {
              ...s,
              lightState: 'GREEN',
              status: 'CLEARED',
              clearedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : s
      ),
    }));
  };

  const toggleSimulation = (forcePlay?: boolean) => {
    setTrafficCorridor(prev => {
      const willPlay = forcePlay !== undefined ? forcePlay : !prev.isSimulating;
      const progress = willPlay && prev.simulationProgress >= 1.0 ? 0 : prev.simulationProgress;
      return {
        ...prev,
        isSimulating: willPlay,
        simulationProgress: progress,
      };
    });
  };

  const setSimulationSpeed = (multiplier: number) => {
    setTrafficCorridor(prev => ({
      ...prev,
      simulationSpeedMultiplier: multiplier,
    }));
  };

  const resetSimulation = () => {
    setSignalOverrides({});
    const initial = createInitialTrafficEmergency();
    setTrafficCorridor({
      ...initial,
      simulationSpeedMultiplier: trafficCorridor.simulationSpeedMultiplier,
    });
  };

  const setSimulationProgressManual = (progress: number) => {
    const nextProgress = Math.max(0, Math.min(1, progress));
    const { signals, currentAmbulancePos, totalRouteKm } = identifyRouteSignals(
      trafficCorridor.routeCoordinates,
      nextProgress,
      trafficCorridor.speedKmH,
      signalOverrides,
      trafficCorridor.automatedGreenWave
    );
    const remainingKm = Math.max(0, totalRouteKm * (1 - nextProgress));
    const totalEtaMinutes = Math.max(1, Math.round((remainingKm / trafficCorridor.speedKmH) * 60));

    setTrafficCorridor(prev => ({
      ...prev,
      simulationProgress: nextProgress,
      currentLat: currentAmbulancePos[0],
      currentLng: currentAmbulancePos[1],
      totalEtaMinutes,
      signals,
    }));
  };


  const loginPoliceSignal = (signalIdOrCode: string): boolean => {
    const normalized = signalIdOrCode.trim().toUpperCase();
    const found = trafficCorridor.signals.find(
      s => s.id.toUpperCase() === normalized || s.junctionCode.toUpperCase() === normalized
    );

    if (found) {
      setPoliceUserSignal(found);
      localStorage.setItem('medcatalyst_police_signal', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logoutPoliceSignal = () => {
    setPoliceUserSignal(null);
    localStorage.removeItem('medcatalyst_police_signal');
  };

  const contextValue = useMemo(() => ({
      hospitals,
      updateHospitalBeds,
      selectedHospitalId,
      setSelectedHospitalId,
      hospitalUser,
      loginHospital,
      logoutHospital,
      addDoctorToHospital,
      updateDoctorStatus,
      removeDoctorFromHospital,
      user,
      isLoggedIn,
      setIsLoggedIn,
      loginUser,
      addPatientPrescription,
      ambulances,
      ambulanceUser,
      loginAmbulance,
      logoutAmbulance,
      updateAmbulanceStatus,
      activeDispatch,
      createEmergencyDispatch,
      acceptDispatchByHospital,
      declineOrTimeoutDispatch,
      cancelDispatch,
      updateDispatchStep,
      sendDispatchMessage,
      ambulanceAssessment,
      vitals: ambulanceAssessment,
      updateAmbulanceAssessment,
      updateVitals: updateAmbulanceAssessment,
      uploadAmbulanceAssessment,
      executeDynamicReroute,
      loadPresetScenario,
      transferPatientDataToAssessment,
      workerReports,
      addWorkerReport,
      greenCorridorActive,
      setGreenCorridorActive,
      clearTrafficJunction,
      clearedJunctions,
      trafficCorridor,
      overrideSignal,
      confirmSignalCleared,
      toggleSimulation,
      setSimulationSpeed,
      resetSimulation,
      setSimulationProgressManual,
      policeUserSignal,
      loginPoliceSignal,
      logoutPoliceSignal,
      userLocation,
      relocateToUserLocation,
      liveAmbulance,
      verifyPatientRecord,
      auditLogs,
      refreshAuditLogs,
      consentGrants,
      revokeProviderConsent,
      blockchainNetwork,
      appointments,
      doctorQueues,
      bookAppointment,
      initiateInstantConsultation,
      updateAppointmentStatus,
      callNextQueuePatient,
      startPatientConsultation,
      endPatientConsultation,
      markPatientNoShow,
      cancelQueueAppointment,
      doctorUser,
      loginDoctor,
      logoutDoctor,
      toggleDoctorTeleConsultStatus,
      updateDoctorScheduleSettings,
      submitDoctorReview
    }), [
      hospitals,
      selectedHospitalId,
      hospitalUser,
      user,
      isLoggedIn,
      ambulances,
      ambulanceUser,
      activeDispatch,
      ambulanceAssessment,
      workerReports,
      greenCorridorActive,
      clearedJunctions,
      trafficCorridor,
      policeUserSignal,
      userLocation,
      liveAmbulance,
      relocateToUserLocation,
      verifyPatientRecord,
      auditLogs,
      refreshAuditLogs,
      consentGrants,
      revokeProviderConsent,
      blockchainNetwork,
      appointments,
      doctorQueues,
      doctorUser
    ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
