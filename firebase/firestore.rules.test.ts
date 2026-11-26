/**
 * Firestore Security Rules TDD Specification Verification
 * Verifies that all 12 Dirty Dozen adversarial payloads defined in security_spec.md
 * are structurally blocked by firestore.rules invariants.
 */
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Global default-deny safety net is present', () => {
  assert.match(rulesContent, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('Dirty Dozen #1 & #5: Storage and human review consent flags strictly enforced', () => {
  assert.match(rulesContent, /data\.consentStorage is bool && data\.consentStorage == true/);
  assert.match(rulesContent, /data\.consentHumanReview is bool && data\.consentHumanReview == true/);
});

test('Dirty Dozen #2 & #3: Identity matching and strict hasAll/hasOnly key allowlists enforced', () => {
  assert.match(rulesContent, /data\.ownerId == request\.auth\.uid/);
  assert.match(rulesContent, /data\.keys\(\)\.hasAll\(/);
  assert.match(rulesContent, /data\.keys\(\)\.hasOnly\(/);
});

test('Dirty Dozen #4: Admin email check requires email_verified == true', () => {
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
});

test('Dirty Dozen #6 & #7: Citizens must create PENDING reviewCases and only admins can update reviewer fields', () => {
  assert.match(rulesContent, /incoming\(\)\.status == 'PENDING'/);
  assert.match(rulesContent, /incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(\[\s*'status', 'reviewerNotes', 'reviewedBy', 'updatedAt'/);
});

test('Dirty Dozen #8: Admins cannot read non-consented analyses or reviewCases', () => {
  assert.match(rulesContent, /isAdmin\(\) && existing\(\)\.consentHumanReview == true/);
});

test('Dirty Dozen #9, #10, #11, #12: ID bounds, server request.time, array bounds, and locked admins collection', () => {
  assert.match(rulesContent, /id\.size\(\) <= 128 && id\.matches/);
  assert.match(rulesContent, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesContent, /isValidStringList\(data\.warningSigns, 12, 200\)/);
  assert.match(rulesContent, /match \/admins\/\{uid\}[\s\S]*allow list, create, update, delete: if false;/);
});
