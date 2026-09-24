import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import ExerciseBottomSheet from '../exercise/ExerciseBottomSheet';
import KinesteXAiExercisePrepBrief from '../exercise/KinesteXAiExercisePrepBrief';
import KinesteXAiPerformancePanel from '../exercise/KinesteXAiPerformancePanel';
import KinesteXMovementAnalysisReport from '../exercise/KinesteXMovementAnalysisReport';
import KinesteXWorkoutOverview from '../exercise/KinesteXWorkoutOverview';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { kinestex } from '../../services/api';

function formatWhen(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-amber-50 text-amber-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
}

function latestByItem(sessions) {
  const map = {};
  (sessions || []).forEach((s) => {
    const key = String(s.item_id ?? '');
    if (!key || key === '0' || map[key]) return;
    map[key] = s;
  });
  return map;
}

/**
 * TeleRehab / Consultation Room KinesteX AI layer.
 * Patient starts AI on their device; clinicians review same kinestex_sessions rows
 * but never start the patient's camera. Does not change appointment/consultation status.
 */
export default function ConsultationAiMonitoring({
  room,
  prescriptionId,
  exercises = [],
  refreshTick = 0,
  aiSessionActive = false,
  onRequestStart,
}) {
  const viewer = room?.viewer;
  const isPatient = viewer === 'patient';
  const isClinician = viewer === 'doctor' || viewer === 'clinic' || viewer === 'admin';
  const appointmentId = room?.appointment?.id;
  const patientId = room?.patient?.id;
  const [latest, setLatest] = useState({});
  const [aiPrepEx, setAiPrepEx] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [peek, setPeek] = useState(null);
  const [peekLoading, setPeekLoading] = useState(false);
  const [peekError, setPeekError] = useState('');
  const startLock = useRef(false);

  const eligible = useMemo(
    () => (exercises || []).filter((ex) => !!ex.ai_monitoring_effective),
    [exercises]
  );

  const loadLatest = useCallback(() => {
    if (!prescriptionId) {
      setLatest({});
      return;
    }
    if (isPatient) {
      kinestex
        .listSessions({ prescription_id: prescriptionId, per_page: 20, page: 1 })
        .then((res) => {
          const data = res?.data ?? res;
          const sessions = Array.isArray(data) ? data : data?.sessions || [];
          setLatest(latestByItem(sessions));
        })
        .catch(() => setLatest({}));
      return;
    }
    if (isClinician && patientId) {
      kinestex
        .analysisSessions({
          patient_id: patientId,
          prescription_id: prescriptionId,
          page: 1,
          per_page: 10,
        })
        .then((res) => {
          const data = res?.data ?? res;
          setLatest(latestByItem(data?.sessions || []));
        })
        .catch(() => setLatest({}));
    }
  }, [prescriptionId, isPatient, isClinician, patientId]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest, refreshTick]);

  useEffect(() => {
    if (!aiSessionActive) {
      startLock.current = false;
    }
  }, [aiSessionActive]);

  const openPrep = (ex) => {
    if (!isPatient || !ex?.ai_monitoring_effective || startLock.current || preparing || aiSessionActive) return;
    if (!appointmentId) {
      toast.error('This consultation appointment is required to start TeleRehab AI.');
      return;
    }
    setAiPrepEx(ex);
  };

  const continueAi = async () => {
    if (!isPatient || !aiPrepEx || startLock.current) return;
    if (!aiPrepEx.ai_monitoring_effective) {
      toast.error('AI monitoring is not available for this exercise.');
      return;
    }
    if (!appointmentId || !prescriptionId) {
      toast.error('Consultation appointment is required for TeleRehab AI.');
      return;
    }
    startLock.current = true;
    setPreparing(true);
    try {
      const res = await kinestex.prepareSession({
        prescription_id: prescriptionId,
        item_id: aiPrepEx.id,
        appointment_id: appointmentId,
      });
      const payload = res.data;
      if (!payload?.sdk?.key || !payload?.sdk?.company || !payload?.sdk?.customWorkoutExercises?.length) {
        throw new Error('AI session could not be prepared.');
      }
      setAiPrepEx(null);
      onRequestStart?.(payload);
      // Keep startLock until parent aiSessionActive / close clears the flow (PatientExercises pattern).
      setPreparing(false);
    } catch (err) {
      startLock.current = false;
      const msg = err.message || 'Could not start AI monitoring';
      if (/camera/i.test(msg)) {
        toast.error('Camera access is required for AI monitoring. Please allow camera access and try again.');
      } else {
        toast.error(msg);
      }
      setPreparing(false);
    }
  };

  const openPeek = async (session, exerciseName) => {
    if (!session?.id) return;
    setPeekLoading(true);
    setPeekError('');
    setPeek({ ...session, exercise_name: exerciseName || session.exercise_name });
    try {
      const res = isPatient
        ? await kinestex.getSession(session.id)
        : await kinestex.analysisSession(session.id);
      const data = res?.data ?? res;
      if (!data || typeof data !== 'object') {
        throw new Error('Could not load this AI session.');
      }
      setPeek({
        ...data,
        exercise_name: exerciseName || data.exercise_name || session.exercise_name,
      });
    } catch (err) {
      const status = err?.status;
      const msg =
        status === 403
          ? 'You are not authorized to view this AI session.'
          : status === 404
            ? 'This AI session was not found.'
            : err?.message || 'Could not load AI performance.';
      setPeekError(msg);
    } finally {
      setPeekLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3 md:p-4 space-y-3 min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
            <FaIcon icon="fa-person-walking" className="text-teal-700 shrink-0" />
            <span className="min-w-0">TeleRehab AI Monitoring</span>
            <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              Consultation
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Optional KinesteX layer on the patient’s device during this visit. Zoom stays open.
            AI cancel/fail does not change appointment status. Manual HEP Complete / Skip is unchanged.
          </p>
          {isClinician ? (
            <p className="text-[11px] text-teal-800 mt-1.5 rounded-lg bg-teal-50/80 border border-teal-100 px-2.5 py-1.5">
              Clinicians review Workout Overview and Movement Analysis here. Only the patient can start the AI camera
              session on their device.
            </p>
          ) : null}
        </div>
        <button type="button" onClick={loadLatest} className="text-xs text-slate-500 hover:text-teal-700 font-medium min-h-10 px-2 shrink-0">
          <FaIcon icon="fa-arrows-rotate" className="mr-1" />
          Refresh
        </button>
      </div>

      {eligible.length === 0 ? (
        <p className="text-xs text-slate-500">No AI-enabled exercises on this rehab plan.</p>
      ) : (
        <ul className="space-y-2 min-w-0">
          {eligible.map((ex) => {
            const session = latest[String(ex.id)];
            const metrics = session?.metrics || {};
            return (
              <li key={ex.id} className="rounded-xl bg-white border border-teal-100 px-3 py-2.5 min-w-0">
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 break-words">
                      {ex.exercise_name}
                      <span className="ml-2 align-middle text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                        AI enabled
                      </span>
                    </p>
                    {session ? (
                      <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                        Latest: {formatWhen(session.session_at || session.completed_at || session.created_at)} ·{' '}
                        <span className={`uppercase font-bold px-1.5 py-0.5 rounded-full ${statusClass(session.session_status)}`}>
                          {session.session_status}
                        </span>
                        {metrics.repetitions != null ? ` · ${metrics.repetitions} reps` : ''}
                        {metrics.accuracy != null ? ` · ${metrics.accuracy}%` : ''}
                        {metrics.score != null ? ` · score ${metrics.score}` : ''}
                        {session.movement_analysis?.available ? ' · Movement Analysis' : ''}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">No AI-monitored session saved yet for this exercise.</p>
                    )}
                  </div>
                  <div className="flex flex-col min-[375px]:flex-row min-[375px]:flex-wrap min-[375px]:items-center gap-2">
                    {isPatient ? (
                      <button
                        type="button"
                        className="btn-outline !py-1.5 !px-3 text-xs min-h-10 border-teal-300 text-teal-800 hover:bg-teal-50 w-full min-[375px]:w-auto"
                        disabled={aiSessionActive || preparing || !appointmentId}
                        onClick={() => openPrep(ex)}
                      >
                        <FaIcon icon="fa-person-walking" className="mr-1" /> Start AI-Guided Exercise
                      </button>
                    ) : (
                      <p className="text-[11px] text-teal-800 font-medium bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-2 w-full min-[375px]:w-auto">
                        View only — patient starts AI on their device
                      </p>
                    )}
                    {session && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-teal-700 min-h-10 px-2 w-full min-[375px]:w-auto text-left min-[375px]:text-center"
                        onClick={() => openPeek(session, ex.exercise_name)}
                      >
                        View AI Performance
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isClinician && patientId ? (
        <div className="min-w-0 max-w-full overflow-x-hidden">
          <KinesteXAiPerformancePanel
            patientId={patientId}
            prescriptionId={prescriptionId}
            title="Consultation AI Performance"
            compact
            refreshTick={refreshTick}
          />
        </div>
      ) : null}

      <ExerciseBottomSheet
        open={!!aiPrepEx && !aiSessionActive}
        onClose={() => {
          if (!preparing) setAiPrepEx(null);
        }}
        title="Pre-Exercise Setup"
        subtitle={aiPrepEx ? aiPrepEx.exercise_name : 'Review guidance before AI'}
        icon="fa-clipboard-list"
        className="md:!max-w-3xl lg:!max-w-4xl"
        footer={
          <>
            <button type="button" className="btn-outline text-xs sm:text-sm" disabled={preparing} onClick={() => setAiPrepEx(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs sm:text-sm"
              disabled={preparing || !aiPrepEx?.ai_monitoring_effective || !appointmentId}
              onClick={continueAi}
            >
              {preparing ? 'Starting…' : 'Start AI Exercise'}
            </button>
          </>
        }
      >
        {aiPrepEx ? (
          <KinesteXAiExercisePrepBrief
            exercise={aiPrepEx}
            cameraNote="Camera is required on this device. The Zoom consultation stays open — cancelling or failing AI monitoring will not end this visit."
            footerNote="Position yourself so your full movement is visible. Your prescribed HEP sets and reps stay unchanged."
          />
        ) : null}
      </ExerciseBottomSheet>

      <GlassModal open={!!peek} onClose={() => setPeek(null)} size="lg" zIndex={10060}>
        <GlassModalHeader
          title="AI Performance"
          subtitle={peek?.exercise_name || 'TeleRehab AI session'}
          icon="fa-person-walking"
          accent="emerald"
          onClose={() => setPeek(null)}
        />
        <GlassModalBody>
          {peekLoading && !peek?.metrics ? (
            <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ) : peekError ? (
            <p className="text-sm text-rose-700">{peekError}</p>
          ) : peek ? (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  AI Monitored
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(peek.session_status)}`}>
                  {peek.session_status}
                </span>
                {peek.movement_analysis?.available ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800">
                    Movement Analysis available
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                {formatWhen(peek.session_at || peek.completed_at || peek.created_at)}
              </p>
              <KinesteXWorkoutOverview
                metrics={peek.metrics}
                title="Workout Overview"
                emptyMessage="Performance metrics were not included in this session result."
              />
              <KinesteXMovementAnalysisReport
                session={peek}
                title="Movement Analysis"
                showMetrics={false}
              />
              <p className="text-[11px] text-slate-400">
                Same persisted KinesteX session as My Progress / clinician AI Performance. Replay loads only on demand.
              </p>
            </div>
          ) : null}
        </GlassModalBody>
        <GlassModalFooter className="[&>button]:w-full sm:[&>button]:w-auto">
          <button type="button" className="btn-outline min-h-10" onClick={() => setPeek(null)}>
            Close
          </button>
        </GlassModalFooter>
      </GlassModal>
    </div>
  );
}
