import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { Link } from 'react-router-dom';
import { clinicPortal } from '../../services/api';

const CARDS = [
  {
    to: '/clinic-portal/doctors',
    title: 'Physiotherapists',
    desc: 'Invite by TUP email, approve join requests, manage linked doctors.',
    icon: 'fa-user-doctor',
    perm: 'doctors.manage',
  },
  {
    to: '/clinic-portal/staff',
    title: 'Reception & staff',
    desc: 'Add receptionists and clinic staff accounts, roles, deactivate access.',
    icon: 'fa-id-badge',
    perm: 'staff.manage',
  },
];

export default function ClinicTeamPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [availability, setAvailability] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [closed, setClosed] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const canTeam = can('doctors.manage') || can('staff.manage');

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [a, p, o] = await Promise.allSettled([
        clinicPortal.doctorAvailability(clinicId),
        clinicPortal.payouts(clinicId),
        clinicPortal.overview(clinicId),
      ]);
      if (a.status === 'fulfilled') {
        const av = a.value;
        setAvailability(av.data || av || []);
      } else {
        setAvailability([]);
      }
      if (p.status === 'fulfilled') {
        const pv = p.value;
        setPayouts(pv.data || pv || []);
      } else {
        setPayouts([]);
      }
      if (o.status === 'fulfilled') {
        const overview = o.value.data || o.value || {};
        setClosed(Boolean(Number(overview.clinic?.is_closed ?? overview.is_closed)));
        setReason(overview.clinic?.closure_reason || overview.closure_reason || '');
      }
      if (a.status === 'rejected' && p.status === 'rejected' && o.status === 'rejected') {
        toast.error('Could not load team settings');
      }
    } catch (error) {
      toast.error(error.message || 'Could not load team settings');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { if (clinicId && isAdminMode) load(); }, [clinicId, isAdminMode, load]);

  if (!boot && (!isAdminMode || !canTeam)) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const toggleDoctor = async (row) => {
    try {
      await clinicPortal.setDoctorAvailability(clinicId, { doctor_id: row.doctor_id || row.id, is_available: !Boolean(Number(row.is_available)) });
      toast.success('Availability updated'); load();
    } catch (error) { toast.error(error.message || 'Could not update availability'); }
  };
  const savePayout = async (row) => {
    try {
      await clinicPortal.savePayout(clinicId, {
        doctor_id: row.doctor_id,
        payout_model: row.payout_model || 'revenue_share',
        fixed_salary: Number(row.fixed_salary || 0),
        revenue_share_pct: Number(row.revenue_share_pct || 0),
      });
      toast.success('Payout saved'); load();
    } catch (error) { toast.error(error.message || 'Could not save payout'); }
  };
  const toggleClosure = async () => {
    const next = !closed;
    if (next && !window.confirm('Close the clinic? New bookings will be blocked until reopened.')) return;
    try {
      await clinicPortal.setClinicClosure(clinicId, { is_closed: next, reason: next ? reason : '' });
      setClosed(next); toast.success(next ? 'Clinic closed' : 'Clinic reopened');
    } catch (error) { toast.error(error.message || 'Could not update clinic status'); }
  };

  return (
    <ClinicPortalShell
      title="My Team"
      subtitle="Physiotherapists, receptionists, join requests and team setup"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {CARDS.map((c) => {
          const allowed = !c.perm || can(c.perm);
          if (!allowed) return null;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="glass-card hover:border-teal-300 transition group !p-5"
            >
              <span className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 inline-flex items-center justify-center text-lg mb-3 group-hover:bg-teal-100">
                <FaIcon icon={c.icon} />
              </span>
              <h3 className="font-bold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
              <p className="text-xs font-semibold text-teal-700 mt-3 inline-flex items-center gap-1">
                Open <FaIcon icon="fa-arrow-right" />
              </p>
            </Link>
          );
        })}
      </div>

      {boot || loading ? <div className="glass-card h-64 animate-pulse mt-4" /> : (
        <div className="space-y-4 mt-4">
          <section className={`glass-card !p-4 sm:!p-5 border ${closed ? 'border-rose-200 bg-rose-50/40' : 'border-emerald-200'}`}>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">Clinic booking status</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {closed ? 'Closed — new clinic bookings are blocked.' : 'Open — patients can book available appointments.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  className="input-field flex-1"
                  placeholder="Closure reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button type="button" className={`${closed ? 'btn-primary' : 'btn-outline'} w-full sm:w-auto shrink-0`} onClick={toggleClosure}>
                  {closed ? 'Reopen clinic' : 'Close clinic'}
                </button>
              </div>
            </div>
          </section>
          <section className="glass-card !p-0 overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-bold">Doctor availability</h2></div>
            <div className="divide-y">
              {availability.map((row) => (
                <div key={row.doctor_id || row.id} className="p-3 sm:p-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><FaIcon icon="fa-user-doctor" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{row.doctor_name || row.name}</p>
                    <p className="text-xs text-slate-500">{Boolean(Number(row.is_available)) ? 'Available for bookings' : 'Unavailable'}</p>
                  </div>
                  <button type="button" onClick={() => toggleDoctor(row)} className={`relative w-12 h-7 rounded-full transition shrink-0 ${Boolean(Number(row.is_available)) ? 'bg-teal-600' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${Boolean(Number(row.is_available)) ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
              {!availability.length && <p className="p-8 text-center text-sm text-slate-500">No linked doctors.</p>}
            </div>
          </section>
          <section className="glass-card !p-0 overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-bold">Doctor payout configuration</h2></div>
            <div className="divide-y">
              {payouts.map((row, index) => (
                <div key={row.doctor_id || index} className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[1fr_minmax(0,180px)_minmax(0,130px)_auto] gap-3 items-stretch md:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{row.doctor_name || row.name || `Doctor ${row.doctor_id}`}</p>
                    <p className="text-xs text-slate-500">Configure fixed pay or revenue share</p>
                  </div>
                  <select className="input-field text-sm" value={row.payout_model || 'revenue_share'} onChange={(e) => setPayouts((old) => old.map((p, i) => i === index ? { ...p, payout_model: e.target.value } : p))}>
                    <option value="revenue_share">Revenue share</option>
                    <option value="fixed_salary">Fixed salary</option>
                  </select>
                  <input className="input-field text-sm" type="number" min="0" value={row.payout_model === 'fixed_salary' ? row.fixed_salary || 0 : row.revenue_share_pct || 0} onChange={(e) => setPayouts((old) => old.map((p, i) => i === index ? { ...p, [row.payout_model === 'fixed_salary' ? 'fixed_salary' : 'revenue_share_pct']: e.target.value } : p))} />
                  <button type="button" className="btn-primary text-xs !py-2 w-full md:w-auto" onClick={() => savePayout(payouts[index])}>Save</button>
                </div>
              ))}
              {!payouts.length && <p className="p-8 text-center text-sm text-slate-500">No payout records.</p>}
            </div>
          </section>
        </div>
      )}
    </ClinicPortalShell>
  );
}
