import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { kinestex } from '../../services/api';
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

function statusClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-amber-50 text-amber-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  );
}

/**
 * Doctor/clinic KinesteX AI Performance.
 * Reads kinestex_sessions via GET /kinestex/analysis. Null metrics stay N/A — never coerced to 0.
 */
export default function KinesteXAiPerformancePanel({
  patientId,
  prescriptionId = null,
  title = 'AI Performance',
  compact = false,
  refreshTick = 0,
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
    if (!patientId) return;
    setLoading(true);
    setError('');
    const params = {
      patient_id: patientId,
      page,
      per_page: compact ? 10 : 20,
    };
    if (prescriptionId) params.prescription_id = prescriptionId;
    if (exerciseId) params.exercise_id = exerciseId;
    if (status) params.session_status = status;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    kinestex
      .analysisSessions(params)
      .then((res) => setPayload(res.data || res || null))
      .catch((err) => {
        const msg = err.message || 'Could not load AI performance';
        setError(msg);
        setPayload(null);
        if (!/forbidden|not found|unauthorized/i.test(msg)) {
          toast.error(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [patientId, prescriptionId, page, exerciseId, status, dateFrom, dateTo, compact, refreshTick]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [patientId, prescriptionId, exerciseId, status, dateFrom, dateTo]);

  const openDetail = async (session) => {
    setDetailLoading(true);
    setDetailError('');
    setDetail(session);
    try {
      const res = await kinestex.analysisSession(session.id);
      setDetail(res.data || res);
    } catch (err) {
      setDetailError(err.message || 'Could not load session');
    } finally {
      setDetailLoading(false);
    }
  };

  if (!patientId) return null;

  const sessions = payload?.sessions || [];
  const summary = payload?.summary || {};
  const pagination = payload?.pagination || { page: 1, pages: 1, total: 0 };
  const exerciseOptions = payload?.exercise_options || [];

  return (
    <div className={compact ? '' : 'glass-card !p-4 md:!p-5'}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FaIcon icon="fa-person-walking" className="text-teal-600" />
          {title}
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
        KinesteX AI sessions recorded for this patient. Separate from manual HEP completion. Available provider metrics are shown; omitted fields stay hidden.
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
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-4 text-sm text-rose-700">
          {/forbidden|unauthorized/i.test(error)
            ? 'You are not authorized to view this patient’s AI sessions.'
            : /not found/i.test(error)
              ? 'Patient not found.'
              : error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 min-w-0">
            <Metric label="AI sessions" value={summary.total_ai_sessions ?? 0} />
            <Metric label="Completed" value={summary.completed_ai_sessions ?? 0} />
            <Metric label="Total reps" value={na(summary.total_repetitions)} />
            <Metric
              label="Avg accuracy"
              value={
                summary.average_accuracy == null
                  ? 'N/A'
                  : `${summary.average_accuracy}${summary.accuracy_sample_count ? ` (${summary.accuracy_sample_count})` : ''}`
              }
            />
            <Metric
              label="Avg score"
              value={
                summary.average_score == null
                  ? 'N/A'
                  : `${summary.average_score}${summary.score_sample_count ? ` (${summary.score_sample_count})` : ''}`
              }
            />
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Averages use only sessions that recorded that metric. Null values are excluded, not treated as 0.
          </p>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
              No AI-monitored sessions yet for this patient.
            </div>
          ) : (
            <>
              <ul className="md:hidden space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{s.exercise_name || 'Exercise'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatWhen(s.session_at)}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                            AI Monitored
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(s.session_status)}`}>
                            {s.session_status}
                          </span>
                          {s.metrics?.repetitions != null && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Reps {s.metrics.repetitions}
                            </span>
                          )}
                          {s.metrics?.accuracy != null && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Accuracy {s.metrics.accuracy}%
                            </span>
                          )}
                          {s.metrics?.score != null && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Score {s.metrics.score}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-teal-700 shrink-0 min-h-10 px-2"
                        onClick={() => openDetail(s)}
                      >
                        Details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left">
                      <th className="py-2 px-2">Exercise</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Reps</th>
                      <th className="py-2 px-2">Accuracy</th>
                      <th className="py-2 px-2">Score</th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="py-2 px-2">
                          <p className="font-medium text-slate-800">{s.exercise_name || 'Exercise'}</p>
                          <p className="text-[10px] text-teal-700 font-semibold">AI Monitored</p>
                        </td>
                        <td className="py-2 px-2 text-slate-600 whitespace-nowrap">{formatWhen(s.session_at)}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusClass(s.session_status)}`}>
                            {s.session_status}
                          </span>
                        </td>
                        <td className="py-2 px-2">{s.metrics?.repetitions ?? '—'}</td>
                        <td className="py-2 px-2">{s.metrics?.accuracy != null ? `${s.metrics.accuracy}%` : '—'}</td>
                        <td className="py-2 px-2">{s.metrics?.score ?? '—'}</td>
                        <td className="py-2 px-2 text-right">
                          <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => openDetail(s)}>
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
          title="AI session"
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
              <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm min-w-0">
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Date / time</dt>
                  <dd className="text-slate-800 break-words">{formatWhen(detail.session_at || detail.completed_at || detail.created_at)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Exercise</dt>
                  <dd className="text-slate-800 break-words">{detail.exercise_name || 'N/A'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Rehab plan</dt>
                  <dd className="text-slate-800 break-words">{detail.prescription_title || `Plan #${detail.prescription_id}`}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Prescription item</dt>
                  <dd className="text-slate-800">{detail.item_id ? `#${detail.item_id}` : 'N/A'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Completion event</dt>
                  <dd className="text-slate-800 break-words">{na(detail.completion_event)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase text-slate-400">Provider session ID</dt>
                  <dd className="text-slate-800 break-all">{na(detail.provider_session_id)}</dd>
                </div>
              </dl>
              <KinesteXMovementAnalysisReport session={detail} />
              {detail.kinestex_exercise_id ? (
                <p className="text-xs text-slate-500">
                  KinesteX exercise: <span className="font-medium text-slate-700 break-all">{detail.kinestex_exercise_id}</span>
                </p>
              ) : null}
              {detail.session_status === 'completed' && detail.metrics?.sets_completed == null && (
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
              {Array.isArray(detail.session_events) && detail.session_events.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Session events</p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {detail.session_events.map((ev, i) => (
                      <li key={`${ev.event}-${i}`} className="text-xs text-slate-600 rounded-lg bg-slate-50 px-3 py-1.5">
                        <span className="font-semibold text-slate-700">{ev.event}</span>
                        {Object.entries(ev)
                          .filter(([k]) => k !== 'event')
                          .map(([k, v]) => (
                            <span key={k} className="ml-2">
                              {k}: {String(v)}
                            </span>
                          ))}
                      </li>
                    ))}
                  </ul>
                </div>
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
