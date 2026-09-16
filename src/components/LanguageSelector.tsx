import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages, ChevronDown } from './icons';
import { LanguageCode } from '../locales';

interface LanguageSelectorProps {
  variant?: 'light' | 'dark' | 'compact' | 'pill';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'light',
  showLabel = true,
  className = ''
}) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  // Direct pill variant (renders 3 tabs side by side)
  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center h-10 rounded-xl p-1 border ${
        isDark 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-slate-100/90 border-slate-200 shadow-xs'
      } ${className}`}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`h-full flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60 font-bold'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
              title={l.label}
            >
              <span className="text-xs">{l.flag}</span>
              <span>{l.nativeLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`h-10 flex items-center gap-2 px-3 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Languages className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <span className="text-xs">{currentLanguageInfo.flag}</span>
        {showLabel && (
          <span className="font-semibold tracking-tight">{currentLanguageInfo.nativeLabel}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50 transition-all ${
            isDark
              ? 'bg-slate-900/95 backdrop-blur-md border-slate-700 text-white'
              : 'bg-white/95 backdrop-blur-md border-slate-200/80 text-slate-800'
          }`}
          role="menu"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            Choose Language / भाषा
          </div>
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-emerald-900/40 text-emerald-300 font-bold'
                      : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/50'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100/70'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.flag}</span>
                  <div>
                    <span className="block leading-tight font-semibold">{item.nativeLabel}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">{item.label}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
