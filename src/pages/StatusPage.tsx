import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Play, RefreshCw, ShieldAlert } from 'lucide-react';
import { runRuleBasedAnalysis } from '../../shared/ruleEngine';
import { SYNTHETIC_TEST_CASES } from '../../shared/syntheticDataset';
import type { ScamAnalysisResult } from '../../shared/types';
import { VerdictLabel } from '../components/VerdictBadge';
import { useApp } from '../contexts/AppContext';

export const StatusPage: React.FC = () => {
  const { t, isOnline, health, refreshHealth } = useApp();
  const [benchmarkResults, setBenchmarkResults] = useState<
    Array<{ id: string; title: string; expected: string; result: ScamAnalysisResult; passed: boolean }>
  >([]);

  const runSyntheticSuite = () => {
    const outcomes = SYNTHETIC_TEST_CASES.map((tc) => {
      const result = runRuleBasedAnalysis({
        message: tc.sampleMessage,
        inputType: tc.inputType,
        language: tc.language,
        consent: {
          allowExternalAi: false,
          allowStorage: false,
          allowHumanReview: false,
          policyVersion: 'v1.0',
        },
        assessmentSource: 'offline_rules',
      });
      return {
        id: tc.id,
        title: `${tc.number}. ${tc.title}`,
        expected: tc.expectedVerdicts.join(' / '),
        result,
        passed: tc.expectedVerdicts.includes(result.verdict),
      };
    });
    setBenchmarkResults(outcomes);
  };

  const passedCount = benchmarkResults.filter((r) => r.passed).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDD5C5] pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="h-[2px] w-5 bg-[#C84620]" aria-hidden="true" />
            <p className="text-xs font-bold text-[#C84620]">System Readiness &amp; Benchmarks</p>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#132A23] leading-tight">
            {t.status.title}
          </h1>
          <p className="text-sm sm:text-base text-[#526058] max-w-2xl">{t.status.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshHealth()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFDF8] text-sm font-semibold text-[#132A23] hover:bg-[#EFE9DC] transition-colors duration-150 whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4 text-[#C84620]" aria-hidden="true" />
          Refresh Status
        </button>
      </div>

      {/* Operational Health Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">Network Connectivity</p>
          <p className="text-lg font-bold text-[#132A23]">
            {isOnline ? 'Online' : 'Offline Mode'}
          </p>
          <p className="text-xs text-[#526058]">
            {isOnline ? 'Hybrid backend reachable' : 'Local rule engine active'}
          </p>
        </div>

        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">AI Detection Provider</p>
          <p className="text-lg font-bold text-[#132A23] font-mono">
            {health ? health.activeProvider : 'offline_rules'}
          </p>
          <p className="text-xs text-[#526058]">
            {health?.aiConfigured
              ? 'Consented hybrid AI available'
              : 'Deterministic rule fallback active'}
          </p>
        </div>

        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">Local Rule Engine</p>
          <p className="text-lg font-bold text-[#0F6B4A]">Ready</p>
          <p className="text-xs text-[#526058]">EN · HI · BN static rules &amp; URL checks</p>
        </div>

        <div className="ledger-card p-5 space-y-1">
          <p className="text-xs font-medium text-[#526058]">Database &amp; Schema</p>
          <p className="text-lg font-bold text-[#132A23]">
            {health?.firestoreEnabled ? 'Firestore Sync' : 'Local Only'}
          </p>
          <p className="text-xs text-[#526058]">
            {health?.mysqlSchemaAvailable ? 'Portable MySQL schema included' : 'Consented storage'}
          </p>
        </div>
      </section>

      {/* Synthetic Benchmark Suite */}
      <section className="ledger-elevated p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-bold text-[#132A23]">
                Synthetic 10-Case Verification Suite
              </h2>
              {benchmarkResults.length > 0 && (
                <span className="font-mono text-xs font-bold text-[#0F6B4A] tabular-nums">
                  {passedCount}/{benchmarkResults.length} passed
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#526058]">
              Run all 10 synthetic Indian payment safety test cases locally using the deterministic
              rule engine and privacy masker (zero external calls).
            </p>
          </div>
          <button
            type="button"
            onClick={runSyntheticSuite}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#C84620] text-[#FFFDF8] text-sm font-bold hover:bg-[#AE3A18] transition-colors duration-150 whitespace-nowrap"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            Run 10 Synthetic Cases
          </button>
        </div>

        {benchmarkResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-x-auto"
          >
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#DDD5C5] text-[#526058]">
                  <th className="py-2.5 pr-4 font-semibold">Case</th>
                  <th className="py-2.5 pr-4 font-semibold">Expected</th>
                  <th className="py-2.5 pr-4 font-semibold">Actual Verdict</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Risk Score</th>
                  <th className="py-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C5]">
                {benchmarkResults.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F7F3EA]">
                    <td className="py-3 pr-4 font-medium text-[#132A23]">{row.title}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#526058] whitespace-nowrap">
                      {row.expected}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <VerdictLabel verdict={row.result.verdict} />
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-right text-[#132A23] whitespace-nowrap">
                      {row.result.riskScore}/100
                    </td>
                    <td className="py-3 text-right font-semibold whitespace-nowrap">
                      {row.passed ? (
                        <span className="inline-flex items-center gap-1 text-[#0F6B4A]">
                          <CheckCircle2 className="w-4 h-4" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#B42318]">
                          <ShieldAlert className="w-4 h-4" /> CHECK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </section>

      {/* Limitations & False Positive Transparency */}
      <section className="bg-[#FDF6E3] border border-[#E5C98B] rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#5C3D0C]">
          {t.status.limitationsTitle}
        </h2>
        <ul className="space-y-2 text-sm text-[#6E4911] list-disc pl-5">
          {t.status.limitationsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
