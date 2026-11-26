import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResultSpeechText,
  getSpeechLocale,
  selectVoiceForLanguage,
  SPEECH_LOCALE_BY_LANGUAGE,
  type SpeechVoiceLike,
} from './useTextToSpeech';

test('getSpeechLocale maps English, Hindi, and Bengali to Indian BCP-47 locales', () => {
  assert.equal(getSpeechLocale('en'), 'en-IN');
  assert.equal(getSpeechLocale('hi'), 'hi-IN');
  assert.equal(getSpeechLocale('bn'), 'bn-IN');
  assert.deepEqual(SPEECH_LOCALE_BY_LANGUAGE, {
    en: 'en-IN',
    hi: 'hi-IN',
    bn: 'bn-IN',
  });
});

test('selectVoiceForLanguage chooses best regional voice for en, hi, and bn with local preference', () => {
  const sampleVoices: SpeechVoiceLike[] = [
    { name: 'Google US English', lang: 'en-US', localService: false },
    { name: 'Rishi (English India)', lang: 'en-IN', localService: true },
    { name: 'Google हिन्दी', lang: 'hi-IN', localService: false },
    { name: 'Lekha Hindi', lang: 'hi-IN', localService: true },
    { name: 'Bengali Bangladesh', lang: 'bn-BD', localService: false },
    { name: 'Piya Bengali India', lang: 'bn_IN', localService: true },
  ];

  assert.equal(selectVoiceForLanguage(sampleVoices, 'en')?.name, 'Rishi (English India)');
  assert.equal(selectVoiceForLanguage(sampleVoices, 'hi')?.name, 'Lekha Hindi');
  assert.equal(selectVoiceForLanguage(sampleVoices, 'bn')?.name, 'Piya Bengali India');
});

test('selectVoiceForLanguage falls back cleanly to secondary regional variants and handles empty/missing matches', () => {
  const fallbackVoices: SpeechVoiceLike[] = [
    { name: 'English UK', lang: 'en-GB', localService: true },
    { name: 'Bengali BD', lang: 'bn-BD', localService: false },
  ];

  assert.equal(selectVoiceForLanguage(fallbackVoices, 'en')?.name, 'English UK');
  assert.equal(selectVoiceForLanguage(fallbackVoices, 'bn')?.name, 'Bengali BD');
  assert.equal(selectVoiceForLanguage(fallbackVoices, 'hi'), null);
  assert.equal(selectVoiceForLanguage([], 'en'), null);
});

test('buildResultSpeechText formats multilingual verdict summaries with limits and strips empty items', () => {
  const hiText = buildResultSpeechText({
    verdictLabel: 'SCAM — उच्च खतरा।',
    explanation: 'इस संदेश में धोखाधड़ी के संकेत मिले हैं।',
    warningSigns: ['चेतावनी 1', '  ', 'चेतावनी 2', 'चेतावनी 3', 'चेतावनी 4'],
    recommendedActions: ['कदम 1', 'कदम 2', 'कदम 3', 'कदम 4'],
    maxWarnings: 2,
    maxActions: 2,
  });

  assert.equal(
    hiText,
    'SCAM — उच्च खतरा. इस संदेश में धोखाधड़ी के संकेत मिले हैं. चेतावनी 1. चेतावनी 2. कदम 1. कदम 2'
  );

  const bnText = buildResultSpeechText({
    verdictLabel: 'SAFE — কম ঝুঁকি',
    explanation: 'সাধারণ কোনো স্ক্যাম লক্ষণ মেলেনি।',
    warningSigns: [],
    recommendedActions: ['ব্যাংকের অফিসিয়াল অ্যাপে যাচাই করুন।'],
  });

  assert.equal(
    bnText,
    'SAFE — কম ঝুঁকি. সাধারণ কোনো স্ক্যাম লক্ষণ মেলেনি. ব্যাংকের অফিসিয়াল অ্যাপে যাচাই করুন'
  );
});
