import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function MetricCard({ icon, label, value, tint = 'primary', hint }) {
  const tints = {
    primary: 'bg-primary-50 text-primary-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
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

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {clinic?.name || 'Clinic Portal'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Independent clinic operations dashboard</p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
              status === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-900'
            }`}
          >
            {status.replace('_', ' ')}
          </span>
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
          <div className="glass-card h-48 animate-pulse bg-white/40" />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon="fa-users" label="Total patients" value={m.total_patients ?? 0} tint="primary" />
              <MetricCard icon="fa-calendar-day" label="Today's appointments" value={m.today_appointments ?? 0} tint="teal" />
              <MetricCard icon="fa-user-doctor" label="Active doctors" value={m.active_doctors ?? 0} tint="violet" />
              <MetricCard icon="fa-indian-rupee-sign" label="Revenue (month)" value={inr(m.revenue_month)} tint="emerald" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon="fa-clock" label="Upcoming" value={m.upcoming_appointments ?? 0} tint="amber" />
              <MetricCard icon="fa-circle-check" label="Completed today" value={m.today_completed ?? 0} tint="emerald" />
              <MetricCard icon="fa-chart-line" label="Completion rate" value={`${m.completion_rate ?? 0}%`} tint="primary" />
              <MetricCard
                icon="fa-user-plus"
                label="Join requests"
                value={m.pending_join_requests ?? 0}
                tint="violet"
                hint="Doctors waiting to join"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-3">Quick actions</h2>
                <div className="flex flex-wrap gap-2">
                  <Link to="/clinic-portal/doctors" className="btn-primary !py-2 text-sm">
                    Manage doctors
                  </Link>
                  <Link to="/clinic-portal/appointments" className="btn-outline !py-2 text-sm">
                    Appointments
                  </Link>
                  <Link to="/clinic-portal/profile" className="btn-outline !py-2 text-sm">
                    Edit profile
                  </Link>
                </div>
              </div>
              <div className="glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-3">Therapist workload (this month)</h2>
                <ul className="space-y-2 text-sm">
                  {(data?.therapist_workload || []).map((t) => (
                    <li key={t.doctor_id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-medium text-slate-800">{t.name}</span>
                      <span className="text-slate-500">
                        {t.appointments} appts · {t.completed} done
                      </span>
                    </li>
                  ))}
                  {!data?.therapist_workload?.length && (
                    <li className="text-slate-500">No appointment data yet</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="glass-card !p-5">
              <h2 className="font-bold text-slate-900 mb-3">Recent appointments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-500 text-left">
                    <tr>
                      <th className="py-2">Booking</th>
                      <th className="py-2">Patient</th>
                      <th className="py-2">Doctor</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recent_appointments || []).map((a) => (
                      <tr key={a.id} className="border-t border-slate-100">
                        <td className="py-2 font-mono text-xs">{a.booking_id || a.id}</td>
                        <td className="py-2">{a.patient_name || '—'}</td>
                        <td className="py-2">{a.doctor_name || '—'}</td>
                        <td className="py-2 text-slate-500">
                          {a.appointment_date} {a.start_time || ''}
                        </td>
                        <td className="py-2 capitalize">{a.status}</td>
                      </tr>
                    ))}
                    {!data?.recent_appointments?.length && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No appointments yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
