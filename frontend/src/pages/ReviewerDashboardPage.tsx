import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Lock,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import type { ReviewCaseStatus } from '../../../shared/types';
import { VerdictLabel } from '../components/VerdictBadge';
import { MaskedTextView } from '../components/MaskedTextView';
import { useApp } from '../contexts/AppContext';

const STATUS_OPTIONS: ReviewCaseStatus[] = ['PENDING', 'REVIEWED', 'ESCALATED', 'CLOSED'];

export const ReviewerDashboardPage: React.FC = () => {
  const {
    t,
    user,
    isAdmin,
    reviewCases,
    auditLogs,
    signInWithGoogle,
    updateReviewCaseDecision,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewCaseStatus>('ALL');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<ReviewCaseStatus>('REVIEWED');
  const [draftNotes, setDraftNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Strictly only cases with explicit consentHumanReview === true
  const consentedCases = useMemo(
    () => reviewCases.filter((c) => c.consentHumanReview === true),
    [reviewCases]
  );

  const filteredCases = useMemo(() => {
    if (statusFilter === 'ALL') return consentedCases;
    return consentedCases.filter((c) => c.status === statusFilter);
  }, [consentedCases, statusFilter]);

  const activeCase = useMemo(
    () => filteredCases.find((c) => c.id === selectedCaseId) ?? filteredCases[0] ?? null,
    [filteredCases, selectedCaseId]
  );

  const handleSelectCase = (caseId: string) => {
    const found = consentedCases.find((c) => c.id === caseId);
    setSelectedCaseId(caseId);
    setToast(null);
    setErrorMsg(null);
    if (found) {
      setDraftStatus(found.status);
      setDraftNotes(found.reviewerNotes);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setSaving(true);
    setToast(null);
    setErrorMsg(null);
    try {
      await updateReviewCaseDecision(activeCase.id, draftStatus, draftNotes.trim());
      setToast(t.reviewer.savedToast);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save review update.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <div className="space-y-1.5 border-b border-[#DDD5C5] pb-5">
          <div className="inline-flex items-center gap-2">
            <span className="h-[2px] w-5 bg-[#C84620]" aria-hidden="true" />
            <p className="text-xs font-bold text-[#C84620]">Human Oversight Desk</p>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#132A23] leading-tight">
            {t.reviewer.title}
          </h1>
          <p className="text-sm sm:text-base text-[#526058] max-w-2xl">{t.reviewer.subtitle}</p>
        </div>

        <section className="ledger-elevated p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3.5 text-[#132A23]">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#FDF1EE] border border-[#E6B8AA] text-[#C84620] shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl sm:text-2xl font-bold">
                {t.reviewer.accessRestrictedTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#35443D] leading-relaxed max-w-2xl">
                {t.reviewer.accessRestrictedBody}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#526058] pt-3 border-t border-[#DDD5C5]">
            {t.reviewer.noUnauthorizedNotice}
          </p>

          {user && !isAdmin && (
            <div className="rounded-xl bg-[#FDF6E3] border border-[#E5C98B] px-4 py-3 text-xs sm:text-sm text-[#6E4911]">
              Signed in as <span className="font-mono font-semibold">{user.email}</span>. This
              account does not hold reviewer privileges, so other citizens’ review cases remain
              blocked at the database security rules layer.
            </div>
          )}

          {!user && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[#132A23] text-[#FFFDF8] text-sm font-bold hover:bg-[#1E3B31] transition-colors duration-150"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {t.reviewer.signInPrompt}
            </button>
          )}
        </section>

        {/* Show user's own submitted consented cases read-only if any exist locally */}
        {consentedCases.length > 0 && (
          <section className="ledger-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#132A23]">
              Your Submitted Consented Escalations (Read-Only)
            </h2>
            <div className="divide-y divide-[#DDD5C5]">
              {consentedCases.map((c) => (
                <div key={c.id} className="py-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <VerdictLabel verdict={c.verdict} />
                    <span className="font-mono text-xs text-[#526058]">{c.status}</span>
                  </div>
                  <p className="text-xs font-mono text-[#35443D] line-clamp-2">{c.maskedExcerpt}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1.5 border-b border-[#DDD5C5] pb-5">
        <p className="text-xs font-semibold text-[#0F6B4A] inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          {t.reviewer.consentedOnlyBadge} · Signed in as {user.email}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#132A23]">
          {t.reviewer.title}
        </h1>
        <p className="text-sm sm:text-base text-[#526058]">{t.reviewer.subtitle}</p>
      </div>

      <div className="rounded-xl bg-[#EFE9DC] border border-[#DDD5C5] px-4 py-3 text-xs text-[#35443D]">
        {t.reviewer.noUnauthorizedNotice}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Review Queue List */}
        <section className="lg:col-span-5 ledger-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-[#132A23]">
              {t.reviewer.queueTitle}
            </h2>
            <span className="font-mono text-xs text-[#526058] tabular-nums">
              {filteredCases.length} cases
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#EFE9DC] border border-[#DDD5C5] rounded-xl overflow-x-auto max-w-full">
            {(['ALL', ...STATUS_OPTIONS] as const).map((st) => (
              <button
                key={st}
                type="button"
                aria-pressed={statusFilter === st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  statusFilter === st
                    ? 'bg-[#132A23] text-[#FFFDF8]'
                    : 'text-[#526058] hover:text-[#132A23]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredCases.length === 0 ? (
            <p className="text-sm text-[#526058] py-8 text-center">{t.reviewer.emptyQueue}</p>
          ) : (
            <div className="divide-y divide-[#DDD5C5]">
              {filteredCases.map((c) => {
                const selected = activeCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(c.id)}
                    className={`w-full text-left py-3.5 px-3 rounded-lg transition-colors space-y-1 ${
                      selected ? 'bg-[#EFE9DC]' : 'hover:bg-[#F7F3EA]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <VerdictLabel verdict={c.verdict} />
                      <span className="font-mono text-xs font-semibold text-[#526058]">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#35443D] line-clamp-2">
                      {c.maskedExcerpt}
                    </p>
                    <p className="text-[11px] text-[#526058] font-mono tabular-nums">
                      Score {c.riskScore}/100 · {c.inputType} ·{' '}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Case Detail & Decision Panel */}
        <section className="lg:col-span-7 ledger-elevated p-6 space-y-5">
          {!activeCase ? (
            <div className="py-12 text-center text-sm text-[#526058]">
              Select a consented case from the queue to review.
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-4">
                <div className="space-y-0.5">
                  <VerdictLabel verdict={activeCase.verdict} />
                  <p className="text-xs font-mono text-[#526058]">
                    Case {activeCase.id} · Score {activeCase.riskScore}/100 · Consent Verified
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#0F6B4A]">
                  Explicit Human Review Consent: YES
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#132A23]">Masked Excerpt (No Raw PII)</p>
                <MaskedTextView text={activeCase.maskedExcerpt} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reviewer-status-select"
                    className="block text-sm font-semibold text-[#132A23]"
                  >
                    {t.reviewer.caseStatusLabel}
                  </label>
                  <select
                    id="reviewer-status-select"
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as ReviewCaseStatus)}
                    className="w-full min-h-[44px] rounded-xl border border-[#DDD5C5] bg-[#FFFDF8] px-3 text-sm text-[#132A23] focus:outline-none focus:ring-2 focus:ring-[#C84620]"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reviewer-notes-textarea"
                  className="block text-sm font-semibold text-[#132A23]"
                >
                  {t.reviewer.notesLabel}
                </label>
                <textarea
                  id="reviewer-notes-textarea"
                  rows={4}
                  maxLength={2000}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder={t.reviewer.notesPlaceholder}
                  className="w-full rounded-xl border border-[#DDD5C5] bg-[#FFFDF8] p-3.5 text-sm text-[#132A23] focus:outline-none focus:ring-2 focus:ring-[#C84620]"
                />
              </div>

              {errorMsg && (
                <div role="alert" className="rounded-xl bg-[#FDF2F0] border border-[#E5B4AA] px-4 py-2.5 text-xs text-[#9A251B]">
                  {errorMsg}
                </div>
              )}

              {toast && (
                <div role="status" className="rounded-xl bg-[#EEF6F1] border border-[#BBDAC9] px-4 py-2.5 text-xs font-medium text-[#0F6B4A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{toast}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-xl bg-[#C84620] text-[#FFFDF8] text-sm font-bold hover:bg-[#AE3A18] disabled:opacity-60 transition-colors duration-150"
              >
                {saving ? 'Saving...' : t.reviewer.saveDecisionBtn}
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Operational Audit Log */}
      <section className="ledger-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#132A23]">
          <ClipboardList className="w-5 h-5 text-[#C84620]" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold">{t.reviewer.auditTitle}</h2>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-sm text-[#526058]">{t.reviewer.noAuditLogs}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#DDD5C5] text-[#526058]">
                  <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 pr-4 font-semibold">Event</th>
                  <th className="py-2.5 pr-4 font-semibold">Actor</th>
                  <th className="py-2.5 pr-4 font-semibold">Source</th>
                  <th className="py-2.5 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C5]">
                {auditLogs.slice(0, 25).map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F3EA]">
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#526058] whitespace-nowrap tabular-nums">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[#132A23] whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="py-2.5 pr-4 text-[#35443D] whitespace-nowrap">
                      {log.actorRole}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#526058] whitespace-nowrap">
                      {log.assessmentSource}
                    </td>
                    <td className="py-2.5 text-[#35443D]">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
