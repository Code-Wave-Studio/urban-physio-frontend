import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { kinestex } from '../../services/api';
import KinesteXWorkoutOverview, {
  buildWorkoutOverviewRows,
  formatAccuracy,
} from './KinesteXWorkoutOverview';
import KinesteXMovementAnalysisReport from './KinesteXMovementAnalysisReport';

function na(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return value;
}

function formatWhen(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function statusClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-amber-50 text-amber-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
}

function authErrorMessage(err) {
  const status = err?.status;
  const msg = err?.message || '';
  if (status === 401 || /invalid or expired token|unauthorized/i.test(msg)) {
    return 'Please sign in again to view your AI sessions.';
  }
  if (status === 403 || /forbidden/i.test(msg)) {
    return 'You are not authorized to view this AI session.';
  }
  if (status === 404 || /not found/i.test(msg)) {
    return 'This AI session was not found.';
  }
  if (err?.code === 'ERR_NETWORK' || /network/i.test(msg)) {
    return 'Network error. Check your connection and try again.';
  }
  return msg || 'Could not load AI sessions.';
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function metricChips(metrics) {
  return buildWorkoutOverviewRows(metrics).map((row) => ({
    label: row.label === 'Repetitions' ? 'Reps' : row.label,
    value: row.value,
  }));
}

/**
 * Patient KinesteX AI session history (Phase 7).
 * Reads persisted kinestex_sessions via GET /kinestex/sessions (JWT identity only).
 * Null metrics stay hidden on cards / N/A in detail — never coerced to 0.
 */
export default function KinesteXPatientAiHistory({ refreshTick = 0, onGoToExercises }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [page, setPage] = useState(1);
  const [exerciseId, setExerciseId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {
      page,
      per_page: 20,
    };
    if (exerciseId) params.exercise_id = exerciseId;
    if (status) params.session_status = status;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    kinestex
      .listSessions(params)
      .then((res) => {
        const data = res?.data ?? res;
        if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
          throw new Error('Could not read AI session history.');
        }
        if (Array.isArray(data)) {
          setPayload({
            sessions: data,
            summary: {},
            exercise_options: [],
            pagination: { page: 1, pages: 1, total: data.length, per_page: data.length },
          });
          return;
        }
        setPayload(data);
      })
      .catch((err) => {
        const msg = authErrorMessage(err);
        setError(msg);
        setPayload(null);
        if (err?.status !== 401 && err?.status !== 403) {
          toast.error(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [page, exerciseId, status, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load, refreshTick]);

  useEffect(() => {
    setPage(1);
  }, [exerciseId, status, dateFrom, dateTo]);

  const openDetail = async (session) => {
    setDetailLoading(true);
    setDetailError('');
    setDetail(session);
    try {
      const res = await kinestex.getSession(session.id);
      const data = res?.data ?? res;
      if (!data || typeof data !== 'object') {
        throw new Error('Could not read this AI session.');
      }
      setDetail(data);
    } catch (err) {
      setDetailError(authErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const sessions = payload?.sessions || [];
  const summary = payload?.summary || {};
  const pagination = payload?.pagination || { page: 1, pages: 1, total: 0 };
  const exerciseOptions = payload?.exercise_options || [];

  return (
    <div className="glass-card !p-4 md:!p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FaIcon icon="fa-person-walking" className="text-teal-600" />
          AI session history
          <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
            AI Monitored
          </span>
        </h3>
        <button type="button" onClick={load} className="text-xs text-slate-500 hover:text-teal-700 font-medium">
          <FaIcon icon="fa-arrows-rotate" className="mr-1" />
          Refresh
        </button>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        KinesteX AI-monitored sessions saved for you. These are separate from manual HEP Complete / Skip logs.
        Available metrics from KinesteX are shown; fields the provider omitted stay hidden.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3 min-w-0">
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">Exercise</label>
          <select
            className="input-field w-full min-w-0 !py-1.5 text-sm mt-0.5"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          >
            <option value="">All</option>
            {exerciseOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">Status</label>
          <select
            className="input-field w-full min-w-0 !py-1.5 text-sm mt-0.5"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">From</label>
          <input
            type="date"
            className="input-field w-full min-w-0 !py-1.5 text-sm mt-0.5"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">To</label>
          <input
            type="date"
            className="input-field w-full min-w-0 !py-1.5 text-sm mt-0.5"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            className="btn-outline !py-1.5 !px-3 text-xs w-full"
            onClick={() => {
              setExerciseId('');
              setStatus('');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
      ) : error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-4 text-sm text-rose-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            <Metric label="AI sessions" value={summary.total_ai_sessions ?? 0} />
            <Metric label="Completed" value={summary.completed_ai_sessions ?? 0} />
            <Metric label="Cancelled" value={summary.cancelled_ai_sessions ?? 0} />
            <Metric label="Failed" value={summary.failed_ai_sessions ?? 0} />
            <Metric label="Total reps" value={na(summary.total_repetitions)} />
            <Metric
              label="Avg accuracy"
              value={summary.average_accuracy == null ? 'N/A' : formatAccuracy(summary.average_accuracy)}
            />
            <Metric label="Avg score" value={na(summary.average_score)} />
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Averages use only sessions that recorded that metric. Null values are excluded, not treated as 0.
          </p>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-3 py-10 text-center">
              <FaIcon icon="fa-person-walking" className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No AI-monitored sessions yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Start AI Monitoring on an assigned exercise to record a session here. Manual Complete / Skip stays in
                History.
              </p>
              {typeof onGoToExercises === 'function' && (
                <button type="button" className="btn-primary !py-1.5 !px-3 text-xs mt-3" onClick={onGoToExercises}>
                  Go to today’s exercises
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const chips = metricChips(s.metrics);
                const when = s.session_at || s.completed_at || s.created_at;
                return (
                  <li key={s.id} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{s.exercise_name || 'Exercise'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(when)} · {formatTime(when)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                            AI Monitored
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(s.session_status)}`}>
                            {s.session_status}
                          </span>
                          {chips.map((c) => (
                            <span key={c.label} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {c.label} {c.value}
                            </span>
                          ))}
                          {s.movement_analysis?.available ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800">
                              Movement replay
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-teal-700 self-start sm:mt-1 min-h-10 px-2"
                        onClick={() => openDetail(s)}
                      >
                        Details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.pages} · {pagination.total} sessions
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline !py-1 !px-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-outline !py-1 !px-2"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <GlassModal open={!!detail} onClose={() => setDetail(null)} size="lg" zIndex={10050}>
        <GlassModalHeader
          title="AI-monitored session"
          subtitle={detail?.exercise_name || ''}
          icon="fa-person-walking"
          accent="emerald"
          onClose={() => setDetail(null)}
        />
        <GlassModalBody>
          {detailLoading && !detail?.metrics ? (
            <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ) : detailError ? (
            <p className="text-sm text-rose-700">{detailError}</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  AI Monitored
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(detail.session_status)}`}>
                  {detail.session_status}
                </span>
              </div>
              <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-[10px] uppercase text-slate-400">Date / time</dt>
                  <dd className="text-slate-800">{formatWhen(detail.session_at || detail.completed_at || detail.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-400">Exercise</dt>
                  <dd className="text-slate-800">{detail.exercise_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-400">Rehab plan</dt>
                  <dd className="text-slate-800">{detail.prescription_title || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-400">Status</dt>
                  <dd className="text-slate-800 capitalize">{na(detail.session_status)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-400">Completion event</dt>
                  <dd className="text-slate-800">{na(detail.completion_event)}</dd>
                </div>
              </dl>
              <KinesteXMovementAnalysisReport session={detail} />
              {detail.session_status === 'completed' &&
                detail.metrics?.sets_completed == null &&
                buildWorkoutOverviewRows(detail.metrics).length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Sets count is not provided by KinesteX for this session type.
                  </p>
                )}
              {detail.error_message && (
                <p className="text-xs text-rose-700 rounded-lg bg-rose-50 px-3 py-2">{detail.error_message}</p>
              )}
              {detail.cancellation_reason && (
                <p className="text-xs text-amber-800 rounded-lg bg-amber-50 px-3 py-2">
                  Cancelled: {detail.cancellation_reason}
                </p>
              )}
            </div>
          ) : null}
        </GlassModalBody>
        <GlassModalFooter className="[&>button]:w-full sm:[&>button]:w-auto">
          <button type="button" className="btn-outline min-h-10" onClick={() => setDetail(null)}>
            Close
          </button>
        </GlassModalFooter>
      </GlassModal>
    </div>
  );
}
