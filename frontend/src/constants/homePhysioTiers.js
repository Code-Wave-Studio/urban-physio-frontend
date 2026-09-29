import { bookHomeVisitUrl, readHomePhysioTier } from '../utils/bookUrl.js';

/**
 * Home Physiotherapy tier catalog (CRF-2026-0006 step 5).
 *
 * Runtime source of truth is `site_home_physio_settings.sections_json.tiers`
 * (admin CMS + public API). This catalog is only the fallback when a tier
 * field is missing. `pricing_sessions` is derived from these tiers so the
 * public pricing cards cannot drift.
 *
 * Display prices only. Booking still charges the doctor's home_visit_fee.
 */

export const HOME_PHYSIO_TIER_KEYS = ['certified', 'senior', 'specialist'];

export const HOME_PHYSIO_TIER_CATALOG = [
  {
    key: 'certified',
    name: 'Certified Physio',
    badge: '',
    price: '₹1,200',
    original: '₹1,500',
    summary: 'Best for common musculoskeletal conditions, pain management, and general rehabilitation.',
    qualification: 'BPT from a recognised institution',
    experience: '1–3 years',
    speciality:
      'Orthopaedic conditions, back and neck pain, post-operative rehabilitation, sports injuries, general physiotherapy',
    case_handling: 'Clinical assessment, SOAP-based documentation, structured home exercise prescription via TUP app',
    cta_label: 'Book a Certified Physio — ₹1,200',
    cta_link: bookHomeVisitUrl({ tier: 'certified' }),
  },
  {
    key: 'senior',
    name: 'Senior Physio',
    badge: 'Most Booked',
    price: '₹1,500',
    original: '₹1,800',
    summary: 'Ideal when you want deeper clinical judgement and multi-session rehabilitation planning.',
    qualification: 'BPT with advanced certification or MPT',
    experience: '3–6 years',
    speciality:
      "Chronic pain, sports rehabilitation, neurological physiotherapy, women's health, cardiorespiratory, post-surgical recovery",
    case_handling:
      'Multi-session treatment planning, condition-specific manual therapy, outcome measurement and progressive rehabilitation protocols',
    cta_label: 'Book a Senior Physio — ₹1,500',
    cta_link: bookHomeVisitUrl({ tier: 'senior' }),
  },
  {
    key: 'specialist',
    name: 'Specialist Consultant',
    badge: 'Expert Care',
    price: '₹2,000',
    original: '₹2,500',
    summary: 'For complex, high-dependency, or specialist-led recovery that needs senior clinical judgement.',
    qualification: 'MPT in a specialised domain',
    experience: '6+ years',
    speciality:
      'Neurological rehabilitation, advanced sports physiotherapy, complex post-operative cases, vestibular/balance rehabilitation, chronic complex pain, high-dependency elderly care',
    case_handling:
      'Advanced manual therapy, instrument-assisted techniques, complex case management and specialist-level clinical judgement',
    cta_label: 'Book a Specialist Consultant — ₹2,000',
    cta_link: bookHomeVisitUrl({ tier: 'specialist' }),
  },
];

const CATALOG_BY_KEY = Object.fromEntries(HOME_PHYSIO_TIER_CATALOG.map((tier) => [tier.key, tier]));

function pickField(base, stored, field, fallbackOnBlank = false) {
  if (!stored || !Object.prototype.hasOwnProperty.call(stored, field) || stored[field] == null) {
    return base[field] ?? '';
  }
  const value = stored[field];
  if (fallbackOnBlank && typeof value === 'string' && value.trim() === '') {
    return base[field] ?? '';
  }
  return value;
}

/**
 * Keep an existing /book link when it already carries this tier.
 * Repair home-visit booking links that dropped the tier query param.
 * Leave non-booking links unchanged.
 */
export function homePhysioTierBookLink(key, link = '') {
  const tier = readHomePhysioTier(key);
  if (!tier) return String(link || '').trim();
  const fallback = bookHomeVisitUrl({ tier });
  const raw = String(link || '').trim();
  if (!raw) return fallback;
  if (!raw.startsWith('/book')) return raw;

  const qIndex = raw.indexOf('?');
  const params = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
  if (
    readHomePhysioTier(params.get('tier')) === tier
    && params.get('type') === 'home_visit'
    && params.get('mode') === 'home-visit'
  ) {
    return raw;
  }
  if (!params.get('type')) params.set('type', 'home_visit');
  if (!params.get('mode')) params.set('mode', 'home-visit');
  params.set('tier', tier);
  const path = (qIndex === -1 ? raw : raw.slice(0, qIndex)) || '/book';
  return `${path}?${params.toString()}`;
}

function mergeTier(base, stored) {
  const src = stored && typeof stored === 'object' ? stored : {};
  const name = pickField(base, src, 'name', true);
  const price = pickField(base, src, 'price', true);
  const storedLabel = typeof src.cta_label === 'string' ? src.cta_label.trim() : '';
  const ctaLabel = storedLabel || `Book a ${name} — ${price}`;
  return {
    ...base,
    ...src,
    key: base.key,
    name,
    badge: pickField(base, src, 'badge', false),
    price,
    original: pickField(base, src, 'original', true),
    summary: pickField(base, src, 'summary', true),
    qualification: pickField(base, src, 'qualification', true),
    experience: pickField(base, src, 'experience', true),
    speciality: pickField(base, src, 'speciality', true),
    case_handling: pickField(base, src, 'case_handling', true),
    cta_label: ctaLabel,
    cta_link: homePhysioTierBookLink(base.key, pickField(base, src, 'cta_link', true)),
  };
}

/**
 * One record per canonical tier key. CMS values win when present.
 * Missing keys are filled from the catalog. Unknown extra tiers are kept after the three.
 */
export function normalizeHomePhysioTiers(raw) {
  const incoming = Array.isArray(raw) ? raw.filter((tier) => tier && typeof tier === 'object') : [];
  const claimed = new Set();

  const canonical = HOME_PHYSIO_TIER_CATALOG.map((base, index) => {
    let stored = incoming.find((tier) => readHomePhysioTier(tier.key) === base.key);
    if (!stored) {
      const at = incoming[index];
      if (at && !readHomePhysioTier(at.key)) stored = at;
    }
    if (stored) claimed.add(stored);
    return mergeTier(base, stored);
  });

  const extras = incoming
    .filter((tier) => !claimed.has(tier))
    .map((tier) => {
      const key = readHomePhysioTier(tier.key);
      if (!key || CATALOG_BY_KEY[key]) return null;
      return {
        ...tier,
        key,
        cta_link: homePhysioTierBookLink(key, tier.cta_link || ''),
      };
    })
    .filter(Boolean);

  return [...canonical, ...extras];
}

export function pricingSessionsFromTiers(tiers) {
  return (Array.isArray(tiers) ? tiers : []).map((tier) => ({
    name: tier?.name || '',
    original: tier?.original || '',
    price: tier?.price || '',
  }));
}

/** Replace the duplicate session-price list with the tier display prices. */
export function alignHomePhysioTierSections(sections = {}) {
  const tiers = normalizeHomePhysioTiers(sections?.tiers);
  return {
    ...sections,
    tiers,
    pricing_sessions: pricingSessionsFromTiers(tiers),
  };
}

/**
 * Copy a pricing-card edit back onto the matching tier.
 * Used by the existing admin pricing tab so it edits the same three tiers.
 */
export function applyPricingSessionsToTiers(tiers, sessions) {
  const prev = Array.isArray(tiers) ? tiers : [];
  const rows = Array.isArray(sessions) ? sessions : [];
  const sameLength = rows.length === prev.length;
  const used = new Set();
  const next = prev.map((tier) => ({ ...tier }));

  rows.forEach((row, i) => {
    if (!row || typeof row !== 'object') return;
    let idx = next.findIndex((tier, j) => !used.has(j) && tier.name && row.name && tier.name === row.name);
    if (idx < 0 && sameLength && next[i] && !used.has(i)) idx = i;
    if (idx < 0) return;
    used.add(idx);
    const old = prev[idx] || {};
    let cta = next[idx].cta_label;
    if (
      old.price
      && row.price
      && old.price !== row.price
      && typeof cta === 'string'
      && cta.includes(old.price)
    ) {
      cta = cta.split(old.price).join(row.price);
    }
    next[idx] = {
      ...next[idx],
      name: row.name ?? next[idx].name,
      original: row.original ?? next[idx].original,
      price: row.price ?? next[idx].price,
      cta_label: cta,
    };
  });

  return next;
}

export function syncTierPriceLabels(previous, nextTiers) {
  return (nextTiers || []).map((tier, i) => {
    const old = previous?.[i];
    if (!old || !tier || !old.price || old.price === tier.price) return tier;
    if (typeof tier.cta_label === 'string' && tier.cta_label.includes(old.price)) {
      return { ...tier, cta_label: tier.cta_label.split(old.price).join(tier.price) };
    }
    return tier;
  });
}

/** Package amounts that ship in the default FAQ copy. Live CMS prices replace these at render time. */
export const HOME_PHYSIO_PACKAGE_PRICE_DEFAULTS = [
  { name: 'Certified', price: '₹16,499' },
  { name: 'Senior', price: '₹19,999' },
  { name: 'Specialist', price: '₹26,999' },
];

function priceSwaps(defaults, liveRows, match) {
  return defaults
    .map((base) => {
      const live = (liveRows || []).find((row) => match(base, row));
      const to = String(live?.price || '').trim();
      const from = String(base.price || '').trim();
      if (!from || !to || from === to) return null;
      return { from, to };
    })
    .filter(Boolean);
}

/**
 * Swap catalog prices embedded in stored copy for the current CMS prices.
 * Uses placeholders so two tiers can exchange amounts without colliding.
 */
export function textWithLivePrices(text, tiers, packages) {
  if (typeof text !== 'string' || text === '') return text;
  const swaps = [
    ...priceSwaps(HOME_PHYSIO_TIER_CATALOG, tiers, (base, row) => row?.key === base.key),
    ...priceSwaps(
      HOME_PHYSIO_PACKAGE_PRICE_DEFAULTS,
      packages,
      (base, row) => row?.name && base.name && row.name === base.name
    ),
  ];
  if (!swaps.length) return text;
  let out = text;
  swaps.forEach((swap, index) => {
    out = out.split(swap.from).join(`\u0000P${index}\u0000`);
  });
  swaps.forEach((swap, index) => {
    out = out.split(`\u0000P${index}\u0000`).join(swap.to);
  });
  return out;
}

export function faqsWithLivePrices(faqs, tiers, packages) {
  return (Array.isArray(faqs) ? faqs : []).map((item) => {
    if (!item || typeof item.a !== 'string') return item;
    const answer = textWithLivePrices(item.a, tiers, packages);
    return answer === item.a ? item : { ...item, a: answer };
  });
}

/** Button label follows the CMS price when the stored label still quotes an older amount. */
export function tierButtonLabel(tier) {
  const price = String(tier?.price || '').trim();
  const name = String(tier?.name || 'Physio').trim();
  const label = String(tier?.cta_label || '').trim();
  if (!label) return price ? `Book a ${name} — ${price}` : `Book a ${name}`;
  if (!price || label.includes(price)) return label;
  if (/₹[\d,]+/.test(label)) return label.replace(/₹[\d,]+/g, price);
  return label;
}
