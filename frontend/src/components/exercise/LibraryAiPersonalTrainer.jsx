import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ExerciseInstructions from './ExerciseInstructions';
import KinesteXExerciseSession from './KinesteXExerciseSession';
import { MAC_CENTER_STAGE_NOTE } from './macCenterStageNote';
import { kinestex } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { cameraCaptureSupported } from '../../services/kinestexSessionBoundary';
import { catalogueExerciseAiMapped, libraryAiPanelState } from '../../utils/libraryAiTrainer';
import toast from 'react-hot-toast';

function launchPayloadReady(payload) {
  const sdk = payload?.sdk;
  return !!(
    sdk?.session
    && sdk?.company
    && Array.isArray(sdk.customWorkoutExercises)
    && sdk.customWorkoutExercises.length
    && !sdk.key
    && !sdk.api_key
    && !payload?.api_key
  );
}

/**
 * Exercise Library entry point for an assigned, KinesteX-mapped exercise.
 * Starts the existing Custom Workout session. Does not invent tracking or scores.
 */
export default function LibraryAiPersonalTrainer({ exercise }) {
  const location = useLocation();
  const auth = useAuth() || {};
  const authLoading = !!auth.loading;
  const [integrationActive, setIntegrationActive] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [sessionPayload, setSessionPayload] = useState(null);
  const [savedNote, setSavedNote] = useState('');

  const exerciseId = Number(exercise?.id) || 0;
  const catalogueMapped = catalogueExerciseAiMapped(exercise);

  useEffect(() => {
    let cancelled = false;
    setIntegrationActive(null);
    kinestex
      .settings()
      .then((res) => {
        if (!cancelled) setIntegrationActive(!!res?.data?.enabled);
      })
      .catch(() => {
        if (!cancelled) setIntegrationActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setEligibility(null);
    setEligibilityError('');
    setSavedNote('');
    setSessionPayload(null);
    if (authLoading || integrationActive !== true || !catalogueMapped || exerciseId < 1) {
      setEligibilityLoading(false);
      return undefined;
    }

    let cancelled = false;
    setEligibilityLoading(true);
    kinestex
      .libraryEligibility(exerciseId)
      .then((res) => {
        if (!cancelled) setEligibility(res?.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setEligibility(null);
          setEligibilityError(err?.message || 'Unable to check AI monitoring right now.');
        }
      })
      .finally(() => {
        if (!cancelled) setEligibilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, integrationActive, catalogueMapped, exerciseId, auth.user?.id]);

  const panel = libraryAiPanelState({
    settingsLoaded: !authLoading && integrationActive !== null,
    integrationActive: integrationActive === true,
    catalogueMapped,
    eligibility,
    eligibilityLoading: eligibilityLoading && !eligibilityError,
    cameraSupported: cameraCaptureSupported(),
  });
  const phase = eligibilityError ? 'error' : panel.phase;
  const message = eligibilityError || panel.message;

  const start = async () => {
    if (!panel.canStart || preparing || sessionPayload || exerciseId < 1) return;
    setPreparing(true);
    setSavedNote('');
    try {
      const res = await kinestex.prepareLibrarySession({ exercise_id: exerciseId });
      if (!launchPayloadReady(res?.data)) {
        throw new Error('AI session could not be prepared.');
      }
      setSessionPayload(res.data);
    } catch (err) {
      const msg = err?.message || 'Could not start AI monitoring';
      if (/camera/i.test(msg)) {
        toast.error('Camera access is required for AI monitoring. Please allow camera access and try again.');
      } else {
        toast.error(msg);
      }
    } finally {
      setPreparing(false);
    }
  };

  const assignment = panel.assignment;
  const tone =
    phase === 'ready'
      ? 'border-teal-200 bg-teal-50/90 text-teal-950'
      : phase === 'loading'
        ? 'border-slate-200 bg-white text-slate-600'
        : phase === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-950'
          : 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <section className={`rounded-xl border px-4 py-3.5 text-sm ${tone}`} aria-label="AI Personal Trainer">
      <p className="font-semibold flex items-center gap-1.5">
        <FaIcon icon="fa-person-walking" aria-hidden="true" />
        AI Personal Trainer
      </p>

      {phase === 'loading' ? (
        <p className="mt-1 text-xs text-slate-500">Checking whether this exercise can be monitored…</p>
      ) : (
        <p className="mt-1 text-xs leading-relaxed opacity-90">{message}</p>
      )}

      {phase === 'ready' && assignment && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="bg-white/80 border border-teal-100 px-2.5 py-1.5 rounded-lg font-semibold">
            {assignment.sets || 1} sets
          </span>
          <span className="bg-white/80 border border-teal-100 px-2.5 py-1.5 rounded-lg font-semibold">
            {assignment.reps_label || assignment.reps || 10} reps
          </span>
          {assignment.hold_seconds ? (
            <span className="bg-white/80 border border-teal-100 px-2.5 py-1.5 rounded-lg">Hold {assignment.hold_seconds}s</span>
          ) : null}
          {assignment.rest_seconds != null ? (
            <span className="bg-white/80 border border-teal-100 px-2.5 py-1.5 rounded-lg">Rest {assignment.rest_seconds}s</span>
          ) : null}
          {assignment.frequency ? (
            <span className="bg-white/80 border border-teal-100 px-2.5 py-1.5 rounded-lg">{assignment.frequency}</span>
          ) : null}
        </div>
      )}

      {phase === 'ready' && assignment?.special_instructions ? (
        <p className="mt-3 text-xs leading-relaxed whitespace-pre-wrap rounded-lg bg-white/70 border border-teal-100 px-3 py-2">
          <span className="font-semibold">Therapist notes: </span>
          {assignment.special_instructions}
        </p>
      ) : null}

      {(phase === 'ready' || phase === 'camera_unavailable') && (
        <>
          <div className="mt-3">
            <ExerciseInstructions
              steps={exercise?.steps}
              instructions={exercise?.instructions}
              exercise_instructions={exercise?.exercise_instructions}
              compact
            />
          </div>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950">
            <p className="text-xs font-semibold text-amber-800 mb-1">Camera</p>
            <p className="text-xs leading-relaxed">
              Required — your browser will ask for permission when the AI workout starts. KinesteX monitors the movement; this page does not estimate repetitions or posture scores.
            </p>
            <p className="text-xs leading-relaxed mt-1.5">{MAC_CENTER_STAGE_NOTE}</p>
          </div>
          <p className="mt-2 text-xs text-teal-900/80">
            Monitoring status: {preparing ? 'Preparing the KinesteX session…' : 'Not started'}
          </p>
        </>
      )}

      {savedNote ? <p className="mt-2 text-xs font-medium text-teal-800">{savedNote}</p> : null}

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        {panel.canStart && (
          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-11 text-sm"
            disabled={preparing || !!sessionPayload}
            onClick={start}
          >
            <FaIcon icon="fa-person-walking" aria-hidden="true" />
            {preparing ? 'Starting…' : 'Start AI Personal Trainer'}
          </button>
        )}
        {panel.showSignIn && (
          <Link
            to="/patient/login"
            state={{ from: `${location.pathname}${location.search}` }}
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-11 text-sm"
          >
            Sign in to start
          </Link>
        )}
        {panel.showPlanLink && (
          <Link to="/patient/exercises" className="btn-outline inline-flex items-center justify-center gap-2 min-h-11 text-sm">
            Open my rehab plan
          </Link>
        )}
      </div>

      {sessionPayload && (
        <KinesteXExerciseSession
          sessionPayload={sessionPayload}
          onClose={() => setSessionPayload(null)}
          onCompleted={(result) => {
            if (result?.persisted) {
              setSavedNote('Your AI Personal Trainer session was saved to your rehab plan.');
              toast.success('AI session saved');
            }
          }}
          onCancelled={(result) => {
            if (result?.persisted) {
              setSavedNote('The AI session was cancelled and saved on your rehab plan.');
            }
          }}
          onFailed={(result) => {
            if (result?.persisted) {
              setSavedNote('AI monitoring could not finish. The attempt was saved on your rehab plan.');
            }
          }}
        />
      )}
    </section>
  );
}
