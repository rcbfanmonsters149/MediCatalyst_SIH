import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Info } from './icons';
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
  eta?: string;
}

const STEP_TRANSLATIONS = {
  en: [
    { id: 1, label: 'SOS Raised', description: 'Emergency broadcast triggered with patient GPS coordinates' },
    { id: 2, label: 'Ambulance Assigned', description: 'Nearest ambulance to patient GPS coordinates dispatched immediately' },
    { id: 3, label: 'Hospitals Contacted', description: 'Nearest facilities receiving automated priority trauma alert' },
    { id: 4, label: 'Hospital Accepted', description: 'Receiving facility verified bed availability & accepted intake' },
    { id: 5, label: 'Pickup', description: 'Paramedic arrived on scene; immediate triage & vitals recorded' },
    { id: 6, label: 'En Route', description: 'In-transit under live IoT vitals monitoring & Green Corridor' },
    { id: 7, label: 'Hospital Preparing', description: 'Trauma OT, ventilator bay, and surgical team primed' },
    { id: 8, label: 'Arrived', description: 'Ambulance docked at hospital emergency resuscitation bay' },
    { id: 9, label: 'Treatment', description: 'Emergency Golden Hour interventions & trauma physician care' },
    { id: 10, label: 'Completed', description: 'Patient stabilized and admitted to ICU/Inpatient Ward' },
  ],
  hi: [
    { id: 1, label: 'SOS शुरू हुआ', description: 'मरीज के जीपीएस स्थान के साथ आपातकालीन प्रसारण शुरू' },
    { id: 2, label: 'एम्बुलेंस सौंपी गई', description: 'मरीज के निकटतम उपलब्ध एम्बुलेंस तुरंत रवाना' },
    { id: 3, label: 'अस्पतालों को अलर्ट', description: 'निकटतम स्वास्थ्य केंद्रों को स्वतः आपातकालीन अलर्ट भेजा गया' },
    { id: 4, label: 'अस्पताल ने स्वीकार किया', description: 'अस्पताल ने बिस्तर उपलब्धता सत्यापित कर मरीज स्वीकार किया' },
    { id: 5, label: 'मरीज पिकअप', description: 'पैरामेडिक घटनास्थल पहुंचे; तत्काल विटल्स रिकॉर्ड किए गए' },
    { id: 6, label: 'अस्पताल के रास्ते में', description: 'लाइव विटल्स निगरानी एवं ग्रीन कॉरिडोर के साथ यात्रा में' },
    { id: 7, label: 'अस्पताल में तैयारी', description: 'ट्रॉमा ओटी, वेंटिलेटर और सर्जिकल टीम तैयार' },
    { id: 8, label: 'अस्पताल पहुंचे', description: 'एम्बुलेंस अस्पताल के आपातकालीन वार्ड में पहुंची' },
    { id: 9, label: 'उपचार जारी', description: 'गोल्डन ऑवर आपातकालीन चिकित्सा एवं डॉक्टर द्वारा उपचार' },
    { id: 10, label: 'प्रक्रिया पूर्ण', description: 'मरीज स्थिर होकर आईसीयू/वार्ड में भर्ती' },
  ],
  mr: [
    { id: 1, label: 'SOS सुरू झाला', description: 'रुग्णाच्या जीपीएस स्थानासह आपत्कालीन संदेश प्रसारित' },
    { id: 2, label: 'रुग्णवाहिका नेमली', description: 'जवळची उपलब्ध रुग्णवाहिका तत्काळ रवाना' },
    { id: 3, label: 'रुग्णालयांना अलर्ट', description: 'जवळच्या सर्व रुग्णालयांना प्राधान्य आपत्कालीन इशारा' },
    { id: 4, label: 'रुग्णालयाने स्वीकारले', description: 'खाटांची उपलब्धता तपासून रुग्णालयाने विनंती स्वीकारली' },
    { id: 5, label: 'रुग्ण पिकअप', description: 'पॅरामेडिक घटनास्थळी पोहोचले; तातडीचे विटल्स तपासले' },
    { id: 6, label: 'मार्गावर', description: 'थेट विटल्स देखरेख आणि ग्रीन कॉरिडॉर अंतर्गत प्रवासात' },
    { id: 7, label: 'रुग्णालय सज्जता', description: 'ट्रॉमा ओटी, व्हेंटिलेटर आणि वैद्यकीय पथक सज्ज' },
    { id: 8, label: 'पोहोचले', description: 'रुग्णवाहिका रुग्णालयाच्या आपत्कालीन कक्षात पोहोचली' },
    { id: 9, label: 'उपचार सुरू', description: 'गोल्डन अवर अंतर्गत तातडीचे वैद्यकीय उपचार' },
    { id: 10, label: 'पूर्ण', description: 'रुग्ण स्थिर, आयसीयू/वॉर्डमध्ये दाखल करण्यात आले' },
  ]
};

export const EmergencyTrackerCard: React.FC<EmergencyTrackerCardProps> = ({
  incidentId = 'disp-2026-9041',
  title = 'Road bike accident, head impact with helmet cracked, patient groaning with low consciousness',
  urgency = 'Critical',
  patientCount = 1,
  initialStep = 4,
  currentStep: controlledStep,
  onStepChange,
  interactive = true,
  showControls = false,
  className = '',
}) => {
  const { language, tr } = useLanguage();
  const currentSteps = useMemo(() => {
    return STEP_TRANSLATIONS[language] || STEP_TRANSLATIONS.en;
  }, [language]);

  const [internalStep, setInternalStep] = useState<number>(initialStep);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeStep = controlledStep !== undefined ? controlledStep : internalStep;

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
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, onStepChange]);

  // Keep internal step in sync when parent controls it
  useEffect(() => {
    if (controlledStep !== undefined) {
      setInternalStep(controlledStep);
    }
  }, [controlledStep]);

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs max-w-2xl font-sans ${className}`}>
      
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Incident ID Pill */}
            <span className="px-2.5 py-1 bg-red-600 text-white rounded-md text-xs font-bold font-mono tracking-wider shadow-xs">
              {incidentId}
            </span>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-heading">
              {title}
            </h3>

            {/* Urgency Pill Badge */}
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full text-xs font-semibold">
              {urgency}
            </span>

            {/* Patient Count Badge */}
            <span className="px-2.5 py-0.5 border border-slate-200 text-slate-600 rounded-full text-xs font-medium bg-white">
              {patientCount} {language === 'mr' ? 'रुग्ण' : language === 'hi' ? 'मरीज' : 'patient(s)'}
            </span>
          </div>
        </div>

        {/* Live Indicator Tag */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{tr.common.live}</span>
        </div>
      </div>

      {/* Vertical Stepper List */}
      <div className="pt-6 pb-2">
        <div className="space-y-0">
          {currentSteps.map((step, index) => {
            const isCompleted = step.id < activeStep;
            const isActive = step.id === activeStep;
            const isUpcoming = step.id > activeStep;
            const isLast = index === currentSteps.length - 1;

            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`relative flex items-start gap-4 group transition-colors select-none ${
                  interactive ? 'cursor-pointer hover:bg-slate-50/70 p-1.5 -mx-1.5 rounded-xl' : ''
                }`}
                title={interactive ? `Click to jump to Step ${step.id}: ${step.label}` : undefined}
              >
                {/* Stepper Node & Connecting Line Column */}
                <div className="relative flex flex-col items-center shrink-0">
                  {/* Circle Indicator */}
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ring-4 ring-red-100 animate-pulse">
                      {step.id}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center shrink-0 text-xs font-medium group-hover:border-slate-300">
                      {step.id}
                    </div>
                  )}

                  {/* Vertical Connecting Line */}
                  {!isLast && (
                    <div
                      className={`w-[2px] h-6 my-1 transition-colors ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step Label & Details */}
                <div className="flex-1 pt-0.5 flex items-center justify-between gap-2">
                  <div>
                    <span
                      className={`block transition-colors ${
                        isActive
                          ? 'text-slate-900 text-base font-bold tracking-tight'
                          : isCompleted
                          ? 'text-slate-600 text-sm font-medium'
                          : 'text-slate-400 text-sm font-normal'
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* Active Step Subtitle Description */}
                    {isActive && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug animate-in fade-in">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Active Step Pill or Project Preview Tooltip */}
                  {isActive && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                      Active Stage
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls Bar for easy demonstration */}
      {showControls && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Step <strong>{activeStep}</strong> of 10 • Click any step or use controls to simulate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={activeStep <= 1}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={handleNext}
              disabled={activeStep >= 10}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-white transition ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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
