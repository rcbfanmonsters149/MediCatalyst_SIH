import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  Zap, 
  RotateCcw,
  Sparkles
} from './icons';

interface HandoverETAComparisonCardProps {
  className?: string;
}

export const HandoverETAComparisonCard: React.FC<HandoverETAComparisonCardProps> = ({ className = '' }) => {
  const { 
    activeHandover, 
    caretakerTelemetry, 
    liveAmbulance, 
    confirmPatientHandover,
    recalculateMeetingPointManual,
    stopCaretakerTracking,
    startCaretakerTracking
  } = useApp();
  const { language } = useLanguage();

  if (!activeHandover || !activeHandover.active) return null;

  const isArrived = activeHandover.status === 'ARRIVED_AT_MEETING_POINT';
  const isApproaching = activeHandover.status === 'APPROACHING_MEETING_POINT';
  const isCompleted = activeHandover.status === 'HANDOVER_COMPLETED';

  // Distance and ETA metrics
  const caretakerDist = caretakerTelemetry?.distanceToMeetingKm ?? activeHandover.caretakerDistanceKm;
  const caretakerEta = caretakerTelemetry?.etaToMeetingMinutes ?? activeHandover.caretakerEtaMinutes;

  const ambulanceDist = liveAmbulance?.distanceToMeetingKm ?? activeHandover.ambulanceDistanceKm;
  const ambulanceEta = liveAmbulance?.etaToMeetingMinutes ?? activeHandover.ambulanceEtaMinutes;

  const convergenceEta = Math.max(caretakerEta, ambulanceEta);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 ${className}`}>
      
      {/* Top Coordination Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-lg shrink-0">
            🤝
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 font-mono">
                {language === 'mr' ? 'थेट समन्वय कक्ष' : language === 'hi' ? 'लाइव समन्वय कक्ष' : 'Live Rendezvous Coordination'}
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                isCompleted 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : isArrived 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' 
                  : isApproaching 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>
                  {isCompleted
                    ? (language === 'mr' ? 'हस्तांतरण पूर्ण' : language === 'hi' ? 'हस्तांतरण पूर्ण' : 'Handover Completed ✓')
                    : isArrived
                    ? (language === 'mr' ? 'दोन्ही वाहने पोहोचली' : language === 'hi' ? 'दोनों वाहन पहुंचे' : 'Arrived at Handover Point')
                    : isApproaching
                    ? (language === 'mr' ? 'ठिकाणाजवळ पोहोचत आहेत' : language === 'hi' ? 'बिंदु के निकट पहुंच रहे हैं' : 'Approaching Rendezvous')
                    : (language === 'mr' ? 'दोन्ही वाहने मार्गावर' : language === 'hi' ? 'दोनों वाहन मार्ग में' : 'En Route to Handover')}
                </span>
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading tracking-tight mt-0.5">
              {language === 'mr' ? 'रुग्णवाहिका मध्यंतर हस्तांतरण मोड' : language === 'hi' ? 'एम्बुलेंस मध्यवर्ती हस्तांतरण मोड' : 'Midway Ambulance Handover Mode'}
            </h3>
          </div>
        </div>

        {/* Recalculate meeting point trigger */}
        {!isCompleted && (
          <button
            type="button"
            onClick={() => recalculateMeetingPointManual()}
            className="self-start sm:self-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Recalculate Meeting Point"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'mr' ? 'पुन्हा गणना करा' : language === 'hi' ? 'पुनर्गणना करें' : 'Recalculate Point'}</span>
          </button>
        )}
      </div>

      {/* Suggested Safe Landmark Badge */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <span className="text-xs uppercase font-black tracking-wider text-emerald-800 font-mono">
              {language === 'mr' ? 'सुचवलेले रुग्णवाहिका हस्तांतरण ठिकाण' : language === 'hi' ? 'सुझाया गया एम्बुलेंस हस्तांतरण बिंदु' : 'Suggested Ambulance Handover Point'}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {activeHandover.landmark.safetyRating.replace('_', ' ')}
            </span>
          </div>

          <span className="text-xs font-bold text-emerald-700 font-mono">
            ⚡ ~{activeHandover.timeSavedMinutes} mins {language === 'mr' ? 'वेळेची बचत' : language === 'hi' ? 'समय बचत' : 'time saved'}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            {activeHandover.landmark.name}
          </h4>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{activeHandover.landmark.address}</span>
          </p>
        </div>

        {/* Safety features pills */}
        <div className="pt-1 flex flex-wrap gap-1.5 text-[11px]">
          {activeHandover.landmark.features.map((feat, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/90 border border-emerald-200 text-slate-700 font-medium">
              ✓ {feat}
            </span>
          ))}
        </div>

        {/* Paramedic disclaimer */}
        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-emerald-200/60">
          ⚠️ {language === 'mr' 
            ? 'सुचवलेले सुरक्षित ठिकाण. घटनास्थळी परिस्थितीनुसार रुग्णवाहिका चालक किंवा डॉक्टर अंतिम स्पॉट बदलू शकतात.' 
            : language === 'hi' 
            ? 'सुझाया गया सुरक्षित स्थान। जमीनी परिस्थितियों के अनुसार एम्बुलेंस टीम अंतिम बैठक स्थल को थोड़ा समायोजित कर सकती है।' 
            : 'Suggested route-based rendezvous location. Final meeting point may be adjusted by emergency paramedic personnel.'}
        </p>
      </div>

      {/* THREE-COLUMN REAL-TIME ETA COMPARISON METRICS (Section 7) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Metric 1: Caretaker Vehicle */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
            <span className="flex items-center gap-1.5">
              <span>🚗</span>
              <span>{language === 'mr' ? 'तुमचे स्थानिक वाहन' : language === 'hi' ? 'आपका स्थानीय वाहन' : 'YOUR VEHICLE'}</span>
            </span>
            <span className="text-[10px] bg-white border border-amber-300 px-2 py-0.5 rounded-full text-amber-800 font-mono">
              {caretakerTelemetry?.vehicleType || 'BIKE'}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                ~{caretakerEta}
              </span>
              <span className="text-xs text-slate-500 font-medium">mins ETA</span>
            </div>
            <div className="text-xs text-slate-600 font-medium font-mono">
              Distance: <strong className="text-slate-900">{caretakerDist} km</strong>
            </div>
          </div>

          <div className="pt-1.5 border-t border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between">
            <span>Speed: <b>{caretakerTelemetry?.speedKmH || 35} km/h</b></span>
            <span className="font-semibold text-emerald-700">Moving toward meeting point →</span>
          </div>
        </div>

        {/* Metric 2: Meeting Point Rendezvous */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span>🤝</span>
              <span>{language === 'mr' ? 'हस्तांतरण स्थान' : language === 'hi' ? 'हस्तांतरण बिंदु' : 'HANDOVER POINT'}</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              ~{activeHandover.timeSavedMinutes}m Saved
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                ~{convergenceEta}
              </span>
              <span className="text-xs text-slate-300 font-medium">mins rendezvous</span>
            </div>
            <div className="text-xs text-slate-300 truncate max-w-full font-medium">
              {activeHandover.landmark.name.split(' ')[0]} {activeHandover.landmark.name.split(' ')[1]}
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Route Intersection</span>
            <span className="text-emerald-400 font-bold">🟢 On Road Track</span>
          </div>
        </div>

        {/* Metric 3: 108 Ambulance */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
            <span className="flex items-center gap-1.5">
              <span>🚑</span>
              <span>{language === 'mr' ? '१०८ रुग्णवाहिका' : language === 'hi' ? '108 एम्बुलेंस' : '108 AMBULANCE'}</span>
            </span>
            <span className="text-[10px] bg-white border border-emerald-300 px-2 py-0.5 rounded-full text-emerald-800 font-mono">
              {liveAmbulance?.vehicleNumber || 'HR-10-EM-1081'}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                ~{ambulanceEta}
              </span>
              <span className="text-xs text-slate-500 font-medium">mins ETA</span>
            </div>
            <div className="text-xs text-slate-600 font-medium font-mono">
              Distance: <strong className="text-slate-900">{ambulanceDist} km</strong>
            </div>
          </div>

          <div className="pt-1.5 border-t border-emerald-200/70 text-[11px] text-emerald-900 flex items-center justify-between">
            <span>Speed: <b>{liveAmbulance?.speedKmH || 55} km/h</b></span>
            <span className="font-semibold text-emerald-700">← Moving toward meeting point</span>
          </div>
        </div>

      </div>

      {/* DIVERGENCE / DETOUR ALERT (Section 8) */}
      {activeHandover.isDivergingOrBlocked && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{activeHandover.divergenceAlertMessage || 'Route deviation detected. Recalculating safe meeting point along new road trajectory...'}</span>
          </div>
          <button
            type="button"
            onClick={() => recalculateMeetingPointManual()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 shadow-xs cursor-pointer"
          >
            Recalculate Now
          </button>
        </div>
      )}

      {/* APPROACHING ALERT (Section 7) */}
      {isApproaching && !isArrived && !isCompleted && (
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <h4 className="font-bold text-sm">
                {language === 'mr' ? 'रुग्णवाहिका आणि रुग्ण हस्तांतरण स्थानाजवळ पोहोचत आहेत!' : language === 'hi' ? 'एम्बुलेंस और मरीज हस्तांतरण बिंदु के करीब पहुंच रहे हैं!' : 'Ambulance and patient are approaching the meeting point.'}
              </h4>
              <p className="text-xs text-amber-100">
                {language === 'mr' ? 'कृपया रस्त्याच्या सुरक्षित कडेला (पेट्रोल पंप/जंक्शन) वाहन थांबवा आणि इंडिकेटर चालू ठेवा.' : language === 'hi' ? 'कृपया वाहन को सुरक्षित किनारे पर पार्क करें और हैजार्ड लाइट चालू रखें।' : 'Pull over safely at the roadside landmark forecourt and turn on hazard flashers.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ARRIVED AT MEETING POINT & PATIENT HANDOVER BUTTON (Section 9) */}
      {isArrived && !isCompleted && (
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-lg space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block font-mono">
                RENDEZVOUS CONVERGED
              </div>
              <h4 className="font-black text-base sm:text-lg">
                {language === 'mr' ? 'रुग्णवाहिका हस्तांतरण ठिकाणी पोहोचली आहे!' : language === 'hi' ? 'एम्बुलेंस बैठक स्थल पर पहुंच गई है!' : 'Ambulance has arrived at the meeting point.'}
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                {language === 'mr' ? 'मरीजला १०८ ॲम्ब्युलन्समध्ये सुरक्षितपणे हलवा. हस्तांतरण पूर्ण झाल्यावर खालील बटण दाबा.' : language === 'hi' ? 'मरीज को 108 एम्बुलेंस में स्थानांतरित करें। हस्तांतरण की पुष्टि करने के लिए नीचे दिए गए बटन पर टैप करें।' : 'Transfer the patient safely into the ambulance. Paramedic will confirm handover.'}
              </p>
            </div>
          </div>

          {/* Prominent Action Button */}
          <button
            type="button"
            onClick={confirmPatientHandover}
            className="w-full py-4 px-6 bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl font-black text-sm sm:text-base tracking-wide shadow-xl transition flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-98"
          >
            <span>🤝</span>
            <span>{language === 'mr' ? 'रुग्ण हस्तांतरण पूर्ण झाले (PATIENT HANDED OVER)' : language === 'hi' ? 'मरीज का हस्तांतरण संपन्न (PATIENT HANDED OVER)' : 'PATIENT HANDED OVER (CONFIRM)'}</span>
          </button>
        </div>
      )}

      {/* COMPLETED TRANSIT SUMMARY BANNER */}
      {isCompleted && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong>{language === 'mr' ? 'रुग्ण हस्तांतरण यशस्वीरित्या पूर्ण!' : language === 'hi' ? 'मरीज हस्तांतरण सफलतापूर्वक संपन्न!' : 'Patient Handover Completed Successfully!'}</strong>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {language === 'mr' ? 'रुग्णवाहिका रुग्णाला थेट रुग्णालयाकडे नेत आहे. केअरटेकर ट्रॅकिंग थांबवण्यात आले आहे.' : language === 'hi' ? 'एम्बुलेंस मरीज को सीधे अस्पताल ले जा रही है। केयरटेकर ट्रैकिंग समाप्त कर दी गई है।' : 'Ambulance is now transporting the patient directly to the Apex Hospital under active clinical telemetry.'}
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-300 shrink-0 hidden sm:inline">
            Status: Transporting to Hospital
          </span>
        </div>
      )}

      {/* LOCATION SHARING STATUS & CONTROLS (Section 2) */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${caretakerTelemetry?.isLiveTracking ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
          <span>
            {caretakerTelemetry?.isLiveTracking 
              ? (language === 'mr' ? 'थेट जीपीएस स्थान सामायिकरण चालू (अचूकता: ±8m)' : language === 'hi' ? 'लाइव जीपीएस लोकेशन शेयरिंग सक्रिय (सटीकता: ±8m)' : 'Live GPS Location Sharing Active (Accuracy: ±8m)')
              : (language === 'mr' ? 'स्थान सामायिकरण थांबवले आहे' : language === 'hi' ? 'लोकेशन शेयरिंग रोक दी गई है' : 'Location Sharing Paused')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {caretakerTelemetry?.isLiveTracking ? (
            <button
              type="button"
              onClick={stopCaretakerTracking}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
            >
              {language === 'mr' ? 'स्थान सामायिकरण थांबवा' : language === 'hi' ? 'लोकेशन शेयरिंग बंद करें' : 'Stop Location Sharing'}
            </button>
          ) : (
            <button
              type="button"
              onClick={startCaretakerTracking}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              {language === 'mr' ? 'स्थान सामायिकरण पुन्हा सुरू करा' : language === 'hi' ? 'लोकेशन शेयरिंग पुनः चालू करें' : 'Resume Location Sharing'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
