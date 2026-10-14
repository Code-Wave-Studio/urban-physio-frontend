/**
 * Presentation rules for the Tele-Rehab dashboard.
 * Stored metrics stay blank when the database value is null. Zero is shown only when it was stored.
 */

export function dashboardViewState({ loading, error, data }) {
  if (loading) return 'loading';
  if (error) {
    const status = Number(error.status);
    if (status === 401 || status === 403) return 'denied';
    return 'error';
  }
  if (!data || typeof data !== 'object') return 'error';
  return 'ready';
}

/** @returns {string|null} */
export function metricText(value, digits = 0) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (digits > 0) return n.toFixed(digits);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function countText(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

export function consultationHref(links, appointmentId) {
  const base = links?.consultation;
  const id = Number(appointmentId);
  if (!base || !Number.isFinite(id) || id < 1) return null;
  return `${String(base).replace(/\/$/, '')}/${id}`;
}

export function sectionVisible(permissions, key) {
  if (!permissions || typeof permissions !== 'object') return false;
  return permissions[key] !== false;
}
