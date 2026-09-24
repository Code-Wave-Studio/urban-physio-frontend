import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KinesteXSDK, IntegrationOption } from 'kinestex-sdk-react-ts';
import FaIcon from '../FaIcon';
import KinesteXWorkoutOverview from './KinesteXWorkoutOverview';
import KinesteXMovementAnalysisReport from './KinesteXMovementAnalysisReport';
import {
  buildKinesteXSessionResult,
  newClientSessionId,
  onKinesteXSessionCompleted,
  patientFriendlyKinesteXError,
  patientFriendlySaveError,
} from '../../services/kinestexSessionBoundary';
import { kinestex } from '../../services/api';

/** Keep iframe alive briefly so late workout_session_saved / motion upload events can merge. */
const MOTION_SAVE_GRACE_MS = 45000;

/**
 * Official KinesteX Custom Workout session (Phase 4 + Phase 5 persistence).
 * Patient-facing framing: AI Personal Trainer / AI-Guided Exercise (Req #5).
 *
 * Sources:
 * - npm: kinestex-sdk-react-ts (docs: https://www.kinestex.com/docs/installation)
 * - IntegrationOption.CUSTOM_WORKOUT → /custom-workout
 * - postData: key, company, userId, customWorkoutExercises, videoFit
 * - On all_resources_loaded → sendAction("workout_activity_action", "start")
 * - Optional coach speech: mute_speech / unmute_speech (workout player actions)
 * - Host overlay/stage sizing is responsive; iframe internals stay provider-controlled
 *
 * Persistence: onKinesteXSessionCompleted → POST /kinestex/session/result
 * Success UI is shown only after the backend confirms the save.
 */
export default function KinesteXExerciseSession({
  sessionPayload,
  onClose,
  onCompleted,
  onFailed,
  onCancelled,
}) {
  const sdk = sessionPayload?.sdk;
  const context = sessionPayload?.context || {};
  const sdkRef = useRef(null);
  const startedRef = useRef(false);
  const persistInFlightRef = useRef(false);
  const bestStatusRef = useRef(null);
  const notifiedRef = useRef({ completed: false, failed: false, cancelled: false });
  const saveStateRef = useRef('idle');
  const clientSessionIdRef = useRef(newClientSessionId());
  const startedAtRef = useRef(new Date().toISOString());
  const eventsRef = useRef({});

  const [lifecycle, setLifecycle] = useState('starting');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | save_failed
  const [saveError, setSaveError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [persisted, setPersisted] = useState(null);
  const [motionSaveState, setMotionSaveState] = useState('idle'); // idle | uploading | complete | failed | timed_out
  const [coachMuted, setCoachMuted] = useState(false);
  const motionGraceTimerRef = useRef(null);

  saveStateRef.current = saveState;

  const postData = useMemo(() => {
    if (!sdk) return null;
    return {
      key: sdk.key,
      company: sdk.company,
      userId: sdk.userId,
      customWorkoutExercises: sdk.customWorkoutExercises || [],
      // Persist session + motion recording for post-exercise replay (Req #4).
      shouldSendStats: sdk.shouldSendStats !== false,
      style: sdk.style || { style: 'light' },
      // Documented Camera & Pose Detection param (Workout player incl. Custom Workout).
      // Default provider "cover" crops the feed; "contain" keeps the full camera frame
      // visible (letterboxed) so the subject stays in view farther from the camera.
      // Host layout still cannot rewrite KinesteX's internal UI chrome.
      videoFit: 'contain',
      // motionDataEnabled defaults true; never set false or session replay is empty.
      customParameters: {
        ...(sdk.customParameters && typeof sdk.customParameters === 'object' ? sdk.customParameters : {}),
      },
    };
  }, [sdk]);

  const clearMotionGrace = useCallback(() => {
    if (motionGraceTimerRef.current) {
      clearTimeout(motionGraceTimerRef.current);
      motionGraceTimerRef.current = null;
    }
  }, []);

  const beginMotionGrace = useCallback(() => {
    clearMotionGrace();
    setMotionSaveState((s) => (s === 'complete' || s === 'failed' ? s : 'uploading'));
    motionGraceTimerRef.current = setTimeout(() => {
      setMotionSaveState((s) => (s === 'complete' || s === 'failed' ? s : 'timed_out'));
    }, MOTION_SAVE_GRACE_MS);
  }, [clearMotionGrace]);

  const finish = useCallback(
    (kind, result) => {
      // Official SDK may emit finished_workout then workout_session_saved; notify once.
      if (kind !== 'completed' && notifiedRef.current.completed) return;
      if (notifiedRef.current[kind]) return;
      notifiedRef.current[kind] = true;
      if (kind === 'completed' && onCompleted) onCompleted(result);
      else if (kind === 'failed' && onFailed) onFailed(result);
      else if (kind === 'cancelled' && onCancelled) onCancelled(result);
    },
    [onCompleted, onFailed, onCancelled]
  );

  const persistResult = useCallback(
    async (result, kind) => {
      // Allow a later completed event (e.g. workout_session_saved) to merge into the same row.
      // Do not re-save cancelled/failed after a successful completed save.
      // Read saveState via ref: the SDK message listener does not refresh handleMessage.
      const currentSave = saveStateRef.current;
      if (currentSave === 'saved' && kind !== 'completed') {
        return;
      }
      if (persistInFlightRef.current && currentSave === 'saving' && kind !== 'completed') {
        return;
      }
      persistInFlightRef.current = true;
      if (currentSave !== 'saved') {
        saveStateRef.current = 'saving';
        setSaveState('saving');
      }
      setSaveError('');
      try {
        const saved = await onKinesteXSessionCompleted(result, (payload) =>
          kinestex.saveSessionResult(payload)
        );
        setPersisted(saved);
        saveStateRef.current = 'saved';
        setSaveState('saved');
        persistInFlightRef.current = false;
        finish(kind, { ...result, persisted: saved });
      } catch (err) {
        persistInFlightRef.current = false;
        saveStateRef.current = 'save_failed';
        setSaveState('save_failed');
        setSaveError(patientFriendlySaveError(err));
      }
    },
    [finish]
  );

  const emitBoundary = useCallback(
    (eventType, eventData, kind) => {
      // Never treat leaving the camera frame as a cancelled session.
      if (eventType === 'left_camera_frame' || eventType === 'returned_camera_frame') {
        return;
      }

      const currentBest = bestStatusRef.current;
      if (currentBest === 'completed' && kind !== 'completed') {
        return;
      }

      try {
        const result = buildKinesteXSessionResult({
          eventType,
          eventData,
          context,
          collected: { ...eventsRef.current },
          clientSessionId: clientSessionIdRef.current,
          startedAt: startedAtRef.current,
          statusOverride: kind,
        });
        setLastResult(result);
        setLifecycle(kind === 'completed' ? 'completed' : kind === 'failed' ? 'failed' : 'cancelled');
        bestStatusRef.current = kind === 'completed' ? 'completed' : currentBest === 'completed' ? 'completed' : kind;

        const alreadySaved = saveStateRef.current === 'saved';
        if (alreadySaved && kind !== 'completed') {
          return;
        }
        persistResult(result, kind);
      } catch (e) {
        setLifecycle('failed');
        setErrorMessage('Could not process the AI session result.');
        saveStateRef.current = 'save_failed';
        setSaveState('save_failed');
        setSaveError('Could not process the AI session result.');
      }
    },
    [context, persistResult]
  );

  const retrySave = useCallback(() => {
    if (!lastResult) return;
    persistInFlightRef.current = false;
    persistResult(lastResult, lastResult.status === 'failed' ? 'failed' : lastResult.status === 'cancelled' ? 'cancelled' : 'completed');
  }, [lastResult, persistResult]);

  const toggleCoachSpeech = useCallback(() => {
    if (!sdkRef.current?.sendAction) return;
    const nextMuted = !coachMuted;
    try {
      sdkRef.current.sendAction(
        'workout_activity_action',
        nextMuted ? 'mute_speech' : 'unmute_speech'
      );
      setCoachMuted(nextMuted);
    } catch (e) {
      // Provider may ignore if workout player is not active yet — keep UI state unchanged.
    }
  }, [coachMuted]);

  const handleMessage = useCallback(
    (type, data) => {
      if (!type) return;
      const payload = data && typeof data === 'object' ? data : {};
      eventsRef.current[type] = payload;

      switch (type) {
        case 'kinestex_launched':
        case 'kinestex_loaded':
          setLifecycle((s) => (s === 'starting' ? 'starting' : s));
          break;
        case 'all_resources_loaded':
          setLifecycle((s) => (s === 'completed' || s === 'failed' || s === 'cancelled' ? s : 'active'));
          if (!startedRef.current && sdkRef.current?.sendAction) {
            startedRef.current = true;
            try {
              sdkRef.current.sendAction('workout_activity_action', 'start');
            } catch (e) {
              setErrorMessage('AI monitoring could not start. Please try again.');
              setLifecycle('failed');
              emitBoundary('error_occurred', { message: 'start_failed' }, 'failed');
            }
          }
          break;
        case 'workout_started':
          setLifecycle((s) => (s === 'completed' || s === 'failed' || s === 'cancelled' ? s : 'active'));
          break;
        case 'left_camera_frame':
          setLifecycle((s) => (s === 'active' || s === 'starting' ? 'paused' : s));
          break;
        case 'returned_camera_frame':
          setLifecycle((s) => (s === 'paused' ? 'active' : s));
          break;
        case 'error_occurred':
          setErrorMessage(patientFriendlyKinesteXError(type, payload));
          setLifecycle('failed');
          emitBoundary(type, payload, 'failed');
          break;
        case 'workout_overview':
        case 'finished_workout':
        case 'workout_completed':
        case 'workout_session_saved':
          setLifecycle('completed');
          beginMotionGrace();
          emitBoundary(type, payload, 'completed');
          break;
        case 'motion_upload_progress':
          setMotionSaveState((s) => (s === 'complete' || s === 'failed' ? s : 'uploading'));
          break;
        case 'session_save_complete':
          clearMotionGrace();
          setMotionSaveState('complete');
          // Merge motion-complete into the same row when a completed envelope exists.
          if (bestStatusRef.current === 'completed' || saveStateRef.current === 'saved') {
            emitBoundary(type, payload, 'completed');
          }
          break;
        case 'motion_upload_error':
          clearMotionGrace();
          setMotionSaveState('failed');
          if (bestStatusRef.current === 'completed' || saveStateRef.current === 'saved') {
            emitBoundary(
              eventsRef.current.workout_session_saved ? 'workout_session_saved' : 'workout_overview',
              eventsRef.current.workout_session_saved || eventsRef.current.workout_overview || payload,
              'completed'
            );
          }
          break;
        case 'mute_speech':
          setCoachMuted(true);
          break;
        case 'unmute_speech':
          setCoachMuted(false);
          break;
        case 'exercise_completed':
        case 'exercise_overview':
          break;
        case 'workout_exit_request':
        case 'exit_kinestex':
          if (bestStatusRef.current === 'completed' || saveStateRef.current === 'saved') {
            break;
          }
          if (
            eventsRef.current.workout_overview ||
            eventsRef.current.finished_workout ||
            eventsRef.current.workout_completed ||
            eventsRef.current.workout_session_saved
          ) {
            emitBoundary(type, payload, 'completed');
          } else {
            emitBoundary(type, payload, 'cancelled');
          }
          break;
        default:
          break;
      }
    },
    [emitBoundary, beginMotionGrace, clearMotionGrace]
  );

  const mountKey = useRef(`kx-${context.item_id || 0}-${clientSessionIdRef.current}`);
  const emitBoundaryRef = useRef(emitBoundary);
  emitBoundaryRef.current = emitBoundary;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const html = document.documentElement;
    const { body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    return () => {
      mountedRef.current = false;
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevOverscroll;
      startedRef.current = false;
      clearMotionGrace();
      // Navigate-away / unmount: record cancel if the session never completed.
      if (
        bestStatusRef.current !== 'completed' &&
        saveStateRef.current !== 'saved' &&
        !notifiedRef.current.completed &&
        !notifiedRef.current.cancelled &&
        !notifiedRef.current.failed
      ) {
        try {
          emitBoundaryRef.current('workout_exit_request', { reason: 'unmount' }, 'cancelled');
        } catch (e) {
          // ignore — component is tearing down
        }
      }
    };
  }, [clearMotionGrace]);

  const showResultCard =
    (lifecycle === 'completed' || lifecycle === 'failed' || lifecycle === 'cancelled') &&
    saveState !== 'idle';
  // Stay mounted (CSS-hidden) while saving / waiting for motion upload events so
  // workout_session_saved + session_save_complete can merge into the same row.
  const motionPending =
    lifecycle === 'completed' &&
    (motionSaveState === 'idle' || motionSaveState === 'uploading');
  const keepSdkMounted =
    saveState === 'idle' || saveState === 'saving' || (saveState === 'saved' && motionPending);

  if (!postData) {
    return createPortal(
      <div
        className="kinestex-session-overlay items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="AI session"
      >
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center max-h-full overflow-y-auto">
          <p className="text-slate-700 font-medium">AI session configuration is missing.</p>
          <button type="button" className="btn-primary mt-4 min-h-10" onClick={onClose}>
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="kinestex-session-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={context.exercise_name ? `AI-Guided Exercise: ${context.exercise_name}` : 'AI-Guided Exercise session'}
    >
      {!showResultCard && (
        <div className="kinestex-session-chrome">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-semibold truncate leading-tight">
              {context.exercise_name || 'AI-Guided Exercise'}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300/90 truncate">
              AI Personal Trainer · {context.sets || 1}×{context.reps || 10}
              {lifecycle === 'paused'
                ? ' · Stay in camera view'
                : lifecycle === 'starting'
                  ? ' · Starting…'
                  : coachMuted
                    ? ' · Coach muted'
                    : ' · Active'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {(lifecycle === 'active' || lifecycle === 'paused') && (
              <button
                type="button"
                className="min-h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg bg-white/15 hover:bg-white/25"
                aria-label={coachMuted ? 'Unmute coach speech' : 'Mute coach speech'}
                aria-pressed={coachMuted}
                title={coachMuted ? 'Unmute coach' : 'Mute coach'}
                onClick={toggleCoachSpeech}
              >
                <FaIcon icon={coachMuted ? 'fa-volume-xmark' : 'fa-volume-high'} className="sm:mr-1.5" />
                <span className="hidden sm:inline">{coachMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}
            <button
              type="button"
              className="min-h-10 px-3 sm:px-4 text-sm font-semibold rounded-lg bg-white/15 hover:bg-white/25"
              aria-label="Exit AI session"
              onClick={() => {
                if (bestStatusRef.current !== 'completed' && saveStateRef.current !== 'saved') {
                  emitBoundary('workout_exit_request', { reason: 'user_exit' }, 'cancelled');
                } else {
                  onClose?.();
                }
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {keepSdkMounted && (
        <div
          className={`kinestex-session-stage${showResultCard ? ' is-hidden' : ''}`}
          key={mountKey.current}
        >
          <KinesteXSDK
            ref={sdkRef}
            data={postData}
            integrationOption={IntegrationOption.CUSTOM_WORKOUT}
            baseUrl={sdk.base_url || 'https://ai.kinestex.com'}
            handleMessage={handleMessage}
            iframeTitle={`KinesteX — ${context.exercise_name || 'Exercise'}`}
            className="kinestex-sdk-root"
            style={{ width: '100%', height: '100%', position: 'relative' }}
          />
        </div>
      )}

      {showResultCard && (
        <div className="kinestex-session-result">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full text-center shadow-xl max-h-full overflow-y-auto">
            {saveState === 'saving' && (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <FaIcon icon="fa-spinner" className="text-xl animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Saving session…</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Please wait while we store your AI-Guided Exercise result.
                </p>
              </>
            )}

            {saveState === 'saved' && lifecycle === 'completed' && (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <FaIcon icon="fa-check" className="text-xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">AI Workout Complete</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Your AI Personal Trainer session was saved. Review objective performance below — this is not a medical diagnosis.
                </p>
                <div className="mt-4 text-left">
                  {persisted?.session?.movement_analysis?.available && persisted?.session ? (
                    <KinesteXMovementAnalysisReport
                      session={{
                        ...persisted.session,
                        exercise_name: context.exercise_name,
                        session_at: persisted.session.completed_at || persisted.session.created_at,
                        metrics: persisted.session.metrics || persisted.metrics,
                      }}
                    />
                  ) : (
                    <KinesteXWorkoutOverview
                      metrics={persisted?.session?.metrics || persisted?.metrics}
                      title="Workout Overview"
                      emptyMessage="Performance metrics were not included in this session result."
                    />
                  )}
                  {(persisted?.session?.metrics?.mistakes != null ||
                    persisted?.metrics?.mistakes != null) && (
                    <p className="text-[11px] text-slate-500 mt-2 rounded-lg bg-slate-50 px-3 py-2">
                      AI Exercise Feedback: mistake count above is from KinesteX session metrics only.
                      It is not a clinical assessment.
                    </p>
                  )}
                  {motionSaveState === 'uploading' && (
                    <p className="text-[11px] text-slate-500 mt-2">
                      Saving movement recording to KinesteX…
                    </p>
                  )}
                  {motionSaveState === 'failed' && (
                    <p className="text-[11px] text-amber-800 mt-2 rounded-lg bg-amber-50 px-3 py-2">
                      Movement recording could not be saved for this session. Performance metrics were still stored.
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  You can still use Mark Complete on your rehab plan if needed.
                </p>
                <button type="button" className="btn-primary mt-5 w-full min-h-10" onClick={onClose}>
                  Done
                </button>
              </>
            )}

            {saveState === 'saved' && lifecycle === 'cancelled' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Session Ended</h2>
                <p className="text-sm text-slate-600 mt-2">AI monitoring was cancelled and recorded.</p>
                <button type="button" className="btn-primary mt-5 w-full min-h-10" onClick={onClose}>
                  Close
                </button>
              </>
            )}

            {saveState === 'saved' && lifecycle === 'failed' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">AI Monitoring Unavailable</h2>
                <p className="text-sm text-slate-600 mt-2">
                  {errorMessage || 'Something went wrong with AI monitoring. The attempt was recorded.'}
                </p>
                <button type="button" className="btn-primary mt-5 w-full min-h-10" onClick={onClose}>
                  Close
                </button>
              </>
            )}

            {saveState === 'save_failed' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Could not save AI session</h2>
                <p className="text-sm text-slate-600 mt-2">
                  {saveError || 'The session result was not stored. This is not marked as saved.'}
                </p>
                <div className="mt-5 grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                  <button type="button" className="btn-outline w-full min-h-10" onClick={onClose}>
                    Close
                  </button>
                  <button type="button" className="btn-primary w-full min-h-10" onClick={retrySave}>
                    Try again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
