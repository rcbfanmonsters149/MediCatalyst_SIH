import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Car, 
  TrafficCone, 
  Baby, 
  MapPin, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  HeartPulse, 
  Phone,
  Flame,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';

export const PublicWorkersPage: React.FC = () => {
  const { 
    workerReports, 
    addWorkerReport, 
    greenCorridorActive, 
    setGreenCorridorActive,
    clearedJunctions,
    clearTrafficJunction,
    createEmergencyDispatch,
    hospitals,
    activeDispatch
  } = useApp();

  const [activeWorkerTab, setActiveWorkerTab] = useState<'POLICE' | 'TRAFFIC' | 'ASHA'>('POLICE');

  // Police Accident Form State
  const [accidentLocation, setAccidentLocation] = useState('NH-44 Flyover Exit 12, Rampur Bypass');
  const [accidentVictims, setAccidentVictims] = useState(1);
  const [accidentDescription, setAccidentDescription] = useState('Two-wheeler collided with truck, driver unconscious with head laceration');
  const [policeSosSent, setPoliceSosSent] = useState(false);

  // ASHA Survey Form State
  const [ashaMotherName, setAshaMotherName] = useState('Meena Devi');
  const [ashaVillage, setAshaVillage] = useState('Kalyanpur');
  const [ashaGestationalWeeks, setAshaGestationalWeeks] = useState(24);
  const [ashaHb, setAshaHb] = useState(7.1);
  const [ashaBp, setAshaBp] = useState('140/90');
  const [ashaSaved, setAshaSaved] = useState(false);

  const handlePoliceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkerReport({
      workerType: 'POLICE',
      workerName: 'Sub-Inspector Vikram Rathore',
      badgeId: 'HP-POL-4482',
      title: `Highway Road Collision - ${accidentLocation}`,
      description: accidentDescription,
      location: accidentLocation,
      lat: 28.7290,
      lng: 77.0910,
      severity: 'CRITICAL',
      metadata: { victims: accidentVictims }
    });

    // Automatically trigger immediate 108 ambulance dispatch!
    createEmergencyDispatch(
      `[POLICE ROAD CRASH SOS] ${accidentDescription} at ${accidentLocation} (${accidentVictims} victim)`,
      undefined,
      'CRITICAL'
    );

    setPoliceSosSent(true);
    setTimeout(() => setPoliceSosSent(false), 4000);
  };

  const handleAshaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isHighRisk = ashaHb < 8.0 || parseInt(ashaBp.split('/')[0]) >= 140;

    addWorkerReport({
      workerType: 'ASHA',
      workerName: 'Sunita Devi (ASHA Worker)',
      badgeId: 'ASHA-VIL-08',
      title: `Maternal Health Visit: ${ashaMotherName} (${isHighRisk ? 'HIGH RISK' : 'NORMAL'})`,
      description: `Gestational age: ${ashaGestationalWeeks}w, Hemoglobin: ${ashaHb} g/dL, BP: ${ashaBp}. ${isHighRisk ? 'Flagged for urgent IV Iron Sucrose & PHC tele-consultation.' : 'Routine progress good.'}`,
      location: `Village ${ashaVillage}`,
      lat: 28.6980,
      lng: 77.1140,
      severity: isHighRisk ? 'URGENT' : 'NORMAL',
      metadata: { hemoglobin: `${ashaHb} g/dL`, bloodPressure: ashaBp }
    });

    setAshaSaved(true);
    setTimeout(() => setAshaSaved(false), 3000);
  };

  const junctionsList = [
    { name: 'Rampur Toll Gate', distanceKm: 1.2, etaMinutes: 2 },
    { name: 'Bilaspur Bypass Flyover Crossing', distanceKm: 4.8, etaMinutes: 6 },
    { name: 'Sector 14 Central Junction', distanceKm: 11.5, etaMinutes: 14 },
    { name: 'Apex Hospital Ring Road Intersect', distanceKm: 22.0, etaMinutes: 26 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
              Other Public Frontline Workers
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            Police First-Responders, Traffic Control & ASHA Workers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interconnected frontline portal bridging highway police accident reports, traffic green corridors, and rural community health visits.
          </p>
        </div>

        {/* Worker Role Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveWorkerTab('POLICE')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeWorkerTab === 'POLICE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4 text-blue-600" />
            <span>Highway Police</span>
          </button>

          <button
            onClick={() => setActiveWorkerTab('TRAFFIC')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeWorkerTab === 'TRAFFIC'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrafficCone className="w-4 h-4 text-amber-600" />
            <span>Traffic Green Corridor</span>
          </button>

          <button
            onClick={() => setActiveWorkerTab('ASHA')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeWorkerTab === 'ASHA'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Baby className="w-4 h-4 text-emerald-600" />
            <span>ASHA Rural Health</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POLICE & HIGHWAY PATROL FIRST RESPONDER */}
      {activeWorkerTab === 'POLICE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Road Accident Quick SOS Pin Drop (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Car className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  Highway Police Accident SOS (1-Click Ambulance Call)
                </h3>
                <p className="text-xs text-slate-500">
                  Police officers can pin road traffic accidents and dispatch ambulances for unconscious victims without citizen login.
                </p>
              </div>
            </div>

            <form onSubmit={handlePoliceSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accident Location / Landmark:
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={accidentLocation}
                    onChange={(e) => setAccidentLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. NH-44 Milestone 38, near Bilaspur bypass"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Injured Victims:
                  </label>
                  <select
                    value={accidentVictims}
                    onChange={(e) => setAccidentVictims(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value={1}>1 Victim</option>
                    <option value={2}>2 Victims</option>
                    <option value={3}>3+ Multiple Victims (Pileup)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reporting Officer Badge:
                  </label>
                  <input
                    type="text"
                    disabled
                    value="SI Vikram Rathore (HP-POL-4482)"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accident Severity & Visual Injury Description:
                </label>
                <textarea
                  rows={3}
                  value={accidentDescription}
                  onChange={(e) => setAccidentDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe vehicle crash, unconscious status, bleeding..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>{policeSosSent ? '108 Ambulance Dispatched to Accident Scene!' : 'DISPATCH AMBULANCE VIA POLICE CRASH PIN'}</span>
              </button>
            </form>
          </div>

          {/* Right: Police Incident Logs (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100 font-heading">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent Highway Incident & Accident Logs</span>
            </h3>

            <div className="space-y-3">
              {workerReports.filter(r => r.workerType === 'POLICE').map(report => (
                <div key={report.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{report.title}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                        {report.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{report.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600">{report.description}</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>Officer: <strong>{report.workerName}</strong> ({report.badgeId})</span>
                    <span>📍 {report.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: TRAFFIC POLICE GREEN CORRIDOR */}
      {activeWorkerTab === 'TRAFFIC' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <TrafficCone className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Traffic Police "Green Corridor" Automated Clearance
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronizes upcoming highway junctions with the live GPS route of rerouted emergency ambulances.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${
                  greenCorridorActive 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {greenCorridorActive ? '🟢 Green Corridor Active' : '⚪ Standby Mode'}
                </span>

                <button
                  onClick={() => setGreenCorridorActive(!greenCorridorActive)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition"
                >
                  {greenCorridorActive ? 'Deactivate Corridor' : 'Activate Green Corridor'}
                </button>
              </div>
            </div>

            {/* Junctions Clearance Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {junctionsList.map(junc => {
                const isCleared = clearedJunctions.includes(junc.name);

                return (
                  <div 
                    key={junc.name} 
                    className={`p-4 rounded-xl border space-y-2 transition ${
                      isCleared 
                        ? 'bg-emerald-50/70 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Junction Post</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCleared ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isCleared ? 'CLEARED 🟢' : 'HOLD 🟡'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800">{junc.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Ambulance ETA: ~<strong>{junc.etaMinutes} mins</strong> ({junc.distanceKm} km)
                    </p>

                    <button
                      onClick={() => clearTrafficJunction(junc.name)}
                      disabled={isCleared}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                        isCleared 
                          ? 'bg-emerald-600 text-white cursor-default' 
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                      }`}
                    >
                      {isCleared ? '✓ Traffic Cleared' : 'Lock Green Signal'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map showing Green Corridor Path */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">
              Live Ambulance Corridor Radar
            </h4>
            <LeafletMap
              hospitals={hospitals}
              pickupLocation={activeDispatch ? { lat: activeDispatch.pickupLat, lng: activeDispatch.pickupLng, label: 'Active SOS Scene' } : undefined}
              showReroutePath={true}
              rerouteDestination={hospitals[3]}
              height="350px"
            />
          </div>

        </div>
      )}

      {/* TAB 3: ASHA RURAL COMMUNITY HEALTH WORKER */}
      {activeWorkerTab === 'ASHA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: ASHA Rural Survey & Vitals Logger (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Baby className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  ASHA Village Household Maternal & Infant Health Logger
                </h3>
                <p className="text-xs text-slate-500">
                  Record home visit health indicators in underserved villages; automatically flag severe anemia or high-risk pregnancies to the Primary Health Center.
                </p>
              </div>
            </div>

            <form onSubmit={handleAshaSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mother / Patient Name:
                  </label>
                  <input
                    type="text"
                    value={ashaMotherName}
                    onChange={(e) => setAshaMotherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Village Name:
                  </label>
                  <input
                    type="text"
                    value={ashaVillage}
                    onChange={(e) => setAshaVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gestational Age:
                  </label>
                  <input
                    type="number"
                    value={ashaGestationalWeeks}
                    onChange={(e) => setAshaGestationalWeeks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">Weeks</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hemoglobin (Hb):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ashaHb}
                    onChange={(e) => setAshaHb(parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold ${
                      ashaHb < 8.0 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400">{ashaHb < 8.0 ? '⚠️ Severe Anemia' : 'g/dL'}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Blood Pressure:
                  </label>
                  <input
                    type="text"
                    value={ashaBp}
                    onChange={(e) => setAshaBp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    placeholder="120/80"
                  />
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <span>Nearest Referral Hub: <strong>Bilaspur CHC (Maternity Unit)</strong></span>
                <span className="text-[10px] font-bold bg-emerald-200 px-2 py-0.5 rounded">3 Beds Free</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{ashaSaved ? 'Logged & Escalated to PHC Doctor!' : 'Log Visit & Sync to Rural Health Cloud'}</span>
              </button>
            </form>
          </div>

          {/* Right: ASHA Field Visit Log (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100 font-heading">
              <Baby className="w-4 h-4 text-emerald-600" />
              <span>Village Health Registry & Escalations</span>
            </h3>

            <div className="space-y-3">
              {workerReports.filter(r => r.workerType === 'ASHA').map(report => (
                <div key={report.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{report.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        report.severity === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {report.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{report.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600">{report.description}</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>ASHA: <strong>{report.workerName}</strong> ({report.badgeId})</span>
                    <span>📍 {report.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
