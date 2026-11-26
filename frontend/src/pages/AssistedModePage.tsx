import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  HandHeart,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ScamAnalysisResult } from '../../../shared/types';
import { LanguageSelector } from '../components/LanguageSelector';
import { RiskMeterBar, VERDICT_STYLES } from '../components/VerdictBadge';
import { useApp } from '../contexts/AppContext';
import { useLocalizedResult } from '../hooks/useLocalizedResult';
import { useSpeech } from '../hooks/useSpeech';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const AssistedModePage: React.FC = () => {
  const { language, t, isOnline, runScamCheck } = useApp();
  const speech = useSpeech(language, isOnline);
  const tts = useTextToSpeech({ preferNeuralOnline: true, isOnline });

  const [verbalConsent, setVerbalConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const { localized, isTranslating, ensureTranslated } = useLocalizedResult(
    result,
    language,
    isOnline
  );

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!verbalConsent) {
      setErrorMsg(t.assisted.verbalConsentRequired);
      return;
    }

    if (!message.trim()) {
      setErrorMsg(t.checker.emptyError);
      return;
    }

    setLoading(true);
    try {
      const res = await runScamCheck({
        message: message.trim(),
        inputType: 'sms',
        language,
        consent: {
          allowExternalAi: false,
          allowStorage: false,
          allowHumanReview: false,
          policyVersion: 'v1.0',
        },
        actorRole: 'helper',
      });
      setResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to check message.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    tts.stop();
    setMessage('');
    setResult(null);
    setErrorMsg(null);
  };

  const activeStep = result ? 3 : verbalConsent ? 2 : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Visibly Distinct High-Contrast Mode Banner */}
      <header className="rounded-2xl bg-[#132A23] text-[#FFFFFF] border-2 border-[#0A1814] p-5 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#F5B495]">
              <HandHeart className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>High-Contrast Helper View</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] leading-tight">
              {t.assisted.title}
            </h1>
            <p className="text-base sm:text-lg text-[#E6E0D3] leading-relaxed max-w-2xl">
              {t.assisted.subtitle}
            </p>
          </div>
          <div className="shrink-0">
            <LanguageSelector size="large" highContrast />
          </div>
        </div>

        {/* 3-Step Assisted Progress Indicator */}
        <ol
          aria-label="Assisted check steps"
          className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-white/15"
        >
          {[
            { num: 1, label: 'Consent' },
            { num: 2, label: 'Message' },
            { num: 3, label: 'Verdict' },
          ].map((step) => {
            const done = activeStep > step.num;
            const current = activeStep === step.num;
            return (
              <li
                key={step.num}
                className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-sm sm:text-base font-bold transition-colors ${
                  current
                    ? 'bg-[#C84620] text-[#FFFFFF]'
                    : done
                      ? 'bg-[#0F6B4A] text-[#FFFFFF]'
                      : 'bg-white/10 text-[#D6CFC0]'
                }`}
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/20 font-mono text-xs sm:text-sm tabular-nums shrink-0">
                  {step.num}
                </span>
                <span className="truncate">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </header>

      {/* Step 1: High-Contrast Verbal Privacy & Consent Gate */}
      <section
        className={`rounded-2xl border-2 p-5 sm:p-7 space-y-5 transition-colors duration-150 ${
          verbalConsent
            ? 'bg-[#E5F6ED] border-[#0F6B4A]'
            : 'bg-[#FFFFFF] border-[#132A23]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-mono text-xs font-bold text-[#0F6B4A] tabular-nums">STEP 01</p>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#132A23]">
              {t.assisted.privacyBannerTitle}
            </h2>
          </div>

          {tts.isSupported && (
            <button
              type="button"
              onClick={() => {
                if (tts.isSpeaking || tts.isLoadingAudio) {
                  tts.stop();
                } else {
                  void tts.speak(t.assisted.privacyBannerBody);
                }
              }}
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-5 py-3 rounded-xl bg-[#132A23] text-[#FFFFFF] text-base font-bold hover:bg-[#1E3D33] transition-colors duration-150 whitespace-nowrap"
            >
              {tts.isLoadingAudio ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#F5B495]" aria-hidden="true" />
                  <span>{t.result.preparingAudio}</span>
                </>
              ) : tts.isSpeaking ? (
                <>
                  <VolumeX className="w-5 h-5 text-[#F5B495]" aria-hidden="true" />
                  <span>{t.result.stopReading}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 text-[#F5B495]" aria-hidden="true" />
                  <span>{t.assisted.readNoticeAloud}</span>
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-lg sm:text-xl text-[#132A23] leading-relaxed font-medium">
          {t.assisted.privacyBannerBody}
        </p>

        <label
          className={`flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-colors duration-150 ${
            verbalConsent
              ? 'bg-[#FFFFFF] border-[#0F6B4A]'
              : 'bg-[#FAF7F0] border-[#132A23] hover:bg-[#EFE9DC]'
          }`}
        >
          <input
            type="checkbox"
            checked={verbalConsent}
            onChange={(e) => {
              setVerbalConsent(e.target.checked);
              if (errorMsg) setErrorMsg(null);
            }}
            className="mt-1 h-6 w-6 rounded border-2 border-[#132A23] accent-[#0F6B4A] shrink-0"
          />
          <span className="flex-1 min-w-0 space-y-1">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-[#132A23] leading-snug">
                {t.assisted.verbalConsentLabel}
              </span>
              <motion.span
                key={verbalConsent ? 'vc-yes' : 'vc-no'}
                initial={{ opacity: 0.4, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.14 }}
                className={`font-mono text-xs font-extrabold ${
                  verbalConsent ? 'text-[#0F6B4A]' : 'text-[#9F2B11]'
                }`}
              >
                {verbalConsent ? 'Confirmed' : 'Required'}
              </motion.span>
            </span>
          </span>
        </label>
      </section>

      {/* Step 2 (Message Entry) OR Step 3 (High-Contrast Large-Type Verdict) */}
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.form
            key="assisted-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleCheck}
            noValidate
            className="assisted-card p-5 sm:p-8 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs font-bold text-[#C84620] tabular-nums">STEP 02</p>
                  <label
                    htmlFor="assisted-message-input"
                    className="block font-display text-xl sm:text-2xl font-extrabold text-[#132A23]"
                  >
                    {t.assisted.step1Title}
                  </label>
                </div>

                {speech.sttSupported && (
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
                    className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-5 py-3 rounded-xl text-base font-bold border-2 transition-colors duration-150 ${
                      speech.isListening
                        ? 'bg-[#B42318] border-[#B42318] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#132A23] text-[#132A23] hover:bg-[#EFE9DC]'
                    }`}
                  >
                    {speech.isListening ? (
                      <>
                        <MicOff className="w-5 h-5" aria-hidden="true" />
                        {t.checker.stopListening}
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 text-[#C84620]" aria-hidden="true" />
                        {t.checker.voiceInput}
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                id="assisted-message-input"
                rows={5}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={t.checker.placeholder}
                className="w-full rounded-xl border-2 border-[#132A23] bg-[#FFFFFF] p-4 sm:p-5 text-lg sm:text-xl text-[#132A23] placeholder:text-[#57534E] leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#C84620]/30 focus:border-[#C84620]"
              />
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl bg-[#FDF1EE] border-2 border-[#B42318] p-4 text-base sm:text-lg font-bold text-[#9F2B11]"
              >
                {errorMsg}
              </motion.div>
            )}

            <div className="space-y-3 pt-1">
              <p className="text-lg sm:text-xl font-extrabold text-[#132A23]">
                {t.assisted.step2Title}
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 min-h-[60px] px-6 py-4 rounded-xl bg-[#C84620] text-[#FFFFFF] text-xl font-extrabold hover:bg-[#AD3A18] disabled:opacity-60 transition-colors duration-150"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-6 h-6" aria-hidden="true" />
                )}
                <span>{loading ? t.checker.analyzingButton : t.assisted.checkButton}</span>
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.section
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
            aria-live="polite"
          >
            {(() => {
              const style = VERDICT_STYLES[result.verdict];
              const VerdictIcon = style.Icon;
              const meta = t.result.verdicts[result.verdict];
              const activeLocalized = localized ?? result;

              const handleReadResultAloud = async () => {
                if (tts.isSpeaking || tts.isLoadingAudio) {
                  tts.stop();
                  return;
                }
                const ready = (await ensureTranslated()) ?? activeLocalized;
                await tts.speakResult({
                  verdictLabel: meta.label,
                  explanation: ready.explanation,
                  recommendedActions: ready.recommendedActions,
                  maxWarnings: 0,
                });
              };

              return (
                <div className="assisted-card overflow-hidden">
                  {/* Giant High-Contrast Semantic Verdict Header */}
                  <div className={`p-6 sm:p-8 space-y-5 ${style.bannerBg}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <span className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 text-white shrink-0">
                          <VerdictIcon className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden="true" />
                        </span>
                        <div className="space-y-1">
                          <p className={`font-mono text-xs font-bold ${style.bannerAccent}`}>
                            STEP 03 · {t.result.riskScoreLabel.toUpperCase()} {result.riskScore}/100
                          </p>
                          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-[1.06]">
                            {meta.label}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg sm:text-xl font-bold text-white/95 leading-snug">
                      {meta.summary}
                    </p>

                    {tts.isSupported && (
                      <button
                        type="button"
                        onClick={() => void handleReadResultAloud()}
                        className="w-full inline-flex items-center justify-center gap-3 min-h-[58px] px-6 py-3.5 rounded-xl bg-[#FFFFFF] text-[#132A23] text-lg font-extrabold hover:bg-[#EFE9DC] transition-colors duration-150"
                      >
                        {tts.isLoadingAudio ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-[#C84620]" aria-hidden="true" />
                            <span>{t.result.preparingAudio}</span>
                          </>
                        ) : tts.isSpeaking ? (
                          <>
                            <VolumeX className="w-6 h-6 text-[#C84620]" aria-hidden="true" />
                            <span>{t.result.stopReading}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-6 h-6 text-[#C84620]" aria-hidden="true" />
                            <span>{t.result.readAloud}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* High-Contrast White Body */}
                  <div className="p-6 sm:p-8 space-y-6 bg-[#FFFFFF]">
                    <RiskMeterBar score={result.riskScore} verdict={result.verdict} size="large" />

                    {tts.error && (
                      <p
                        role="status"
                        className="rounded-xl bg-[#FDF6E3] border-2 border-[#B45309] px-4 py-3 text-base font-semibold text-[#78350F]"
                      >
                        {tts.error}
                      </p>
                    )}

                    {isTranslating && (
                      <p className="inline-flex items-center gap-2 text-base font-semibold text-[#3F3A32]">
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>{t.result.translating}</span>
                      </p>
                    )}

                    <p className="text-xl text-[#132A23] leading-relaxed font-semibold">
                      {activeLocalized.explanation}
                    </p>

                    <div className="pt-5 border-t-2 border-[#132A23]/15 space-y-4">
                      <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#132A23]">
                        {t.result.actionsTitle}
                      </h3>
                      <ul className="space-y-4 text-lg sm:text-xl text-[#132A23] font-medium">
                        {activeLocalized.recommendedActions.map((act) => (
                          <li key={act} className="flex items-start gap-3.5">
                            <CheckCircle2
                              className="w-6 h-6 text-[#0F6B4A] shrink-0 mt-1"
                              aria-hidden="true"
                            />
                            <span className="leading-snug">{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#132A23] text-[#FFFFFF] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PhoneCall className="w-6 h-6 text-[#F5B495] shrink-0" aria-hidden="true" />
                        <span className="text-lg font-extrabold font-mono tabular-nums">
                          {t.result.reportHelpline}
                        </span>
                      </div>
                      <span className="text-base font-semibold text-[#F5B495]">
                        {t.result.reportPortal}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-[#3F3A32] leading-relaxed">
                      {activeLocalized.advisoryDisclaimer}
                    </p>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full inline-flex items-center justify-center gap-2.5 min-h-[56px] px-6 py-3.5 rounded-xl border-2 border-[#132A23] bg-[#FAF7F0] text-[#132A23] text-lg font-extrabold hover:bg-[#EFE9DC] transition-colors duration-150"
                    >
                      <RotateCcw className="w-5 h-5" aria-hidden="true" />
                      {t.assisted.resetButton}
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};
