import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useSearchParams } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { CitizenPage } from './pages/CitizenPage';
import { BioDataPage } from './pages/BioDataPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { TeleConsultPage } from './pages/TeleConsultPage';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AmbulanceDashboard } from './pages/AmbulanceDashboard';
import { AmbulanceLoginPage } from './pages/AmbulanceLoginPage';
import { TrafficPoliceDashboard } from './pages/TrafficPoliceDashboard';
import { TrafficPoliceLoginPage } from './pages/TrafficPoliceLoginPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorLoginPage } from './pages/DoctorLoginPage';
import { PublicWorkersPage } from './pages/PublicWorkersPage';
import { PatientRecordViewPage } from './pages/PatientRecordViewPage';
import { ArchitectureAuditPage } from './pages/ArchitectureAuditPage';
import { Building2, ArrowRight, Truck, ShieldCheck, Stethoscope, Cpu } from './components/icons';

import { LanguageProvider, useLanguage } from './context/LanguageContext';

/**
 * Public Citizen Healthcare Portal (Route: /)
 */
const CitizenPortal: React.FC<{ defaultTab?: ActiveTab }> = ({ defaultTab }) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ActiveTab | null;
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (defaultTab) return defaultTab;
    if (tabParam && ['citizen', 'emergency', 'profile', 'teleconsult'].includes(tabParam)) {
      return tabParam;
    }
    return 'citizen';
  });
  const { tr } = useLanguage();

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (tabParam && ['citizen', 'emergency', 'profile', 'teleconsult'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [defaultTab, tabParam]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'citizen' && (
          <CitizenPage 
            onOpenEmergency={() => setActiveTab('emergency')} 
            onOpenTeleConsult={() => setActiveTab('teleconsult')}
          />
        )}
        {activeTab === 'emergency' && (
          <EmergencyPage />
        )}
        {activeTab === 'profile' && (
          <BioDataPage />
        )}
        {activeTab === 'teleconsult' && (
          <TeleConsultPage />
        )}
      </main>

      {/* Citizen Portal Footer with Portal Links */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs space-y-2">
        <p className="font-semibold text-slate-300">
          {tr.footer.copyright}
        </p>
        <p>
          {tr.footer.tagline}
        </p>
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/ambulance"
            className="text-slate-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-800 hover:border-emerald-700 bg-slate-950/60"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tr.nav.ambulanceFull}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/hospital"
            className="text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-800 hover:border-blue-700 bg-slate-950/60"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{tr.nav.hospitalPortalFull}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/doctor"
            className="text-teal-400/90 hover:text-teal-300 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-teal-900/50 hover:border-teal-600 bg-teal-950/30"
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            <span>Doctor Portal</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/police"
            className="text-amber-400/90 hover:text-amber-300 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-amber-900/50 hover:border-amber-600 bg-amber-950/30"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>{tr.nav.trafficPoliceFull}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/hospital?tab=ambulance"
            className="text-emerald-400/90 hover:text-emerald-300 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-emerald-900/50 hover:border-emerald-600 bg-emerald-950/30"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tr.nav.paramedicCrew}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/workers"
            className="text-purple-400/90 hover:text-purple-300 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-purple-900/50 hover:border-purple-600 bg-purple-950/30"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>{tr.nav.ashaPortal}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/architecture"
            className="text-emerald-400 hover:text-emerald-300 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-emerald-800 hover:border-emerald-600 bg-emerald-950/50 font-bold"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Technical Audit & Architecture</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

/**
 * Dedicated Hospital Operations Portal (Route: /hospital)
 */
const HospitalPortal: React.FC = () => {
  return <HospitalDashboard />;
};

/**
 * Dedicated Ambulance Crew Operations Portal (Route: /ambulance)
 */
const AmbulancePortal: React.FC = () => {
  const { ambulanceUser } = useApp();

  if (!ambulanceUser) {
    return <AmbulanceLoginPage />;
  }

  return <AmbulanceDashboard />;
};

/**
 * Dedicated Traffic Police Portal (Route: /police)
 * Guards access with Signal Post Login
 */
const TrafficPolicePortal: React.FC = () => {
  const { policeUserSignal } = useApp();

  if (!policeUserSignal) {
    return <TrafficPoliceLoginPage />;
  }

  return <TrafficPoliceDashboard />;
};

/**
 * Dedicated Doctor Clinical OPD Portal (Route: /doctor)
 */
const DoctorPortal: React.FC = () => {
  const { doctorUser } = useApp();

  if (!doctorUser) {
    return <DoctorLoginPage />;
  }

  return <DoctorDashboard />;
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Citizen Portal */}
            <Route path="/" element={<CitizenPortal />} />
            <Route path="/teleconsult" element={<CitizenPortal defaultTab="teleconsult" />} />

            {/* Doctor Clinical & Tele-OPD Portal */}
            <Route path="/doctor" element={<DoctorPortal />} />
            <Route path="/doctor/login" element={<DoctorLoginPage />} />

            {/* Hospital Staff Portal */}
            <Route path="/hospital" element={<HospitalPortal />} />

            {/* Ambulance Crew Portal */}
            <Route path="/ambulance" element={<AmbulancePortal />} />

            {/* Traffic Police Signal Post Dashboard */}
            <Route path="/police" element={<TrafficPolicePortal />} />
            <Route path="/traffic" element={<Navigate to="/police" replace />} />

            {/* Frontline Healthcare Workers & ASHA Portal */}
            <Route path="/workers" element={<PublicWorkersPage />} />
            <Route path="/asha" element={<Navigate to="/workers" replace />} />
            <Route path="/frontline" element={<Navigate to="/workers" replace />} />

            {/* Doctor Clinical EHR & Patient QR Scan Route */}
            <Route path="/records" element={<PatientRecordViewPage />} />
            <Route path="/doctor/records" element={<Navigate to="/records" replace />} />

            {/* Complete Technical Audit & Architecture Specification */}
            <Route path="/architecture" element={<ArchitectureAuditPage />} />
            <Route path="/audit" element={<ArchitectureAuditPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </LanguageProvider>
  );
}
