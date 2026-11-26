import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialLanguage, SUPPORTED_LANGUAGES } from './LanguageContext';
import { TRANSLATIONS } from '../i18n/translations';

test('resolveInitialLanguage validates stored language codes and defaults safely to en', () => {
  assert.equal(resolveInitialLanguage('en'), 'en');
  assert.equal(resolveInitialLanguage('hi'), 'hi');
  assert.equal(resolveInitialLanguage('bn'), 'bn');
  assert.equal(resolveInitialLanguage('fr'), 'en');
  assert.equal(resolveInitialLanguage(''), 'en');
  assert.equal(resolveInitialLanguage(null), 'en');
});

test('every supported language has a complete translation bundle', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 3);
  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle.brandName.length > 0);
    assert.ok(bundle.brandShort.length > 0);
    assert.ok(bundle.brandTagline.length > 0);
    assert.ok(bundle.nav.home.length > 0);
    assert.ok(bundle.nav.check.length > 0);
    assert.ok(bundle.nav.dashboard.length > 0);
  }
});
