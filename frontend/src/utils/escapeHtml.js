/**
 * HTML-escape untrusted text before it is interpolated into an HTML *string*
 * (print windows built with document.write, exported HTML, e-mail-style templates ...).
 *
 * Patient and clinic fields can be supplied by the public (QR self-registration), so they must never be
 * concatenated into markup unescaped: a name such as `<img src=x onerror=...>` would run script in the
 * clinic staff member's origin.
 */
const MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => MAP[ch]);
}

export default escapeHtml;
