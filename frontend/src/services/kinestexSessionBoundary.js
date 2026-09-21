/**
 * Phase 4 → Phase 5 boundary for official KinesteX session results.
 *
 * Do NOT invent fields. Official event names/structures come from:
 * https://www.kinestex.com/docs/data-points
 * https://www.kinestex.com/docs/integration/custom-workout
 *
 * Phase 5 persists the same envelope via POST /kinestex/session/result.
 */

/** @typedef {'idle'|'preparing'|'starting'|'active'|'paused'|'completed'|'cancelled'|'failed'} KinesteXSessionLifecycle */

/**
 * Normalize an official SDK handleMessage(type, data) pair into a Phase-5-ready envelope.
 *
 * @param {object} params
 * @param {string} params.eventType Official KinesteX message type
 * @param {object} [params.eventData] Official event payload (may be the whole message object)
 * @param {object} [params.context] Our prepare-session context (prescription/item/exercise)
 * @param {object} [params.collected] Accumulated events during the session
 * @param {string} [params.clientSessionId] Local UUID for this iframe mount (not a KinesteX id)
 * @param {string} [params.startedAt] ISO timestamp when this local session started
 * @param {string} [params.statusOverride] Terminal status when exit follows workout stats
 * @returns {object}
 */
export function buildKinesteXSessionResult({
  eventType,
  eventData = {},
  context = {},
  collected = {},
  clientSessionId = null,
  startedAt = null,
  statusOverride = null,
}) {
  const data = eventData && typeof eventData === 'object' ? eventData : {};
  // SDK sometimes nests fields under data / value; keep raw for Phase 5.
  const sessionId =
    data.session_id ??
    data?.data?.session_id ??
    collected.workout_session_saved?.session_id ??
    collected.workout_session_saved?.data?.session_id ??
    null;

  return {
    provider: 'kinestex',
    integration: 'CUSTOM_WORKOUT',
    completion_event: eventType,
    started_at: startedAt || new Date().toISOString(),
    completed_at: new Date().toISOString(),
    status: statusOverride || mapCompletionStatus(eventType),
    // Local HEP refs (not KinesteX fields)
    prescription_id: context.prescription_id ?? null,
    item_id: context.item_id ?? null,
    exercise_id: context.exercise_id ?? null,
    kinestex_exercise_id: context.kinestex_exercise_id ?? null,
    client_session_id: clientSessionId || null,
    // Official provider references when present — never invent a KinesteX session id
    provider_session_id: sessionId || null,
    cancellation_reason: typeof data.reason === 'string' ? data.reason : null,
    // Documented performance-related payloads when emitted
    exercise_completed: collected.exercise_completed || null,
    exercise_overview: collected.exercise_overview || null,
    workout_overview: collected.workout_overview || null,
    finished_workout: collected.finished_workout || null,
    workout_completed: collected.workout_completed || null,
    workout_session_saved: collected.workout_session_saved || null,
    // Full last event for Phase 5 inspection
    last_event: { type: eventType, data },
    raw_events: collected,
  };
}

export function mapCompletionStatus(eventType) {
  switch (eventType) {
    case 'workout_completed':
    case 'finished_workout':
    case 'workout_overview':
    case 'workout_session_saved':
    case 'session_save_complete':
      return 'completed';
    case 'exit_kinestex':
    case 'workout_exit_request':
      return 'cancelled';
    case 'error_occurred':
      return 'failed';
    default:
      return 'unknown';
  }
}

export function validateKinesteXSessionResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('KinesteX session result missing');
  }
  if (!result.provider || result.provider !== 'kinestex') {
    throw new Error('Invalid KinesteX session result provider');
  }
  if (!result.client_session_id) {
    throw new Error('KinesteX session result is missing a local session id');
  }
  return result;
}

/**
 * Persist the Phase 4 envelope through the authenticated backend.
 * Does not log API keys. Success is only returned after the API accepts the save.
 *
 * @param {object} result from buildKinesteXSessionResult
 * @param {(payload: object) => Promise<object>} [persistFn]
 * @returns {Promise<object>} API data `{ session, duplicate, created }`
 */
export async function onKinesteXSessionCompleted(result, persistFn) {
  validateKinesteXSessionResult(result);
  if (typeof persistFn !== 'function') {
    throw new Error('KinesteX persist function missing');
  }
  return persistFn(result);
}

export function newClientSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Patient-safe messages for known failure modes (no raw SDK/API text). */
export function patientFriendlyKinesteXError(eventType, eventData) {
  const raw = String(
    eventData?.message ||
      eventData?.error ||
      eventData?.data?.message ||
      eventData?.value ||
      ''
  ).toLowerCase();

  if (eventType === 'error_occurred' || raw.includes('camera')) {
    if (raw.includes('camera') || raw.includes('permission') || raw.includes('not allowed')) {
      return 'Camera access is required for AI monitoring. Please allow camera access and try again.';
    }
    return 'AI monitoring could not start. Please try again in a supported browser with a working camera.';
  }
  return 'AI monitoring stopped unexpectedly. You can try again or mark the exercise complete manually.';
}

export function patientFriendlySaveError(err) {
  const status = err?.status;
  const msg = String(err?.message || '');
  if (status === 401) return 'Please sign in again to save this AI session.';
  if (status === 403) return 'This AI session could not be saved for your account.';
  if (status === 413) return 'The AI session result was too large to save. Please try the exercise again.';
  if (status === 422) {
    if (/not enabled/i.test(msg)) return 'AI monitoring is not enabled for this exercise.';
    if (/not found/i.test(msg)) return 'This exercise is no longer on your rehab plan.';
    if (/not match/i.test(msg)) return 'This AI session does not match your assigned exercise.';
    return 'The AI session result could not be saved. Please try again.';
  }
  if (status === 503 || /not installed/i.test(msg)) {
    return 'AI session storage is not ready yet. Your therapist can still review a manual completion.';
  }
  return 'Could not save the AI session result. Please try again. This session is not marked complete.';
}
