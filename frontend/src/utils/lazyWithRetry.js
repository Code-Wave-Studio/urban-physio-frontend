import { lazy } from 'react';

const RELOAD_FLAG = 'tup_chunk_reload';

/** True when a dynamic import failed because the hashed chunk no longer exists (new deployment) or the network dropped. */
export function isChunkLoadError(err) {
  const msg = String((err && (err.message || err)) || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|ChunkLoadError/i.test(msg);
}

/**
 * React.lazy with one automatic recovery: a visitor holding an old index.html after a deployment would otherwise
 * hit a 404 for the previous chunk hash and see a blank page. Reload once to pick up the new build; if it still
 * fails, surface the error to the error boundary instead of looping.
 */
export default function lazyWithRetry(factory) {
  return lazy(() =>
    factory()
      .then((mod) => {
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          /* storage unavailable */
        }
        return mod;
      })
      .catch((err) => {
        let alreadyReloaded = true;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
          if (!alreadyReloaded && isChunkLoadError(err)) sessionStorage.setItem(RELOAD_FLAG, '1');
        } catch {
          /* storage unavailable: do not risk a reload loop */
        }
        if (!alreadyReloaded && isChunkLoadError(err) && typeof window !== 'undefined') {
          window.location.reload();
          return new Promise(() => {}); // keep Suspense pending while the page reloads
        }
        throw err;
      })
  );
}
