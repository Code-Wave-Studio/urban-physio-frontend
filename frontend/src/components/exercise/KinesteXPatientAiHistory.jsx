import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { kinestex } from '../../services/api';
import KinesteXWorkoutOverview, {
  buildWorkoutOverviewRows,
  formatAccuracy,
  formatDuration,
} from './KinesteXWorkoutOverview';
import KinesteXMovementAnalysisReport from './KinesteXMovementAnalysisReport';

function formatWhen(value) {
  if (!value) return '—';
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
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '—';
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

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  );
}

function metricChips(metrics) {
  return buildWorkoutOverviewRows(metrics).map((row) => ({
    label: row.label === 'Repetitions' ? 'Reps' : row.label,
    value: row.value,
  }));
}

function buildSummaryTiles(summary) {
  const tiles = [
    { label: 'AI sessions', value: summary.total_ai_sessions ?? 0 },
    { label: 'Completed', value: summary.completed_ai_sessions ?? 0 },
  ];
  if ((summary.cancelled_ai_sessions ?? 0) > 0) {
    tiles.push({ label: 'Cancelled', value: summary.cancelled_ai_sessions });
  }
  if ((summary.failed_ai_sessions ?? 0) > 0) {
    tiles.push({ label: 'Failed', value: summary.failed_ai_sessions });
  }
  if (summary.total_repetitions != null) {
    tiles.push({ label: 'Total reps', value: summary.total_repetitions });
  }
  if (summary.average_accuracy != null) {
    tiles.push({ label: 'Avg accuracy', value: formatAccuracy(summary.average_accuracy) });
  }
  if (summary.average_score != null) {
    tiles.push({ label: 'Avg score', value: summary.average_score });
  }
  return tiles;
}

function groupSessionsByExercise(sessions) {
  const order = [];
  const map = new Map();
  (sessions || []).forEach((s) => {
    const key = String(s.exercise_id || s.exercise_name || 'unknown');
    if (!map.has(key)) {
      map.set(key, {
        key,
        exercise_id: s.exercise_id || '',
        exercise_name: s.exercise_name || 'Exercise',
        sessions: [],
      });
      order.push(key);
    }
    map.get(key).sessions.push(s);
  });
  return order.map((k) => map.get(k));
}

/**
 * Patient KinesteX AI session history.
 * GET /kinestex/sessions (JWT only). Null metrics stay hidden — never coerced to 0.
 */
export default function KinesteXPatientAiHistory({
  refreshTick = 0,
  onGoToExercises,
  title = 'My Progress',
  subtitle = 'AI-Guided Exercise session history and performance from your saved KinesteX workouts. Same records your clinician can review.',
  compact = false,
}) {
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
      per_page: compact ? 10 : 20,
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
  }, [page, exerciseId, status, dateFrom, dateTo, compact]);

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
  const summaryTiles = useMemo(() => buildSummaryTiles(summary), [summary]);
  const exerciseGroups = useMemo(
    () => (exerciseId ? null : groupSessionsByExercise(sessions)),
    [sessions, exerciseId]
  );
  const detailMetrics = detail?.metrics;
  const detailHasFeedback = detailMetrics?.mistakes != null;
  const detailOverviewRows = buildWorkoutOverviewRows(detailMetrics);

  const renderSessionCard = (s) => {
    const chips = metricChips(s.metrics);
    const when = s.session_at || s.completed_at || s.created_at;
    return (
      <li key={s.id} className="rounded-xl border border-slate-100 bg-white px-3 py-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 truncate">{s.exercise_name || 'Exercise'}</p>
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
                <span
                  key={c.label}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                >
                  {c.label} {c.value}
                </span>
              ))}
              {s.movement_analysis?.available ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800">
                  Movement Analysis
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-teal-700 self-start sm:mt-1 min-h-10 px-2 shrink-0"
            onClick={() => openDetail(s)}
          >
            View session
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className={`glass-card !p-4 md:!p-5 min-w-0 max-w-full overflow-x-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3 min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 flex flex-wrap items-center gap-2">
            <FaIcon icon="fa-chart-line" className="text-teal-600 shrink-0" />
            <span className="min-w-0">{title}</span>
            <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
              AI sessions
            </span>
          </h3>
          {subtitle ? <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p> : null}
        </div>
        <button type="button" onClick={load} className="text-xs text-slate-500 hover:text-teal-700 font-medium shrink-0 min-h-10 px-1">
          <FaIcon icon="fa-arrows-rotate" className="mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-5 gap-2 mb-3 min-w-0">
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">Exercise</label>
          <select
            className="input-field w-full min-w-0 max-w-full !py-1.5 text-sm mt-0.5"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          >
            <option value="">All exercises</option>
            {exerciseOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
                {ex.session_count != null ? ` (${ex.session_count})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">Status</label>
          <select
            className="input-field w-full min-w-0 max-w-full !py-1.5 text-sm mt-0.5"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">From</label>
          <input
            type="date"
            className="input-field w-full min-w-0 max-w-full !py-1.5 text-sm mt-0.5"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <label className="text-[10px] uppercase text-slate-400 font-semibold">To</label>
          <input
            type="date"
            className="input-field w-full min-w-0 max-w-full !py-1.5 text-sm mt-0.5"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="flex items-end min-[375px]:col-span-2 lg:col-span-1">
          <button
            type="button"
            className="btn-outline !py-1.5 !px-3 text-xs w-full min-h-10"
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
          <div
            className={`grid gap-2 mb-3 min-w-0 ${
              summaryTiles.length <= 2
                ? 'grid-cols-2'
                : summaryTiles.length <= 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
            }`}
          >
            {summaryTiles.map((t) => (
              <SummaryTile key={t.label} label={t.label} value={t.value} />
            ))}
          </div>
          {(summary.average_accuracy != null || summary.average_score != null || summary.total_repetitions != null) && (
            <p className="text-[10px] text-slate-400 mb-3">
              Averages and totals use only sessions that recorded that metric. Missing values are omitted, not treated as 0.
            </p>
          )}

          {exerciseOptions.length > 0 && (
            <div className="mb-4 min-w-0">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400 mb-2">
                Exercise-wise history
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
                <button
                  type="button"
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border min-h-9 ${
                    !exerciseId
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                  onClick={() => setExerciseId('')}
                >
                  All
                </button>
                {exerciseOptions.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border min-h-9 max-w-[12rem] truncate ${
                      String(exerciseId) === String(ex.id)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                    title={ex.name}
                    onClick={() => setExerciseId(String(ex.id))}
                  >
                    {ex.name}
                    {ex.session_count != null ? ` · ${ex.session_count}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-3 py-10 text-center">
              <FaIcon icon="fa-chart-line" className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No AI sessions yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Complete an AI-Guided Exercise from My Rehab Plan to see session history and performance here.
                Manual Complete / Skip stays under History.
              </p>
              {typeof onGoToExercises === 'function' && (
                <button type="button" className="btn-primary !py-1.5 !px-3 text-xs mt-3 min-h-10" onClick={onGoToExercises}>
                  Go to today’s exercises
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {exerciseId ? 'Exercise sessions' : 'Recent AI sessions'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {pagination.total} session{pagination.total === 1 ? '' : 's'}
                  {status ? ` · ${status}` : ''}
                </p>
              </div>

              {exerciseGroups ? (
                <div className="space-y-5">
                  {exerciseGroups.map((group) => (
                    <section key={group.key} className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-800 truncate min-w-0">
                          {group.exercise_name}
                        </h4>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {group.sessions.length} on this page
                          {group.exercise_id ? (
                            <button
                              type="button"
                              className="ml-2 text-teal-700 font-semibold hover:underline"
                              onClick={() => setExerciseId(String(group.exercise_id))}
                            >
                              Filter
                            </button>
                          ) : null}
                        </span>
                      </div>
                      <ul className="space-y-2">{group.sessions.map(renderSessionCard)}</ul>
                    </section>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">{sessions.map(renderSessionCard)}</ul>
              )}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-xs text-slate-500">
              <span className="min-w-0">
                Page {pagination.page} of {pagination.pages} · {pagination.total} sessions
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  className="btn-outline !py-1 !px-2 min-h-9"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-outline !py-1 !px-2 min-h-9"
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
          title="Session detail"
          subtitle={detail?.exercise_name || 'AI-Guided Exercise'}
          icon="fa-person-walking"
          accent="emerald"
          onClose={() => setDetail(null)}
        />
        <GlassModalBody>
          {detailLoading && !detail?.metrics && !detail?.session_status ? (
            <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ) : detailError ? (
            <p className="text-sm text-rose-700">{detailError}</p>
          ) : detail ? (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  AI Monitored
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(detail.session_status)}`}
                >
                  {detail.session_status}
                </span>
                {detail.movement_analysis?.available ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800">
                    Movement Analysis available
                  </span>
                ) : null}
              </div>

              <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm min-w-0">
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Date / time</dt>
                  <dd className="text-slate-800 break-words">
                    {formatWhen(detail.session_at || detail.completed_at || detail.created_at)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Exercise</dt>
                  <dd className="text-slate-800 break-words">{detail.exercise_name || '—'}</dd>
                </div>
                {detail.prescription_title ? (
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase text-slate-400">Rehab plan</dt>
                    <dd className="text-slate-800 break-words">{detail.prescription_title}</dd>
                  </div>
                ) : null}
                {detail.completion_event ? (
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase text-slate-400">Completion event</dt>
                    <dd className="text-slate-800 break-words">{detail.completion_event}</dd>
                  </div>
                ) : null}
              </dl>

              <KinesteXWorkoutOverview
                metrics={detailMetrics}
                title="Workout Overview"
                emptyMessage="Performance metrics were not included in this session result."
              />

              {detailHasFeedback ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-700 mb-1">AI Exercise Feedback</p>
                  <p className="text-sm text-slate-700">
                    Mistakes recorded by KinesteX: <span className="font-bold">{detailMetrics.mistakes}</span>
                    {detailMetrics.accuracy != null ? (
                      <>
                        {' '}
                        · Accuracy {formatAccuracy(detailMetrics.accuracy)}
                      </>
                    ) : null}
                    {detailMetrics.duration_seconds != null ? (
                      <>
                        {' '}
                        · Duration {formatDuration(detailMetrics.duration_seconds)}
                      </>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Objective session metrics only — not a medical diagnosis or dosage recommendation.
                  </p>
                </div>
              ) : null}

              <KinesteXMovementAnalysisReport
                session={detail}
                title="Movement Analysis"
                showMetrics={false}
              />

              {detail.session_status === 'completed' &&
                detailMetrics?.sets_completed == null &&
                detailOverviewRows.length > 0 && (
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
