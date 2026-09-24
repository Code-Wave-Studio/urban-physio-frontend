/**
 * Shared Workout Overview metric helpers for KinesteX AI session reports.
 * Only surfaces values present on the persisted session metrics object.
 * Never coerces null → 0.
 */

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === '') return null;
  const n = Number(seconds);
  if (!Number.isFinite(n)) return null;
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function formatAccuracy(value) {
  if (value === null || value === undefined || value === '') return null;
  return `${value}%`;
}

/**
 * Build ordered overview rows from normalized session metrics.
 * Sets are omitted when the provider did not return a sets count.
 *
 * @param {object|null|undefined} metrics
 * @returns {{ label: string, value: string|number }[]}
 */
export function buildWorkoutOverviewRows(metrics) {
  const m = metrics || {};
  const rows = [];

  if (m.repetitions != null) rows.push({ label: 'Repetitions', value: m.repetitions });
  if (m.sets_completed != null) rows.push({ label: 'Sets', value: m.sets_completed });
  if (m.accuracy != null) rows.push({ label: 'Accuracy', value: formatAccuracy(m.accuracy) });
  if (m.mistakes != null) rows.push({ label: 'Mistakes', value: m.mistakes });
  if (m.calories != null) rows.push({ label: 'Calories', value: m.calories });
  if (m.score != null) rows.push({ label: 'Score', value: m.score });
  if (m.duration_seconds != null) {
    rows.push({ label: 'Duration', value: formatDuration(m.duration_seconds) });
  }

  return rows;
}
