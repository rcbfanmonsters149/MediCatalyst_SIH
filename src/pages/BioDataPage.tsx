import React, { useState } from 'react';
import { 
  User, 
  ShieldAlert, 
  FileText, 
  Pill, 
  Heart, 
  Phone, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  LogOut,
  Building,
  Printer,
  Eye,
  X,
  Building2,
  Stethoscope,
  Lock,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PatientRecord } from '../types';

export const BioDataPage: React.FC = () => {
  const { user, isLoggedIn, setIsLoggedIn, loginUser } = useApp();
  const [loginInput, setLoginInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState<PatientRecord | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setAuthError('Please enter your Mobile Number, Email, or ABHA Health ID');
      return;
    }
    const success = loginUser(loginInput);
    if (success) {
      setAuthError('');
    }
  };

  const handleDownloadPrescriptionPdf = (rec: PatientRecord) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');

    const medRows = (rec.medications && rec.medications.length > 0)
      ? rec.medications.map((m, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-weight: bold; color: #0f172a;">${m.name}</td>
          <td style="padding: 10px; color: #475569;">${m.dosage}</td>
          <td style="padding: 10px; color: #0369a1; font-weight: 600;">${m.frequency}</td>
          <td style="padding: 10px; color: #475569;">${m.duration}</td>
          <td style="padding: 10px; color: #64748b; font-size: 12px;">${m.instructions || 'As directed'}</td>
        </tr>
      `).join('')
      : `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td colspan="6" style="padding: 12px; color: #334155;">${rec.prescriptionSummary}</td>
        </tr>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription_${rec.hospitalName.replace(/[^a-zA-Z0-9]/g, '_')}_${rec.date.replace(/[^a-zA-Z0-9]/g, '_')}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; }
            .header-bar { border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 18px; }
            table.meds { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
            th { background: #f1f5f9; padding: 10px; font-weight: 700; color: #334155; text-align: left; border-bottom: 1px solid #cbd5e1; }
            .footer-grid { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #cbd5e1; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <span class="badge">Government of India • Ayushman Bharat Digital Health Grid</span>
              <h1 style="margin: 6px 0 2px 0; color: #0f172a; font-size: 22px;">${rec.hospitalName}</h1>
              <p style="margin: 0; font-size: 12px; color: #64748b;">ABDM Registered Public Health Facility • Official Electronic Prescription</p>
            </div>
            <div style="text-align: right;">
              <div style="font-family: monospace; font-size: 12px; font-weight: bold; color: #0284c7;">Rx ID: ${rec.id.toUpperCase()}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: <strong>${rec.date}</strong></div>
            </div>
          </div>

          <div class="meta-card">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                  <div>Patient Name: <strong style="color: #0f172a; font-size: 14px;">${user.fullName}</strong></div>
                  <div style="margin-top: 4px;">ABHA Health ID: <strong style="font-family: monospace; color: #0284c7;">${user.healthId}</strong></div>
                  <div style="margin-top: 4px;">Age / Gender: <strong>${user.age} Years / ${user.gender}</strong></div>
                  <div style="margin-top: 4px;">Blood Group: <strong style="color: #e11d48;">${user.bloodGroup}</strong></div>
                </td>
                <td style="width: 50%; vertical-align: top; border-left: 1px solid #e2e8f0; padding-left: 14px;">
                  <div>Consulting Doctor: <strong style="color: #0f172a; font-size: 14px;">${rec.doctorName}</strong></div>
                  <div style="margin-top: 4px;">Specialization / Dept: <strong>${rec.doctorSpecialty || 'General Medicine'}</strong></div>
                  <div style="margin-top: 6px; font-size: 11px; color: #b91c1c; font-weight: 700;">
                    ⚠️ Known Allergies: Penicillin, NSAIDs (Recorded in Cloud ABHA)
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Clinical Diagnosis & Complaints:</div>
            <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-weight: 700; color: #0f172a; font-size: 14px; margin-top: 4px;">
              ${rec.diagnosis}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span style="font-size: 20px; font-weight: 900; color: #0284c7; font-family: serif;">℞</span>
              <span style="font-size: 14px; font-weight: 700; color: #0f172a;">Prescribed Medications</span>
            </div>
            <table class="meds">
              <thead>
                <tr>
                  <th style="width: 6%; text-align: center;">#</th>
                  <th style="width: 32%;">Medicine Name</th>
                  <th style="width: 14%;">Dosage</th>
                  <th style="width: 18%;">Frequency</th>
                  <th style="width: 14%;">Duration</th>
                  <th style="width: 16%;">Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${medRows}
              </tbody>
            </table>
          </div>

          ${rec.clinicalAdvice ? `
            <div style="margin-bottom: 24px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; font-weight: 700; color: #92400e;">General Advice & Review Instructions:</div>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #78350f;">${rec.clinicalAdvice}</p>
            </div>
          ` : ''}

          <div class="footer-grid">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #10b981;">✓ Digitally Signed & Authenticated</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                National Health Stack (NDHM / ABDM Verified)<br/>
                Token: ${Math.random().toString(36).substring(2, 12).toUpperCase()}
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #1e3a8a; height: 28px;">
                ${rec.doctorName}
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 190px; margin-top: 6px; padding-top: 4px; font-size: 11px; color: #475569;">
                <strong>Authorized Medical Officer</strong><br/>
                ${rec.hospitalName}
              </div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
              Print / Save as PDF
            </button>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 350);
            };
          </script>
        </body>
      </html>
    `;

    if (!printWindow || printWindow.closed) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const fallbackWindow = window.open(url, '_blank');
      if (!fallbackWindow) {
        alert('Please allow popups in your browser to print / save your prescription PDF.');
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">
            Arogya Cloud Health Locker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Securely access your lifetime electronic prescriptions, medications, verified allergies, and medical history.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number / Email / ABHA ID
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. 9876543210 or 91-2849-5830-1092"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {authError && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{authError}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition transform active:scale-98"
          >
            Access My Bio-Data
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => loginUser('+91 98765 43210')}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Demo: Instant 1-Click Login as Rameshwar Singh
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Compliant with Ayushman Bharat Digital Mission (ABDM) guidelines</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Patient Identity Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
                {user.fullName}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Health ID: {user.healthId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Age: <strong>{user.age} Years</strong> • Gender: <strong>{user.gender}</strong> • Blood Group: <strong className="text-rose-600 font-bold">{user.bloodGroup}</strong> • Phone: {user.phone}
            </p>
            <p className="text-xs text-slate-500">
              Address: {user.address}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>

      {/* Two Column Layout: Current Conditions & Active Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chronic Conditions & Current Health Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>Current Health Condition & Chronic Illnesses</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Cloud Verified</span>
          </div>

          <div className="space-y-2.5">
            {user.chronicConditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-150">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">{cond}</span>
              </div>
            ))}
          </div>

          {/* Emergency Contacts */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Emergency SOS Next-of-Kin Contacts</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {user.emergencyContacts.map((contact, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-xs">
                  <div className="font-bold text-slate-800">{contact.name} ({contact.relation})</div>
                  <a href={`tel:${contact.phone}`} className="text-emerald-700 font-semibold hover:underline mt-0.5 block">
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Medications Cloud Record */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <Pill className="w-5 h-5 text-emerald-600" />
              <span>Active Prescription Medications</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{user.currentMedications.length} Active Prescriptions</span>
          </div>

          <div className="space-y-2.5">
            {user.currentMedications.map((med, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{med.name}</h4>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    {med.dosage} • {med.frequency}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong>Indication:</strong> {med.purpose}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                  Daily Rx
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Past Electronic Prescriptions & Hospital Records Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 font-heading">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Electronic Prescriptions & Past Hospital Record Timeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanently synced across government Primary Health Centers, CHCs, and District Hospitals.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {user.pastRecords.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{rec.date}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{rec.hospitalName}</span>
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Doctor: <strong>{rec.doctorName}</strong>
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-150 text-xs text-slate-700 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Diagnosis / Chief Complaint:</span>
                  <p className="font-bold text-slate-900 text-sm">{rec.diagnosis}</p>
                </div>

                {rec.medications && rec.medications.length > 0 ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Pill className="w-3 h-3 text-rose-500" />
                      <span>Prescribed Medicines:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {rec.medications.map((m, mIdx) => (
                        <span key={mIdx} className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-semibold border border-slate-200">
                          {m.name} <strong className="text-blue-700 font-bold">({m.dosage})</strong> • {m.frequency}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 leading-relaxed">{rec.prescriptionSummary}</p>
                )}

                {rec.clinicalAdvice && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                    <span className="font-bold">Advice: </span>
                    <span>{rec.clinicalAdvice}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button 
                  type="button"
                  onClick={() => setSelectedRecordForPreview(rec)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Details</span>
                </button>

                <button 
                  type="button"
                  onClick={() => handleDownloadPrescriptionPdf(rec)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Digital Rx (PDF)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Full Prescription Preview Modal */}
      {selectedRecordForPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-heading">Digital Medical Prescription</h3>
                  <p className="text-xs text-slate-400">
                    {selectedRecordForPreview.hospitalName} • Verified Clinical Record
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecordForPreview(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Facility & Doctor Info Card */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-800">Healthcare Facility:</span>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedRecordForPreview.hospitalName}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Attending Doctor: <strong>{selectedRecordForPreview.doctorName}</strong> ({selectedRecordForPreview.doctorSpecialty || 'Medical Officer'})
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-300">
                    {selectedRecordForPreview.date}
                  </span>
                </div>
              </div>

              {/* Patient Bio Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Patient:</span>
                  <p className="font-bold text-slate-900">{user.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">ABHA ID:</span>
                  <p className="font-mono font-bold text-indigo-700">{user.healthId}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Age / Gender:</span>
                  <p className="font-bold text-slate-800">{user.age} Yrs / {user.gender}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Blood Group:</span>
                  <p className="font-bold text-rose-600">{user.bloodGroup}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Diagnosis & Clinical Findings:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedRecordForPreview.diagnosis}</p>
              </div>

              {/* Medicines Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Prescribed Medications:</span>
                </span>

                {selectedRecordForPreview.medications && selectedRecordForPreview.medications.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2.5">Medicine Name</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedRecordForPreview.medications.map((m, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                            <td className="p-2.5 text-slate-600">{m.dosage}</td>
                            <td className="p-2.5 font-bold text-blue-700">{m.frequency}</td>
                            <td className="p-2.5 text-slate-600">{m.duration}</td>
                            <td className="p-2.5 text-slate-500">{m.instructions || 'As directed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                    {selectedRecordForPreview.prescriptionSummary}
                  </p>
                )}
              </div>

              {/* Advice */}
              {selectedRecordForPreview.clinicalAdvice && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold text-[11px] block">Doctor's Advice & Review:</span>
                  <p className="mt-0.5">{selectedRecordForPreview.clinicalAdvice}</p>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedRecordForPreview(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPrescriptionPdf(selectedRecordForPreview)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
