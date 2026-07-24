import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Line, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';
import { STATUS_STYLES, TYPE_ICONS, formatTime, formatType } from '../../utils/appointmentListUtils';

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

function fillLast14Days(rows) {
  const map = Object.fromEntries((rows || []).map((r) => [String(r.day).slice(0, 10), Number(r.c || 0)]));
  const labels = [];
  const data = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    data.push(map[iso] ?? 0);
  }
  return { labels, data };
}

function MetricCard({ icon, label, value, tint = 'primary', to }) {
  const tints = {
    primary: 'bg-primary-50 text-primary-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  const body = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tints[tint] || tints.primary}`}>
        <FaIcon icon={icon} />
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{label}</p>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="glass-card !p-4 block hover:border-teal-300 transition">
        {body}
      </Link>
    );
  }
  return <div className="glass-card !p-4">{body}</div>;
}

export default function ClinicPortalHome() {
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await clinicPortal.me();
      const meData = meRes.data || meRes;
      setMe(meData);
      const clinicId = meData.clinic?.id;
      if (!clinicId) {
        setData(null);
        return;
      }
      const ov = await clinicPortal.overview(clinicId);
      setData(ov.data || ov);
    } catch (e) {
      toast.error(e.message || 'Could not load clinic portal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clinic = data?.clinic || me?.clinic;
  const m = data?.metrics || {};
  const status = clinic?.portal_status || clinic?.approval_status || 'pending';
  const pending = !me?.portal_ready && status !== 'approved';

  const line14 = useMemo(() => fillLast14Days(data?.chart?.appointments_14d), [data]);
  const statusCounts = data?.status_counts || {};

  const lineChart = useMemo(
    () => ({
      labels: line14.labels,
      datasets: [
        {
          label: 'Appointments',
          data: line14.data,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [line14]
  );

  const statusChart = useMemo(() => {
    const entries = Object.entries(statusCounts);
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      completed: '#0284c7',
      cancelled: '#ef4444',
      rejected: '#f43f5e',
      no_show: '#64748b',
    };
    return {
      labels: entries.map(([k]) => k.replace(/_/g, ' ')),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => colors[k] || '#94a3b8'),
          borderWidth: 0,
        },
      ],
    };
  }, [statusCounts]);

  const quickLinks = [
    { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', desc: 'Today & full list' },
    { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', desc: 'Visit history' },
    { to: '/clinic-portal/doctors', label: 'Doctors', icon: 'fa-user-doctor', desc: 'Invite & approve' },
    { to: '/clinic-portal/earnings', label: 'Earnings', icon: 'fa-sack-dollar', desc: 'Revenue reports' },
  ];

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{clinic?.name || 'Clinic Portal'}</h1>
            <p className="text-sm text-slate-500 mt-1">Operations overview — appointments, doctors, patients & revenue</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-900'
              }`}
            >
              {String(status).replace('_', ' ')}
            </span>
            <button type="button" className="btn-outline !py-1.5 text-xs" onClick={load}>
              Refresh
            </button>
          </div>
        </div>

        {pending && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p className="font-bold mb-1">Waiting for admin approval</p>
            <p>
              Your clinic account is registered. Complete your profile and wait for Super Admin approval before going
              live on the public directory.
            </p>
            {clinic?.rejection_reason && (
              <p className="mt-2 font-medium text-rose-700">Rejection reason: {clinic.rejection_reason}</p>
            )}
            <Link to="/clinic-portal/profile" className="inline-flex mt-3 text-sm font-semibold text-primary-700 underline">
              Update clinic profile →
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon="fa-users" label="Total patients" value={m.total_patients ?? 0} tint="primary" to="/clinic-portal/patients" />
              <MetricCard icon="fa-calendar-day" label="Today's appointments" value={m.today_appointments ?? 0} tint="teal" to="/clinic-portal/appointments" />
              <MetricCard icon="fa-user-doctor" label="Active doctors" value={m.active_doctors ?? 0} tint="violet" to="/clinic-portal/doctors" />
              <MetricCard icon="fa-indian-rupee-sign" label="Revenue (month)" value={inr(m.revenue_month)} tint="emerald" to="/clinic-portal/earnings" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon="fa-clock" label="Upcoming" value={m.upcoming_appointments ?? 0} tint="amber" to="/clinic-portal/appointments" />
              <MetricCard icon="fa-circle-check" label="Completed today" value={m.today_completed ?? 0} tint="emerald" />
              <MetricCard icon="fa-chart-line" label="Completion rate" value={`${m.completion_rate ?? 0}%`} tint="primary" />
              <MetricCard
                icon="fa-inbox"
                label="Join requests"
                value={m.pending_join_requests ?? 0}
                tint="violet"
                to="/clinic-portal/doctors"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="glass-card !p-4 flex items-center gap-3 hover:border-teal-300 transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                    <FaIcon icon={l.icon} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{l.label}</p>
                    <p className="text-xs text-slate-500">{l.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-4">Appointments — last 14 days</h2>
                <Line
                  data={lineChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  }}
                />
              </div>
              <div className="lg:col-span-2 glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-4">This month by status</h2>
                {Object.keys(statusCounts).length ? (
                  <div className="max-w-[220px] mx-auto">
                    <Doughnut data={statusChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-12">No appointments this month</p>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-900">Therapist workload</h2>
                  <Link to="/clinic-portal/doctors" className="text-xs font-semibold text-teal-700 hover:underline">
                    Manage doctors
                  </Link>
                </div>
                <ul className="space-y-2">
                  {(data?.therapist_workload || []).map((t) => (
                    <li key={t.doctor_id} className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                      <span className="font-medium text-slate-800">{t.name}</span>
                      <span className="text-slate-500">
                        {t.appointments} appts · {t.completed} done
                      </span>
                    </li>
                  ))}
                  {!(data?.therapist_workload || []).length && (
                    <p className="text-sm text-slate-500 py-6 text-center">No doctor activity this month</p>
                  )}
                </ul>
              </div>

              <div className="glass-card !p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-900">Recent appointments</h2>
                  <Link to="/clinic-portal/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="space-y-1">
                  {(data?.recent_appointments || []).map((a) => (
                    <li key={a.id} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <FaIcon icon={TYPE_ICONS[a.consultation_type] || 'fa-calendar'} className="text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{a.patient_name || 'Patient'}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[a.status] || ''}`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {a.doctor_name || '—'} · {a.appointment_date} {formatTime(a.start_time)} · {formatType(a.consultation_type)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {!(data?.recent_appointments || []).length && (
                    <p className="text-sm text-slate-500 py-6 text-center">No recent bookings</p>
                  )}
                </ul>
              </div>
            </div>

            <div className="glass-card !p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-slate-600">
                Lifetime revenue: <strong className="text-emerald-700">{inr(m.revenue_total)}</strong>
                <span className="text-slate-400 mx-2">·</span>
                Active patients (90d): <strong>{m.active_patients ?? 0}</strong>
              </p>
              <Link to="/clinic-portal/profile" className="btn-outline text-xs">
                Edit clinic profile
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
