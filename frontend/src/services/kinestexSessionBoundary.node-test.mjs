/**
 * Node checks for KinesteX session envelope + persist hook.
 * Run: node frontend/src/services/kinestexSessionBoundary.node-test.mjs
 */
import {
  buildKinesteXLaunchPostData,
  buildKinesteXSessionResult,
  cameraCaptureSupported,
  isKinesteXReplaySessionId,
  kinesteXStyleName,
  mapCompletionStatus,
  onKinesteXSessionCompleted,
  patientFriendlyKinesteXError,
  validateKinesteXSessionResult,
  newClientSessionId,
} from './kinestexSessionBoundary.js';
import { formatSessionInstant, parseStoredUtcDate } from '../utils/sessionTime.js';

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
check('omits appointment when context has none', result.appointment_id === null);
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

const withAppointment = buildKinesteXSessionResult({
  eventType: 'workout_completed',
  context: { prescription_id: 9, item_id: 3, exercise_id: 7, appointment_id: 44 },
  clientSessionId: clientId,
});
check('copies consultation appointment_id into the result', withAppointment.appointment_id === 44);

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

const launch = buildKinesteXLaunchPostData({
  session: 'ksx_sess_public_launch',
  company: 'Urban Physio',
  userId: 'tup_p1_u2',
  key: 'COMPANY_SECRET_KEY',
  api_key: 'COMPANY_SECRET_KEY',
  customWorkoutExercises: [{ exerciseId: 'ex1', reps: 10 }],
  customParameters: { api_key: 'COMPANY_SECRET_KEY', videoFit: 'contain' },
});
check('launch postData uses session', launch?.session === 'ksx_sess_public_launch');
check('launch postData omits company API key field', launch && !('key' in launch) && !('api_key' in launch));
check(
  'launch postData does not contain the secret value',
  launch && !JSON.stringify(launch).includes('COMPANY_SECRET_KEY')
);
check('legacy key-only payload is not launched', buildKinesteXLaunchPostData({
  key: 'COMPANY_SECRET_KEY',
  company: 'Urban Physio',
  userId: 'tup_p1_u2',
}) === null);

const motionLaunch = buildKinesteXLaunchPostData({
  session: 'ksx_sess_public_launch',
  company: 'Urban Physio',
  userId: 'tup_p1_u2',
  shouldSendStats: true,
  motionDataEnabled: true,
  motionTrackingEnabled: true,
  customWorkoutExercises: [{ exerciseId: 'ex1', reps: 10 }],
}, { videoFit: 'contain' });
check('motion launch sets shouldSendStats', motionLaunch?.shouldSendStats === true);
check('motion launch keeps landmark recording on', motionLaunch?.motionDataEnabled === true);
check('motion launch enables tracking', motionLaunch?.motionTrackingEnabled === true);
check(
  'motion flags are also inside customParameters',
  motionLaunch?.customParameters?.shouldSendStats === true
    && motionLaunch?.customParameters?.motionDataEnabled === true
    && motionLaunch?.customParameters?.videoFit === 'contain'
);

const landmarks = [
  { name: 'leftShoulder', x: 0.42, y: 0.31, z: -0.2, visibility: 0.93 },
  { name: 'leftHip', x: 0.48, y: 0.62, z: -0.05, visibility: 0.88 },
];
const skeletal = buildKinesteXSessionResult({
  eventType: 'session_save_complete',
  eventData: { data: { session_id: 18535 } },
  context: { prescription_id: 9, item_id: 3, exercise_id: 7 },
  collected: {
    workout_session_saved: { type: 'workout_session_saved', data: { session_id: 18535 } },
    session_save_complete: { type: 'session_save_complete' },
    pose_landmarks: { poseLandmarks: landmarks },
  },
  clientSessionId: clientId,
  startedAt: '2026-10-14T09:18:00.000Z',
});
check('skeletal fixture keeps provider session id', skeletal.provider_session_id === 18535);
check(
  'skeletal fixture keeps pose landmarks for replay linkage',
  skeletal.raw_events?.pose_landmarks?.poseLandmarks?.[1]?.name === 'leftHip'
);
check('skeletal fixture does not invent extra landmarks', skeletal.raw_events.pose_landmarks.poseLandmarks.length === 2);

check(
  'camera permission message',
  /allow camera/i.test(patientFriendlyKinesteXError('error_occurred', { message: 'Permission denied' }))
);
check(
  'unsupported camera message',
  /not have a supported camera/i.test(patientFriendlyKinesteXError('error_occurred', { message: 'Camera not supported' }))
);
check(
  'non-camera unsupported stays generic',
  /supported camera/i.test(patientFriendlyKinesteXError('error_occurred', { message: 'WebGL not supported' })) === false
);
check(
  'empty frame message',
  /did not produce a video frame/i.test(patientFriendlyKinesteXError('error_occurred', { message: 'empty frame' }))
);
check('camera helper rejects missing getUserMedia', cameraCaptureSupported({ mediaDevices: {} }, true) === false);
check(
  'camera helper accepts getUserMedia without opening it',
  cameraCaptureSupported({ mediaDevices: { getUserMedia() {} } }, true) === true
);
check('camera helper rejects insecure context', cameraCaptureSupported({ mediaDevices: { getUserMedia() {} } }, false) === false);

const utcMs = Date.UTC(2026, 9, 14, 9, 18, 0);
check('naive UTC datetime parses as UTC', parseStoredUtcDate('2026-10-14 09:18:00')?.getTime() === utcMs);
check('Z datetime parses as the same instant', parseStoredUtcDate('2026-10-14T09:18:00.000Z')?.getTime() === utcMs);
check('IST offset parses once to the same instant', parseStoredUtcDate('2026-10-14T14:48:00+05:30')?.getTime() === utcMs);
const istClock = formatSessionInstant('2026-10-14 09:18:00', 'en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
check('UTC 09:18 displays as 14:48 in Kolkata', istClock.includes('14:48'));
const pacificClock = formatSessionInstant('2026-10-14 09:18:00', 'en-GB', {
  timeZone: 'America/Los_Angeles',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const styled = buildKinesteXLaunchPostData({
  session: 'ksx_sess_public_launch',
  company: 'Urban Physio',
  userId: 'tup_p1_u2',
  style: { style: 'light' },
});
check('launch style is the string light', styled?.style === 'light');
check('style helper reads a string', kinesteXStyleName('dark') === 'dark');
check('numeric kinestex session id is replayable', isKinesteXReplaySessionId('18535'));
check('non-numeric provider id is not a replay route', isKinesteXReplaySessionId('ksx-sess-1') === false);
check('empty provider id is not a replay route', isKinesteXReplaySessionId('') === false);
check('malformed sdk does not throw', buildKinesteXLaunchPostData('not-an-object') === null);

check('display uses the zone, not a hardcoded seven-hour offset', pacificClock.includes('02:18'));
check('already-zoned value is not shifted twice', parseStoredUtcDate('2026-10-14T09:18:00Z')?.getTime() === utcMs);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
