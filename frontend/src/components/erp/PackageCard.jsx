import { useState } from 'react';
import FaIcon from '../FaIcon';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  active:     'bg-green-100 text-green-700',
  completed:  'bg-blue-100 text-blue-700',
  terminated: 'bg-red-100 text-red-700',
  expired:    'bg-slate-100 text-slate-500',
  pending:    'bg-amber-100 text-amber-700',
};

const SESSION_BADGE = {
  completed:   'bg-green-100 text-green-700',
  pending:     'bg-slate-100 text-slate-500',
  scheduled:   'bg-blue-100 text-blue-700',
  missed:      'bg-red-100 text-red-700',
  cancelled:   'bg-slate-100 text-slate-400',
  rescheduled: 'bg-amber-100 text-amber-700',
  skipped:     'bg-orange-100 text-orange-700',
};

export default function PackageCard({ pkg, onTerminate, onRefresh }) {
  const [expanded, setExpanded] = useState(false);

  const total     = pkg.total_sessions || 0;
  const completed = pkg.completed_sessions || 0;
  const remaining = Math.max(0, total - completed);
  const missed    = pkg.missed_sessions || 0;
  const progress  = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{pkg.package_name || pkg.name || 'Package'}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[pkg.status] || 'bg-slate-100 text-slate-600'}`}>
              {pkg.status}
            </span>
          </div>
          {pkg.auto_number && (
            <p className="text-xs text-slate-400 mt-0.5">#{pkg.auto_number}</p>
          )}
          {pkg.valid_until && (
            <p className="text-xs text-slate-500 mt-0.5">Valid until {fmt(pkg.valid_until)}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-emerald-700">{money(pkg.price || pkg.amount)}</p>
          {pkg.discount_percent > 0 && (
            <p className="text-[10px] text-red-500">{pkg.discount_percent}% off</p>
          )}
          {pkg.outstanding_balance > 0 && (
            <p className="text-[10px] text-amber-600">Outstanding: {money(pkg.outstanding_balance)}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{completed} completed</span>
          <span>{remaining} remaining</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>{completed}/{total} sessions</span>
          {missed > 0 && <span className="text-red-500">{missed} missed</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs btn-outline !py-1 flex items-center gap-1.5"
        >
          <FaIcon icon={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} className="text-[10px]" />
          {expanded ? 'Hide' : 'Show'} Sessions
        </button>
        {!['terminated', 'completed', 'expired'].includes(pkg.status) && onTerminate && (
          <button
            type="button"
            onClick={() => onTerminate(pkg)}
            className="text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 transition-colors"
          >
            Terminate
          </button>
        )}
      </div>

      {/* Sessions */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {(pkg.sessions || []).length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No sessions linked yet.</p>
          ) : (
            (pkg.sessions || []).map((s, idx) => (
              <div key={s.id || idx} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Session {s.session_number || idx + 1}</p>
                  {s.scheduled_date && (
                    <p className="text-[10px] text-slate-400">{fmt(s.scheduled_date)} {s.scheduled_time || ''}</p>
                  )}
                  {s.notes && <p className="text-[10px] text-slate-400 truncate">{s.notes}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0 ${SESSION_BADGE[s.status] || 'bg-slate-100 text-slate-600'}`}>
                  {s.status || 'pending'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
