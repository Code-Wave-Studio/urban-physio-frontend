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
import DashboardLayout from '../../layouts/DashboardLayout';
import PasswordSetupAlert from '../../components/PasswordSetupAlert';
import FaIcon from '../../components/FaIcon';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import { STATUS_STYLES, TYPE_ICONS, formatTime, formatType, patientLabel } from '../../utils/appointmentListUtils';
import DoctorQuickWork from '../../components/doctor/DoctorQuickWork';
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

function fillLast14Days(rows, valueKey = 'count') {
  const map = Object.fromEntries((rows || []).map((r) => [String(r.day).slice(0, 10), Number(r[valueKey] || 0)]));
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
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function MiniApptRow({ appt }) {
  const name = patientLabel(appt);
  const typeIcon = TYPE_ICONS[appt.consultation_type] || 'fa-calendar';
  const joinUrl = appt.zoom_join_url || appt.google_meet_link;
  const startUrl = appt.zoom_start_url || joinUrl;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
        <FaIcon icon={typeIcon} className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-800 truncate">{name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
            {appt.status}
          </span>
          {appt.consultation_type === 'online' && (
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
              Zoom {appt.zoom_status || (joinUrl ? 'ready' : 'pending')}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {formatDate(appt.appointment_date)} · {formatTime(appt.start_time)}
          {appt.end_time ? `–${formatTime(appt.end_time)}` : ''} · {formatType(appt.consultation_type)}
        </p>
        {appt.booking_id && <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.booking_id}</p>}
        {appt.consultation_type === 'online' && appt.status === 'confirmed' && startUrl && (
          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href={startUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary-700 hover:underline"
            >
              Start Zoom meeting
            </a>
            {joinUrl && (
              <button
                type="button"
                className="text-xs font-semibold text-slate-600 hover:underline"
                onClick={() => {
                  navigator.clipboard?.writeText(joinUrl);
                  toast.success('Join link copied');
                }}
              >
                Copy link
              </button>
            )}
            <Link to={`/doctor/consultation/${appt.id}`} className="text-xs font-semibold text-slate-600 hover:underline">
              Open room
            </Link>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-slate-800">{money(appt.amount)}</p>
        <p className="text-xs text-slate-500 capitalize">{appt.payment_status || 'pending'}</p>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: '/doctor/appointments', label: 'All Appointments', desc: 'Accept, reject & manage bookings', icon: 'fa-calendar-check', color: 'from-primary-500 to-primary-700' },
  { to: '/doctor/appointments?status=pending', label: 'Pending Requests', desc: 'Review new booking requests', icon: 'fa-clock', color: 'from-amber-500 to-orange-600' },
  { to: '/doctor/patients', label: 'Patient History', desc: 'Profiles & past sessions', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
  { to: '/doctor/clinic-availability', label: 'Availability', desc: 'Set weekly slots & services', icon: 'fa-calendar-days', color: 'from-sky-500 to-cyan-600' },
  { to: '/doctor/emergency', label: 'Emergency Care', desc: 'Urgent requests & availability', icon: 'fa-truck-medical', color: 'from-rose-500 to-red-600' },
  { to: '/doctor/earnings', label: 'Earnings', desc: 'Revenue & payment breakdown', icon: 'fa-indian-rupee-sign', color: 'from-emerald-500 to-teal-600' },
];

export default function DoctorDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    doctors
      .dashboard()
      .then((res) => {
        const payload = res?.data ?? res;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new Error('Invalid dashboard response');
        }
        setData({
          profile: payload.profile || {},
          stats: payload.stats || {},
          by_type: payload.by_type || {},
          booking_trends: payload.booking_trends || [],
          earnings_trends: payload.earnings_trends || [],
          pending_list: payload.pending_list || [],
          today_schedule: payload.today_schedule || [],
          upcoming: payload.upcoming || [],
          recent_bookings: payload.recent_bookings || [],
        });
      })
      .catch((e) => {
        toast.error(e.message || 'Could not load dashboard');
        setData({
          profile: {},
          stats: {},
          by_type: {},
          booking_trends: [],
          earnings_trends: [],
          pending_list: [],
          today_schedule: [],
          upcoming: [],
          recent_bookings: [],
        });
      });
  }, []);

  const bookingChart = useMemo(() => {
    const { labels, data: values } = fillLast14Days(data?.booking_trends, 'count');
    return {
      labels,
      datasets: [
        {
          label: 'Bookings',
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const earningsChart = useMemo(() => {
    const { labels, data: values } = fillLast14Days(data?.earnings_trends, 'total');
    return {
      labels,
      datasets: [
        {
          label: 'Paid earnings (₹)',
          data: values,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [data]);

  const typeChart = useMemo(() => {
    const bt = data?.by_type || {};
    const labels = ['Online', 'Clinic', 'Home visit'];
    const keys = ['online', 'clinic', 'home_visit'];
    return {
      labels,
      datasets: [
        {
          data: keys.map((k) => bt[k] || 0),
          backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  if (!data) {
    return (
      <DashboardLayout links={DOCTOR_NAV} variant="doctor">
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const profile = data.profile || {};
  const stats = data.stats || {};
  const doctorName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Doctor';
  const pendingCount = Number(stats.pending_count || 0);

  const statCards = [
    { label: 'Total bookings', value: stats.total_bookings ?? 0, color: 'text-slate-800', sub: 'All time' },
    { label: 'Pending', value: pendingCount, color: 'text-amber-600', sub: 'Needs action' },
    { label: 'Confirmed', value: stats.confirmed_count ?? 0, color: 'text-emerald-600', sub: 'Upcoming accepted' },
    { label: 'Completed', value: stats.completed_count ?? 0, color: 'text-blue-600', sub: 'Finished sessions' },
    { label: "Today's sessions", value: stats.today_count ?? 0, color: 'text-primary-600', sub: money(stats.today_earnings) + ' paid today' },
    { label: 'Upcoming', value: stats.upcoming_count ?? 0, color: 'text-violet-600', sub: 'Future dates' },
    { label: 'Patients', value: stats.patients_count ?? 0, color: 'text-slate-800', sub: 'Unique patients' },
    { label: 'Total earnings', value: money(stats.total_earnings), color: 'text-emerald-700', sub: 'Paid only' },
    { label: 'This month', value: money(stats.monthly_earnings), color: 'text-green-600', sub: 'Paid this month' },
    { label: 'Awaiting payment', value: money(stats.pending_payment_amount), color: 'text-amber-700', sub: 'Unpaid bookings' },
  ];

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <PasswordSetupAlert profilePath="/doctor/profile" />
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-primary-600 to-slate-900 text-white p-5 sm:p-8 mb-6 md:mb-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm font-medium">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dr. {doctorName}</h1>
            {profile.specialization && (
              <p className="text-primary-100 mt-2 text-sm sm:text-base">{profile.specialization}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-primary-100">
              {profile.experience_years != null && (
                <span>{profile.experience_years}+ yrs experience</span>
              )}
              {profile.rating_avg > 0 && (
                <span className="flex items-center gap-1">
                  <FaIcon icon="fa-star" className="text-amber-300" />
                  {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count || 0} reviews)
                </span>
              )}
              {profile.is_verified == 1 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Verified</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-50 transition text-sm"
            >
              <FaIcon icon="fa-calendar-check" />
              Manage appointments
            </Link>
            {pendingCount > 0 && (
              <Link
                to="/doctor/appointments?status=pending"
                className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-300 transition text-sm"
              >
                {pendingCount} pending
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 md:mb-8">
        {statCards.map(({ label, value, color, sub }) => (
          <div key={label} className="glass-card !p-3 md:!p-4 hover:shadow-md transition-shadow border border-white/80">
            <p className="text-xs sm:text-sm text-slate-500 leading-tight">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="font-semibold text-amber-900">
              {pendingCount} appointment{pendingCount !== 1 ? 's' : ''} waiting for your response
            </p>
            <p className="text-sm text-amber-800 mt-0.5">Accept or reject to confirm patient schedules.</p>
          </div>
          <Link to="/doctor/appointments?status=pending" className="btn-primary !py-2 text-sm shrink-0">
            Review now →
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
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

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card lg:col-span-2 !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Bookings — last 14 days</h3>
          <p className="text-xs text-slate-500 mb-4">New appointments per day</p>
          <Bar
            data={bookingChart}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }}
          />
        </div>
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800 mb-1">By consultation type</h3>
          <p className="text-xs text-slate-500 mb-4">All-time split</p>
          <div className="max-w-[220px] mx-auto">
            <Doughnut
              data={typeChart}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card mb-6 md:mb-8 !p-4 md:!p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Earnings — last 14 days</h3>
        <p className="text-xs text-slate-500 mb-4">Paid sessions only</p>
        <Line
          data={earningsChart}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>

      {/* Schedule widgets */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Today&apos;s schedule</h3>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {(data.today_schedule || []).length} sessions
            </span>
          </div>
          {(data.today_schedule || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No sessions scheduled for today.</p>
          ) : (
            data.today_schedule.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>

        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Pending requests</h3>
            <Link to="/doctor/appointments?status=pending" className="text-xs text-primary-600 font-medium">
              View all
            </Link>
          </div>
          {(data.pending_list || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No pending requests.</p>
          ) : (
            data.pending_list.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>

        <div className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Upcoming</h3>
            <Link to="/doctor/appointments" className="text-xs text-primary-600 font-medium">
              Calendar
            </Link>
          </div>
          {(data.upcoming || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No upcoming appointments.</p>
          ) : (
            data.upcoming.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>
      </div>

      {/* Recent + fees summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Recent bookings</h3>
          {(data.recent_bookings || []).length === 0 ? (
            <p className="text-sm text-slate-500">No bookings yet.</p>
          ) : (
            data.recent_bookings.map((a) => <MiniApptRow key={a.id} appt={a} />)
          )}
        </div>

        <div className="glass-card bg-slate-50/80 !p-4 md:!p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Your consultation fees</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Clinic visit</span>
              <span className="font-semibold">{money(profile.consultation_fee)}</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Online session</span>
              <span className="font-semibold">{money(profile.online_fee)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-slate-600">Home visit</span>
              <span className="font-semibold">{money(profile.home_visit_fee)}</span>
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-4">
            Update from{' '}
            <Link to="/doctor/profile" className="text-primary-600 font-medium">
              Profile Settings
            </Link>
            .
          </p>
          {Number(stats.cancelled_count) > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-medium">{stats.cancelled_count}</span> cancelled or rejected bookings
            </p>
          )}
        </div>
      </div>

      {!shortcutsAtTop && <DoctorQuickWork onPlaceAtTopChange={setShortcutsAtTop} />}
    </DashboardLayout>
  );
}
