/**
 * Tele-Rehab catalogue rules from TUP-services-plans-spec.md.
 * Ranking uses the documented score. View history stays on the device.
 * Discounts are calculated from regular and offer prices.
 */

import { whatsappChatUrl } from '../../utils/whatsapp.js';

export const CATALOGUE_LEAD_MINUTES = 120;
export const VIEW_HISTORY_KEY = 'tup_svc_views_telerehab';
export const LAYOUT_KEY_PREFIX = 'tup_svc_layout_';

const CURE_PATTERN = /cure|guaranteed|permanent|100%/i;

export function formatInr(rupees) {
  if (rupees == null || Number.isNaN(Number(rupees))) return '';
  return `₹${Math.round(Number(rupees)).toLocaleString('en-IN')}`;
}

export function activePrice(regular, offer, startsAt, endsAt, now = new Date()) {
  const regularPrice = regular == null || regular === '' ? null : Number(regular);
  const offerPrice = offer == null || offer === '' ? null : Number(offer);
  if (regularPrice == null || Number.isNaN(regularPrice)) {
    return { display: null, regular: null, save: 0, percent: 0, showOffer: false };
  }
  let showOffer = offerPrice != null && !Number.isNaN(offerPrice) && offerPrice < regularPrice;
  if (showOffer && startsAt) {
    const start = new Date(`${startsAt}T00:00:00+05:30`);
    if (!Number.isNaN(start.getTime()) && now < start) showOffer = false;
  }
  if (showOffer && endsAt) {
    const end = new Date(`${endsAt}T23:59:59+05:30`);
    if (!Number.isNaN(end.getTime()) && now > end) showOffer = false;
  }
  const display = showOffer ? offerPrice : regularPrice;
  const save = showOffer ? regularPrice - offerPrice : 0;
  const percent = showOffer && regularPrice > 0 ? Math.round((save * 100) / regularPrice) : 0;
  return { display, regular: regularPrice, save, percent, showOffer };
}

export function planSavings(phasePrices, fullPrice) {
  const phases = (phasePrices || []).map((price) => Number(price) || 0);
  const sum = phases.reduce((total, price) => total + price, 0);
  const full = Number(fullPrice);
  if (!Number.isFinite(full) || sum <= full) {
    return { save: 0, percent: sum > 0 && full > 0 && sum > full ? Math.round(((sum - full) * 100) / sum) : 0, phaseSum: sum };
  }
  const save = sum - full;
  return { save, percent: Math.round((save * 100) / sum), phaseSum: sum };
}

export function phaseBarSegments(phases) {
  const rows = phases || [];
  const total = rows.reduce((sum, phase) => sum + Math.max(0, Number(phase.weekTo) - Number(phase.weekFrom)), 0);
  if (total <= 0) return rows.map(() => 0);
  return rows.map((phase) => (Math.max(0, Number(phase.weekTo) - Number(phase.weekFrom)) / total) * 100);
}

export function textHasBlockedClaim(value) {
  return CURE_PATTERN.test(String(value || ''));
}

export function applyChipFilter(sections, chipKey) {
  if (!chipKey) return sections || [];
  return (sections || [])
    .map((section) => ({
      ...section,
      items: (section.items || [])
        .filter((item) => (item.chipKeys || []).includes(chipKey))
        .slice()
        .sort((a, b) => (a.chipOrder?.[chipKey] ?? 0) - (b.chipOrder?.[chipKey] ?? 0) || (a.adminIndex ?? 0) - (b.adminIndex ?? 0)),
    }))
    .filter((section) => section.items.length > 0);
}

export function orderChipsForVisit(chips, interest) {
  const list = (chips || []).slice();
  const pinned = list.filter((chip) => chip.pinned).sort((a, b) => a.sortOrder - b.sortOrder);
  const rest = list.filter((chip) => !chip.pinned).sort((a, b) => {
    const delta = (interest[b.key] || 0) - (interest[a.key] || 0);
    if (Math.abs(delta) > 1e-9) return delta;
    return a.sortOrder - b.sortOrder;
  });
  return [...pinned, ...rest];
}

export function chipInterest(recentViews, chipsByItemId, sourceChipKey) {
  const interest = {};
  (recentViews || []).slice(0, 8).forEach((view, index) => {
    const weight = 1 / (index + 1);
    (chipsByItemId[view.id] || []).forEach((chip) => {
      interest[chip.key] = (interest[chip.key] || 0) + weight;
    });
  });
  if (sourceChipKey) interest[sourceChipKey] = (interest[sourceChipKey] || 0) + 2;
  return interest;
}

export function resolvePairs(itemId, manualPairs, bookingPairs) {
  const manual = manualPairs?.[itemId] || [];
  if (manual.length) return manual;
  return bookingPairs?.[itemId] || [];
}

/**
 * Documented quick-pick score. Ties keep admin order.
 * candidates must already be limited to the selected chip when one is selected.
 */
export function rankQuickPicks({
  items,
  chipsByItemId,
  selectedChipKey = '',
  sourceChipKey = '',
  recentViews = [],
  pairsByItemId = {},
}) {
  const views = (recentViews || []).slice(0, 8);
  const interest = chipInterest(views, chipsByItemId, sourceChipKey);
  const mostRecent = views[0]?.id ?? null;
  const scored = (items || []).map((item) => {
    const itemChips = chipsByItemId[item.id] || [];
    const maxInterest = itemChips.reduce((max, chip) => Math.max(max, interest[chip.key] || 0), 0);
    const primary = itemChips.find((chip) => chip.isPrimary) || null;
    let score = 3 * maxInterest;
    if (primary && (primary.key === selectedChipKey || primary.key === sourceChipKey)) score += 2;
    views.forEach((view, index) => {
      const related = pairsByItemId[view.id] || [];
      if (related.includes(item.id)) score += 2 / (index + 1);
    });
    if (item.id === mostRecent) score -= 0.6;
    const rating = item.rating == null || item.rating === '' ? 4.5 : Number(item.rating);
    score += (Number.isFinite(rating) ? rating : 4.5) - 4.5;
    if (item.badge) score += 0.4;
    score += Math.min(1, 0.02 * (Number(item.bookingsLast30Days) || 0));
    const oftenBookedTogether = views.some((view) => (pairsByItemId[view.id] || []).includes(item.id));
    return { item, score, oftenBookedTogether };
  });
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-9) return b.score - a.score;
    return (a.item.adminIndex ?? 0) - (b.item.adminIndex ?? 0);
  });
  return scored.slice(0, 12).map((row) => ({
    ...row.item,
    suggestionScore: row.score,
    oftenBookedTogether: row.oftenBookedTogether,
  }));
}

export function quickPickCopy({ selectedChipLabel, recentTitle, blocks }) {
  const headingDefault = blocks?.quickPicksHeading || 'Quick picks for you';
  if (selectedChipLabel) {
    return {
      heading: `Quick picks for ${selectedChipLabel}`,
      reason: String(blocks?.reasonChip || 'Matched to {chip}').replace('{chip}', selectedChipLabel),
    };
  }
  if (recentTitle) {
    return {
      heading: headingDefault,
      reason: String(blocks?.reasonViewed || 'Because you viewed {item}').replace('{item}', recentTitle),
    };
  }
  return {
    heading: headingDefault,
    reason: blocks?.reasonNew || 'Most booked online this week',
  };
}

export function readViewHistory(storageKey = VIEW_HISTORY_KEY) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((row) => row && Number.isInteger(row.id) && typeof row.title === 'string')
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function rememberView(item, storageKey = VIEW_HISTORY_KEY) {
  if (!item?.id || typeof localStorage === 'undefined') return readViewHistory(storageKey);
  const next = [
    { id: item.id, title: item.title },
    ...readViewHistory(storageKey).filter((row) => row.id !== item.id),
  ].slice(0, 8);
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

/** Home Physiotherapy reason line. Tele-Rehab keeps quickPickCopy. */
export function homeQuickPickCopy({ selectedChipLabel = '', recentTitle = '', hasSourceChip = false, blocks }) {
  const headingDefault = blocks?.quickPicksHeading || 'Quick picks for you';
  if (selectedChipLabel) {
    return {
      heading: `Quick picks for ${selectedChipLabel.toLowerCase()}`,
      reason: String(blocks?.reasonChip || 'Matched to {chip}').replace('{chip}', selectedChipLabel),
    };
  }
  if (recentTitle) {
    return {
      heading: headingDefault,
      reason: String(blocks?.reasonViewed || 'Because you viewed {item}').replace('{item}', recentTitle),
    };
  }
  if (hasSourceChip) {
    return {
      heading: headingDefault,
      reason: blocks?.reasonSearch || 'Based on what you searched for',
    };
  }
  return {
    heading: headingDefault,
    reason: blocks?.reasonNew || 'Most booked this week near you',
  };
}

export function sourceChipFromVisit(chips, searchParams) {
  const chip = searchParams.get('chip') || '';
  if (chip && (chips || []).some((row) => row.key === chip)) return chip;
  const utm = `${searchParams.get('utm_term') || ''} ${searchParams.get('utm_campaign') || ''}`.toLowerCase();
  if (!utm.trim()) return '';
  const match = (chips || []).find((row) =>
    String(row.keywords || '')
      .toLowerCase()
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .some((keyword) => utm.includes(keyword))
  );
  return match?.key || '';
}

const BLOCKED_BOOKING_SCHEME = /^(javascript|data|vbscript|file|blob|about):/i;

/** Home visit booking path used when a service has no internal booking link of its own. */
export const HOME_VISIT_BOOK_TEMPLATE =
  '/book?type=home_visit&mode=home-visit&service={slug}&pain_type={pain}&package={package}';

const HOME_CHOICE_LABELS = {
  book: 'Book Video Session',
  whatsapp: 'Book via WhatsApp',
  call: 'Call us',
};

export function isWhatsappBookingUrl(href) {
  const value = String(href || '').trim();
  if (!value) return false;
  try {
    const host = new URL(value, 'https://placeholder.local').hostname.replace(/^www\./, '').toLowerCase();
    return host === 'wa.me' || host === 'api.whatsapp.com' || host === 'whatsapp.com' || host.endsWith('.whatsapp.com');
  } catch {
    return false;
  }
}

export function bookingChoiceSummary(item) {
  const title = item?.title || '';
  const price = item?.price?.display;
  if (price == null || price === '') return title;
  return `${title} · from ${formatInr(price)}`;
}

function dialablePhone(value) {
  const digits = String(value || '').replace(/[^\d+]/g, '');
  return /^\+?[0-9]{8,15}$/.test(digits) ? digits : '';
}

/**
 * The three “How would you like to book?” choices for one Home Physiotherapy service.
 * Page booking options win when they are set. A card’s own non-WhatsApp booking URL
 * still opens Book Video Session. Missing or invalid values fall back to the
 * home-visit flow, the card’s WhatsApp link, and the clinic phone.
 */
export function buildHomeBookingChoices(item, config = {}) {
  const extra = config.extra || {};
  const overrides = item?.optionOverrides && typeof item.optionOverrides === 'object' ? item.optionOverrides : {};
  const configured = Array.isArray(config.options) ? config.options : [];
  const byKey = {};
  configured.forEach((option) => {
    if (option?.key) byKey[option.key] = option;
  });
  const direct = resolveServiceBookingUrl(item, extra, {
    origin: config.origin || '',
    base: config.base || '/',
  });
  const directIsWhatsapp = isWhatsappBookingUrl(direct);
  const ctx = bookingContext(item, extra);

  function merged(key, fallback) {
    const option = byKey[key] || {};
    const override = overrides[key] || {};
    const configuredRow = Boolean(option.key);
    const visible = override.isVisible === false ? false : (configuredRow ? option.isVisible !== false : true);
    return {
      key,
      label: String(option.label || '').trim() || HOME_CHOICE_LABELS[key] || fallback.label || '',
      hrefTemplate: override.href || option.hrefTemplate || fallback.hrefTemplate || '',
      whatsappNumber: override.whatsappNumber || option.whatsappNumber || config.defaultWhatsapp || config.contactWhatsapp || '',
      whatsappMessage: override.whatsappMessage || option.whatsappMessage || fallback.whatsappMessage || '',
      phone: override.phone || option.phone || config.supportPhone || config.contactPhone || '',
      isVisible: visible,
      sortOrder: Number.isFinite(Number(option.sortOrder)) && configuredRow ? Number(option.sortOrder) : fallback.sortOrder,
    };
  }

  const book = merged('book', { hrefTemplate: HOME_VISIT_BOOK_TEMPLATE, sortOrder: 0 });
  const whatsapp = merged('whatsapp', {
    whatsappMessage: 'Hi, I want to book {service} at home.',
    sortOrder: 1,
  });
  const call = merged('call', { sortOrder: 2 });

  function safeBookTemplate(value) {
    const template = String(value || '').trim();
    if (!template || !isSafeBookingUrl(template) || isWhatsappBookingUrl(template)) return '';
    const filled = fillBookingTemplate(template, ctx);
    return isSafeBookingUrl(filled) && !isWhatsappBookingUrl(filled) ? filled : '';
  }

  function bookHref() {
    const overrideHref = safeBookTemplate(overrides.book?.href);
    if (overrideHref) return overrideHref;
    if (direct && !directIsWhatsapp) return direct;
    return safeBookTemplate(book.hrefTemplate) || fillBookingTemplate(HOME_VISIT_BOOK_TEMPLATE, ctx);
  }

  function whatsappMessage() {
    return String(whatsapp.whatsappMessage || 'Hi, I want to book {service} at home.').replace(
      /\{(service|slug|section|chip|price|package|pay|treatment|pain|plan)\}/g,
      (_, key) => ctx[key] ?? ''
    );
  }

  function whatsappFromNumber(value) {
    const number = dialablePhone(value);
    return number ? whatsappChatUrl(number, whatsappMessage()) || '' : '';
  }

  function whatsappHref() {
    const templates = [overrides.whatsapp?.href, byKey.whatsapp?.hrefTemplate];
    for (const template of templates) {
      const filled = String(template || '').trim() ? fillBookingTemplate(String(template).trim(), ctx) : '';
      if (filled && isSafeBookingUrl(filled) && isWhatsappBookingUrl(filled)) return filled;
    }
    const configuredNumber = whatsappFromNumber(overrides.whatsapp?.whatsappNumber || byKey.whatsapp?.whatsappNumber);
    if (configuredNumber) return configuredNumber;
    if (directIsWhatsapp) return direct;
    return whatsappFromNumber(config.defaultWhatsapp) || whatsappFromNumber(config.contactWhatsapp);
  }

  function callHref() {
    const candidates = [overrides.call?.phone, byKey.call?.phone, config.supportPhone, config.contactPhone];
    for (const candidate of candidates) {
      const phone = dialablePhone(candidate);
      if (phone) return `tel:${phone}`;
    }
    return '';
  }

  const standard = [
    { ...book, href: bookHref(), openInNewTab: false },
    { ...whatsapp, href: whatsappHref(), openInNewTab: true },
    { ...call, href: callHref(), openInNewTab: false },
  ];
  const extras = configured
    .filter((option) => option?.key && !HOME_CHOICE_LABELS[option.key])
    .map((option) => ({
      ...option,
      href: fillBookingTemplate(option.hrefTemplate, ctx),
      openInNewTab: Boolean(option.openInNewTab),
      isVisible: option.isVisible !== false,
      sortOrder: Number(option.sortOrder) || 10,
    }))
    .filter((option) => option.href && isSafeBookingUrl(option.href));

  return [...standard, ...extras]
    .filter((choice) => choice.isVisible && choice.href)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Site-relative paths and http(s) URLs. Rejects scriptable and protocol-relative links. */
export function isSafeBookingUrl(value) {
  const href = String(value || '').trim();
  if (!href || href.length > 500) return false;
  if (/[\u0000-\u001F\u007F]/.test(href) || /\s/.test(href)) return false;
  if (href.includes('\\') || href.startsWith('//')) return false;
  if (BLOCKED_BOOKING_SCHEME.test(href)) return false;
  if (href.startsWith('/')) return true;
  let url;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function bookingUrlError(value) {
  const href = String(value || '').trim();
  if (!href) return '';
  if (href.length > 500) return 'Booking URL must be 500 characters or fewer';
  if (!isSafeBookingUrl(href)) return 'Use a site path starting with / or an http(s) URL';
  return '';
}

function stripAppBase(path, base) {
  const hashAt = path.indexOf('#');
  const hash = hashAt === -1 ? '' : path.slice(hashAt);
  const withoutHash = hashAt === -1 ? path : path.slice(0, hashAt);
  const queryAt = withoutHash.indexOf('?');
  const pathname = queryAt === -1 ? withoutHash : withoutHash.slice(0, queryAt);
  const search = queryAt === -1 ? '' : withoutHash.slice(queryAt);
  const normalizedBase = String(base || '').replace(/\/+$/, '');
  let next = pathname;
  if (normalizedBase && normalizedBase !== '/' && (pathname === normalizedBase || pathname.startsWith(`${normalizedBase}/`))) {
    next = pathname.slice(normalizedBase.length) || '/';
    if (!next.startsWith('/')) next = `/${next}`;
  }
  return `${next}${search}${hash}`;
}

function enrichInternalBookingPath(path, item, extra) {
  const hashAt = path.indexOf('#');
  const hash = hashAt === -1 ? '' : path.slice(hashAt);
  const withoutHash = hashAt === -1 ? path : path.slice(0, hashAt);
  const queryAt = withoutHash.indexOf('?');
  const pathname = queryAt === -1 ? withoutHash : withoutHash.slice(0, queryAt);
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized !== '/book' && !normalized.endsWith('/book')) return path;
  const params = new URLSearchParams(queryAt === -1 ? '' : withoutHash.slice(queryAt + 1));
  if (!params.get('service') && item?.slug) params.set('service', item.slug);
  const pain = extra.pain || item?.bookingPainType || '';
  if (!params.get('pain_type') && pain) params.set('pain_type', pain);
  if (!params.get('type')) params.set('type', item?.deliveryMode === 'online' ? 'online' : 'home_visit');
  if (!params.get('mode')) params.set('mode', item?.deliveryMode === 'online' ? 'telephysio' : 'home-visit');
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

/**
 * Resolved destination for a service's own booking URL.
 * Empty when the service should use the page's default booking options.
 */
export function resolveServiceBookingUrl(item, extra = {}, options = {}) {
  const raw = String(item?.bookingUrl || '').trim();
  if (!raw || !isSafeBookingUrl(raw)) return '';
  const filled = fillBookingTemplate(raw, bookingContext(item, extra));
  if (!isSafeBookingUrl(filled)) return '';
  const origin = options.origin || '';
  let kind = 'external';
  let path = filled;
  if (filled.startsWith('/')) {
    kind = 'internal';
  } else if (origin) {
    try {
      const url = new URL(filled);
      if (url.origin === new URL(origin).origin) {
        kind = 'internal';
        path = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return '';
    }
  }
  if (kind === 'internal') {
    return enrichInternalBookingPath(stripAppBase(path, options.base || ''), item, extra);
  }
  return filled;
}

export function bookingDestinationNote(href) {
  const value = String(href || '');
  if (!value) return '';
  if (value.startsWith('/')) return 'Continues to booking on The Urban Physio';
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return host ? `Opens ${host}` : '';
  } catch {
    return '';
  }
}

export function fillBookingTemplate(template, ctx) {
  const url = String(template || '').replace(
    /\{(service|slug|section|chip|price|package|pay|treatment|pain|plan)\}/g,
    (_, key) => encodeURIComponent(ctx[key] ?? '')
  );
  const splitAt = url.indexOf('?');
  if (splitAt === -1) return url;
  const params = new URLSearchParams(url.slice(splitAt + 1));
  for (const [key, value] of [...params.entries()]) {
    if (!value) params.delete(key);
  }
  const query = params.toString();
  return query ? `${url.slice(0, splitAt)}?${query}` : url.slice(0, splitAt);
}

export function slotInsideLead(dateIso, timeValue, leadMinutes = CATALOGUE_LEAD_MINUTES, now = new Date()) {
  if (!dateIso || !timeValue) return false;
  const stamp = Date.parse(`${dateIso}T${String(timeValue).slice(0, 5)}:00+05:30`);
  if (Number.isNaN(stamp)) return false;
  return stamp < now.getTime() + leadMinutes * 60 * 1000;
}

export function filterBookableSlots(slots, dateIso, active, now = new Date()) {
  if (!active) return slots || [];
  return (slots || []).filter((slot) => !slotInsideLead(dateIso, slot.time || slot.value, CATALOGUE_LEAD_MINUTES, now));
}

export function subtitleForPick(item) {
  const parts = [];
  if (item.price?.display != null) parts.push(formatInr(item.price.display));
  if (item.durationLabel) parts.push(item.durationLabel);
  if (item.rating != null && item.rating !== '') parts.push(`★ ${Number(item.rating).toFixed(1)}`);
  return parts.join(' · ');
}

export function bookingContext(item, extra = {}) {
  const price = item?.price?.display;
  return {
    service: item?.title || '',
    slug: item?.slug || '',
    plan: item?.type === 'plan' ? item.slug : '',
    section: item?.sectionSlug || '',
    chip: extra.chip || item?.primaryChipKey || '',
    price: price == null ? '' : String(price),
    package: extra.package || '',
    pay: extra.pay || (item?.type === 'plan' ? 'full' : ''),
    treatment: item?.treatmentSlug || '',
    pain: extra.pain || item?.bookingPainType || '',
  };
}
