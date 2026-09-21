import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KinesteXSDK, IntegrationOption } from 'kinestex-sdk-react-ts';
import FaIcon from '../FaIcon';
import {
  buildKinesteXSessionResult,
  newClientSessionId,
  onKinesteXSessionCompleted,
  patientFriendlyKinesteXError,
  patientFriendlySaveError,
} from '../../services/kinestexSessionBoundary';
import { kinestex } from '../../services/api';

/**
 * Official KinesteX Custom Workout session (Phase 4 + Phase 5 persistence).
 *
 * Sources:
 * - npm: kinestex-sdk-react-ts (docs: https://www.kinestex.com/docs/installation)
 * - IntegrationOption.CUSTOM_WORKOUT → /custom-workout
 * - postData: key, company, userId, customWorkoutExercises
 * - On all_resources_loaded → sendAction("workout_activity_action", "start")
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
  const clientSessionIdRef = useRef(newClientSessionId());
  const startedAtRef = useRef(new Date().toISOString());
  const eventsRef = useRef({});

  const [lifecycle, setLifecycle] = useState('starting');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | save_failed
  const [saveError, setSaveError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [persisted, setPersisted] = useState(null);

  const postData = useMemo(() => {
    if (!sdk) return null;
    return {
      key: sdk.key,
      company: sdk.company,
      userId: sdk.userId,
      customWorkoutExercises: sdk.customWorkoutExercises || [],
      shouldSendStats: sdk.shouldSendStats !== false,
      style: sdk.style || { style: 'light' },
    };
  }, [sdk]);

  const finish = useCallback(
    (kind, result) => {
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
      if (saveState === 'saved' && kind !== 'completed') {
        return;
      }
      if (persistInFlightRef.current && saveState === 'saving' && kind !== 'completed') {
        return;
      }
      persistInFlightRef.current = true;
      if (saveState !== 'saved') {
        setSaveState('saving');
      }
      setSaveError('');
      try {
        const saved = await onKinesteXSessionCompleted(result, (payload) =>
          kinestex.saveSessionResult(payload)
        );
        setPersisted(saved);
        setSaveState('saved');
        finish(kind, { ...result, persisted: saved });
      } catch (err) {
        persistInFlightRef.current = false;
        setSaveState('save_failed');
        setSaveError(patientFriendlySaveError(err));
      }
    },
    [finish, saveState]
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

        const alreadySaved = saveState === 'saved';
        if (alreadySaved && kind !== 'completed') {
          return;
        }
        persistResult(result, kind);
      } catch (e) {
        setLifecycle('failed');
        setErrorMessage('Could not process the AI session result.');
        setSaveState('save_failed');
        setSaveError('Could not process the AI session result.');
      }
    },
    [context, persistResult, saveState]
  );

  const retrySave = useCallback(() => {
    if (!lastResult) return;
    persistInFlightRef.current = false;
    persistResult(lastResult, lastResult.status === 'failed' ? 'failed' : lastResult.status === 'cancelled' ? 'cancelled' : 'completed');
  }, [lastResult, persistResult]);

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
          emitBoundary(type, payload, 'completed');
          break;
        case 'exercise_completed':
        case 'exercise_overview':
          break;
        case 'workout_exit_request':
        case 'exit_kinestex':
          if (bestStatusRef.current === 'completed' || saveState === 'saved') {
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
    [emitBoundary, saveState]
  );

  const mountKey = useRef(`kx-${context.item_id || 0}-${clientSessionIdRef.current}`);

  useEffect(() => {
    return () => {
      startedRef.current = false;
    };
  }, []);

  const showResultCard =
    (lifecycle === 'completed' || lifecycle === 'failed' || lifecycle === 'cancelled') &&
    saveState !== 'idle';

  if (!postData) {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-slate-700 font-medium">AI session configuration is missing.</p>
          <button type="button" className="btn-primary mt-4" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col">
      {!showResultCard && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{context.exercise_name || 'AI Exercise'}</p>
            <p className="text-xs text-slate-400">
              Target: {context.sets || 1} sets × {context.reps || 10} reps
              {lifecycle === 'paused'
                ? ' · Stay in camera view'
                : lifecycle === 'starting'
                  ? ' · Starting…'
                  : ' · Active'}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
            onClick={() => {
              if (bestStatusRef.current !== 'completed' && saveState !== 'saved') {
                emitBoundary('workout_exit_request', { reason: 'user_exit' }, 'cancelled');
              } else {
                onClose?.();
              }
            }}
          >
            Exit
          </button>
        </div>
      )}

      <div className={`flex-1 relative min-h-0 ${showResultCard ? 'hidden' : ''}`} key={mountKey.current}>
        <KinesteXSDK
          ref={sdkRef}
          data={postData}
          integrationOption={IntegrationOption.CUSTOM_WORKOUT}
          baseUrl={sdk.base_url || 'https://ai.kinestex.com'}
          handleMessage={handleMessage}
          iframeTitle={`KinesteX — ${context.exercise_name || 'Exercise'}`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {showResultCard && (
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/80">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
            {saveState === 'saving' && (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <FaIcon icon="fa-spinner" className="text-xl animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Saving session…</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Please wait while we store your AI exercise result.
                </p>
              </>
            )}

            {saveState === 'saved' && lifecycle === 'completed' && (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <FaIcon icon="fa-check" className="text-xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Exercise Complete</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Your AI-monitored exercise session was saved.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  You can still use Mark Complete on your rehab plan if needed.
                </p>
                <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
                  Done
                </button>
              </>
            )}

            {saveState === 'saved' && lifecycle === 'cancelled' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Session Ended</h2>
                <p className="text-sm text-slate-600 mt-2">AI monitoring was cancelled and recorded.</p>
                <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
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
                <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
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
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-outline w-full" onClick={onClose}>
                    Close
                  </button>
                  <button type="button" className="btn-primary w-full" onClick={retrySave}>
                    Try again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
