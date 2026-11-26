import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import { TRANSLATIONS, type TranslationBundle } from '../i18n/translations';

export const LANGUAGE_STORAGE_KEY = 'upi_guard_language';

export interface LanguageOption {
  code: LanguageCode;
  nativeLabel: string;
  englishLabel: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'hi', nativeLabel: 'हिन्दी', englishLabel: 'Hindi' },
  { code: 'bn', nativeLabel: 'বাংলা', englishLabel: 'Bengali' },
] as const;

export function resolveInitialLanguage(storedValue: string | null): LanguageCode {
  if (storedValue === 'hi' || storedValue === 'bn' || storedValue === 'en') {
    return storedValue;
  }
  return 'en';
}

export interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationBundle;
  supportedLanguages: readonly LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
}> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window === 'undefined') return 'en';
    try {
      return resolveInitialLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: TRANSLATIONS[language],
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return ctx;
}
