import React from 'react';
import { 
  ShieldAlert, 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  Clock, 
  Building2,
  LogOut,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';

export const TrafficPoliceDashboard: React.FC = () => {
  const {
    trafficCorridor,
    toggleSimulation,
    setSimulationSpeed,
    resetSimulation,
    setSimulationProgressManual,
    policeUserSignal,
    logoutPoliceSignal
  } = useApp();

  // Find the next upcoming signal along the route
  const nextSignal =
    trafficCorridor.signals.find(s => s.status !== 'CLEARED') ||
    trafficCorridor.signals[trafficCorridor.signals.length - 1];

  // Specific signal to show telemetry for (user's logged in post, or next upcoming)
  const targetSignal = policeUserSignal || nextSignal;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Badge & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 font-heading">
                  Traffic Police Route Monitor
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                  Active Emergency Route
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live Ambulance GPS Tracking, Distance Remaining & Approach ETAs
              </p>
            </div>
          </div>

          {/* Right Header: Station Post Badge & Switch/Logout */}
          <div className="flex items-center gap-3">
            {policeUserSignal && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                      Assigned Signal Post
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {policeUserSignal.id} <span className="font-sans font-semibold text-slate-600">• {policeUserSignal.name}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-mono">({policeUserSignal.junctionCode})</span>
                  </p>
                </div>
                <button
                  onClick={logoutPoliceSignal}
                  className="ml-2 px-2.5 py-1 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Switch Signal Post / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Post</span>
                </button>
              </div>
            )}

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Broadcast: <strong className="text-slate-800">{trafficCorridor.signals.length} Signals Notified</strong>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 1. TOP ACTIVE EMERGENCY HUD CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: Emergency Status & Ambulance Details (5 Cols) */}
          <div className="lg:col-span-5 bg-white border-2 border-red-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-extrabold text-xs uppercase tracking-widest text-red-600">
                    🚨 ACTIVE EMERGENCY
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Code: EM-108-BLR
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Ambulance</p>
                  <p className="text-lg font-black text-slate-900 font-mono">{trafficCorridor.ambulanceId}</p>
                  <p className="text-[10px] text-slate-500">{trafficCorridor.vehicleNumber}</p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Severity</p>
                  <p className="text-xs font-black text-red-600 flex items-center gap-1 mt-1">
                    <span className="text-sm">🔴</span>
                    <span>{trafficCorridor.severity}</span>
                  </p>
                  <p className="text-[10px] text-red-500 font-semibold">Priority 1 Corridor</p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Destination</p>
                  <p className="text-xs font-bold text-blue-700 truncate mt-1">
                    {trafficCorridor.destinationHospital}
                  </p>
                  <p className="text-[10px] text-slate-500">Trauma ICU</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live GPS Location, Remaining Distance & ETAs (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                LIVE LOCATION & POST TELEMETRY
              </span>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <span>📍 GPS: {trafficCorridor.currentLat.toFixed(4)}, {trafficCorridor.currentLng.toFixed(4)}</span>
              </span>
            </div>

            {/* ONLY ETA & REMAINING DISTANCE DISPLAYED (No Speed) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              
              {/* Tile 1: Live ETA to this Signal Post */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ETA to Post ({targetSignal?.id})</span>
                </div>
                <p className="text-xl font-black text-amber-700 font-mono mt-0.5">
                  {targetSignal?.status === 'CLEARED' ? 'Passed' : `${targetSignal?.etaMinutes ?? 0} min`}
                </p>
                <p className="text-[10px] text-amber-800/80 truncate mt-0.5 font-medium">
                  {targetSignal?.name}
                </p>
              </div>

              {/* Tile 2: Remaining Distance to this Signal Post */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Remaining Distance</span>
                </div>
                <p className="text-xl font-black text-blue-700 font-mono mt-0.5">
                  {targetSignal?.status === 'CLEARED' ? '0.0 km' : `${targetSignal?.distanceKm ?? 0} km`}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  Distance to junction
                </p>
              </div>

              {/* Tile 3: Hospital Destination ETA */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hospital ETA</span>
                </div>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  {trafficCorridor.totalEtaMinutes} <span className="text-xs font-normal text-slate-500">min</span>
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {trafficCorridor.destinationHospital}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* 2. SIMULATION CONTROLS BAR */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSimulation()}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-xs ${
                trafficCorridor.isSimulating
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {trafficCorridor.isSimulating ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Live Ambulance Run</span>
                </>
              )}
            </button>

            <button
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
              title="Reset Route Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`px-2 py-0.5 rounded transition ${
                    trafficCorridor.simulationSpeedMultiplier === speed
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="flex-1 min-w-[200px] max-w-md flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 font-bold">Pickup</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={trafficCorridor.simulationProgress}
              onChange={(e) => setSimulationProgressManual(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-500 font-bold">Hospital</span>
          </div>
        </div>

        {/* 3. MAIN DASHBOARD SPLIT: Interactive Map (Left) + Signals on Route Table (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Full Interactive Live Map (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Live GPS Route Radar & Intersection Signals
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Live location shared to all signals along route
                </span>
              </div>

              <LeafletMap
                trafficSignals={trafficCorridor.signals}
                corridorRoute={trafficCorridor.routeCoordinates}
                activeAmbulanceLocation={{
                  lat: trafficCorridor.currentLat,
                  lng: trafficCorridor.currentLng,
                  id: trafficCorridor.ambulanceId,
                  speedKmH: trafficCorridor.speedKmH,
                  etaMinutes: trafficCorridor.totalEtaMinutes,
                }}
                destinationLocation={{
                  lat: trafficCorridor.destinationLat,
                  lng: trafficCorridor.destinationLng,
                  name: trafficCorridor.destinationHospital,
                }}
                showLegend={false}
                height="480px"
              />
            </div>
          </div>

          {/* RIGHT: Signals on Route Table (5 Cols) (Clean, direct, prominent) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 font-heading">
                    SIGNALS ON ROUTE
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live approach ETAs & notification status
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  {trafficCorridor.signals.length} Signals
                </span>
              </div>

              {/* Exact format: S35 | 🟢 NOTIFIED | 2 min */}
              <div className="divide-y divide-slate-100 pt-2">
                {trafficCorridor.signals.map((sig) => {
                  const isCleared = sig.status === 'CLEARED';
                  const isMyPost = sig.id === policeUserSignal?.id;
                  const isNext = sig.id === nextSignal?.id && !isCleared;

                  let rowStyle = 'hover:bg-slate-50 border border-transparent';
                  if (isMyPost) {
                    rowStyle = 'bg-blue-50/80 border-2 border-blue-400 shadow-xs ring-2 ring-blue-200/50';
                  } else if (isNext) {
                    rowStyle = 'bg-amber-50/80 border border-amber-200 shadow-2xs';
                  } else if (isCleared) {
                    rowStyle = 'bg-slate-50/60 opacity-60 border border-transparent';
                  }

                  return (
                    <div
                      key={sig.id}
                      className={`p-3 rounded-xl transition flex items-center justify-between ${rowStyle}`}
                    >
                      {/* Signal ID & Name */}
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-black text-base w-10 ${
                          isMyPost ? 'text-blue-800' : (isNext ? 'text-amber-800' : 'text-slate-900')
                        }`}>
                          {sig.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {sig.name}
                            </p>
                            {isMyPost && (
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">
                                Your Post
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {sig.junctionCode} • <strong className={isMyPost ? 'text-blue-700 font-bold' : 'text-slate-500'}>{sig.distanceKm} km remaining</strong>
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{isCleared ? '✅' : '🟢'}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          isCleared ? 'text-slate-400' : (isMyPost ? 'text-blue-800' : 'text-emerald-700')
                        }`}>
                          {isCleared ? 'CLEARED' : 'NOTIFIED'}
                        </span>
                      </div>

                      {/* ETA Countdown */}
                      <div className="text-right w-16">
                        <span className={`text-sm font-mono font-black ${
                          isCleared 
                            ? 'text-slate-400' 
                            : (isMyPost ? 'text-blue-800 font-black' : (isNext ? 'text-amber-800' : 'text-slate-900'))
                        }`}>
                          {isCleared ? 'Passed' : `${sig.etaMinutes} min`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
