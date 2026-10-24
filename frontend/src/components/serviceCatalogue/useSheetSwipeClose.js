import { useEffect, useRef } from 'react';
import { sheetGestureMode, sheetPullShouldClose } from './sheetSwipe.js';

const MOBILE_QUERY = '(max-width: 767px)';
const EASE = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [contenteditable="true"]';

/**
 * Mobile swipe-down to close. Pulls only when the gesture starts on the
 * sheet chrome, or on the body while that scroller is already at the top.
 * Scrolling the content and tapping buttons are left alone.
 */
export function useSheetSwipeClose(panelRef, { enabled = true, onClose, scrollSelector = '' } = {}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return undefined;
    const panel = panelRef?.current;
    if (!panel) return undefined;

    const media = window.matchMedia(MOBILE_QUERY);
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastDy = 0;
    let mode = 'undecided';
    let fromChrome = false;
    let closing = false;
    let settleTimer = 0;
    let settleHandler = null;

    const scroller = () => (scrollSelector ? panel.querySelector(scrollSelector) : panel);

    const cancelSettle = () => {
      window.clearTimeout(settleTimer);
      if (settleHandler) {
        panel.removeEventListener('transitionend', settleHandler);
        settleHandler = null;
      }
    };

    const finishClose = () => {
      if (closing) return;
      closing = true;
      cancelSettle();
      panel.classList.remove('is-pulling');
      panel.style.transition = '';
      panel.style.transform = '';
      onCloseRef.current?.();
    };

    const snapBack = () => {
      panel.classList.remove('is-pulling');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        panel.style.transition = '';
        panel.style.transform = '';
        return;
      }
      panel.style.transition = EASE;
      panel.style.transform = 'translate3d(0, 0, 0)';
      settleHandler = (event) => {
        if (event.propertyName && event.propertyName !== 'transform') return;
        cancelSettle();
        panel.style.transition = '';
        panel.style.transform = '';
      };
      panel.addEventListener('transitionend', settleHandler);
      settleTimer = window.setTimeout(() => settleHandler?.({ propertyName: 'transform' }), 360);
    };

    const onDown = (event) => {
      if (!media.matches || closing || pointerId != null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(INTERACTIVE)) return;
      const scrollEl = scroller();
      fromChrome = Boolean(target.closest('[data-sheet-chrome]'));
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
      if (!fromChrome && scrollTop > 1) return;
      cancelSettle();
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startTime = event.timeStamp;
      lastDy = 0;
      mode = 'undecided';
    };

    const onMove = (event) => {
      if (event.pointerId !== pointerId || mode === 'ignore' || closing) return;
      const dy = event.clientY - startY;
      const dx = event.clientX - startX;
      lastDy = dy;
      if (mode === 'undecided') {
        const scrollEl = scroller();
        const next = sheetGestureMode({
          dy,
          dx,
          scrollTop: scrollEl ? scrollEl.scrollTop : 0,
          fromChrome,
        });
        if (next === 'undecided') return;
        mode = next;
        if (mode !== 'pull') return;
        panel.classList.add('is-settled', 'is-pulling');
        panel.style.transition = 'none';
        try {
          panel.setPointerCapture(event.pointerId);
        } catch {
          /* The pointer can already be gone. */
        }
      }
      if (mode !== 'pull') return;
      if (event.cancelable) event.preventDefault();
      panel.style.transform = `translate3d(0, ${Math.max(0, dy)}px, 0)`;
    };

    const onUp = (event) => {
      if (event.pointerId !== pointerId) return;
      const dy = Number.isFinite(event.clientY) ? event.clientY - startY : lastDy;
      const elapsed = Math.max((event.timeStamp || startTime) - startTime, 1);
      const wasPull = mode === 'pull';
      pointerId = null;
      mode = 'undecided';
      if (!wasPull || closing) return;
      try {
        panel.releasePointerCapture(event.pointerId);
      } catch {
        /* Capture was not taken. */
      }
      if (sheetPullShouldClose({ dy, velocity: dy / elapsed })) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          finishClose();
          return;
        }
        panel.classList.remove('is-pulling');
        panel.style.transition = EASE;
        panel.style.transform = 'translate3d(0, 110%, 0)';
        settleHandler = (transitionEvent) => {
          if (transitionEvent.propertyName && transitionEvent.propertyName !== 'transform') return;
          finishClose();
        };
        panel.addEventListener('transitionend', settleHandler);
        settleTimer = window.setTimeout(finishClose, 360);
        return;
      }
      snapBack();
    };

    panel.addEventListener('pointerdown', onDown);
    panel.addEventListener('pointermove', onMove, { passive: false });
    panel.addEventListener('pointerup', onUp);
    panel.addEventListener('pointercancel', onUp);
    return () => {
      closing = true;
      cancelSettle();
      panel.removeEventListener('pointerdown', onDown);
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerup', onUp);
      panel.removeEventListener('pointercancel', onUp);
      panel.classList.remove('is-pulling');
      panel.style.transition = '';
      panel.style.transform = '';
    };
  }, [enabled, panelRef, scrollSelector]);
}
