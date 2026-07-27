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
        <Link to="/clinic-portal/patients" className="btn-primary inline-flex items-center gap-2 !py-2 !px-3 text-sm">
          <FaIcon icon="fa-user-plus" /> Assign via patient
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link to="/clinic-portal/billing" className="text-teal-700 font-medium hover:underline inline-flex items-center gap-1">
          <FaIcon icon="fa-file-invoice-dollar" /> Open full Billing
        </Link>
        {can('packages.manage') && (
          <Link to="/clinic-portal/create-package" className="text-slate-600 hover:underline inline-flex items-center gap-1 ml-3">
            <FaIcon icon="fa-boxes-stacked" /> Create package catalog
          </Link>
        )}
      </div>

      {boot || loading ? (
        <div className="glass-card h-40 animate-pulse" />
      ) : (
        <div className="glass-card overflow-x-auto !p-0">
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
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No packages yet. Assign one when adding a walk-in patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ClinicPortalShell>
  );
}
