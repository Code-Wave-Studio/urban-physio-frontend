import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import PackageCard from '../../components/clinic/PackageCard';
import CustomBulkSessionModal from '../../components/clinic/CustomBulkSessionModal';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

const STATUS_FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'active',     label: 'Active' },
  { id: 'completed',  label: 'Completed' },
  { id: 'expired',    label: 'Expired' },
  { id: 'terminated', label: 'Terminated' },
];

const TYPE_FILTERS = [
  { id: 'all',         label: 'All Types' },
  { id: 'catalog',     label: 'Catalog' },
  { id: 'custom_bulk', label: 'Custom Bulk' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function sessionsLeft(p) {
  return Math.max(0, Number(p.total_sessions || 0) - Number(p.completed_sessions || 0));
}

export default function ClinicPackagesPage() {
  const { clinicId, loading: boot, can } = useClinicPortal();
  const [rows, setRows]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState(null);
  const [status, setStatus]             = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [q, setQ]                       = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSeed, setBookingSeed] = useState({});

  const openSchedule = (pkg) => {
    const patient =
      pkg.clinic_patient_id ? `cp-${pkg.clinic_patient_id}`
        : pkg.patient_id ? `p-${pkg.patient_id}`
          : '';
    if (!patient) {
      toast.error('This package has no linked patient');
      return;
    }
    setBookingSeed({
      patient,
      packageAssignmentId: pkg.id,
      mode: ['clinic', 'home_visit', 'online'].includes(pkg.service_mode) ? pkg.service_mode : 'clinic',
    });
    setBookingOpen(true);
  };

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      // Use new enriched list endpoint; fall back to billing/packages if unavailable
      let data;
      try {
        const res = await clinicPortal.packagesList(clinicId, { status: 'all' });
        data = res.data || res || [];
      } catch {
        const res = await clinicPortal.billingPackages(clinicId);
        data = res.data || res || [];
      }
      setRows(data);
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
      const st = String(p.effective_status || p.status || '').toLowerCase();
      if (status !== 'all' && st !== status) return false;
      if (typeFilter !== 'all') {
        const pt = String(p.package_type || 'catalog').toLowerCase();
        if (pt !== typeFilter) return false;
      }
      if (!needle) return true;
      const blob = [
        p.package_name || p.name || '',
        p.patient_name || '',
        p.patient_phone || p.phone || '',
      ].join(' ').toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, status, typeFilter, q]);

  const summary = useMemo(() => {
    const active = rows.filter((p) => String(p.effective_status || p.status).toLowerCase() === 'active');
    return {
      total:        rows.length,
      active:       active.length,
      sessionsLeft: active.reduce((s, p) => s + sessionsLeft(p), 0),
      value:        active.reduce((s, p) => s + Number(p.final_price || p.price || 0), 0),
    };
  }, [rows]);

  const terminate = async (pkg) => {
    if (!window.confirm(`Terminate "${pkg.package_name || pkg.name || 'this package'}"? Unused sessions will be calculated for refund.`)) {
      return;
    }
    setActing(pkg.id);
    try {
      const res = await clinicPortal.terminatePackage(clinicId, pkg.id, {});
      const result = res.data || res || {};
      const refund = result.refund_amount ?? result.refund;
      toast.success(refund != null ? `Package terminated · refund preview ${money(refund)}` : 'Package terminated');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not terminate package');
    } finally {
      setActing(null);
    }
  };

  const returnCredit = async (pkg) => {
    if (!window.confirm(`Return one session credit to "${pkg.package_name || 'this package'}"?`)) return;
    setActing(pkg.id);
    try {
      await clinicPortal.returnCredit(clinicId, pkg.id);
      toast.success('Session credit returned');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not return credit');
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
          {can('packages.manage') || can('billing.collect') ? (
            <>
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <FaIcon icon="fa-layer-group" />
                <span className="hidden sm:inline">Create Custom Bulk</span>
                <span className="sm:hidden">Custom</span>
              </button>
              {can('packages.manage') && (
                <Link to="/clinic-portal/create-package" className="btn-outline inline-flex items-center gap-2 text-sm">
                  <FaIcon icon="fa-boxes-stacked" />
                  <span className="hidden sm:inline">Catalog</span>
                </Link>
              )}
            </>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {/* KPI cards */}
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
            <p className="text-xs text-slate-500">Active value</p>
            <p className="text-xl font-bold text-violet-700 mt-1 truncate">{money(summary.value)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card !p-3 sm:!p-4 space-y-3">
          {/* Status tabs */}
          <div className="portal-tabs flex-wrap gap-1">
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
          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTypeFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  typeFilter === f.id
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Search + refresh */}
          <div className="portal-toolbar">
            <div className="relative w-full sm:max-w-xs">
              <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                className="input-field text-sm pl-9"
                placeholder="Patient name, mobile or package…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button type="button" className="btn-outline text-sm w-full sm:w-auto" onClick={load}>
              <FaIcon icon="fa-arrows-rotate" className="mr-1.5" />Refresh
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Catalog packages are created under{' '}
            <Link to="/clinic-portal/create-package" className="text-teal-700 font-medium hover:underline">
              Package Catalog
            </Link>
            . Use "Create Custom Bulk" for one-off bulk session packages.
          </p>
        </div>

        {/* Package list */}
        {boot || loading ? (
          <div className="glass-card h-40 animate-pulse" />
        ) : !filtered.length ? (
          <div className="glass-card px-4 py-12 text-center space-y-3">
            <FaIcon icon="fa-box-open" className="text-3xl text-slate-300" />
            <p className="text-slate-400 text-sm">
              {rows.length
                ? 'No packages match these filters.'
                : 'No packages yet. Assign one from a patient profile, or create a custom bulk session.'}
            </p>
            {!rows.length && (can('packages.manage') || can('billing.collect')) && (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="btn-primary text-sm mx-auto inline-flex items-center gap-2"
              >
                <FaIcon icon="fa-layer-group" /> Create Custom Bulk Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PackageCard
                key={p.id}
                pkg={p}
                canManage={can('packages.manage') || can('billing.collect')}
                onTerminate={acting === p.id ? null : terminate}
                onReturnCredit={acting === p.id ? null : returnCredit}
                onSchedule={can('appointments.manage') ? openSchedule : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ClinicBookingModal
        clinicId={clinicId}
        open={bookingOpen}
        initialPatient={bookingSeed.patient}
        initialPackageAssignmentId={bookingSeed.packageAssignmentId}
        initialMode={bookingSeed.mode}
        onClose={() => setBookingOpen(false)}
        onBooked={() => {
          setBookingOpen(false);
          load();
        }}
      />

      {/* Custom Bulk Session wizard modal */}
      {showBulkModal && (
        <CustomBulkSessionModal
          clinicId={clinicId}
          onClose={() => setShowBulkModal(false)}
          onCreated={() => load()}
        />
      )}
    </ClinicPortalShell>
  );
}
