import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function Kpi({ label, value, icon }) {
  return (
    <div className="glass-card !p-4">
      <div className="flex justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <FaIcon icon={icon} />
        </span>
      </div>
    </div>
  );
}

export default function ClinicReportsPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [ov, setOv] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const rec = await clinicPortal.receptionDashboard(clinicId);
      setOv(rec.data || rec);
    } catch (e) {
      toast.error(e.message || 'Could not load reports');
      setOv(null);
    }
    if (can('billing.view')) {
      try {
        const bill = await clinicPortal.billingOverview(clinicId);
        setBilling(bill.data || bill);
      } catch {
        setBilling(null);
      }
    } else {
      setBilling(null);
    }
    setLoading(false);
  }, [clinicId, can]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const m = ov?.metrics || {};
  const b = billing || {};

  const exportReport = async (format, type = 'appointments') => {
    setExporting(`${format}-${type}`);
    try {
      const res = await clinicPortal.exportReports(clinicId, { format, type });
      const blob = res instanceof Blob ? res : new Blob([res?.data || res], {
        type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
      });
      if (blob.type && blob.type.includes('application/json')) {
        const text = await blob.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.message || 'Export failed');
        } catch (e) {
          if (e instanceof Error && e.message && e.message !== 'Unexpected end of JSON input') throw e;
          throw new Error('Export failed');
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-${type}-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`${type} ${format.toUpperCase()} downloaded`);
    } catch (error) {
      let message = error.message || 'Export failed';
      try {
        if (error.response?.data instanceof Blob) {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        }
      } catch { /* ignore */ }
      toast.error(message);
    } finally {
      setExporting('');
    }
  };

  return (
    <ClinicPortalShell
      title="Reports"
      subtitle="Daily revenue, pending payments, appointments and package utilisation"
      actions={
        isAdminMode && can('dashboard.admin') ? (
          <Link to="/clinic-portal/admin" className="btn-primary inline-flex items-center gap-2 !py-2 !px-3 text-sm">
            <FaIcon icon="fa-chart-line" /> Full analytics
          </Link>
        ) : null
      }
    >
      {boot || loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Today's appointments" value={m.today_total ?? 0} icon="fa-calendar-check" />
            <Kpi label="Unpaid today" value={m.unpaid_today ?? 0} icon="fa-hourglass-half" />
            <Kpi label="Walk-ins today" value={m.walkins_today ?? 0} icon="fa-person-walking" />
            <Kpi
              label="Pending payments"
              value={billing ? money(b.pending_amount ?? 0) : '—'}
              icon="fa-money-bill"
            />
          </div>
          {billing && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Kpi label="Revenue today" value={money(b.revenue_today)} icon="fa-indian-rupee-sign" />
              <Kpi label="Revenue month" value={money(b.revenue_month)} icon="fa-chart-line" />
              <Kpi label="Active packages" value={b.active_packages ?? 0} icon="fa-box-open" />
            </div>
          )}
          {(can('reports.export') || can('analytics.view')) && (
          <div className="glass-card">
            <h3 className="font-semibold text-slate-800 mb-2">Exports</h3>
            <p className="text-sm text-slate-500 mb-4">Download revenue, appointment, doctor and package utilisation data.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['appointments', 'revenue', 'doctors', 'packages'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className="btn-outline text-sm capitalize"
                  disabled={Boolean(exporting)}
                  onClick={() => exportReport('csv', type)}
                >
                  <FaIcon icon="fa-file-csv" className="mr-2 text-emerald-600" />
                  {exporting === `csv-${type}` ? 'Preparing…' : `${type} CSV`}
                </button>
              ))}
              <button type="button" className="btn-primary text-sm" disabled={Boolean(exporting)} onClick={() => exportReport('excel', 'appointments')}>
                <FaIcon icon="fa-file-excel" className="mr-2" />
                {exporting === 'excel-appointments' ? 'Preparing…' : 'Excel (appointments)'}
              </button>
            </div>
          </div>
          )}
        </div>
      )}
    </ClinicPortalShell>
  );
}
