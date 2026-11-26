import { runRuleBasedAnalysis } from '../../shared/ruleEngine';
import type {
  AnalyzeRequestPayload,
  LanguageCode,
  ProviderHealthStatus,
  ScamAnalysisResult,
} from '../../shared/types';

export interface LocalizedResultFields {
  language: LanguageCode;
  explanation: string;
  warningSigns: string[];
  recommendedActions: string[];
  advisoryDisclaimer: string;
  translationSource: 'original' | 'gemini_translate' | 'local_rules';
}

export interface TtsAudioResponse {
  audioBase64: string;
  mimeType: string;
  language: LanguageCode;
  source: 'gemini_tts';
}

const translationCache = new Map<string, LocalizedResultFields>();
const ttsAudioCache = new Map<string, TtsAudioResponse>();

export async function analyzeMessageRequest(
  payload: AnalyzeRequestPayload,
  isOnline: boolean
): Promise<ScamAnalysisResult> {
  if (!isOnline) {
    return runRuleBasedAnalysis({
      message: payload.message,
      inputType: payload.inputType,
      language: payload.language,
      consent: payload.consent,
      assessmentSource: 'offline_rules',
      fallbackReason: 'Device is offline; analyzed locally on your device using safety rules.',
    });
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (res.status === 400 || res.status === 429) {
        throw new Error(errData.error || 'Please check your input and try again.');
      }
      throw new Error('Server analysis temporarily unavailable.');
    }

    return (await res.json()) as ScamAnalysisResult;
  } catch (error) {
    // If validation/rate limit error, rethrow so form shows exact validation feedback
    if (
      error instanceof Error &&
      (error.message.includes('Please') || error.message.includes('Too many'))
    ) {
      throw error;
    }

    // Network or server outage -> safe client-side offline rule fallback
    return runRuleBasedAnalysis({
      message: payload.message,
      inputType: payload.inputType,
      language: payload.language,
      consent: payload.consent,
      assessmentSource: 'offline_rules',
      fallbackReason:
        'Could not reach server; safely analyzed locally on your device using deterministic rules.',
    });
  }
}

export async function translateResultContent(
  result: ScamAnalysisResult,
  targetLanguage: LanguageCode,
  isOnline: boolean
): Promise<LocalizedResultFields> {
  if (result.language === targetLanguage) {
    return {
      language: result.language,
      explanation: result.explanation,
      warningSigns: result.warningSigns,
      recommendedActions: result.recommendedActions,
      advisoryDisclaimer: result.advisoryDisclaimer,
      translationSource: 'original',
    };
  }

  const cacheKey = `${result.id}:${targetLanguage}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const shouldCallAiTranslate =
    isOnline &&
    result.assessmentSource === 'hybrid_ai' &&
    result.consentSnapshot.allowExternalAi;

  if (shouldCallAiTranslate) {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          explanation: result.explanation,
          warningSigns: result.warningSigns,
          recommendedActions: result.recommendedActions,
          advisoryDisclaimer: result.advisoryDisclaimer,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          explanation: string;
          warningSigns: string[];
          recommendedActions: string[];
          advisoryDisclaimer: string;
        };
        const translated: LocalizedResultFields = {
          language: targetLanguage,
          explanation: data.explanation,
          warningSigns: data.warningSigns.length > 0 ? data.warningSigns : result.warningSigns,
          recommendedActions:
            data.recommendedActions.length > 0
              ? data.recommendedActions
              : result.recommendedActions,
          advisoryDisclaimer: data.advisoryDisclaimer || result.advisoryDisclaimer,
          translationSource: 'gemini_translate',
        };
        translationCache.set(cacheKey, translated);
        return translated;
      }
    } catch {
      // Fall through to deterministic local re-localization
    }
  }

  // Deterministic offline/fallback localization using local rules in targetLanguage
  const localRecomputed = runRuleBasedAnalysis({
    message: result.maskedText,
    inputType: result.inputType,
    language: targetLanguage,
    consent: result.consentSnapshot,
    assessmentSource: result.assessmentSource,
  });

  const fallback: LocalizedResultFields = {
    language: targetLanguage,
    explanation: localRecomputed.explanation,
    warningSigns:
      localRecomputed.warningSigns.length > 0 ? localRecomputed.warningSigns : result.warningSigns,
    recommendedActions: localRecomputed.recommendedActions,
    advisoryDisclaimer: localRecomputed.advisoryDisclaimer,
    translationSource: 'local_rules',
  };
  translationCache.set(cacheKey, fallback);
  return fallback;
}

export async function synthesizeSpeechRequest(
  text: string,
  language: LanguageCode,
  isOnline: boolean,
  signal?: AbortSignal
): Promise<TtsAudioResponse | null> {
  const cleanText = text.trim().slice(0, 1800);
  if (!isOnline || !cleanText) return null;

  const cacheKey = `${language}:${cleanText}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, language }),
      signal,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as TtsAudioResponse;
    if (!data.audioBase64) return null;
    if (ttsAudioCache.size > 24) {
      const oldestKey = ttsAudioCache.keys().next().value;
      if (oldestKey) ttsAudioCache.delete(oldestKey);
    }
    ttsAudioCache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export async function fetchHealthStatus(): Promise<ProviderHealthStatus | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return (await res.json()) as ProviderHealthStatus;
  } catch {
    return null;
  }
}
