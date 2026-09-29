/**
 * Workout Overview metric helpers. Only surfaces values present on persisted metrics.
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
 * Build ordered overview rows. Sets omitted when provider did not return a sets count.
 */
export function buildWorkoutOverviewRows(metrics) {
  const m = metrics || {};
  const rows = [];

  if (m.repetitions != null) rows.push({ key: 'repetitions', label: 'Repetitions', value: m.repetitions });
  if (m.sets_completed != null) rows.push({ key: 'sets_completed', label: 'Sets', value: m.sets_completed });
  if (m.accuracy != null) rows.push({ key: 'accuracy', label: 'Accuracy', value: formatAccuracy(m.accuracy) });
  if (m.mistakes != null) rows.push({ key: 'mistakes', label: 'Mistakes', value: m.mistakes });
  if (m.calories != null) rows.push({ key: 'calories', label: 'Calories', value: m.calories });
  if (m.score != null) rows.push({ key: 'score', label: 'Score', value: m.score });
  if (m.duration_seconds != null) {
    rows.push({ key: 'duration_seconds', label: 'Duration', value: formatDuration(m.duration_seconds) });
  }

  return rows;
}

const OVERVIEW_SECTIONS = [
  {
    id: 'repetitions',
    title: 'Repetitions',
    icon: 'fa-repeat',
    tone: 'teal',
    keys: ['repetitions', 'sets_completed'],
  },
  {
    id: 'form',
    title: 'Accuracy & form',
    icon: 'fa-bullseye',
    tone: 'violet',
    keys: ['accuracy', 'mistakes', 'score'],
  },
  {
    id: 'effort',
    title: 'Effort & time',
    icon: 'fa-clock',
    tone: 'amber',
    keys: ['calories', 'duration_seconds'],
  },
];

/** Group available overview rows into labelled sections. Omits empty groups. */
export function buildWorkoutOverviewSections(metrics) {
  const rows = buildWorkoutOverviewRows(metrics);
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const used = new Set();
  const sections = OVERVIEW_SECTIONS.map((def) => {
    const items = def.keys.map((key) => byKey.get(key)).filter(Boolean);
    items.forEach((item) => used.add(item.key));
    return {
      id: def.id,
      title: def.title,
      icon: def.icon,
      tone: def.tone,
      items,
    };
  }).filter((section) => section.items.length > 0);

  const extras = rows.filter((row) => row.key && !used.has(row.key));
  if (extras.length) {
    sections.push({
      id: 'other',
      title: 'Additional metrics',
      icon: 'fa-circle-info',
      tone: 'slate',
      items: extras,
    });
  }
  return sections;
}
