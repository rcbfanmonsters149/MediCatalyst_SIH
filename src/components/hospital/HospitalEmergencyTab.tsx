import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Check, 
  X, 
  MapPin, 
  Truck, 
  Activity, 
  Heart, 
  Wind, 
  Brain, 
  Send, 
  Clock, 
  Phone, 
  ShieldAlert, 
  AlertTriangle,
  Radio,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Hospital } from '../../types';
import { LeafletMap } from '../LeafletMap';
import { EmergencyTrackerCard } from '../EmergencyTrackerCard';

interface HospitalEmergencyTabProps {
  hospital: Hospital;
  onNotify: (msg: string) => void;
}

export const HospitalEmergencyTab: React.FC<HospitalEmergencyTabProps> = ({ hospital, onNotify }) => {
  const { 
    activeDispatch, 
    acceptDispatchByHospital, 
    declineOrTimeoutDispatch, 
    ambulances, 
    vitals, 
    sendDispatchMessage,
    updateDispatchStep,
    hospitals
  } = useApp();

  const [chatInput, setChatInput] = useState('');

  const isTargetOfActiveDispatch = activeDispatch?.currentHospitalId === hospital.id;
  const assignedAmbulance = ambulances.find(a => a.id === 'amb-01') || ambulances[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendDispatchMessage('HOSPITAL', chatInput.trim());
    setChatInput('');
    onNotify('Message transmitted to ambulance crew!');
  };

  const pickupLocation = activeDispatch 
    ? { lat: activeDispatch.pickupLat, lng: activeDispatch.pickupLng, label: activeDispatch.pickupAddress }
    : { lat: 28.7080, lng: 77.0980, label: 'Near Village Rampur Chowk' };

  return (
    <div className="space-y-6">

      {/* ACTIVE EMERGENCY INFLOW DECISION BANNER */}
      {isTargetOfActiveDispatch && activeDispatch ? (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-red-600 animate-ping"></span>
              <div>
                <span className="text-[11px] uppercase font-black tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                  🚨 INCOMING EMERGENCY SOS DISPATCH ({activeDispatch.urgencyLevel})
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-heading">
                  {activeDispatch.callerIssue}
                </h3>
              </div>
            </div>

            {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
              <div className="text-right bg-white/90 px-4 py-2 rounded-xl border border-red-300 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  2-Min SLA Countdown
                </span>
                <div className="text-2xl font-mono font-black text-red-700">
                  {activeDispatch.timeoutSecondsRemaining}s
                </div>
              </div>
            )}
          </div>

          {/* Patient Details & Health Record Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-red-200 shadow-2xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Caller & Pickup Info:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{activeDispatch.callerName}</p>
              <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{activeDispatch.callerPhone}</span>
              </p>
              <p className="text-slate-500 text-[11px] mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{activeDispatch.pickupAddress}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Cloud ABHA Alerts:</span>
              <div className="mt-0.5 space-y-1">
                <p className="font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Allergy: Penicillin (Severe Anaphylaxis)</span>
                </p>
                <p className="text-slate-700 text-[11px]">
                  Chronic: <strong>Type 2 Diabetes, Hypertension</strong>
                </p>
                <p className="text-slate-500 text-[10px]">Blood Group: <strong>B+ (Positive)</strong></p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Dispatch & Ambulance Status:</span>
              <p className="font-bold text-slate-900 uppercase mt-0.5">
                {activeDispatch.status.replace(/_/g, ' ')}
              </p>
              <p className="text-blue-700 font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Assigned Unit: {assignedAmbulance.vehicleNumber} ({assignedAmbulance.type})</span>
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">Paramedic on duty: {assignedAmbulance.driverName}</p>
            </div>
          </div>

          {/* Decision Buttons */}
          {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  declineOrTimeoutDispatch(hospital.id, 'Critical Trauma OT occupied with emergency procedure');
                  onNotify('Dispatch declined. Automated failover initiated to next nearest facility.');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Decline Case (Failover to Next Hospital)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  acceptDispatchByHospital(hospital.id);
                  onNotify('Dispatch accepted! Ambulance en route to patient.');
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Accept Dispatch & Deploy Ambulance</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Emergency Dispatch Standby Desk Active</h3>
              <p className="text-xs text-slate-500">
                Connected to National 108 Emergency Grid. Waiting for SOS alerts in {hospital.name} territory.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            🟢 Ready for Inbound SOS
          </span>
        </div>
      )}

      {/* 10-Stage Incident Progress Tracker Card */}
      {activeDispatch && (
        <div className="flex justify-center">
          <EmergencyTrackerCard
            incidentId={activeDispatch.id}
            title={activeDispatch.callerIssue}
            urgency={activeDispatch.urgencyLevel === 'CRITICAL' ? 'Critical' : (activeDispatch.urgencyLevel === 'HIGH' ? 'High' : 'Moderate')}
            patientCount={activeDispatch.patientCount || 1}
            currentStep={activeDispatch.currentStep || 3}
            onStepChange={(step) => {
              updateDispatchStep(step);
              onNotify(`Incident stage updated to Step ${step}. Synchronized across grid!`);
            }}
            className="w-full shadow-md"
          />
        </div>
      )}

      {/* TWO COLUMN GRID: LIVE GPS MAP + IN-TRANSIT PATIENT TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Live GPS Map: Caller & Ambulance Tracking (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Live Emergency GPS Tracking & Fleet Map
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              ETA: ~<strong>{assignedAmbulance.etaMinutes} mins</strong>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Real-time visual map tracking the patient's exact pickup coordinates, ambulance telemetry location, and route corridor to {hospital.name}.
          </p>

          <div className="rounded-xl overflow-hidden border border-slate-200">
            <LeafletMap
              hospitals={hospitals}
              ambulances={ambulances}
              selectedHospitalId={hospital.id}
              pickupLocation={pickupLocation}
              height="380px"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
              <span className="font-bold">📍 Patient Location:</span>
              <p className="text-[10px] text-rose-700 truncate">{pickupLocation.label}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
              <span className="font-bold">🚑 Unit Position:</span>
              <p className="text-[10px] text-blue-700 truncate">{assignedAmbulance.vehicleNumber} (Moving)</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="font-bold">🏥 Facility Destination:</span>
              <p className="text-[10px] text-emerald-700 truncate">{hospital.name}</p>
            </div>
          </div>
        </div>

        {/* In-Transit Telemetry HUD & Communication (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Pre-Arrival Telemetry Vitals */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  Pre-Arrival Patient Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                Acuity: ESI-1
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Streaming vitals from in-ambulance IoT monitors to allow your trauma team to prepare the ER/OT before arrival.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              
              {/* Heart Rate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Heart Rate</span>
                  <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                  {vitals.heart_rate} <span className="text-xs text-slate-500 font-sans font-normal">BPM</span>
                </div>
                <span className="text-[10px] text-rose-600 font-bold">Tachycardia Alert</span>
              </div>

              {/* SpO2 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Oxygen (SpO2)</span>
                  <Wind className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-xl font-extrabold text-sky-700 mt-1 font-mono">
                  {vitals.spo2}%
                </div>
                <span className="text-[10px] text-amber-700 font-bold">Supplemental O2 on</span>
              </div>

              {/* Blood Pressure */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Blood Pressure</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                  {vitals.systolic_bp}/{vitals.diastolic_bp}
                </div>
                <span className="text-[10px] text-slate-500">Hypotensive Trend</span>
              </div>

              {/* GCS Coma Scale */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500">
                  <span>GCS Coma Score</span>
                  <Brain className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-extrabold text-purple-700 mt-1 font-mono">
                  {vitals.gcs} / 15
                </div>
                <span className="text-[10px] text-rose-600 font-bold">Severe Impairment</span>
              </div>

            </div>
          </div>

          {/* Paramedic & ER Chat Channel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Paramedic Dispatch Comms</h4>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">● Radio Channel 1</span>
            </div>

            <div className="h-36 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              {activeDispatch?.messages && activeDispatch.messages.length > 0 ? (
                activeDispatch.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-lg max-w-[85%] ${
                      m.sender === 'HOSPITAL'
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80 mb-0.5">
                      <span className="font-bold">{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-6 text-xs">
                  No radio messages yet. Dispatch standby active.
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Send instructions to paramedic..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
