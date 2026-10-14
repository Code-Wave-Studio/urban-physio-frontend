/**
 * KinesteX session instants are stored as UTC wall-clock DATETIME strings
 * (no zone). Convert to the viewer timezone only when formatting.
 * Duration stays a separate seconds count and is not derived here.
 */

export function parseStoredUtcDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/[zZ]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw)) {
    const zoned = new Date(raw);
    return Number.isNaN(zoned.getTime()) ? null : zoned;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const day = new Date(`${raw}T00:00:00Z`);
    return Number.isNaN(day.getTime()) ? null : day;
  }
  let normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) normalized = `${normalized}:00`;
  const utc = new Date(`${normalized}Z`);
  return Number.isNaN(utc.getTime()) ? null : utc;
}

export function formatSessionInstant(value, locale = 'en-IN', options = {}, emptyLabel = '—') {
  if (value == null || value === '') return emptyLabel;
  const date = parseStoredUtcDate(value);
  if (!date) return String(value);
  return date.toLocaleString(locale, options);
}
