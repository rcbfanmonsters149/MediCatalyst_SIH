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
  QrCode, 
  Download, 
  Share2, 
  LogOut,
  Lock,
  Calendar,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BioDataPage: React.FC = () => {
  const { user, isLoggedIn, setIsLoggedIn, loginUser } = useApp();
  const [loginInput, setLoginInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Digital QR</span>
          </button>

          <button
            onClick={() => {
              setShareSuccess(true);
              setTimeout(() => setShareSuccess(false), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareSuccess ? 'Synced with 108 Dispatch!' : 'Share with Ambulance'}</span>
          </button>

          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>

      {/* Critical Allergy Alert Banner */}
      <div className="bg-rose-50 border-2 border-rose-400/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-rose-900">
                CRITICAL CLINICAL ALLERGIES (Life-Threatening Warning)
              </h3>
              <span className="text-[11px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded">
                High Priority
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              The following substances MUST NEVER be administered by emergency paramedics or hospital staff:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {user.allergies.map((alg, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-rose-700">{alg.allergen}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                      {alg.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Known Reaction:</strong> {alg.reaction}
                  </p>
                </div>
              ))}
            </div>
          </div>
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

              <div className="bg-white p-3 rounded-lg border border-slate-150 text-xs text-slate-700">
                <p className="font-bold text-slate-900 text-sm">{rec.diagnosis}</p>
                <p className="mt-1 text-slate-600 leading-relaxed">{rec.prescriptionSummary}</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button 
                  onClick={() => alert(`Downloading verified digital prescription ${rec.id} as PDF...`)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Digital Rx (PDF)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">Ayushman Digital Health QR</h3>
            <p className="text-xs text-slate-500">
              Scan this QR at any rural Primary Health Center (PHC) counter for instantaneous OPD registration and allergy check.
            </p>

            <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center p-4">
              <QrCode className="w-36 h-36 text-slate-800" />
            </div>

            <p className="font-mono text-xs font-bold text-emerald-800">
              ABHA: {user.healthId}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
            >
              Close QR Code
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
