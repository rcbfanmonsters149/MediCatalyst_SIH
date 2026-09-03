import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Hospital, 
  UserBioData, 
  Ambulance, 
  EmergencyDispatch, 
  PublicWorkerReport, 
  TelemetryVitals, 
  WaterfallHop,
  DoctorOnDuty
} from '../types';
import { evaluateAmbulanceTelemetry, checkHospitalCapabilities } from '../utils/mlTriage';

interface AppContextType {
  // Hospitals
  hospitals: Hospital[];
  updateHospitalBeds: (hospitalId: string, bedType: 'general' | 'icu' | 'maternity' | 'ventilator', delta: number) => void;
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;

  // Hospital Authentication & Doctor Management
  hospitalUser: Hospital | null;
  loginHospital: (hospitalIdOrCode: string) => boolean;
  logoutHospital: () => void;
  addDoctorToHospital: (hospitalId: string, doctor: Omit<DoctorOnDuty, 'id'>) => void;
  updateDoctorStatus: (hospitalId: string, doctorId: string, status: { available: boolean; statusDetail: DoctorOnDuty['statusDetail'] }) => void;
  removeDoctorFromHospital: (hospitalId: string, doctorId: string) => void;

  // Citizen Bio-Data
  user: UserBioData;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  loginUser: (identifier: string) => boolean;

  // Ambulances
  ambulances: Ambulance[];
  updateAmbulanceStatus: (ambulanceId: string, status: Ambulance['status']) => void;

  // Emergency Dispatch Engine
  activeDispatch: EmergencyDispatch | null;
  createEmergencyDispatch: (issueText: string, voiceTranscript?: string, urgency?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') => void;
  acceptDispatchByHospital: (hospitalId: string) => void;
  declineOrTimeoutDispatch: (hospitalId: string, reason: string) => void;
  cancelDispatch: () => void;
  sendDispatchMessage: (sender: 'CITIZEN' | 'HOSPITAL' | 'PARAMEDIC', text: string) => void;
  
  // In-Ambulance Telemetry & Dynamic Reroute
  vitals: TelemetryVitals;
  updateVitals: (partial: Partial<TelemetryVitals>) => void;
  executeDynamicReroute: () => void;
  loadPresetScenario: (scenario: 'BIKE_HEAD_TRAUMA' | 'ACUTE_STEMI_HEART' | 'MILD_FEVER_CLINIC') => void;

  // Public Workers (Police, Traffic, ASHA)
  workerReports: PublicWorkerReport[];
  addWorkerReport: (report: Omit<PublicWorkerReport, 'id' | 'timestamp'>) => void;
  greenCorridorActive: boolean;
  setGreenCorridorActive: (active: boolean) => void;
  clearTrafficJunction: (junctionName: string) => void;
  clearedJunctions: string[];
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
    capabilities: ['TRAUMA_OT', 'BLOOD_BANK_O_NEG', 'MATERNITY_SURGICAL', 'MECHANICAL_VENTILATOR'],
    doctorsOnDuty: [
      { id: 'doc-3', name: 'Dr. Rajesh Mehta', designation: 'Senior Emergency Physician', department: '24x7 Emergency & Trauma', shift: '24x7 Trauma Shift', available: true, statusDetail: 'AVAILABLE', roomNumber: 'ER Bay 1' },
      { id: 'doc-4', name: 'Dr. Sneha Patil', designation: 'Anesthetist & Critical Care', department: 'Anesthesia & Surgery', shift: 'Night On-Duty', available: false, statusDetail: 'BUSY_SURGERY', roomNumber: 'Operation Theater 2' }
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
    capabilities: ['TRAUMA_OT', 'BLOOD_BANK_O_NEG', 'MATERNITY_SURGICAL', 'MECHANICAL_VENTILATOR', 'PEDIATRIC_ICU'],
    doctorsOnDuty: [
      { id: 'doc-5', name: 'Dr. Vivek Saxena', designation: 'Chief Medical Superintendent', department: 'Civil Administration & Medicine', shift: 'Full Time', available: true, statusDetail: 'AVAILABLE', roomNumber: 'Admin Block C' },
      { id: 'doc-6', name: 'Dr. Priya Nambiar', designation: 'General Surgeon', department: 'General Surgery & Trauma', shift: 'Night On-Call', available: false, statusDetail: 'ON_ROUNDS', roomNumber: 'Ward 4' }
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

// Initial vitals representing a severe trauma bike accident with dropping GCS
const INITIAL_VITALS: TelemetryVitals = {
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
  blood_glucose: 128
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const saved = localStorage.getItem('medcatalyst_hospitals') || localStorage.getItem('sanjeevani_hospitals');
    return saved ? JSON.parse(saved) : INITIAL_HOSPITALS;
  });

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-rampur-phc');
  const [user] = useState<UserBioData>(INITIAL_USER);
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

  // Cross-tab real-time sync for hospitals & doctors
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
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [hospitalUser]);

  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => {
    const saved = localStorage.getItem('medcatalyst_ambulances') || localStorage.getItem('sanjeevani_ambulances');
    return saved ? JSON.parse(saved) : INITIAL_AMBULANCES;
  });

  const [activeDispatch, setActiveDispatch] = useState<EmergencyDispatch | null>(() => {
    const saved = localStorage.getItem('medcatalyst_active_dispatch') || localStorage.getItem('sanjeevani_active_dispatch');
    if (saved) return JSON.parse(saved);
    
    // Default active dispatch for instantaneous demo presentation!
    return {
      id: 'disp-2026-9041',
      callerName: 'Rameshwar Singh (Self / Citizen SOS)',
      callerPhone: '+91 98765 43210',
      callerVoiceTranscript: 'Bike se gir gaye the, sir par chot lagi hai aur behosh ho rahe hain...',
      callerIssue: 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
      urgencyLevel: 'CRITICAL',
      pickupAddress: 'Near Milestone 34, Old GT Road, Rampur Outskirts',
      pickupLat: 28.7080,
      pickupLng: 77.0980,
      createdAt: new Date().toLocaleTimeString(),
      status: 'PATIENT_ONBOARD',
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
          note: 'BLS Ambulance Unit 01 dispatched to pickup location'
        }
      ],
      vitals: INITIAL_VITALS,
      mlAcuity: 'ESI-1',
      mlRequiredCapabilities: ['NEURO_SURGERY_ICU', 'TRAUMA_OT', 'MECHANICAL_VENTILATOR'],
      messages: [
        { sender: 'CITIZEN', text: 'Please send ambulance fast, bleeding from forehead and ear!', timestamp: '01:31 AM', type: 'VOICE' },
        { sender: 'HOSPITAL', text: 'Ambulance HR-10-EM-1081 dispatched with Paramedic Jagdish. ETA 7 mins.', timestamp: '01:32 AM', type: 'TEXT' },
        { sender: 'PARAMEDIC', text: 'Patient onboard. Vitals recorded: GCS 8, SpO2 89%. Connecting telemetry to MedCatalyst model.', timestamp: '01:35 AM', type: 'TEXT' }
      ]
    };
  });

  const [vitals, setVitals] = useState<TelemetryVitals>(INITIAL_VITALS);
  const [workerReports, setWorkerReports] = useState<PublicWorkerReport[]>(INITIAL_WORKER_REPORTS);
  const [greenCorridorActive, setGreenCorridorActive] = useState<boolean>(false);
  const [clearedJunctions, setClearedJunctions] = useState<string[]>(['Rampur Toll Gate']);

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

  const updateHospitalBeds = (hospitalId: string, bedType: 'general' | 'icu' | 'maternity' | 'ventilator', delta: number) => {
    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      if (bedType === 'general') {
        const next = Math.max(0, Math.min(h.generalBedsTotal, h.generalBedsAvail + delta));
        return { ...h, generalBedsAvail: next };
      }
      if (bedType === 'icu') {
        const next = Math.max(0, Math.min(h.icuBedsTotal, h.icuBedsAvail + delta));
        return { ...h, icuBedsAvail: next };
      }
      if (bedType === 'maternity') {
        const next = Math.max(0, Math.min(h.maternityBedsTotal, h.maternityBedsAvail + delta));
        return { ...h, maternityBedsAvail: next };
      }
      if (bedType === 'ventilator') {
        const next = Math.max(0, h.ventilatorsAvail + delta);
        return { ...h, ventilatorsAvail: next };
      }
      return h;
    }));
  };

  const loginUser = (identifier: string): boolean => {
    if (identifier.trim().length > 0) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
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
    // Pick nearest emergency capable hospital (Rampur PHC or Bilaspur CHC)
    const nearestHosp = hospitals[0];

    const newDispatch: EmergencyDispatch = {
      id: `disp-${Date.now().toString().slice(-4)}`,
      callerName: user.fullName,
      callerPhone: user.phone,
      callerVoiceTranscript: voiceTranscript || issueText,
      callerIssue: issueText,
      urgencyLevel: urgency,
      pickupAddress: user.address,
      pickupLat: 28.7080,
      pickupLng: 77.0980,
      createdAt: new Date().toLocaleTimeString(),
      status: 'PENDING_HOSPITAL_ACCEPT',
      currentHospitalId: nearestHosp.id,
      timeoutSecondsRemaining: 120, // 2 minutes SLA
      waterfallHistory: [
        {
          hospitalId: nearestHosp.id,
          hospitalName: nearestHosp.name,
          sentAt: new Date().toLocaleTimeString(),
          status: 'WAITING',
          note: 'Request dispatched to closest medical facility'
        }
      ],
      vitals,
      messages: [
        {
          sender: 'CITIZEN',
          text: voiceTranscript ? `Voice SOS: "${voiceTranscript}"` : issueText,
          timestamp: new Date().toLocaleTimeString(),
          type: voiceTranscript ? 'VOICE' : 'TEXT'
        }
      ]
    };

    setActiveDispatch(newDispatch);
  };

  const acceptDispatchByHospital = (hospitalId: string) => {
    if (!activeDispatch) return;

    // Find ambulance belonging to this hospital or nearby
    const matchedAmb = ambulances.find(a => a.hospitalId === hospitalId && a.status === 'AVAILABLE') || ambulances[0];

    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'ACCEPTED',
        assignedAmbulanceId: matchedAmb.id,
        waterfallHistory: prev.waterfallHistory.map(hop => 
          hop.hospitalId === hospitalId ? { ...hop, status: 'ACCEPTED', responseTimeSeconds: 120 - prev.timeoutSecondsRemaining } : hop
        ),
        messages: [
          ...prev.messages,
          {
            sender: 'HOSPITAL',
            text: `Dispatch Accepted by ${hospitals.find(h => h.id === hospitalId)?.name}. Ambulance ${matchedAmb.vehicleNumber} dispatched!`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]
      };
    });

    updateAmbulanceStatus(matchedAmb.id, 'DISPATCHED');
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
            timestamp: new Date().toLocaleTimeString()
          }
        ]
      };
    });
  };

  const cancelDispatch = () => {
    setActiveDispatch(null);
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

  const updateVitals = (partial: Partial<TelemetryVitals>) => {
    const nextVitals = { ...vitals, ...partial };
    setVitals(nextVitals);

    // Re-evaluate with ML model
    const prediction = evaluateAmbulanceTelemetry(nextVitals);
    
    setActiveDispatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        vitals: nextVitals,
        mlAcuity: prediction.acuity,
        mlRequiredCapabilities: prediction.requiredCapabilities
      };
    });
  };

  const executeDynamicReroute = () => {
    if (!activeDispatch) return;
    const targetHosp = hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[0];
    const prediction = evaluateAmbulanceTelemetry(vitals);
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
            timestamp: new Date().toLocaleTimeString()
          },
          messages: [
            ...prev.messages,
            {
              sender: 'PARAMEDIC',
              text: `🚨 MEDCATALYST REROUTE ENACTED: Diverting from ${targetHosp.name} to ${newHosp.name}. Reasons: ${match.mismatches.join('; ')}. Reserving Trauma ICU & Cath Lab!`,
              timestamp: new Date().toLocaleTimeString()
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
      const scenarioVitals: TelemetryVitals = {
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
        blood_glucose: 125
      };
      setVitals(scenarioVitals);
      updateVitals(scenarioVitals);
    } else if (scenario === 'ACUTE_STEMI_HEART') {
      const scenarioVitals: TelemetryVitals = {
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
        blood_glucose: 145
      };
      setVitals(scenarioVitals);
      updateVitals(scenarioVitals);
    } else {
      const scenarioVitals: TelemetryVitals = {
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
        blood_glucose: 98
      };
      setVitals(scenarioVitals);
      updateVitals(scenarioVitals);
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
      ambulances,
      updateAmbulanceStatus,
      activeDispatch,
      createEmergencyDispatch,
      acceptDispatchByHospital,
      declineOrTimeoutDispatch,
      cancelDispatch,
      sendDispatchMessage,
      vitals,
      updateVitals,
      executeDynamicReroute,
      loadPresetScenario,
      workerReports,
      addWorkerReport,
      greenCorridorActive,
      setGreenCorridorActive,
      clearTrafficJunction,
      clearedJunctions
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
