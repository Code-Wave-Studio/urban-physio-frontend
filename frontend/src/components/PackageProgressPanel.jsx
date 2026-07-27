import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import RichSessionCard from './RichSessionCard';
import { patientPackages } from '../services/api';

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
      toast.success('Session marked complete — report emailed if clinic configured');
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

      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
        {pkg.sessions.map((s, idx) => (
          <RichSessionCard
            key={s.session_number || idx}
            session={s}
            index={idx}
            canEdit={canEdit}
            updating={updating === s.session_number}
            noteDraft={noteDraft[s.session_number] || ''}
            onNoteChange={(v) => setNoteDraft((d) => ({ ...d, [s.session_number]: v }))}
            onComplete={completeSession}
          />
        ))}
      </div>
    </div>
  );
}
