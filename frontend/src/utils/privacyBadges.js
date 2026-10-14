/**
 * Client-side guard matching PrivacyBadgeSettingsHelper.
 * A badge may mention HIPAA or GDPR only to say the note is not that certification.
 */

const CLAIM_PATTERNS = [
  /\bhipaa\b/g,
  /\bgdpr\b/g,
  /\bcertif(?:ied|ication|icate)\b/g,
  /\bcomplian(?:t|ce)\b/g,
  /\bthird[\s-]?party approved\b/g,
  /\bofficially approved\b/g,
  /\biso\s*-?\s*27001\b/g,
  /\bsoc\s*-?\s*2\b/g,
  /\bhitrust\b/g,
  /\bpci[\s-]?dss\b/g,
];

const ALLOWED_HREFS = ['/data-security', '/privacy-policy', '/medical-disclaimer'];

function negatedBefore(text, pos) {
  const window = text.slice(Math.max(0, pos - 80), pos);
  const clause = window.replace(/^[\s\S]*[.!?;,]/, '');
  // The denial has to sit immediately before the claim. "without doubt HIPAA"
  // and "no, HIPAA certified" are still claims.
  return /\b(?:not|never|cannot|can't|cant|isn't|isnt)\b(?:\s+(?:a|an|the|independent|independently|hipaa|gdpr|or|nor|certification|certified|certificate|compliance|compliant)){0,8}\s*$/.test(clause);
}

export function makesUnverifiedClaim(text) {
  const t = String(text || '').toLowerCase();
  for (const pattern of CLAIM_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(t);
    while (match) {
      if (!negatedBefore(t, match.index)) return true;
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
      match = pattern.exec(t);
    }
  }
  return false;
}

export function safeBadgeHref(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return '';
  return ALLOWED_HREFS.includes(href) ? href : '';
}

export function accessiblePrivacyDetail(description) {
  const text = String(description || '').trim();
  const extra = 'This note is not a HIPAA certification or a GDPR certification.';
  if (!text) return extra;
  if (/not a hipaa certification/i.test(text) && /not a gdpr certification|gdpr certification/i.test(text)) {
    return text;
  }
  return `${text} ${extra}`;
}

export function visiblePrivacyBadges(badges) {
  if (!Array.isArray(badges)) return [];
  return badges.filter((badge) => {
    const label = typeof badge?.label === 'string' ? badge.label.trim() : '';
    const description = typeof badge?.description === 'string' ? badge.description.trim() : '';
    if (!label || label.length > 48 || description.length > 280) return false;
    if (makesUnverifiedClaim(label) || makesUnverifiedClaim(description)) return false;
    return true;
  });
}
