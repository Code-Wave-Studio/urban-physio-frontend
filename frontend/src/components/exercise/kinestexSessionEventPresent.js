/**
 * Turn KinesteX clinician session events into labelled groups.
 * Keeps every recorded field; never invents values that were not sent.
 */
import { formatDuration } from './kinestexWorkoutOverviewMetrics.js';

const EVENT_TITLES = {
  workout_overview: 'Workout overview',
  exercise_overview: 'Exercise overview',
  exercise_completed: 'Exercise completed',
  finished_workout: 'Workout finished',
  workout_completed: 'Workout completed',
  workout_session_saved: 'Workout session saved',
  session_save_complete: 'Session save complete',
  exit_kinestex: 'Session exit',
  workout_exit_request: 'Exit request',
  error_occurred: 'Error',
  data: 'Recorded metrics',
};

const FIELD_META = {
  repetitions: { label: 'Repetitions', group: 'reps' },
  repeats: { label: 'Repeats', group: 'reps' },
  reps: { label: 'Reps', group: 'reps' },
  total_reps: { label: 'Total reps', group: 'reps' },
  total_repeats: { label: 'Total repeats', group: 'reps' },
  completed_reps_count: { label: 'Completed reps', group: 'reps' },
  sets: { label: 'Sets', group: 'reps' },
  sets_completed: { label: 'Sets completed', group: 'reps' },
  mistakes: { label: 'Mistakes', group: 'form' },
  total_mistakes: { label: 'Total mistakes', group: 'form' },
  mistake_count: { label: 'Mistake count', group: 'form' },
  accuracy: { label: 'Accuracy', group: 'form', kind: 'percent' },
  accuracy_score: { label: 'Accuracy score', group: 'form', kind: 'percent' },
  average_accuracy: { label: 'Average accuracy', group: 'form', kind: 'percent' },
  total_accuracy_score: { label: 'Total accuracy score', group: 'form', kind: 'percent' },
  score: { label: 'Score', group: 'form' },
  efficiency_score: { label: 'Efficiency', group: 'form', kind: 'percent' },
  calories: { label: 'Calories', group: 'calories' },
  calories_burned: { label: 'Calories burned', group: 'calories' },
  total_calories: { label: 'Total calories', group: 'calories' },
  duration: { label: 'Duration', group: 'time', kind: 'duration' },
  time: { label: 'Time', group: 'time', kind: 'duration' },
  time_spent: { label: 'Time spent', group: 'time', kind: 'duration' },
  total_time: { label: 'Total time', group: 'time', kind: 'duration' },
  total_time_spent: { label: 'Total time', group: 'time', kind: 'duration' },
  workout_duration_seconds: { label: 'Workout duration', group: 'time', kind: 'duration' },
  reason: { label: 'Reason', group: 'other' },
};

const GROUP_DEFS = [
  { id: 'reps', title: 'Repetitions', icon: 'fa-repeat', tone: 'teal' },
  { id: 'form', title: 'Accuracy & form', icon: 'fa-bullseye', tone: 'violet' },
  { id: 'calories', title: 'Calories', icon: 'fa-fire', tone: 'orange' },
  { id: 'time', title: 'Time', icon: 'fa-clock', tone: 'sky' },
  { id: 'other', title: 'Additional details', icon: 'fa-circle-info', tone: 'slate' },
];

function humanizeKey(key) {
  const text = String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Detail';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function formatFieldValue(meta, value) {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (meta?.kind === 'percent') {
    const raw = String(value).trim();
    if (raw.endsWith('%')) return raw;
    return `${formatNumber(value)}%`;
  }
  if (meta?.kind === 'duration') {
    const formatted = formatDuration(value);
    return formatted || String(value);
  }
  if (typeof value === 'number') return formatNumber(value);
  return String(value);
}

function pushField(into, key, value, prefix) {
  const leaf = String(key);
  const meta = FIELD_META[leaf] || null;
  const formatted = formatFieldValue(meta, value);
  if (formatted == null || formatted === '') return;
  const baseLabel = meta?.label || humanizeKey(leaf);
  into.push({
    key: prefix ? `${prefix}.${leaf}` : leaf,
    label: prefix ? `${humanizeKey(prefix)} · ${baseLabel}` : baseLabel,
    value: formatted,
    group: meta?.group || 'other',
  });
}

function collectFields(node, into, prefix) {
  if (node == null || node === '') return;
  if (Array.isArray(node)) {
    const scalars = node.every(
      (item) => item == null || ['string', 'number', 'boolean'].includes(typeof item)
    );
    if (scalars) {
      const joined = node.filter((item) => item != null && item !== '').map((item) => String(item)).join(', ');
      if (joined && prefix) pushField(into, prefix, joined, '');
      return;
    }
    node.forEach((item, index) => {
      if (item && typeof item === 'object') collectFields(item, into, `${prefix || 'item'} ${index + 1}`);
    });
    return;
  }
  if (typeof node !== 'object') {
    if (prefix) pushField(into, prefix, node, '');
    return;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'event' || value == null || value === '') return;
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      collectFields(value, into, key);
      return;
    }
    pushField(into, key, value, prefix && prefix !== key ? prefix : '');
  });
}

function eventTitle(name, indexAmongSame, sameCount) {
  const base = EVENT_TITLES[name] || humanizeKey(name || 'Session event');
  if (sameCount > 1) return `${base} ${indexAmongSame}`;
  return base;
}

/**
 * @param {Array<Record<string, unknown>>|null|undefined} events
 * @returns {Array<{id: string, title: string, groups: Array}>}
 */
export function presentSessionEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const names = events.map((event) => String(event?.event || 'data'));
  const counts = names.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const seen = {};

  return events
    .map((event, index) => {
      const name = String(event?.event || 'data');
      seen[name] = (seen[name] || 0) + 1;
      const fields = [];
      collectFields(event, fields, '');
      const groups = GROUP_DEFS.map((def) => ({
        id: def.id,
        title: def.title,
        icon: def.icon,
        tone: def.tone,
        rows: fields.filter((field) => field.group === def.id),
      })).filter((group) => group.rows.length > 0);

      return {
        id: `${name}-${index}`,
        title: eventTitle(name, seen[name], counts[name] || 1),
        groups,
      };
    })
    .filter((block) => block.groups.length > 0);
}
