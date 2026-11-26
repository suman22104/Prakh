import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Clock,
  LogIn,
  LogOut,
  ShieldCheck,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { Verdict } from '../../../shared/types';
import { VerdictLabel } from '../components/VerdictBadge';
import { MaskedTextView } from '../components/MaskedTextView';
import { useApp } from '../contexts/AppContext';

export const DashboardPage: React.FC = () => {
  const {
    t,
    user,
    isOnline,
    history,
    consents,
    offlineQueue,
    dataLoading,
    persistenceNotice,
    signInWithGoogle,
    signOutUser,
    deleteAllHistory,
    removeOfflineQueueItem,
    submitOfflineQueueItemWithConsent,
  } = useApp();

  const navigate = useNavigate();
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | Verdict>('ALL');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renewedConsentMap, setRenewedConsentMap] = useState<Record<string, boolean>>({});
  const [submittingQueueId, setSubmittingQueueId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const scam = history.filter((h) => h.verdict === 'SCAM').length;
    const suspiciousOrUncertain = history.filter(
      (h) => h.verdict === 'SUSPICIOUS' || h.verdict === 'UNCERTAIN'
    ).length;
    const safe = history.filter((h) => h.verdict === 'SAFE').length;
    return { total: history.length, scam, suspiciousOrUncertain, safe };
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (verdictFilter === 'ALL') return history;
    return history.filter((item) => item.verdict === verdictFilter);
  }, [history, verdictFilter]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteAllHistory();
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in cancelled or failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDD5C5] pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="h-[2px] w-5 bg-[#C84620]" aria-hidden="true" />
            <p className="text-xs font-bold text-[#C84620]">Personal Safety Ledger</p>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#132A23] leading-tight">
            {t.dashboard.title}
          </h1>
          <p className="text-sm sm:text-base text-[#526058] max-w-2xl">{t.dashboard.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-[#FFFDF8] border border-[#DDD5C5] rounded-xl px-4 py-1.5 text-xs sm:text-sm">
              <span className="text-[#132A23] font-medium truncate max-w-[180px] sm:max-w-[220px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-[#526058] hover:text-[#B42318] font-semibold whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t.dashboard.signOut}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleSignIn()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD5C5] bg-[#FFFDF8] text-sm font-semibold text-[#132A23] hover:bg-[#EFE9DC] transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
              {t.dashboard.signInGoogle}
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div role="alert" className="rounded-xl bg-[#FDF2F0] border border-[#E5B4AA] px-4 py-3 text-sm text-[#9A251B]">
          {authError}
        </div>
      )}

      {persistenceNotice && (
        <div role="status" className="rounded-xl bg-[#FDF6E3] border border-[#E5C98B] px-4 py-3 text-sm text-[#6E4911]">
          {persistenceNotice}
        </div>
      )}

      {!user && (
        <div className="rounded-xl bg-[#EFE9DC] border border-[#DDD5C5] px-4 py-3 text-xs sm:text-sm text-[#35443D]">
          {t.dashboard.syncAccountHint}
        </div>
      )}

      {/* 4-Column KPI Summary Strip (Tabular Numerals) */}
      <section aria-label="Risk statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">{t.dashboard.statsTotal}</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#132A23]">
            {stats.total}
          </p>
        </div>
        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">{t.dashboard.statsScam}</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#B42318]">
            {stats.scam}
          </p>
        </div>
        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">{t.dashboard.statsSuspicious}</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#B45309]">
            {stats.suspiciousOrUncertain}
          </p>
        </div>
        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">{t.dashboard.statsSafe}</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0F6B4A]">
            {stats.safe}
          </p>
        </div>
      </section>

      {/* Main Split: History Table + Privacy / Offline Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 ledger-elevated p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold text-[#132A23]">
              {t.dashboard.historyTitle}
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#EFE9DC] border border-[#DDD5C5] rounded-xl overflow-x-auto max-w-full">
              {(['ALL', 'SCAM', 'SUSPICIOUS', 'UNCERTAIN', 'SAFE'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={verdictFilter === f}
                  onClick={() => setVerdictFilter(f)}
                  className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    verdictFilter === f
                      ? 'bg-[#132A23] text-[#FFFDF8]'
                      : 'text-[#526058] hover:text-[#132A23]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-[#EFE9DC] animate-pulse" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-[#526058] max-w-md mx-auto">{t.dashboard.emptyHistory}</p>
              <Link
                to="/check"
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C84620] text-[#FFFDF8] text-sm font-semibold hover:bg-[#AE3A18] transition-colors"
              >
                {t.landing.primaryCta}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#DDD5C5]">
              {filteredHistory.map((item) => (
                <Link
                  key={item.id}
                  to={`/result/${item.id}`}
                  className="block py-4 hover:bg-[#F7F3EA] -mx-3 px-3 rounded-lg transition-colors space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <VerdictLabel verdict={item.verdict} />
                    <span className="text-xs font-mono tabular-nums text-[#526058]">
                      Score {item.riskScore}/100 · {item.inputType.replace('_', ' ')} ·{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#35443D] line-clamp-2 font-mono">{item.maskedText}</p>
                </Link>
              ))}
            </div>
          )}

          {/* Delete History Control */}
          <div className="pt-4 border-t border-[#DDD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#526058]">
              Only masked results with explicit storage consent appear here.
            </p>
            <AnimatePresence mode="wait">
              {!confirmDeleteOpen ? (
                <motion.button
                  key="delete-trigger"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  type="button"
                  disabled={history.length === 0 && consents.length === 0 && offlineQueue.length === 0}
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-[#E5B4AA] bg-[#FDF2F0] text-[#9A251B] text-xs font-semibold hover:bg-[#FAE4DF] disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {t.dashboard.deleteHistoryBtn}
                </motion.button>
              ) : (
                <motion.div
                  key="delete-confirm"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#FDF2F0] border border-[#E5B4AA] rounded-xl p-3"
                >
                  <p className="text-xs text-[#9A251B] font-medium">{t.dashboard.confirmDeleteMsg}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(false)}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#FFFDF8] border border-[#DDD5C5] text-xs font-semibold text-[#132A23]"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleConfirmDelete()}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#B42318] text-[#FFFDF8] text-xs font-semibold hover:bg-[#912018]"
                    >
                      {deleting ? 'Deleting...' : t.common.confirm}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Column: Offline Queue & Consent Records */}
        <div className="lg:col-span-5 space-y-6">
          {/* Offline Queue */}
          <section className="ledger-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#132A23]">
              <Clock className="w-5 h-5 text-[#C84620]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">{t.dashboard.offlineQueueTitle}</h2>
            </div>
            <p className="text-xs text-[#526058] leading-relaxed">
              {t.dashboard.offlineQueueWarning}
            </p>

            {offlineQueue.length === 0 ? (
              <p className="text-sm text-[#526058] py-2">{t.dashboard.offlineQueueEmpty}</p>
            ) : (
              <div className="divide-y divide-[#DDD5C5]">
                {offlineQueue.map((item) => {
                  const consented = Boolean(renewedConsentMap[item.id]);
                  return (
                    <div key={item.id} className="py-4 first:pt-1 last:pb-0 space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#526058]">
                        <span className="font-semibold text-[#132A23]">
                          Local preview: {item.localPreviewVerdict} ({item.localPreviewScore}/100)
                        </span>
                        <span className="font-mono uppercase">{item.inputType}</span>
                      </div>
                      <MaskedTextView text={item.maskedText} compact />

                      <label
                        className={`flex items-start gap-3 p-3 rounded-lg border text-xs text-[#35443D] cursor-pointer transition-colors duration-150 ${
                          consented
                            ? 'bg-[#EEF7F2] border-[#7EC4A4]'
                            : 'bg-[#FAF7F0] border-[#DDD5C5] hover:bg-[#EFE9DC]/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={consented}
                          onChange={(e) =>
                            setRenewedConsentMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 h-5 w-5 rounded border-[#C6BCA8] accent-[#0F6B4A] shrink-0"
                        />
                        <span className="leading-relaxed">{t.dashboard.renewConsentLabel}</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!isOnline || !consented || submittingQueueId === item.id}
                          onClick={async () => {
                            setSubmittingQueueId(item.id);
                            try {
                              const res = await submitOfflineQueueItemWithConsent(item, true);
                              navigate(`/result/${res.id}`);
                            } finally {
                              setSubmittingQueueId(null);
                            }
                          }}
                          className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#132A23] text-[#FFFDF8] text-xs font-semibold hover:bg-[#1E3B31] disabled:opacity-40 transition-colors duration-150"
                        >
                          {!isOnline ? (
                            <span className="inline-flex items-center gap-1">
                              <WifiOff className="w-3.5 h-3.5" /> Offline
                            </span>
                          ) : submittingQueueId === item.id ? (
                            'Submitting...'
                          ) : (
                            t.dashboard.submitQueuedBtn
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOfflineQueueItem(item.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C5] bg-[#FFFDF8] text-xs font-semibold text-[#35443D] hover:bg-[#EFE9DC] transition-colors duration-150"
                        >
                          {t.dashboard.removeQueuedBtn}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Privacy Settings & Consent Ledger */}
          <section className="ledger-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#132A23]">
              <ShieldCheck className="w-5 h-5 text-[#0F6B4A]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">{t.dashboard.consentRecordsTitle}</h2>
            </div>

            {consents.length === 0 ? (
              <p className="text-sm text-[#526058]">{t.dashboard.noConsentRecords}</p>
            ) : (
              <div className="divide-y divide-[#DDD5C5] max-h-64 overflow-y-auto">
                {consents.slice(0, 12).map((c) => (
                  <div key={c.id} className="py-2.5 text-xs space-y-0.5">
                    <p className="font-semibold text-[#132A23]">
                      {c.inputType.replace('_', ' ').toUpperCase()} · {c.language.toUpperCase()} ·{' '}
                      <span className="font-mono text-[#526058]">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-[#526058]">
                      External AI: {c.consentExternalAi ? 'Allowed' : 'Blocked'} · Storage:{' '}
                      {c.consentStorage ? 'Allowed' : 'Off'} · Human Review:{' '}
                      {c.consentHumanReview ? 'Allowed' : 'Off'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
