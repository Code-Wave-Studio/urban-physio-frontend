/** Movement analysis helpers — no invented clinical claims. */

export function deriveMovementAnalysisFromEvents(collected = {}, providerSessionId = null) {
  const raw = collected && typeof collected === 'object' ? collected : {};
  const hasProvider =
    providerSessionId !== null &&
    providerSessionId !== undefined &&
    String(providerSessionId).trim() !== '';
  const hasSaved =
    hasProvider || !!raw.workout_session_saved;

  const replayId = hasProvider && /^[1-9][0-9]{0,11}$/.test(String(providerSessionId).trim());

  if (raw.session_save_complete && replayId) {
    return {
      available: true,
      replay_supported: true,
      status: 'ready',
      message: 'KinesteX movement replay is available for this session.',
    };
  }

  if (raw.motion_upload_error || (!replayId && hasProvider)) {
    return {
      available: false,
      replay_supported: false,
      status: raw.motion_upload_error ? 'upload_failed' : 'unavailable',
      message: raw.motion_upload_error
        ? 'Movement recording could not be saved for this session.'
        : 'Movement analysis is not available for this session.',
    };
  }

  if (!hasSaved || !replayId) {
    return {
      available: false,
      replay_supported: false,
      status: 'unavailable',
      message: 'Movement analysis is not available for this session.',
    };
  }

  return {
    available: true,
    replay_supported: true,
    status: raw.session_save_complete ? 'ready' : 'ready',
    message: 'KinesteX movement replay is available for this session.',
  };
}

export function motionUploadSettled(collected = {}) {
  const raw = collected && typeof collected === 'object' ? collected : {};
  return !!(raw.session_save_complete || raw.motion_upload_error);
}
