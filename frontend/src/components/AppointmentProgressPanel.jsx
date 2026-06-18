import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import { appointmentProgress } from '../services/api';

const STATUS_STYLES = {
  scheduled: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  missed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AppointmentProgressPanel({ appointmentId, canEdit = false, onUpdated }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await appointmentProgress.get(appointmentId);
      setProgress(res?.data ?? res);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const completeSession = async (sessionNumber) => {
    setUpdating(sessionNumber);
    try {
      await appointmentProgress.completeSession(appointmentId, sessionNumber, {});
      toast.success('Session marked complete');
      await load();
      onUpdated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading progress…</p>;
  }
  if (!progress?.sessions?.length) {
    return null;
  }

  const pct = progress.progress_percent ?? 0;

  return (
    <div className="rounded-xl border border-white/70 bg-white/50 p-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
        <FaIcon icon="fa-chart-line" className="text-primary-600 text-xs" />
        Treatment progress
        <span className="text-xs font-normal text-slate-500 capitalize">
          ({progress.progress_status?.replace(/_/g, ' ')})
        </span>
      </h3>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>
            {progress.completed_sessions} / {progress.total_sessions} sessions
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {progress.sessions.map((s) => (
          <div
            key={s.session_number}
            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Session {s.session_number}</p>
              <p className="text-xs text-slate-500">
                {s.session_date || 'Date TBD'}
                {s.start_time ? ` · ${String(s.start_time).slice(0, 5)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status] || STATUS_STYLES.scheduled}`}>
                {s.status?.replace(/_/g, ' ')}
              </span>
              {canEdit && s.status !== 'completed' && s.status !== 'cancelled' && (
                <button
                  type="button"
                  disabled={updating === s.session_number}
                  className="text-xs btn-primary !py-1 !px-2.5"
                  onClick={() => completeSession(s.session_number)}
                >
                  {updating === s.session_number ? '…' : 'Complete'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
