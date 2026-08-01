/**
 * Resolve avatar / upload URLs for dev (Vite) and production.
 * Rewrites legacy Hostinger absolute URLs to the current API subdomain.
 */
import { rewriteLegacyApiUrl } from '../constants/apiOrigin';

export function resolveMediaUrl(url) {
  if (!url) return null;
  const original = String(url).trim();
  if (!original) return null;

  // Don't strip trailing slash from media paths — only rewrite host
  let resolved = original.replace(
    /https?:\/\/mediumorchid-monkey-387815\.hostingersite\.com/gi,
    'https://api.theurbanphysio.com'
  );

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved;
  }
  if (resolved.startsWith('/')) {
    return `${window.location.origin}${resolved}`;
  }
  return resolved;
}
