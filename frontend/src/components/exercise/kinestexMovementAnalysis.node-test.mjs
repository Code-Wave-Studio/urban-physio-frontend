/**
 * KinesteX movement analysis helpers (no invented landmarks).
 * Run: node frontend/src/components/exercise/kinestexMovementAnalysis.node-test.mjs
 */
import {
  deriveMovementAnalysisFromEvents,
  motionUploadSettled,
} from './kinestexMovementAnalysis.js';

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

const unavailable = deriveMovementAnalysisFromEvents({}, null);
check('no provider session → unavailable', unavailable.status === 'unavailable' && !unavailable.available);

const ready = deriveMovementAnalysisFromEvents(
  { workout_session_saved: { session_id: 99 }, session_save_complete: {} },
  '99'
);
check('session saved + complete → available', ready.available && ready.replay_supported && ready.status === 'ready');

const pending = deriveMovementAnalysisFromEvents({ workout_session_saved: { session_id: 5 } }, '5');
check('session saved without complete still replay-supported', pending.available && pending.replay_supported);

const failedUpload = deriveMovementAnalysisFromEvents(
  { workout_session_saved: { session_id: 7 }, motion_upload_error: { error: 'timeout' } },
  '7'
);
check('motion upload error → not available', !failedUpload.available && failedUpload.status === 'upload_failed');

const both = deriveMovementAnalysisFromEvents(
  {
    workout_session_saved: { session_id: 18535 },
    session_save_complete: {},
    motion_upload_error: { error: 'stale' },
  },
  '18535'
);
check('completed upload wins over a stale motion error', both.available && both.status === 'ready');

const nonNumeric = deriveMovementAnalysisFromEvents(
  { workout_session_saved: { session_id: 'ksx-sess-1' }, session_save_complete: {} },
  'ksx-sess-1'
);
check('non-numeric provider id is unavailable', !nonNumeric.available && nonNumeric.status === 'unavailable');

const empty = deriveMovementAnalysisFromEvents({}, '');
check('empty payload is unavailable', !empty.available && empty.status === 'unavailable');

const malformed = deriveMovementAnalysisFromEvents(null, null);
check('malformed collected events do not throw', !malformed.available);

check('motion settled on complete', motionUploadSettled({ session_save_complete: true }));
check('motion settled on error', motionUploadSettled({ motion_upload_error: { error: 'x' } }));
check('motion not settled mid-upload', !motionUploadSettled({ motion_upload_progress: { completed: 1, total: 2 } }));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
