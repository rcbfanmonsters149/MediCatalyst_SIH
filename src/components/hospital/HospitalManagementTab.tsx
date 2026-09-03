import React, { useState } from 'react';
import { 
  Bed, 
  UserCheck, 
  Plus, 
  Minus, 
  UserPlus, 
  Stethoscope, 
  Trash2, 
  X,
  Sparkles,
  Building2,
  Clock,
  HeartPulse,
  Wind,
  Zap,
  Activity,
  Scan,
  Droplets,
  Disc,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Hospital, DoctorOnDuty, DoctorStatusType } from '../../types';
import { HospitalPrescriptionModal } from './HospitalPrescriptionModal';

interface HospitalManagementTabProps {
  hospital: Hospital;
  onNotify: (msg: string) => void;
}

export const HospitalManagementTab: React.FC<HospitalManagementTabProps> = ({ hospital, onNotify }) => {
  const { 
    updateHospitalBeds, 
    addDoctorToHospital, 
    updateDoctorStatus, 
    removeDoctorFromHospital 
  } = useApp();

  // Add Doctor Form State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDesignation, setDocDesignation] = useState('');
  const [docDepartment, setDocDepartment] = useState('');
  const [docShift, setDocShift] = useState('Morning (08:00 - 14:00)');
  const [docRoom, setDocRoom] = useState('OPD Room 101');
  const [docStatus, setDocStatus] = useState<DoctorStatusType>('AVAILABLE');

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docDesignation.trim()) {
      alert('Please enter doctor name and specialization.');
      return;
    }

    addDoctorToHospital(hospital.id, {
      name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
      designation: docDesignation,
      department: docDepartment || 'General Medicine',
      shift: docShift,
      available: docStatus === 'AVAILABLE',
      statusDetail: docStatus,
      roomNumber: docRoom
    });

    onNotify(`Successfully added ${docName} to ${hospital.name}! Synced to citizen portal.`);
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
    onNotify(`Doctor status updated to ${newStatus}. Reflected live on Citizen Portal!`);
  };

  const getStatusBadge = (status: DoctorStatusType | string) => {
    if (status === 'AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Available
        </span>
      );
    }
    if (status === 'BUSY' || status === 'BUSY_SURGERY' || status === 'BUSY_EMERGENCY' || status === 'ON_ROUNDS') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Busy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        Off Duty
      </span>
    );
  };

  const getNormalizedStatus = (statusDetail?: string, available?: boolean): DoctorStatusType => {
    if (statusDetail === 'AVAILABLE') return 'AVAILABLE';
    if (statusDetail === 'OFF_DUTY') return 'OFF_DUTY';
    if (statusDetail === 'BUSY' || statusDetail === 'BUSY_SURGERY' || statusDetail === 'BUSY_EMERGENCY' || statusDetail === 'ON_ROUNDS') {
      return 'BUSY';
    }
    return available ? 'AVAILABLE' : 'OFF_DUTY';
  };

  return (
    <div className="space-y-6">

      {/* DOCTOR COMMAND ROSTER MANAGEMENT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                Doctor Roster & Availability Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add medical staff and toggle their live status between Available, Busy, or Off Duty.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Issue Digital Prescription (ABHA)</span>
            </button>

            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Doctor to Staff</span>
            </button>
          </div>
        </div>

        {/* Modal to Issue Clinical Prescription */}
        <HospitalPrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          hospital={hospital}
          onNotify={onNotify}
        />

        {/* Modal / Inline Drawer to Add New Doctor */}
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
                <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value as DoctorStatusType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                >
                  <option value="AVAILABLE">🟢 Available</option>
                  <option value="BUSY">🔴 Busy</option>
                  <option value="OFF_DUTY">⚪ Off Duty</option>
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

        {/* List of Doctors with Simplified Status Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registered Doctors ({hospital.doctorsOnDuty.length}):
          </div>

          <div className="grid grid-cols-1 gap-3">
            {hospital.doctorsOnDuty.map((doc) => {
              const currentStatus = getNormalizedStatus(doc.statusDetail, doc.available);

              return (
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
                        {getStatusBadge(currentStatus)}
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

                  {/* Real-time Status Switcher: Available, Busy, Off Duty */}
                  <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Set Status:</span>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(doc.id, e.target.value as DoctorStatusType)}
                      className={`px-3 py-1.5 bg-white border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 transition ${
                        currentStatus === 'AVAILABLE'
                          ? 'border-emerald-300 text-emerald-800'
                          : (currentStatus === 'BUSY' ? 'border-rose-300 text-rose-800' : 'border-slate-300 text-slate-700')
                      }`}
                    >
                      <option value="AVAILABLE">🟢 Available</option>
                      <option value="BUSY">🔴 Busy</option>
                      <option value="OFF_DUTY">⚪ Off Duty</option>
                    </select>

                    <button
                      onClick={() => {
                        removeDoctorFromHospital(hospital.id, doc.id);
                        onNotify(`Removed ${doc.name} from roster.`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove doctor from roster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* REAL-TIME BED & CRITICAL EQUIPMENT CAPACITY MATRIX */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <Bed className="w-5 h-5 text-emerald-600" />
              <span>Hospital Resources & Medical Equipment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <span className="font-bold text-emerald-700">+</span> or <span className="font-bold text-rose-700">-</span> to adjust live available count. Synced in real time with the citizen website.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
            Live Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          
          {/* General Ward Beds */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-emerald-600" />
                <span>General Ward Beds</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                {hospital.generalBedsAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'general', -1);
                    onNotify('General beds decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'general', 1);
                    onNotify('General beds incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ICU / CCU Beds */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>ICU / CCU Beds</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-rose-600 font-mono">
                {hospital.icuBedsAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'icu', -1);
                    onNotify('ICU beds decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'icu', 1);
                    onNotify('ICU beds incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Maternity & Labor Beds */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Maternity & Labor Beds</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-indigo-600 font-mono">
                {hospital.maternityBedsAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'maternity', -1);
                    onNotify('Maternity beds decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'maternity', 1);
                    onNotify('Maternity beds incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mechanical Ventilators */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-600" />
                <span>Mechanical Ventilators</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-sky-600 font-mono">
                {hospital.ventilatorsAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Units</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ventilator', -1);
                    onNotify('Ventilators decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ventilator', 1);
                    onNotify('Ventilators incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dialysis Machines */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-purple-600" />
                <span>Dialysis Machines</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-purple-600 font-mono">
                {hospital.dialysisAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Units</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'dialysis', -1);
                    onNotify('Dialysis machines decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'dialysis', 1);
                    onNotify('Dialysis machines incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ECG Machines */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-red-600" />
                <span>ECG Machines</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-red-600 font-mono">
                {hospital.ecgAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Units</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ecg', -1);
                    onNotify('ECG machines decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ecg', 1);
                    onNotify('ECG machines incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* CT Scanner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-amber-600" />
                <span>CT Scanner</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-amber-600 font-mono">
                {hospital.ctScannerAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Operational</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ctScanner', -1);
                    onNotify('CT scanners decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'ctScanner', 1);
                    onNotify('CT scanners incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Defibrillators */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                <span>Defibrillators</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-orange-600 font-mono">
                {hospital.defibrillatorAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Units Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'defibrillator', -1);
                    onNotify('Defibrillators decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'defibrillator', 1);
                    onNotify('Defibrillators incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* MRI Scanner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-teal-600" />
                <span>MRI Scanner</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-extrabold text-teal-600 font-mono">
                {hospital.mriAvail ?? 0} <span className="text-xs text-slate-500 font-sans font-normal">Operational</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'mri', -1);
                    onNotify('MRI scanners decremented (-1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center font-bold text-slate-700 hover:text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Decrease available count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateHospitalBeds(hospital.id, 'mri', 1);
                    onNotify('MRI scanners incremented (+1)');
                  }}
                  className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 flex items-center justify-center font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                  title="Increase available count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
