const PATTERNS = {
  light: 8,
  medium: [10, 30, 10],
  heavy: [20, 40, 20],
  success: [12, 40, 12],
  open: [6, 20],
  close: [12],
};

export function haptic(type = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    const pattern = PATTERNS[type] ?? PATTERNS.light;
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

export function hapticTap() {
  haptic('light');
}

export function hapticOpen() {
  haptic('open');
}

export function hapticClose() {
  haptic('close');
}
