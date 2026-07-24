import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FaIcon from '../../components/FaIcon';
import { clinicPortal } from '../../services/api';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
  rejected: 'bg-red-50 text-red-600',
  no_show: 'bg-orange-50 text-orange-700',
};

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function MetricCard({ icon, label, value, tint = 'primary', hint }) {
  const tints = {
    primary: 'bg-primary-50 text-primary-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="glass-card !p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tints[tint] || tints.primary}`}>
        <FaIcon icon={icon} />
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function ClinicDashboardPage() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clinicPortal
      .myClinics()
      .then((res) => {
        const list = res.data || [];
        setClinics(list);
        if (!clinicId && list.length) {
          navigate(`/clinic-manage/${list[0].id}`, { replace: true });
        }
      })
      .catch((e) => toast.error(e.message || 'Could not load clinics'))
      .finally(() => setLoadingClinics(false));
  }, [clinicId, navigate]);

  const loadOverview = useCallback(() => {
    if (!clinicId) return;
    setLoading(true);
    clinicPortal
      .overview(clinicId)
      .then((res) => setData(res.data))
      .catch((e) => toast.error(e.message || 'Could not load dashboard'))
      .finally(() => setLoading(false));
  }, [clinicId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const m = data?.metrics || {};
  const clinicQuery = clinicId ? `?clinic_id=${clinicId}` : '';

  const quickLinks = [
    { to: '/doctor/appointments', icon: 'fa-calendar-check', label: 'Appointments', tint: 'text-primary-600' },
    { to: '/doctor/patients', icon: 'fa-users', label: 'Patients', tint: 'text-teal-600' },
    { to: `/doctor/documents${clinicQuery}`, icon: 'fa-folder-tree', label: 'Documents', tint: 'text-violet-600' },
    { to: '/doctor/clinic-availability', icon: 'fa-calendar-days', label: 'Availability', tint: 'text-amber-600' },
    { to: '/doctor/earnings', icon: 'fa-indian-rupee-sign', label: 'Earnings', tint: 'text-emerald-600' },
    { to: '/doctor', icon: 'fa-gauge', label: 'Doctor dashboard', tint: 'text-slate-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-primary-50/30">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 md:py-8 w-full">
        {/* Header + clinic switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-hospital" className="text-lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">Clinic Portal</h1>
              <p className="text-slate-500 text-sm">{data?.clinic?.name || 'Manage your clinic'}</p>
            </div>
          </div>
          {clinics.length > 0 && (
            <select
              value={clinicId || ''}
              onChange={(e) => navigate(`/clinic-manage/${e.target.value}`)}
              className="doc-input !w-auto"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {loadingClinics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : clinics.length === 0 ? (
          <div className="glass-card text-center py-16">
            <FaIcon icon="fa-hospital" className="text-4xl text-slate-300" />
            <p className="mt-3 text-slate-700 font-medium">No clinics yet</p>
            <p className="text-sm text-slate-500 mt-1">List a clinic to access the clinic portal.</p>
            <Link to="/doctor/clinics/new" className="btn-primary mt-4 inline-flex">
              <FaIcon icon="fa-plus" className="mr-1.5" /> Add a clinic
            </Link>
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon="fa-calendar-day" label="Today's appointments" value={loading ? '—' : m.today_appointments ?? 0} tint="primary" hint={`${m.today_completed ?? 0} completed`} />
              <MetricCard icon="fa-clock" label="Upcoming" value={loading ? '—' : m.upcoming_appointments ?? 0} tint="teal" />
              <MetricCard icon="fa-indian-rupee-sign" label="Revenue (this month)" value={loading ? '—' : inr(m.revenue_month)} tint="emerald" />
              <MetricCard icon="fa-user-group" label="Active patients" value={loading ? '—' : m.active_patients ?? 0} tint="violet" hint="last 90 days" />
              <MetricCard icon="fa-calendar-week" label="Appointments (month)" value={loading ? '—' : m.month_appointments ?? 0} tint="primary" />
              <MetricCard icon="fa-person-walking" label="Walk-ins (month)" value={loading ? '—' : m.walk_ins_month ?? 0} tint="amber" />
              <MetricCard icon="fa-users" label="Total patients" value={loading ? '—' : m.total_patients ?? 0} tint="teal" />
              <MetricCard icon="fa-circle-check" label="Completion rate" value={loading ? '—' : `${m.completion_rate ?? 0}%`} tint="emerald" hint={`${m.missed_month ?? 0} missed this month`} />
            </div>

            {/* Quick links */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Manage</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickLinks.map((q) => (
                  <Link key={q.label} to={q.to} className="glass-card !p-4 text-center hover:border-primary-200">
                    <FaIcon icon={q.icon} className={`text-2xl ${q.tint}`} />
                    <p className="text-sm font-medium text-slate-700 mt-2">{q.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              {/* Recent appointments */}
              <div className="glass-card lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-900">Recent appointments</h2>
                  <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : (data?.recent_appointments?.length ? (
                  <div className="divide-y divide-slate-100">
                    {data.recent_appointments.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <FaIcon icon="fa-user" className="text-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.patient_name || 'Patient'}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {fmtDate(a.appointment_date)} · {(a.start_time || '').slice(0, 5)} · {a.doctor_name || '—'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-500'}`}>
                          {(a.status || '').replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No appointments yet.</p>
                ))}
              </div>

              {/* Therapist workload */}
              <div className="glass-card">
                <h2 className="font-bold text-slate-900 mb-3">Therapist workload</h2>
                <p className="text-[11px] text-slate-400 -mt-2 mb-3">This month</p>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : (data?.therapist_workload?.length ? (
                  <div className="space-y-3">
                    {data.therapist_workload.map((t) => {
                      const pct = t.appointments ? Math.round((t.completed / t.appointments) * 100) : 0;
                      return (
                        <div key={t.doctor_id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 truncate">{t.name}</span>
                            <span className="text-slate-400 text-xs shrink-0">{t.appointments}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-primary-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">No data yet.</p>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-6 flex items-center gap-2">
              <FaIcon icon="fa-circle-info" />
              More clinic tools (patient database, billing, packages, receptionist accounts) are rolling out in upcoming phases.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
