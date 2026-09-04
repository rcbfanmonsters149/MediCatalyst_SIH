import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { CitizenPage } from './pages/CitizenPage';
import { BioDataPage } from './pages/BioDataPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { HospitalLoginPage } from './pages/HospitalLoginPage';
import { AmbulanceDashboard } from './pages/AmbulanceDashboard';
import { AmbulanceLoginPage } from './pages/AmbulanceLoginPage';
import { Building2, Truck, ArrowRight } from 'lucide-react';

/**
 * Public Citizen Healthcare Portal (Route: /)
 */
const CitizenPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('citizen');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'citizen' && (
          <CitizenPage 
            onOpenEmergency={() => setActiveTab('emergency')} 
          />
        )}
        {activeTab === 'emergency' && (
          <EmergencyPage />
        )}
        {activeTab === 'profile' && (
          <BioDataPage />
        )}
      </main>

      {/* Citizen Portal Footer with Portal Links */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs space-y-2">
        <p className="font-semibold text-slate-300">
          MedCatalyst • Rural Healthcare & Emergency Response Portal
        </p>
        <p>
          Empowering Rural & Underserved Communities with Connected Emergency Healthcare Access
        </p>
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/ambulance"
            className="text-slate-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-800 hover:border-emerald-700 bg-slate-950/60"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ambulance Driver Cockpit Login</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            to="/hospital"
            className="text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-800 hover:border-blue-700 bg-slate-950/60"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Hospital Staff Operations Portal Login</span>
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
  const { hospitalUser } = useApp();

  if (!hospitalUser) {
    return <HospitalLoginPage />;
  }

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

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Citizen Portal */}
          <Route path="/" element={<CitizenPortal />} />

          {/* Hospital Staff Portal */}
          <Route path="/hospital" element={<HospitalPortal />} />

          {/* Ambulance Crew Portal */}
          <Route path="/ambulance" element={<AmbulancePortal />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
