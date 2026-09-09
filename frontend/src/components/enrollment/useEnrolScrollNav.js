import { useEffect, useRef } from 'react';

const WHEEL_MIN_DELTA = 10;
const TOUCH_MIN_DELTA = 42;
const TOUCH_DOMINANCE = 1.15;
const WHEEL_GESTURE_IDLE_MS = 140;

/**
 * Temporary scroll capture for the enrollment pathway:
 * one wheel / swipe / key gesture → one step, then release at either boundary.
 * Does not set document overflow:hidden — only preventDefault while mid-journey.
 */
export default function useEnrolScrollNav({
  sectionRef,
  count,
  active,
  setActive,
  reduceMotion = false,
}) {
  const activeRef = useRef(active);
  const armedRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const wheelGestureRef = useRef(false);
  const wheelIdleTimerRef = useRef(0);
  const touchStartRef = useRef(null);
  const touchConsumedRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || count < 2) return undefined;

    const cooldownMs = reduceMotion ? 260 : 480;

    const isArmed = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (visible <= 0) return false;
      const ratio = visible / Math.min(rect.height, vh);
      const mid = rect.top < vh * 0.62 && rect.bottom > vh * 0.28;
      return ratio >= 0.28 && mid;
    };

    const softAlign = () => {
      const rect = section.getBoundingClientRect();
      const headerRaw = getComputedStyle(document.documentElement).getPropertyValue('--site-header-height');
      const header = Number.parseFloat(headerRaw) || 56;
      const idealTop = header + 12;
      if (rect.top >= idealTop - 24 && rect.top <= idealTop + 140) return;
      const top = window.scrollY + rect.top - idealTop;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    const tryStep = (dir) => {
      const idx = activeRef.current;
      const next = idx + dir;
      if (next < 0 || next >= count) return 'boundary';
      const now = performance.now();
      if (now < cooldownUntilRef.current) return 'cooldown';
      cooldownUntilRef.current = now + cooldownMs;
      setActive(next);
      softAlign();
      return 'moved';
    };

    const syncArmed = () => {
      armedRef.current = isArmed();
    };

    const onWheel = (event) => {
      if (event.ctrlKey) return;
      syncArmed();
      if (!armedRef.current) return;

      const delta = event.deltaY;
      if (Math.abs(delta) < WHEEL_MIN_DELTA) return;

      const dir = delta > 0 ? 1 : -1;
      const idx = activeRef.current;
      const exiting = (dir > 0 && idx >= count - 1) || (dir < 0 && idx <= 0);

      // Boundary exit: do not trap — resume normal page scrolling immediately.
      if (exiting) {
        wheelGestureRef.current = false;
        if (wheelIdleTimerRef.current) window.clearTimeout(wheelIdleTimerRef.current);
        return;
      }

      // Mid-journey: block page scroll for the whole gesture (including cooldown ticks).
      event.preventDefault();

      window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        wheelGestureRef.current = false;
      }, WHEEL_GESTURE_IDLE_MS);

      if (wheelGestureRef.current) return;

      const result = tryStep(dir);
      if (result === 'moved') {
        wheelGestureRef.current = true;
      }
    };

    const onTouchStart = (event) => {
      if (event.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }
      syncArmed();
      touchConsumedRef.current = false;
      const t = event.touches[0];
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        armed: armedRef.current,
      };
    };

    const onTouchMove = (event) => {
      const start = touchStartRef.current;
      if (!start || !start.armed || event.touches.length !== 1) return;

      if (touchConsumedRef.current) {
        // Keep the page from sliding away mid-gesture after we already took a step.
        event.preventDefault();
        return;
      }

      const t = event.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      // Ambiguous / tiny gestures pass through so users are never trapped.
      if (Math.abs(dy) < TOUCH_MIN_DELTA) return;
      if (Math.abs(dy) < Math.abs(dx) * TOUCH_DOMINANCE) return;

      syncArmed();
      if (!armedRef.current) return;

      const dir = dy < 0 ? 1 : -1; // swipe up → next
      const idx = activeRef.current;
      const exiting = (dir > 0 && idx >= count - 1) || (dir < 0 && idx <= 0);
      if (exiting) {
        touchStartRef.current = null;
        return;
      }

      const result = tryStep(dir);
      if (result === 'moved') {
        event.preventDefault();
        touchConsumedRef.current = true;
      } else if (result === 'cooldown') {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
      touchConsumedRef.current = false;
    };

    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) {
        return;
      }
      syncArmed();
      if (!armedRef.current) return;

      let dir = 0;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') dir = 1;
      else if (event.key === 'ArrowUp' || event.key === 'PageUp') dir = -1;
      else return;

      const idx = activeRef.current;
      const exiting = (dir > 0 && idx >= count - 1) || (dir < 0 && idx <= 0);
      if (exiting) return;

      event.preventDefault();
      tryStep(dir);
    };

    const onScroll = () => {
      syncArmed();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    syncArmed();

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      if (wheelIdleTimerRef.current) window.clearTimeout(wheelIdleTimerRef.current);
    };
  }, [sectionRef, count, setActive, reduceMotion]);
}
