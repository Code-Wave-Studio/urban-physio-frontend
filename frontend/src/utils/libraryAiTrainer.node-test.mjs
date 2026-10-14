/**
 * Run: node frontend/src/utils/libraryAiTrainer.node-test.mjs
 */
import { catalogueExerciseAiMapped, libraryAiPanelState } from './libraryAiTrainer.js';

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

check('unmapped catalogue flag', catalogueExerciseAiMapped({ kinestex: { mapped: false, ai_supported: true } }) === false);
check('mapped catalogue flag', catalogueExerciseAiMapped({ kinestex: { mapped: true, ai_supported: true } }) === true);
check('missing kinestex is not mapped', catalogueExerciseAiMapped({ id: 1, name: 'Fallback' }) === false);

const notMapped = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: false,
});
check('unmapped cannot start', notMapped.phase === 'not_mapped' && notMapped.canStart === false);
const unmappedBeforeSettings = libraryAiPanelState({
  settingsLoaded: false,
  catalogueMapped: false,
});
check('unmapped does not wait on settings', unmappedBeforeSettings.phase === 'not_mapped');
check('unmapped does not invent a score', !/score|repetition count|accuracy/i.test(notMapped.message));

const off = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: false,
  catalogueMapped: true,
});
check('integration off blocks start', off.phase === 'integration_off' && off.canStart === false);

const loading = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  eligibilityLoading: true,
});
check('waits for server eligibility', loading.phase === 'loading' && loading.canStart === false);

const ready = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  cameraSupported: true,
  eligibility: {
    reason: 'ready',
    can_start: true,
    message: 'Ready',
    assignment: { sets: 3, reps: 10, prescription_id: 4, item_id: 9 },
  },
});
check('ready can start', ready.canStart === true && ready.phase === 'ready');
check('ready keeps assignment', ready.assignment?.item_id === 9);

const noCamera = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  cameraSupported: false,
  eligibility: { reason: 'ready', can_start: true, message: 'Ready', assignment: { item_id: 1 } },
});
check('camera unsupported blocks start', noCamera.phase === 'camera_unavailable' && noCamera.canStart === false);

const signIn = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  eligibility: { reason: 'sign_in', can_start: false, message: 'Sign in' },
});
check('sign in has no start', signIn.showSignIn === true && signIn.canStart === false);

const assignedOff = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  eligibility: { reason: 'not_assigned', can_start: false, message: 'Not enabled on the plan' },
});
check('unassigned links to plan', assignedOff.showPlanLink === true && assignedOff.canStart === false);

const staleReady = libraryAiPanelState({
  settingsLoaded: true,
  integrationActive: true,
  catalogueMapped: true,
  eligibility: { reason: 'ready', can_start: false, message: 'Not actually ready' },
});
check('can_start false is not a start', staleReady.canStart === false);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
