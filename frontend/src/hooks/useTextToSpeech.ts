import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageCode } from '../../../shared/types';
import { useLanguage } from '../contexts/LanguageContext';
import { synthesizeSpeechRequest } from '../services/api';

export const SPEECH_LOCALE_BY_LANGUAGE: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export const VOICE_PREFERENCES_BY_LANGUAGE: Record<LanguageCode, readonly string[]> = {
  en: ['en-in', 'en-gb', 'en-us', 'en'],
  hi: ['hi-in', 'hi'],
  bn: ['bn-in', 'bn-bd', 'bn'],
};

export interface SpeechVoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
  default?: boolean;
}

export interface ResultSpeechParams {
  verdictLabel: string;
  explanation: string;
  warningSigns?: string[];
  recommendedActions?: string[];
  maxWarnings?: number;
  maxActions?: number;
}

export interface UseTextToSpeechOptions {
  /** Speech rate for Web Speech API utterances (default: 0.94 for clear accessibility pacing). */
  rate?: number;
  /** Speech pitch for Web Speech API utterances (default: 1). */
  pitch?: number;
  /** Speech volume from 0 to 1 (default: 1). */
  volume?: number;
  /**
   * When true and online, attempts server-side multilingual neural audio first and
   * falls back seamlessly to the browser Web Speech API (`window.speechSynthesis`).
   * Defaults to false so direct hook callers use pure Web Speech API by default.
   */
  preferNeuralOnline?: boolean;
  /** Optional connectivity state used when `preferNeuralOnline` is enabled. */
  isOnline?: boolean;
}

export interface UseTextToSpeechReturn {
  language: LanguageCode;
  locale: string;
  isSupported: boolean;
  webSpeechSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoadingAudio: boolean;
  audioSource: 'web_speech' | 'neural' | null;
  error: string | null;
  speak: (text: string, overrideLanguage?: LanguageCode) => Promise<void>;
  speakResult: (params: ResultSpeechParams, overrideLanguage?: LanguageCode) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function getSpeechLocale(language: LanguageCode): string {
  return SPEECH_LOCALE_BY_LANGUAGE[language] ?? 'en-IN';
}

/**
 * Selects the closest matching Web Speech API voice for the target language
 * (English en-IN, Hindi hi-IN, Bengali bn-IN / bn-BD), preferring exact locale
 * matches and local/default voices when multiple candidates match.
 */
export function selectVoiceForLanguage<T extends SpeechVoiceLike>(
  voices: readonly T[],
  language: LanguageCode
): T | null {
  if (!voices.length) return null;

  const preferences = VOICE_PREFERENCES_BY_LANGUAGE[language] ?? VOICE_PREFERENCES_BY_LANGUAGE.en;
  for (const prefix of preferences) {
    const matches = voices.filter((voice) => {
      const normalized = voice.lang.toLowerCase().replace('_', '-');
      return normalized === prefix || normalized.startsWith(`${prefix}-`) || normalized.startsWith(prefix);
    });
    if (matches.length > 0) {
      const preferred =
        matches.find((v) => v.localService && v.default) ??
        matches.find((v) => v.localService) ??
        matches.find((v) => v.default) ??
        matches[0];
      return preferred ?? null;
    }
  }

  return null;
}

/**
 * Formats a scam-analysis result into clear, natural spoken text suitable for
 * read-aloud accessibility across English, Hindi, and Bengali.
 */
export function buildResultSpeechText(params: ResultSpeechParams): string {
  const maxWarnings = params.maxWarnings ?? 3;
  const maxActions = params.maxActions ?? 3;

  const cleanList = (items: string[] | undefined, limit: number) =>
    (items ?? [])
      .map((item) => item.trim().replace(/[.।]+$/u, ''))
      .filter((item) => item.length > 0)
      .slice(0, limit);

  const parts = [
    params.verdictLabel.trim().replace(/[.।]+$/u, ''),
    params.explanation.trim().replace(/[.।]+$/u, ''),
    ...cleanList(params.warningSigns, maxWarnings),
    ...cleanList(params.recommendedActions, maxActions),
  ].filter((part) => part.length > 0);

  return parts.join('. ');
}

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType || 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Custom React hook integrating the browser Web Speech API (`window.speechSynthesis`)
 * with LanguageContext for English (`en-IN`), Hindi (`hi-IN`), and Bengali (`bn-IN`).
 * Automatically stops playback when the active language changes or the component unmounts.
 */
export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const {
    rate = 0.94,
    pitch = 1,
    volume = 1,
    preferNeuralOnline = false,
    isOnline = true,
  } = options;

  const { language } = useLanguage();
  const locale = getSpeechLocale(language);

  const webSpeechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const isSupported = webSpeechSupported || (preferNeuralOnline && typeof window !== 'undefined');

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    webSpeechSupported ? window.speechSynthesis.getVoices() : []
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioSource, setAudioSource] = useState<'web_speech' | 'neural' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync voices asynchronously as browsers populate speechSynthesis.getVoices()
  useEffect(() => {
    if (!webSpeechSupported) return;
    const synth = window.speechSynthesis;

    const refreshVoices = () => {
      const nextVoices = synth.getVoices();
      if (nextVoices.length > 0) {
        setVoices(nextVoices);
      }
    };

    refreshVoices();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refreshVoices);
      return () => synth.removeEventListener('voiceschanged', refreshVoices);
    }
    synth.onvoiceschanged = refreshVoices;
    return () => {
      if (synth.onvoiceschanged === refreshVoices) {
        synth.onvoiceschanged = null;
      }
    };
  }, [webSpeechSupported]);

  const selectedVoice = useMemo(
    () => selectVoiceForLanguage(voices, language),
    [voices, language]
  );

  const cleanupAudioElement = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cleanupAudioElement();
    if (webSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsLoadingAudio(false);
    setIsSpeaking(false);
    setIsPaused(false);
  }, [cleanupAudioElement, webSpeechSupported]);

  const speakWithWebSpeech = useCallback(
    (text: string, targetLang: LanguageCode) => {
      if (!webSpeechSupported) {
        setError('Text-to-speech is not supported in this browser.');
        setIsSpeaking(false);
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLocale(targetLang);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const latestVoices = synth.getVoices();
      const matchedVoice = selectVoiceForLanguage(
        latestVoices.length > 0 ? latestVoices : voices,
        targetLang
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setAudioSource('web_speech');
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (event) => {
        // Ignore expected 'interrupted'/'canceled' events triggered by stop() or language change
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          setError('Could not play speech audio on this device.');
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      synth.speak(utterance);
    },
    [pitch, rate, voices, volume, webSpeechSupported]
  );

  const speak = useCallback(
    async (text: string, overrideLanguage?: LanguageCode) => {
      const cleanText = text.trim();
      if (!isSupported || !cleanText) return;

      const targetLang = overrideLanguage ?? language;
      stop();
      setError(null);

      if (preferNeuralOnline && isOnline) {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsLoadingAudio(true);

        const synthesized = await synthesizeSpeechRequest(
          cleanText,
          targetLang,
          isOnline,
          controller.signal
        );

        if (controller.signal.aborted) {
          setIsLoadingAudio(false);
          return;
        }

        setIsLoadingAudio(false);

        if (synthesized?.audioBase64) {
          try {
            const url = base64ToBlobUrl(synthesized.audioBase64, synthesized.mimeType);
            audioObjectUrlRef.current = url;
            const audio = new Audio(url);
            audio.volume = volume;
            audioRef.current = audio;

            audio.onended = () => {
              cleanupAudioElement();
              setIsSpeaking(false);
              setIsPaused(false);
            };
            audio.onerror = () => {
              cleanupAudioElement();
              speakWithWebSpeech(cleanText, targetLang);
            };

            setAudioSource('neural');
            setIsSpeaking(true);
            setIsPaused(false);
            await audio.play();
            return;
          } catch {
            cleanupAudioElement();
            // Autoplay or audio decode fallback -> use browser Web Speech API
          }
        }
      }

      speakWithWebSpeech(cleanText, targetLang);
    },
    [
      cleanupAudioElement,
      isOnline,
      isSupported,
      language,
      preferNeuralOnline,
      speakWithWebSpeech,
      stop,
      volume,
    ]
  );

  const speakResult = useCallback(
    async (params: ResultSpeechParams, overrideLanguage?: LanguageCode) => {
      const formatted = buildResultSpeechText(params);
      if (!formatted) return;
      await speak(formatted, overrideLanguage);
    },
    [speak]
  );

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
      return;
    }
    if (webSpeechSupported && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [webSpeechSupported]);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      void audioRef.current.play();
      setIsPaused(false);
      return;
    }
    if (webSpeechSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [webSpeechSupported]);

  // Respect LanguageContext changes: stop any stale-language speech immediately
  useEffect(() => {
    stop();
  }, [language, stop]);

  // Clean up active speech and audio URLs on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    language,
    locale,
    isSupported,
    webSpeechSupported,
    voices,
    selectedVoice,
    isSpeaking,
    isPaused,
    isLoadingAudio,
    audioSource,
    error,
    speak,
    speakResult,
    pause,
    resume,
    stop,
  };
}
