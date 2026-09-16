import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LanguageCode, 
  LanguageInfo, 
  SUPPORTED_LANGUAGES, 
  translations, 
  TranslationSchema 
} from '../locales';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  voiceLanguage: 'en-IN' | 'hi-IN' | 'mr-IN';
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  tr: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'medcatalyst_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && ['en', 'hi', 'mr'].includes(saved)) {
        return saved;
      }
      // Check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('mr')) return 'mr';
      if (browserLang.startsWith('hi')) return 'hi';
    } catch {
      // ignore localStorage errors in sandboxes
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    // Update html lang attribute for accessibility
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const voiceLanguage = currentLanguageInfo.voiceCode;
  const tr = translations[language] || translations.en;

  const t = useCallback((keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: unknown = translations[language] || translations.en;
    let fallback: unknown = translations.en;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
      }

      if (fallback && typeof fallback === 'object' && key in (fallback as Record<string, unknown>)) {
        fallback = (fallback as Record<string, unknown>)[key];
      } else {
        fallback = undefined;
      }
    }

    let result = (typeof current === 'string' ? current : (typeof fallback === 'string' ? fallback : keyPath));

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return result;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageInfo,
    voiceLanguage,
    t,
    tr
  }), [language, setLanguage, currentLanguageInfo, voiceLanguage, t, tr]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
