import type { AnalyzeRequestPayload, InputType, LanguageCode } from '../../../shared/types';

const VALID_INPUT_TYPES = new Set<InputType>(['sms', 'whatsapp', 'url', 'upi_request']);
const VALID_LANGUAGES = new Set<LanguageCode>(['en', 'hi', 'bn']);

export interface ValidationOutcome {
  valid: boolean;
  error?: string;
  code?: string;
  payload?: AnalyzeRequestPayload;
}

export function sanitizePlainText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function validateAnalyzeRequest(body: unknown): ValidationOutcome {
  if (!body || typeof body !== 'object') {
    return { valid: false, code: 'INVALID_BODY', error: 'Request payload must be a JSON object.' };
  }

  const raw = body as Record<string, unknown>;
  const message = sanitizePlainText(raw.message, 2500);
  if (!message) {
    return {
      valid: false,
      code: 'EMPTY_INPUT',
      error: 'Please paste or enter a message, URL, or UPI request to analyze.',
    };
  }

  if (typeof raw.message === 'string' && raw.message.trim().length > 2500) {
    return {
      valid: false,
      code: 'INPUT_TOO_LONG',
      error: 'Message is too long. Please submit up to 2,500 characters.',
    };
  }

  const inputType = raw.inputType as InputType;
  if (!VALID_INPUT_TYPES.has(inputType)) {
    return {
      valid: false,
      code: 'INVALID_INPUT_TYPE',
      error: 'Input type must be one of sms, whatsapp, url, or upi_request.',
    };
  }

  const language = raw.language as LanguageCode;
  if (!VALID_LANGUAGES.has(language)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_LANGUAGE',
      error: 'Unsupported language. Supported languages are English (en), Hindi (hi), and Bengali (bn).',
    };
  }

  if (!raw.consent || typeof raw.consent !== 'object') {
    return {
      valid: false,
      code: 'MISSING_CONSENT',
      error: 'Explicit consent preferences are required before running an analysis.',
    };
  }

  const rawConsent = raw.consent as Record<string, unknown>;
  if (
    typeof rawConsent.allowExternalAi !== 'boolean' ||
    typeof rawConsent.allowStorage !== 'boolean' ||
    typeof rawConsent.allowHumanReview !== 'boolean'
  ) {
    return {
      valid: false,
      code: 'INVALID_CONSENT',
      error: 'Consent choices (allowExternalAi, allowStorage, allowHumanReview) must be explicit booleans.',
    };
  }

  const actorRole = raw.actorRole === 'helper' ? 'helper' : 'citizen';

  return {
    valid: true,
    payload: {
      message,
      inputType,
      language,
      actorRole,
      consent: {
        allowExternalAi: rawConsent.allowExternalAi,
        allowStorage: rawConsent.allowStorage,
        allowHumanReview: rawConsent.allowHumanReview,
        policyVersion: sanitizePlainText(rawConsent.policyVersion, 32) || 'v1.0',
      },
    },
  };
}

export interface TranslateRequestPayload {
  targetLanguage: LanguageCode;
  explanation: string;
  warningSigns: string[];
  recommendedActions: string[];
  advisoryDisclaimer?: string;
}

export interface TranslateValidationOutcome {
  valid: boolean;
  code?: string;
  error?: string;
  payload?: TranslateRequestPayload;
}

export function validateTranslateRequest(body: unknown): TranslateValidationOutcome {
  if (!body || typeof body !== 'object') {
    return { valid: false, code: 'INVALID_BODY', error: 'Request payload must be a JSON object.' };
  }

  const raw = body as Record<string, unknown>;
  const targetLanguage = raw.targetLanguage as LanguageCode;
  if (!VALID_LANGUAGES.has(targetLanguage)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_LANGUAGE',
      error: 'Unsupported target language. Supported languages are en, hi, and bn.',
    };
  }

  const explanation = sanitizePlainText(raw.explanation, 1500);
  if (!explanation) {
    return {
      valid: false,
      code: 'EMPTY_EXPLANATION',
      error: 'Explanation text is required for translation.',
    };
  }

  const warningSigns = Array.isArray(raw.warningSigns)
    ? raw.warningSigns
        .map((item) => sanitizePlainText(item, 300))
        .filter((item) => item.length > 0)
        .slice(0, 12)
    : [];

  const recommendedActions = Array.isArray(raw.recommendedActions)
    ? raw.recommendedActions
        .map((item) => sanitizePlainText(item, 300))
        .filter((item) => item.length > 0)
        .slice(0, 10)
    : [];

  const advisoryDisclaimer = sanitizePlainText(raw.advisoryDisclaimer, 600) || undefined;

  return {
    valid: true,
    payload: {
      targetLanguage,
      explanation,
      warningSigns,
      recommendedActions,
      advisoryDisclaimer,
    },
  };
}

export interface TtsRequestPayload {
  text: string;
  language: LanguageCode;
}

export interface TtsValidationOutcome {
  valid: boolean;
  code?: string;
  error?: string;
  payload?: TtsRequestPayload;
}

export function validateTtsRequest(body: unknown): TtsValidationOutcome {
  if (!body || typeof body !== 'object') {
    return { valid: false, code: 'INVALID_BODY', error: 'Request payload must be a JSON object.' };
  }

  const raw = body as Record<string, unknown>;
  const language = raw.language as LanguageCode;
  if (!VALID_LANGUAGES.has(language)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_LANGUAGE',
      error: 'Unsupported speech language. Supported languages are en, hi, and bn.',
    };
  }

  const text = sanitizePlainText(raw.text, 1800);
  if (!text) {
    return {
      valid: false,
      code: 'EMPTY_TEXT',
      error: 'Text to read aloud is required.',
    };
  }

  return {
    valid: true,
    payload: {
      text,
      language,
    },
  };
}
