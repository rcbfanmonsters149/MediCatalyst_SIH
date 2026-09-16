import React, { useState } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Radio
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Link } from 'react-router-dom';

interface AmbulanceLoginPageProps {
  onSuccess?: () => void;
}

export const AmbulanceLoginPage: React.FC<AmbulanceLoginPageProps> = ({ onSuccess }) => {
  const { loginAmbulance, ambulances } = useApp();
  const { tr, language } = useLanguage();
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const num = vehicleNumberInput.trim();
    if (!num) {
      setError(language === 'mr' ? 'कृपया नोंदणीकृत रुग्णवाहिका क्रमांक टाका.' : language === 'hi' ? 'कृपया पंजीकृत एम्बुलेंस संख्या दर्ज करें।' : 'Please enter your ambulance vehicle registration number.');
      return;
    }

    if (!passcode.trim()) {
      setError(language === 'mr' ? 'कृपया तुमचा ६-अंकी पिन टाका.' : language === 'hi' ? 'कृपया अपना 6-अंकों का पासकोड (पिन) दर्ज करें।' : 'Please enter your 6-digit crew passcode (PIN).');
      return;
    }

    if (passcode.trim() !== '108108') {
      setError(language === 'mr' ? 'अवैध वाहन क्रमांक किंवा पासकोड. प्रवेश नाकारला.' : language === 'hi' ? 'अमान्य वाहन संख्या या पासकोड। पहुंच अस्वीकृत।' : 'Invalid vehicle registration number or crew passcode. Access denied.');
      return;
    }

    const success = loginAmbulance(num);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
    } else {
      setError(language === 'mr' ? 'अवैध वाहन क्रमांक किंवा पासकोड. प्रवेश नाकारला.' : language === 'hi' ? 'अमान्य वाहन संख्या या पासकोड। पहुंच अस्वीकृत।' : 'Invalid vehicle registration number or crew passcode. Access denied.');
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

        <div className="flex items-center gap-2.5">
          <LanguageSelector variant="light" />
          <Link
            to="/"
            className="text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{language === 'mr' ? 'नागरिक पोर्टल' : language === 'hi' ? 'नागरिक पोर्टल' : 'Back to Citizen Portal'}</span>
          </Link>
        </div>
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
            {tr.ambulance.loginTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {tr.ambulance.loginSubtitle}
          </p>
        </div>

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
              <span>{tr.ambulance.vehicleNo}</span>
            </label>
            <input
              type="text"
              value={vehicleNumberInput}
              onChange={(e) => setVehicleNumberInput(e.target.value)}
              placeholder="e.g. MH-12-AMB-1081"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'mr' ? 'चालक पिन (108108)' : language === 'hi' ? 'चालक पिन (108108)' : 'Crew Passcode PIN (108108)'}</span>
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="108108"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{tr.ambulance.loginBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Ambulance Selector */}
          {ambulances && ambulances.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {tr.ambulance.selectVehicle}:
              </span>
              <div className="space-y-1.5">
                {ambulances.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setVehicleNumberInput(a.vehicleNumber);
                      setPasscode('108108');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-mono font-bold text-slate-900">{a.vehicleNumber}</span>
                    <span className="text-slate-500 text-[11px]">{a.driverName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
