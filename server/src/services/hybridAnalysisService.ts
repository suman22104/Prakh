import {
  getAdvisoryDisclaimer,
  getDefaultActions,
  runRuleBasedAnalysis,
} from '../../../shared/ruleEngine';
import type { AnalyzeRequestPayload, ScamAnalysisResult, Verdict } from '../../../shared/types';
import type { AiProviderAdapter } from './aiProvider';

const VERDICT_RANK: Record<Verdict, number> = {
  SAFE: 0,
  UNCERTAIN: 1,
  SUSPICIOUS: 2,
  SCAM: 3,
};

/**
 * Hybrid detection service combining deterministic rules + static URL inspection + optional consented AI.
 * Strictly enforces:
 * 1. Never sends sensitive unmasked text to external AI.
 * 2. Never calls external AI without explicit `consent.allowExternalAi === true`.
 * 3. Always falls back transparently to rule-based assessment if AI is unavailable or returns invalid JSON.
 */
export async function analyzeMessageHybrid(
  payload: AnalyzeRequestPayload,
  aiProvider: AiProviderAdapter
): Promise<ScamAnalysisResult> {
  // Always compute local deterministic baseline first (fast, zero external data leak)
  const baseline = runRuleBasedAnalysis({
    message: payload.message,
    inputType: payload.inputType,
    language: payload.language,
    consent: payload.consent,
    assessmentSource: 'rule_based_fallback',
  });

  // Gate 1: Explicit user consent required for external AI processing
  if (!payload.consent.allowExternalAi) {
    return {
      ...baseline,
      assessmentSource: 'rule_based_fallback',
      fallbackReason: 'External AI skipped because you chose privacy-only local rule analysis.',
    };
  }

  // Gate 2: Provider availability check
  if (!aiProvider.isConfigured()) {
    return {
      ...baseline,
      assessmentSource: 'rule_based_fallback',
      fallbackReason: `AI provider (${aiProvider.name}) is not currently configured; completed using local safety rules.`,
    };
  }

  // Gate 3: Call modular AI provider ONLY with MASKED text
  try {
    const aiVerdict = await aiProvider.classify({
      maskedText: baseline.maskedText,
      inputType: payload.inputType,
      language: payload.language,
      ruleWarningSigns: baseline.warningSigns,
      ruleScore: baseline.riskScore,
      urlAnalysis: baseline.urlAnalysis,
      interopAnalysis: baseline.interopAnalysis,
    });

    // Safety-first hybrid fusion:
    // If deterministic rules found strong critical signals (score >= 70), AI cannot downgrade to SAFE.
    let finalVerdict = aiVerdict.verdict;
    let finalScore = Math.round(aiVerdict.riskScore * 0.65 + baseline.riskScore * 0.35);

    if (baseline.riskScore >= 70 && VERDICT_RANK[finalVerdict] < VERDICT_RANK.SUSPICIOUS) {
      finalVerdict = 'SCAM';
      finalScore = Math.max(finalScore, baseline.riskScore);
    } else if (baseline.verdict === 'SCAM' && finalVerdict === 'SAFE') {
      finalVerdict = 'SUSPICIOUS';
      finalScore = Math.max(finalScore, 55);
    }

    const mergedWarnings = Array.from(
      new Set([...baseline.warningSigns, ...aiVerdict.warningSigns])
    ).slice(0, 10);

    const mergedActions =
      aiVerdict.recommendedActions.length >= 2
        ? aiVerdict.recommendedActions.slice(0, 6)
        : getDefaultActions(finalVerdict, payload.language);

    return {
      ...baseline,
      verdict: finalVerdict,
      riskScore: Math.max(0, Math.min(100, finalScore)),
      confidence: aiVerdict.confidence,
      warningSigns: mergedWarnings,
      explanation: aiVerdict.explanation,
      recommendedActions: mergedActions,
      humanReviewRecommended:
        aiVerdict.humanReviewRecommended ||
        baseline.humanReviewRecommended ||
        finalVerdict === 'UNCERTAIN',
      assessmentSource: 'hybrid_ai',
      aiProviderUsed: aiProvider.name,
      fallbackReason: undefined,
      advisoryDisclaimer: getAdvisoryDisclaimer(payload.language),
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? `AI provider unavailable (${error.message.slice(0, 120)}); safely assessed using deterministic rules.`
        : 'AI provider unavailable; safely assessed using deterministic rules.';

    return {
      ...baseline,
      assessmentSource: 'rule_based_fallback',
      fallbackReason: reason,
    };
  }
}
