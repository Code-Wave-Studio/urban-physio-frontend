import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import ExerciseBottomSheet from '../exercise/ExerciseBottomSheet';
import KinesteXAiPerformancePanel from '../exercise/KinesteXAiPerformancePanel';
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
 * Consultation Room KinesteX layer (Phase 8).
 * Patient starts the existing SDK session; clinicians view the same kinestex_sessions rows.
 * Does not change appointment / consultation status.
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

  const openPrep = (ex) => {
    if (!isPatient || !ex?.ai_monitoring_effective || startLock.current || preparing || aiSessionActive) return;
    setAiPrepEx(ex);
  };

  const continueAi = async () => {
    if (!isPatient || !aiPrepEx || startLock.current) return;
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
    } catch (err) {
      const msg = err.message || 'Could not start AI monitoring';
      if (/camera/i.test(msg)) {
        toast.error('Camera access is required for AI monitoring. Please allow camera access and try again.');
      } else {
        toast.error(msg);
      }
    } finally {
      startLock.current = false;
      setPreparing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3 md:p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FaIcon icon="fa-person-walking" className="text-teal-700" />
            AI Exercise Monitoring
            <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              AI Monitored
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Optional KinesteX layer. Manual HEP Complete / Skip is unchanged. AI cancel or fail does not change this consultation.
          </p>
        </div>
        <button type="button" onClick={loadLatest} className="text-xs text-slate-500 hover:text-teal-700 font-medium">
          <FaIcon icon="fa-arrows-rotate" className="mr-1" />
          Refresh
        </button>
      </div>

      {eligible.length === 0 ? (
        <p className="text-xs text-slate-500">No AI-enabled exercises on this rehab plan.</p>
      ) : (
        <ul className="space-y-2">
          {eligible.map((ex) => {
            const session = latest[String(ex.id)];
            const metrics = session?.metrics || {};
            return (
              <li key={ex.id} className="rounded-xl bg-white border border-teal-100 px-3 py-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{ex.exercise_name}</p>
                    {session ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Latest: {formatWhen(session.session_at || session.completed_at || session.created_at)} ·{' '}
                        <span className={`uppercase font-bold px-1.5 py-0.5 rounded-full ${statusClass(session.session_status)}`}>
                          {session.session_status}
                        </span>
                        {metrics.repetitions != null ? ` · ${metrics.repetitions} reps` : ''}
                        {metrics.accuracy != null ? ` · ${metrics.accuracy}%` : ''}
                        {metrics.score != null ? ` · score ${metrics.score}` : ''}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">No AI-monitored session saved yet for this exercise.</p>
                    )}
                  </div>
                  {isPatient ? (
                    <button
                      type="button"
                      className="btn-outline !py-1.5 !px-3 text-xs border-teal-300 text-teal-800 hover:bg-teal-50 self-start"
                      disabled={aiSessionActive || preparing}
                      onClick={() => openPrep(ex)}
                    >
                      <FaIcon icon="fa-person-walking" className="mr-1" /> Start AI Monitoring
                    </button>
                  ) : (
                    <p className="text-[11px] text-teal-800 font-medium self-start">
                      Patient starts this on their device
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isClinician && patientId ? (
        <KinesteXAiPerformancePanel
          patientId={patientId}
          prescriptionId={prescriptionId}
          title="Consultation AI Performance"
          compact
          refreshTick={refreshTick}
        />
      ) : null}

      <ExerciseBottomSheet
        open={!!aiPrepEx && !aiSessionActive}
        onClose={() => {
          if (!preparing) setAiPrepEx(null);
        }}
        title="Prepare for AI Exercise"
        subtitle={aiPrepEx?.exercise_name}
        icon="fa-person-walking"
        footer={
          <>
            <button type="button" className="btn-outline text-xs sm:text-sm" disabled={preparing} onClick={() => setAiPrepEx(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary text-xs sm:text-sm" disabled={preparing} onClick={continueAi}>
              {preparing ? 'Starting…' : 'Continue'}
            </button>
          </>
        }
      >
        {aiPrepEx && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              {aiPrepEx.sets || 1} sets × {aiPrepEx.reps || 10} reps
              {aiPrepEx.hold_seconds ? ` · hold ${aiPrepEx.hold_seconds}s` : ''}
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Camera is required. The Zoom consultation stays open — cancelling or failing AI monitoring will not end this visit.
            </p>
          </div>
        )}
      </ExerciseBottomSheet>
    </div>
  );
}
