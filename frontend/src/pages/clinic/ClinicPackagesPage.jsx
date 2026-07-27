import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

export default function ClinicPackagesPage() {
  const { clinicId, loading: boot, can } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

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

  const terminate = async (pkg) => {
    if (!window.confirm(`Terminate "${pkg.package_name || pkg.name || 'this package'}"? Unused sessions will be calculated for refund.`)) return;
    setActing(pkg.id);
    try {
      const res = await clinicPortal.terminatePackage(clinicId, pkg.id, {});
      const result = res.data || res || {};
      const refund = result.refund_amount ?? result.refund;
      toast.success(refund != null ? `Package terminated · refund preview ₹${Number(refund).toLocaleString('en-IN')}` : 'Package terminated');
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
      subtitle="Clinic treatment packages — sessions used, remaining, and status"
      actions={
        <div className="portal-page-actions">
          <Link to="/clinic-portal/patients" className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-user-plus" />
            <span className="hidden sm:inline">Assign via patient</span>
            <span className="sm:hidden">Assign</span>
          </Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link to="/clinic-portal/billing" className="text-teal-700 font-medium hover:underline inline-flex items-center gap-1">
          <FaIcon icon="fa-file-invoice-dollar" /> Open full Billing
        </Link>
        {can('packages.manage') && (
          <Link to="/clinic-portal/create-package" className="text-slate-600 hover:underline inline-flex items-center gap-1">
            <FaIcon icon="fa-boxes-stacked" /> Create package catalog
          </Link>
        )}
      </div>

      {boot || loading ? (
        <div className="glass-card h-40 animate-pulse" />
      ) : !rows.length ? (
        <div className="glass-card px-4 py-10 text-center text-slate-400">
          No packages yet. Assign one when adding a walk-in patient.
        </div>
      ) : (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="portal-mobile-list">
            {rows.map((p) => {
              const patient = p.patient_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
              const left = Math.max(0, Number(p.total_sessions || 0) - Number(p.completed_sessions || 0));
              return (
                <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{p.package_name || p.name || 'Package'}</p>
                      <p className="text-xs text-slate-600 truncate">{patient}</p>
                      {(p.patient_phone || p.phone) && (
                        <p className="text-[11px] text-slate-400">{p.patient_phone || p.phone}</p>
                      )}
                    </div>
                    <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {p.status || '—'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {Number(p.completed_sessions || 0)}/{Number(p.total_sessions || 0) || '—'} sessions
                    {Number(p.total_sessions) > 0 && <span className="text-xs text-slate-400 ml-1">({left} left)</span>}
                  </p>
                  {can('packages.manage') && !['terminated', 'completed', 'expired'].includes(String(p.status).toLowerCase()) && (
                    <button type="button" disabled={acting === p.id} onClick={() => terminate(p)} className="text-xs font-semibold text-rose-600">
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
                  <th className="px-4 py-3">Sessions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.package_name || p.name || 'Package'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.patient_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                      {(p.patient_phone || p.phone) ? (
                        <span className="block text-xs text-slate-400">{p.patient_phone || p.phone}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {Number(p.completed_sessions || 0)}/{Number(p.total_sessions || 0) || '—'}
                      {Number(p.total_sessions) > 0 && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({Math.max(0, Number(p.total_sessions) - Number(p.completed_sessions || 0))} left)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {p.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {can('packages.manage') && !['terminated', 'completed', 'expired'].includes(String(p.status).toLowerCase()) ? (
                        <button type="button" disabled={acting === p.id} onClick={() => terminate(p)} className="text-xs font-semibold text-rose-600 hover:underline">
                          {acting === p.id ? 'Terminating…' : 'Terminate'}
                        </button>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
