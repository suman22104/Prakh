import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  EyeOff,
  Loader2,
  Mic,
  MicOff,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { maskSensitiveData } from '../../shared/masking';
import { SYNTHETIC_TEST_CASES } from '../../shared/syntheticDataset';
import type { InputType, ScamAnalysisResult } from '../../shared/types';
import { MaskedTextView } from '../components/MaskedTextView';
import { VERDICT_STYLES } from '../components/VerdictBadge';
import { useApp } from '../contexts/AppContext';
import { useSpeech } from '../hooks/useSpeech';

const INPUT_TYPES: InputType[] = ['sms', 'whatsapp', 'url', 'upi_request'];

const QUICK_SCENARIOS = [
  { id: SYNTHETIC_TEST_CASES[0].id, label: 'Fake KYC SMS' },
  { id: SYNTHETIC_TEST_CASES[2].id, label: 'UPI Collect Trap' },
  { id: SYNTHETIC_TEST_CASES[5].id, label: 'OTP Call Trap' },
  { id: SYNTHETIC_TEST_CASES[6].id, label: 'Safe Bank Alert' },
];

export const ScamCheckerPage: React.FC = () => {
  const { language, t, isOnline, runScamCheck, enqueueOfflineCheck } = useApp();
  const navigate = useNavigate();
  const speech = useSpeech(language, isOnline);

  const [inputType, setInputType] = useState<InputType>('sms');
  const [message, setMessage] = useState('');
  const [allowExternalAi, setAllowExternalAi] = useState(false);
  const [allowStorage, setAllowStorage] = useState(false);
  const [allowHumanReview, setAllowHumanReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<ScamAnalysisResult | null>(null);

  const maskingPreview = useMemo(() => maskSensitiveData(message), [message]);

  const handleToggleStorage = (checked: boolean) => {
    setAllowStorage(checked);
    if (!checked) setAllowHumanReview(false);
  };

  const handleToggleHumanReview = (checked: boolean) => {
    setAllowHumanReview(checked);
    if (checked) setAllowStorage(true);
  };

  const handleLoadSample = (caseId: string) => {
    const found = SYNTHETIC_TEST_CASES.find((c) => c.id === caseId);
    if (!found) return;
    setInputType(found.inputType);
    setMessage(found.sampleMessage);
    setErrorMsg(null);
    setQueuedNotice(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setQueuedNotice(null);

    if (!message.trim()) {
      setErrorMsg(t.checker.emptyError);
      return;
    }

    setLoading(true);
    try {
      const result = await runScamCheck({
        message: message.trim(),
        inputType,
        language,
        consent: {
          allowExternalAi,
          allowStorage,
          allowHumanReview,
          policyVersion: 'v1.0',
        },
        actorRole: 'citizen',
      });
      setLatestResult(result);
      navigate(`/result/${result.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to analyze this message.');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueOffline = () => {
    setErrorMsg(null);
    if (!message.trim()) {
      setErrorMsg(t.checker.emptyError);
      return;
    }
    enqueueOfflineCheck({
      message: message.trim(),
      inputType,
      language,
    });
    setQueuedNotice(
      'Masked message saved to your Offline Queue. It will NEVER be submitted automatically without your renewed consent on the Dashboard.'
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="pb-5 border-b border-[#DDD5C5] space-y-1.5">
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#132A23] leading-tight">
          {t.checker.title}
        </h1>
        <p className="text-sm sm:text-base text-[#57534E] max-w-2xl">{t.checker.subtitle}</p>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[#FDF6E3] border border-[#E5C98B] px-4 py-3 text-sm text-[#78350F]">
          <WifiOff className="w-4 h-4 shrink-0 text-[#B45309]" aria-hidden="true" />
          <span>{t.checker.offlineNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Inspection Desk */}
        <form
          onSubmit={handleAnalyze}
          noValidate
          className="lg:col-span-7 ledger-elevated p-5 sm:p-6 space-y-6"
        >
          {/* Input Type Selection */}
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-bold text-[#132A23]">
              {t.checker.inputTypeLabel}
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INPUT_TYPES.map((type) => {
                const active = inputType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setInputType(type)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors text-center leading-tight flex items-center justify-center ${
                      active
                        ? 'bg-[#132A23] text-[#FAF7F0] border-[#132A23]'
                        : 'bg-[#FAF7F0] text-[#3F3A32] border-[#D4CBB8] hover:bg-[#EFE9DC]'
                    }`}
                  >
                    {t.checker.types[type]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Message Input + Voice Input + Quick-Try Scenarios */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="scam-message-input" className="text-sm font-bold text-[#132A23]">
                {t.checker.messageLabel}
              </label>

              {speech.sttSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (speech.isListening) {
                      speech.stopListening();
                    } else {
                      speech.startListening((transcript) => {
                        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
                      });
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors duration-150 ${
                    speech.isListening
                      ? 'bg-[#FDF1EE] border-[#E6B8AA] text-[#9F2B11]'
                      : 'bg-[#FFFDF8] border-[#CFC6B4] text-[#132A23] hover:bg-[#EFE9DC]'
                  }`}
                >
                  {speech.isListening ? (
                    <>
                      <MicOff className="w-4 h-4" aria-hidden="true" />
                      {t.checker.stopListening}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
                      {t.checker.voiceInput}
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-[#57534E]">{t.checker.voiceUnsupported}</span>
              )}
            </div>

            {/* One-tap quick scenarios for fast interactive testing */}
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLoadSample(item.id)}
                  className="min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#E2D9C6] text-xs font-semibold text-[#132A23] transition-colors duration-150 whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <textarea
              id="scam-message-input"
              rows={5}
              maxLength={2500}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={t.checker.placeholder}
              className="w-full rounded-xl border border-[#CFC6B4] bg-[#FAF7F0] px-4 py-3 text-base text-[#132A23] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#C84620] focus:border-[#C84620]"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#57534E]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <label
                  htmlFor="synthetic-sample-select"
                  className="font-semibold text-[#3F3A32] shrink-0"
                >
                  {t.checker.samplePromptLabel}
                </label>
                <select
                  id="synthetic-sample-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleLoadSample(e.target.value);
                  }}
                  className="w-full sm:w-auto max-w-full min-h-[44px] sm:min-h-[38px] rounded-lg border border-[#CFC6B4] bg-[#FFFDF8] px-3 py-2 text-xs text-[#132A23] focus:outline-none focus:ring-2 focus:ring-[#C84620]"
                >
                  <option value="">Select synthetic example...</option>
                  {SYNTHETIC_TEST_CASES.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.number}. {tc.title}
                    </option>
                  ))}
                </select>
              </div>
              <span className="font-mono tabular-nums self-end sm:self-auto shrink-0">
                {message.length} / 2500
              </span>
            </div>
          </div>

          {/* Explicit Privacy & Consent Controls (Tactile toggle rows with clear active feedback) */}
          <div className="pt-5 border-t border-[#DDD5C5] space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#132A23]">{t.checker.consentTitle}</h2>
              <p className="text-xs text-[#57534E] mt-0.5">{t.checker.consentSubtitle}</p>
            </div>

            <div className="divide-y divide-[#E7E0D2]">
              <label
                className={`flex items-start gap-3.5 py-3.5 px-3 -mx-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                  allowExternalAi ? 'bg-[#EEF7F2]/80' : 'hover:bg-[#F7F3EA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowExternalAi}
                  onChange={(e) => setAllowExternalAi(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#B8AE9B] accent-[#0F6B4A] focus:ring-[#C84620] shrink-0"
                />
                <span className="flex-1 min-w-0 space-y-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#132A23]">
                      {t.checker.consentExternalAiLabel}
                    </span>
                    <motion.span
                      key={allowExternalAi ? 'ai-on' : 'ai-off'}
                      initial={{ opacity: 0.4, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.14 }}
                      className={`font-mono text-[11px] font-bold shrink-0 ${
                        allowExternalAi ? 'text-[#0F6B4A]' : 'text-[#78716C]'
                      }`}
                    >
                      {allowExternalAi ? 'Enabled' : 'Off'}
                    </motion.span>
                  </span>
                  <span className="block text-xs text-[#57534E] leading-relaxed">
                    {t.checker.consentExternalAiHelp}
                  </span>
                </span>
              </label>

              <label
                className={`flex items-start gap-3.5 py-3.5 px-3 -mx-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                  allowStorage ? 'bg-[#EEF7F2]/80' : 'hover:bg-[#F7F3EA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowStorage}
                  onChange={(e) => handleToggleStorage(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#B8AE9B] accent-[#0F6B4A] focus:ring-[#C84620] shrink-0"
                />
                <span className="flex-1 min-w-0 space-y-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#132A23]">
                      {t.checker.consentStorageLabel}
                    </span>
                    <motion.span
                      key={allowStorage ? 'store-on' : 'store-off'}
                      initial={{ opacity: 0.4, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.14 }}
                      className={`font-mono text-[11px] font-bold shrink-0 ${
                        allowStorage ? 'text-[#0F6B4A]' : 'text-[#78716C]'
                      }`}
                    >
                      {allowStorage ? 'Enabled' : 'Off'}
                    </motion.span>
                  </span>
                  <span className="block text-xs text-[#57534E] leading-relaxed">
                    {t.checker.consentStorageHelp}
                  </span>
                </span>
              </label>

              <label
                className={`flex items-start gap-3.5 py-3.5 px-3 -mx-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                  allowHumanReview ? 'bg-[#EEF7F2]/80' : 'hover:bg-[#F7F3EA]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowHumanReview}
                  onChange={(e) => handleToggleHumanReview(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#B8AE9B] accent-[#0F6B4A] focus:ring-[#C84620] shrink-0"
                />
                <span className="flex-1 min-w-0 space-y-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#132A23]">
                      {t.checker.consentHumanReviewLabel}
                    </span>
                    <motion.span
                      key={allowHumanReview ? 'rev-on' : 'rev-off'}
                      initial={{ opacity: 0.4, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.14 }}
                      className={`font-mono text-[11px] font-bold shrink-0 ${
                        allowHumanReview ? 'text-[#0F6B4A]' : 'text-[#78716C]'
                      }`}
                    >
                      {allowHumanReview ? 'Enabled' : 'Off'}
                    </motion.span>
                  </span>
                  <span className="block text-xs text-[#57534E] leading-relaxed">
                    {t.checker.consentHumanReviewHelp}
                  </span>
                </span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                role="alert"
                className="rounded-xl bg-[#FDF1EE] border border-[#E6B8AA] px-4 py-3 text-sm font-medium text-[#9F2B11]"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {queuedNotice && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                role="status"
                className="rounded-xl bg-[#EEF7F2] border border-[#B4D9C6] px-4 py-3 text-sm text-[#0E5A3E] space-y-1.5"
              >
                <p className="font-medium">{queuedNotice}</p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center min-h-[36px] text-xs font-bold underline"
                >
                  Open Dashboard Queue →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[#C84620] text-white text-base font-bold hover:bg-[#AD3A18] disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>{t.checker.analyzingButton}</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  <span>{t.checker.analyzeButton}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleQueueOffline}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl border border-[#CFC6B4] bg-[#FFFDF8] text-[#132A23] text-sm font-semibold hover:bg-[#EFE9DC] transition-colors whitespace-nowrap"
            >
              <Clock className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
              <span>{t.checker.queueOfflineButton}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Privacy Masking Preview & Advisory Note */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="ledger-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#132A23]">
              <EyeOff className="w-5 h-5 text-[#0F6B4A] shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold">{t.checker.maskingPreviewTitle}</h2>
            </div>

            {!message.trim() ? (
              <p className="text-sm text-[#57534E]">{t.checker.maskingEmptyNote}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#0F6B4A]">
                  <span className="font-mono font-bold tabular-nums">
                    {maskingPreview.totalRedacted}
                  </span>{' '}
                  {t.checker.maskingRedactedNote}
                </p>

                {maskingPreview.redactions.length > 0 && (
                  <p className="text-xs text-[#57534E]">
                    Redacted:{' '}
                    {maskingPreview.redactions
                      .map((r) => `${r.type.replace('_', ' ')} (${r.count})`)
                      .join(' · ')}
                  </p>
                )}

                <MaskedTextView text={maskingPreview.maskedText} />
              </div>
            )}
          </div>

          {latestResult && (
            <div
              className={`rounded-xl border p-5 space-y-3 ${VERDICT_STYLES[latestResult.verdict].bg} ${VERDICT_STYLES[latestResult.verdict].border}`}
            >
              <p className={`text-sm font-bold ${VERDICT_STYLES[latestResult.verdict].text}`}>
                {t.result.verdicts[latestResult.verdict].label}
              </p>
              <p className="text-sm text-[#3F3A32]">{latestResult.explanation}</p>
              <Link
                to={`/result/${latestResult.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#132A23] hover:text-[#C84620] hover:underline"
              >
                Open full safety dossier <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="bg-[#FDF6E3] border border-[#E5C98B] rounded-xl p-5 space-y-2 text-xs text-[#78350F]">
            <p className="font-bold text-[#78350F]">{t.landing.disclaimerTitle}</p>
            <p className="leading-relaxed">{t.landing.disclaimerBody}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
