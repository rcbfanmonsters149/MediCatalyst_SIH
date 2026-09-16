import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  AlertOctagon, 
  Building2,
  Truck,
  ShieldCheck,
  Lock,
  User,
  ChevronDown,
  Menu,
  X,
  ArrowRight
} from './icons';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export type ActiveTab = 'citizen' | 'emergency' | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { activeDispatch, user, isLoggedIn } = useApp();
  const { tr } = useLanguage();
  const [isPortalsOpen, setIsPortalsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const portalsRef = useRef<HTMLDivElement>(null);

  // Close portals dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target as Node)) {
        setIsPortalsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const portalsList = [
    {
      to: '/hospital',
      title: tr.nav.hospitalPortal,
      desc: 'Bed & ICU Availability, ER Triage Desk',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      to: '/ambulance',
      title: tr.nav.ambulance,
      desc: 'Cockpit HUD, GPS Routing & Vitals',
      icon: Truck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      to: '/police',
      title: tr.nav.trafficPolice,
      desc: 'Green Corridor Signal Post Control',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      to: '/workers',
      title: tr.nav.ashaShort,
      desc: 'Village Field Reports & Maternal Care',
      icon: Heart,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Brand Identity */}
          <div 
            onClick={() => {
              setActiveTab('citizen');
              setIsMobileMenuOpen(false);
            }} 
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
                  Med<span className="text-emerald-600">Catalyst</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  {tr.nav.citizenPortal}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block font-medium truncate max-w-[280px]">
                {tr.nav.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Center: Primary Citizen Actions (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>{tr.nav.hospitalsAndDoctors}</span>
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === 'emergency'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-600 hover:bg-red-50/80'
              }`}
            >
              <AlertOctagon className={`w-4 h-4 ${activeTab === 'emergency' ? 'text-white' : 'text-red-600'}`} />
              <span>{tr.nav.emergencySOS}</span>
              {activeDispatch && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          </nav>

          {/* Right: Symmetrical, Comparable-Sized Controls (All h-10) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* 1. Language Selector Button (h-10) */}
            <LanguageSelector variant="light" />

            {/* 2. Operational Portals Dropdown Button (h-10) */}
            <div className="relative" ref={portalsRef}>
              <button
                type="button"
                onClick={() => setIsPortalsOpen(prev => !prev)}
                className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                  isPortalsOpen
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                title={tr.nav.portalsDesc}
                aria-expanded={isPortalsOpen}
              >
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline font-semibold">{tr.nav.portals}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPortalsOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>

              {/* Portals Floating Card Menu */}
              {isPortalsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                      {tr.nav.portals}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {tr.nav.portalsDesc}
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    {portalsList.map((portal) => {
                      const Icon = portal.icon;
                      return (
                        <Link
                          key={portal.to}
                          to={portal.to}
                          onClick={() => setIsPortalsOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200/60"
                        >
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${portal.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                              {portal.title}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {portal.desc}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Citizen Profile / ABHA Button (h-10) */}
            <button 
              onClick={() => {
                setActiveTab('profile');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 px-3 rounded-xl border transition-all select-none text-xs flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
              title={isLoggedIn ? `ABHA Health Locker: ${user?.fullName}` : tr.nav.citizenLogin}
            >
              {isLoggedIn && user ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.fullName?.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 leading-none truncate max-w-[80px] sm:max-w-[110px]">
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ABHA
                  </span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="font-semibold text-slate-700 leading-none">
                    {tr.common.login}
                  </span>
                </>
              )}
            </button>

            {/* 4. Mobile Menu Hamburger Toggle (h-10 w-10) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex lg:hidden items-center justify-center shadow-xs cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>

          </div>

        </div>

        {/* Mobile Slide-Down Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Primary Mobile Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('citizen');
                  setIsMobileMenuOpen(false);
                }}
                className={`h-11 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>{tr.nav.hospitalsAndDoctors}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('emergency');
                  setIsMobileMenuOpen(false);
                }}
                className={`h-11 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  activeTab === 'emergency'
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{tr.nav.emergencySOS}</span>
              </button>
            </div>

            {/* Operational Portals in Mobile */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {tr.nav.portals}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {portalsList.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <Link
                      key={portal.to}
                      to={portal.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${portal.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{portal.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile Tab in Mobile */}
            <button
              onClick={() => {
                setActiveTab('profile');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{isLoggedIn && user ? `${tr.nav.profile}: ${user.fullName}` : tr.nav.citizenLogin}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

          </div>
        )}

      </div>
    </header>
  );
};

