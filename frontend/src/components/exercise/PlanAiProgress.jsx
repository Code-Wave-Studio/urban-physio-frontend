import { useCallback, useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import { kinestex } from '../../services/api';

function formatWhen(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function num(v, suffix = '') {
  return v === null || v === undefined ? '—' : `${v}${suffix}`;
}

function statusClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-amber-50 text-amber-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white border border-teal-100 px-3 py-2 min-w-0">
      <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-900 break-words">{value}</p>
    </div>
  );
}

/**
 * Phase 9 — AI progress for one plan enrolment (aggregated from persisted KinesteX sessions).
 * Authorisation is entirely server-side (JWT). Renders nothing when AI is disabled for the plan
 * (patients receive ai_enabled=false and no data), or when the server refuses access.
 * Reusable on any patient/clinician plan page: <PlanAiProgress enrolmentId={id} />.
 */
export default function PlanAiProgress({ enrolmentId, refreshTick = 0, className = '' }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  const load = useCallback(() => {
    if (!enrolmentId) {
      setState({ loading: false, data: null, error: '' });
      return () => {};
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    kinestex
      .planProgress(enrolmentId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        setState({ loading: false, data: data && typeof data === 'object' ? data : null, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        // 401/403/404 => stay silent (no enumeration hints); anything else => quiet, retryable notice.
        const silent = err?.status === 401 || err?.status === 403 || err?.status === 404;
        setState({ loading: false, data: null, error: silent ? '' : 'AI progress could not be loaded right now.' });
      });
    return () => {
      cancelled = true;
    };
  }, [enrolmentId]);

  useEffect(() => load(), [load, refreshTick]);

  const { loading, data, error } = state;

  if (loading && !data) {
    return <div className={`h-24 rounded-2xl bg-slate-100 animate-pulse ${className}`} aria-busy="true" />;
  }
  if (error) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500 ${className}`}>
        {error}{' '}
        <button type="button" className="font-semibold text-teal-700 min-h-10 px-2" onClick={load}>
          Retry
        </button>
      </div>
    );
  }
  if (!data || !data.ai_enabled) return null;

  const totals = data.totals || {};
  const phases = Array.isArray(data.phases) ? data.phases : [];
  const recent = Array.isArray(data.recent_sessions) ? data.recent_sessions : [];

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-teal-50/40 p-3 md:p-4 space-y-3 min-w-0 max-w-full overflow-x-hidden ${className}`}
      data-testid="plan-ai-progress"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
            <FaIcon icon="fa-person-walking" className="text-teal-700 shrink-0" />
            <span className="min-w-0 break-words">AI Progress{data.plan_title ? ` — ${data.plan_title}` : ''}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Objective session metrics only — not a medical diagnosis or dosage recommendation.
          </p>
        </div>
        <button type="button" onClick={load} className="text-xs text-slate-500 hover:text-teal-700 font-medium min-h-10 px-2 shrink-0">
          <FaIcon icon="fa-arrows-rotate" className="mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="AI sessions" value={num(totals.sessions)} />
        <Stat label="Completed" value={num(totals.completed_sessions)} />
        <Stat label="Repetitions" value={num(totals.total_repetitions)} />
        <Stat label="Avg accuracy" value={num(totals.avg_accuracy, '%')} />
      </div>

      {phases.length > 0 ? (
        <ul className="space-y-2 min-w-0">
          {phases.map((p) => {
            const isCurrent = p.phase_no != null && Number(p.phase_no) === Number(data.current_phase);
            return (
              <li
                key={`${p.phase_no ?? 'x'}-${p.phase_id ?? 'x'}`}
                className={`rounded-xl bg-white border px-3 py-2 min-w-0 ${isCurrent ? 'border-teal-300' : 'border-teal-100'}`}
              >
                <p className="text-sm font-semibold text-slate-900 break-words">
                  {p.phase_no != null ? `Phase ${p.phase_no}: ` : ''}
                  {p.title}
                  {isCurrent ? (
                    <span className="ml-2 align-middle text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                  {p.completed_sessions}/{p.sessions} completed · {p.total_repetitions} reps · accuracy {num(p.avg_accuracy, '%')}
                  {p.last_session_at ? ` · last ${formatWhen(p.last_session_at)}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}

      {recent.length > 0 ? (
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Recent AI sessions</p>
          <ul className="space-y-1.5 min-w-0">
            {recent.map((s) => (
              <li key={s.id} className="rounded-lg bg-white border border-teal-100 px-3 py-1.5 text-[11px] text-slate-600 break-words min-w-0">
                <span className="font-semibold text-slate-800">{s.exercise_name || 'Exercise'}</span>{' '}
                <span className={`uppercase font-bold px-1.5 py-0.5 rounded-full ${statusClass(s.session_status)}`}>{s.session_status}</span>
                {s.phase_no ? ` · phase ${s.phase_no}` : ''}
                {s.repetitions != null ? ` · ${s.repetitions} reps` : ''}
                {s.accuracy != null ? ` · ${s.accuracy}%` : ''}
                {` · ${formatWhen(s.completed_at || s.created_at)}`}
              </li>
            ))}
          </ul>
          {data.truncated ? (
            <p className="text-[11px] text-slate-400 mt-1">Showing the most recent sessions only.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No AI-monitored sessions saved for this plan yet.</p>
      )}
    </section>
  );
}
