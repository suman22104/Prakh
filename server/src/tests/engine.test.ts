import test from 'node:test';
import assert from 'node:assert/strict';
import { maskSensitiveData } from '../../../shared/masking';
import { analyzeUrlsInText } from '../../../shared/urlAnalyzer';
import { runRuleBasedAnalysis } from '../../../shared/ruleEngine';
import { SYNTHETIC_TEST_CASES } from '../../../shared/syntheticDataset';
import {
  validateAnalyzeRequest,
  validateTranslateRequest,
  validateTtsRequest,
} from '../utils/validators';
import { parseAndValidateAiResponse } from '../utils/aiResponseValidator';
import { analyzeMessageHybrid } from '../services/hybridAnalysisService';
import type { AiProviderAdapter } from '../services/aiProvider';
import type { ConsentOptions } from '../../../shared/types';

const DEFAULT_CONSENT: ConsentOptions = {
  allowExternalAi: false,
  allowStorage: false,
  allowHumanReview: false,
  policyVersion: 'v1.0',
};

// 1. All 10 Synthetic Test Cases
for (const tc of SYNTHETIC_TEST_CASES) {
  test(`Synthetic Case #${tc.number}: ${tc.title} -> expected ${tc.expectedVerdicts.join(' or ')}`, () => {
    const result = runRuleBasedAnalysis({
      message: tc.sampleMessage,
      inputType: tc.inputType,
      language: tc.language,
      consent: DEFAULT_CONSENT,
      assessmentSource: 'rule_based_fallback',
    });

    assert.ok(
      tc.expectedVerdicts.includes(result.verdict),
      `Case #${tc.number} (${tc.title}) produced ${result.verdict} (score ${result.riskScore}), expected one of ${tc.expectedVerdicts.join(', ')}`
    );
    assert.ok(result.advisoryDisclaimer.length > 20, 'Advisory disclaimer must always be present');
    assert.ok(result.recommendedActions.length >= 2, 'Recommended actions must be populated');
  });
}

// 2. Sensitive Data Masking
test('Masks phone numbers, UPI IDs, OTPs, account numbers, Aadhaar, PAN, and emails', () => {
  const raw =
    'Call 9876543210 or +91 98301 23456, pay rahul.sharma@okhdfcbank, OTP 482910, A/c 30491827364, PAN ABCDE1234F, Aadhaar 2345 6789 0123, email test@gmail.com.';
  const res = maskSensitiveData(raw);

  assert.ok(!res.maskedText.includes('9876543210'), 'Phone should be masked');
  assert.ok(!res.maskedText.includes('98301 23456'), 'Formatted +91 phone should be masked');
  assert.ok(!res.maskedText.includes('rahul.sharma@okhdfcbank'), 'UPI ID should be masked');
  assert.ok(!res.maskedText.includes('482910'), 'OTP should be masked');
  assert.ok(!res.maskedText.includes('30491827364'), 'Account number should be masked');
  assert.ok(!res.maskedText.includes('ABCDE1234F'), 'PAN should be masked');
  assert.ok(!res.maskedText.includes('2345 6789 0123'), 'Aadhaar should be masked');
  assert.ok(!res.maskedText.includes('test@gmail.com'), 'Email should be masked');
  assert.ok(res.totalRedacted >= 7, 'Should record redaction counts');
});

// 3. Static URL Analyzer (never fetches links)
test('Flags shortened URLs, lookalike bank domains, raw IP links, and UPI deep links while allowlisting official domains', () => {
  const suspicious = analyzeUrlsInText(
    'Visit http://sbi-kyc-update.xyz/login or https://bit.ly/fake123 or http://192.168.1.9/pay or upi://pay?pa=scam@ybl&am=5000'
  );
  assert.equal(suspicious.urlsFound, 4);
  assert.ok(suspicious.totalUrlRiskPoints >= 60);
  assert.ok(suspicious.findings.some((f) => f.flags.includes('shortened_url_hides_destination')));
  assert.ok(suspicious.findings.some((f) => f.flags.includes('unofficial_bank_or_kyc_lookalike')));
  assert.ok(suspicious.findings.some((f) => f.flags.includes('raw_ip_address_link')));
  assert.ok(suspicious.findings.some((f) => f.flags.includes('upi_payment_deep_link')));

  const official = analyzeUrlsInText('Report cyber fraud only at https://cybercrime.gov.in');
  assert.equal(official.urlsFound, 1);
  assert.equal(official.findings[0].isOfficialAllowlisted, true);
  assert.equal(official.totalUrlRiskPoints, 0);
});

// 4. Multilingual Explanations (English, Hindi, Bengali)
test('Generates localized warning signs, explanation, and actions in Hindi and Bengali', () => {
  const hi = runRuleBasedAnalysis({
    message: 'आपका खाता बंद होने वाला है, तुरंत KYC अपडेट करें और OTP बताएं।',
    inputType: 'sms',
    language: 'hi',
    consent: DEFAULT_CONSENT,
    assessmentSource: 'offline_rules',
  });
  assert.equal(hi.verdict, 'SCAM');
  assert.match(hi.explanation, /[\u0900-\u097F]/);

  const bn = runRuleBasedAnalysis({
    message: 'আপনার ব্যাংক অ্যাকাউন্ট বন্ধ হয়ে যাবে, এখনই KYC আপডেট করুন এবং OTP দিন।',
    inputType: 'sms',
    language: 'bn',
    consent: DEFAULT_CONSENT,
    assessmentSource: 'offline_rules',
  });
  assert.equal(bn.verdict, 'SCAM');
  assert.match(bn.explanation, /[\u0980-\u09FF]/);
});

// 5. Edge Cases: Empty input, Unsupported language, Missing consent
test('Validator rejects empty input, unsupported language, and missing consent', () => {
  const empty = validateAnalyzeRequest({
    message: '   ',
    inputType: 'sms',
    language: 'en',
    consent: DEFAULT_CONSENT,
  });
  assert.equal(empty.valid, false);
  assert.equal(empty.code, 'EMPTY_INPUT');

  const badLang = validateAnalyzeRequest({
    message: 'Hello test',
    inputType: 'sms',
    language: 'fr',
    consent: DEFAULT_CONSENT,
  });
  assert.equal(badLang.valid, false);
  assert.equal(badLang.code, 'UNSUPPORTED_LANGUAGE');

  const noConsent = validateAnalyzeRequest({
    message: 'Hello test',
    inputType: 'sms',
    language: 'en',
  });
  assert.equal(noConsent.valid, false);
  assert.equal(noConsent.code, 'MISSING_CONSENT');
});

// 6. Invalid AI JSON Response Rejection
test('AI response validator rejects malformed JSON, out-of-range scores, and unknown verdicts', () => {
  assert.equal(parseAndValidateAiResponse('not valid json'), null);
  assert.equal(
    parseAndValidateAiResponse(JSON.stringify({ verdict: 'DEFINITELY_SAFE', riskScore: 10 })),
    null
  );
  assert.equal(
    parseAndValidateAiResponse(
      JSON.stringify({
        verdict: 'SCAM',
        riskScore: 150,
        confidence: 'HIGH',
        warningSigns: ['bad'],
        explanation: 'bad',
        recommendedActions: ['do not click'],
        humanReviewRecommended: true,
      })
    ),
    null
  );

  const good = parseAndValidateAiResponse(
    JSON.stringify({
      verdict: 'SUSPICIOUS',
      riskScore: 72,
      confidence: 'HIGH',
      warningSigns: ['Urgent KYC link'],
      explanation: 'Multiple phishing markers present.',
      recommendedActions: ['Do not open the link'],
      humanReviewRecommended: true,
    })
  );
  assert.ok(good !== null);
  assert.equal(good?.verdict, 'SUSPICIOUS');
});

// 7. Consent Gating & AI Unavailable Fallback
test('Hybrid engine NEVER calls AI without external consent and falls back cleanly when AI fails', async () => {
  let aiCalled = false;
  const spyProvider: AiProviderAdapter = {
    name: 'mock-ai',
    isConfigured: () => true,
    classify: async () => {
      aiCalled = true;
      throw new Error('Upstream AI timeout');
    },
  };

  // Without consent -> AI must NOT be called
  const noAiConsentResult = await analyzeMessageHybrid(
    {
      message: SYNTHETIC_TEST_CASES[0].sampleMessage,
      inputType: 'sms',
      language: 'en',
      consent: { ...DEFAULT_CONSENT, allowExternalAi: false },
    },
    spyProvider
  );
  assert.equal(aiCalled, false, 'AI provider must never be called without allowExternalAi consent');
  assert.equal(noAiConsentResult.assessmentSource, 'rule_based_fallback');

  // With consent + failing AI -> gracefully falls back to rule_based_fallback
  const failedAiResult = await analyzeMessageHybrid(
    {
      message: SYNTHETIC_TEST_CASES[0].sampleMessage,
      inputType: 'sms',
      language: 'en',
      consent: { ...DEFAULT_CONSENT, allowExternalAi: true },
    },
    spyProvider
  );
  assert.equal(aiCalled, true);
  assert.equal(failedAiResult.assessmentSource, 'rule_based_fallback');
  assert.equal(failedAiResult.verdict, 'SCAM');
  assert.ok(failedAiResult.fallbackReason?.includes('Upstream AI timeout'));
});

// 8. Safety-First Hybrid Fusion (AI receives ONLY masked text and cannot downgrade critical rule SCAM to SAFE)
test('Hybrid engine passes only masked text to AI and preserves safety floor on critical scams', async () => {
  let receivedMaskedText = '';
  const mockProvider: AiProviderAdapter = {
    name: 'mock-ai',
    isConfigured: () => true,
    classify: async (input) => {
      receivedMaskedText = input.maskedText;
      return {
        verdict: 'SAFE',
        riskScore: 10,
        confidence: 'LOW',
        warningSigns: [],
        explanation: 'Looks normal.',
        recommendedActions: ['Stay cautious'],
        humanReviewRecommended: false,
      };
    },
  };

  const result = await analyzeMessageHybrid(
    {
      message: SYNTHETIC_TEST_CASES[0].sampleMessage,
      inputType: 'sms',
      language: 'en',
      consent: { ...DEFAULT_CONSENT, allowExternalAi: true },
    },
    mockProvider
  );

  assert.ok(!receivedMaskedText.includes('9876543210'), 'AI must never receive unmasked phone');
  assert.ok(!receivedMaskedText.includes('30491827364'), 'AI must never receive unmasked account');
  assert.equal(result.verdict, 'SCAM', 'Critical rule-detected scam must not be downgraded to SAFE');
  assert.equal(result.assessmentSource, 'hybrid_ai');
});

// 9. Translation & Multilingual TTS Request Validators
test('Translation validator accepts en/hi/bn payloads and rejects empty or unsupported languages', () => {
  const validHi = validateTranslateRequest({
    targetLanguage: 'hi',
    explanation: 'This SMS impersonates a bank and asks for an OTP.',
    warningSigns: ['Urgent account blocking threat', 'Requests OTP'],
    recommendedActions: ['Do not click the link', 'Call 1930 if money was lost'],
    advisoryDisclaimer: 'Automated results are advisory only.',
  });
  assert.equal(validHi.valid, true);
  assert.equal(validHi.payload?.targetLanguage, 'hi');
  assert.equal(validHi.payload?.warningSigns.length, 2);

  const badLang = validateTranslateRequest({
    targetLanguage: 'de',
    explanation: 'Test explanation',
    warningSigns: [],
    recommendedActions: [],
    advisoryDisclaimer: 'Advisory only.',
  });
  assert.equal(badLang.valid, false);
  assert.equal(badLang.code, 'UNSUPPORTED_LANGUAGE');

  const emptyContent = validateTranslateRequest({
    targetLanguage: 'bn',
    explanation: '   ',
    warningSigns: [],
    recommendedActions: [],
    advisoryDisclaimer: 'Advisory only.',
  });
  assert.equal(emptyContent.valid, false);
  assert.equal(emptyContent.code, 'EMPTY_EXPLANATION');
});

test('TTS validator accepts en/hi/bn text, sanitizes control characters, caps length, and rejects empty or unsupported inputs', () => {
  const validBn = validateTtsRequest({
    text: 'টাকা পাওয়ার জন্য কখনোই UPI পিন দিতে হয় না।\u0007',
    language: 'bn',
  });
  assert.equal(validBn.valid, true);
  assert.equal(validBn.payload?.language, 'bn');
  assert.ok(validBn.payload && !validBn.payload.text.includes('\u0007'));

  const emptyTts = validateTtsRequest({ text: '   ', language: 'en' });
  assert.equal(emptyTts.valid, false);
  assert.equal(emptyTts.code, 'EMPTY_TEXT');

  const unsupportedTts = validateTtsRequest({ text: 'Hello', language: 'es' });
  assert.equal(unsupportedTts.valid, false);
  assert.equal(unsupportedTts.code, 'UNSUPPORTED_LANGUAGE');

  const longTts = validateTtsRequest({ text: 'a'.repeat(3000), language: 'hi' });
  assert.equal(longTts.valid, true);
  assert.ok(longTts.payload && longTts.payload.text.length <= 1800);
});

