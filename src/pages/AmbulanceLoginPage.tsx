import React, { useState } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Navigation,
  Radio,
  MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

interface AmbulanceLoginPageProps {
  onSuccess?: () => void;
}

export const AmbulanceLoginPage: React.FC<AmbulanceLoginPageProps> = ({ onSuccess }) => {
  const { loginAmbulance, ambulances } = useApp();
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [passcode, setPasscode] = useState('108108');
  const [error, setError] = useState('');

  const handleLogin = (vehNumberToUse?: string) => {
    const num = vehNumberToUse || vehicleNumberInput;
    if (!num.trim()) {
      setError('Please enter your vehicle registration number (e.g., HR-10-EM-1081)');
      return;
    }

    const success = loginAmbulance(num);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError(`Vehicle number "${num}" not found in registered 108 emergency fleet. Please select one of the registered units below.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight font-heading text-white">
              Med<span className="text-emerald-400">Catalyst</span> 108 Fleet Cockpit
            </span>
            <span className="text-[10px] ml-2 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Paramedic Portal
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch to Citizen Portal</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>National 108 Emergency Telemetry Grid</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            Ambulance Crew Login
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sign in with your vehicle number to access live GPS navigation, IoT vitals telemetry, and AI emergency rerouting.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }} 
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambulance Vehicle Number</span>
            </label>
            <input
              type="text"
              value={vehicleNumberInput}
              onChange={(e) => setVehicleNumberInput(e.target.value)}
              placeholder="e.g. HR-10-EM-1081"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <p className="text-[11px] text-slate-500">
              Format: HR-10-EM-1081 or amb-01
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Crew Passcode (PIN)</span>
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Default: 108108"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-extrabold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Access Ambulance Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Vehicles (1-Tap Fast Login) */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Registered Fleet Units (1-Click Login):
          </div>
          <div className="space-y-2">
            {ambulances.map((amb) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => {
                  setVehicleNumberInput(amb.vehicleNumber);
                  handleLogin(amb.vehicleNumber);
                }}
                className="w-full p-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white group-hover:text-emerald-400 transition">
                      {amb.vehicleNumber}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {amb.type.includes('ALS') ? 'ALS' : 'BLS'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Driver: <span className="text-slate-300">{amb.driverName}</span> • Base: {amb.hospitalName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition">
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>National Health Mission • MedCatalyst Emergency Ambulance Operations Network</p>
      </footer>

    </div>
  );
};
