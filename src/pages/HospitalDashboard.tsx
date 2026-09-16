import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  AlertOctagon, 
  ExternalLink, 
  CheckCircle2,
  Stethoscope,
  Radio,
  MapPin,
  Truck
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { HospitalManagementTab } from '../components/hospital/HospitalManagementTab';
import { HospitalEmergencyTab } from '../components/hospital/HospitalEmergencyTab';
import { HospitalAmbulancePortalTab } from '../components/hospital/HospitalAmbulancePortalTab';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

export type HospitalSubTab = 'management' | 'emergency' | 'ambulance';

export const HospitalDashboard: React.FC = () => {
  const { 
    hospitals, 
    selectedHospitalId, 
    setSelectedHospitalId,
    activeDispatch
  } = useApp();
  const { tr, language } = useLanguage();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const validTabs: HospitalSubTab[] = ['management', 'emergency', 'ambulance'];
  const initialTab = validTabs.includes(searchParams.get('tab') as HospitalSubTab) 
    ? (searchParams.get('tab') as HospitalSubTab) 
    : 'management';

  const [activeSubTab, setActiveSubTab] = useState<HospitalSubTab>(initialTab);
  const [notification, setNotification] = useState<string | null>(null);

  // Always retrieve the latest hospital state from hospitals array for live reactivity
  const currentHospId = selectedHospitalId || hospitals[0]?.id;
  const hospital = hospitals.find(h => h.id === currentHospId) || hospitals[0];

  const hasActiveEmergency = activeDispatch && activeDispatch.currentHospitalId === hospital.id;

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-16 font-sans">
      
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
                  Med<span className="text-blue-400">Catalyst</span> {tr.nav.hospitalPortal}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  ID: {hospital.id.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {tr.hospital.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="dark" />
            <Link
              to="/"
              className="h-10 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-xs"
              title="Open the citizen-facing public portal"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{language === 'mr' ? 'नागरिक पोर्टल पहा' : language === 'hi' ? 'नागरिक पोर्टल देखें' : 'View Public Citizen Portal'}</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Live Notification Floating Toast */}
        {notification && (
          <div className="fixed top-20 right-6 z-[9999] p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-emerald-500 max-w-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">{notification}</p>
              <span className="text-[10px] text-emerald-100 font-mono">{tr.common.live}</span>
            </div>
          </div>
        )}

        {/* Facility Identity Banner & Desk Switcher */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {language === 'mr' ? 'अधिकृत रुग्णालय परिचालन' : language === 'hi' ? 'अधिकृत अस्पताल परिचालन' : 'Authorized Facility Operations'}
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
              <span>{tr.citizen.emergencyContact}: {hospital.phone}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {language === 'mr' ? 'रुग्णालय केंद्र निवडा:' : language === 'hi' ? 'अस्पताल डेस्क चुनें:' : 'Switch Facility Desk:'}
            </span>
            <select
              value={hospital.id}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* THREE SUB-PAGES NAVIGATION TABS */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
          
          {/* Tab 1: Staff & Resource Management */}
          <button
            onClick={() => setActiveSubTab('management')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'management'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{tr.hospital.managementTab}</span>
          </button>

          {/* Tab 2: Emergency Response & Ambulance Tracking */}
          <button
            onClick={() => setActiveSubTab('emergency')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer relative ${
              activeSubTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{tr.hospital.emergencyQueueTab}</span>

            {/* Pulsing Active Emergency Notification Badge */}
            {hasActiveEmergency && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 ml-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                1 {language === 'mr' ? 'येणारा SOS' : language === 'hi' ? 'आने वाला SOS' : 'Inbound SOS'}
              </span>
            )}
          </button>

          {/* Tab 3: Ambulance Operations & Form Upload Desk */}
          <button
            onClick={() => setActiveSubTab('ambulance')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'ambulance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{tr.hospital.ambulanceFleetTab}</span>
          </button>

        </div>

        {/* RENDER THE ACTIVE SUB-PAGE */}
        {activeSubTab === 'management' && (
          <HospitalManagementTab hospital={hospital} onNotify={triggerNotify} />
        )}
        {activeSubTab === 'emergency' && (
          <HospitalEmergencyTab 
            hospital={hospital} 
            onNotify={triggerNotify} 
            onSwitchToAmbulancePortal={() => setActiveSubTab('ambulance')}
          />
        )}
        {activeSubTab === 'ambulance' && (
          <HospitalAmbulancePortalTab hospital={hospital} onNotify={triggerNotify} />
        )}

      </div>

    </div>
  );
};
