import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Truck, MapPin, AlertTriangle, Zap } from './icons';

interface HandoverModeSelectorProps {
  className?: string;
}

export const HandoverModeSelector: React.FC<HandoverModeSelectorProps> = ({ className = '' }) => {
  const { 
    activeDispatch, 
    activeHandover, 
    setTransportMode, 
    ambulances, 
    hospitals 
  } = useApp();
  const { language } = useLanguage();

  if (!activeDispatch) return null;

  const currentMode = activeDispatch.transportMode || 'DIRECT_AMBULANCE';
  const assignedAmb = ambulances.find(a => a.id === activeDispatch.assignedAmbulanceId) || ambulances[0];
  const targetHosp = hospitals.find(h => h.id === activeDispatch.currentHospitalId) || hospitals[0];

  const isDirectRecommended = activeHandover?.directPickupRecommended || 
    (activeDispatch.ambulanceAssessment && (activeDispatch.ambulanceAssessment.gcs <= 8 || activeDispatch.ambulanceAssessment.spo2 < 85));

  const recommendationReason = activeHandover?.safetyRecommendationReason || 
    'Patient has acute clinical severity. Immediate on-site paramedic stabilization is recommended.';

  return (
    <div className={`bg-white text-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 ${className}`}>
      
      {/* Header Badge & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                🚨 {language === 'mr' ? 'आपत्कालीन समन्वय' : language === 'hi' ? 'आपातकालीन समन्वय' : 'Emergency Coordination'}
              </span>
              <span className="text-xs text-slate-600">
                {language === 'mr' ? 'रुग्णालय' : language === 'hi' ? 'अस्पताल' : 'Hospital'}: <strong className="text-slate-900 font-semibold">{targetHosp?.name}</strong>
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading tracking-tight mt-0.5">
              {language === 'mr' ? 'रुग्णवाहिका कशी प्राप्त करू इच्छिता?' : language === 'hi' ? 'आप एम्बुलेंस कैसे प्राप्त करना चाहते हैं?' : 'How would you like to receive the ambulance?'}
            </h3>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
            {language === 'mr' ? 'नियुक्त वाहन' : language === 'hi' ? 'सौंपी गई एम्बुलेंस' : 'Assigned Unit'}
          </span>
          <span className="font-mono font-bold text-emerald-700 text-sm">
            {assignedAmb?.vehicleNumber} ({assignedAmb?.type?.split(' ')[0]})
          </span>
        </div>
      </div>

      {/* Safety Override Notice if ESI-1 or Severe Trauma */}
      {isDirectRecommended && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-900 flex items-center gap-1.5">
              <span>⚠️ {language === 'mr' ? 'थेट पिकअप शिफारस' : language === 'hi' ? 'सीधे पिकअप की सिफारिश' : 'Direct Ambulance Pickup Recommended'}</span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-mono font-bold">CLINICAL SAFETY</span>
            </div>
            <p className="text-[11px] text-rose-800/90 leading-relaxed">
              {recommendationReason}
            </p>
          </div>
        </div>
      )}

      {/* Choice Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        
        {/* OPTION 1: Come to Me (Direct Ambulance) */}
        <button
          type="button"
          onClick={() => setTransportMode('DIRECT_AMBULANCE')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
            currentMode === 'DIRECT_AMBULANCE'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                currentMode === 'DIRECT_AMBULANCE' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block font-mono">
                  {language === 'mr' ? 'पर्याय १' : language === 'hi' ? 'विकल्प 1' : 'Standard Mode'}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  {language === 'mr' ? 'माझ्या स्थानावर रुग्णवाहिका बोलवा' : language === 'hi' ? 'मेरे स्थान पर एम्बुलेंस बुलाएं' : 'Request Ambulance to My Location'}
                </h4>
              </div>
            </div>
            {currentMode === 'DIRECT_AMBULANCE' && (
              <span className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-600/20 shrink-0 mt-1"></span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {language === 'mr' 
              ? 'रुग्णवाहिका थेट तुमच्या घरापर्यंत किंवा घटनास्थळापर्यंत पूर्ण अंतर पार करेल. तुम्ही तुमच्या स्थानावरच थांबा.' 
              : language === 'hi' 
              ? 'एम्बुलेंस पूरी दूरी तय करके सीधे आपके घर या घटनास्थल पर आएगी। आप अपने वर्तमान स्थान पर ही रुकें।' 
              : 'Ambulance travels the entire distance to your home or scene. Wait safely at your current coordinates.'}
          </p>

          <div className={`pt-2 border-t flex items-center justify-between text-xs font-mono ${
            currentMode === 'DIRECT_AMBULANCE' ? 'border-blue-200 text-slate-700' : 'border-slate-200 text-slate-500'
          }`}>
            <span>{language === 'mr' ? 'थेट आगमन' : language === 'hi' ? 'सीधा आगमन' : 'Direct Arrival'}: ~{assignedAmb.etaMinutes || 24} mins</span>
            <span className={currentMode === 'DIRECT_AMBULANCE' ? 'text-blue-800 font-bold' : 'text-slate-600 font-bold'}>
              100% {language === 'mr' ? 'रुग्णवाहिका प्रवास' : language === 'hi' ? 'एम्बुलेंस यात्रा' : 'Ambulance Transit'}
            </span>
          </div>
        </button>

        {/* OPTION 2: Meet Ambulance Halfway */}
        <button
          type="button"
          onClick={() => setTransportMode('MEET_HALFWAY')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
            currentMode === 'MEET_HALFWAY'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                currentMode === 'MEET_HALFWAY' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                🤝
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs uppercase font-bold tracking-wider font-mono ${
                    currentMode === 'MEET_HALFWAY' ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {language === 'mr' ? 'ग्रामीण वेगवान पर्याय' : language === 'hi' ? 'ग्रामीण द्रुत विकल्प' : 'Rural Rapid Mode'}
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                    ⚡ {language === 'mr' ? 'वेळ वाचवा' : language === 'hi' ? 'समय बचत' : 'Time Saver'}
                  </span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  {language === 'mr' ? 'अर्ध्या रस्त्यात रुग्णवाहिकेला भेटा' : language === 'hi' ? 'आधे रास्ते में एम्बुलेंस से मिलें' : 'Meet Ambulance Halfway'}
                </h4>
              </div>
            </div>
            {currentMode === 'MEET_HALFWAY' && (
              <span className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-600/20 shrink-0 mt-1 animate-pulse"></span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {language === 'mr'
              ? 'स्थानिक वाहनाने (बाईक, ऑटो, ट्रॅक्टर) सुरक्षित बैठक ठिकाणाकडे निघू शकता. रुग्णवाहिका समोरून येईल व वेगाने भेट होईल.'
              : language === 'hi'
              ? 'स्थानीय वाहन (बाइक, ऑटो, ट्रैक्टर) से सुरक्षित बैठक बिंदु की ओर निकलें। एम्बुलेंस सामने से आएगी और दोनों जल्दी मिलेंगे।'
              : 'Travel toward the hospital/meeting point using local transport (bike, auto, car). The ambulance travels toward you for a coordinated rendezvous.'}
          </p>

          <div className={`pt-2 border-t flex items-center justify-between text-xs font-mono ${
            currentMode === 'MEET_HALFWAY' ? 'border-emerald-200 text-slate-700' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'mr' ? 'भेट' : language === 'hi' ? 'मिलन' : 'Rendezvous'}: ~{activeHandover ? Math.max(activeHandover.caretakerEtaMinutes, activeHandover.ambulanceEtaMinutes) : 12} mins</span>
            </span>
            <span className="text-emerald-700 font-bold">
              ⚡ ~{activeHandover?.timeSavedMinutes || 16} mins {language === 'mr' ? 'बचत' : language === 'hi' ? 'बचत' : 'saved'}
            </span>
          </div>
        </button>

      </div>

      {/* Sub-text explanation banner */}
      <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap">
        <span>
          💡 <strong className="text-slate-800">{language === 'mr' ? 'महत्त्वाची टीप' : language === 'hi' ? 'महत्वपूर्ण सुझाव' : 'Key Benefit'}:</strong> {language === 'mr' 
            ? 'अर्ध्या रस्त्यात भेटल्याने रुग्णवाहिका लवकर उपलब्ध होते आणि तात्काळ ऑक्सिजन/प्राथमिक उपचार सुरू होतात.' 
            : language === 'hi' 
            ? 'आधे रास्ते में मिलने से मरीज को एम्बुलेंस की लाइफ-सपोर्ट सुविधा बहुत पहले मिल जाती है।' 
            : 'Meeting halfway gets paramedic life-support to the patient up to 50% faster, initiating critical in-transit oxygenation and resuscitation.'}
        </span>
      </div>

    </div>
  );
};
