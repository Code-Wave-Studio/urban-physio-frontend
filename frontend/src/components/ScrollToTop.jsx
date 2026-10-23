import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Move to the top only when the route path changes.
 * Query updates (filter chips, selected service, tabs) keep the current position.
 * A hash still moves to that section instead of the top of the page.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''));
      const el = id ? document.getElementById(id) : null;
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
      return undefined;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);

  return null;
}
