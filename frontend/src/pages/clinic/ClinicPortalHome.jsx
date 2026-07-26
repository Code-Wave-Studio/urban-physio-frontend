import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import PasswordSetupAlert from '../../components/PasswordSetupAlert';
import ClinicPortalShell, { ClinicQuickActions } from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { STATUS_STYLES, formatTime, formatType } from '../../utils/appointmentListUtils';

function Metric({ icon, label, value, tint = 'teal' }) {
  const tints = {
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="glass-card !p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tints[tint]}`}>
        <FaIcon icon={icon} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function ClinicPortalHome() {
  const { clinicId, portalReady, isAdminMode, loading: boot, reload } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.receptionDashboard(clinicId);
      setData(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Could not load front desk');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && !isAdminMode) load();
  }, [clinicId, isAdminMode, load]);

  useEffect(() => {
    const h = () => reload().then(() => load()).catch(() => {});
    window.addEventListener('clinic-role-changed', h);
    return () => window.removeEventListener('clinic-role-changed', h);
  }, [reload, load]);

  if (!boot && isAdminMode) {
    return <Navigate to="/clinic-portal/admin" replace />;
  }

  const m = data?.metrics || {};
  const queue = data?.queue || [];
  const followups = data?.followups || [];

  const checkIn = async (appt) => {
    setActing(appt.id);
    try {
      await clinicPortal.updateAppointment(clinicId, appt.id, { check_in: true });
      toast.success('Patient checked in');
      load();
    } catch (e) {
      toast.error(e.message || 'Check-in failed');
    } finally {
      setActing(null);
    }
  };

  const collect = async (appt) => {
    if (!window.confirm(`Record cash/UPI payment of ₹${Number(appt.amount || 0).toLocaleString('en-IN')}?`)) return;
    setActing(appt.id);
    try {
      await clinicPortal.collectPayment(clinicId, appt.id, { method: 'cash' });
      toast.success('Payment collected');
      load();
    } catch (e) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <ClinicPortalShell
      title="Receptionist — Front Desk"
      subtitle="Check-ins, queue, walk-ins, billing and follow-ups"
    >
      <PasswordSetupAlert className="mb-4" />

      {!portalReady && (
        <div className="glass-card !p-4 mb-4 border border-amber-200 bg-amber-50/50 text-sm text-amber-900">
          Clinic profile is pending approval. You can still prepare patients and appointments.
        </div>
      )}

      {loading || boot ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <Metric icon="fa-calendar-day" label="Today's appointments" value={m.today_total ?? 0} />
            <Metric icon="fa-hourglass-half" label="Pending" value={m.today_pending ?? 0} tint="amber" />
            <Metric icon="fa-circle-check" label="Confirmed" value={m.today_confirmed ?? 0} tint="emerald" />
            <Metric icon="fa-indian-rupee-sign" label="Unpaid today" value={m.unpaid_today ?? 0} tint="rose" />
            <Metric icon="fa-person-walking" label="Walk-ins today" value={m.walkins_today ?? 0} tint="violet" />
          </div>

          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-800 mb-2">Quick actions</p>
            <ClinicQuickActions />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card !p-4 md:!p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">
                  <FaIcon icon="fa-list-ol" className="mr-2 text-teal-600" />
                  Today&apos;s queue
                </h2>
                <Link to="/clinic-portal/appointments" className="text-xs text-primary-600 font-medium">View all</Link>
              </div>
              {queue.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No appointments scheduled for today.</p>
              ) : (
                <ul className="space-y-2 max-h-[480px] overflow-y-auto">
                  {queue.map((a) => (
                    <li key={a.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{a.patient_name || 'Patient'}</p>
                          <p className="text-xs text-slate-500">
                            {formatTime(a.start_time)} · {a.doctor_name || 'Unassigned'} · {formatType(a.consultation_type)}
                          </p>
                          <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600'}`}>
                            {a.status}
                          </span>
                          {a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                            <span className="ml-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">Unpaid</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {a.status === 'pending' && (
                            <button type="button" disabled={acting === a.id} onClick={() => checkIn(a)} className="text-[11px] font-semibold text-teal-700 hover:underline">
                              Check in
                            </button>
                          )}
                          {a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                            <button type="button" disabled={acting === a.id} onClick={() => collect(a)} className="text-[11px] font-semibold text-violet-700 hover:underline">
                              Collect ₹{Number(a.amount).toLocaleString('en-IN')}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass-card !p-4">
                <h2 className="font-semibold text-slate-900 mb-3">
                  <FaIcon icon="fa-rotate" className="mr-2 text-amber-600" />
                  Follow-up queue
                </h2>
                {followups.length === 0 ? (
                  <p className="text-sm text-slate-500">No pending follow-ups.</p>
                ) : (
                  <ul className="space-y-2">
                    {followups.slice(0, 8).map((f) => (
                      <li key={f.id} className="text-sm">
                        <p className="font-medium text-slate-800">{f.patient_name}</p>
                        <p className="text-xs text-slate-500">Last visit {f.appointment_date}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link to="/clinic-portal/patients" className="btn-outline !py-1.5 text-xs mt-3 inline-flex w-full justify-center">
                  Register / search patients
                </Link>
              </div>
              <div className="glass-card !p-4">
                <h2 className="font-semibold text-slate-900 mb-2">Pending tasks</h2>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>• Confirm unpaid bookings before session</li>
                  <li>• Call follow-up patients this week</li>
                  <li>• Upload consent forms for walk-ins</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </ClinicPortalShell>
  );
}
