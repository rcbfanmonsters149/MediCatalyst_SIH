import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Languages, 
  Send, 
  X, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type VoiceLanguage = 'hi-IN' | 'mr-IN' | 'en-IN';

export interface LanguageOption {
  code: VoiceLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  samplePhrases: string[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
    samplePhrases: [
      'सड़क पर बाइक दुर्घटना हुई है, सिर पर गहरी चोट है',
      'सीने में तेज दर्द हो रहा है और सांस फूल रही है',
      'बुजुर्ग मरीज बेहोश हो गए हैं, तुरंत एम्बुलेंस भेजो'
    ]
  },
  {
    code: 'mr-IN',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    flag: '🚩',
    samplePhrases: [
      'रस्त्यावर अपघात झाला आहे, डोक्याला गंभीर दुखापत झाली आहे',
      'छातीत असह्य वेदना होत आहेत आणि श्वास घेता येत नाही',
      'वृद्ध रुग्ण बेशुद्ध पडले आहेत, त्वरित रुग्णवाहिका पाठवा'
    ]
  },
  {
    code: 'en-IN',
    label: 'English',
    nativeLabel: 'English',
    flag: '🌐',
    samplePhrases: [
      'Severe road bike collision with head trauma and low consciousness',
      'Elderly patient having severe crushing chest pain and cold sweat',
      'Accident victim bleeding heavily, please dispatch nearest ambulance'
    ]
  }
];

interface VoiceSOSRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: VoiceLanguage;
  onTranscriptSubmitted?: (text: string, language: VoiceLanguage) => void;
}

export const VoiceSOSRecognitionModal: React.FC<VoiceSOSRecognitionModalProps> = ({
  isOpen,
  onClose,
  initialLanguage = 'hi-IN',
  onTranscriptSubmitted
}) => {
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const { sendDispatchMessage } = useApp();

  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(initialLanguage);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasSent, setHasSent] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);

  // Initialize and handle speech recognition
  const startListening = () => {
    setSpeechError(null);
    setHasSent(false);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge, or select one of the emergency voice presets below.');
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
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        if (finalStr.trim()) {
          setTranscript((prev) => (prev ? `${prev} ${finalStr}`.trim() : finalStr.trim()));
        }
        setInterimText(interimStr);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak closer to the microphone.');
        } else {
          setSpeechError(`Voice status (${event.error}). You can also tap any of the quick spoken emergency phrases below.`);
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
    } catch (err: any) {
      console.error(err);
      setSpeechError('Unable to access microphone. Tap a voice preset phrase below.');
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
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
      startListening();
    }
  };

  // Text-to-speech confirmation back to elderly callers
  const speakVoiceConfirmation = (messageText: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let reply = '';
    if (selectedLang === 'hi-IN') {
      reply = 'आपातकालीन संदेश दर्ज कर लिया गया है। नजदीकी एम्बुलेंस तुरंत रवाना की जा रही है।';
    } else if (selectedLang === 'mr-IN') {
      reply = 'आणीबाणी संदेश प्राप्त झाला आहे. जवळची रुग्णवाहिका त्वरित पाठवली जात आहे.';
    } else {
      reply = 'Emergency voice alert recorded. Nearest ambulance is dispatched immediately.';
    }

    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = selectedLang;
    utterance.rate = 0.95; // slightly slower for elderly comprehension
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitTranscript = (finalTextToSubmit?: string) => {
    const text = finalTextToSubmit || transcript || interimText;
    if (!text.trim()) {
      setSpeechError('Please speak into the mic or choose a preset phrase below.');
      return;
    }

    stopListening();

    // Transmit to active dispatch radio comms
    sendDispatchMessage('CITIZEN', `🎙️ [Voice in ${selectedLang.split('-')[0].toUpperCase()}]: "${text.trim()}"`);
    
    // Voice feedback to user
    speakVoiceConfirmation(text);

    setHasSent(true);

    if (onTranscriptSubmitted) {
      onTranscriptSubmitted(text.trim(), selectedLang);
    }

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Preset phrase tap for elderly users who cannot speak clearly or have mic issues
  const handleSelectPreset = (phrase: string) => {
    setTranscript(phrase);
    setSpeechError(null);
    handleSubmitTranscript(phrase);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-sos-title"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close speech recognition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Elderly & Emergency Voice SOS / व्हॉइस एसओएस</span>
          </div>

          <h2 id="voice-sos-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Speak Your Emergency
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            बोलकर तुरंत सहायता मांगें • आवाजाने त्वरित मदत मागा • Hands-free recognition in 3 languages
          </p>
        </div>

        {/* 3-Language Toggle Selector (High Contrast & Big for Elderly) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>Select Language / भाषा चुनें / भाषा निवडा:</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    if (isListening) {
                      stopListening();
                    }
                  }}
                  className={`py-3 px-2 sm:px-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 transform scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <strong className="text-sm font-extrabold">{lang.nativeLabel}</strong>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {lang.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Microphone Button with Glowing Visual Audio Waveform */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          
          <div className="relative flex items-center justify-center">
            {/* Animated Pulses */}
            {isListening && (
              <>
                <span 
                  className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping pointer-events-none"
                  style={{ animationDuration: '1.8s' }}
                />
                <span 
                  className="absolute w-48 h-48 rounded-full bg-red-500/10 pointer-events-none transition-all duration-150"
                  style={{ transform: `scale(${1 + audioLevel / 100})` }}
                />
              </>
            )}

            {isSpeechSupported ? (
              <button
                type="button"
                onClick={handleToggleListening}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer z-10 ${
                  isListening
                    ? 'bg-red-600 text-white ring-8 ring-red-200 animate-pulse'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-9 h-9 sm:w-10 sm:h-10 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">Tap to Speak</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-sm">
                Voice recognition is not supported in this browser. Please use the preset phrases below.
              </div>
            )}
          </div>

          <div className="text-center">
            {isListening ? (
              <p className="text-sm font-bold text-red-600 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span>
                  {selectedLang === 'hi-IN' ? 'सुन रहे हैं... कृपया बोलें' : selectedLang === 'mr-IN' ? 'ऐकत आहोत... कृपया बोला' : 'Listening... speak your emergency clearly'}
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {selectedLang === 'hi-IN' ? 'माइक दबाएं और बोलें' : selectedLang === 'mr-IN' ? 'माईक दाबा आणि बोला' : 'Tap the microphone and speak your message'}
              </p>
            )}
          </div>

        </div>

        {/* Live Spoken Captions Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 min-h-[90px] flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Live Voice Transcript / बोले गए शब्द:
            </span>

            {transcript || interimText ? (
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                "{transcript} <span className="text-slate-400 italic">{interimText}</span>"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isListening 
                  ? (selectedLang === 'hi-IN' ? 'आवाज की पहचान हो रही है...' : selectedLang === 'mr-IN' ? 'आवाज ओळखला जात आहे...' : 'Recognizing speech in real-time...') 
                  : (selectedLang === 'hi-IN' ? 'आपके द्वारा बोले गए शब्द यहां दिखाई देंगे...' : selectedLang === 'mr-IN' ? 'तुम्ही बोललेले शब्द येथे दिसतील...' : 'Your spoken words will appear here in real-time...')}
              </p>
            )}
          </div>

          {speechError && (
            <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {speechError}
            </div>
          )}

          {hasSent && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {selectedLang === 'hi-IN' ? '✓ संदेश एम्बुलेंस और अस्पताल को भेज दिया गया है!' : selectedLang === 'mr-IN' ? '✓ संदेश रुग्णवाहिका आणि रुग्णालयाला पाठवला गेला आहे!' : '✓ Emergency voice message broadcast to ambulance and hospital desk!'}
              </span>
            </div>
          )}
        </div>

        {/* 1-Tap Elderly Spoken Presets (If elderly cannot pronounce or mic is disabled) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Or 1-Tap Emergency Preset ({currentLangObj.nativeLabel}):</span>
          </div>

          <div className="space-y-1.5">
            {currentLangObj.samplePhrases.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(phrase)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-xs font-semibold text-slate-800 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate pr-2">🗣️ "{phrase}"</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/60 font-bold px-2 py-0.5 rounded-full shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                  Broadcast
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setTranscript('');
              setInterimText('');
              setSpeechError(null);
            }}
            className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700 rounded-xl transition font-medium cursor-pointer"
          >
            Clear / मिटाएं
          </button>

          <button
            type="button"
            onClick={() => handleSubmitTranscript()}
            disabled={!transcript.trim() && !interimText.trim()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Transmit Voice SOS (रेडियो पर भेजें)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
