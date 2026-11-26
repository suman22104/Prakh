import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { LanguageCode } from '../../../shared/types';
import type { ServerConfig } from '../config/env';
import type { TranslateRequestPayload, TtsRequestPayload } from '../utils/validators';

export interface TranslatedSafetyContent {
  targetLanguage: LanguageCode;
  explanation: string;
  warningSigns: string[];
  recommendedActions: string[];
  advisoryDisclaimer: string;
  source: 'gemini_translate';
}

export interface SynthesizedSpeechResult {
  audioBase64: string;
  mimeType: string;
  language: LanguageCode;
  source: 'gemini_tts';
}

const TARGET_LANGUAGE_DESCRIPTIONS: Record<LanguageCode, string> = {
  en: 'Simple, clear, everyday Indian English without technical jargon',
  hi: 'Natural, simple everyday Hindi in Devanagari script (हिन्दी) without technical jargon',
  bn: 'Natural, simple everyday Bengali in Bengali script (বাংলা) without technical jargon',
};

const TTS_STYLE_BY_LANGUAGE: Record<LanguageCode, string> = {
  en: 'Calm, clear, reassuring Indian English civic safety announcer speaking at a measured, easy-to-follow pace',
  hi: 'Calm, clear, reassuring natural Hindi speaker (हिन्दी) speaking at a measured, easy-to-follow pace for everyday citizens',
  bn: 'Calm, clear, reassuring natural Bengali speaker (বাংলা) speaking at a measured, easy-to-follow pace for everyday citizens',
};

const TTS_FALLBACK_LEADIN: Record<LanguageCode, string> = {
  en: 'Read aloud clearly in calm, reassuring Indian English:',
  hi: 'Read aloud clearly in natural, calm Hindi:',
  bn: 'Read aloud clearly in natural, calm Bengali:',
};

function createGeminiClient(config: ServerConfig, apiVersion?: string): GoogleGenAI {
  if (!config.geminiApiKey || config.geminiApiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API key is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey: config.geminiApiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callTranslationModel(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  useThinkingConfig: boolean
) {
  return ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction:
        'You are a careful civic financial-safety translator for India (English, Hindi, Bengali). Translate calmly and faithfully into plain everyday language. Return strict JSON only.',
      ...(useThinkingConfig
        ? {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          }
        : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          warningSigns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          advisoryDisclaimer: { type: Type.STRING },
        },
        required: ['explanation', 'warningSigns', 'recommendedActions', 'advisoryDisclaimer'],
      },
    },
  });
}

export async function translateSafetyContent(
  payload: TranslateRequestPayload,
  config: ServerConfig
): Promise<TranslatedSafetyContent> {
  const ai = createGeminiClient(config);

  const prompt = [
    `Translate the following UPI digital payment safety advisory fields accurately into: ${TARGET_LANGUAGE_DESCRIPTIONS[payload.targetLanguage]}.`,
    'Preserve safety numbers such as 1930, cybercrime.gov.in, UPI, OTP, PIN, and KYC accurately.',
    'Do not add new facts, do not claim 100% safety, and keep the exact list counts for warningSigns and recommendedActions.',
    'Input JSON:',
    JSON.stringify({
      explanation: payload.explanation,
      warningSigns: payload.warningSigns,
      recommendedActions: payload.recommendedActions,
      advisoryDisclaimer: payload.advisoryDisclaimer ?? '',
    }),
  ].join('\n');

  const primaryModel = config.geminiModel || 'gemini-2.5-flash';
  const attemptPlan = [
    { model: primaryModel, apiVersion: undefined, thinking: false, waitMs: 0 },
    { model: 'gemini-2.5-flash-lite', apiVersion: undefined, thinking: false, waitMs: 250 },
    { model: 'gemini-3.1-flash-lite', apiVersion: 'v1beta', thinking: false, waitMs: 600 },
  ];

  let response: Awaited<ReturnType<typeof callTranslationModel>> | null = null;
  let lastError: unknown = null;

  for (const attempt of attemptPlan) {
    if (attempt.waitMs > 0) {
      await delay(attempt.waitMs);
    }
    try {
      const client = attempt.apiVersion ? createGeminiClient(config, attempt.apiVersion) : ai;
      response = await callTranslationModel(client, attempt.model, prompt, attempt.thinking);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('Translation provider unavailable.');
  }

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Translation model returned an empty response.');
  }

  const parsed = JSON.parse(rawText) as Partial<TranslatedSafetyContent>;
  if (
    typeof parsed.explanation !== 'string' ||
    !Array.isArray(parsed.warningSigns) ||
    !Array.isArray(parsed.recommendedActions)
  ) {
    throw new Error('Translation response did not match the required schema.');
  }

  return {
    targetLanguage: payload.targetLanguage,
    explanation: parsed.explanation.trim(),
    warningSigns: parsed.warningSigns
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim()),
    recommendedActions: parsed.recommendedActions
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim()),
    advisoryDisclaimer:
      typeof parsed.advisoryDisclaimer === 'string' && parsed.advisoryDisclaimer.trim()
        ? parsed.advisoryDisclaimer.trim()
        : payload.advisoryDisclaimer ?? '',
    source: 'gemini_translate',
  };
}

interface TtsAttempt {
  model: string;
  apiVersion?: string;
  useSpeechMetadata: boolean;
  includeSpeechConfig: boolean;
}

async function callTtsModel(
  config: ServerConfig,
  attempt: TtsAttempt,
  payload: TtsRequestPayload
) {
  const ai = createGeminiClient(config, attempt.apiVersion);
  const part = attempt.useSpeechMetadata
    ? {
        text: payload.text,
        speechMetadata: {
          style: TTS_STYLE_BY_LANGUAGE[payload.language],
        },
      }
    : {
        text: `${TTS_FALLBACK_LEADIN[payload.language]} ${payload.text}`,
      };

  return ai.models.generateContent({
    model: attempt.model,
    contents: [
      {
        role: 'user',
        parts: [part],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      ...(attempt.includeSpeechConfig
        ? {
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          }
        : {}),
    },
  });
}

export async function synthesizeSpeech(
  payload: TtsRequestPayload,
  config: ServerConfig
): Promise<SynthesizedSpeechResult> {
  const attempts: TtsAttempt[] = [
    {
      model: 'gemini-3.8-flash-lite-tts',
      apiVersion: 'v1beta',
      useSpeechMetadata: true,
      includeSpeechConfig: true,
    },
    {
      model: 'gemini-3.8-flash-lite-tts',
      apiVersion: 'v1beta',
      useSpeechMetadata: false,
      includeSpeechConfig: true,
    },
    {
      model: 'gemini-3.8-flash-lite-tts',
      useSpeechMetadata: false,
      includeSpeechConfig: false,
    },
    {
      model: 'gemini-3.8-flash-tts',
      apiVersion: 'v1beta',
      useSpeechMetadata: true,
      includeSpeechConfig: true,
    },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const response = await callTtsModel(config, attempt, payload);
      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlineData?.data) {
        return {
          audioBase64: inlineData.data,
          mimeType: inlineData.mimeType || 'audio/wav',
          language: payload.language,
          source: 'gemini_tts',
        };
      }
      lastError = new Error(`${attempt.model} returned no audio bytes.`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Speech synthesis model did not return audio data.');
}
