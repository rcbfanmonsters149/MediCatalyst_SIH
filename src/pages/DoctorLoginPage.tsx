import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Building2,
  CheckCircle,
  Video,
  Clock,
  Sparkles,
  UserCheck,
  Star
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Link, useNavigate } from 'react-router-dom';

interface DoctorLoginPageProps {
  onSuccess?: () => void;
}

export const DoctorLoginPage: React.FC<DoctorLoginPageProps> = ({ onSuccess }) => {
  const { loginDoctor, hospitals, appointments } = useApp();
  const { tr, language } = useLanguage();
  const navigate = useNavigate();

  const [doctorIdInput, setDoctorIdInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetId = customId || doctorIdInput.trim();
    if (!targetId) {
      setError(
        language === 'mr' 
          ? 'कृपया डॉक्टर ओळखपत्र (Doctor ID) किंवा नाव टाका.' 
          : language === 'hi' 
            ? 'कृपया डॉक्टर आईडी या नाम दर्ज करें।' 
            : 'Please enter your Doctor ID or registered name.'
      );
      return;
    }

    if (!customId && !passcode.trim()) {
      setError(
        language === 'mr' 
          ? 'कृपया तुमचा ६-अंकी क्लिनिकल पिन टाका.' 
          : language === 'hi' 
            ? 'कृपया अपना 6-अंकों का क्लिनिकल पासकोड (पिन) दर्ज करें।' 
            : 'Please enter your 6-digit clinical security PIN.'
      );
      return;
    }

    if (!customId && passcode.trim() !== '108108' && passcode.trim() !== '123456') {
      setError(
        language === 'mr' 
          ? 'अवैध डॉक्टर पासकोड. प्रवेश नाकारला.' 
          : language === 'hi' 
            ? 'अमान्य डॉक्टर पासकोड। पहुंच अस्वीकृत।' 
            : 'Invalid clinical passcode. Access denied. (Demo PIN: 108108)'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const ok = loginDoctor(targetId);
      setIsLoading(false);

      if (ok) {
        setError('');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/doctor');
        }
      } else {
        setError(
          language === 'mr' 
            ? 'नोंदणीकृत डॉक्टर सापडला नाही. कृपया वैध ओळखपत्र प्रविष्ट करा.' 
            : language === 'hi' 
              ? 'पंजीकृत डॉक्टर नहीं मिला। कृपया मान्य पहचान दर्ज करें।' 
              : 'Doctor record not found. Please select or enter a valid Doctor ID.'
        );
      }
    }, 300);
  };

  const handleQuickLogin = (docId: string) => {
    setDoctorIdInput(docId);
    setPasscode('108108');
    handleLogin(undefined, docId);
  };

  // Sample featured doctors for quick judge demonstration
  const quickDoctors = [
    {
      id: 'doc-1',
      name: 'Dr. Kavita Sharma',
      designation: 'Medical Officer (MBBS, MD)',
      hospital: 'Rampur Primary Health Center (PHC)',
      badge: 'Active Appointments (Rameshwar Singh)',
      rating: '4.9 (148 reviews)',
      highlight: true
    },
    {
      id: 'doc-3',
      name: 'Dr. Rajesh Mehta',
      designation: 'Senior Emergency Physician (MBBS, MD, FACEM)',
      hospital: 'Bilaspur Community Health Center',
      badge: 'Trauma & Emergency Unit',
      rating: '4.8 (210 reviews)',
      highlight: false
    },
    {
      id: 'doc-7',
      name: 'Dr. Arvind Singhal',
      designation: 'Interventional Cardiologist (MD, DM)',
      hospital: 'Apex Multi-Specialty Hospital',
      badge: 'Cath Lab & Cardiac Tele-OPD',
      rating: '4.9 (92 reviews)',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
                Med<span className="text-teal-600">Catalyst</span> Clinical Desk
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                Doctor Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              ABHA HPR Verified • e-Sanjeevani Tele-OPD & Digital Prescriptions
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
            <span className="hidden sm:inline">
              {language === 'mr' ? 'नागरिक पोर्टल' : language === 'hi' ? 'नागरिक पोर्टल' : 'Citizen Portal'}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Login Content */}
      <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Title & Description */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Video className="w-3.5 h-3.5 text-teal-600" />
            <span>National Tele-Consultation & Clinical OPD Grid</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading">
            {language === 'mr' ? 'डॉक्टर क्लिनिकल लॉगिन' : language === 'hi' ? 'चिकित्सक क्लिनिकल लॉगिन' : 'Doctor Clinical Desk Login'}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'mr' 
              ? 'तुमच्या नियोजित व्हिडिओ तपासण्या, रुग्ण ईएचआर आणि डिजिटल प्रिस्क्रिप्शन व्यवस्थापित करा.'
              : language === 'hi'
                ? 'अपने निर्धारित वीडियो परामर्श, रोगी ईएचआर और डिजिटल नुस्खे प्रबंधित करें।'
                : 'Access your scheduled video appointments, review incoming patient bookings, and mint digital prescriptions on blockchain.'}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'mr' ? 'डॉक्टर ओळखपत्र किंवा नाव' : language === 'hi' ? 'डॉक्टर आईडी या नाम' : 'Doctor ID or Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. doc-1 or Dr. Kavita Sharma"
                  value={doctorIdInput}
                  onChange={(e) => setDoctorIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter Doctor ID (e.g. <span className="font-mono text-slate-600">doc-1</span>) or doctor name
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'mr' ? 'क्लिनिकल पासकोड / पिन' : language === 'hi' ? 'क्लिनिकल पासकोड / पिन' : 'Clinical Passcode / PIN'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Demo PIN: 108108"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-mono tracking-widest"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Authorized demo passcode: <span className="font-mono font-bold text-teal-700">108108</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-xl transition shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Stethoscope className="w-4 h-4" />
              <span>
                {isLoading 
                  ? 'Authenticating...' 
                  : (language === 'mr' ? 'क्लिनिकल डेस्क उघडा' : language === 'hi' ? 'क्लिनिकल डेस्क खोलें' : 'Sign In to Clinical Desk')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo 1-Click Login for Hackathon Judges */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>1-Click Demo Profiles (For SIH Judges)</span>
              </span>
            </div>

            <div className="space-y-2">
              {quickDoctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleQuickLogin(doc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                    doc.highlight
                      ? 'bg-teal-50/70 border-teal-300 hover:bg-teal-100/70'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-teal-900">
                        {doc.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                        {doc.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {doc.designation} • {doc.hospital}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {doc.rating && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>{doc.rating}</span>
                        </span>
                      )}
                      {doc.badge && (
                        <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                          ✨ {doc.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Login →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security / Compliance Badges */}
        <div className="bg-white/80 rounded-xl border border-slate-200 p-3.5 text-center text-xs text-slate-500 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 text-teal-700 font-semibold text-[11px]">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>ABHA HPR Compliant</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-slate-600 text-[11px]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Encrypted OPD</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-slate-600 text-[11px]">
            <span>Polygon Amoy Verified</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        MedCatalyst 2026 Tele-Consultation Grid • Doctor OPD Clinical Interface
      </footer>
    </div>
  );
};
