import { resolveApiBase, LIVE_API_ORIGIN } from '../constants/apiOrigin';

/**
 * Resolve avatar / upload URLs for dev (Vite), XAMPP local server, and production.
 * Rewrites legacy Hostinger absolute URLs to the current API subdomain.
 */
export function resolveMediaUrl(url) {
  if (!url) return null;
  let original = String(url).trim();
  if (!original) return null;

  // Rewrite any legacy Hostinger domain (e.g. *.hostingersite.com) to https://api.theurbanphysio.com
  let resolved = original.replace(
    /https?:\/\/([a-z0-9-]+\.)?hostingersite\.com/gi,
    LIVE_API_ORIGIN
  );

  if (resolved.startsWith('http://') || resolved.startsWith('https://') || resolved.startsWith('data:')) {
    return resolved;
  }

  // Ensure leading slash
  if (!resolved.startsWith('/')) {
    resolved = '/' + resolved;
  }

  // Handle local XAMPP environment or production API base
  const apiBase = resolveApiBase();
  let rootOrigin = '';
  try {
    const u = new URL(apiBase);
    rootOrigin = u.origin;
  } catch {
    rootOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  }

  // On local XAMPP dev (e.g. localhost)
  if (rootOrigin.includes('localhost') && !resolved.startsWith('/theurbanphysio')) {
    if (resolved.startsWith('/backend/')) {
      return `${rootOrigin}/theurbanphysio${resolved}`;
    }
    if (resolved.startsWith('/uploads/')) {
      return `${rootOrigin}/theurbanphysio/backend${resolved}`;
    }
    return `${rootOrigin}/theurbanphysio${resolved}`;
  }

  return `${rootOrigin}${resolved}`;
}
