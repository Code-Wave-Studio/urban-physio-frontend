/**
 * Canonical live API origin (Hostinger custom domain).
 * Frontend (Cloudflare Pages) must never call the retired mediumorchid host.
 */
export const LIVE_API_ORIGIN = 'https://api.theurbanphysio.com';
export const LIVE_API_BASE = `${LIVE_API_ORIGIN}/backend/api`;

const LEGACY_HOST = 'mediumorchid-monkey-387815.hostingersite.com';

/**
 * Rewrite retired API hosts to https://api.theurbanphysio.com
 * @param {string} url
 * @returns {string}
 */
export function rewriteLegacyApiUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url
    .replace(/https?:\/\/([a-z0-9-]+\.)?hostingersite\.com/gi, LIVE_API_ORIGIN)
    .replace(/\/$/, '');
}

/**
 * True if URL still points at the retired Hostinger hostname.
 */
export function isLegacyApiUrl(url) {
  return typeof url === 'string' && url.toLowerCase().includes(LEGACY_HOST);
}

/**
 * Resolve axios baseURL for The Urban Physio API.
 * - Rewrites any baked-in / env VITE_API_URL that still uses mediumorchid
 * - On theurbanphysio.com / Pages production builds, always use LIVE_API_BASE
 */
export function resolveApiBase() {
  const envRaw = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : '';
  const envUrl = envRaw ? rewriteLegacyApiUrl(envRaw) : '';

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (
      host === 'theurbanphysio.com' ||
      host === 'www.theurbanphysio.com' ||
      host.endsWith('.pages.dev')
    ) {
      // Prefer corrected env if it already points at api.theurbanphysio.com
      if (envUrl && envUrl.startsWith(LIVE_API_ORIGIN)) {
        return envUrl;
      }
      return LIVE_API_BASE;
    }
  }

  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    if (isLegacyApiUrl(envUrl)) return LIVE_API_BASE;
    return envUrl;
  }

  const path =
    envUrl ||
    `${import.meta.env.BASE_URL || '/'}backend/api`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${apiPath}`;
  }
  return `http://localhost${apiPath}`;
}
