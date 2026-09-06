import React, { useState } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

interface AmbulanceLoginPageProps {
  onSuccess?: () => void;
}

export const AmbulanceLoginPage: React.FC<AmbulanceLoginPageProps> = ({ onSuccess }) => {
  const { loginAmbulance } = useApp();
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const num = vehicleNumberInput.trim();
    if (!num) {
      setError('Please enter your ambulance vehicle registration number.');
      return;
    }

    if (!passcode.trim()) {
      setError('Please enter your 6-digit crew passcode (PIN).');
      return;
    }

    if (passcode.trim() !== '108108') {
      setError('Invalid vehicle registration number or crew passcode. Access denied.');
      return;
    }

    const success = loginAmbulance(num);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError('Invalid vehicle registration number or crew passcode. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
                Med<span className="text-emerald-600">Catalyst</span> 108 Fleet
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Paramedic Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Emergency Response Network • In-Ambulance IoT Telemetry
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Citizen Portal</span>
        </Link>
      </header>

      {/* Main Login Content */}
      <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Title & Description */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>National 108 Emergency Telemetry Grid</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Ambulance Crew Login
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Sign in with your vehicle number to access real-time GPS navigation, patient vital telemetry, and AI emergency rerouting.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }} 
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambulance Vehicle Number</span>
            </label>
            <input
              type="text"
              value={vehicleNumberInput}
              onChange={(e) => setVehicleNumberInput(e.target.value)}
              placeholder="Enter vehicle registration number"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Crew Passcode (PIN)</span>
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter 6-digit crew PIN"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Access Ambulance Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Official 108 Emergency Crew Authorization Required</span>
          </div>
        </form>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>National Health Mission • MedCatalyst Emergency Ambulance Operations Network</p>
      </footer>

    </div>
  );
};
