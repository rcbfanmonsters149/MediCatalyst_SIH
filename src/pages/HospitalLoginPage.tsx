import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
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
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const id = hospitalIdInput.trim();
    if (!id) {
      setError('Please enter a valid Hospital ID or ABDM Registry Code.');
      return;
    }

    if (!passcode.trim()) {
      setError('Please enter your 6-digit hospital staff PIN / security key.');
      return;
    }

    if (passcode.trim() !== '108108') {
      setError('Invalid hospital facility ID or staff security PIN. Access denied.');
      return;
    }

    const success = loginHospital(id);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError('Invalid hospital facility ID or staff security PIN. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans">
      
      {/* Top Bar */}
      <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
              Med<span className="text-blue-600">Catalyst</span> Hospital Desk
            </span>
            <span className="text-[10px] ml-2 uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Provider Portal
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch to Citizen Portal</span>
        </Link>
      </header>

      {/* Main Login Content */}
      <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>ABDM National Health Facility Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Hospital Operations Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authenticate to update live bed availability, manage on-duty doctor rosters & accept emergency 108 dispatches.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Hospital ID / ABDM Facility Code
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={hospitalIdInput}
                  onChange={(e) => setHospitalIdInput(e.target.value)}
                  placeholder="Enter ABDM Hospital Facility ID"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Staff PIN / Security Key
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 6-digit hospital staff PIN"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Access Hospital Command Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Official ABDM Healthcare Facility Authorization Required</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        MedCatalyst Hospital Operations System • Standardized for Ayushman Bharat Digital Mission (ABDM)
      </footer>

    </div>
  );
};
