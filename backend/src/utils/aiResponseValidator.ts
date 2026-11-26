import type { ConfidenceLevel, Verdict } from '../../../shared/types';
import { sanitizePlainText } from './validators';

export interface ValidatedAiVerdict {
  verdict: Verdict;
  riskScore: number;
  confidence: ConfidenceLevel;
  warningSigns: string[];
  explanation: string;
  recommendedActions: string[];
  humanReviewRecommended: boolean;
}

const VALID_VERDICTS = new Set<Verdict>(['SAFE', 'SUSPICIOUS', 'SCAM', 'UNCERTAIN']);
const VALID_CONFIDENCE = new Set<ConfidenceLevel>(['LOW', 'MEDIUM', 'HIGH']);

/**
 * Validates and sanitizes structured JSON returned by any external or local AI provider.
 * Returns null if the response is malformed so the backend cleanly uses the rule-based fallback.
 */
export function parseAndValidateAiResponse(rawText: string): ValidatedAiVerdict | null {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  const verdict = typeof obj.verdict === 'string' ? (obj.verdict.toUpperCase() as Verdict) : null;
  if (!verdict || !VALID_VERDICTS.has(verdict)) return null;

  const numericScore = Number(obj.riskScore);
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) return null;

  const confidence =
    typeof obj.confidence === 'string'
      ? (obj.confidence.toUpperCase() as ConfidenceLevel)
      : null;
  if (!confidence || !VALID_CONFIDENCE.has(confidence)) return null;

  if (!Array.isArray(obj.warningSigns) || !Array.isArray(obj.recommendedActions)) return null;

  const warningSigns = obj.warningSigns
    .map((item) => sanitizePlainText(item, 200))
    .filter(Boolean)
    .slice(0, 10);

  const recommendedActions = obj.recommendedActions
    .map((item) => sanitizePlainText(item, 240))
    .filter(Boolean)
    .slice(0, 8);

  const explanation = sanitizePlainText(obj.explanation, 1000);
  if (!explanation || recommendedActions.length === 0) return null;

  if (typeof obj.humanReviewRecommended !== 'boolean') return null;

  return {
    verdict,
    riskScore: Math.round(numericScore),
    confidence,
    warningSigns,
    explanation,
    recommendedActions,
    humanReviewRecommended: obj.humanReviewRecommended,
  };
}
