/** Gesture decisions for the service detail drawers. Pure so the thresholds stay testable. */

export function sheetGestureMode({ dy, dx, scrollTop, fromChrome }) {
  if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return 'undecided';
  if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return 'ignore';
  if (!fromChrome && scrollTop > 1) return 'ignore';
  return 'pull';
}

export function sheetPullShouldClose({ dy, velocity }) {
  if (dy > 108) return true;
  if (dy > 42 && velocity > 0.65) return true;
  return false;
}
