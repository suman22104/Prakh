import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  EyeOff,
  HandHeart,
  Loader2,
  Lock,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { maskSensitiveData } from '../../shared/masking';
import { SYNTHETIC_TEST_CASES } from '../../shared/syntheticDataset';
import type { InputType, LanguageCode, ScamAnalysisResult } from '../../shared/types';
import { MaskedTextView } from '../components/MaskedTextView';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { RiskMeterBar, VERDICT_STYLES } from '../components/VerdictBadge';
import { useApp } from '../contexts/AppContext';
import { useLocalizedResult } from '../hooks/useLocalizedResult';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const HERO_IMAGE_PATH = '/src/assets/images/upi_safety_hero_1795618102680.jpg';

const WORKBENCH_COPY: Record<
  LanguageCode,
  {
    title: string;
    subtitle: string;
    maskedBadge: (n: number) => string;
    previewLabel: string;
    hiddenCount: (n: number) => string;
    noPiiFound: string;
    fullOptions: string;
    openDossier: string;
    advisoryTag: string;
    presetLabels: Record<string, string>;
  }
> = {
  en: {
    title: 'Live Scam Safety Workbench',
    subtitle: 'Try a real Indian scam scenario or paste a message · Zero storage by default',
    maskedBadge: (n) => `${n} PII masked`,
    previewLabel: 'Auto-masked preview',
    hiddenCount: (n) => `${n} sensitive detail(s) hidden`,
    noPiiFound: 'No personal numbers found',
    fullOptions: 'Full Options →',
    openDossier: 'Open full safety dossier',
    advisoryTag: 'Advisory only',
    presetLabels: {
      'tc-01': 'Fake KYC SMS',
      'tc-03': 'UPI Collect Trap',
      'tc-07': 'Safe Bank Alert',
    },
  },
  hi: {
    title: 'लाइव स्कैम सुरक्षा जांच डेस्क',
    subtitle: 'असली भारतीय उदाहरण आज़माएं या संदेश पेस्ट करें · डिफ़ॉल्ट रूप से कुछ सेव नहीं होता',
    maskedBadge: (n) => `${n} निजी विवरण छिपाए`,
    previewLabel: 'स्वचालित मास्क पूर्वावलोकन',
    hiddenCount: (n) => `${n} संवेदनशील विवरण छिपाए गए`,
    noPiiFound: 'कोई निजी नंबर नहीं मिला',
    fullOptions: 'सभी विकल्प →',
    openDossier: 'पूरी सुरक्षा रिपोर्ट खोलें',
    advisoryTag: 'केवल सलाह हेतु',
    presetLabels: {
      'tc-01': 'नकली KYC SMS',
      'tc-03': 'UPI कलेक्ट जाल',
      'tc-07': 'सुरक्षित बैंक अलर्ट',
    },
  },
  bn: {
    title: 'লাইভ স্ক্যাম নিরাপত্তা ডেস্ক',
    subtitle: 'বাস্তব ভারতীয় উদাহরণ পরীক্ষা করুন বা মেসেজ পেস্ট করুন · ডিফল্টভাবে সংরক্ষণ হয় না',
    maskedBadge: (n) => `${n}টি ব্যক্তিগত তথ্য লুকানো`,
    previewLabel: 'স্বয়ংক্রিয় মাস্ক প্রিভিউ',
    hiddenCount: (n) => `${n}টি সংবেদনশীল তথ্য লুকানো হয়েছে`,
    noPiiFound: 'কোনো ব্যক্তিগত নম্বর পাওয়া যায়নি',
    fullOptions: 'সব বিকল্প →',
    openDossier: 'সম্পূর্ণ নিরাপত্তা রিপোর্ট খুলুন',
    advisoryTag: 'শুধুমাত্র পরামর্শ',
    presetLabels: {
      'tc-01': 'ভুয়া KYC SMS',
      'tc-03': 'UPI কালেক্ট ফাঁদ',
      'tc-07': 'নিরাপদ ব্যাংক অ্যালার্ট',
    },
  },
};

const QUICK_PROTOTYPE_CASES = [
  {
    id: 'tc-01',
    caseRef: SYNTHETIC_TEST_CASES[0],
  },
  {
    id: 'tc-03',
    caseRef: SYNTHETIC_TEST_CASES[2],
  },
  {
    id: 'tc-07',
    caseRef: SYNTHETIC_TEST_CASES[6],
  },
];

export const LandingPage: React.FC = () => {
  const { t, language, isOnline, runScamCheck } = useApp();
  const tts = useTextToSpeech({ preferNeuralOnline: true, isOnline });
  const [imgFailed, setImgFailed] = useState(false);

  // Live Interactive Prototype Workbench state
  const [quickMessage, setQuickMessage] = useState(SYNTHETIC_TEST_CASES[0].sampleMessage);
  const [quickInputType, setQuickInputType] = useState<InputType>(SYNTHETIC_TEST_CASES[0].inputType);
  const [activePresetId, setActivePresetId] = useState<string>('tc-01');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<ScamAnalysisResult | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const quickMaskPreview = useMemo(() => maskSensitiveData(quickMessage), [quickMessage]);
  const { localized: localizedQuick, ensureTranslated } = useLocalizedResult(
    quickResult,
    language,
    isOnline
  );

  const goldenRulesSpeechText = [
    t.landing.offlineGuideTitle,
    ...t.landing.offlineGoldenRules,
  ].join('. ');

  const handleSelectQuickPreset = (preset: (typeof QUICK_PROTOTYPE_CASES)[number]) => {
    setActivePresetId(preset.id);
    setQuickMessage(preset.caseRef.sampleMessage);
    setQuickInputType(preset.caseRef.inputType);
    setQuickResult(null);
    setQuickError(null);
    tts.stop();
  };

  const handleQuickInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    if (!quickMessage.trim()) {
      setQuickError(t.checker.emptyError);
      return;
    }

    setQuickLoading(true);
    try {
      const res = await runScamCheck({
        message: quickMessage.trim(),
        inputType: quickInputType,
        language,
        consent: {
          allowExternalAi: false,
          allowStorage: false,
          allowHumanReview: false,
          policyVersion: 'v1.0',
        },
        actorRole: 'citizen',
      });
      setQuickResult(res);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Unable to check message.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleReadQuickResult = async () => {
    if (!quickResult) return;
    if (tts.isSpeaking || tts.isLoadingAudio) {
      tts.stop();
      return;
    }
    const ready = (await ensureTranslated()) ?? localizedQuick ?? quickResult;
    const verdictMeta = t.result.verdicts[quickResult.verdict];
    await tts.speakResult({
      verdictLabel: verdictMeta.label,
      explanation: ready.explanation,
      warningSigns: ready.warningSigns,
      recommendedActions: ready.recommendedActions,
      maxWarnings: 2,
      maxActions: 2,
    });
  };

  const activeQuickLocalized = localizedQuick ?? quickResult;
  const wb = WORKBENCH_COPY[language];

  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      {/* Hero Section: Confident Civic-Safety Editorial Left + Live Prototype Workbench Right */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Editorial Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6 lg:pt-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2.5">
                <span className="h-[2px] w-6 bg-[#C84620]" aria-hidden="true" />
                <p className="text-xs sm:text-sm font-bold text-[#C84620] tracking-tight">
                  {t.landing.kicker}
                </p>
              </div>
              <PWAInstallButton />
            </div>

            <h1 className="font-display text-[2rem] sm:text-[2.65rem] lg:text-[3.05rem] font-bold tracking-tight text-[#132A23] leading-[1.09]">
              {t.landing.headline}
            </h1>

            <p className="text-base sm:text-[17px] text-[#3F3A32] max-w-xl leading-relaxed">
              {t.landing.subheadline}
            </p>

            {/* Single Dominant Primary CTA + Clear Assisted Mode Entry */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <Link
                to="/check"
                className="inline-flex items-center justify-center gap-2.5 min-h-[50px] px-6 py-3 rounded-xl bg-[#132A23] text-[#FAF7F0] text-sm sm:text-[15px] font-bold hover:bg-[#1C3D33] transition-colors duration-150 sm:whitespace-nowrap"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-[#F2A07B]" aria-hidden="true" />
                <span>{t.landing.primaryCta}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/assisted"
                className="inline-flex items-center justify-center gap-2 min-h-[50px] px-5 py-3 rounded-xl border border-[#CFC6B4] bg-[#FFFDF8] text-[#132A23] text-sm font-semibold hover:bg-[#EFE9DC] transition-colors duration-150 sm:whitespace-nowrap"
              >
                <HandHeart className="w-4 h-4 text-[#C84620] shrink-0" aria-hidden="true" />
                <span>{t.landing.assistedCta}</span>
              </Link>
            </div>

            {/* Quiet Unboxed Civic Trust Metadata */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-2 border-t border-[#DDD5C5] text-xs font-medium text-[#57534E]">
              <span>Works offline</span>
              <span aria-hidden="true">·</span>
              <span>Auto-masks personal details</span>
              <span aria-hidden="true">·</span>
              <span>English · हिन्दी · বাংলা</span>
            </div>
          </div>

          {/* Focal Anchor: Live Interactive Safety Workbench */}
          <div className="lg:col-span-6">
            <div className="ledger-elevated p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DDD5C5]">
                <div className="space-y-0.5 min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#132A23]">
                    {wb.title}
                  </h2>
                  <p className="text-xs text-[#57534E]">{wb.subtitle}</p>
                </div>
                <span className="font-mono text-xs text-[#0F6B4A] font-semibold tabular-nums shrink-0">
                  {wb.maskedBadge(quickMaskPreview.totalRedacted)}
                </span>
              </div>

              {/* Interactive One-Tap Scenario Switcher */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sample scenarios">
                {QUICK_PROTOTYPE_CASES.map((preset) => {
                  const active = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleSelectQuickPreset(preset)}
                      className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                        active
                          ? 'bg-[#132A23] text-[#FAF7F0]'
                          : 'bg-[#EFE9DC] text-[#3F3A32] hover:bg-[#E4DCCB]'
                      }`}
                    >
                      {wb.presetLabels[preset.id]}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleQuickInspect} className="space-y-3.5">
                <label htmlFor="hero-workbench-input" className="sr-only">
                  {t.checker.messageLabel}
                </label>
                <textarea
                  id="hero-workbench-input"
                  rows={3}
                  maxLength={1500}
                  value={quickMessage}
                  onChange={(e) => {
                    setQuickMessage(e.target.value);
                    setActivePresetId('');
                    if (quickError) setQuickError(null);
                  }}
                  placeholder={t.checker.placeholder}
                  className="w-full rounded-lg border border-[#CFC6B4] bg-[#FAF7F0] px-3.5 py-2.5 text-sm text-[#132A23] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#C84620] focus:border-[#C84620]"
                />

                {quickMessage.trim() && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#57534E]">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#132A23]">
                        <EyeOff className="w-3.5 h-3.5 text-[#0F6B4A]" aria-hidden="true" />
                        {wb.previewLabel}
                      </span>
                      <span className="font-mono tabular-nums">
                        {quickMaskPreview.totalRedacted > 0
                          ? wb.hiddenCount(quickMaskPreview.totalRedacted)
                          : wb.noPiiFound}
                      </span>
                    </div>
                    <MaskedTextView text={quickMaskPreview.maskedText} compact />
                  </div>
                )}

                {quickError && (
                  <p role="alert" className="text-xs font-semibold text-[#9F2B11]">
                    {quickError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={quickLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#C84620] text-white text-sm font-bold hover:bg-[#AD3A18] disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    {quickLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>{t.checker.analyzingButton}</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                        <span>{t.checker.analyzeButton}</span>
                      </>
                    )}
                  </button>

                  <Link
                    to="/check"
                    className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[#CFC6B4] bg-[#FFFDF8] text-[#132A23] text-xs sm:text-sm font-semibold hover:bg-[#EFE9DC] transition-colors whitespace-nowrap"
                  >
                    {wb.fullOptions}
                  </Link>
                </div>
              </form>

              {/* Inline Instant Verdict Preview */}
              <AnimatePresence mode="wait">
                {quickResult && activeQuickLocalized && (() => {
                  const style = VERDICT_STYLES[quickResult.verdict];
                  const VerdictIcon = style.Icon;
                  const verdictMeta = t.result.verdicts[quickResult.verdict];
                  return (
                    <motion.div
                      key={quickResult.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`rounded-xl border overflow-hidden ${style.bg} ${style.border}`}
                      aria-live="polite"
                    >
                      <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${style.bannerBg}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 text-white shrink-0">
                            <VerdictIcon className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-base sm:text-lg font-extrabold leading-tight text-white">
                              {verdictMeta.label}
                            </p>
                            <p className={`text-xs font-mono tabular-nums ${style.bannerAccent}`}>
                              {t.result.riskScoreLabel}: {quickResult.riskScore}/100 ·{' '}
                              {quickResult.confidence}
                            </p>
                          </div>
                        </div>

                        {tts.isSupported && (
                          <button
                            type="button"
                            onClick={() => void handleReadQuickResult()}
                            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#FFFDF8] text-xs font-bold text-[#132A23] hover:bg-[#EFE9DC] transition-colors whitespace-nowrap"
                          >
                            {tts.isLoadingAudio ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C84620]" aria-hidden="true" />
                                <span>{t.result.preparingAudio}</span>
                              </>
                            ) : tts.isSpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-[#C84620]" aria-hidden="true" />
                                <span>{t.result.stopReading}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-[#132A23]" aria-hidden="true" />
                                <span>{t.result.readAloud}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        <RiskMeterBar score={quickResult.riskScore} verdict={quickResult.verdict} />

                        <p className="text-xs sm:text-sm text-[#132A23] leading-relaxed">
                          {activeQuickLocalized.explanation}
                        </p>

                        {quickResult.interopAnalysis && quickResult.interopAnalysis.identifiersFound > 0 && (
                          <p
                            className={`text-xs font-mono font-semibold break-words ${
                              quickResult.interopAnalysis.hasUnrecognizedHandle
                                ? 'text-[#B42318]'
                                : 'text-[#0F6B4A]'
                            }`}
                          >
                            {quickResult.interopAnalysis.overallLabel}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <Link
                            to={`/result/${quickResult.id}`}
                            className="inline-flex items-center gap-1 min-h-[36px] font-bold text-[#132A23] hover:text-[#C84620] underline underline-offset-2"
                          >
                            <span>{wb.openDossier}</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <span className="text-[#57534E]">{wb.advisoryTag}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Context Spread + Architectural 3-Step Civic Method */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-8 border-t border-[#DDD5C5]">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-[#DDD5C5] bg-[#FFFDF8] h-full">
              {!imgFailed ? (
                <img
                  src={HERO_IMAGE_PATH}
                  alt="Indian local shopkeeper and senior citizen verifying a digital payment message together on a smartphone"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-64 sm:h-72 lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 sm:h-72 lg:h-full bg-[#EFE9DC] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-[#132A23]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#132A23]">{t.brandName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#132A23] leading-tight">
              {t.landing.problemTitle}
            </h2>
            <p className="text-base text-[#3F3A32] leading-relaxed">{t.landing.problemBody}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 border-t border-[#DDD5C5]">
              {t.landing.steps.map((step) => (
                <div key={step.title} className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#132A23]">{step.title}</h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Pillar + Deep Forest-Ink Offline UPI Golden Rules */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="ledger-card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 text-[#132A23]">
              <Lock className="w-5 h-5 text-[#0F6B4A] shrink-0" aria-hidden="true" />
              <h2 className="text-xl font-bold">{t.landing.privacyPromiseTitle}</h2>
            </div>
            <ul className="space-y-3.5 text-sm text-[#3F3A32]">
              {t.landing.privacyPromiseItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 text-[#0F6B4A] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#132A23] text-[#FAF7F0] rounded-xl p-6 sm:p-8 space-y-5 border border-[#0D1E19]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-[#F2A07B] shrink-0" aria-hidden="true" />
                <h2 className="text-xl font-bold tracking-wide">{t.landing.offlineGuideTitle}</h2>
              </div>
              {tts.isSupported && (
                <button
                  type="button"
                  onClick={() => {
                    if (tts.isSpeaking || tts.isLoadingAudio) {
                      tts.stop();
                    } else {
                      void tts.speak(goldenRulesSpeechText);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFFDF8] text-xs sm:text-sm font-semibold border border-white/20 transition-colors whitespace-nowrap"
                >
                  {tts.isLoadingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F2A07B]" aria-hidden="true" />
                      <span>{t.result.preparingAudio}</span>
                    </>
                  ) : tts.isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#F5B495]" aria-hidden="true" />
                      <span>{t.result.stopReading}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#F2A07B]" aria-hidden="true" />
                      <span>{t.result.readAloud}</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <ul className="space-y-3.5 text-sm text-[#E9E4D8] tracking-[0.01em]">
              {t.landing.offlineGoldenRules.map((rule, idx) => (
                <li key={rule} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[#F2A07B] font-semibold mt-0.5 tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Advisory Safety Disclaimer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FDF6E3] border border-[#E5C98B] rounded-xl p-5 sm:p-6 space-y-1.5">
          <h2 className="text-sm font-bold text-[#78350F]">{t.landing.disclaimerTitle}</h2>
          <p className="text-sm text-[#78350F]/90 leading-relaxed">{t.landing.disclaimerBody}</p>
        </div>
      </section>
    </div>
  );
};
