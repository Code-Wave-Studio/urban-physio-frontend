import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaIcon from '../FaIcon';

const STATUS_STYLES = {
  active:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:  'bg-slate-100 text-slate-600 border-slate-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  expired:    'bg-amber-50 text-amber-800 border-amber-200',
  paused:     'bg-blue-50 text-blue-700 border-blue-200',
};

const TYPE_STYLES = {
  catalog:     'bg-teal-50 text-teal-700',
  custom_bulk: 'bg-violet-50 text-violet-700',
};

const TYPE_LABELS = {
  catalog:     'Catalog',
  custom_bulk: 'Custom Bulk',
};

const MODE_LABELS = {
  clinic:     'Clinic',
  home_visit: 'Home Visit',
  online:     'Online',
};

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProgressBar({ pct }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-slate-400' : pct >= 75 ? 'bg-amber-400' : 'bg-teal-500'}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

/**
 * PackageCard
 *
 * Props:
 *   pkg           – package row from /packages/list or /detail
 *   canManage     – bool (show manage actions)
 *   onTerminate   – (pkg) callback
 *   onReturnCredit – (pkg) callback
 *   defaultExpanded – bool
 */
export default function PackageCard({ pkg, canManage = false, onTerminate, onReturnCredit, defaultExpanded = false }) {
  const [open, setOpen] = useState(defaultExpanded);
  const navigate = useNavigate();

  const total      = Number(pkg.total_sessions || 0);
  const completed  = Number(pkg.completed_sessions || 0);
  const remaining  = Math.max(0, total - completed);
  const pct        = total ? Math.round((completed / total) * 100) : 0;
  const status     = String(pkg.effective_status || pkg.status || 'active').toLowerCase();
  const pkgType    = String(pkg.package_type || 'catalog').toLowerCase();
  const canSchedule = status === 'active' && remaining > 0;

  const appointments = pkg.appointments || [];
  const completedAppts = appointments.filter((a) => a.status === 'completed');
  const pendingAppts   = appointments.filter((a) => ['scheduled', 'confirmed'].includes(a.status));

  const handleSchedule = () => {
    const params = new URLSearchParams({
      pkg_id:       pkg.id,
      patient_id:   pkg.patient_id || '',
      cp_id:        pkg.clinic_patient_id || '',
      service_type: pkg.service_type || '',
      service_mode: pkg.service_mode || '',
      pkg_name:     pkg.package_name || '',
      remaining:    remaining,
    });
    navigate(`/clinic-portal/appointments/new?${params.toString()}`);
  };

  return (
    <article className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${STATUS_STYLES[status] || 'border-slate-100'}`}>
      {/* Header — always visible */}
      <div
        role="button"
        tabIndex={0}
        className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Icon */}
        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${pkgType === 'custom_bulk' ? 'bg-violet-100 text-violet-600' : 'bg-teal-100 text-teal-600'}`}>
          <FaIcon icon={pkgType === 'custom_bulk' ? 'fa-layer-group' : 'fa-box'} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-slate-900 truncate">{pkg.package_name || 'Package'}</p>
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${TYPE_STYLES[pkgType] || 'bg-slate-100 text-slate-600'}`}>
              {TYPE_LABELS[pkgType] || pkgType}
            </span>
          </div>
          {/* Patient name if shown in global list */}
          {pkg.patient_name && (
            <p className="text-xs text-slate-500 truncate">{pkg.patient_name}{pkg.patient_phone ? ` · ${pkg.patient_phone}` : ''}</p>
          )}
          {/* Service info */}
          <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
            {pkg.service_type && <span>{pkg.service_type}</span>}
            {pkg.service_mode && <span>· {MODE_LABELS[pkg.service_mode] || pkg.service_mode}</span>}
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">{completed}/{total || '?'} sessions</span>
              <span className="text-slate-400">{remaining} remaining</span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize border ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {pkg.effective_status || pkg.status || '—'}
          </span>
          <FaIcon icon={open ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 text-xs mt-1" />
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 bg-slate-50/40">
          {/* Key details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {pkg.start_date && (
              <div>
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">Start Date</p>
                <p className="font-medium text-slate-700">{fmtDate(pkg.start_date)}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px]">Expiry</p>
              <p className="font-medium text-slate-700">
                {Number(pkg.never_expires) ? 'Never Expires' : fmtDate(pkg.end_date)}
              </p>
            </div>
            {Number(pkg.final_price || pkg.price) > 0 && (
              <div>
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">Package Value</p>
                <p className="font-medium text-slate-700">{money(pkg.final_price || pkg.price)}</p>
              </div>
            )}
            {pkg.payment_method && (
              <div>
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">Payment</p>
                <p className="font-medium text-slate-700 capitalize">{pkg.payment_method}</p>
              </div>
            )}
            {pkg.discount_value > 0 && (
              <div>
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">Discount</p>
                <p className="font-medium text-slate-700">
                  {pkg.discount_type === 'percent' ? `${pkg.discount_value}%` : money(pkg.discount_value)}
                </p>
              </div>
            )}
          </div>

          {/* Completed sessions */}
          {completedAppts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Completed Sessions ({completedAppts.length})</p>
              <div className="space-y-1">
                {completedAppts.map((a) => (
                  <div key={a.id} className="flex justify-between text-xs text-slate-600 py-1 border-b border-slate-100 last:border-0">
                    <span>{fmtDate(a.appointment_date)}</span>
                    <span className="text-slate-400">{a.start_time?.slice(0,5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending sessions */}
          {pendingAppts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Upcoming ({pendingAppts.length})</p>
              <div className="space-y-1">
                {pendingAppts.map((a) => (
                  <div key={a.id} className="flex justify-between text-xs text-emerald-700 py-1 border-b border-slate-100 last:border-0">
                    <span>{fmtDate(a.appointment_date)}</span>
                    <span>{a.start_time?.slice(0,5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {pkg.notes && (
            <p className="text-xs text-slate-500 italic border-l-2 border-teal-300 pl-3">{pkg.notes}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {canSchedule && (
              <button
                type="button"
                onClick={handleSchedule}
                className="btn-primary text-xs !py-2 gap-2 inline-flex items-center"
              >
                <FaIcon icon="fa-calendar-plus" />
                Schedule Next Session
              </button>
            )}
            {canManage && onReturnCredit && completed > 0 && status === 'active' && (
              <button
                type="button"
                onClick={() => onReturnCredit(pkg)}
                className="btn-outline text-xs !py-2 gap-1.5 inline-flex items-center text-amber-700 border-amber-200"
              >
                <FaIcon icon="fa-rotate-left" />
                Return Credit
              </button>
            )}
            {canManage && onTerminate && !['terminated','completed','expired'].includes(status) && (
              <button
                type="button"
                onClick={() => onTerminate(pkg)}
                className="text-xs font-semibold text-rose-600 px-2 py-1 hover:underline"
              >
                Terminate
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
