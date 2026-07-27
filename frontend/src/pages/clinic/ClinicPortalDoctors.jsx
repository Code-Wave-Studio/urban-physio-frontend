import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import BulkInvitePanel from '../../components/clinic/BulkInvitePanel';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

export default function ClinicPortalDoctors() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const docs = await clinicPortal.doctors(clinicId);
      setDoctors(docs.data || docs || []);
      try {
        const joins = await clinicPortal.joinRequests(clinicId);
        setRequests(joins.data || joins || []);
      } catch {
        setRequests([]);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && isAdminMode && can('doctors.manage')) load();
  }, [load, clinicId, isAdminMode, can]);

  if (!boot && (!isAdminMode || !can('doctors.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const invite = async (e) => {
    e.preventDefault();
    if (!clinicId) return;
    setInviting(true);
    try {
      const res = await clinicPortal.inviteDoctor(clinicId, { email, message });
      const data = res.data ?? res;
      if (data?.email_sent === false) {
        toast.error(data?.email_error || 'Invite saved but email failed to send');
      } else {
        toast.success(data?.doctor_registered ? 'Invitation sent to registered doctor' : 'Invitation sent');
      }
      setEmail('');
      setMessage('');
      load();
    } catch (err) {
      toast.error(err.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const decide = async (req, approve) => {
    try {
      await clinicPortal.decideJoinRequest(clinicId, req.id, { approve });
      toast.success(approve ? 'Doctor approved' : 'Request rejected');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not update request');
    }
  };

  const remove = async (doc) => {
    const name = [doc.first_name, doc.last_name].filter(Boolean).join(' ') || 'doctor';
    const doctorId = doc.doctor_id || doc.id;
    if (!window.confirm(`Remove ${name} from this clinic?`)) return;
    setRemovingId(doctorId);
    try {
      await clinicPortal.removeDoctor(clinicId, doctorId);
      toast.success('Doctor removed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not remove');
    } finally {
      setRemovingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => (r.status || '') === 'pending');

  return (
    <ClinicPortalShell
      title="Physiotherapists"
      subtitle="Invite verified TUP doctors, approve join requests, manage your clinical team"
      actions={
        <Link to="/clinic-portal/team" className="text-sm text-teal-700 font-medium hover:underline">
          ← My Team
        </Link>
      }
    >
      <div className="space-y-4 sm:space-y-5 max-w-4xl">
        <form onSubmit={invite} className="glass-card !p-4 sm:!p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <h2 className="font-bold sm:col-span-2 flex items-center gap-2">
            <FaIcon icon="fa-envelope" className="text-teal-600" />
            Invite physiotherapist
          </h2>
          <input
            className="input-field sm:col-span-2"
            type="email"
            placeholder="Doctor's registered TUP email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="input-field sm:col-span-2 min-h-[72px]"
            placeholder="Optional message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary sm:col-span-2 w-full" disabled={inviting || !clinicId}>
            {inviting ? 'Sending…' : 'Send invitation'}
          </button>
          <p className="sm:col-span-2 text-xs text-slate-500">
            Only doctors with an existing TUP Doctor account can join. The clinic cannot create doctor accounts.
          </p>
        </form>

        <BulkInvitePanel
          title="Bulk invite doctors"
          description="Paste emails (one per line). Optional: email, phone, first name, last name."
          roleLabel="doctor"
          disabled={!clinicId}
          onSubmit={(contacts) => clinicPortal.bulkInviteDoctors(clinicId, { contacts })}
        />

        {!!pendingRequests.length && (
          <div className="glass-card !p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <FaIcon icon="fa-inbox" className="text-amber-600" />
              Join requests ({pendingRequests.length})
            </h2>
            <ul className="space-y-2">
              {pendingRequests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                  <div>
                    <p className="font-medium text-slate-900">
                      {[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Doctor'}
                    </p>
                    <p className="text-xs text-slate-500">{r.email} · {r.specialization || 'Physiotherapist'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline" onClick={() => decide(r, true)}>
                      Approve
                    </button>
                    <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => decide(r, false)}>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="glass-card !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Linked doctors</h2>
          </div>
          {boot || loading ? (
            <div className="h-32 animate-pulse bg-slate-100 m-4 rounded-xl" />
          ) : !doctors.length ? (
            <p className="px-4 py-10 text-center text-slate-500">No doctors linked yet. Invite a physiotherapist by TUP email.</p>
          ) : (
            <>
              <div className="portal-mobile-list">
                {doctors.map((d) => {
                  const doctorId = d.doctor_id || d.id;
                  const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || 'Doctor';
                  return (
                    <article key={doctorId} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {name}
                            {Number(d.is_clinic_manager) ? (
                              <span className="ml-2 text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">Manager</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{d.email || '—'}</p>
                          <p className="text-xs text-slate-500">{d.specialization || '—'}</p>
                        </div>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 capitalize">
                          {d.status || 'active'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600"
                        disabled={removingId === doctorId}
                        onClick={() => remove(d)}
                      >
                        Remove
                      </button>
                    </article>
                  );
                })}
              </div>
              <div className="portal-desktop-table portal-table-wrap">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80 text-left">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Specialization</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => {
                      const doctorId = d.doctor_id || d.id;
                      return (
                        <tr key={doctorId} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {[d.first_name, d.last_name].filter(Boolean).join(' ') || 'Doctor'}
                            {Number(d.is_clinic_manager) ? (
                              <span className="ml-2 text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">Manager</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{d.email || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{d.specialization || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 capitalize">
                              {d.status || 'active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-600 hover:underline"
                              disabled={removingId === doctorId}
                              onClick={() => remove(d)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </ClinicPortalShell>
  );
}
