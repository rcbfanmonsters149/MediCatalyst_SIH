import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  User, 
  Clock, 
  Video, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  ChevronDown, 
  Star, 
  Scan, 
  FlaskConical, 
  ArrowRight,
  ShieldCheck,
  Check
} from '../icons';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { DoctorDutyMode } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

export type DoctorTabType = 'appointments' | 'schedule' | 'ehr' | 'hospital' | 'profile';

interface DoctorNavbarProps {
  activeTab: DoctorTabType;
  setActiveTab: (tab: DoctorTabType) => void;
  onOpenPrescriptionModal: (section: 'all' | 'labs') => void;
  appointmentsCount: number;
  scheduledCount: number;
}

export const DoctorNavbar: React.FC<DoctorNavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPrescriptionModal,
  appointmentsCount,
  scheduledCount
}) => {
  const { doctorUser, logoutDoctor, updateDoctorScheduleSettings } = useApp();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logoutDoctor();
    navigate('/doctor/login');
  };

  if (!doctorUser) return null;

  const schedule = doctorUser.scheduleSettings;
  const dutyMode = schedule?.dutyMode || 'AVAILABLE';
  const readyForCalls = schedule?.readyForInstantConsult ?? true;
  const rating = doctorUser.profile?.averageRating || 4.9;
  const primaryDegree = doctorUser.profile?.primaryDegree || doctorUser.designation;

  const handleSetDutyMode = (mode: DoctorDutyMode) => {
    updateDoctorScheduleSettings({
      dutyMode: mode,
      readyForInstantConsult: mode === 'AVAILABLE' ? readyForCalls : false
    });
    setIsStatusDropdownOpen(false);
  };

  const handleToggleCallAvailability = () => {
    const nextCalls = !readyForCalls;
    updateDoctorScheduleSettings({
      readyForInstantConsult: nextCalls,
      dutyMode: nextCalls ? 'AVAILABLE' : dutyMode
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 space-y-2.5">
        
        {/* ROW 1: Doctor Identity, Hospital, Status, Profile, Translation & Quick Utilities */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* LEFT GROUP: Doctor Name Block + Hospital Name Block */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Doctor Name & Primary Degree Option Card (Distinct Boundary) */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 hover:border-teal-300 transition shadow-2xs"
              title="Click to view full Doctor Profile & Credentials"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight font-heading truncate group-hover:text-teal-700 transition-colors">
                    {doctorUser.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 border border-teal-300 uppercase shrink-0">
                    MD Desk
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                  <span className="text-teal-700 font-semibold truncate">{primaryDegree}</span>
                </div>
              </div>
            </div>

            {/* 2. Hospital Name & OPD Room Option Card (Distinct Boundary) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition shadow-2xs text-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate max-w-[200px] lg:max-w-[260px]">
                  {doctorUser.hospitalName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <span>{doctorUser.department}</span>
                  {doctorUser.roomNumber && (
                    <>
                      <span>•</span>
                      <span className="text-teal-700 font-bold bg-teal-50 px-1 rounded border border-teal-200">
                        {doctorUser.roomNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT GROUP: Status Pill + Doctor Profile Button + Translation + Scanner + Logout */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 3. Status Block with Interactive Dropdown (Distinct Boundary) */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold cursor-pointer shadow-2xs ${
                  dutyMode === 'AVAILABLE' 
                    ? (readyForCalls 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70' 
                        : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100/70')
                    : dutyMode === 'HOSPITAL_EMERGENCY'
                      ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100/70 animate-pulse'
                      : dutyMode === 'ON_LEAVE'
                        ? 'border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100/70'
                        : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Click to change clinical duty mode & call acceptance"
              >
                <span className={`w-2 h-2 rounded-full ${
                  dutyMode === 'AVAILABLE'
                    ? (readyForCalls ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')
                    : dutyMode === 'HOSPITAL_EMERGENCY'
                      ? 'bg-rose-600'
                      : dutyMode === 'ON_LEAVE'
                        ? 'bg-purple-500'
                        : 'bg-slate-400'
                }`} />

                <span className="hidden md:inline">
                  {dutyMode === 'AVAILABLE' && (readyForCalls ? 'Available & Ready' : 'On-Desk (Calls Paused)')}
                  {dutyMode === 'HOSPITAL_EMERGENCY' && 'In Emergency OT'}
                  {dutyMode === 'ON_LEAVE' && 'On Leave'}
                  {dutyMode === 'OFF_DUTY' && 'Off Duty'}
                </span>
                <span className="md:hidden">
                  {dutyMode === 'AVAILABLE' ? (readyForCalls ? 'Ready' : 'Desk') : dutyMode}
                </span>

                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Status Dropdown Menu */}
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Duty & Call Status
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      Update your clinical availability
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSetDutyMode('AVAILABLE')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>🟢 Available & Ready</span>
                    </div>
                    {dutyMode === 'AVAILABLE' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDutyMode('HOSPITAL_EMERGENCY')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <span>🚨 In Emergency OT</span>
                    </div>
                    {dutyMode === 'HOSPITAL_EMERGENCY' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDutyMode('ON_LEAVE')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>🏖️ On Leave</span>
                    </div>
                    {dutyMode === 'ON_LEAVE' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDutyMode('OFF_DUTY')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>⚪ Off Duty</span>
                    </div>
                    {dutyMode === 'OFF_DUTY' && <Check className="w-3.5 h-3.5 text-slate-600" />}
                  </button>

                  {/* Instant Call Quick Switch Inside Dropdown */}
                  <div className="pt-2 border-t border-slate-100 px-3 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Accept Instant Calls
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleCallAvailability}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          readyForCalls
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {readyForCalls ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Doctor Profile Dedicated Option (Distinct Boundary) */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold cursor-pointer shadow-2xs ${
                activeTab === 'profile'
                  ? 'border-teal-500 bg-teal-600 text-white shadow-sm font-extrabold'
                  : 'border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-800'
              }`}
              title="View Doctor Profile, Ratings & Reviews, and Degrees"
            >
              <User className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-white' : 'text-teal-600'}`} />
              <span className="hidden sm:inline">Doctor Profile</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>{rating}</span>
              </span>
            </button>

            {/* 5. Translation / Language Option (Distinct Boundary) */}
            <div className="p-0.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition shadow-2xs">
              <LanguageSelector variant="light" />
            </div>

            {/* 6. AI Scanner Tool Shortcut (Distinct Boundary) */}
            <button
              type="button"
              onClick={() => onOpenPrescriptionModal('all')}
              className="hidden lg:flex px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 transition items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
              title="Open AI Prescription & Diagnostic Scanner"
            >
              <Scan className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Rx & Labs</span>
            </button>

            {/* 7. Citizen Portal Link (Distinct Boundary) */}
            <Link
              to="/"
              className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition text-xs font-semibold shadow-2xs"
              title="View Patient-facing Public Portal"
            >
              <span>Citizen Portal</span>
            </Link>

            {/* 8. Logout Button (Distinct Boundary) */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
              title="Logout from clinical OPD desk"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>

        </div>

        {/* ROW 2: Primary Navigation Tabs with Distinct Boundaries */}
        <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          
          <nav className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            
            {/* Tab: Patient Appointments */}
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-white text-teal-700 border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Video className={`w-3.5 h-3.5 ${activeTab === 'appointments' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Appointments</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                activeTab === 'appointments'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {scheduledCount}
              </span>
            </button>

            {/* Tab: Duty Schedule & Call Availability */}
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-teal-700 border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'schedule' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Call Availability & Timings</span>
              {!readyForCalls && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>

            {/* Tab: Patient EHR & History */}
            <button
              type="button"
              onClick={() => setActiveTab('ehr')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'ehr'
                  ? 'bg-white text-teal-700 border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'ehr' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Patient EHR & History</span>
            </button>

            {/* Tab: Facility Telemetry */}
            <button
              type="button"
              onClick={() => setActiveTab('hospital')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'hospital'
                  ? 'bg-white text-teal-700 border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activeTab === 'hospital' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Facility Telemetry</span>
              <span className="sm:hidden">Facility</span>
            </button>

            {/* Tab: Doctor Profile & Ratings */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Ratings</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black flex items-center gap-0.5 ${
                activeTab === 'profile'
                  ? 'bg-teal-700 text-white'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{rating}</span>
              </span>
            </button>

          </nav>

          {/* Right Registry ID Tag */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>HPR ID:</span>
            <span className="font-bold text-slate-800">
              {doctorUser.profile?.abhaHprId || 'HPR-2026-99210@abdm'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};
