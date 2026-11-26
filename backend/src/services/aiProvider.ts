import { GoogleGenAI, Type } from '@google/genai';
import type {
  InputType,
  InteropCheckSummary,
  LanguageCode,
  UrlAnalysisSummary,
} from '../../../shared/types';
import type { ServerConfig } from '../config/env';
import { parseAndValidateAiResponse, type ValidatedAiVerdict } from '../utils/aiResponseValidator';

export interface AiClassificationInput {
  maskedText: string;
  inputType: InputType;
  language: LanguageCode;
  ruleWarningSigns: string[];
  ruleScore: number;
  urlAnalysis: UrlAnalysisSummary;
  interopAnalysis?: InteropCheckSummary;
}

export interface AiProviderAdapter {
  readonly name: string;
  isConfigured(): boolean;
  classify(input: AiClassificationInput): Promise<ValidatedAiVerdict>;
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'Simple, non-technical Indian English',
  hi: 'Simple, everyday Hindi in Devanagari script (हिन्दी)',
  bn: 'Simple, everyday Bengali in Bengali script (বাংলা)',
};

function buildClassificationPrompt(input: AiClassificationInput): string {
  const urlHints =
    input.urlAnalysis.findings.length > 0
      ? input.urlAnalysis.findings
          .map((f) => `host=${f.hostname}, flags=${f.flags.join(',')}, allowlisted=${f.isOfficialAllowlisted}`)
          .join('; ')
      : 'None';

  const interopHints =
    input.interopAnalysis && input.interopAnalysis.findings.length > 0
      ? input.interopAnalysis.findings
          .map(
            (f) =>
              `${f.kind}=${f.identifier}, status=${f.status}${f.bankName ? `, bank=${f.bankName}` : ''}`
          )
          .join('; ')
      : 'None';

  return [
    `Analyze the following MASKED digital payment / messaging content for Indian UPI and banking scams.`,
    `Channel: ${input.inputType}`,
    `Respond with explanation, warningSigns, and recommendedActions strictly in: ${LANGUAGE_NAMES[input.language]}.`,
    `Local static rule pre-check score: ${input.ruleScore}/100.`,
    `Local static URL findings (never visit links): ${urlHints}`,
    `Local UPI bank-handle / IFSC interoperability check (offline directory, no PII): ${interopHints}`,
    `Local warning indicators already found: ${input.ruleWarningSigns.join(' | ') || 'None'}`,
    `Masked message content:`,
    `"""`,
    input.maskedText,
    `"""`,
    `Rules:`,
    `- Never guarantee a message is 100% safe.`,
    `- Keep language calm, clear, and accessible for non-technical citizens.`,
    `- Use verdict UNCERTAIN when context is genuinely ambiguous or unverifiable.`,
    `- Return ONLY valid JSON matching the required schema.`,
  ].join('\n');
}

const SYSTEM_INSTRUCTION =
  'You are an Indian digital-payment safety assistant helping everyday citizens identify UPI, KYC, OTP, phishing, cashback, and impersonation scams. Explain calmly without technical jargon. Never claim certainty or guarantee safety. Return strict JSON only.';

class GeminiProvider implements AiProviderAdapter {
  readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: ServerConfig) {
    this.apiKey = config.geminiApiKey;
    this.model = config.geminiModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'MY_GEMINI_API_KEY');
  }

  async classify(input: AiClassificationInput): Promise<ValidatedAiVerdict> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({
      apiKey: this.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = Array.from(
      new Set([this.model, 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'])
    );
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: buildClassificationPrompt(input),
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                verdict: {
                  type: Type.STRING,
                  enum: ['SAFE', 'SUSPICIOUS', 'SCAM', 'UNCERTAIN'],
                },
                riskScore: {
                  type: Type.INTEGER,
                  description: 'Heuristic risk score from 0 to 100 (not calibrated probability).',
                },
                confidence: {
                  type: Type.STRING,
                  enum: ['LOW', 'MEDIUM', 'HIGH'],
                },
                warningSigns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                explanation: {
                  type: Type.STRING,
                },
                recommendedActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                humanReviewRecommended: {
                  type: Type.BOOLEAN,
                },
              },
              required: [
                'verdict',
                'riskScore',
                'confidence',
                'warningSigns',
                'explanation',
                'recommendedActions',
                'humanReviewRecommended',
              ],
            },
          },
        });
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!response) {
      throw lastError instanceof Error ? lastError : new Error('Gemini classification failed.');
    }

    const rawText = response.text ?? '';
    const validated = parseAndValidateAiResponse(rawText);
    if (!validated) {
      throw new Error('AI response failed backend JSON schema validation.');
    }
    return validated;
  }
}

class GroqProvider implements AiProviderAdapter {
  readonly name = 'groq';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: ServerConfig) {
    this.apiKey = config.groqApiKey;
    this.model = config.groqModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async classify(input: AiClassificationInput): Promise<ValidatedAiVerdict> {
    if (!this.isConfigured()) {
      throw new Error('Groq API key is not configured.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: buildClassificationPrompt(input) },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`Groq API returned status ${res.status}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const rawText = data.choices?.[0]?.message?.content ?? '';
      const validated = parseAndValidateAiResponse(rawText);
      if (!validated) {
        throw new Error('Groq AI output failed JSON validation.');
      }
      return validated;
    } finally {
      clearTimeout(timeout);
    }
  }
}

class OllamaProvider implements AiProviderAdapter {
  readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: ServerConfig) {
    this.baseUrl = config.ollamaBaseUrl;
    this.model = config.ollamaModel;
  }

  isConfigured(): boolean {
    try {
      const parsed = new URL(this.baseUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async classify(input: AiClassificationInput): Promise<ValidatedAiVerdict> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const endpoint = new URL('/api/generate', this.baseUrl).toString();
      const res = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          format: 'json',
          stream: false,
          system: SYSTEM_INSTRUCTION,
          prompt: buildClassificationPrompt(input),
        }),
      });
      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }
      const data = (await res.json()) as { response?: string };
      const validated = parseAndValidateAiResponse(data.response ?? '');
      if (!validated) {
        throw new Error('Ollama output failed JSON validation.');
      }
      return validated;
    } finally {
      clearTimeout(timeout);
    }
  }
}

class RulesOnlyProvider implements AiProviderAdapter {
  readonly name = 'rules';
  isConfigured(): boolean {
    return false;
  }
  async classify(): Promise<ValidatedAiVerdict> {
    throw new Error('External AI disabled; using deterministic rule engine.');
  }
}

export function createAiProvider(config: ServerConfig): AiProviderAdapter {
  if (config.aiProvider === 'groq') return new GroqProvider(config);
  if (config.aiProvider === 'ollama') return new OllamaProvider(config);
  if (config.aiProvider === 'rules') return new RulesOnlyProvider();
  return new GeminiProvider(config);
}
