import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Info,
  Radio, 
  Truck, 
  Building2, 
  Stethoscope, 
  Activity, 
  HeartPulse, 
  MapPin, 
  ShieldCheck, 
  UserCheck, 
  AlertOctagon, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Clock
} from './icons';
import { useLanguage } from '../context/LanguageContext';

export interface EmergencyTrackerCardProps {
  incidentId?: string;
  title?: string;
  urgency?: 'Critical' | 'High' | 'Moderate' | 'Low' | string;
  patientCount?: number;
  initialStep?: number; // 1 to 10
  currentStep?: number;
  onStepChange?: (step: number) => void;
  interactive?: boolean;
  showControls?: boolean;
  className?: string;
}

export interface TrackerStep {
  id: number;
  label: string;
  description: string;
  phase: string;
  shortTag: string;
}

const STEP_TRANSLATIONS = {
  en: [
    { id: 1, label: 'SOS Raised', description: 'Emergency broadcast triggered with patient GPS coordinates', phase: 'Dispatch & Triage', shortTag: 'SOS' },
    { id: 2, label: 'Ambulance Assigned', description: 'Nearest emergency ambulance dispatched to scene immediately', phase: 'Dispatch & Triage', shortTag: 'Ambulance' },
    { id: 3, label: 'Hospitals Contacted', description: 'Nearest trauma facilities receiving automated priority trauma alert', phase: 'Dispatch & Triage', shortTag: 'Alert Sent' },
    { id: 4, label: 'Hospital Accepted', description: 'Receiving facility verified bed availability & accepted intake', phase: 'Hospital Intake', shortTag: 'Accepted' },
    { id: 5, label: 'Pickup', description: 'Paramedic arrived on scene; immediate triage & vitals recorded', phase: 'Scene Care', shortTag: 'Patient In' },
    { id: 6, label: 'En Route', description: 'In-transit under live IoT vitals monitoring & Green Corridor', phase: 'En Route', shortTag: 'In Transit' },
    { id: 7, label: 'Hospital Preparing', description: 'Trauma OT, ventilator bay, and surgical team primed', phase: 'OT Prep', shortTag: 'OT Primed' },
    { id: 8, label: 'Arrived', description: 'Ambulance docked at hospital emergency resuscitation bay', phase: 'Arrival', shortTag: 'ER Dock' },
    { id: 9, label: 'Treatment', description: 'Emergency Golden Hour interventions & trauma physician care', phase: 'Resuscitation', shortTag: 'Treatment' },
    { id: 10, label: 'Completed', description: 'Patient stabilized and admitted to ICU/Inpatient Ward', phase: 'Admitted', shortTag: 'Stabilized' },
  ],
  hi: [
    { id: 1, label: 'SOS शुरू हुआ', description: 'मरीज के जीपीएस स्थान के साथ आपातकालीन प्रसारण शुरू', phase: 'डिस्पैच एवं ट्राइएज', shortTag: 'SOS' },
    { id: 2, label: 'एम्बुलेंस सौंपी गई', description: 'मरीज के निकटतम उपलब्ध एम्बुलेंस तुरंत रवाना', phase: 'डिस्पैच एवं ट्राइएज', shortTag: 'एम्बुलेंस' },
    { id: 3, label: 'अस्पतालों को अलर्ट', description: 'निकटतम स्वास्थ्य केंद्रों को स्वतः आपातकालीन अलर्ट भेजा गया', phase: 'डिस्पैच एवं ट्राइएज', shortTag: 'अलर्ट' },
    { id: 4, label: 'अस्पताल ने स्वीकार किया', description: 'अस्पताल ने बिस्तर उपलब्धता सत्यापित कर मरीज स्वीकार किया', phase: 'अस्पताल स्वीकृति', shortTag: 'स्वीकृत' },
    { id: 5, label: 'मरीज पिकअप', description: 'पैरामेडिक घटनास्थल पहुंचे; तत्काल विटल्स रिकॉर्ड किए गए', phase: 'घटनास्थल देखभाल', shortTag: 'पिकअप' },
    { id: 6, label: 'अस्पताल के रास्ते में', description: 'लाइव विटल्स निगरानी एवं ग्रीन कॉरिडोर के साथ यात्रा में', phase: 'मार्ग पर', shortTag: 'ट्रांजिट' },
    { id: 7, label: 'अस्पताल में तैयारी', description: 'ट्रॉमा ओटी, वेंटिलेटर और सर्जिकल टीम तैयार', phase: 'ओटी तैयारी', shortTag: 'ओटी सज्ज' },
    { id: 8, label: 'अस्पताल पहुंचे', description: 'एम्बुलेंस अस्पताल के आपातकालीन वार्ड में पहुंची', phase: 'आगमन', shortTag: 'ईआर डॉक' },
    { id: 9, label: 'उपचार जारी', description: 'गोल्डन ऑवर आपातकालीन चिकित्सा एवं डॉक्टर द्वारा उपचार', phase: 'उपचार', shortTag: 'उपचार' },
    { id: 10, label: 'प्रक्रिया पूर्ण', description: 'मरीज स्थिर होकर आईसीयू/वार्ड में भर्ती', phase: 'भर्ती', shortTag: 'स्थिर' },
  ],
  mr: [
    { id: 1, label: 'SOS सुरू झाला', description: 'रुग्णाच्या जीपीएस स्थानासह आपत्कालीन संदेश प्रसारित', phase: 'डिस्पॅच आणि ट्रायज', shortTag: 'SOS' },
    { id: 2, label: 'रुग्णवाहिका नेमली', description: 'जवळची उपलब्ध रुग्णवाहिका तत्काळ रवाना', phase: 'डिस्पॅच आणि ट्रायज', shortTag: 'रुग्णवाहिका' },
    { id: 3, label: 'रुग्णालयांना अलर्ट', description: 'जवळच्या सर्व रुग्णालयांना प्राधान्य आपत्कालीन इशारा', phase: 'डिस्पॅच आणि ट्रायज', shortTag: 'अलर्ट' },
    { id: 4, label: 'रुग्णालयाने स्वीकारले', description: 'खाटांची उपलब्धता तपासून रुग्णालयाने विनंती स्वीकारली', phase: 'स्वीकृती', shortTag: 'स्वीकृत' },
    { id: 5, label: 'रुग्ण पिकअप', description: 'पॅरामेडिक घटनास्थळी पोहोचले; तातडीचे विटल्स तपासले', phase: 'घटनास्थळ', shortTag: 'पिकअप' },
    { id: 6, label: 'मार्गावर', description: 'थेट विटल्स देखरेख आणि ग्रीन कॉरिडॉर अंतर्गत प्रवासात', phase: 'प्रवासात', shortTag: 'मार्गावर' },
    { id: 7, label: 'रुग्णालय सज्जता', description: 'ट्रॉमा ओटी, व्हेंटिलेटर आणि वैद्यकीय पथक सज्ज', phase: 'ओटी सज्जता', shortTag: 'ओटी सज्ज' },
    { id: 8, label: 'पोहोचले', description: 'रुग्णवाहिका रुग्णालयाच्या आपत्कालीन कक्षात पोहोचली', phase: 'आगमन', shortTag: 'कक्षात' },
    { id: 9, label: 'उपचार सुरू', description: 'गोल्डन अवर अंतर्गत तातडीचे वैद्यकीय उपचार', phase: 'उपचार', shortTag: 'उपचार' },
    { id: 10, label: 'पूर्ण', description: 'रुग्ण स्थिर, आयसीयू/वॉर्डमध्ये दाखल करण्यात आले', phase: 'दाखल', shortTag: 'स्थिर' },
  ]
};

const STEP_ICONS = [
  AlertOctagon, // 1. SOS Raised
  Truck,        // 2. Ambulance Assigned
  Radio,        // 3. Hospitals Contacted
  Building2,    // 4. Hospital Accepted
  UserCheck,    // 5. Pickup
  Activity,     // 6. En Route
  HeartPulse,   // 7. Hospital Preparing
  MapPin,       // 8. Arrived
  Stethoscope,  // 9. Treatment
  ShieldCheck   // 10. Completed
];

export const EmergencyTrackerCard: React.FC<EmergencyTrackerCardProps> = ({
  incidentId = 'disp-2026-9041',
  title = 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
  urgency = 'Critical',
  patientCount = 1,
  initialStep = 3,
  currentStep: controlledStep,
  onStepChange,
  interactive = true,
  showControls = true,
  className = '',
}) => {
  const { language, tr } = useLanguage();
  const currentSteps = useMemo(() => {
    return STEP_TRANSLATIONS[language] || STEP_TRANSLATIONS.en;
  }, [language]);

  const [internalStep, setInternalStep] = useState<number>(initialStep);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showFullTimeline, setShowFullTimeline] = useState<boolean>(false);

  const activeStep = controlledStep !== undefined ? controlledStep : internalStep;
  const currentStepData = currentSteps.find((s) => s.id === activeStep) || currentSteps[0];
  const ActiveIcon = STEP_ICONS[activeStep - 1] || Activity;

  const progressPercent = Math.round((activeStep / currentSteps.length) * 100);

  const handleStepClick = (stepId: number) => {
    if (!interactive) return;
    setInternalStep(stepId);
    if (onStepChange) onStepChange(stepId);
  };

  const handlePrev = () => {
    const next = Math.max(1, activeStep - 1);
    setInternalStep(next);
    if (onStepChange) onStepChange(next);
  };

  const handleNext = () => {
    const next = Math.min(10, activeStep + 1);
    setInternalStep(next);
    if (onStepChange) onStepChange(next);
  };

  const handleReset = () => {
    setInternalStep(1);
    setIsPlaying(false);
    if (onStepChange) onStepChange(1);
  };

  // Auto playback simulation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setInternalStep((prev) => {
        if (prev >= 10) {
          setIsPlaying(false);
          return 10;
        }
        const next = prev + 1;
        if (onStepChange) onStepChange(next);
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [isPlaying, onStepChange]);

  useEffect(() => {
    if (controlledStep !== undefined) {
      setInternalStep(controlledStep);
    }
  }, [controlledStep]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden font-sans transition-all ${className}`}>
      
      {/* 1. TOP MISSION STATUS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Incident Identity & Badges */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-red-600/90 text-white rounded-lg text-xs font-mono font-black tracking-wider shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>{incidentId}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {urgency}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300 border border-white/10">
                {patientCount} {language === 'mr' ? 'रुग्ण' : language === 'hi' ? 'मरीज' : 'Patient(s)'}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE DISPATCH HUD</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight font-heading leading-snug pt-1">
              {title}
            </h3>
          </div>

          {/* Progress Percentage Circular Metric */}
          <div className="flex items-center gap-3 shrink-0 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Mission Progress
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {progressPercent}%
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300 font-mono">
              {activeStep}/10
            </div>
          </div>

        </div>

        {/* Multi-Segment Glowing Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="grid grid-cols-10 gap-1.5">
            {currentSteps.map((step) => {
              const isPast = step.id < activeStep;
              const isCurrent = step.id === activeStep;

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  title={`Stage ${step.id}: ${step.label}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isPast
                      ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                      : isCurrent
                      ? 'bg-red-500 ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900 animate-pulse'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-0.5">
            <span>Stage 1: SOS</span>
            <span className="text-emerald-400 font-bold">{currentStepData.phase}</span>
            <span>Stage 10: Complete</span>
          </div>
        </div>
      </div>

      {/* 2. HERO ACTIVE STAGE SPOTLIGHT CARD */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="p-5 rounded-2xl bg-white border-2 border-red-500/30 shadow-md shadow-red-500/5 relative overflow-hidden">
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-4">
              {/* Dynamic Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-red-600/30 shrink-0">
                <ActiveIcon className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                    Active Stage {activeStep} of 10
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Phase: <strong className="text-slate-800">{currentStepData.phase}</strong>
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                  {currentStepData.label}
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Quick Step Navigation Controls */}
            {interactive && (
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeStep <= 1}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeStep >= 10}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-red-600/20 cursor-pointer active:scale-95"
                >
                  <span>Advance Stage</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          {/* Real-Time Contextual Live Triad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Telemetry: <strong>IoT Biometrics Live</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Target: <strong>Golden Hour SLA Active</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Triage: <strong>Level-1 Trauma Priority</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. HORIZONTAL INTERACTIVE PIPELINE CHIPS */}
      <div className="px-5 sm:px-6 pb-4">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Operational Pipeline (Click to Jump)</span>
          </span>

          <button
            type="button"
            onClick={() => setShowFullTimeline(!showFullTimeline)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullTimeline ? 'Compact View' : 'View All 10 Milestone Notes'}</span>
            {showFullTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Scrollable Pipeline Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {currentSteps.map((step) => {
            const isCompleted = step.id < activeStep;
            const isActive = step.id === activeStep;
            const StepIcon = STEP_ICONS[step.id - 1] || Activity;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/25 ring-2 ring-red-400 scale-102'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200/80 hover:bg-slate-200'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                )}
                <span>{step.id}. {step.shortTag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EXPANDABLE 10-STAGE DETAILED TIMELINE (Clean, High-Density 2-Column Grid) */}
      {showFullTimeline && (
        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/60 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
            {currentSteps.map((step) => {
              const isCompleted = step.id < activeStep;
              const isActive = step.id === activeStep;
              const StepIcon = STEP_ICONS[step.id - 1] || Activity;

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={`p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-red-50/80 border-red-300 shadow-xs'
                      : isCompleted
                      ? 'bg-white border-emerald-200'
                      : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-red-950 font-black' : 'text-slate-900'}`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-1.5 py-0.2 rounded shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SIMULATION CONTROLS TOOLBAR (When showControls is enabled) */}
      {showControls && (
        <div className="p-3.5 bg-slate-100/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Simulator • Stage <strong>{activeStep}</strong> of 10</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-white shadow-xs transition cursor-pointer active:scale-95 ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Auto-Run' : 'Auto Simulate'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
