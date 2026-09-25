import React, { useState } from 'react';
import { 
  Video, 
  Phone, 
  Clock, 
  Calendar, 
  Building2, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Stethoscope, 
  ChevronDown, 
  ChevronUp, 
  X,
  Sparkles,
  AlertCircle
} from '../icons';
import { TeleAppointment } from '../../types';

interface DoctorCallHistoryCardProps {
  appointment: TeleAppointment;
}

export const DoctorCallHistoryCard: React.FC<DoctorCallHistoryCardProps> = ({ appointment }) => {
  const [showFullPrescription, setShowFullPrescription] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const rx = appointment.prescription;
  const talkTimeDisplay = appointment.actualStartTime && appointment.actualEndTime 
    ? `${appointment.actualStartTime} – ${appointment.actualEndTime}`
    : appointment.timeSlot || '10:00 AM – 10:20 AM';

  const durationDisplay = appointment.actualDurationMinutes 
    ? `${appointment.actualDurationMinutes} mins talk time`
    : '15 mins talk time';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-teal-300 hover:shadow-md">
      
      {/* 1. TOP CALL HEADER: Doctor & Call Timings */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Doctor Info */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-black text-lg shrink-0 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading text-white">
                  {appointment.doctorName}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Call Completed</span>
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium mt-0.5">
                {appointment.doctorSpecialty}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{appointment.hospitalName}</span>
              </div>
            </div>
          </div>

          {/* Call Date, Exact Time & Duration HUD */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 flex flex-col sm:items-end justify-center shrink-0 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              <span>{appointment.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-black text-emerald-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{talkTimeDisplay}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-teal-200">
              <Video className="w-3 h-3 text-teal-300" />
              <span>{durationDisplay} • Tele-OPD Video</span>
            </div>
          </div>

        </div>

        {/* Symptoms / Reason for Call */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-teal-300">Reason / Symptoms:</span>
            <span className="italic text-slate-200">"{appointment.symptoms}"</span>
          </div>
          {appointment.tokenNumber && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-teal-200">
              Token: {appointment.tokenNumber}
            </span>
          )}
        </div>
      </div>

      {/* 2. PRESCRIPTION SECTION UNDER EACH CALL */}
      <div className="p-5 sm:p-6 bg-slate-50/60 border-t border-slate-200 space-y-4">
        
        {/* Prescription Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ℞
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 font-heading flex items-center gap-2">
                <span>Official e-Prescription</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ABDM Verified
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Issued by {appointment.doctorName} following the tele-consultation session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print or Save Printable e-Prescription"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Print / Save Rx</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullPrescription(!showFullPrescription)}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title={showFullPrescription ? "Collapse prescription" : "Expand prescription"}
            >
              {showFullPrescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Prescription Body */}
        {showFullPrescription && (
          <div className="rounded-2xl bg-white border border-emerald-200 p-4 sm:p-5 shadow-xs space-y-4">
            
            {/* Diagnosis & Clinical Findings */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-900">
                Clinical Diagnosis
              </span>
              <p className="text-sm font-bold text-slate-900 font-heading">
                {rx?.diagnosis || appointment.clinicalNotes || 'Acute Symptomatic Management & Tele-Triage Review'}
              </p>
            </div>

            {/* Prescribed Medications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span>Prescribed Medications ({rx?.medications?.length || 0})</span>
                <span className="text-[10px] font-semibold text-emerald-700">Available at Jan Aushadhi Kendras</span>
              </div>

              {rx?.medications && rx.medications.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                  {rx.medications.map((med, idx) => (
                    <div key={idx} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-emerald-50/20 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {med.name}
                          </span>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {med.dosage}
                          </span>
                        </div>
                        {med.instructions && (
                          <p className="text-[11px] text-slate-500 pl-7">
                            ↳ {med.instructions}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                          {med.frequency}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {med.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-500">
                  No oral medications prescribed for this consult. General rest and observation advised.
                </div>
              )}
            </div>

            {/* Doctor's Advice & Patient Instructions */}
            {(rx?.instructions || rx?.advice) && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Doctor's Clinical Advice & Precautions
                </span>
                {rx.instructions && (
                  <p className="text-slate-700 font-medium">
                    • {rx.instructions}
                  </p>
                )}
                {rx.advice && (
                  <p className="text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 font-semibold text-[11px]">
                    ⚠️ <strong>Safety Warning:</strong> {rx.advice}
                  </p>
                )}
              </div>
            )}

            {/* Doctor Signature & Timestamp Footer */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {rx?.doctorSignature || `${appointment.doctorName} (Digitally Signed)`}
                </span>
              </div>
              <div className="font-mono text-slate-400">
                Issued: {rx?.issuedAt || `${appointment.date}, ${talkTimeDisplay}`}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. PRINTABLE OFFICIAL E-PRESCRIPTION MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Printable e-Prescription Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Printable Sheet Preview */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto font-sans bg-white print:p-0">
              
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                    National Tele-OPD Healthcare Network
                  </span>
                  <h2 className="text-xl font-black text-slate-900 font-heading">
                    {appointment.hospitalName}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tele-Consultation OPD Wing • Ayushman Bharat Digital Mission (ABDM)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-teal-700 font-heading">℞</span>
                  <p className="text-[10px] font-mono text-slate-500">
                    Rx ID: {rx?.id || 'RX-2026-MEDCATALYST'}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Vitals Table */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Patient Details</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{appointment.patientName}</p>
                  <p className="text-slate-600">Age: {appointment.patientAge} Y • Gender: {appointment.patientGender}</p>
                  <p className="font-mono text-slate-500 text-[11px]">ABHA: {appointment.patientAbhaId}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Consulting Medical Officer</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{appointment.doctorName}</p>
                  <p className="text-slate-600">{appointment.doctorSpecialty}</p>
                  <p className="text-teal-700 font-semibold mt-0.5">Call Talk Time: {talkTimeDisplay} ({appointment.date})</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Diagnosis / Clinical Impression
                </span>
                <p className="text-sm font-bold text-slate-900 p-2.5 rounded-lg bg-teal-50/60 border border-teal-200">
                  {rx?.diagnosis || appointment.symptoms}
                </p>
              </div>

              {/* Medications Table */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Rx Prescribed Medications
                </span>
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Medication Name</th>
                      <th className="p-2.5">Dosage</th>
                      <th className="p-2.5">Frequency</th>
                      <th className="p-2.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx?.medications?.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {m.name}
                          {m.instructions && <div className="text-[10px] text-slate-500 font-normal">{m.instructions}</div>}
                        </td>
                        <td className="p-2.5 font-mono">{m.dosage}</td>
                        <td className="p-2.5">{m.frequency}</td>
                        <td className="p-2.5">{m.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Doctor Notes & Advice */}
              {(rx?.instructions || rx?.advice) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Advice & Follow Up</span>
                  {rx.instructions && <p className="text-slate-700">• {rx.instructions}</p>}
                  {rx.advice && <p className="text-amber-900 font-semibold">• {rx.advice}</p>}
                </div>
              )}

              {/* Digital Signature */}
              <div className="pt-6 border-t-2 border-slate-200 flex items-end justify-between">
                <div className="text-[10px] text-slate-400">
                  <p>Certified Digital Prescription under NDHM Telemedicine Guidelines 2020.</p>
                  <p>Valid at all Government Jan Aushadhi & Registered Pharmacies.</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="inline-block border-b border-slate-400 pb-1 px-4 text-xs font-bold text-slate-900 font-heading">
                    {rx?.doctorSignature || appointment.doctorName}
                  </div>
                  <p className="text-[10px] text-slate-500">Medical Officer Digital Stamp</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
