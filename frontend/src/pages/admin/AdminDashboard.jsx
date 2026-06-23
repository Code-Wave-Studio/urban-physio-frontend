import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import PasswordSetupAlert from '../../components/PasswordSetupAlert';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { STATUS_STYLES, TYPE_ICONS, formatTime, formatType, patientLabel } from '../../utils/appointmentListUtils';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function fillLast14Days(rows, key = 'day', valueKey = 'count') {
  const map = Object.fromEntries((rows || []).map((r) => [String(r[key]).slice(0, 10), Number(r[valueKey] || 0)]));
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

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function adminApptSubtitle(appt) {
  const patient = patientLabel(appt);
  const doctor = `Dr. ${[appt.doctor_first_name, appt.doctor_last_name].filter(Boolean).join(' ') || '—'}`;
  return `${patient} · ${doctor}`;
}

function MiniApptRow({ appt }) {
  const typeIcon = TYPE_ICONS[appt.consultation_type] || 'fa-calendar';
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
        <FaIcon icon={typeIcon} className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-800 text-sm truncate">{adminApptSubtitle(appt)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
            {appt.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatDate(appt.appointment_date)} · {formatTime(appt.start_time)} · {formatType(appt.consultation_type)}
        </p>
        {appt.booking_id && <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.booking_id}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-slate-800 text-sm">{money(appt.amount)}</p>
        <p className="text-xs text-slate-500 capitalize">{appt.payment_status || 'pending'}</p>
      </div>
    </div>
  );
}

function PendingDoctorRow({ doc }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-slate-800">
          Dr. {doc.first_name} {doc.last_name}
        </p>
        <p className="text-xs text-slate-500 truncate">{doc.specialization || '—'} · {doc.city_name || 'No city'}</p>
        <p className="text-xs text-slate-400 truncate">{doc.email}</p>
      </div>
      <Link
        to="/admin/users?role=doctor"
        className="text-xs shrink-0 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-medium hover:bg-amber-200"
      >
        Review
      </Link>
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: '/admin/locations', label: 'States & Cities', desc: 'Doctors & patients by region', icon: 'fa-map-location-dot', color: 'from-sky-500 to-cyan-600' },
  { to: '/admin/users', label: 'Manage Users', desc: 'Verify doctors, profiles & status', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
  { to: '/admin/users?role=doctor', label: 'Pending Doctors', desc: 'Review unverified practitioners', icon: 'fa-clock', color: 'from-amber-500 to-orange-600' },
  { to: '/admin/appointments', label: 'Appointments', desc: 'All bookings & status updates', icon: 'fa-calendar-check', color: 'from-primary-500 to-primary-700' },
  { to: '/admin/emergency', label: 'Emergency', desc: 'Urgent care management', icon: 'fa-truck-medical', color: 'from-rose-500 to-red-600' },
  { to: '/admin/clinics', label: 'Clinics', desc: 'Approve & manage partner clinics', icon: 'fa-hospital', color: 'from-emerald-500 to-teal-600' },
  { to: '/admin/conditions', label: 'Conditions', desc: 'Rehab programs & content', icon: 'fa-notes-medical', color: 'from-indigo-500 to-violet-600' },
  { to: '/admin/treatments', label: 'Treatments', desc: 'Treatment pages CMS', icon: 'fa-hand-holding-medical', color: 'from-orange-500 to-primary-600' },
];

const EMPTY = {
  stats: {},
  by_status: {},
  by_type: {},
  revenue_chart: [],
  revenue_trends: [],
  booking_trends: [],
  user_growth: [],
  recent_bookings: [],
  pending_appointments: [],
  today_schedule: [],
  pending_doctors: [],
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    admin
      .dashboard()
      .then((res) => {
        const payload = res?.data ?? res;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          setData({
            stats: payload.stats || {},
            by_status: payload.by_status || {},
            by_type: payload.by_type || {},
            revenue_chart: payload.revenue_chart || [],
            revenue_trends: payload.revenue_trends || [],
            booking_trends: payload.booking_trends || [],
            user_growth: payload.user_growth || [],
            recent_bookings: payload.recent_bookings || [],
            pending_appointments: payload.pending_appointments || [],
            today_schedule: payload.today_schedule || [],
            pending_doctors: payload.pending_doctors || [],
          });
        } else {
          throw new Error('Invalid response');
        }
      })
      .catch((e) => {
        toast.error(e.message || 'Could not load admin dashboard');
        setData(EMPTY);
      });
  }, []);

  const bookingChart = useMemo(() => {
    const { labels, data: values } = fillLast14Days(data?.booking_trends, 'day', 'count');
    return { labels, datasets: [{ label: 'New bookings', data: values, backgroundColor: 'rgba(37, 99, 235, 0.75)', borderRadius: 6 }] };
  }, [data]);

  const revenueDailyChart = useMemo(() => {
    const { labels, data: values } = fillLast14Days(data?.revenue_trends, 'day', 'total');
    return {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: values,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        fill: true,
        tension: 0.35,
      }],
    };
  }, [data]);

  const revenueMonthlyChart = useMemo(() => ({
    labels: data?.revenue_chart?.map((r) => r.month) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: data?.revenue_chart?.map((r) => Number(r.total)) || [],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  }), [data]);

  const userGrowthChart = useMemo(() => ({
    labels: data?.user_growth?.map((r) => r.month) || [],
    datasets: [{
      label: 'New users',
      data: data?.user_growth?.map((r) => Number(r.count)) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.7)',
      borderRadius: 6,
    }],
  }), [data]);

  const statusChart = useMemo(() => {
    const bs = data?.by_status || {};
    const labels = Object.keys(bs).map((s) => s.replace(/_/g, ' '));
    return {
      labels,
      datasets: [{
        data: Object.values(bs),
        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#94a3b8'],
        borderWidth: 0,
      }],
    };
  }, [data]);

  const typeChart = useMemo(() => {
    const bt = data?.by_type || {};
    return {
      labels: ['Online', 'Clinic', 'Home visit'],
      datasets: [{
        data: ['online', 'clinic', 'home_visit'].map((k) => bt[k] || 0),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
        borderWidth: 0,
      }],
    };
  }, [data]);

  if (!data) {
    return (
      <AdminDashboardLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const s = data.stats;
  const adminName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin';

  const statCards = [
    { label: 'Total users', value: s.users ?? 0, color: 'text-slate-800', sub: `${s.active_users ?? 0} active` },
    { label: 'Patients', value: s.patients ?? 0, color: 'text-sky-600', sub: 'Registered patients' },
    { label: 'Doctors', value: s.doctors ?? 0, color: 'text-violet-600', sub: `${s.verified_doctors ?? 0} verified` },
    { label: 'Pending doctors', value: s.pending_doctors ?? 0, color: 'text-amber-600', sub: 'Need verification' },
    { label: 'Total bookings', value: s.appointments ?? 0, color: 'text-slate-800', sub: `${s.new_appointments_month ?? 0} this month` },
    { label: 'Pending bookings', value: s.pending_appointments ?? 0, color: 'text-amber-600', sub: 'Awaiting action' },
    { label: "Today's sessions", value: s.today_appointments ?? 0, color: 'text-primary-600', sub: `${s.upcoming_appointments ?? 0} upcoming` },
    { label: 'Total revenue', value: money(s.revenue), color: 'text-emerald-700', sub: `${s.paid_payments ?? 0} paid` },
    { label: 'This month', value: money(s.monthly_revenue), color: 'text-green-600', sub: money(s.today_revenue) + ' today' },
    { label: 'Pending payments', value: money(s.pending_payment_amount), color: 'text-amber-700', sub: `${s.pending_payments ?? 0} transactions` },
    { label: 'Content', value: (s.conditions ?? 0) + (s.treatments ?? 0), color: 'text-slate-800', sub: `${s.conditions ?? 0} conditions · ${s.treatments ?? 0} treatments` },
    { label: 'Clinics', value: s.clinics ?? 0, color: 'text-slate-700', sub: `${s.new_users_month ?? 0} new users/mo` },
  ];

  return (
    <AdminDashboardLayout>
      <PasswordSetupAlert profilePath="/admin/profile" />
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-primary-900 text-white p-5 sm:p-8 mb-6 md:mb-8 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-300 text-sm font-medium">The Urban Physio Admin Console</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Welcome, {adminName}</h1>
            <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-xl">
              Platform overview — users, bookings, revenue, and items that need your attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-100 transition text-sm"
            >
              <FaIcon icon="fa-calendar-check" />
              All appointments
            </Link>
            {(s.pending_doctors ?? 0) > 0 && (
              <Link
                to="/admin/users?role=doctor"
                className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-300 transition text-sm"
              >
                {s.pending_doctors} doctors to verify
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6 md:mb-8">
        {statCards.map(({ label, value, color, sub }) => (
          <div key={label} className="glass-card !p-3 md:!p-4 hover:shadow-md transition-shadow border border-white/80">
            <p className="text-xs text-slate-500 leading-tight">{label}</p>
            <p className={`text-lg sm:text-xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(s.pending_doctors ?? 0) > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-900">{s.pending_doctors} doctor{s.pending_doctors !== 1 ? 's' : ''} awaiting verification</p>
              <p className="text-sm text-amber-800 mt-0.5">Review profiles before they accept bookings.</p>
            </div>
            <Link to="/admin/users?role=doctor" className="btn-primary !py-2 text-sm shrink-0 bg-amber-600 hover:bg-amber-700">
              Review doctors →
            </Link>
          </div>
        )}
        {(s.pending_appointments ?? 0) > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-orange-900">{s.pending_appointments} pending appointment{s.pending_appointments !== 1 ? 's' : ''}</p>
              <p className="text-sm text-orange-800 mt-0.5">Bookings waiting for doctor or system action.</p>
            </div>
            <Link to="/admin/appointments?status=pending" className="btn-primary !py-2 text-sm shrink-0">
              View bookings →
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 md:p-5 shadow-sm hover:shadow-lg hover:border-primary-200/60 transition"
          >
            <div
              className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${a.color} opacity-20 group-hover:opacity-30 transition`}
            />
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.color} text-white flex items-center justify-center mb-3 shadow-md`}
            >
              <FaIcon icon={a.icon} className="text-base" />
            </div>
            <p className="font-bold text-slate-900 text-sm md:text-base group-hover:text-primary-700">{a.label}</p>
            <p className="text-xs md:text-sm text-slate-600 mt-0.5">{a.desc}</p>
            <FaIcon
              icon="fa-arrow-right"
              className="absolute bottom-4 right-4 text-slate-300 group-hover:text-primary-600 transition"
            />
          </Link>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card lg:col-span-2 !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">Bookings — last 14 days</h3>
          <p className="text-xs text-slate-500 mb-4">New appointments created per day</p>
          <Bar data={bookingChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
        </div>
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">By status</h3>
          <p className="text-xs text-slate-500 mb-4">All-time breakdown</p>
          <div className="max-w-[200px] mx-auto">
            <Doughnut data={statusChart} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">Revenue — last 14 days</h3>
          <p className="text-xs text-slate-500 mb-4">Paid payments per day</p>
          <Line data={revenueDailyChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">Revenue — last 6 months</h3>
          <p className="text-xs text-slate-500 mb-4">Monthly paid total</p>
          <Line data={revenueMonthlyChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">User growth</h3>
          <p className="text-xs text-slate-500 mb-4">Registrations per month</p>
          <Bar data={userGrowthChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
        </div>
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800">Consultation types</h3>
          <p className="text-xs text-slate-500 mb-4">All bookings by mode</p>
          <div className="max-w-[200px] mx-auto">
            <Doughnut data={typeChart} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card bg-slate-50/80">
          <h3 className="font-semibold text-slate-800 mb-3">Appointment summary</h3>
          <ul className="space-y-2 text-sm">
            {[
              ['Confirmed', s.confirmed_appointments, 'text-emerald-700'],
              ['Completed', s.completed_appointments, 'text-blue-700'],
              ['Cancelled', s.cancelled_appointments, 'text-red-600'],
              ['Inactive users', s.inactive_users, 'text-slate-600'],
              ['Refunded', money(s.total_refunded), 'text-slate-700'],
            ].map(([label, val, cls]) => (
              <li key={label} className="flex justify-between py-1.5 border-b border-slate-200/80 last:border-0">
                <span className="text-slate-600">{label}</span>
                <span className={`font-semibold ${cls}`}>{val ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Today&apos;s schedule</h3>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {(data.today_schedule || []).length}
            </span>
          </div>
          {(data.today_schedule || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No sessions today.</p>
          ) : (
            data.today_schedule.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>

        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Pending bookings</h3>
            <Link to="/admin/appointments?status=pending" className="text-xs text-primary-600 font-medium">
              View all
            </Link>
          </div>
          {(data.pending_appointments || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No pending bookings.</p>
          ) : (
            data.pending_appointments.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>

        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Doctors to verify</h3>
            <Link to="/admin/users?role=doctor" className="text-xs text-primary-600 font-medium">
              Manage
            </Link>
          </div>
          {(data.pending_doctors || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">All doctors verified.</p>
          ) : (
            data.pending_doctors.map((d) => <PendingDoctorRow key={d.doctor_id} doc={d} />)
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent bookings</h3>
          <Link to="/admin/appointments" className="text-xs text-primary-600 font-medium">
            Full list →
          </Link>
        </div>
        {(data.recent_bookings || []).length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No bookings yet.</p>
        ) : (
          data.recent_bookings.map((a) => <MiniApptRow key={a.id} appt={a} />)
        )}
      </div>
    </AdminDashboardLayout>
  );
}
