/**
 * timeFormat.js
 * Shared 12-hour AM/PM time formatting utilities used across all calendar views.
 * Input accepts "HH:MM" or "HH:MM:SS" 24-hour strings.
 */

/**
 * Convert "HH:MM" or "HH:MM:SS" to "h:MM AM/PM"
 * Examples: "09:00" → "9:00 AM", "13:30" → "1:30 PM", "00:00" → "12:00 AM"
 * Returns null if input is invalid.
 */
export function to12Hour(time) {
  if (!time) return null;
  const str = String(time).slice(0, 5); // "HH:MM"
  const [hStr, mStr] = str.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const min    = String(m).padStart(2, '0');
  return `${hour12}:${min} ${period}`;
}

/**
 * Format a time range: "HH:MM" – "HH:MM"  →  "h:MM AM – h:MM PM"
 * If start and end share the same period (AM/AM or PM/PM) we abbreviate
 * the first period only when the range is compact.
 */
export function toTimeRange(start, end) {
  const s = to12Hour(start);
  const e = to12Hour(end);
  if (!s && !e) return 'All day';
  if (!e) return s;
  if (!s) return e;
  return `${s} – ${e}`;
}

/**
 * Returns a short label for the time, e.g. "9:00 AM"
 * Falls back to the raw string if parsing fails.
 */
export function fmtTime(time) {
  return to12Hour(time) ?? String(time ?? '—');
}
