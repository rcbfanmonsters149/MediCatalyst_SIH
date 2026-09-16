import React, { useState } from 'react';
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
  AlertCircle
} from '../icons';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Hospital, PrescriptionMedication } from '../../types';

interface HospitalPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  onNotify: (msg: string) => void;
}

export const HospitalPrescriptionModal: React.FC<HospitalPrescriptionModalProps> = ({
  isOpen,
  onClose,
  hospital,
  onNotify
}) => {
  const { user, addPatientPrescription } = useApp();
  const { tr, language } = useLanguage();

  // Form States
  const [patientName, setPatientName] = useState(user.fullName || 'Rajesh Kumar');
  const [abhaId, setAbhaId] = useState(user.healthId || 'ABHA-9821-4420-1081');
  const [doctorName, setDoctorName] = useState(
    hospital.doctorsOnDuty[0]?.name || 'Dr. Medical Officer'
  );
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    hospital.doctorsOnDuty[0]?.designation || 'General Physician'
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [vitalsSummary, setVitalsSummary] = useState('BP: 120/80 mmHg | Temp: 98.4°F | SpO2: 98%');
  const [clinicalAdvice, setClinicalAdvice] = useState(
    language === 'hi' 
      ? 'खूब उबला हुआ पानी पिएं। 3 दिनों तक पर्याप्त आराम करें। यदि लक्षण बने रहें तो ओपीडी में जांच कराएं।'
      : (language === 'mr' 
        ? 'उकळलेले पाणी भरपूर प्या. ३ दिवस पुरेशी विश्रांती घ्या. लक्षणे कायम राहिल्यास ओपीडीमध्ये पुन्हा भेटा.' 
        : 'Drink plenty of boiled water. Adequate rest for 3 days. Review in OPD if symptoms persist.')
  );

  // Dynamic Medications List
  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    {
      name: 'Paracetamol',
      dosage: '650 mg',
      frequency: '1-0-1 (After Food)',
      duration: '5 Days',
      instructions: 'Take after meals'
    },
    {
      name: 'Pantoprazole',
      dosage: '40 mg',
      frequency: '1-0-0 (Empty Stomach)',
      duration: '5 Days',
      instructions: 'Morning 30 mins before breakfast'
    }
  ]);

  if (!isOpen) return null;

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
    if (medications.length <= 1) {
      alert(language === 'hi' ? 'नुस्खे में कम से कम एक दवा होनी चाहिए।' : (language === 'mr' ? 'प्रिस्क्रिप्शनमध्ये किमान एक औषध असणे आवश्यक आहे.' : 'Prescription must contain at least one medication.'));
      return;
    }
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionMedication, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      alert(language === 'hi' ? 'कृपया नैदानिक निदान या मुख्य लक्षण दर्ज करें।' : (language === 'mr' ? 'कृपया क्लिनिकल निदान किंवा मुख्य तक्रारी नोंदवा.' : 'Please enter a clinical diagnosis or chief complaint.'));
      return;
    }

    const medSummary = medications
      .filter(m => m.name.trim().length > 0)
      .map(m => `${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`)
      .join(' • ');

    const todayDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    addPatientPrescription({
      date: todayDate,
      hospitalName: hospital.name,
      hospitalId: hospital.id,
      doctorName,
      doctorSpecialty,
      diagnosis: diagnosis.trim(),
      prescriptionSummary: medSummary || 'Prescription medications issued.',
      medications: medications.filter(m => m.name.trim().length > 0),
      clinicalAdvice: clinicalAdvice.trim(),
      abhaId
    });

    onNotify(language === 'hi'
      ? `${hospital.name} द्वारा डिजिटल नुस्खा जारी किया गया और ${patientName} की ABHA प्रोफाइल में सिंक हुआ!`
      : (language === 'mr'
        ? `${hospital.name} द्वारे डिजिटल प्रिस्क्रिप्शन जारी केले व ${patientName} च्या ABHA प्रोफाइलमध्ये सिंक झाले!`
        : `Prescription issued by ${hospital.name} and synced to ${patientName}'s ABHA profile!`));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg font-heading">
                {tr.hospital.prescriptionModalTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {tr.hospital.prescriptionModalSubtitle}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Locked Issuing Hospital Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-800">{tr.hospital.issuingFacility}:</span>
                <h3 className="font-bold text-slate-900 text-sm">{hospital.name}</h3>
                <p className="text-[11px] text-slate-500">{hospital.address} • {hospital.type}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-lg border border-blue-300">
              {hospital.id.toUpperCase()}
            </span>
          </div>

          {/* Patient Details & Attending Doctor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Patient Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{tr.hospital.patientHealthIdentity}</span>
              </div>
              
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{tr.biodata.profileHeader}</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{tr.biodata.abhaId}</label>
                <input
                  type="text"
                  required
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Doctor Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>{tr.hospital.attendingDoctor}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{tr.hospital.selectDoctor}</label>
                <select
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value);
                    const match = hospital.doctorsOnDuty.find(d => d.name === e.target.value);
                    if (match) setDoctorSpecialty(match.designation);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  {hospital.doctorsOnDuty.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.designation})
                    </option>
                  ))}
                  <option value="Dr. Resident Medical Officer">Dr. Resident Medical Officer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{tr.hospital.doctorSpecialty}</label>
                <input
                  type="text"
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          </div>

          {/* Clinical Assessment & Diagnosis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-sm">
                {tr.hospital.clinicalDiagnosisChief}
              </label>
              <span className="text-slate-400 text-[11px]">{tr.biodata.diagnosis}</span>
            </div>
            <input
              type="text"
              required
              placeholder={tr.hospital.diagnosisPlaceholder}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />

            <div>
              <label className="block font-bold text-slate-600 mb-1">{tr.hospital.vitalsRecorded}</label>
              <input
                type="text"
                value={vitalsSummary}
                onChange={(e) => setVitalsSummary(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
          </div>

          {/* Prescription Medications (Rx) Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-rose-600" />
                <label className="font-bold text-slate-900 text-sm">
                  {tr.hospital.medicationsRxTable}
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr.hospital.addMedication}</span>
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      required
                      placeholder={tr.hospital.medicineName}
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder={`${tr.biodata.dosage} (500mg)`}
                      value={med.dosage}
                      onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder={`${tr.biodata.frequency} (1-0-1)`}
                      value={med.frequency}
                      onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder={`${tr.biodata.duration} (5 Days)`}
                      value={med.duration}
                      onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Advice & Follow-Up */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {tr.hospital.clinicalAdvice}
            </label>
            <textarea
              rows={2}
              value={clinicalAdvice}
              onChange={(e) => setClinicalAdvice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              {tr.common.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{tr.hospital.issueAndSyncAbha}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
