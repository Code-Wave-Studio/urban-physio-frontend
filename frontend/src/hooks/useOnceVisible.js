import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Calls `onVisible` the first time the element is meaningfully on screen.
 * Returns a callback ref, so it also works for sections that mount after content has loaded.
 * Used for "view" analytics events (service_view / plan_view) where there is no click.
 *
 * @param {() => void} onVisible
 * @param {number} [threshold]
 */
export default function useOnceVisible(onVisible, threshold = 0.35) {
  const [el, setEl] = useState(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;

  useEffect(() => {
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          cb.current();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, threshold]);

  return useCallback((node) => setEl(node), []);
}
