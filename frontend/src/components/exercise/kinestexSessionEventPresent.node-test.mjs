/**
 * KinesteX session event presentation.
 * Run: node frontend/src/components/exercise/kinestexSessionEventPresent.node-test.mjs
 */
import assert from 'node:assert/strict';
import { presentSessionEvents } from './kinestexSessionEventPresent.js';

const blocks = presentSessionEvents([
  {
    event: 'data',
    repeats: 10,
    total_reps: 10,
    mistakes: 0,
    average_accuracy: 1,
    calories: 1.56,
    time_spent: 22,
  },
  {
    event: 'data',
    completed_reps_count: 30,
    calories_burned: 8.18,
  },
  { event: 'workout_overview' },
  {
    event: 'data',
    total_repeats: 30,
    completed_reps_count: 30,
    total_mistakes: 0,
    accuracy_score: 100,
    total_accuracy_score: 100,
    calories_burned: 8.18,
    total_calories: 8.18,
    efficiency_score: 100,
    total_time_spent: 79,
    workout_duration_seconds: 124,
  },
]);

assert.equal(blocks.length, 3);
assert.equal(blocks[0].title, 'Recorded metrics 1');
assert.equal(blocks[1].title, 'Recorded metrics 2');
assert.equal(blocks[2].title, 'Recorded metrics 3');

const firstLabels = blocks[0].groups.flatMap((group) => group.rows.map((row) => `${row.label}=${row.value}`));
assert.deepEqual(firstLabels, [
  'Repeats=10',
  'Total reps=10',
  'Mistakes=0',
  'Average accuracy=1%',
  'Calories=1.56',
  'Time spent=22s',
]);

const third = blocks[2].groups.flatMap((group) => group.rows.map((row) => row.label));
assert.ok(third.includes('Completed reps'));
assert.ok(third.includes('Efficiency'));
assert.ok(third.includes('Total time'));
assert.ok(third.includes('Workout duration'));

const duration = blocks[2].groups
  .flatMap((group) => group.rows)
  .find((row) => row.label === 'Workout duration');
assert.equal(duration.value, '2m 4s');

const nested = presentSessionEvents([
  {
    event: 'workout_overview',
    data: { total_repeats: 4, efficiency_score: 80 },
  },
]);
assert.equal(nested.length, 1);
assert.equal(nested[0].title, 'Workout overview');
assert.ok(nested[0].groups.some((group) => group.rows.some((row) => row.value === '4' || row.value === 4)));

assert.deepEqual(presentSessionEvents([]), []);
assert.deepEqual(presentSessionEvents(null), []);

console.log('kinestexSessionEventPresent.node-test.mjs: OK');
