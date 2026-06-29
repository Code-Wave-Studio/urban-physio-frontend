import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PasswordSetupAlert from '../../components/PasswordSetupAlert';
import FaIcon from '../../components/FaIcon';
import { appointments, patientReports, patients } from '../../services/api';
import { PATIENT_NAV } from '../../constants/patientNav';
import { useAuth } from '../../contexts/AuthContext';
import { STATUS_STYLES, TYPE_ICONS, formatTime } from '../../utils/appointmentListUtils';
import toast from 'react-hot-toast';

const QUICK = [
  {
    to: '/patient/saved',
    title: 'Saved',
    desc: 'Doctors, clinics & exercises',
    icon: 'fa-heart',
    color: 'from-rose-500 to-pink-600',
  },
  {
    to: '/book',
    title: 'Book appointment',
    desc: 'Online, clinic or home visit',
    icon: 'fa-calendar-plus',
    color: 'from-orange-500 to-primary-600',
  },
  {
    to: '/emergency/book',
    title: 'Emergency care',
    desc: 'Urgent physio — fast matching',
    icon: 'fa-truck-medical',
    color: 'from-rose-500 to-red-600',
  },
  {
    to: '/patient/reports',
    title: 'Upload reports',
    desc: 'MRI, X-ray, prescriptions',
    icon: 'fa-file-medical',
    color: 'from-sky-500 to-cyan-600',
  },
  {
    to: '/patient/profile',
    title: 'Profile settings',
    desc: 'Name, address, medical info',
    icon: 'fa-user-gear',
    color: 'from-indigo-500 to-violet-600',
  },
];

const STAT_CARDS = [
  { key: 'total', label: 'Appointments', icon: 'fa-calendar-check', gradient: 'from-orange-500/15 to-primary-500/10', iconTone: 'text-primary-600 bg-primary-100' },
  { key: 'upcoming', label: 'Upcoming', icon: 'fa-clock', gradient: 'from-amber-500/15 to-orange-500/10', iconTone: 'text-amber-600 bg-amber-100' },
  { key: 'completed', label: 'Completed', icon: 'fa-circle-check', gradient: 'from-emerald-500/15 to-teal-500/10', iconTone: 'text-emerald-600 bg-emerald-100' },
  { key: 'reports', label: 'My reports', icon: 'fa-file-medical', gradient: 'from-sky-500/15 to-blue-500/10', iconTone: 'text-sky-600 bg-sky-100' },
];

function formatApptDate(d) {
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [reportCount, setReportCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [packageCredits, setPackageCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([appointments.list(), patientReports.list(), patients.visitCredits()])
      .then(([apptRes, repRes, creditsRes]) => {
        const list = apptRes.data || [];
        setPackageCredits(creditsRes.data || []);
        setStats({
          total: list.length,
          upcoming: list.filter((a) => ['pending', 'confirmed'].includes(a.status)).length,
          completed: list.filter((a) => a.status === 'completed').length,
        });
        setRecent(
          [...list]
            .sort((a, b) => `${b.appointment_date}${b.start_time}`.localeCompare(`${a.appointment_date}${a.start_time}`))
            .slice(0, 4)
        );
        setReportCount((repRes.data || []).length);
      })
      .catch((e) => toast.error(e.message || 'Could not load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const name = user?.first_name || 'there';
  const statValues = { ...stats, reports: reportCount };

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <PasswordSetupAlert profilePath="/patient/profile" />

      <div className="mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-primary-600 font-semibold uppercase tracking-wide">Patient portal</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Hello, {name}</h1>
        <p className="text-slate-600 text-sm mt-1 max-w-xl">
          Manage appointments, upload medical reports, and book your next session in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {STAT_CARDS.map((s) => (
          <div
            key={s.key}
            className={`glass-card !p-4 bg-gradient-to-br ${s.gradient} border border-white/80`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconTone}`}>
                <FaIcon icon={s.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs text-slate-500 font-medium truncate">{s.label}</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">
                  {loading ? '—' : statValues[s.key]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        {QUICK.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 md:p-5 shadow-sm hover:shadow-lg hover:border-primary-200/60 transition"
          >
            <div
              className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${q.color} opacity-20 group-hover:opacity-30 transition`}
            />
            <div
              className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center mb-3 shadow-md`}
            >
              <FaIcon icon={q.icon} className="text-base md:text-lg" />
            </div>
            <p className="font-bold text-slate-900 text-sm md:text-base">{q.title}</p>
            <p className="text-xs md:text-sm text-slate-600 mt-0.5">{q.desc}</p>
            <FaIcon
              icon="fa-arrow-right"
              className="absolute bottom-4 md:bottom-5 right-4 md:right-5 text-slate-300 group-hover:text-primary-600 transition"
            />
          </Link>
        ))}
      </div>

      {packageCredits.length > 0 && (
        <section className="glass-card !p-4 md:!p-5 mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <FaIcon icon="fa-box-open" className="text-orange-600" />
              Package visits remaining
            </h2>
            <Link to="/patient/appointments" className="text-xs text-primary-600 font-semibold hover:underline">
              Schedule visits
            </Link>
          </div>
          <div className="space-y-3">
            {packageCredits.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-orange-100 bg-orange-50/50 p-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {c.booking_id || `Package #${c.appointment_id}`}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dr. {c.first_name} {c.last_name}
                    {c.expires_at ? ` · Valid till ${c.expires_at}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-700">{c.remaining_visits}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500">of {c.total_visits} left</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <section className="glass-card !p-4 md:!p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <FaIcon icon="fa-calendar-days" className="text-primary-600" />
              Recent appointments
            </h2>
            <Link to="/patient/appointments" className="text-xs text-primary-600 font-semibold hover:underline shrink-0">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FaIcon icon="fa-calendar-xmark" className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No appointments yet.</p>
              <Link to="/book" className="btn-primary inline-flex items-center gap-2 text-sm mt-4">
                <FaIcon icon="fa-calendar-plus" />
                Book your first visit
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <FaIcon icon={TYPE_ICONS[a.consultation_type] || 'fa-calendar'} className="text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      Dr. {a.doctor_first_name} {a.doctor_last_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatApptDate(a.appointment_date)} · {formatTime(a.start_time)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] capitalize px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-card !p-4 md:!p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <FaIcon icon="fa-file-waveform" className="text-sky-600" />
              Medical reports
            </h2>
            <Link to="/patient/reports" className="text-xs text-primary-600 font-semibold hover:underline shrink-0">
              Manage
            </Link>
          </div>
          <p className="text-sm text-slate-600 mb-4 flex-1">
            Keep MRI, X-ray, and lab reports in one secure place. Doctors you book with can view and download them.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/patient/reports" className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
              <FaIcon icon="fa-cloud-arrow-up" />
              {reportCount ? `View ${reportCount} report${reportCount !== 1 ? 's' : ''}` : 'Upload first report'}
            </Link>
            <Link to="/doctors" className="btn-outline inline-flex items-center justify-center gap-2 text-sm">
              <FaIcon icon="fa-user-doctor" />
              Find doctors
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
