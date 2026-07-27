import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell, { ClinicQuickActions } from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { formatTime } from '../../utils/appointmentListUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function Kpi({ label, value, icon, tint = 'teal' }) {
  const tints = {
    teal: 'bg-teal-50 text-teal-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="glass-card !p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
        </div>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tints[tint]}`}>
          <FaIcon icon={icon} />
        </span>
      </div>
    </div>
  );
}

export default function ClinicAdminHome() {
  const { clinicId, isAdminMode, loading: boot, can, reload } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.adminAnalytics(clinicId);
      setData(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && isAdminMode) load();
  }, [clinicId, isAdminMode, load]);

  useEffect(() => {
    const h = () => reload();
    window.addEventListener('clinic-role-changed', h);
    return () => window.removeEventListener('clinic-role-changed', h);
  }, [reload]);

  const k = data?.kpis || {};
  const growth = data?.charts?.patient_growth || [];
  const revenue = data?.charts?.revenue_6m || [];
  const workload = data?.therapist_workload || [];
  const upcoming = data?.upcoming_appointments || [];
  const packages = data?.package_expiry_alerts || [];

  const growthChart = useMemo(
    () => ({
      labels: growth.map((r) => r.ym),
      datasets: [{
        label: 'Patients',
        data: growth.map((r) => Number(r.patients || 0)),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13,148,136,0.12)',
        fill: true,
        tension: 0.35,
      }],
    }),
    [growth]
  );

  const revenueChart = useMemo(
    () => ({
      labels: revenue.map((r) => r.ym),
      datasets: [{
        label: 'Revenue',
        data: revenue.map((r) => Number(r.total || 0)),
        backgroundColor: '#7c3aed',
        borderRadius: 8,
      }],
    }),
    [revenue]
  );

  if (!boot && !isAdminMode) {
    return <Navigate to="/clinic-portal" replace />;
  }

  return (
    <ClinicPortalShell
      title="Clinic Admin Dashboard"
      subtitle="Live operations, revenue and therapist performance"
    >
      {!can('dashboard.admin') ? (
        <div className="glass-card text-center py-12 text-slate-500">No analytics access in this mode.</div>
      ) : loading || boot ? (
        <div className="portal-kpi-grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <ClinicQuickActions isAdmin />

          <div className="portal-kpi-grid md:!grid-cols-3 xl:!grid-cols-4">
            <Kpi label="Today's appointments" value={k.today_appointments ?? 0} icon="fa-calendar-check" />
            <Kpi label="Today's walk-ins" value={k.today_walkins ?? 0} icon="fa-person-walking" tint="sky" />
            <Kpi label="New patients (month)" value={k.new_patients ?? 0} icon="fa-user-plus" tint="emerald" />
            <Kpi label="Active patients" value={k.active_patients ?? 0} icon="fa-users" tint="violet" />
            <Kpi label="Pending follow-ups" value={k.pending_followups ?? 0} icon="fa-rotate" tint="amber" />
            <Kpi label="Missed / cancelled" value={k.missed_appointments ?? 0} icon="fa-calendar-xmark" tint="rose" />
            <Kpi label="Today's revenue" value={inr(k.today_revenue)} icon="fa-indian-rupee-sign" tint="emerald" />
            <Kpi label="Total revenue" value={inr(k.total_revenue)} icon="fa-sack-dollar" tint="violet" />
            <Kpi label="Sessions completed" value={k.sessions_completed ?? 0} icon="fa-circle-check" />
            <Kpi label="Retention rate" value={`${k.patient_retention ?? 0}%`} icon="fa-heart-pulse" tint="rose" />
            <Kpi label="Avg rating" value={k.avg_rating ?? '—'} icon="fa-star" tint="amber" />
            <Kpi label="Monthly growth" value={`${k.monthly_growth ?? 0}%`} icon="fa-arrow-trend-up" tint="emerald" />
            <Kpi label="Weekly appointments" value={k.weekly_appointments ?? 0} icon="fa-calendar-week" />
            <Kpi label="Pending payments" value={inr(k.pending_payments)} icon="fa-file-invoice-dollar" tint="rose" />
            <Kpi label="Top therapist" value={k.top_therapist?.name || '—'} icon="fa-user-doctor" tint="sky" />
            <Kpi label="Month revenue" value={inr(k.month_revenue)} icon="fa-chart-column" tint="violet" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card !p-3 sm:!p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Patient growth</h3>
              <div className="h-48 sm:h-56 w-full min-w-0">
                <Line data={growthChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
            <div className="glass-card !p-3 sm:!p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Revenue (6 months)</h3>
              <div className="h-48 sm:h-56 w-full min-w-0">
                <Bar data={revenueChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="glass-card !p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Therapist workload</h3>
              {workload.length === 0 ? (
                <p className="text-sm text-slate-500">No data this month.</p>
              ) : (
                <ul className="space-y-2">
                  {workload.map((w) => (
                    <li key={w.doctor_id} className="flex justify-between text-sm gap-2">
                      <span className="truncate font-medium text-slate-800">{w.name}</span>
                      <span className="text-slate-500 shrink-0">{w.completed}/{w.appointments}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass-card !p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Upcoming appointments</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing upcoming.</p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto">
                  {upcoming.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="font-medium text-slate-800">{a.patient_name}</p>
                      <p className="text-xs text-slate-500">
                        {a.appointment_date} {formatTime(a.start_time)} · {a.doctor_name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/clinic-portal/appointments" className="text-xs text-primary-600 font-medium mt-2 inline-block">Open calendar →</Link>
            </div>

            <div className="glass-card !p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Package expiry alerts</h3>
              {packages.length === 0 ? (
                <p className="text-sm text-slate-500">No packages expiring this week.</p>
              ) : (
                <ul className="space-y-2">
                  {packages.map((p, i) => (
                    <li key={i} className="text-sm">
                      <p className="font-medium text-slate-800">{p.package_name}</p>
                      <p className="text-xs text-amber-700">Expires {p.end_date}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
