import { resolveMediaUrl } from './mediaUrl';

/** Parse degree text into title + institution (e.g. "BPT — Delhi University, 2018"). */
export function parseDegreeField(text, defaultTitle) {
  const raw = (text || '').trim();
  if (!raw) return null;
  const dash = raw.split(/\s*[—–-]\s+/);
  if (dash.length >= 2) {
    return {
      title: dash[0].trim() || defaultTitle,
      institution: dash.slice(1).join(' – ').trim(),
    };
  }
  return { title: defaultTitle, institution: raw };
}

/** Structured qualifications for profile / popup display. */
export function buildDoctorQualifications(doctor) {
  if (!doctor) return [];
  const items = [];
  const bpt = parseDegreeField(doctor.degree_bpt, 'BPT');
  const mpt = parseDegreeField(doctor.degree_mpt, 'MPT');
  if (bpt) items.push(bpt);
  if (mpt) items.push(mpt);

  const legacy = (doctor.qualifications || '').trim();
  if (!items.length && legacy) {
    legacy
      .split(/[\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parsed = parseDegreeField(line, line);
        if (parsed) items.push(parsed);
      });
  }

  return items;
}

/** Banner slides: cover, gallery, then avatar (up to max). */
export function getDoctorBannerImages(doctor, max = 10) {
  if (!doctor) return [];
  const seen = new Set();
  const out = [];
  const push = (url) => {
    const u = resolveMediaUrl(url) || (url ? String(url).trim() : '');
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  push(doctor.cover_image);
  if (Array.isArray(doctor.gallery)) {
    for (const img of doctor.gallery) {
      push(typeof img === 'string' ? img : img?.image_url);
      if (out.length >= max) break;
    }
  }
  if (Array.isArray(doctor.image_urls)) {
    for (const url of doctor.image_urls) {
      push(url);
      if (out.length >= max) break;
    }
  }
  push(doctor.avatar);
  return out.slice(0, max);
}

export function doctorMinFee(doctor, enabled = []) {
  const fees = [];
  if (enabled.includes('clinic')) fees.push(Number(doctor?.consultation_fee));
  if (enabled.includes('online')) fees.push(Number(doctor?.online_fee));
  if (enabled.includes('home_visit') || enabled.includes('home')) fees.push(Number(doctor?.home_visit_fee));
  const valid = fees.filter((f) => f > 0);
  return valid.length ? Math.min(...valid) : null;
}

export function formatReviewCount(count) {
  const n = Number(count) || 0;
  if (n <= 0) return 'New';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return `${n.toLocaleString('en-IN')}+`;
}
