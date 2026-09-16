import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Languages, 
  Send, 
  X, 
  CheckCircle2, 
  MapPin,
  AlertTriangle,
  Truck,
  ArrowRight
} from './icons';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export type VoiceLanguage = 'hi-IN' | 'mr-IN' | 'en-IN';

export interface EmergencyPreset {
  label: string;
  icon: string;
  en: string;
  hi: string;
  mr: string;
}

const EMERGENCY_PRESETS: EmergencyPreset[] = [
  {
    label: 'Road Accident',
    icon: '🚗',
    en: 'Severe road collision, patient bleeding heavily with head injury',
    hi: 'सड़क पर भीषण दुर्घटना, सिर पर गहरी चोट और भारी रक्तस्राव',
    mr: 'रस्त्यावर भीषण अपघात, डोक्याला गंभीर दुखापत आणि रक्तस्त्राव'
  },
  {
    label: 'Cardiac / Heart',
    icon: '🫀',
    en: 'Crushing chest pain, left arm numbness and breathlessness',
    hi: 'सीने में असहनीय दर्द, बाएं हाथ में सुन्नता और सांस फूलना',
    mr: 'छातीत असह्य वेदना, डाव्या हाताला मुंग्या आणि धाप लागणे'
  },
  {
    label: 'Maternity Labor',
    icon: '👶',
    en: 'Active labor pains with severe water break, urgent delivery transit needed',
    hi: 'प्रसव पीड़ा अत्यधिक बढ़ गई है, तुरंत प्रसूति एम्बुलेंस की आवश्यकता',
    mr: 'प्रसूती वेदना तीव्र झाल्या आहेत, तत्काळ रुग्णवाहिकेची गरज'
  },
  {
    label: 'Unconscious / Stroke',
    icon: '🧠',
    en: 'Patient suddenly collapsed, unresponsive with slurred speech',
    hi: 'मरीज अचानक बेहोश हो गए हैं, कोई प्रतिक्रिया नहीं दे रहे',
    mr: 'रुग्ण अचानक बेशुद्ध पडले आहेत, हालचाल थांबली आहे'
  }
];

interface RaiseAmbulanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDispatch: (problemText: string, voiceTranscript?: string) => void;
}

export const RaiseAmbulanceRequestModal: React.FC<RaiseAmbulanceRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitDispatch
}) => {
  const { userLocation } = useApp();
  const { language, tr } = useLanguage();

  // Convert system language code to speech recognition locale
  const initialSpeechLang: VoiceLanguage = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(initialSpeechLang);

  const [problemText, setProblemText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);

  // Sync selected language when modal opens or system language changes
  useEffect(() => {
    if (isOpen) {
      setSelectedLang(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN');
      setIsConfirmed(false);
      setSpeechError(null);
    }
  }, [isOpen, language]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        language === 'mr'
          ? 'तुमच्या ब्राउझरमध्ये व्हॉइस रेकग्निशन उपलब्ध नाही. कृपया थेट टाईप करा किंवा खालील पर्याय निवडा.'
          : language === 'hi'
          ? 'आपके ब्राउज़र में वॉइस सुविधा समर्थित नहीं है। कृपया सीधे टाइप करें या नीचे दिए गए विकल्पों को चुनें।'
          : 'Speech recognition is not supported in this browser. Please type directly or pick a quick preset below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        audioIntervalRef.current = setInterval(() => {
          setAudioLevel(Math.floor(Math.random() * 60) + 40);
        }, 120);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          }
        }
        if (finalStr.trim()) {
          setProblemText((prev) => (prev ? `${prev} ${finalStr}`.trim() : finalStr.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(
            language === 'mr'
              ? 'मायक्रोफोन परवानगी नाकारली गेली आहे. कृपया ब्राउझरमध्ये मायक्रोफोन चालू करा.'
              : language === 'hi'
              ? 'माइक्रोफोन की अनुमति अवरुद्ध है। कृपया सेटिंग्स में माइक्रोफोन की अनुमति दें।'
              : 'Microphone permission blocked. Please allow mic access in your browser.'
          );
        } else if (event.error === 'no-speech') {
          setSpeechError(
            language === 'mr'
              ? 'आवाज ऐकू आला नाही. कृपया माईकजवळ स्पष्ट बोला.'
              : language === 'hi'
              ? 'कोई आवाज नहीं सुनी गई। कृपया माइक के पास स्पष्ट बोलें।'
              : 'No speech detected. Please speak closer to the microphone.'
          );
        } else {
          setSpeechError(`Voice: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
        }
        setAudioLevel(0);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setSpeechError('Microphone unavailable. Please type your emergency directly.');
      stopListening();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setAudioLevel(0);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if ('speechSynthesis' in window) {
        const unlock = new SpeechSynthesisUtterance('');
        unlock.volume = 0;
        window.speechSynthesis.speak(unlock);
      }
      startListening();
    }
  };

  const handleSelectPreset = (preset: EmergencyPreset) => {
    const text = selectedLang === 'mr-IN' ? preset.mr : selectedLang === 'hi-IN' ? preset.hi : preset.en;
    setProblemText(text);
    setSpeechError(null);
  };

  const speakConfirmationVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let reply = '';
    if (selectedLang === 'hi-IN') {
      reply = 'एम्बुलेंस अनुरोध दर्ज कर लिया गया है। नजदीकी 108 एम्बुलेंस तुरंत रवाना हो रही है।';
    } else if (selectedLang === 'mr-IN') {
      reply = 'रुग्णवाहिका विनंती नोंदवली गेली आहे. जवळची 108 रुग्णवाहिका तात्काळ निघत आहे.';
    } else {
      reply = 'Ambulance request confirmed. Nearest 108 ambulance is dispatched immediately.';
    }

    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProblem = problemText.trim();
    if (!finalProblem) {
      setSpeechError(
        language === 'mr'
          ? 'कृपया समस्येचे वर्णन टाईप करा किंवा माईकमध्ये बोला.'
          : language === 'hi'
          ? 'कृपया आपातकालीन समस्या टाइप करें या माइक में बोलें।'
          : 'Please describe the emergency by typing or speaking.'
      );
      return;
    }

    stopListening();
    speakConfirmationVoice();
    onSubmitDispatch(finalProblem, finalProblem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-150 relative z-10 space-y-5 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                {tr.citizen.raiseAmbulanceModalTitle}
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                108 SOS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tr.citizen.raiseAmbulanceModalDesc}
            </p>
          </div>
        </div>

        {/* Language Selection Bar (Inside Modal) */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 px-1">
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>Speech / Input Language:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedLang('en-IN')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLang === 'en-IN'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              🌐 English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('hi-IN')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLang === 'hi-IN'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              🇮🇳 हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('mr-IN')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLang === 'mr-IN'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              🚩 मराठी
            </button>
          </div>
        </div>

        {/* Step 1: Input (Type OR Speak) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                {tr.citizen.typeOrSpeakLabel}
              </label>
              {problemText && (
                <button
                  type="button"
                  onClick={() => setProblemText('')}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition"
                >
                  Clear Text
                </button>
              )}
            </div>

            {/* Input Surface with Integrated Mic Button */}
            <div className="relative">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder={tr.citizen.typeProblemPlaceholder}
                rows={4}
                className="w-full p-4 pr-14 rounded-2xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900 text-sm placeholder:text-slate-400 outline-hidden transition shadow-inner resize-none font-sans"
              />

              {/* In-box Speak Button */}
              <button
                type="button"
                onClick={handleToggleListening}
                className={`absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/30'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title={isListening ? tr.citizen.stopListeningLabel : tr.citizen.tapToSpeak}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {/* Listening Indicator Bar */}
            {isListening && (
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>{tr.citizen.listeningNow} ({selectedLang.split('-')[0].toUpperCase()})</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 bg-red-500 rounded-full transition-all duration-100"
                      style={{ height: `${Math.max(6, Math.min(22, (audioLevel * (i + 1)) % 24))}px` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Speech Error Banner */}
            {speechError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                ⚠️ {speechError}
              </p>
            )}
          </div>

          {/* Quick 1-Click Symptom Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick 1-Click Preset Shortcuts:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMERGENCY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all text-xs group cursor-pointer"
                >
                  <span className="text-base">{preset.icon}</span>
                  <p className="font-bold text-slate-800 group-hover:text-emerald-700 mt-1 leading-tight">
                    {preset.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Confirmation Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{tr.citizen.reviewHeading}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Review & Confirm
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium min-h-[36px]">
              {problemText ? (
                <span className="text-slate-900 font-semibold leading-relaxed">"{problemText}"</span>
              ) : (
                <span className="text-slate-400 italic">No symptoms entered yet. Type above or tap the mic button.</span>
              )}
            </div>

            {/* Live Telemetry Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[280px]">
                  Pickup: <strong>{userLocation?.areaName || 'Live GPS Coordinates'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 font-bold text-red-600">
                <span>🚑 Nearest 108: <strong>~6 mins ETA</strong></span>
              </div>
            </div>
          </div>

          {/* Step 3: Final Submit Button */}
          <button
            type="submit"
            disabled={!problemText.trim()}
            className={`w-full h-14 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              problemText.trim()
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30 transform hover:scale-101 active:scale-99'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{tr.citizen.confirmAndDispatch}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </form>

      </div>
    </div>
  );
};

