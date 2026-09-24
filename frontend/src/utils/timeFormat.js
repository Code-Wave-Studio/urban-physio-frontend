/** Convert "HH:MM" / "HH:MM:SS" → "h:MM AM/PM". Returns null if invalid. */
export function to12Hour(time) {
  if (!time) return null;
  const str = String(time).slice(0, 5);
  const [hStr, mStr] = str.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const min = String(m).padStart(2, '0');
  return `${hour12}:${min} ${period}`;
}

/** Format a start–end time range (or "All day"). */
export function toTimeRange(start, end) {
  const s = to12Hour(start);
  const e = to12Hour(end);
  if (!s && !e) return 'All day';
  if (!e) return s;
  if (!s) return e;
  return `${s} – ${e}`;
}

export function fmtTime(time) {
  return to12Hour(time) ?? String(time ?? '—');
}
