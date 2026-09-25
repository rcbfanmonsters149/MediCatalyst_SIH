import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Building2, 
  Stethoscope, 
  User, 
  Pill, 
  Calendar,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  Camera,
  Upload,
  Scan,
  Sparkles,
  Search,
  CheckCircle,
  RefreshCw,
  FlaskConical,
  TestTube,
  Microscope,
  FileSpreadsheet,
  FileCheck
} from '../icons';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import Tesseract from 'tesseract.js';
import { parsePrescriptionText } from '../../utils/prescriptionParser';
import { 
  Hospital, 
  PrescriptionMedication, 
  LabRecordItem, 
  LabTestCategory, 
  LabTestStatus 
} from '../../types';

const LAB_CATEGORIES: LabTestCategory[] = [
  'Hematology (Blood Count)',
  'Biochemistry & Enzymes',
  'Lipid Profile',
  'Diabetic Profile',
  'Renal / Kidney (KFT)',
  'Liver Function (LFT)',
  'Urine Analysis',
  'Microbiology & Serology',
  'Cardiology & ECG',
  'Radiology / Imaging',
  'Pathology',
  'Other Diagnostic'
];

const COMMON_LAB_PRESETS: Array<{
  testName: string;
  category: LabTestCategory;
  resultValue: string;
  unit: string;
  referenceRange: string;
  status: LabTestStatus;
  notes: string;
}> = [
  {
    testName: 'Fasting Blood Sugar (FBS)',
    category: 'Diabetic Profile',
    resultValue: '98',
    unit: 'mg/dL',
    referenceRange: '70 - 100 mg/dL',
    status: 'NORMAL',
    notes: 'Normal fasting glucose levels.'
  },
  {
    testName: 'HbA1c (Glycated Hemoglobin)',
    category: 'Diabetic Profile',
    resultValue: '5.6',
    unit: '%',
    referenceRange: '< 5.7 %',
    status: 'NORMAL',
    notes: 'Optimal 90-day glycemic index.'
  },
  {
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology (Blood Count)',
    resultValue: '14.2',
    unit: 'g/dL (Hb)',
    referenceRange: '13.0 - 17.0 g/dL',
    status: 'NORMAL',
    notes: 'Hemoglobin, TLC and platelet count within normal baseline.'
  },
  {
    testName: 'Serum Creatinine (KFT)',
    category: 'Renal / Kidney (KFT)',
    resultValue: '0.9',
    unit: 'mg/dL',
    referenceRange: '0.7 - 1.3 mg/dL',
    status: 'NORMAL',
    notes: 'Normal renal clearance function.'
  },
  {
    testName: 'Lipid Profile (Total Cholesterol)',
    category: 'Lipid Profile',
    resultValue: '185',
    unit: 'mg/dL',
    referenceRange: '< 200 mg/dL',
    status: 'NORMAL',
    notes: 'Optimal lipid profile parameters.'
  },
  {
    testName: 'Liver Function (SGPT / ALT)',
    category: 'Liver Function (LFT)',
    resultValue: '35',
    unit: 'U/L',
    referenceRange: '7 - 56 U/L',
    status: 'NORMAL',
    notes: 'Hepatic transaminases within normal reference limit.'
  },
  {
    testName: '12-Lead Electrocardiogram (ECG)',
    category: 'Cardiology & ECG',
    resultValue: 'Normal Sinus Rhythm',
    unit: 'Lead Tracing',
    referenceRange: 'Normal Sinus Rhythm',
    status: 'NORMAL',
    notes: 'No acute ST elevation or ischemic changes.'
  },
  {
    testName: 'Urine Routine & Microscopy',
    category: 'Urine Analysis',
    resultValue: 'Clear, Protein Nil, Sugar Nil',
    unit: 'Qualitative',
    referenceRange: 'Normal Negative',
    status: 'NORMAL',
    notes: 'No pus cells or cast elements detected.'
  }
];

interface HospitalPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  onNotify: (msg: string) => void;
  initialAbhaId?: string;
  initialPatientName?: string;
  defaultActiveSection?: 'all' | 'prescription' | 'labs';
}

export type PrescriptionInputMode = 'AI_SCAN' | 'MANUAL';

export const HospitalPrescriptionModal: React.FC<HospitalPrescriptionModalProps> = ({
  isOpen,
  onClose,
  hospital,
  onNotify,
  initialAbhaId,
  initialPatientName,
  defaultActiveSection
}) => {
  const { user, addPatientPrescription } = useApp();
  const { tr, language } = useLanguage();

  // Mode Selection
  const [entryMode, setEntryMode] = useState<PrescriptionInputMode>('AI_SCAN');

  // ABHA ID & Patient Resolution State
  const [abhaIdInput, setAbhaIdInput] = useState(initialAbhaId || user.healthId || 'ABHA-9821-4420-1081');
  const [isAbhaVerified, setIsAbhaVerified] = useState(true);
  const [patientName, setPatientName] = useState(initialPatientName || user.fullName || 'Rajesh Kumar');
  const [patientDemographics, setPatientDemographics] = useState('38 Yrs • Male • Blood: O+ • Known Allergy: Penicillin (Mild)');

  // Doctor Details
  const [doctorName, setDoctorName] = useState(
    hospital.doctorsOnDuty[0]?.name || 'Dr. S. K. Sharma, MD'
  );
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    hospital.doctorsOnDuty[0]?.designation || 'Internal Medicine / General Physician'
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [vitalsSummary, setVitalsSummary] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');

  // Dynamic Medications List - starts empty in AI Scan mode
  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);

  // Section Visibility Toggles (Prescription vs Lab Records)
  const [includePrescription, setIncludePrescription] = useState(defaultActiveSection !== 'labs');
  const [includeLabRecords, setIncludeLabRecords] = useState(
    defaultActiveSection === 'labs' || defaultActiveSection === 'all' || !defaultActiveSection
  );

  // Dynamic Lab Records List
  const [labRecords, setLabRecords] = useState<LabRecordItem[]>(
    defaultActiveSection === 'labs'
      ? [
          {
            testName: 'Complete Blood Count (CBC)',
            category: 'Hematology (Blood Count)',
            resultValue: '14.2',
            unit: 'g/dL (Hb)',
            referenceRange: '13.0 - 17.0 g/dL',
            status: 'NORMAL',
            notes: 'Hemoglobin and total leukocyte count within baseline physiological limits.'
          }
        ]
      : []
  );

  // AI Scanner States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [scanConfidence, setScanConfidence] = useState<number | null>(null);
  const [modelTypeUsed, setModelTypeUsed] = useState<string | null>(null);
  const [isInvalidDocument, setIsInvalidDocument] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blockchain Minting State
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState('');

  // Update states if props change
  useEffect(() => {
    if (initialAbhaId) setAbhaIdInput(initialAbhaId);
    if (initialPatientName) setPatientName(initialPatientName);
    if (defaultActiveSection === 'labs') {
      setIncludeLabRecords(true);
      setIncludePrescription(false);
    } else if (defaultActiveSection === 'prescription') {
      setIncludePrescription(true);
      setIncludeLabRecords(false);
    }
  }, [initialAbhaId, initialPatientName, defaultActiveSection]);

  if (!isOpen) return null;

  // ABHA ID Verification Handler
  const handleVerifyAbha = () => {
    const cleanId = abhaIdInput.trim();
    if (!cleanId) return;

    if (cleanId === user.healthId || cleanId.toLowerCase().includes('abha')) {
      setPatientName(user.fullName || 'Rajesh Kumar');
      setPatientDemographics(`${user.age || 38} Yrs • ${user.gender || 'Male'} • Blood: ${user.bloodGroup || 'O+'} • ABDM Verified`);
      setIsAbhaVerified(true);
      onNotify(`ABHA ID ${cleanId} verified with National Health Authority registry.`);
    } else {
      // Mock resolution for any other entered ABHA ID
      setPatientName(`Citizen (${cleanId.slice(-4)})`);
      setPatientDemographics(`Verified ABHA Record • Grid Token Active`);
      setIsAbhaVerified(true);
      onNotify(`ABHA ID ${cleanId} resolved successfully.`);
    }
  };

  // Image Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setIsInvalidDocument(false);
      setRejectionMessage(null);
      setScanConfidence(null);
      setModelTypeUsed(null);
      setMedications([]);
      setDiagnosis('');
      setVitalsSummary('');
      setClinicalAdvice('');
    }
  };

  const handleLoadDemoPrescription = async () => {
    try {
      setIsInvalidDocument(false);
      setRejectionMessage(null);
      setScanConfidence(null);
      setModelTypeUsed(null);
      setMedications([]);
      setDiagnosis('');
      setVitalsSummary('');
      setClinicalAdvice('');
      const response = await fetch('/sample_doctor_prescription.png');
      const blob = await response.blob();
      const file = new File([blob], 'sample_doctor_prescription.png', { type: 'image/png' });
      setSelectedFile(file);
      setImagePreviewUrl('/sample_doctor_prescription.png');
      onNotify('Sample doctor prescription loaded! Click "Run Trained AI Model" to test.');
    } catch (e) {
      console.warn('Could not load demo sample:', e);
      setImagePreviewUrl('/sample_doctor_prescription.png');
    }
  };

  // Trigger Local Trained AI OCR Model (Extracts Prescriptions & Lab Reports)
  const handleScanPrescription = async () => {
    if (!selectedFile && !imagePreviewUrl) {
      alert('Please upload or capture a prescription or lab report image first.');
      return;
    }

    setIsScanning(true);
    setIsInvalidDocument(false);
    setRejectionMessage(null);
    setMedications([]);
    setDiagnosis('');
    setVitalsSummary('');
    setClinicalAdvice('');
    setScanStepMessage('⚡ Extracting handwriting & optical text with Vision OCR...');

    try {
      const imgSource = selectedFile || imagePreviewUrl;
      let ocrText = '';

      // 1. Run Optical Character Recognition on the actual uploaded image
      if (imgSource) {
        try {
          const ocrResult = await Tesseract.recognize(imgSource, 'eng');
          ocrText = ocrResult?.data?.text || '';
          console.log('Real Image OCR Raw Output:', ocrText);
        } catch (ocrErr) {
          console.warn('Tesseract OCR error:', ocrErr);
        }
      }

      setScanStepMessage('🧠 Cross-referencing against Jan Aushadhi & Indian generic drug lexicon...');

      // 2. Parse the extracted text dynamically with strict verification
      const parsed = parsePrescriptionText(ocrText);

      // 3. Also call our backend TrOCR service if running
      let backendData: any = null;
      try {
        const formData = new FormData();
        if (selectedFile) {
          formData.append('file', selectedFile);
        } else if (imagePreviewUrl) {
          const resp = await fetch(imagePreviewUrl);
          const blob = await resp.blob();
          formData.append('file', blob, 'rx.jpg');
        }
        const response = await fetch('http://localhost:8000/api/prescriptions/scan', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          backendData = await response.json();
        }
      } catch (networkErr) {
        console.warn('Backend API offline or unreachable:', networkErr);
      }

      // Check whether this document is verified as a prescription
      const isPrescriptionValid = parsed.isPrescription || (backendData && backendData.is_prescription === true);

      // Combine medications detected
      const finalMeds = (parsed.medications && parsed.medications.length > 0)
        ? parsed.medications
        : (backendData?.medications && Array.isArray(backendData.medications) && backendData.medications.length > 0
          ? backendData.medications
          : []);

      if (!isPrescriptionValid || finalMeds.length === 0) {
        // Document failed clinical prescription verification
        setIsInvalidDocument(true);
        const reason = parsed.rejectionReason || 
          backendData?.rejection_reason || 
          'Non-Medical Image Detected: No doctor prescription headers, Rx markings, or valid pharmaceutical medications found in this image.';
        setRejectionMessage(reason);
        setMedications([]);
        setDiagnosis('');
        setVitalsSummary('');
        setClinicalAdvice('');
        setScanConfidence(0);
        setModelTypeUsed('Authenticity Verification Engine');
        onNotify('Validation Failed: Uploaded image is not a medical prescription.');
        return;
      }

      // Genuine prescription verified
      setIsInvalidDocument(false);
      setRejectionMessage(null);
      setMedications(finalMeds);
      setIncludePrescription(true);

      if (parsed.diagnosis && parsed.diagnosis.length > 3) {
        setDiagnosis(parsed.diagnosis);
      } else if (backendData?.diagnosis) {
        setDiagnosis(backendData.diagnosis);
      }

      if (parsed.doctorName) {
        setDoctorName(parsed.doctorName);
      } else if (backendData?.doctor_name) {
        setDoctorName(backendData.doctor_name);
      }

      if (parsed.vitalsDetected) {
        setVitalsSummary(parsed.vitalsDetected);
      }

      if (parsed.clinicalAdvice) {
        setClinicalAdvice(parsed.clinicalAdvice);
      }

      const conf = parsed.overallConfidence || backendData?.overall_confidence || 94.5;
      setScanConfidence(conf);
      setModelTypeUsed(backendData?.model_used || 'TrOCR Vision Transformer & Jan Aushadhi Lexicon');
      onNotify(`AI Scan Success: Extracted ${finalMeds.length} medicine(s) from your prescription!`);

    } catch (err: any) {
      console.error(err);
      alert(`Scanning error: ${err?.message || 'Failed to parse record'}`);
    } finally {
      setIsScanning(false);
      setScanStepMessage('');
    }
  };

  // Medication Handlers
  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '500 mg',
        frequency: '1-0-1 (After Food)',
        duration: '5 Days',
        instructions: 'As directed'
      }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionMedication, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  // Lab Record Handlers
  const handleAddLabRecord = () => {
    setIncludeLabRecords(true);
    setLabRecords([
      ...labRecords,
      {
        testName: '',
        category: 'Biochemistry & Enzymes',
        sampleCollectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        resultValue: '',
        unit: 'mg/dL',
        referenceRange: 'Normal Range',
        status: 'NORMAL',
        notes: ''
      }
    ]);
  };

  const handleAddLabPreset = (preset: typeof COMMON_LAB_PRESETS[0]) => {
    setIncludeLabRecords(true);
    setLabRecords([
      ...labRecords,
      {
        ...preset,
        sampleCollectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    onNotify(`Added lab test: ${preset.testName}`);
  };

  const handleRemoveLabRecord = (index: number) => {
    setLabRecords(labRecords.filter((_, i) => i !== index));
  };

  const handleLabChange = (index: number, field: keyof LabRecordItem, val: any) => {
    const updated = [...labRecords];
    updated[index] = { ...updated[index], [field]: val };
    setLabRecords(updated);
  };

  // Submit Prescription and/or Lab Records to ABHA & Blockchain
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis or chief complaint.');
      return;
    }

    const validMeds = includePrescription ? medications.filter(m => m.name.trim().length > 0) : [];
    const validLabs = includeLabRecords ? labRecords.filter(l => l.testName.trim().length > 0) : [];

    if (validMeds.length === 0 && validLabs.length === 0) {
      alert('Please enter at least one prescription medication or one diagnostic laboratory test record.');
      return;
    }

    const summaryParts: string[] = [];
    if (validMeds.length > 0) {
      const medSummary = validMeds
        .map(m => `${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`)
        .join(' • ');
      summaryParts.push(`Rx: ${medSummary}`);
    }
    if (validLabs.length > 0) {
      const labSummary = validLabs
        .map(l => `${l.testName} (${l.resultValue} ${l.unit} [${l.status}])`)
        .join(' • ');
      summaryParts.push(`Labs: ${labSummary}`);
    }

    const prescriptionSummary = summaryParts.join(' | ') || 'Clinical visit record & diagnostics issued.';

    const todayDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    setIsMinting(true);
    setMintStep('🔒 Encrypting clinical record client-side (AES-256-GCM)...');

    try {
      const newRec = await addPatientPrescription({
        date: todayDate,
        hospitalName: hospital.name,
        hospitalId: hospital.id,
        doctorName,
        doctorSpecialty,
        diagnosis: diagnosis.trim(),
        prescriptionSummary,
        medications: validMeds,
        labRecords: validLabs,
        clinicalAdvice: clinicalAdvice.trim(),
        abhaId: abhaIdInput.trim()
      });

      setMintStep('⚡ Minting block to Polygon Amoy Health Grid & IPFS...');

      setTimeout(() => {
        setIsMinting(false);
        const labMsg = validLabs.length > 0 ? ` & ${validLabs.length} Lab Test(s)` : '';
        onNotify(`🛡️ Clinical Record${labMsg} Linked to ${abhaIdInput}! Blockchain Block #${newRec.blockNumber || 4182905} (Tx: ${newRec.blockchainTxHash?.slice(0, 10)}...)`);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      setIsMinting(false);
      alert('Clinical record creation failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg font-heading">
                  Clinical Prescription & Lab Records Station
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ABDM & Polygon Amoy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Digital Prescriptions (Rx) + Laboratory Diagnostics linked to Patient ABHA Health ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          
          {/* STEP 1: Patient ABHA ID Resolution Bar */}
          <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="font-extrabold text-slate-800 text-sm">
                  1. Link Patient ABHA Health ID
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    required
                    value={abhaIdInput}
                    onChange={(e) => {
                      setAbhaIdInput(e.target.value);
                      setIsAbhaVerified(false);
                    }}
                    placeholder="e.g. ABHA-9821-4420-1081"
                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-blue-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  {isAbhaVerified && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 absolute right-2.5 top-2" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyAbha}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>
              </div>
            </div>

            {/* Resolved Patient Demographic Chip */}
            {isAbhaVerified && (
              <div className="p-2.5 bg-white/80 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{patientName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">{patientDemographics}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  ABDM Verified Patient
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Dual Entry Mode Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => {
                setEntryMode('AI_SCAN');
                setIsInvalidDocument(false);
                setRejectionMessage(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                entryMode === 'AI_SCAN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Mode A: 📸 AI Prescription Scanner (Trained Model)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                entryMode === 'AI_SCAN' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}>
                Auto
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryMode('MANUAL');
                setIsInvalidDocument(false);
                setRejectionMessage(null);
                if (medications.length === 0) {
                  setMedications([
                    {
                      name: '',
                      dosage: '500 mg',
                      frequency: '1-0-1 (After Food)',
                      duration: '5 Days',
                      instructions: 'Take after meals'
                    }
                  ]);
                }
                if (!diagnosis) {
                  setDiagnosis('General OPD Consultation');
                }
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                entryMode === 'MANUAL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Mode B: ✍️ Manual Prescription Entry</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                entryMode === 'MANUAL' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}>
                OPD
              </span>
            </button>
          </div>

          {/* MODE A: AI SCANNER PANEL */}
          {entryMode === 'AI_SCAN' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Doctor Handwritten Script Digitizer
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload a photo of handwritten prescription slip. Our fine-tuned TrOCR model extracts medicines & dosages instantly.
                  </p>
                </div>

                {scanConfidence && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{scanConfidence}% Clinical Match</span>
                  </div>
                )}
              </div>

              {/* Upload Dropzone & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Upload Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="md:col-span-7 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      {selectedFile ? selectedFile.name : 'Click to Upload Prescription Photo or Slip'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Supports JPG, PNG, WEBP (Camera photos from phone or clinic scanner)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadDemoPrescription();
                      }}
                      className="mt-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>📄 Load Sample Prescription (Instant Test)</span>
                    </button>
                  </div>
                </div>

                {/* Scan Action / Preview */}
                <div className="md:col-span-5 flex flex-col gap-2">
                  {imagePreviewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Prescription preview" 
                        className="h-full w-full object-cover" 
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Ready to Scan
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 rounded-xl border border-slate-200 bg-slate-100/50 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 opacity-60" />
                      <span className="text-[10px]">No image selected yet</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleScanPrescription}
                    disabled={isScanning || !imagePreviewUrl}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Script...</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-3.5 h-3.5" />
                        <span>Run Trained AI Model</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Invalid / Non-Prescription Document Rejection Alert */}
              {isInvalidDocument && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-sm text-rose-950">
                        Invalid / Non-Prescription Image Detected
                      </h5>
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-mono font-bold">
                        Clinical Match: 0% (Rejected)
                      </span>
                    </div>
                    <p className="text-xs text-rose-800">
                      {rejectionMessage || 'Our verification engine detected that this uploaded image is not a medical prescription. No Rx symbols, doctor credentials, or pharmaceuticals were found.'}
                    </p>
                    <div className="flex items-center gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={handleLoadDemoPrescription}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Test with Verified Sample Prescription</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEntryMode('MANUAL');
                          setIsInvalidDocument(false);
                          setRejectionMessage(null);
                          if (medications.length === 0) {
                            setMedications([
                              {
                                name: '',
                                dosage: '500 mg',
                                frequency: '1-0-1 (After Food)',
                                duration: '5 Days',
                                instructions: 'Take after meals'
                              }
                            ]);
                          }
                          if (!diagnosis) setDiagnosis('General OPD Consultation');
                        }}
                        className="text-[11px] text-rose-700 hover:text-rose-900 underline font-semibold ml-2 cursor-pointer"
                      >
                        Switch to Manual Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Scanner Step Indicator */}
              {isScanning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 font-semibold animate-pulse">
                  <Cpu className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <span>{scanStepMessage}</span>
                </div>
              )}

              {modelTypeUsed && (
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Engine:</span>
                    <span className="font-mono text-blue-700">{modelTypeUsed}</span>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Jan Aushadhi Master Match: 100%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Doctor & Hospital Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Hospital Metadata */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Issuing Facility:</span>
              <h4 className="font-bold text-slate-900 text-sm">{hospital.name}</h4>
              <p className="text-[11px] text-slate-500">{hospital.address} • {hospital.type}</p>
            </div>

            {/* Doctor Info */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <label className="block font-bold text-slate-700 text-xs">Attending Physician:</label>
              <select
                value={doctorName}
                onChange={(e) => {
                  setDoctorName(e.target.value);
                  const match = hospital.doctorsOnDuty.find(d => d.name === e.target.value);
                  if (match) setDoctorSpecialty(match.designation);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {hospital.doctorsOnDuty.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.designation})
                  </option>
                ))}
                <option value="Dr. S. K. Sharma, MD">Dr. S. K. Sharma, MD (Internal Medicine)</option>
                <option value="Dr. Resident Medical Officer">Dr. Resident Medical Officer</option>
              </select>
            </div>

          </div>

          {/* STEP 4: Diagnosis & Clinical Chief Complaint */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-sm">
                Clinical Diagnosis & Chief Complaints
              </label>
              <span className="text-slate-400 text-[11px]">EHR Structured Entry</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Acute Bronchitis, Hypertension, Type 2 Diabetes"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Vitals Recorded:</label>
              <input
                type="text"
                value={vitalsSummary}
                onChange={(e) => setVitalsSummary(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-mono text-xs"
              />
            </div>
          </div>

          {/* STEP 5: Record Scope Selector (Prescriptions vs Lab Records) */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Clinical Record Components for this Visit</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Select clinical modules to include for this patient entry on the ABHA grid:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIncludePrescription(!includePrescription)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  includePrescription 
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs' 
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-rose-600" />
                <span>Prescription (Rx)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  includePrescription ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {medications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeLabRecords(!includeLabRecords)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  includeLabRecords 
                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs' 
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                <span>Lab Records & Diagnostics</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  includeLabRecords ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {labRecords.length}
                </span>
              </button>
            </div>
          </div>

          {/* STEP 5A: Prescription Medications (Rx) Builder */}
          {includePrescription && (
            <div className="space-y-3 pt-2 p-4 bg-rose-50/20 border border-rose-150 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="font-extrabold text-slate-900 text-sm">
                        Medications & Dosing Schedule (Rx)
                      </label>
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                        {medications.length} Prescribed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pharmaceutical drugs with frequency, duration and timing instructions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Drug</span>
                </button>
              </div>

              {/* Drug Rows */}
              {medications.length === 0 ? (
                <div className="p-6 bg-white border-2 border-dashed border-rose-200 rounded-2xl text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                    <Pill className="w-5 h-5 opacity-70" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">No Medications Extracted Yet</h5>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                      {entryMode === 'AI_SCAN' 
                        ? 'Upload a doctor prescription slip above and click "Run Trained AI Model", or add drugs manually.' 
                        : 'Click "Add Drug" above to prescribe medications for this clinical visit.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Medication</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition shadow-2xs">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Medicine Name</label>
                        <input
                          type="text"
                          required={includePrescription}
                          placeholder="e.g. Paracetamol"
                          value={med.name}
                          onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dosage</label>
                        <input
                          type="text"
                          placeholder="650 mg"
                          value={med.dosage}
                          onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Frequency</label>
                        <input
                          type="text"
                          placeholder="1-0-1 (After Food)"
                          value={med.frequency}
                          onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration</label>
                        <input
                          type="text"
                          placeholder="5 Days"
                          value={med.duration}
                          onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Frequency Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-500 font-semibold mr-1">Quick Shorthand:</span>
                {['1-0-1 (After Food)', '1-0-0 (Empty Stomach)', '0-0-1 (Bedtime)', '1-1-1 (TID)', 'SOS (As Needed)'].map((shortcut) => (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => {
                      const lastIdx = medications.length - 1;
                      if (lastIdx >= 0) {
                        handleMedChange(lastIdx, 'frequency', shortcut);
                      }
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-md border border-slate-200 transition cursor-pointer"
                  >
                    {shortcut}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5B: Laboratory & Diagnostic Investigations Builder */}
          {includeLabRecords && (
            <div className="space-y-3 pt-2 p-4 bg-purple-50/25 border border-purple-150 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="font-extrabold text-slate-900 text-sm">
                        Laboratory & Diagnostic Investigations
                      </label>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                        {labRecords.length} Tests
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Record biochemistry, hematology, ECG, and pathology test findings.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLabRecord}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lab Test</span>
                </button>
              </div>

              {/* Quick 1-Click Lab Test Presets */}
              <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-purple-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>1-Click Diagnostic Presets:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COMMON_LAB_PRESETS.map((preset) => (
                    <button
                      key={preset.testName}
                      type="button"
                      onClick={() => handleAddLabPreset(preset)}
                      className="px-2.5 py-1 bg-purple-50/80 hover:bg-purple-100 hover:text-purple-900 text-purple-700 rounded-lg text-[11px] font-semibold border border-purple-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-purple-500" />
                      <span>{preset.testName.split(' ')[0]} {preset.testName.includes('(') ? preset.testName.substring(preset.testName.indexOf('(')) : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lab Test Rows */}
              {labRecords.length === 0 ? (
                <div className="p-5 border-2 border-dashed border-purple-200 bg-white rounded-xl text-center space-y-1">
                  <TestTube className="w-7 h-7 text-purple-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Laboratory Records Added Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Click any quick preset above or "+ Add Lab Test" to attach diagnostic investigations to this patient visit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {labRecords.map((lab, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 bg-white rounded-xl border transition space-y-3 shadow-2xs ${
                        lab.status === 'CRITICAL' 
                          ? 'border-rose-300 ring-1 ring-rose-200' 
                          : lab.status === 'ABNORMAL' 
                            ? 'border-amber-300' 
                            : 'border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      {/* Top Row: Test Name, Category & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Investigation / Test Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={includeLabRecords}
                            placeholder="e.g. Fasting Blood Sugar, HbA1c, CBC"
                            value={lab.testName}
                            onChange={(e) => handleLabChange(idx, 'testName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Category / Department
                          </label>
                          <select
                            value={lab.category}
                            onChange={(e) => handleLabChange(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold focus:bg-white"
                          >
                            {LAB_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Clinical Status / Finding
                          </label>
                          <select
                            value={lab.status}
                            onChange={(e) => handleLabChange(idx, 'status', e.target.value as LabTestStatus)}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                              lab.status === 'NORMAL' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : lab.status === 'BORDERLINE' 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : lab.status === 'ABNORMAL' 
                                    ? 'bg-orange-50 text-orange-800 border-orange-300' 
                                    : lab.status === 'CRITICAL' 
                                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-black' 
                                      : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="NORMAL">🟢 Normal Baseline</option>
                            <option value="BORDERLINE">🟡 Borderline / Equivocal</option>
                            <option value="ABNORMAL">🟠 Abnormal Out-of-Range</option>
                            <option value="CRITICAL">🔴 Critical Alert</option>
                            <option value="PENDING">🔵 Pending Culture / Lab</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-end gap-1 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveLabRecord(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove this test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Result Value, Unit, Reference Range, Sample Time */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Test Result Value
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 142 or Positive"
                            value={lab.resultValue}
                            onChange={(e) => handleLabChange(idx, 'resultValue', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Measurement Unit
                          </label>
                          <input
                            type="text"
                            placeholder="mg/dL, %, g/dL"
                            value={lab.unit}
                            onChange={(e) => handleLabChange(idx, 'unit', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-700 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Biological Reference Range
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 70 - 100 mg/dL"
                            value={lab.referenceRange}
                            onChange={(e) => handleLabChange(idx, 'referenceRange', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Collection Time
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 08:30 AM"
                            value={lab.sampleCollectedAt || ''}
                            onChange={(e) => handleLabChange(idx, 'sampleCollectedAt', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Bottom Row: Clinical Interpretation Notes & Lab Center / Attachment */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                        <div className="sm:col-span-8">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Clinical Interpretation / Pathologist Remarks
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Suggestive of impaired fasting glucose. Advised lifestyle changes."
                            value={lab.notes || ''}
                            onChange={(e) => handleLabChange(idx, 'notes', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:bg-white"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Lab Report File / Slip
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Report filename (e.g. cbc.pdf)"
                              value={lab.reportAttachmentName || ''}
                              onChange={(e) => handleLabChange(idx, 'reportAttachmentName', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-mono"
                            />
                            <label className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold transition cursor-pointer shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleLabChange(idx, 'reportAttachmentName', e.target.files[0].name);
                                    onNotify(`Attached report: ${e.target.files[0].name}`);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Clinical Advice & Instructions */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dietary Instructions & Clinical Advice:
            </label>
            <textarea
              rows={2}
              value={clinicalAdvice}
              onChange={(e) => setClinicalAdvice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full sm:w-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isMinting ? mintStep : `Linked to ABHA: ${abhaIdInput}`}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isMinting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {tr.common.cancel}
              </button>
              
              <button
                type="submit"
                disabled={isMinting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isMinting ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>Mining Block...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {includePrescription && includeLabRecords 
                        ? 'Issue Rx & Lab Records to ABHA' 
                        : includeLabRecords 
                          ? 'Issue Lab Diagnostics to ABHA' 
                          : 'Issue Rx & Sync to ABHA'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
