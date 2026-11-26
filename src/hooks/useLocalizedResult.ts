import { useCallback, useEffect, useState } from 'react';
import type { LanguageCode, ScamAnalysisResult } from '../../shared/types';
import { translateResultContent, type LocalizedResultFields } from '../services/api';

export function useLocalizedResult(
  result: ScamAnalysisResult | null | undefined,
  targetLanguage: LanguageCode,
  isOnline: boolean
) {
  const [localized, setLocalized] = useState<LocalizedResultFields | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!result) {
      setLocalized(null);
      setIsTranslating(false);
      return;
    }

    if (result.language === targetLanguage) {
      setLocalized({
        language: result.language,
        explanation: result.explanation,
        warningSigns: result.warningSigns,
        recommendedActions: result.recommendedActions,
        advisoryDisclaimer: result.advisoryDisclaimer,
        translationSource: 'original',
      });
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    void translateResultContent(result, targetLanguage, isOnline).then((translated) => {
      if (!cancelled) {
        setLocalized(translated);
        setIsTranslating(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOnline, result, targetLanguage]);

  const ensureTranslated = useCallback(async (): Promise<LocalizedResultFields | null> => {
    if (!result) return null;
    if (localized && localized.language === targetLanguage) return localized;
    setIsTranslating(true);
    try {
      const translated = await translateResultContent(result, targetLanguage, isOnline);
      setLocalized(translated);
      return translated;
    } finally {
      setIsTranslating(false);
    }
  }, [isOnline, localized, result, targetLanguage]);

  const activeFields: LocalizedResultFields | null =
    result && localized && localized.language === targetLanguage
      ? localized
      : result
        ? {
            language: result.language,
            explanation: result.explanation,
            warningSigns: result.warningSigns,
            recommendedActions: result.recommendedActions,
            advisoryDisclaimer: result.advisoryDisclaimer,
            translationSource: 'original',
          }
        : null;

  return {
    localized: activeFields,
    isTranslating,
    ensureTranslated,
  };
}
