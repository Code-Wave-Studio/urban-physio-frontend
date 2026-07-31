/**
 * Resolve avatar / upload URLs for dev (Vite) and production.
 * Rewrites legacy Hostinger absolute URLs to the current API subdomain.
 */
const LEGACY_API_ORIGINS = [
  'https://mediumorchid-monkey-387815.hostingersite.com',
  'http://mediumorchid-monkey-387815.hostingersite.com',
];

const LIVE_API_ORIGIN = 'https://api.theurbanphysio.com';

export function resolveMediaUrl(url) {
  if (!url) return null;
  let resolved = String(url).trim();
  if (!resolved) return null;

  for (const legacy of LEGACY_API_ORIGINS) {
    if (resolved.startsWith(legacy)) {
      resolved = LIVE_API_ORIGIN + resolved.slice(legacy.length);
      break;
    }
  }

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved;
  }
  if (resolved.startsWith('/')) {
    return `${window.location.origin}${resolved}`;
  }
  return resolved;
}
