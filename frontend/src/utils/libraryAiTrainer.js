/**
 * Exercise Library AI Personal Trainer panel state.
 * Server eligibility is the authority once loaded. This does not invent reps, scores, or session results.
 */

export function libraryAiPanelState({
  settingsLoaded = false,
  integrationActive = false,
  catalogueMapped = false,
  eligibility = null,
  eligibilityLoading = false,
  cameraSupported = true,
} = {}) {
  if (!catalogueMapped) {
    return {
      phase: 'not_mapped',
      canStart: false,
      title: 'AI Personal Trainer',
      message:
        'This exercise does not have AI monitoring. Follow the instructions — camera tracking is not available for it.',
      showSignIn: false,
      showPlanLink: false,
      assignment: null,
    };
  }

  if (!settingsLoaded) {
    return { phase: 'loading', canStart: false, title: 'AI Personal Trainer', message: '' };
  }

  if (!integrationActive) {
    return {
      phase: 'integration_off',
      canStart: false,
      title: 'AI Personal Trainer',
      message: 'AI Personal Trainer is turned off right now. You can still follow the exercise instructions.',
      showSignIn: false,
      showPlanLink: false,
      assignment: null,
    };
  }

  if (eligibilityLoading || !eligibility) {
    return { phase: 'loading', canStart: false, title: 'AI Personal Trainer', message: '' };
  }

  const reason = String(eligibility.reason || 'error');
  const ready = reason === 'ready' && eligibility.can_start === true;
  const cameraBlocked = ready && cameraSupported === false;

  return {
    phase: cameraBlocked ? 'camera_unavailable' : reason,
    canStart: ready && !cameraBlocked,
    title: 'AI Personal Trainer',
    message: cameraBlocked
      ? 'This browser cannot use the camera for AI monitoring. Open this page on a secure address (https or localhost) in a browser that allows camera access.'
      : String(eligibility.message || 'AI monitoring is not available for this exercise.'),
    showSignIn: reason === 'sign_in',
    showPlanLink: reason === 'not_assigned',
    assignment: ready ? eligibility.assignment || null : null,
  };
}

/** True only when the public catalogue payload says this exercise is actively mapped for AI. */
export function catalogueExerciseAiMapped(exercise) {
  const kinestex = exercise?.kinestex;
  if (!kinestex || typeof kinestex !== 'object') return false;
  return !!(kinestex.mapped && kinestex.ai_supported);
}
