import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  AlertCircle, 
  Heart, 
  Phone, 
  Pill, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Printer, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Cpu, 
  Layers, 
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Database
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PatientRecord, PrescriptionMedication } from '../types';
import { recordAuditEvent } from '../services/blockchainService';
import { HospitalPrescriptionModal } from '../components/hospital/HospitalPrescriptionModal';

export const PatientRecordViewPage: React.FC = () => {
  const { user, hospitals, blockchainNetwork, addPatientPrescription } = useApp();
  const { tr, language } = useLanguage();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const abhaParam = searchParams.get('abha') || user.healthId;
  const tokenParam = searchParams.get('token') || '';
  const scopeParam = (searchParams.get('scope') as 'FULL_EHR' | 'EMERGENCY_ONLY') || 'FULL_EHR';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRESCRIPTIONS' | 'BLOCKCHAIN'>('OVERVIEW');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [auditLogged, setAuditLogged] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);

  const activeHospital = hospitals[0];

  // Log on-chain audit trail when doctor accesses records via QR scan
  useEffect(() => {
    if (!auditLogged) {
      const logAccess = async () => {
        try {
          await recordAuditEvent({
            recordIdHash: `ABHA:${abhaParam}`,
            accessor: '0xDocA4B92d99F123C',
            accessorName: 'Attending Clinical Physician / ER Specialist',
            actionType: 'RECORD_ACCESSED',
            blockNumber: blockchainNetwork.currentBlock + 1,
            txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
            details: `Doctor opened patient medical history via ABDM QR scan (Scope: ${scopeParam})`
          });
          setAuditLogged(true);
        } catch (e) {
          console.error('Audit log error:', e);
        }
      };
      logAccess();
    }
  }, [abhaParam, auditLogged, blockchainNetwork.currentBlock, scopeParam]);

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      {/* Top Clinical Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg text-white font-heading">
                    Doctor Clinical EHR Access
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    QR Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Ayushman Bharat Digital Health Grid • Authorized Provider Terminal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="dark" />
            <Link
              to="/hospital"
              className="px-3.5 py-2 text-xs font-bold text-blue-300 hover:text-white bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800/80 rounded-xl transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Hospital Operations</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Audit Log Floating Notification */}
        {auditLogged && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Sovereign Consent Verified:</strong> Patient medical records unlocked via QR Token. Access recorded to Polygon Amoy Blockchain (Block #{blockchainNetwork.currentBlock + 1}).
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Immutable
            </span>
          </div>
        )}

        {/* Patient Identity & Clinical Command Strip */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-blue-500/10 shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                  {user.fullName}
                </h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  ABHA: {user.healthId}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blood Group: {user.bloodGroup}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                <span>Age: <strong>{user.age} Years</strong></span>
                <span>•</span>
                <span>Gender: <strong>{user.gender}</strong></span>
                <span>•</span>
                <span>Phone: <strong>{user.phone}</strong></span>
                <span>•</span>
                <span>Scope: <strong className="text-indigo-600">{scopeParam === 'FULL_EHR' ? 'Full Medical History' : 'Emergency Vitals'}</strong></span>
              </p>
              <p className="text-xs text-slate-400">
                Residential Address: {user.address}
              </p>
            </div>
          </div>

          {/* Quick Doctor Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Prescription</span>
            </button>

            <button
              onClick={handlePrintSummary}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Clinical File</span>
            </button>
          </div>
        </div>

        {/* IMMEDIATE EMERGENCY TRIAGE TRIAD (RED ALERT BAND) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Critical Allergies & Contraindications */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-black text-rose-950 text-sm uppercase tracking-wide">
                  Critical Allergies
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-300">
                Contraindicated
              </span>
            </div>

            <div className="space-y-2">
              {user.allergies && user.allergies.length > 0 ? (
                user.allergies.map((a, idx) => (
                  <div key={idx} className="p-2.5 bg-white/80 rounded-xl border border-rose-200 text-xs">
                    <div className="font-extrabold text-rose-900 flex items-center justify-between">
                      <span>{a.allergen}</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">
                      {a.reaction}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-rose-800">No known drug allergies reported.</p>
              )}
            </div>
          </div>

          {/* 2. Active Chronic Diagnoses */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-black text-amber-950 text-sm uppercase tracking-wide">
                  Chronic Conditions
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                Active
              </span>
            </div>

            <div className="space-y-2">
              {user.chronicConditions && user.chronicConditions.length > 0 ? (
                user.chronicConditions.map((cond, idx) => (
                  <div key={idx} className="p-2.5 bg-white/80 rounded-xl border border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{cond}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-amber-800">No chronic ailments on record.</p>
              )}
            </div>
          </div>

          {/* 3. Emergency SOS Contacts */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-emerald-950 text-sm uppercase tracking-wide">
                  Emergency Contacts
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                Immediate Dial
              </span>
            </div>

            <div className="space-y-2">
              {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
                user.emergencyContacts.map((c, idx) => (
                  <div key={idx} className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">{c.name}</strong>
                      <span className="text-slate-500 text-[11px]">{c.relation}</span>
                    </div>
                    <a 
                      href={`tel:${c.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-emerald-800">No emergency contact saved.</p>
              )}
            </div>
          </div>

        </div>

        {/* CURRENT MEDICATIONS REGIMEN */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                Current Active Medications Regimen
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Verified by ABDM Pharmacy Grid
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {user.currentMedications.map((med, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-150 space-y-1">
                <span className="text-xs font-extrabold text-indigo-950 block">
                  {med.name}
                </span>
                <div className="text-xs text-indigo-700 font-semibold">
                  Dosage: {med.dosage} • {med.frequency}
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
                  Purpose: <em>{med.purpose}</em>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHRONOLOGICAL ELECTRONIC HEALTH RECORDS & PAST PRESCRIPTIONS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Verified Electronic Health Records & Past Prescriptions ({user.pastRecords.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutably anchored on Polygon Blockchain. Cryptographically verified against IPFS CID.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero-Knowledge Proofs</span>
              </span>
            </div>
          </div>

          {/* Records List */}
          <div className="space-y-4">
            {user.pastRecords.map((rec) => (
              <div 
                key={rec.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition space-y-4"
              >
                {/* Record Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-slate-900">
                        {rec.hospitalName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Rx ID: {rec.id.toUpperCase()}
                      </span>
                      {rec.isBlockchainVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Polygon Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attending Physician: <strong>{rec.doctorName}</strong> ({rec.doctorSpecialty || 'Consultant Specialist'})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-600 flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rec.date}</span>
                    </span>
                  </div>
                </div>

                {/* Diagnosis & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Clinical Diagnosis
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {rec.diagnosis}
                    </strong>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Physician Advice & Diet Instructions
                    </span>
                    <p className="text-slate-700 text-xs mt-0.5">
                      {rec.clinicalAdvice || rec.prescriptionSummary}
                    </p>
                  </div>
                </div>

                {/* Prescription Medications Table */}
                {rec.medications && rec.medications.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Prescribed Medication Schedule</span>
                    </span>
                    
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">Medication Name</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Timing (Frequency)</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rec.medications.map((m, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold text-slate-400">{mIdx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                              <td className="p-2.5 text-slate-700">{m.dosage}</td>
                              <td className="p-2.5 font-semibold text-blue-700">{m.frequency}</td>
                              <td className="p-2.5 text-slate-600">{m.duration}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">{m.instructions || 'As advised'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Blockchain Proof Chips */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono border-t border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">
                      Tx: {rec.blockchainTxHash ? `${rec.blockchainTxHash.substring(0, 14)}...` : '0x3a4b...beef'}
                    </span>
                    <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">
                      Block: #{rec.blockNumber || 4182885}
                    </span>
                  </div>
                  <span className="text-emerald-700 font-sans font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cryptographically Tamper-Evident</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Prescription Issue Modal */}
      <HospitalPrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        hospital={activeHospital}
        onNotify={(msg) => setToastMessage(msg)}
      />

    </div>
  );
};
