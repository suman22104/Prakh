import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Link2,
  Loader2,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { MaskedTextView } from '../components/MaskedTextView';
import { RiskMeterBar, VERDICT_STYLES } from '../components/VerdictBadge';
import { useApp } from '../contexts/AppContext';
import { useLocalizedResult } from '../hooks/useLocalizedResult';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const INTEROP_UI_COPY: Record<
  LanguageCode,
  {
    title: string;
    recognized: string;
    notRecognized: string;
    note: string;
  }
> = {
  en: {
    title: 'UPI Bank Handle & IFSC Interoperability Check',
    recognized: 'Recognized',
    notRecognized: 'Not recognized',
    note: 'Checked offline against participating Indian UPI PSP handles and IFSC bank prefixes (no external lookup). A recognized handle alone does not prove a sender is safe — scammers often use real bank handles.',
  },
  hi: {
    title: 'UPI बैंक हैंडल और IFSC अंतर-संचालनीयता जांच',
    recognized: 'मान्यता प्राप्त',
    notRecognized: 'अपरिचित',
    note: 'सहभागी भारतीय UPI बैंक हैंडल और IFSC कोड की ऑफ़लाइन सूची से जांचा गया (कोई बाहरी कॉल नहीं)। मान्यता प्राप्त हैंडल अकेले सुरक्षा की गारंटी नहीं है — ठग असली बैंक हैंडल का भी उपयोग करते हैं।',
  },
  bn: {
    title: 'UPI ব্যাংক হ্যান্ডেল ও IFSC আন্তঃসংযোগ যাচাই',
    recognized: 'পরিচিত',
    notRecognized: 'অপরিচিত',
    note: 'অংশগ্রহণকারী ভারতীয় UPI ব্যাংক হ্যান্ডেল ও IFSC কোডের অফলাইন তালিকা থেকে যাচাই করা হয়েছে। পরিচিত হ্যান্ডেল একা প্রেরকের সততা প্রমাণ করে না — প্রতারকরাও আসল ব্যাংক হ্যান্ডেল ব্যবহার করে।',
  },
};

export const AnalysisResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getResultById, t, language, isOnline, submitHumanReviewCase } = useApp();
  const tts = useTextToSpeech({ preferNeuralOnline: true, isOnline });

  const result = id ? getResultById(id) : undefined;
  const { localized, isTranslating, ensureTranslated } = useLocalizedResult(
    result,
    language,
    isOnline
  );
  const [reviewConsent, setReviewConsent] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(
    Boolean(result?.consentSnapshot.allowHumanReview)
  );
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (!result || !localized) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="ledger-card p-8 space-y-4">
          <h1 className="text-xl font-bold text-[#132A23]">{t.result.notFoundTitle}</h1>
          <p className="text-sm text-[#57534E]">{t.result.notFoundBody}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/check"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#132A23] text-[#FAF7F0] text-sm font-semibold hover:bg-[#1C3D33]"
            >
              {t.result.checkAnother}
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl border border-[#CFC6B4] bg-[#FFFDF8] text-[#132A23] text-sm font-semibold hover:bg-[#EFE9DC]"
            >
              {t.result.backToDashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const style = VERDICT_STYLES[result.verdict];
  const VerdictIcon = style.Icon;
  const verdictMeta = t.result.verdicts[result.verdict];

  const sourceLabel =
    result.assessmentSource === 'hybrid_ai'
      ? `${t.result.sourceHybrid}${result.aiProviderUsed ? ` (${result.aiProviderUsed})` : ''}`
      : result.assessmentSource === 'offline_rules'
        ? t.result.sourceOffline
        : t.result.sourceRuleFallback;

  const handleReadAloud = async () => {
    if (tts.isSpeaking || tts.isLoadingAudio) {
      tts.stop();
      return;
    }
    const ready = (await ensureTranslated()) ?? localized;
    await tts.speakResult({
      verdictLabel: verdictMeta.label,
      explanation: ready.explanation,
      warningSigns: ready.warningSigns,
      recommendedActions: ready.recommendedActions,
    });
  };

  const handleRequestReview = async () => {
    if (!reviewConsent) {
      setReviewError('Please check the consent box before sharing this masked case for review.');
      return;
    }
    setReviewError(null);
    setSubmittingReview(true);
    try {
      await submitHumanReviewCase(result);
      setReviewSubmitted(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review case.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/check"
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#57534E] hover:text-[#132A23]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t.result.checkAnother}
        </Link>

        {tts.isSupported && (
          <button
            type="button"
            onClick={() => void handleReadAloud()}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#132A23] bg-[#FFFDF8] text-sm font-bold text-[#132A23] hover:bg-[#EFE9DC] transition-colors duration-150 whitespace-nowrap"
          >
            {tts.isLoadingAudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C84620]" aria-hidden="true" />
                <span>{t.result.preparingAudio}</span>
              </>
            ) : tts.isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
                <span>{t.result.stopReading}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
                <span>{t.result.readAloud}</span>
              </>
            )}
          </button>
        )}
      </div>

      {tts.error && (
        <div
          role="status"
          className="rounded-xl bg-[#FDF6E3] border border-[#E5C98B] px-4 py-2.5 text-xs sm:text-sm text-[#78350F]"
        >
          {tts.error}
        </div>
      )}

      {/* Unmistakable Primary Safety Verdict Focal Anchor */}
      <motion.section
        key={result.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`ledger-elevated overflow-hidden ${style.bg}`}
        aria-live="polite"
      >
        {/* High-Contrast Solid Semantic Verdict Header */}
        <div className={`px-5 py-6 sm:px-8 sm:py-7 ${style.bannerBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 ${style.bannerSubtleBg}`}
              >
                <VerdictIcon className="w-9 h-9 sm:w-11 sm:h-11" aria-hidden="true" />
              </span>
              <div className="space-y-1.5 min-w-0">
                <p className={`text-xs font-medium ${style.bannerAccent}`}>
                  {sourceLabel} · {result.inputType.replace('_', ' ').toUpperCase()} ·{' '}
                  {language.toUpperCase()}
                  {isTranslating ? ` · ${t.result.translating}` : ''}
                </p>
                <h1 className="font-display text-3xl sm:text-[2.75rem] font-extrabold tracking-tight leading-[1.06] text-white">
                  {verdictMeta.label}
                </h1>
              </div>
            </div>

            <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/20">
              <p className={`text-xs font-semibold ${style.bannerAccent}`}>
                {t.result.riskScoreLabel}
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white leading-none">
                {result.riskScore}
                <span className={`text-lg font-semibold ${style.bannerAccent}`}>/100</span>
              </p>
              <p className={`text-xs font-semibold ${style.bannerAccent}`}>
                {t.result.confidenceLabel}:{' '}
                <span className="font-mono text-white">{result.confidence}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Plain-Language Summary + Large Tactile 10-Segment Risk Meter */}
        <div className="p-5 sm:px-8 sm:py-6 space-y-4">
          <p className="text-base sm:text-xl font-bold text-[#132A23] leading-snug">
            {verdictMeta.summary}
          </p>

          <div className="space-y-2">
            <RiskMeterBar score={result.riskScore} verdict={result.verdict} size="large" />
            <p className="text-xs text-[#57534E]">{t.result.scoreNote}</p>
          </div>

          {result.fallbackReason && (
            <p className="text-xs text-[#3F3A32] bg-[#FFFDF8]/90 border border-[#DDD5C5] rounded-lg px-3.5 py-2.5">
              {result.fallbackReason.includes('privacy-only local rule analysis')
                ? t.result.privacyModeNote
                : result.fallbackReason}
            </p>
          )}
        </div>
      </motion.section>

      {/* Explanation + Warning Signs + Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <section className="ledger-card p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#132A23]">{t.result.explanationTitle}</h2>
              {isTranslating && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#57534E]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  {t.result.translating}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-[#3F3A32] leading-relaxed">
              {localized.explanation}
            </p>
          </section>

          <section className="ledger-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-[#132A23]">{t.result.warningSignsTitle}</h2>
            {localized.warningSigns.length === 0 ? (
              <p className="text-sm text-[#57534E]">{t.result.noWarningsText}</p>
            ) : (
              <ul className="divide-y divide-[#EFE9DC] text-sm text-[#132A23]">
                {localized.warningSigns.map((sign) => (
                  <li key={sign} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <AlertTriangle
                      className="w-4 h-4 text-[#C84620] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {result.urlAnalysis.urlsFound > 0 && (
            <section className="ledger-card p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
                <h2 className="text-base font-bold text-[#132A23]">{t.result.urlCheckTitle}</h2>
              </div>
              <div className="divide-y divide-[#EFE9DC]">
                {result.urlAnalysis.findings.map((finding) => (
                  <div key={finding.displayUrl} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs sm:text-sm">
                    <p className="font-mono text-[#132A23] break-all">{finding.displayUrl}</p>
                    <p className="text-[#57534E]">
                      Host: <span className="font-mono">{finding.hostname}</span> ·{' '}
                      {finding.isOfficialAllowlisted
                        ? t.result.urlSafeNote
                        : finding.flags.map((f) => f.replace(/_/g, ' ')).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.interopAnalysis && result.interopAnalysis.identifiersFound > 0 && (() => {
            const interopUi = INTEROP_UI_COPY[language];
            const hasUnrec = result.interopAnalysis.hasUnrecognizedHandle;
            return (
              <section className="ledger-card p-6 space-y-3" aria-label={interopUi.title}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
                    <h2 className="text-base font-bold text-[#132A23]">{interopUi.title}</h2>
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      hasUnrec ? 'text-[#B42318]' : 'text-[#0F6B4A]'
                    }`}
                  >
                    {result.interopAnalysis.overallLabel}
                  </span>
                </div>

                <div className="divide-y divide-[#EFE9DC]">
                  {result.interopAnalysis.findings.map((finding) => (
                    <div
                      key={`${finding.kind}-${finding.identifier}`}
                      className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#132A23]">{finding.summaryLabel}</p>
                        <p className="font-mono text-xs text-[#57534E]">
                          {finding.kind === 'upi_handle' ? 'UPI PSP Handle' : 'IFSC Prefix'}:{' '}
                          {finding.identifier}
                          {finding.bankName ? ` · ${finding.bankName}` : ''}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold ${
                          finding.status === 'recognized' ? 'text-[#0F6B4A]' : 'text-[#B42318]'
                        }`}
                      >
                        {finding.status === 'recognized'
                          ? interopUi.recognized
                          : interopUi.notRecognized}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">{interopUi.note}</p>
              </section>
            );
          })()}

          <section className="ledger-card p-6 space-y-2.5">
            <h2 className="text-sm font-bold text-[#132A23]">{t.result.maskedTextTitle}</h2>
            <MaskedTextView text={result.maskedText} />
          </section>
        </div>

        {/* Right Column: Actions, Human Assistance & Official Reporting */}
        <div className="lg:col-span-5 space-y-6">
          <section className="ledger-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-[#132A23]">{t.result.actionsTitle}</h2>
            <ul className="space-y-3 text-sm text-[#132A23]">
              {localized.recommendedActions.map((action) => (
                <li key={action} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 text-[#0F6B4A] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Human Review Escalation (Explicit Consent Gate) */}
          <section className="ledger-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#132A23]">
              <UserCheck className="w-5 h-5 text-[#C84620]" aria-hidden="true" />
              <h2 className="text-base font-bold">{t.result.humanHelpTitle}</h2>
            </div>
            <p className="text-sm text-[#57534E]">{t.result.humanHelpBody}</p>

            <AnimatePresence mode="wait">
              {reviewSubmitted ? (
                <motion.div
                  key="review-done"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-lg bg-[#EEF7F2] border border-[#B4D9C6] px-4 py-3 text-sm font-medium text-[#0E5A3E] flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#0F6B4A]" aria-hidden="true" />
                  <span>{t.result.reviewRequestedSuccess}</span>
                </motion.div>
              ) : (
                <div key="review-form" className="space-y-3 pt-1">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs text-[#3F3A32] cursor-pointer transition-colors duration-150 ${
                      reviewConsent
                        ? 'bg-[#EEF7F2] border-[#7EC4A4]'
                        : 'bg-[#FAF7F0] border-[#DDD5C5] hover:bg-[#EFE9DC]/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={reviewConsent}
                      onChange={(e) => {
                        setReviewConsent(e.target.checked);
                        setReviewError(null);
                      }}
                      className="mt-0.5 h-5 w-5 rounded border-[#B8AE9B] accent-[#0F6B4A] shrink-0"
                    />
                    <span className="leading-relaxed">{t.result.reviewConsentCheckbox}</span>
                  </label>

                  {reviewError && <p className="text-xs font-semibold text-[#9F2B11]">{reviewError}</p>}

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => void handleRequestReview()}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-[#132A23] bg-[#FFFDF8] text-[#132A23] text-sm font-bold hover:bg-[#EFE9DC] disabled:opacity-60 transition-colors duration-150"
                  >
                    {submittingReview ? 'Submitting...' : t.result.requestReviewBtn}
                  </button>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* Official India Cybercrime Reporting Guidance */}
          <section className="bg-[#132A23] text-[#FAF7F0] rounded-xl p-6 space-y-3 border border-[#0D1E19]">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#F2A07B] shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold tracking-wide">{t.result.reportTitle}</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-mono font-semibold text-[#F5B495] tabular-nums">
                {t.result.reportHelpline}
              </p>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#F5B495] hover:text-white underline font-medium"
              >
                <span>{t.result.reportPortal}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
            <p className="text-xs text-[#D6CFC0] leading-relaxed">{t.result.reportNote}</p>
          </section>

          {/* Mandatory Advisory Disclaimer */}
          <div className="rounded-xl bg-[#FDF6E3] border border-[#E5C98B] p-4 text-xs text-[#78350F] leading-relaxed">
            {localized.advisoryDisclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
