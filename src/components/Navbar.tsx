import React from 'react';
import { 
  Heart, 
  Activity, 
  AlertOctagon, 
  User,
  Building2,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export type ActiveTab = 'citizen' | 'emergency' | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { activeDispatch, user } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            onClick={() => setActiveTab('citizen')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
                  Med<span className="text-emerald-600">Catalyst</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Citizen Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Rural Healthcare Accessibility & Emergency Ambulance Network
              </p>
            </div>
          </div>

          {/* Navigation Links for Public / Citizens */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'citizen'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Hospitals & Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'emergency'
                  ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
                  : 'text-red-600 hover:bg-red-50/70'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>Emergency SOS</span>
              {activeDispatch && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
              )}
            </button>
          </nav>

          {/* Right Action: Ambulance & Hospital Portals & User Profile Pill */}
          <div className="flex items-center gap-3">
            <Link
              to="/ambulance"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 text-xs font-bold transition shadow-2xs"
              title="Ambulance Driver Cockpit Login"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambulance Portal</span>
            </Link>

            <Link
              to="/hospital"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 text-xs font-bold transition shadow-2xs"
              title="Hospital Staff Operations Portal Login"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Hospital Portal</span>
            </Link>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition select-none text-xs text-left ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Click to view your personal health profile, ABHA ID, and records"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-800 leading-none">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">ABHA: {user.healthId.slice(0, 7)}...</p>
              </div>
            </button>
          </div>

        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition ${
              activeTab === 'citizen' ? 'bg-emerald-600 text-white' : 'text-slate-600'
            }`}
          >
            Hospitals & Beds
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition ${
              activeTab === 'emergency' ? 'bg-red-600 text-white' : 'text-red-600'
            }`}
          >
            Emergency SOS
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition ${
              activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-600'
            }`}
          >
            My Profile
          </button>
        </div>

      </div>
    </header>
  );
};
