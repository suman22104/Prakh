import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import { getSpeechLocale, useTextToSpeech } from './useTextToSpeech';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

/**
 * Combined speech hook composing `useTextToSpeech` (LanguageContext-aware TTS)
 * with browser SpeechRecognition (STT) voice input.
 */
export function useSpeech(language?: LanguageCode, isOnline = true) {
  const tts = useTextToSpeech({ preferNeuralOnline: true, isOnline });
  const activeLanguage = language ?? tts.language;

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

  const sttSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );

  const startListening = useCallback(
    (onTranscript: (transcript: string) => void) => {
      if (!sttSupported) return;
      const Ctor = ((window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as
        | (new () => SpeechRecognitionInstanceLike)
        | undefined;
      if (!Ctor) return;

      try {
        const recognition = new Ctor();
        recognition.lang = getSpeechLocale(activeLanguage);
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript ?? '';
          if (transcript) onTranscript(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
      } catch {
        setIsListening(false);
      }
    },
    [activeLanguage, sttSupported]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const speak = useCallback(
    (text: string, overrideLanguage?: LanguageCode) =>
      tts.speak(text, overrideLanguage ?? activeLanguage),
    [activeLanguage, tts]
  );

  return {
    ttsSupported: tts.isSupported,
    sttSupported,
    isSpeaking: tts.isSpeaking,
    isLoadingAudio: tts.isLoadingAudio,
    isListening,
    audioSource: tts.audioSource,
    speechError: tts.error,
    speak,
    stopSpeaking: tts.stop,
    startListening,
    stopListening,
  };
}
