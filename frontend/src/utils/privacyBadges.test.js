import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accessiblePrivacyDetail,
  makesUnverifiedClaim,
  safeBadgeHref,
  visiblePrivacyBadges,
} from './privacyBadges.js';

const LIBRARY = 'This is general exercise guidance. It is not a HIPAA certification or a GDPR certification of this exercise.';
const HERO = 'Video consultations use HTTPS/TLS, as described in our Data Security Policy. This is not a HIPAA certification or a GDPR certification.';
const PLAN = 'This prescribed exercise is limited to you and your authorised care team. It is not a HIPAA certification or a GDPR certification of the exercise.';

test('suggested privacy wording is displayable', () => {
  assert.equal(makesUnverifiedClaim('Encrypted in transit'), false);
  assert.equal(makesUnverifiedClaim('Educational content'), false);
  assert.equal(makesUnverifiedClaim('Care-team access'), false);
  assert.equal(makesUnverifiedClaim(HERO), false);
  assert.equal(makesUnverifiedClaim(LIBRARY), false);
  assert.equal(makesUnverifiedClaim(PLAN), false);
});

test('certification and compliance claims are rejected', () => {
  for (const text of [
    'HIPAA Certified',
    'HIPAA compliant',
    'GDPR Certified',
    'We are GDPR compliant',
    'not applicable. HIPAA certified',
    'without doubt HIPAA certified',
    'no, HIPAA certified',
    'Third-party approved',
    'ISO 27001 certified',
    'PCI-DSS compliant',
  ]) {
    assert.equal(makesUnverifiedClaim(text), true, text);
  }
});

test('visible badges drop unverified claims and keep safe notes', () => {
  const visible = visiblePrivacyBadges([
    { id: 'ok', label: 'Encrypted in transit', description: HERO, href: '/data-security' },
    { id: 'bad', label: 'HIPAA Certified', description: 'Officially approved' },
    { id: 'empty', label: '   ', description: '' },
  ]);
  assert.deepEqual(visible.map((badge) => badge.id), ['ok']);
});

test('only published policy paths are linked', () => {
  assert.equal(safeBadgeHref('/data-security'), '/data-security');
  assert.equal(safeBadgeHref('/privacy-policy'), '/privacy-policy');
  assert.equal(safeBadgeHref('https://example.com'), '');
  assert.equal(safeBadgeHref('//evil.example/data-security'), '');
});

test('accessible detail keeps the non-certification sentence', () => {
  assert.match(accessiblePrivacyDetail(''), /not a HIPAA certification/i);
  assert.match(accessiblePrivacyDetail(LIBRARY), /not a HIPAA certification/i);
  assert.doesNotMatch(accessiblePrivacyDetail(LIBRARY), /not a HIPAA certification[\s\S]*not a HIPAA certification/i);
});
