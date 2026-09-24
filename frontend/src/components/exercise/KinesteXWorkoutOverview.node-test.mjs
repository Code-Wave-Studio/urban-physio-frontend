/**
 * Workout Overview metric display helpers.
 * Run: node frontend/src/components/exercise/KinesteXWorkoutOverview.node-test.mjs
 */
import assert from 'node:assert/strict';
import {
  buildWorkoutOverviewRows,
  formatAccuracy,
  formatDuration,
} from './kinestexWorkoutOverviewMetrics.js';

const full = buildWorkoutOverviewRows({
  repetitions: 10,
  sets_completed: null,
  accuracy: 92,
  mistakes: 0,
  calories: 2.54,
  score: 33,
  duration_seconds: 26,
});
assert.equal(full.length, 6);
assert.ok(full.every((r) => r.label !== 'Sets'));
assert.deepEqual(
  full.map((r) => r.label),
  ['Repetitions', 'Accuracy', 'Mistakes', 'Calories', 'Score', 'Duration']
);

const empty = buildWorkoutOverviewRows({
  repetitions: null,
  accuracy: null,
  mistakes: null,
  calories: null,
  score: null,
  duration_seconds: null,
  sets_completed: null,
});
assert.equal(empty.length, 0);

const withSets = buildWorkoutOverviewRows({ repetitions: 5, sets_completed: 2 });
assert.equal(withSets.length, 2);
assert.equal(withSets[1].label, 'Sets');

assert.equal(formatAccuracy(92), '92%');
assert.equal(formatAccuracy(null), null);
assert.equal(formatDuration(26), '26s');
assert.equal(formatDuration(90), '1m 30s');
assert.equal(formatDuration(null), null);

console.log('KinesteXWorkoutOverview.node-test.mjs: OK');
