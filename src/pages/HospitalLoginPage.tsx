import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Activity, 
  Stethoscope,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

interface HospitalLoginPageProps {
  onSuccess?: () => void;
}

export const HospitalLoginPage: React.FC<HospitalLoginPageProps> = ({ onSuccess }) => {
  const { loginHospital } = useApp();
  const [hospitalIdInput, setHospitalIdInput] = useState('');
  const [passcode, setPasscode] = useState('108108');
  const [error, setError] = useState('');

  const handleLogin = (idToUse?: string) => {
    const id = idToUse || hospitalIdInput;
    if (!id.trim()) {
      setError('Please enter a valid Hospital ID or Registry Code');
      return;
    }

    const success = loginHospital(id);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError('Invalid Hospital ID. Please check the ID or select one of the registered demo facilities below.');
    }
  };

  const registeredDemoHospitals = [
    {
      code: 'HOSP-RAMPUR-PHC',
      name: 'Rampur Primary Health Center (PHC)',
      type: 'Primary Health Center',
      tag: 'Rural Block 2'
    },
    {
      code: 'HOSP-BILASPUR-CHC',
      name: 'Bilaspur Community Health Center (CHC)',
      type: 'Community Health Center',
      tag: '24x7 Emergency'
    },
    {
      code: 'HOSP-SONIPAT-DH',
      name: 'Sonipat District Civil Hospital',
      type: 'District Hospital',
      tag: 'Civil Central'
    },
    {
      code: 'HOSP-APEX-01',
      name: 'Apex MedCatalyst Multi-Specialty & Level-1 Trauma Center',
      type: 'Apex Multi-Specialty',
      tag: 'Super Specialty'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight font-heading">
              Med<span className="text-blue-400">Catalyst</span> Hospital Desk
            </span>
            <span className="text-[10px] ml-2 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
              Provider Portal
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch to Citizen Portal</span>
        </Link>
      </header>

      {/* Main Login Content */}
      <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>ABDM National Health Facility Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Hospital Operations Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Authenticate to update live bed availability, manage on-duty doctor rosters & accept emergency 108 dispatches.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Hospital ID / ABDM Facility Code
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={hospitalIdInput}
                  onChange={(e) => setHospitalIdInput(e.target.value)}
                  placeholder="e.g. HOSP-RAMPUR-PHC or HOSP-BILASPUR-CHC"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff PIN / Security Key
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 6-digit hospital staff PIN"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Access Hospital Command Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Login Chips for Evaluators */}
          <div className="pt-3 border-t border-slate-700 space-y-2">
            <div className="text-[11px] font-bold uppercase text-slate-400">
              1-Click Demo Login (Select Registered Facility):
            </div>

            <div className="grid grid-cols-1 gap-2">
              {registeredDemoHospitals.map((hosp) => (
                <button
                  key={hosp.code}
                  type="button"
                  onClick={() => {
                    setHospitalIdInput(hosp.code);
                    handleLogin(hosp.code);
                  }}
                  className="w-full text-left p-2.5 bg-slate-900/60 hover:bg-slate-700/80 border border-slate-700 hover:border-blue-500 rounded-xl transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition">
                      {hosp.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: <span className="text-blue-400">{hosp.code}</span> • {hosp.tag}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        MedCatalyst Hospital Operations System • Standardized for Ayushman Bharat Digital Mission (ABDM)
      </footer>

    </div>
  );
};
