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
import ClinicQuickWork from '../../components/clinic/ClinicQuickWork';
import DashboardKpiCard from '../../components/clinic/dashboard/DashboardKpiCard';
import DashboardWidgetBoard, {
  DashboardCustomizeToolbar,
} from '../../components/clinic/dashboard/DashboardWidgetBoard';
import MiniMonthCalendar from '../../components/clinic/dashboard/MiniMonthCalendar';
import TeamAvailabilityWidget from '../../components/clinic/dashboard/TeamAvailabilityWidget';
import useDashboardLayout from '../../components/clinic/dashboard/useDashboardLayout';
import { dashChartOptions, DASH_CHART_COLORS } from '../../components/clinic/dashboard/dashboardChartOptions';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { formatTime } from '../../utils/appointmentListUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const ADMIN_WIDGET_DEFS = [
  { id: 'quick_actions' },
  { id: 'revenue_summary' },
  { id: 'charts_growth' },
  { id: 'charts_revenue' },
  { id: 'therapist_workload' },
  { id: 'upcoming' },
  { id: 'package_alerts' },
  { id: 'team' },
  { id: 'calendar' },
];

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function ClinicAdminHome() {
  const { clinicId, isAdminMode, loading: boot, can, reload, clinic } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortcutsAtTop, setShortcutsAtTop] = useState(false);

  const storageKey = `clinic-dash-admin-v1-${clinicId || 'x'}`;
  const layout = useDashboardLayout(storageKey, ADMIN_WIDGET_DEFS);

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
    const h = () => reload().then(() => load()).catch(() => {});
    window.addEventListener('clinic-role-changed', h);
    return () => window.removeEventListener('clinic-role-changed', h);
  }, [reload, load]);

  const k = data?.kpis || {};
  const growth = data?.charts?.patient_growth || [];
  const revenue = data?.charts?.revenue_6m || [];
  const workload = data?.therapist_workload || [];
  const upcoming = data?.upcoming_appointments || [];
  const packages = data?.package_expiry_alerts || [];

  const growthChart = useMemo(
    () => ({
      labels: growth.map((r) => r.ym),
      datasets: [
        {
          label: 'Patients',
          data: growth.map((r) => Number(r.patients || 0)),
          borderColor: DASH_CHART_COLORS.line.border,
          backgroundColor: DASH_CHART_COLORS.line.fill,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: DASH_CHART_COLORS.line.point,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }),
    [growth]
  );

  const revenueChart = useMemo(
    () => ({
      labels: revenue.map((r) => r.ym),
      datasets: [
        {
          label: 'Revenue',
          data: revenue.map((r) => Number(r.total || 0)),
          backgroundColor: DASH_CHART_COLORS.bar.fill,
          hoverBackgroundColor: DASH_CHART_COLORS.bar.hover,
          borderRadius: 12,
          maxBarThickness: 40,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    }),
    [revenue]
  );

  const markedDates = useMemo(
    () => [...new Set(upcoming.map((a) => a.appointment_date).filter(Boolean))],
    [upcoming]
  );

  const widgets = useMemo(
    () => [
      {
        id: 'quick_actions',
        title: 'Quick actions',
        icon: 'fa-bolt',
        span: 'full',
        render: () => <ClinicQuickActions isAdmin />,
      },
      {
        id: 'revenue_summary',
        title: 'Revenue summary',
        icon: 'fa-sack-dollar',
        span: 'full',
        action: (
          <Link to="/clinic-portal/earnings" className="dash-widget-link">
            Finance →
          </Link>
        ),
        render: () => (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DashboardKpiCard icon="fa-indian-rupee-sign" label="Today" value={inr(k.today_revenue)} tint="emerald" />
            <DashboardKpiCard icon="fa-calendar" label="This month" value={inr(k.month_revenue)} tint="primary" />
            <DashboardKpiCard icon="fa-chart-column" label="All time" value={inr(k.total_revenue)} tint="orange" />
            <DashboardKpiCard
              icon="fa-file-invoice-dollar"
              label="Pending payments"
              value={inr(k.pending_payments)}
              tint="rose"
              hint={`${k.monthly_growth ?? 0}% MoM growth`}
            />
          </div>
        ),
      },
      {
        id: 'charts_growth',
        title: 'Patient growth',
        icon: 'fa-chart-line',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        render: () => (
          <div className="dash-chart-wrap">
            {growth.length ? (
              <div className="dash-chart-canvas">
                <Line data={growthChart} options={dashChartOptions} />
              </div>
            ) : (
              <p className="dash-empty">No growth data yet</p>
            )}
          </div>
        ),
      },
      {
        id: 'charts_revenue',
        title: 'Revenue (6 months)',
        icon: 'fa-chart-column',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        render: () => (
          <div className="dash-chart-wrap">
            {revenue.length ? (
              <div className="dash-chart-canvas">
                <Bar data={revenueChart} options={dashChartOptions} />
              </div>
            ) : (
              <p className="dash-empty">No revenue data yet</p>
            )}
          </div>
        ),
      },
      {
        id: 'therapist_workload',
        title: 'Therapist workload',
        icon: 'fa-user-doctor',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        render: () =>
          workload.length === 0 ? (
            <p className="dash-empty !py-8">No data this month.</p>
          ) : (
            <ul className="space-y-2.5 max-h-56 overflow-y-auto">
              {workload.map((w) => {
                const pct =
                  Number(w.appointments) > 0
                    ? Math.round((Number(w.completed || 0) / Number(w.appointments)) * 100)
                    : 0;
                return (
                  <li key={w.doctor_id}>
                    <div className="flex justify-between text-sm gap-2 mb-1">
                      <span className="truncate font-medium text-slate-800">{w.name}</span>
                      <span className="text-slate-500 shrink-0 text-xs">
                        {w.completed}/{w.appointments}
                      </span>
                    </div>
                    <div className="dash-progress-track">
                      <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ),
      },
      {
        id: 'upcoming',
        title: 'Upcoming appointments',
        icon: 'fa-calendar-check',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        action: (
          <Link to="/clinic-portal/appointments" className="dash-widget-link">
            Open →
          </Link>
        ),
        render: () =>
          upcoming.length === 0 ? (
            <p className="dash-empty !py-8">Nothing upcoming.</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {upcoming.map((a) => (
                <li key={a.id} className="text-sm dash-queue-item !py-2">
                  <p className="font-medium text-slate-800 truncate">{a.patient_name}</p>
                  <p className="text-xs text-slate-500">
                    {a.appointment_date} {formatTime(a.start_time)} · {a.doctor_name}
                  </p>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'package_alerts',
        title: 'Package expiry alerts',
        icon: 'fa-box-open',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        action: (
          <Link to="/clinic-portal/packages" className="dash-widget-link">
            Packages →
          </Link>
        ),
        render: () =>
          packages.length === 0 ? (
            <p className="dash-empty !py-8">No packages expiring this week.</p>
          ) : (
            <ul className="space-y-2">
              {packages.map((p, i) => (
                <li key={i} className="text-sm rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <p className="font-medium text-slate-800">{p.package_name}</p>
                  <p className="text-xs text-amber-700 mt-0.5">Expires {p.end_date}</p>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'team',
        title: 'Team availability',
        icon: 'fa-users',
        span: 'half',
        bodyClassName: 'admin-widget-body',
        render: () => <TeamAvailabilityWidget clinicId={clinicId} />,
      },
      {
        id: 'calendar',
        title: 'Calendar',
        icon: 'fa-calendar-days',
        span: 'full',
        bodyClassName: 'admin-widget-body',
        render: () => (
          <div className="admin-calendar-wrap">
            <MiniMonthCalendar markedDates={markedDates} />
          </div>
        ),
      },
    ],
    [
      k,
      growth,
      revenue,
      growthChart,
      revenueChart,
      workload,
      upcoming,
      packages,
      clinicId,
      markedDates,
    ]
  );

  if (!boot && !isAdminMode) {
    return <Navigate to="/clinic-portal" replace />;
  }

  return (
    <ClinicPortalShell
      title="Clinic Admin Dashboard"
      subtitle="Live operations, revenue and therapist performance"
      actions={
        <DashboardCustomizeToolbar
          customize={layout.customize}
          onToggle={() => layout.setCustomize((v) => !v)}
          onReset={layout.reset}
        />
      }
    >
      {!can('dashboard.admin') ? (
        <div className="glass-card text-center py-12 text-slate-500">No analytics access in this mode.</div>
      ) : loading || boot ? (
        <div className="space-y-4">
          <div className="portal-kpi-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="dash-kpi h-20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="dash-hero">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="dash-hero-badge">
                  <FaIcon icon="fa-shield-halved" />
                  Clinic Admin
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
                  {clinic?.name || 'Operations overview'}
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 max-w-lg">
                  Customize widgets anytime — layout is saved on this device.
                </p>
              </div>
              <button type="button" className="btn-outline text-xs !py-2 w-full sm:w-auto shrink-0" onClick={load}>
                <FaIcon icon="fa-rotate" className="mr-1.5" />
                Refresh analytics
              </button>
            </div>
          </div>

          <div className="portal-kpi-grid">
            <DashboardKpiCard icon="fa-calendar-check" label="Today's appointments" value={k.today_appointments ?? 0} />
            <DashboardKpiCard icon="fa-person-walking" label="Today's walk-ins" value={k.today_walkins ?? 0} tint="sky" />
            <DashboardKpiCard icon="fa-user-plus" label="New patients (month)" value={k.new_patients ?? 0} tint="emerald" />
            <DashboardKpiCard icon="fa-users" label="Active patients" value={k.active_patients ?? 0} tint="orange" />
            <DashboardKpiCard icon="fa-rotate" label="Pending follow-ups" value={k.pending_followups ?? 0} tint="amber" />
            <DashboardKpiCard icon="fa-calendar-xmark" label="Missed / cancelled" value={k.missed_appointments ?? 0} tint="rose" />
            <DashboardKpiCard icon="fa-circle-check" label="Sessions completed" value={k.sessions_completed ?? 0} />
            <DashboardKpiCard icon="fa-heart-pulse" label="Retention rate" value={`${k.patient_retention ?? 0}%`} tint="rose" />
            <DashboardKpiCard icon="fa-star" label="Avg rating" value={k.avg_rating ?? '—'} tint="amber" />
            <DashboardKpiCard icon="fa-arrow-trend-up" label="Monthly growth" value={`${k.monthly_growth ?? 0}%`} tint="emerald" />
            <DashboardKpiCard icon="fa-calendar-week" label="Weekly appointments" value={k.weekly_appointments ?? 0} />
            <DashboardKpiCard icon="fa-user-doctor" label="Top therapist" value={k.top_therapist?.name || '—'} tint="primary" />
          </div>

          {shortcutsAtTop && (
            <ClinicQuickWork variant="admin" onPlaceAtTopChange={setShortcutsAtTop} />
          )}

          <DashboardWidgetBoard
            widgets={widgets}
            visibleIds={layout.visibleIds}
            customize={layout.customize}
            isHidden={layout.isHidden}
            onReorder={layout.reorder}
            onToggleHidden={layout.toggleHidden}
            boardClassName="admin-dash-board"
          />

          {!shortcutsAtTop && (
            <ClinicQuickWork variant="admin" onPlaceAtTopChange={setShortcutsAtTop} />
          )}
        </div>
      )}
    </ClinicPortalShell>
  );
}
