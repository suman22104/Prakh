import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeInteropIdentifiers } from '../../../shared/interopCheck';
import { runRuleBasedAnalysis } from '../../../shared/ruleEngine';
import { analyzeMessageHybrid } from '../services/hybridAnalysisService';
import type { AiProviderAdapter } from '../services/aiProvider';
import type { ConsentOptions } from '../../../shared/types';

const DEFAULT_CONSENT: ConsentOptions = {
  allowExternalAi: false,
  allowStorage: false,
  allowHumanReview: false,
  policyVersion: 'v1.0',
};

test('Recognizes known participating Indian UPI PSP bank handles and never leaks VPA local-part', () => {
  const res = analyzeInteropIdentifiers(
    'Please pay Rs. 500 to priya.verma@okhdfcbank or upi://pay?pa=merchant99@ybl&am=500',
    'en'
  );

  assert.equal(res.identifiersFound, 2);
  assert.equal(res.hasUnrecognizedHandle, false);
  assert.equal(res.totalInteropRiskPoints, 0);
  assert.match(res.overallLabel, /Recipient bank handle: recognized/i);

  const identifiers = res.findings.map((f) => f.identifier);
  assert.ok(identifiers.includes('@okhdfcbank'));
  assert.ok(identifiers.includes('@ybl'));

  // Privacy invariant: personal local-part must never appear in interop output
  const serialized = JSON.stringify(res);
  assert.ok(!serialized.includes('priya.verma'), 'Must not leak VPA local-part');
  assert.ok(!serialized.includes('merchant99'), 'Must not leak deep-link VPA local-part');
});

test('Flags unrecognized UPI bank handles with risk points and clear not-recognized label', () => {
  const res = analyzeInteropIdentifiers(
    'Urgent KYC refund! Approve collect request from supportdesk@fakekycbank now.',
    'en'
  );

  assert.equal(res.identifiersFound, 1);
  assert.equal(res.hasUnrecognizedHandle, true);
  assert.ok(res.totalInteropRiskPoints > 0);
  assert.equal(res.findings[0].status, 'unrecognized');
  assert.equal(res.findings[0].identifier, '@fakekycbank');
  assert.match(res.overallLabel, /Recipient bank handle: not recognized/i);
  assert.match(res.findings[0].summaryLabel, /Recipient bank handle: not recognized/i);
});

test('Validates Indian IFSC-like bank prefixes against participating banks and masks branch digits', () => {
  const known = analyzeInteropIdentifiers(
    'Transfer to A/c 30491827364 with IFSC SBIN0001234 at Kolkata branch.',
    'en'
  );
  assert.equal(known.identifiersFound, 1);
  assert.equal(known.findings[0].kind, 'ifsc_code');
  assert.equal(known.findings[0].status, 'recognized');
  assert.equal(known.findings[0].identifier, 'SBIN0******');
  assert.equal(known.findings[0].bankName, 'State Bank of India');
  assert.equal(known.totalInteropRiskPoints, 0);

  const unknown = analyzeInteropIdentifiers(
    'Transfer fee to IFSC FAKE0998877 immediately.',
    'en'
  );
  assert.equal(unknown.identifiersFound, 1);
  assert.equal(unknown.findings[0].status, 'unrecognized');
  assert.equal(unknown.findings[0].identifier, 'FAKE0******');
  assert.equal(unknown.hasUnrecognizedHandle, true);
  assert.ok(unknown.totalInteropRiskPoints > 0);
  assert.match(unknown.findings[0].summaryLabel, /not recognized/i);
});

test('Ignores standard email addresses so they are not misclassified as unrecognized UPI handles', () => {
  const res = analyzeInteropIdentifiers(
    'Contact support@gmail.com or report fraud at help@cybercrime.gov.in.',
    'en'
  );
  assert.equal(res.identifiersFound, 0);
  assert.equal(res.hasUnrecognizedHandle, false);
  assert.equal(res.totalInteropRiskPoints, 0);
});

test('Wires interoperability signal into rule engine and passes redacted bank handle status to hybrid AI', async () => {
  const ruleResult = runRuleBasedAnalysis({
    message: 'Send Rs. 1500 to kyc.verify@notarealbank immediately.',
    inputType: 'upi_request',
    language: 'en',
    consent: DEFAULT_CONSENT,
    assessmentSource: 'offline_rules',
  });

  assert.ok(ruleResult.interopAnalysis, 'interopAnalysis should be populated on result');
  assert.equal(ruleResult.interopAnalysis?.hasUnrecognizedHandle, true);
  assert.ok(
    ruleResult.warningSigns.some((w) => w.includes('Recipient bank handle: not recognized')),
    'Unrecognized bank handle should be surfaced in warningSigns'
  );

  let receivedInterop: unknown = null;
  let receivedMasked = '';
  const mockAi: AiProviderAdapter = {
    name: 'mock-ai',
    isConfigured: () => true,
    classify: async (input) => {
      receivedInterop = input.interopAnalysis;
      receivedMasked = input.maskedText;
      return {
        verdict: 'SUSPICIOUS',
        riskScore: 68,
        confidence: 'HIGH',
        warningSigns: ['Unrecognized UPI bank handle'],
        explanation: 'Unrecognized recipient bank handle detected.',
        recommendedActions: ['Do not pay', 'Verify directly in your official UPI app'],
        humanReviewRecommended: true,
      };
    },
  };

  const hybridResult = await analyzeMessageHybrid(
    {
      message: 'Send Rs. 1500 to secretuser@notarealbank immediately.',
      inputType: 'upi_request',
      language: 'en',
      consent: { ...DEFAULT_CONSENT, allowExternalAi: true },
    },
    mockAi
  );

  assert.ok(receivedInterop, 'Hybrid AI should receive interopAnalysis signal');
  assert.ok(!receivedMasked.includes('secretuser'), 'AI must never receive raw VPA local-part');
  assert.equal(hybridResult.interopAnalysis?.findings[0]?.identifier, '@notarealbank');
});
