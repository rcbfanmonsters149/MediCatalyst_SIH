import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Radio,
  MapPin,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

interface TrafficPoliceLoginPageProps {
  onSuccess?: () => void;
}

export const TrafficPoliceLoginPage: React.FC<TrafficPoliceLoginPageProps> = ({ onSuccess }) => {
  const { loginPoliceSignal, trafficCorridor } = useApp();
  const [signalIdInput, setSignalIdInput] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (idToUse?: string) => {
    const id = idToUse || signalIdInput;
    if (!id.trim()) {
      setError('Please enter a valid Signal ID (e.g., S35) or Junction Code');
      return;
    }

    const success = loginPoliceSignal(id);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError(`Signal "${id}" not found in current emergency route. Please select one of the registered corridor posts below.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Citizen Portal</span>
          </Link>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
            Emergency Traffic Management System (ITMS)
          </span>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Header & Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading">
              Traffic Police Signal Post Login
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Authenticate your specific junction signal post to monitor incoming ambulance live GPS, remaining distance, and approach ETA.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Signal Post ID or Junction Code:
              </label>
              <div className="relative">
                <Radio className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={signalIdInput}
                  onChange={(e) => { setSignalIdInput(e.target.value); setError(''); }}
                  placeholder="e.g. S35 or J-BLR-035"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Officer Security Duty PIN:
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="PIN: 108"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Connect to Live Signal Post</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registered Demo Posts (1-Click Access) */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Registered Route Signal Posts (Quick 1-Click Login):
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● Live Emergency Feed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {trafficCorridor.signals.map((sig) => (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => handleLogin(sig.id)}
                  className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {sig.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {sig.junctionCode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {sig.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <strong>{sig.etaMinutes} min ETA</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>{sig.distanceKm} km dist</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
        MedCatalyst Integrated Emergency Dispatch • Certified Police & Traffic Administration Console
      </footer>

    </div>
  );
};
