import { useEffect } from 'react';
import { hapticTap } from '../utils/haptics';

/** Light vibration on primary taps — buttons, links, modal triggers. */
export default function HapticsRoot() {
  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && !e.buttons) return;
      const el = e.target.closest?.('button, a[href], [role="button"], [data-haptic]');
      if (!el || el.dataset.noHaptic === 'true' || el.disabled) return;
      hapticTap();
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);
  return null;
}
