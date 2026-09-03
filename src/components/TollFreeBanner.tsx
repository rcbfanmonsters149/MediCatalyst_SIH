import React from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert, HeartPulse } from 'lucide-react';

export const TollFreeBanner: React.FC = () => {
  return (
    <div className="bg-red-650 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-bold tracking-wide uppercase text-[11px] sm:text-xs bg-red-900/50 px-2 py-0.5 rounded border border-red-400/30">
              National Emergency Hotlines (24x7 Toll-Free)
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-4 font-semibold">
            <a 
              href="tel:108" 
              className="flex items-center gap-1.5 bg-white text-red-700 px-3 py-1 rounded-full shadow-sm hover:bg-red-50 transition transform hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>108</span>
              <span className="text-[11px] font-normal text-slate-600 hidden md:inline">(Ambulance)</span>
            </a>

            <a 
              href="tel:112" 
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full border border-white/20 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>112</span>
              <span className="text-[11px] opacity-80 hidden md:inline">(National Emergency)</span>
            </a>

            <a 
              href="tel:102" 
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full border border-white/20 transition"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>102</span>
              <span className="text-[11px] opacity-80 hidden md:inline">(Maternal & Infant)</span>
            </a>

            <a 
              href="tel:1075" 
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full border border-white/20 transition hidden sm:flex"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>1075</span>
              <span className="text-[11px] opacity-80 hidden md:inline">(Health Helpline)</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
