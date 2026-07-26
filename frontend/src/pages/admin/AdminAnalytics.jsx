import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import { downloadAuthenticatedFile } from '../../utils/downloadFile';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function Kpi({ label, value, sub, icon, tint = 'teal', trend }) {
  const tints = {
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="glass-card !p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 leading-tight truncate">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <FaIcon icon={trend >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} className="mr-1" />
              {trend >= 0 ? '+' : ''}
              {trend}% vs prior period
            </p>
          )}
        </div>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tints[tint]}`}>
          <FaIcon icon={icon} />
        </span>
      </div>
    </div>
  );
}

const EXPORTS = [
  { type: 'summary', label: 'Summary KPIs', icon: 'fa-clipboard-list' },
  { type: 'revenue', label: 'Revenue by day', icon: 'fa-indian-rupee-sign' },
  { type: 'therapists', label: 'Best therapists', icon: 'fa-user-doctor' },
  { type: 'patients', label: 'New / old patients', icon: 'fa-users' },
  { type: 'packages', label: 'Package sales', icon: 'fa-box-open' },
  { type: 'appointments', label: 'Appointments', icon: 'fa-calendar-check' },
];

const RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '12m', label: '12 months' },
];

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { font: { size: 10 } } },
  },
};

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    admin.analyticsOverview().then((r) => setOverview(r.data)).catch(() => {});
  }, []);

  const loadReports = useCallback(() => {
    setLoading(true);
    admin
      .analyticsReports({ range })
      .then((r) => setReports(r.data))
      .catch((e) => toast.error(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const k = reports?.kpis || {};
  const best = k.best_therapist;

  const monthlyChart = useMemo(() => {
    const rows = reports?.monthly_revenue || [];
    return {
      labels: rows.map((r) => r.month),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((r) => Number(r.revenue)),
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [reports]);

  const dailyChart = useMemo(() => {
    const rows = reports?.revenue_by_day || [];
    return {
      labels: rows.map((r) => String(r.day).slice(5)),
      datasets: [
        {
          label: 'Daily revenue',
          data: rows.map((r) => Number(r.revenue)),
          backgroundColor: '#14b8a6',
          borderRadius: 4,
        },
      ],
    };
  }, [reports]);

  const patientMixChart = useMemo(() => {
    const rows = reports?.patient_mix || [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          data: rows.map((r) => Number(r.count)),
          backgroundColor: ['#0ea5e9', '#8b5cf6'],
          borderWidth: 0,
        },
      ],
    };
  }, [reports]);

  const statusChart = useMemo(() => {
    const rows = reports?.appointment_status || [];
    const colors = {
      completed: '#10b981',
      confirmed: '#14b8a6',
      pending: '#f59e0b',
      cancelled: '#f43f5e',
      rejected: '#e11d48',
      no_show: '#94a3b8',
    };
    return {
      labels: rows.map((r) => r.status),
      datasets: [
        {
          data: rows.map((r) => Number(r.count)),
          backgroundColor: rows.map((r) => colors[r.status] || '#64748b'),
          borderWidth: 0,
        },
      ],
    };
  }, [reports]);

  const packageChart = useMemo(() => {
    const rows = (reports?.package_sales || []).slice(0, 8);
    return {
      labels: rows.map((r) => (r.package_name || 'Package').slice(0, 18)),
      datasets: [
        {
          label: 'Amount',
          data: rows.map((r) => Number(r.amount)),
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
      ],
    };
  }, [reports]);

  const download = async (type) => {
    setExporting(type);
    try {
      await downloadAuthenticatedFile(
        `/admin/analytics/export?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`,
        `analytics_${type}_${range}.csv`
      );
      toast.success('Report downloaded');
    } catch (e) {
      toast.error(e?.message || 'Download failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Analytics & Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Monthly revenue, therapists, patients, success rate, satisfaction, growth and package sales.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  range === r.id
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadReports}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <FaIcon icon={loading ? 'fa-spinner' : 'fa-rotate'} className={loading ? 'fa-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Core KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            label="Monthly Revenue"
            value={loading && !reports ? '…' : inr(k.monthly_revenue)}
            sub={`Prior period ${inr(k.previous_revenue)}`}
            icon="fa-indian-rupee-sign"
            tint="teal"
            trend={k.revenue_growth_pct}
          />
          <Kpi
            label="Best Therapist"
            value={best?.name ? `Dr. ${best.name}` : '—'}
            sub={best ? `${best.completed} completed · ${inr(best.revenue)} · ★${best.rating_avg}` : 'No data in range'}
            icon="fa-trophy"
            tint="amber"
          />
          <Kpi
            label="New Patients"
            value={k.new_patients ?? '—'}
            sub="First visit in this period"
            icon="fa-user-plus"
            tint="sky"
          />
          <Kpi
            label="Old Patients"
            value={k.old_patients ?? '—'}
            sub="Returning in this period"
            icon="fa-user-check"
            tint="violet"
          />
          <Kpi
            label="Success Rate"
            value={k.success_rate_pct != null ? `${k.success_rate_pct}%` : '—'}
            sub={`${k.success_completed || 0} completed of ${k.success_total || 0} closed`}
            icon="fa-circle-check"
            tint="emerald"
          />
          <Kpi
            label="Patient Satisfaction"
            value={k.patient_satisfaction != null ? `${k.patient_satisfaction} / 5` : '—'}
            sub={`${k.satisfaction_reviews || 0} approved reviews`}
            icon="fa-face-smile"
            tint="orange"
          />
          <Kpi
            label="Revenue Growth"
            value={k.revenue_growth_pct != null ? `${k.revenue_growth_pct >= 0 ? '+' : ''}${k.revenue_growth_pct}%` : '—'}
            sub="vs previous equal period"
            icon="fa-chart-line"
            tint={k.revenue_growth_pct >= 0 ? 'emerald' : 'rose'}
          />
          <Kpi
            label="Package Sales"
            value={k.package_sales_count ?? '—'}
            sub={inr(k.package_sales_amount)}
            icon="fa-box-open"
            tint="indigo"
          />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-chart-area" className="text-teal-600" />
              Monthly Revenue (12 months)
            </h2>
            <div className="h-56">
              {(reports?.monthly_revenue || []).length ? (
                <Line data={monthlyChart} options={chartOpts} />
              ) : (
                <p className="text-sm text-slate-400 text-center pt-16">{loading ? 'Loading…' : 'No revenue data'}</p>
              )}
            </div>
          </div>
          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-chart-column" className="text-teal-600" />
              Daily Revenue (period)
            </h2>
            <div className="h-56">
              {(reports?.revenue_by_day || []).length ? (
                <Bar data={dailyChart} options={chartOpts} />
              ) : (
                <p className="text-sm text-slate-400 text-center pt-16">{loading ? 'Loading…' : 'No daily data'}</p>
              )}
            </div>
          </div>
          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-users" className="text-sky-600" />
              New vs Old Patients
            </h2>
            <div className="h-52 flex items-center justify-center">
              {(k.new_patients || 0) + (k.old_patients || 0) > 0 ? (
                <div className="w-44 h-44">
                  <Doughnut
                    data={patientMixChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">{loading ? 'Loading…' : 'No patients in range'}</p>
              )}
            </div>
          </div>
          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-pie-chart" className="text-emerald-600" />
              Appointment Status (success mix)
            </h2>
            <div className="h-52 flex items-center justify-center">
              {(reports?.appointment_status || []).length ? (
                <div className="w-44 h-44">
                  <Doughnut
                    data={statusChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">{loading ? 'Loading…' : 'No appointments'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Best therapists + package sales */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-trophy" className="text-amber-500" />
              Best Therapists
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Therapist</th>
                    <th className="py-2 pr-2">Done</th>
                    <th className="py-2 pr-2">Revenue</th>
                    <th className="py-2 pr-2">★</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(reports?.best_therapists || []).map((t, i) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium text-slate-800">Dr. {t.name}</td>
                      <td className="py-2 pr-2 text-slate-600">{t.completed}</td>
                      <td className="py-2 pr-2 text-slate-600">{inr(t.revenue)}</td>
                      <td className="py-2 pr-2 text-slate-600">{t.rating_avg}</td>
                      <td className="py-2 font-semibold text-teal-700">{t.score}</td>
                    </tr>
                  ))}
                  {!loading && !(reports?.best_therapists || []).length && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No therapist activity in this range
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card !p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-box-open" className="text-indigo-500" />
              Package Sales
            </h2>
            <div className="h-40 mb-3">
              {(reports?.package_sales || []).length ? (
                <Bar
                  data={packageChart}
                  options={{
                    ...chartOpts,
                    indexAxis: 'y',
                    scales: {
                      x: { grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { font: { size: 10 } } },
                      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    },
                  }}
                />
              ) : (
                <p className="text-sm text-slate-400 text-center pt-10">{loading ? 'Loading…' : 'No package sales'}</p>
              )}
            </div>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto text-sm">
              {(reports?.package_sales || []).slice(0, 8).map((p, i) => (
                <li key={`${p.source}-${i}`} className="flex justify-between gap-2">
                  <span className="truncate text-slate-700">
                    {p.package_name}
                    <span className="text-[10px] text-slate-400 ml-1 capitalize">({p.source?.replace('_', ' ')})</span>
                  </span>
                  <span className="shrink-0 font-medium text-slate-800">{inr(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Download reports */}
        <div className="glass-card !p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FaIcon icon="fa-file-csv" className="text-teal-600" />
              Download Reports
            </h2>
            <p className="text-xs text-slate-500">CSV · range: {range} · Excel-compatible (UTF-8)</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {EXPORTS.map((ex) => (
              <button
                key={ex.type}
                type="button"
                onClick={() => download(ex.type)}
                disabled={!!exporting}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40 px-3 py-3 text-center transition disabled:opacity-50"
              >
                <FaIcon
                  icon={exporting === ex.type ? 'fa-spinner' : ex.icon}
                  className={`text-lg ${exporting === ex.type ? 'fa-spin text-teal-600' : 'text-slate-500'}`}
                />
                <span className="text-xs font-semibold text-slate-700">{ex.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary / legacy overview cards */}
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Doctor reviews" value={overview.reviews?.doctor_reviews_total} icon="fa-star" tint="amber" sub={`Avg ★${overview.reviews?.doctor_avg_rating || 0}`} />
            <Kpi label="Clinic reviews" value={overview.reviews?.clinic_reviews_total} icon="fa-hospital" tint="sky" sub={`Avg ★${overview.reviews?.clinic_avg_rating || 0}`} />
            <Kpi label="Coupon redemptions" value={overview.coupons?.total_redemptions} icon="fa-tag" tint="violet" sub={`Discount ${inr(overview.coupons?.discount_given)}`} />
            <Kpi label="PhysioFeed views" value={overview.feed?.total_views} icon="fa-rss" tint="orange" sub={`${overview.feed?.published || 0} published`} />
          </div>
        )}

        {(reports?.coupon_usage || []).length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card !p-4">
              <h2 className="font-bold mb-3">Coupon usage</h2>
              <ul className="space-y-2 text-sm">
                {reports.coupon_usage.map((c) => (
                  <li key={c.code} className="flex justify-between gap-2">
                    <span className="font-medium text-slate-800">{c.code}</span>
                    <span className="text-slate-500">
                      {c.redemptions} uses · {inr(c.total_discount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card !p-4">
              <h2 className="font-bold mb-3">PhysioFeed performance</h2>
              <div className="flex flex-wrap gap-2">
                {(reports.feed_performance || []).map((f) => (
                  <span key={f.type} className="px-3 py-2 rounded-xl bg-slate-100 text-sm capitalize">
                    {f.type}: {f.posts} posts · {f.views} views
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
