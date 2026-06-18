import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import { patientPackages } from '../services/api';

const STATUS_STYLES = {
  scheduled: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-50 text-emerald-700',
  missed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function PackageProgressPanel({ packageId, canEdit = false, onUpdated }) {
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});

  const load = async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const res = await patientPackages.get(packageId);
      setPkg(res?.data ?? res);
    } catch {
      setPkg(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [packageId]);

  const completeSession = async (sessionNumber) => {
    setUpdating(sessionNumber);
    try {
      await patientPackages.completeSession(packageId, sessionNumber, {
        session_notes: noteDraft[sessionNumber] || '',
      });
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
    return <p className="text-sm text-slate-500">Loading package progress…</p>;
  }
  if (!pkg?.sessions?.length) {
    return null;
  }

  const pct = pkg.progress_percent ?? 0;

  return (
    <div className="rounded-xl border border-white/70 bg-white/50 p-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
        <FaIcon icon="fa-box-open" className="text-primary-600 text-xs" />
        {pkg.package_name}
        <span className="text-xs font-normal text-slate-500 capitalize">
          ({pkg.progress_status?.replace(/_/g, ' ')})
        </span>
      </h3>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>
            {pkg.completed_sessions} / {pkg.total_sessions} sessions
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

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {pkg.sessions.map((s) => (
          <div
            key={s.session_number}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Session {s.session_number}</p>
              <p className="text-xs text-slate-500">{s.scheduled_date || 'Date TBD'}</p>
              {s.session_notes && (
                <p className="text-xs text-slate-600 mt-1">{s.session_notes}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                  STATUS_STYLES[s.status] || STATUS_STYLES.scheduled
                }`}
              >
                {s.status}
              </span>
              {canEdit && s.status === 'scheduled' && (
                <>
                  <input
                    className="input-field text-xs py-1 px-2 max-w-[140px]"
                    placeholder="Notes"
                    value={noteDraft[s.session_number] || ''}
                    onChange={(e) =>
                      setNoteDraft((d) => ({ ...d, [s.session_number]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    disabled={updating === s.session_number}
                    onClick={() => completeSession(s.session_number)}
                    className="btn-primary text-xs py-1 px-2"
                  >
                    {updating === s.session_number ? '…' : 'Complete'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
