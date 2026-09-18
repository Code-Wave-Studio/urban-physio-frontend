/**
 * Phase 4 → Phase 5 boundary for official KinesteX session results.
 *
 * Do NOT invent fields. Official event names/structures come from:
 * https://www.kinestex.com/docs/data-points
 * https://www.kinestex.com/docs/integration/custom-workout
 *
 * Phase 4 keeps results in memory / callback only — no persistence.
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
 * @returns {object}
 */
export function buildKinesteXSessionResult({
  eventType,
  eventData = {},
  context = {},
  collected = {},
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
    completed_at: new Date().toISOString(),
    status: mapCompletionStatus(eventType),
    // Local HEP refs (not KinesteX fields)
    prescription_id: context.prescription_id ?? null,
    item_id: context.item_id ?? null,
    exercise_id: context.exercise_id ?? null,
    kinestex_exercise_id: context.kinestex_exercise_id ?? null,
    // Official provider references when present
    provider_session_id: sessionId,
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

function mapCompletionStatus(eventType) {
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

/**
 * Phase 5 hook — persistence will attach here.
 * Phase 4: validate shape and return the envelope without writing to the DB.
 *
 * @param {object} result from buildKinesteXSessionResult
 * @returns {object} same result
 */
export function onKinesteXSessionCompleted(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('KinesteX session result missing');
  }
  if (!result.provider || result.provider !== 'kinestex') {
    throw new Error('Invalid KinesteX session result provider');
  }
  // Intentionally no API/DB write in Phase 4.
  if (typeof console !== 'undefined' && console.info) {
    console.info('[KinesteX Phase4] session result ready for Phase 5', {
      status: result.status,
      completion_event: result.completion_event,
      prescription_id: result.prescription_id,
      item_id: result.item_id,
      exercise_id: result.exercise_id,
      provider_session_id: result.provider_session_id,
    });
  }
  return result;
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
