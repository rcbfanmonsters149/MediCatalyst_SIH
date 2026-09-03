import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  HeartPulse, 
  Truck, 
  UserCheck, 
  Calendar, 
  Share2, 
  AlertCircle, 
  Check,
  X, 
  Plus, 
  Minus, 
  ShieldCheck,
  FileText,
  UserPlus,
  Stethoscope,
  Trash2,
  ExternalLink,
  LogOut,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoctorStatusType } from '../types';
import { Link } from 'react-router-dom';

export const HospitalDashboard: React.FC = () => {
  const { 
    hospitals, 
    updateHospitalBeds, 
    selectedHospitalId, 
    setSelectedHospitalId,
    hospitalUser,
    logoutHospital,
    addDoctorToHospital,
    updateDoctorStatus,
    removeDoctorFromHospital,
    activeDispatch,
    acceptDispatchByHospital,
    declineOrTimeoutDispatch,
    ambulances,
    user
  } = useApp();

  // Selected or authenticated hospital
  const hospital = hospitalUser || hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  const isTargetOfActiveDispatch = activeDispatch?.currentHospitalId === hospital.id;

  // New Doctor Form State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDesignation, setDocDesignation] = useState('');
  const [docDepartment, setDocDepartment] = useState('');
  const [docShift, setDocShift] = useState('Morning (08:00 - 14:00)');
  const [docRoom, setDocRoom] = useState('OPD Room 101');
  const [docStatus, setDocStatus] = useState<DoctorStatusType>('AVAILABLE');

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docDesignation.trim()) {
      alert('Please enter doctor name and specialization.');
      return;
    }

    addDoctorToHospital(hospital.id, {
      name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
      designation: docDesignation,
      department: docDepartment || 'General Healthcare',
      shift: docShift,
      available: docStatus === 'AVAILABLE',
      statusDetail: docStatus,
      roomNumber: docRoom
    });

    triggerNotify(`Successfully added ${docName} to ${hospital.name}! Synchronized with Public Citizen Portal.`);
    setDocName('');
    setDocDesignation('');
    setDocDepartment('');
    setShowAddDoctorModal(false);
  };

  const handleStatusChange = (doctorId: string, newStatus: DoctorStatusType) => {
    updateDoctorStatus(hospital.id, doctorId, {
      available: newStatus === 'AVAILABLE',
      statusDetail: newStatus
    });
    triggerNotify(`Doctor status updated to ${newStatus}. Reflected live on Citizen Website!`);
  };

  const getStatusBadge = (status: DoctorStatusType) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Available (Free for OPD)
          </span>
        );
      case 'BUSY_SURGERY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            In Surgery / OT
          </span>
        );
      case 'BUSY_EMERGENCY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            In Emergency Trauma
          </span>
        );
      case 'ON_ROUNDS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            On Ward / ICU Rounds
          </span>
        );
      case 'OFF_DUTY':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Off Duty / On Leave
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 font-sans">
      
      {/* Top Operations Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white font-heading">
                  Med<span className="text-blue-400">Catalyst</span> Hospital Desk
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  ID: {hospital.id.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hospital Command Desk • Real-time Bed & Doctor Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              title="Open the citizen-facing public portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">View Public Citizen Portal</span>
            </Link>

            <button
              onClick={logoutHospital}
              className="text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-rose-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout Desk</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Live Notification Banner */}
        {notification && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>{notification}</span>
            </div>
            <span className="text-xs text-emerald-100 font-mono">Live Broadcast Active</span>
          </div>
        )}

        {/* Hospital Identity Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authorized Facility Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
              {hospital.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-blue-700">{hospital.type}</span>
              <span>•</span>
              <span>{hospital.address}</span>
              <span>•</span>
              <span>Phone: {hospital.phone}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Switch Facility Desk:</span>
            <select
              value={hospital.id}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* INCOMING EMERGENCY DISPATCH ALERT (108 Waterfall Alert) */}
        {isTargetOfActiveDispatch && activeDispatch && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 shadow-lg animate-emergency-beacon space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-red-600 animate-ping"></span>
                <div>
                  <span className="text-[11px] uppercase font-black tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    🚨 INCOMING EMERGENCY DISPATCH ({activeDispatch.urgencyLevel})
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 font-heading">
                    {activeDispatch.callerIssue}
                  </h3>
                </div>
              </div>

              {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
                <div className="text-right bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-red-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">2-Min SLA Countdown</span>
                  <div className="text-xl font-mono font-extrabold text-red-700">
                    {activeDispatch.timeoutSecondsRemaining}s remaining
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-red-200">
              <div>
                <span className="text-slate-400 font-medium">Caller Details:</span>
                <p className="font-bold text-slate-800">{activeDispatch.callerName} ({activeDispatch.callerPhone})</p>
                <p className="text-slate-500 text-[11px]">Pickup: {activeDispatch.pickupAddress}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Cloud Bio-Data Warnings:</span>
                <p className="font-bold text-rose-600">Allergy: Penicillin (Severe Anaphylaxis)</p>
                <p className="text-slate-600 text-[11px]">Chronic: Type 2 Diabetes, Hypertension</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Dispatch Status:</span>
                <p className="font-bold text-slate-900 uppercase">{activeDispatch.status.replace(/_/g, ' ')}</p>
                <p className="text-slate-500 text-[11px]">Ambulance Assigned: HR-10-EM-1081</p>
              </div>
            </div>

            {activeDispatch.status === 'PENDING_HOSPITAL_ACCEPT' && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => declineOrTimeoutDispatch(hospital.id, 'Critical Trauma OT occupied with emergency procedure')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  <span>Decline (Failover to Next Hospital)</span>
                </button>

                <button
                  onClick={() => acceptDispatchByHospital(hospital.id)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Dispatch & Deploy Ambulance</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* DOCTOR COMMAND ROSTER MANAGEMENT (Core User Requirement) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                  Real-Time Doctor Command Roster
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Add doctors and update their live availability in real-time. Changes are instantly visible on the public citizen website.
              </p>
            </div>

            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Doctor to Staff</span>
            </button>
          </div>

          {/* Modal / Form to Add New Doctor */}
          {showAddDoctorModal && (
            <div className="p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-700" />
                  <h3 className="font-bold text-sm text-blue-950">Add Doctor to {hospital.name}</h3>
                </div>
                <button 
                  onClick={() => setShowAddDoctorModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sunita Rao"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialization / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Pediatrician or Ortho Surgeon"
                    value={docDesignation}
                    onChange={(e) => setDocDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency & Trauma, Cardiology"
                    value={docDepartment}
                    onChange={(e) => setDocDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift / Duty Timing</label>
                  <input
                    type="text"
                    placeholder="e.g. Day Shift (08:00 - 16:00)"
                    value={docShift}
                    onChange={(e) => setDocShift(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / OPD Chamber</label>
                  <input
                    type="text"
                    placeholder="e.g. OPD Room 102 or ER Bay 3"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Real-Time Status</label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as DoctorStatusType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  >
                    <option value="AVAILABLE">🟢 Available (Free for OPD)</option>
                    <option value="BUSY_SURGERY">🟡 Busy (In Surgery / OT)</option>
                    <option value="BUSY_EMERGENCY">🔴 Busy (Emergency Resuscitation)</option>
                    <option value="ON_ROUNDS">🟠 Busy (On Ward / ICU Rounds)</option>
                    <option value="OFF_DUTY">⚪ Off Duty / On Leave</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                  >
                    Save & Broadcast to Citizens
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Doctors with Live Status Selector */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Currently Registered Medical Staff ({hospital.doctorsOnDuty.length} Doctors):
            </div>

            <div className="grid grid-cols-1 gap-3">
              {hospital.doctorsOnDuty.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {doc.designation}
                        </span>
                        {getStatusBadge(doc.statusDetail || (doc.available ? 'AVAILABLE' : 'OFF_DUTY'))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>Dept: <strong>{doc.department || 'General Medicine'}</strong></span>
                        <span>•</span>
                        <span>Shift: <strong>{doc.shift}</strong></span>
                        {doc.roomNumber && (
                          <>
                            <span>•</span>
                            <span>Chamber: <strong>{doc.roomNumber}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Status Toggle Controls */}
                  <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Change Status:</span>
                    <select
                      value={doc.statusDetail || (doc.available ? 'AVAILABLE' : 'OFF_DUTY')}
                      onChange={(e) => handleStatusChange(doc.id, e.target.value as DoctorStatusType)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE">🟢 Available (Free)</option>
                      <option value="BUSY_SURGERY">🟡 Busy (Surgery / OT)</option>
                      <option value="BUSY_EMERGENCY">🔴 Busy (Emergency)</option>
                      <option value="ON_ROUNDS">🟠 Busy (Ward Rounds)</option>
                      <option value="OFF_DUTY">⚪ Off Duty</option>
                    </select>

                    <button
                      onClick={() => removeDoctorFromHospital(hospital.id, doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove doctor from roster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* REAL-TIME BED AVAILABILITY MATRIX */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
                <Bed className="w-5 h-5 text-emerald-600" />
                <span>Real-Time Bed & Critical Equipment Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live capacity surfaced to rural citizens, ambulances, and referring health centers.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Click + / - to adjust live capacity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            
            {/* General Beds */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">General Ward Beds</span>
                <span className="text-xs font-mono text-slate-400">Total: {hospital.generalBedsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {hospital.generalBedsAvail} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'general', -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'general', 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center font-bold text-white shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ICU Beds */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">ICU / CCU Beds</span>
                <span className="text-xs font-mono text-slate-400">Total: {hospital.icuBedsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-rose-600 font-mono">
                  {hospital.icuBedsAvail} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'icu', -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'icu', 1)}
                    className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 flex items-center justify-center font-bold text-white shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Maternity Beds */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Maternity & Labor Beds</span>
                <span className="text-xs font-mono text-slate-400">Total: {hospital.maternityBedsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-indigo-600 font-mono">
                  {hospital.maternityBedsAvail} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'maternity', -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'maternity', 1)}
                    className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center font-bold text-white shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ventilators */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Mechanical Ventilators</span>
                <span className="text-xs font-mono text-slate-400">Critical Life-Support</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-sky-600 font-mono">
                  {hospital.ventilatorsAvail} <span className="text-xs text-slate-500 font-sans font-normal">Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'ventilator', -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 'ventilator', 1)}
                    className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 flex items-center justify-center font-bold text-white shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
