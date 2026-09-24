/** Movement analysis helpers — no invented clinical claims. */

export function deriveMovementAnalysisFromEvents(collected = {}, providerSessionId = null) {
  const raw = collected && typeof collected === 'object' ? collected : {};
  const hasProvider =
    providerSessionId !== null &&
    providerSessionId !== undefined &&
    String(providerSessionId).trim() !== '';
  const hasSaved =
    hasProvider || !!raw.workout_session_saved;

  if (raw.motion_upload_error) {
    return {
      available: false,
      replay_supported: false,
      status: 'upload_failed',
      message: 'Movement recording could not be saved for this session.',
    };
  }

  if (!hasSaved) {
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
