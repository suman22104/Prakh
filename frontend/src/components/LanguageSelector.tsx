import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSelector: React.FC<{
  size?: 'compact' | 'default' | 'large';
  highContrast?: boolean;
}> = ({ size = 'default', highContrast = false }) => {
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const buttonSizing =
    size === 'large'
      ? 'min-h-[48px] px-4 sm:px-5 text-base'
      : size === 'compact'
        ? 'min-h-[40px] sm:min-h-[36px] px-2 sm:px-2.5 text-xs'
        : 'min-h-[44px] sm:min-h-[40px] px-3.5 text-xs sm:text-sm';

  return (
    <div
      role="group"
      aria-label={t.common.languageLabel}
      className={`inline-flex items-center gap-1 p-1 rounded-xl shrink-0 max-w-full ${
        highContrast
          ? 'bg-[#FFFFFF] border-2 border-[#132A23]'
          : 'bg-[#EFE9DC] border border-[#D4CBB8]'
      }`}
    >
      <span
        className={`${
          size === 'compact' ? 'pl-1.5 pr-0.5 hidden sm:inline-flex' : 'pl-2 pr-1 hidden sm:inline-flex'
        } ${highContrast ? 'text-[#132A23]' : 'text-[#57534E]'} items-center`}
        aria-hidden="true"
      >
        <Globe className="w-4 h-4" />
      </span>
      {supportedLanguages.map((lang) => {
        const active = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-pressed={active}
            title={lang.englishLabel}
            className={`${buttonSizing} font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C84620] ${
              active
                ? highContrast
                  ? 'bg-[#132A23] text-[#FFFFFF]'
                  : 'bg-[#132A23] text-[#FAF7F0] shadow-xs'
                : highContrast
                  ? 'text-[#132A23] hover:bg-[#EFE9DC]'
                  : 'text-[#3F3A32] hover:text-[#132A23] hover:bg-[#FFFDF8]/80'
            }`}
          >
            {lang.nativeLabel}
          </button>
        );
      })}
    </div>
  );
};
