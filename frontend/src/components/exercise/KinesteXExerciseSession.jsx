import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KinesteXSDK, IntegrationOption } from 'kinestex-sdk-react-ts';
import FaIcon from '../FaIcon';
import {
  buildKinesteXSessionResult,
  onKinesteXSessionCompleted,
  patientFriendlyKinesteXError,
} from '../../services/kinestexSessionBoundary';

/**
 * Official KinesteX Custom Workout session (Phase 4).
 *
 * Sources:
 * - npm: kinestex-sdk-react-ts (docs: https://www.kinestex.com/docs/installation)
 * - IntegrationOption.CUSTOM_WORKOUT → /custom-workout
 * - postData: key, company, userId, customWorkoutExercises
 * - On all_resources_loaded → sendAction("workout_activity_action", "start")
 *
 * Does not invent SDK methods or fake results.
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
  const closedRef = useRef(false);
  const eventsRef = useRef({});

  const [lifecycle, setLifecycle] = useState('starting');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastResult, setLastResult] = useState(null);

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
      if (closedRef.current) return;
      closedRef.current = true;
      if (kind === 'completed' && onCompleted) onCompleted(result);
      else if (kind === 'failed' && onFailed) onFailed(result);
      else if (kind === 'cancelled' && onCancelled) onCancelled(result);
    },
    [onCompleted, onFailed, onCancelled]
  );

  const emitBoundary = useCallback(
    (eventType, eventData, kind) => {
      try {
        const result = buildKinesteXSessionResult({
          eventType,
          eventData,
          context,
          collected: { ...eventsRef.current },
        });
        if (kind === 'completed') {
          onKinesteXSessionCompleted(result);
        }
        setLastResult(result);
        setLifecycle(kind === 'completed' ? 'completed' : kind === 'failed' ? 'failed' : 'cancelled');
        finish(kind, result);
      } catch (e) {
        setLifecycle('failed');
        setErrorMessage('Could not process the AI session result.');
        finish('failed', null);
      }
    },
    [context, finish]
  );

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
          setLifecycle('active');
          if (!startedRef.current && sdkRef.current?.sendAction) {
            startedRef.current = true;
            try {
              // Official Custom Workout start action
              sdkRef.current.sendAction('workout_activity_action', 'start');
            } catch (e) {
              setErrorMessage('AI monitoring could not start. Please try again.');
              setLifecycle('failed');
              emitBoundary('error_occurred', { message: 'start_failed' }, 'failed');
            }
          }
          break;
        case 'workout_started':
          setLifecycle('active');
          break;
        case 'left_camera_frame':
          setLifecycle('paused');
          break;
        case 'returned_camera_frame':
          setLifecycle('active');
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
          // Accumulate; wait for workout-level completion when available.
          break;
        case 'workout_exit_request':
        case 'exit_kinestex':
          if (lifecycle === 'completed' || closedRef.current) {
            break;
          }
          // If we already saw workout stats, treat exit as completed; else cancelled.
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
    [emitBoundary, lifecycle]
  );

  // StrictMode-safe: only mount SDK once per sessionPayload identity.
  const mountKey = useRef(`kx-${context.item_id || 0}-${Date.now()}`);

  useEffect(() => {
    return () => {
      closedRef.current = true;
      startedRef.current = false;
      // SDK package removes its window message listener on unmount.
    };
  }, []);

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

  if (lifecycle === 'completed') {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <FaIcon icon="fa-check" className="text-xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Exercise Complete</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your AI-monitored exercise session is complete.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            You can still use Mark Complete on your rehab plan if needed.
          </p>
          <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (lifecycle === 'failed') {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">AI Monitoring Unavailable</h2>
          <p className="text-sm text-slate-600 mt-2">
            {errorMessage || 'Something went wrong with AI monitoring.'}
          </p>
          <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (lifecycle === 'cancelled') {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">Session Ended</h2>
          <p className="text-sm text-slate-600 mt-2">AI monitoring was cancelled.</p>
          <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{context.exercise_name || 'AI Exercise'}</p>
          <p className="text-xs text-slate-400">
            Target: {context.sets || 1} sets × {context.reps || 10} reps
            {lifecycle === 'paused' ? ' · Stay in camera view' : lifecycle === 'starting' ? ' · Starting…' : ' · Active'}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          onClick={() => {
            if (!closedRef.current) {
              emitBoundary('workout_exit_request', { reason: 'user_exit' }, 'cancelled');
            }
            onClose?.();
          }}
        >
          Exit
        </button>
      </div>
      <div className="flex-1 relative min-h-0" key={mountKey.current}>
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
    </div>
  );
}
