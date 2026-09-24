/**
 * Node checks for KinesteX session envelope + persist hook.
 * Run: node frontend/src/services/kinestexSessionBoundary.node-test.mjs
 */
import {
  buildKinesteXSessionResult,
  mapCompletionStatus,
  onKinesteXSessionCompleted,
  validateKinesteXSessionResult,
  newClientSessionId,
} from './kinestexSessionBoundary.js';

let passed = 0;
let failed = 0;

function check(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const clientId = newClientSessionId();
check('client uuid shape', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clientId));

const result = buildKinesteXSessionResult({
  eventType: 'workout_completed',
  eventData: { session_id: 'ksx-1' },
  context: { prescription_id: 9, item_id: 3, exercise_id: 7, kinestex_exercise_id: 'abc' },
  collected: {
    workout_overview: { calories: 4, accuracy: 90 },
    exercise_completed: { repeats: 10 },
  },
  clientSessionId: clientId,
  startedAt: '2026-09-21T10:00:00.000Z',
});

check('provider kinestex', result.provider === 'kinestex');
check('status completed', result.status === 'completed');
check('keeps provider_session_id', result.provider_session_id === 'ksx-1');
check('keeps client_session_id', result.client_session_id === clientId);
check('does not invent extra metric fields', !('repetitions' in result) && !('score' in result));
  check('preserves workout_overview', result.workout_overview?.calories === 4);
  check('map exit cancelled', mapCompletionStatus('exit_kinestex') === 'cancelled');
  check('map error failed', mapCompletionStatus('error_occurred') === 'failed');
  check('map session_save_complete completed', mapCompletionStatus('session_save_complete') === 'completed');

  const withMotion = buildKinesteXSessionResult({
    eventType: 'session_save_complete',
    eventData: {},
    context: { prescription_id: 9, item_id: 3, exercise_id: 7 },
    collected: {
      workout_session_saved: { session_id: 55 },
      session_save_complete: {},
      motion_upload_progress: { completed: 1, total: 1 },
    },
    clientSessionId: clientId,
  });
  check('envelope keeps motion upload progress', !!withMotion.motion_upload_progress);
  check('envelope keeps session_save_complete', !!withMotion.session_save_complete);
  check('provider session from workout_session_saved', withMotion.provider_session_id === 55);

const exitCompleted = buildKinesteXSessionResult({
  eventType: 'exit_kinestex',
  context: { prescription_id: 9, item_id: 3, exercise_id: 7 },
  collected: { workout_overview: { calories: 1 } },
  clientSessionId: clientId,
  statusOverride: 'completed',
});
check('exit after stats can persist as completed', exitCompleted.status === 'completed');

validateKinesteXSessionResult(result);
check('validate accepts envelope', true);

let missing = false;
try {
  validateKinesteXSessionResult({ provider: 'kinestex' });
} catch {
  missing = true;
}
check('validate requires client_session_id', missing);

let persistCalls = 0;
const saved = await onKinesteXSessionCompleted(result, async (payload) => {
  persistCalls += 1;
  return { session: { id: 1 }, duplicate: false, created: true, echo: payload.client_session_id };
});
check('onKinesteXSessionCompleted calls persist', persistCalls === 1 && saved.echo === clientId);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
