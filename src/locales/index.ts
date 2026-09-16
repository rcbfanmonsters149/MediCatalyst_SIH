import { en, TranslationSchema } from './en';
import { hi } from './hi';
import { mr } from './mr';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  voiceCode: 'en-IN' | 'hi-IN' | 'mr-IN';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🌐',
    voiceCode: 'en-IN'
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
    voiceCode: 'hi-IN'
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    flag: '🚩',
    voiceCode: 'mr-IN'
  }
];

export const translations: Record<LanguageCode, TranslationSchema> = {
  en,
  hi,
  mr
};

export type { TranslationSchema };
