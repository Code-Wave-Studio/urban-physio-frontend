/**
 * Central GA4 / GTM event layer (Phase 11).
 *
 * Rules enforced here so individual call sites cannot get them wrong:
 *  - ONE delivery channel: gtag('event', ...). gtag.js (index.html) delivers to GA4 and pushes the same
 *    command onto dataLayer for GTM, so there is no separate dataLayer.push that could double-count.
 *  - Only allow-listed parameters are sent; anything that looks like personal / health data is dropped.
 *  - Page locations never include query strings, hashes, tokens or record ids.
 *  - Identical events fired in quick succession (double click, React StrictMode) are sent once, and
 *    "view" style events can be limited to once per key per session.
 *  - Consent is handled by Google Consent Mode v2 (default denied in index.html, updated from the cookie
 *    banner choice via syncAnalyticsConsent); this module never bypasses it.
 *
 * The pure helpers at the top have no browser dependencies so they can be unit tested with `node --test`.
 */

export const ANALYTICS_EVENTS = Object.freeze({
  PAGE_VIEW: 'page_view',
  CHIP_SELECT: 'chip_select',
  QUICK_PICK: 'quick_pick_click',
  SERVICE_VIEW: 'service_view',
  PLAN_VIEW: 'plan_view',
  CTA_CLICK: 'cta_click',
  BOOKING_START: 'booking_start',
  BOOKING_COMPLETE: 'booking_complete',
  OFFER_SUBMIT: 'offer_submit',
  AI_SESSION_START: 'ai_session_start',
  AI_SESSION_COMPLETE: 'ai_session_complete',
});

const KNOWN_EVENTS = new Set(Object.values(ANALYTICS_EVENTS));

/** Parameters that may ever be sent. Everything else is discarded. */
export const ALLOWED_PARAMS = Object.freeze([
  'page_location',
  'page_path',
  'page_title',
  'content_group',
  'item_id',
  'item_name',
  'item_category',
  'item_variant',
  'service_type',
  'plan_id',
  'plan_name',
  'chip_id',
  'chip_label',
  'section',
  'cta_id',
  'cta_label',
  'cta_location',
  'destination',
  'step',
  'booking_type',
  'payment_required',
  'source',
  'feature',
  'campaign',
  'outcome',
]);
const ALLOWED = new Set(ALLOWED_PARAMS);

/** Keys that are never allowed even if someone adds them to the allow-list by mistake. */
const FORBIDDEN_KEY = /(e-?mail|phone|mobile|tel\b|first_?name|last_?name|full_?name|patient|user_?id|address|dob|birth|gender|age\b|token|password|otp|secret|note|message|symptom|diagnos|description|prescription|pain_?desc|reason|comment|reps?\b|score|angle|metric)/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\s-]?){10,}/;
const JWT_RE = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\./;
const LONG_TOKEN_RE = /^[A-Za-z0-9_-]{32,}$/;

const MAX_VALUE_LEN = 100;

function cleanString(value) {
  const s = String(value).replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (EMAIL_RE.test(s) || PHONE_RE.test(s) || JWT_RE.test(s) || LONG_TOKEN_RE.test(s)) return null;
  return s.length > MAX_VALUE_LEN ? s.slice(0, MAX_VALUE_LEN) : s;
}

/**
 * Reduce a params object to the safe, allow-listed subset.
 * @returns {Record<string, string|number|boolean>}
 */
export function sanitizeParams(params) {
  const out = {};
  if (!params || typeof params !== 'object') return out;
  for (const [key, raw] of Object.entries(params)) {
    if (!ALLOWED.has(key) || FORBIDDEN_KEY.test(key)) continue;
    if (raw === null || raw === undefined) continue;
    if (typeof raw === 'boolean') {
      out[key] = raw;
    } else if (typeof raw === 'number') {
      if (Number.isFinite(raw)) out[key] = raw;
    } else if (typeof raw === 'string') {
      const s = cleanString(raw);
      if (s !== null) out[key] = s;
    }
    // objects / arrays / functions are dropped on purpose
  }
  return out;
}

/** Areas where record ids may appear in the path (numeric / long ids are masked). */
const PRIVATE_AREAS = ['admin', 'patient', 'doctor', 'clinic-portal', 'clinic-manage'];
/** Areas whose page titles may contain personal names (titles are not sent for these). */
const PRIVATE_TITLE_AREAS = ['admin', 'patient', 'clinic-portal', 'clinic-manage', 'pay', 'c'];

/** True for signed-in / tokenised areas whose page titles may contain personal names. */
export function isPrivatePath(pathname) {
  const segs = String(pathname || '/').split('#')[0].split('?')[0].split('/');
  const first = segs[1] || '';
  return PRIVATE_TITLE_AREAS.includes(first) || (first === 'book' && segs.length > 2);
}

/**
 * Path that is safe to send: no query string, no hash, no secret tokens, no record ids.
 * @param {string} pathname
 */
export function sanitizePath(pathname) {
  let path = String(pathname || '/').split('#')[0].split('?')[0] || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  const segs = path.split('/');
  const first = segs[1] || '';
  // Secret-bearing link routes: keep the route shape, drop the secret.
  if (['pay', 'c'].includes(first) && segs.length > 2) {
    return `/${first}/:token`;
  }
  const isPrivateArea = PRIVATE_AREAS.includes(first);
  const cleaned = segs.map((seg, i) => {
    if (i === 0) return seg;
    if (/^\d+$/.test(seg)) return ':id';
    if (isPrivateArea && /^[A-Za-z0-9_-]{20,}$/.test(seg)) return ':id';
    return seg;
  });
  return cleaned.join('/') || '/';
}

/**
 * What kind of place a link goes to, without ever exposing the raw value.
 * tel:/mailto:/WhatsApp links would contain a phone number or address, so only the kind is reported.
 * @param {string} href
 */
export function destinationKind(href) {
  const raw = String(href || '').trim();
  if (!raw) return 'none';
  if (/^tel:/i.test(raw)) return 'tel';
  if (/^mailto:/i.test(raw)) return 'mailto';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(raw)) return 'whatsapp';
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname;
    } catch {
      return 'external';
    }
  }
  return sanitizePath(raw);
}

/**
 * Build a decision engine that suppresses repeat events.
 * @param {{ now?: () => number, windowMs?: number, maxKeys?: number }} [opts]
 */
export function createDedupe({ now = () => Date.now(), windowMs = 1000, maxKeys = 500 } = {}) {
  /** @type {Map<string, number>} */
  const seen = new Map();
  const once = new Set();
  return {
    /** @returns {boolean} true when the event should be sent */
    shouldSend(fingerprint, { onceKey = null, ttlMs = windowMs } = {}) {
      const t = now();
      if (onceKey) {
        if (once.has(onceKey)) return false;
        once.add(onceKey);
      }
      const last = seen.get(fingerprint);
      if (last !== undefined && t - last < ttlMs) return false;
      seen.set(fingerprint, t);
      if (seen.size > maxKeys) {
        for (const [k, ts] of seen) {
          if (t - ts > Math.max(ttlMs, windowMs)) seen.delete(k);
        }
      }
      return true;
    },
    reset() {
      seen.clear();
      once.clear();
    },
  };
}

/** Consent Mode v2 payload for a stored cookie-consent object. Ad signals stay denied: the banner has no advertising choice. */
export function consentModeFor(consent) {
  const analytics = consent?.analytics === true;
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  };
}

/**
 * Turn a call into the exact gtag arguments (or null when it must not be sent). Pure: used by tests.
 */
export function buildEvent(name, params, { strict = true } = {}) {
  if (!name || typeof name !== 'string') return null;
  if (strict && !KNOWN_EVENTS.has(name)) return null;
  return { name, params: sanitizeParams(params) };
}

// ----------------------------------------------------------------------------------------------
// Browser glue
// ----------------------------------------------------------------------------------------------

const dedupe = createDedupe();
const sessionOnce = new Set();

function sessionSeen(key) {
  try {
    const store = window.sessionStorage;
    const k = `tup_an_${key}`;
    if (store.getItem(k)) return true;
    store.setItem(k, '1');
    return false;
  } catch {
    if (sessionOnce.has(key)) return true;
    sessionOnce.add(key);
    return false;
  }
}

function send(name, params) {
  if (typeof window === 'undefined') return false;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    // index.html defines gtag; this is only a safety net so early calls are not lost.
    window.gtag = function gtagFallback() {
      window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
    };
  }
  window.gtag('event', name, params);
  return true;
}

/**
 * Send one analytics event.
 * @param {string} name one of ANALYTICS_EVENTS
 * @param {Record<string, unknown>} [params] see ALLOWED_PARAMS
 * @param {{ oncePerSession?: string, dedupeMs?: number }} [opts]
 *   oncePerSession: send at most once per browser session for this key (use for "view" events).
 * @returns {boolean} whether the event was handed to gtag
 */
export function trackEvent(name, params = {}, { oncePerSession = null, dedupeMs = 1000 } = {}) {
  const built = buildEvent(name, params);
  if (!built) return false;
  const fingerprint = `${built.name}|${JSON.stringify(built.params)}`;
  if (!dedupe.shouldSend(fingerprint, { ttlMs: dedupeMs })) return false;
  if (oncePerSession && sessionSeen(`${built.name}:${oncePerSession}`)) return false;
  return send(built.name, built.params);
}

/**
 * cta_click with a stable id. `label` should be CMS/static copy; `href` is reduced to a safe destination kind.
 * @param {{ id: string, label?: unknown, href?: string, location?: string }} cta
 */
export function trackCta({ id, label, href, location }) {
  const here = typeof window !== 'undefined' ? sanitizePath(window.location.pathname) : undefined;
  return trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
    cta_id: id,
    cta_label: typeof label === 'string' ? label : undefined,
    cta_location: location || here,
    destination: destinationKind(href),
  });
}

let lastPageView = { path: null, at: 0 };

/** Manual SPA page_view. Query strings, hashes and record ids are never sent. */
export function trackPageView(pathname, title) {
  if (typeof window === 'undefined') return false;
  const path = sanitizePath(pathname);
  const t = Date.now();
  if (lastPageView.path === path && t - lastPageView.at < 1500) return false;
  lastPageView = { path, at: t };
  const built = buildEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: isPrivatePath(pathname) ? undefined : title || document.title || undefined,
  });
  return send(built.name, built.params);
}

/** Push the cookie-banner choice into Google Consent Mode. */
export function syncAnalyticsConsent(consent) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', consentModeFor(consent));
}

/** Test helper. */
export function __resetAnalyticsForTests() {
  dedupe.reset();
  sessionOnce.clear();
  lastPageView = { path: null, at: 0 };
}
