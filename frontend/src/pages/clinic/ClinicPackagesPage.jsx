import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'terminated', label: 'Terminated' },
  { id: 'expired', label: 'Expired' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  terminated: 'bg-rose-50 text-rose-700',
  expired: 'bg-amber-50 text-amber-800',
};

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function patientName(p) {
  return p.patient_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
}

function sessionsLeft(p) {
  return Math.max(0, Number(p.total_sessions || 0) - Number(p.completed_sessions || 0));
}

function progressPct(p) {
  const total = Number(p.total_sessions || 0);
  if (!total) return 0;
  return Math.min(100, Math.round((Number(p.completed_sessions || 0) / total) * 100));
}

export default function ClinicPackagesPage() {
  const { clinicId, loading: boot, can } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.billingPackages(clinicId);
      setRows(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Could not load packages');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((p) => {
      const st = String(p.status || '').toLowerCase();
      if (status !== 'all' && st !== status) return false;
      if (!needle) return true;
      const blob = `${p.package_name || p.name || ''} ${patientName(p)} ${p.patient_phone || p.phone || ''}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, status, q]);

  const summary = useMemo(() => {
    const active = rows.filter((p) => String(p.status).toLowerCase() === 'active');
    return {
      total: rows.length,
      active: active.length,
      sessionsLeft: active.reduce((s, p) => s + sessionsLeft(p), 0),
      value: active.reduce((s, p) => s + Number(p.price || 0), 0),
    };
  }, [rows]);

  const terminate = async (pkg) => {
    if (
      !window.confirm(
        `Terminate "${pkg.package_name || pkg.name || 'this package'}"? Unused sessions will be calculated for refund.`
      )
    ) {
      return;
    }
    setActing(pkg.id);
    try {
      const res = await clinicPortal.terminatePackage(clinicId, pkg.id, {});
      const result = res.data || res || {};
      const refund = result.refund_amount ?? result.refund;
      toast.success(
        refund != null
          ? `Package terminated · refund preview ${money(refund)}`
          : 'Package terminated'
      );
      load();
    } catch (e) {
      toast.error(e.message || 'Could not terminate package');
    } finally {
      setActing(null);
    }
  };

  return (
    <ClinicPortalShell
      title="Packages"
      subtitle="Patient-assigned packages — sessions used, remaining, and status"
      actions={
        <div className="portal-page-actions">
          {can('packages.manage') && (
            <Link to="/clinic-portal/create-package" className="btn-outline inline-flex items-center gap-2">
              <FaIcon icon="fa-boxes-stacked" />
              <span className="hidden sm:inline">Catalog</span>
            </Link>
          )}
          <Link to="/clinic-portal/patients" className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-user-plus" />
            <span className="hidden sm:inline">Assign via patient</span>
            <span className="sm:hidden">Assign</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="portal-kpi-grid">
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Assigned</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.total}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Active</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{summary.active}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Sessions left</p>
            <p className="text-xl font-bold text-teal-700 mt-1">{summary.sessionsLeft}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Active package value</p>
            <p className="text-xl font-bold text-violet-700 mt-1 truncate">{money(summary.value)}</p>
          </div>
        </div>

        <div className="glass-card !p-3 sm:!p-4 space-y-3">
          <div className="portal-tabs">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  status === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="portal-toolbar">
            <input
              className="input-field text-sm w-full sm:max-w-xs"
              placeholder="Search patient or package…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="button" className="btn-outline text-sm w-full sm:w-auto" onClick={load}>
              Refresh
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Catalog packages are created under{' '}
            <Link to="/clinic-portal/create-package" className="text-teal-700 font-medium hover:underline">
              Package Catalog
            </Link>
            , then assigned to patients. Active assignments appear when booking appointments.
          </p>
        </div>

        {boot || loading ? (
          <div className="glass-card h-40 animate-pulse" />
        ) : !filtered.length ? (
          <div className="glass-card px-4 py-10 text-center text-slate-400">
            {rows.length ? 'No packages match these filters.' : 'No packages yet. Assign one from a patient or walk-in form.'}
          </div>
        ) : (
          <div className="glass-card !p-0 overflow-hidden">
            <div className="portal-mobile-list">
              {filtered.map((p) => {
                const left = sessionsLeft(p);
                const st = String(p.status || '—').toLowerCase();
                return (
                  <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{p.package_name || p.name || 'Package'}</p>
                        <p className="text-xs text-slate-600 truncate">{patientName(p)}</p>
                        {(p.patient_phone || p.phone) && (
                          <p className="text-[11px] text-slate-400">{p.patient_phone || p.phone}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          STATUS_STYLES[st] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status || '—'}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>
                          {Number(p.completed_sessions || 0)}/{Number(p.total_sessions || 0) || '—'} sessions
                        </span>
                        <span className="text-slate-500">{left} left</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${progressPct(p)}%` }} />
                      </div>
                    </div>
                    {Number(p.price) > 0 && <p className="text-xs text-slate-500">{money(p.price)}</p>}
                    {can('packages.manage') &&
                      !['terminated', 'completed', 'expired'].includes(st) && (
                        <button
                          type="button"
                          disabled={acting === p.id}
                          onClick={() => terminate(p)}
                          className="text-xs font-semibold text-rose-600"
                        >
                          {acting === p.id ? 'Terminating…' : 'Terminate'}
                        </button>
                      )}
                  </article>
                );
              })}
            </div>
            <div className="portal-desktop-table portal-table-wrap">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const st = String(p.status || '').toLowerCase();
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{p.package_name || p.name || 'Package'}</p>
                          {Number(p.price) > 0 && (
                            <p className="text-xs text-slate-400">{money(p.price)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {patientName(p)}
                          {(p.patient_phone || p.phone) ? (
                            <span className="block text-xs text-slate-400">{p.patient_phone || p.phone}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <p className="text-xs mb-1">
                            {Number(p.completed_sessions || 0)}/{Number(p.total_sessions || 0) || '—'}
                            <span className="text-slate-400 ml-1">({sessionsLeft(p)} left)</span>
                          </p>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[160px]">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${progressPct(p)}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                              STATUS_STYLES[st] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {can('packages.manage') &&
                          !['terminated', 'completed', 'expired'].includes(st) ? (
                            <button
                              type="button"
                              disabled={acting === p.id}
                              onClick={() => terminate(p)}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              {acting === p.id ? 'Terminating…' : 'Terminate'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ClinicPortalShell>
  );
}
