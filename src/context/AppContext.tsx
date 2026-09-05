import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  TrafficCorridorEmergency,
  TrafficSignal,
  SignalLightState,
  SignalCorridorStatus
} from '../types';
import { evaluateAmbulanceAssessment, evaluateAmbulanceTelemetry, checkHospitalCapabilities } from '../utils/mlTriage';
import { 
  createInitialTrafficEmergency, 
  identifyRouteSignals 
} from '../utils/trafficCorridor';

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

  // Citizen Bio-Data & Digital Health Records
  user: UserBioData;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  loginUser: (identifier: string) => boolean;
  addPatientPrescription: (record: Omit<PatientRecord, 'id'>) => void;

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
  loadPresetScenario: (scenario: 'BIKE_HEAD_TRAUMA' | 'ACUTE_STEMI_HEART' | 'MILD_FEVER_CLINIC') => void;

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
}

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
      prescriptionSummary: 'Strictly avoided Penicillins due to recorded allergy. Treated with Ciprofloxacin + Clindamycin. Ulcer debrided successfully.'
    },
    {
      id: 'rec-2',
      date: '22 Jan 2026',
      hospitalName: 'Bilaspur Community Health Center',
      diagnosis: 'Hypertensive Urgency (BP 170/105 mmHg)',
      doctorName: 'Dr. Rajesh Mehta',
      prescriptionSummary: 'Adjusted Telmisartan from 20mg to 40mg. ECG showed left ventricular hypertrophy, no acute ischemia at the time.'
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
  gcs: 8, // Severe head injury / comatose threshold
  body_temp: 36.5,
  ecg_stemi: 0,
  trauma: 1, // Polytrauma bike crash
  fast_score: 0,
  blood_glucose: 128,
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

  const h1Lat = Math.round((baseLat + 0.0090) * 10000) / 10000;
  const h1Lng = Math.round((baseLng + 0.0075) * 10000) / 10000;
  const h1Dist = calculateHaversineKm(baseLat, baseLng, h1Lat, h1Lng);

  const h2Lat = Math.round((baseLat - 0.0160) * 10000) / 10000;
  const h2Lng = Math.round((baseLng + 0.0150) * 10000) / 10000;
  const h2Dist = calculateHaversineKm(baseLat, baseLng, h2Lat, h2Lng);

  const h3Lat = Math.round((baseLat + 0.0270) * 10000) / 10000;
  const h3Lng = Math.round((baseLng - 0.0230) * 10000) / 10000;
  const h3Dist = calculateHaversineKm(baseLat, baseLng, h3Lat, h3Lng);

  const h4Lat = Math.round((baseLat - 0.0410) * 10000) / 10000;
  const h4Lng = Math.round((baseLng + 0.0360) * 10000) / 10000;
  const h4Dist = calculateHaversineKm(baseLat, baseLng, h4Lat, h4Lng);

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
      id: 'hosp-sonipat-district',
      name: `${areaName} District Civil Hospital & Trauma Unit`,
      address: `Civil Lines Road, ${areaName}`,
      lat: h3Lat,
      lng: h3Lng,
      distanceKm: h3Dist,
      etaMinutes: Math.max(6, Math.round(h3Dist * 2.2)),
    },
    {
      ...t3,
      id: 'hosp-apex-multispecialty',
      name: `Apex MedCatalyst Multi-Specialty & Level-1 Trauma Center (${areaName})`,
      address: `Super Highway Ring Road, ${areaName}`,
      lat: h4Lat,
      lng: h4Lng,
      distanceKm: h4Dist,
      etaMinutes: Math.max(10, Math.round(h4Dist * 2.2)),
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Pre-authenticated for seamless hackathon testing

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
    const saved = localStorage.getItem('medcatalyst_active_dispatch') || localStorage.getItem('sanjeevani_active_dispatch');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id === 'disp-2026-9041') {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default active dispatch matching live incident:
    return {
      id: 'disp-2026-9041',
      callerName: 'Rameshwar Singh',
      callerPhone: '+91 98765 43210',
      callerVoiceTranscript: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
      callerIssue: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
      urgencyLevel: 'CRITICAL',
      patientCount: 1,
      currentStep: 4,
      pickupAddress: 'Near Milestone 34, Old GT Road, Rampur Outskirts',
      pickupLat: 28.7080,
      pickupLng: 77.0980,
      createdAt: new Date().toLocaleTimeString(),
      status: 'ACCEPTED',
      currentHospitalId: 'hosp-rampur-phc',
      assignedAmbulanceId: 'amb-01',
      timeoutSecondsRemaining: 92,
      waterfallHistory: [
        {
          hospitalId: 'hosp-rampur-phc',
          hospitalName: 'Rampur Primary Health Center (PHC)',
          sentAt: '01:31 AM',
          status: 'ACCEPTED',
          responseTimeSeconds: 28,
          note: 'Nearest Ambulance HR-10-EM-1081 (0.4 km away) dispatched first; Rampur PHC confirmed trauma intake'
        }
      ],
      ambulanceAssessment: INITIAL_ASSESSMENT,
      vitals: INITIAL_ASSESSMENT,
      mlAcuity: 'ESI-1',
      mlRequiredCapabilities: ['NEURO_SURGERY_ICU', 'TRAUMA_OT', 'MECHANICAL_VENTILATOR'],
      messages: [
        { sender: 'CITIZEN', text: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness. Please hurry!', timestamp: '01:31 AM', type: 'VOICE' },
        { sender: 'PARAMEDIC', text: '🚨 Nearest Ambulance HR-10-EM-1081 (0.4 km away, ETA 2 mins) dispatched immediately to your coordinates! Driver: Jagdish Kumar.', timestamp: '01:31 AM', type: 'TEXT' },
        { sender: 'HOSPITAL', text: 'Rampur PHC confirmed bed readiness. Trauma OT and Dr. Kavita Sharma alerted.', timestamp: '01:32 AM', type: 'TEXT' },
        { sender: 'PARAMEDIC', text: 'Patient onboard. Vitals recorded in in-ambulance assessment form: GCS 8, SpO2 89%.', timestamp: '01:35 AM', type: 'TEXT' }
      ]
    };
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

    // In background, reverse-geocode to get real city / neighborhood name
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
          .catch(() => {});
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

  // Keep logged-in police signal in sync with live corridor progress
  useEffect(() => {
    if (!policeUserSignal) return;
    const current = trafficCorridor.signals.find(s => s.id === policeUserSignal.id);
    if (current && (current.etaMinutes !== policeUserSignal.etaMinutes || current.distanceKm !== policeUserSignal.distanceKm || current.status !== policeUserSignal.status)) {
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
    if (!activeDispatch || activeDispatch.status !== 'PENDING_HOSPITAL_ACCEPT') return;

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
  }, [activeDispatch, hospitals]);

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

  const addPatientPrescription = (record: Omit<PatientRecord, 'id'>) => {
    const newRecord: PatientRecord = {
      ...record,
      id: `rx-${Date.now()}`
    };

    setUser(prev => {
      const updated: UserBioData = {
        ...prev,
        pastRecords: [newRecord, ...(prev.pastRecords || [])]
      };
      localStorage.setItem('medcatalyst_user', JSON.stringify(updated));
      return updated;
    });
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
    const pickupLat = 28.7080;
    const pickupLng = 77.0980;

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

    // 2. Nearest hospital contacted in parallel for emergency bed reservation
    const nearestHosp = hospitals[0];

    const newDispatch: EmergencyDispatch = {
      id: issueText.includes('bike') ? 'disp-2026-9041' : `disp-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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
      vitals,
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
    setActiveDispatch({
      id: 'disp-2026-9041',
      callerName: 'Rameshwar Singh',
      callerPhone: '+91 98765 43210',
      callerVoiceTranscript: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
      callerIssue: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
      urgencyLevel: 'CRITICAL',
      patientCount: 1,
      currentStep: 1,
      pickupAddress: 'Near Milestone 34, Old GT Road, Rampur Outskirts',
      pickupLat: 28.7080,
      pickupLng: 77.0980,
      createdAt: new Date().toLocaleTimeString(),
      status: 'PENDING_HOSPITAL_ACCEPT',
      currentHospitalId: 'hosp-rampur-phc',
      assignedAmbulanceId: 'amb-01',
      timeoutSecondsRemaining: 120,
      waterfallHistory: [
        {
          hospitalId: 'hosp-rampur-phc',
          hospitalName: 'Rampur Primary Health Center (PHC)',
          sentAt: new Date().toLocaleTimeString(),
          status: 'WAITING',
          note: 'Emergency broadcast triggered with patient GPS coordinates'
        }
      ],
      vitals: INITIAL_VITALS,
      mlAcuity: 'ESI-1',
      mlRequiredCapabilities: ['NEURO_SURGERY_ICU', 'TRAUMA_OT', 'MECHANICAL_VENTILATOR'],
      messages: [
        { sender: 'CITIZEN', text: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness. Please hurry!', timestamp: new Date().toLocaleTimeString(), type: 'VOICE' }
      ]
    });
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

  const loadPresetScenario = (scenario: 'BIKE_HEAD_TRAUMA' | 'ACUTE_STEMI_HEART' | 'MILD_FEVER_CLINIC') => {
    if (scenario === 'BIKE_HEAD_TRAUMA') {
      const scenarioForm: AmbulanceAssessmentForm = {
        age: 52,
        is_pediatric: 0,
        heart_rate: 128,
        systolic_bp: 82,
        diastolic_bp: 52,
        spo2: 88,
        resp_rate: 28,
        gcs: 7, // Comatose / severe traumatic brain injury
        body_temp: 36.4,
        ecg_stemi: 0,
        trauma: 1,
        fast_score: 0,
        blood_glucose: 125,
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
        gcs: 14,
        body_temp: 36.7,
        ecg_stemi: 1, // ST-Elevation Myocardial Infarction
        trauma: 0,
        fast_score: 0,
        blood_glucose: 145,
        paramedicNotes: 'Sudden severe retrosternal squeezing chest pain radiating to left jaw and arm. Diaphoretic and pale.',
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
        gcs: 15,
        body_temp: 37.1,
        ecg_stemi: 0,
        trauma: 0,
        fast_score: 0,
        blood_glucose: 98,
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

  return (
    <AppContext.Provider value={{
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
      relocateToUserLocation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
