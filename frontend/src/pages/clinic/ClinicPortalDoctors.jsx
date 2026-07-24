import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';

export default function ClinicPortalDoctors() {
  const [clinicId, setClinicId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await clinicPortal.me();
      const me = meRes.data || meRes;
      const id = me.clinic?.id;
      if (!id) {
        toast.error('Clinic profile missing');
        return;
      }
      setClinicId(id);
      const [docs, joins] = await Promise.all([
        clinicPortal.doctors(id),
        clinicPortal.joinRequests(id),
      ]);
      setDoctors(docs.data || docs || []);
      setRequests(joins.data || joins || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (e) => {
    e.preventDefault();
    if (!clinicId) return;
    try {
      await clinicPortal.inviteDoctor(clinicId, { email, message });
      toast.success('Invitation sent');
      setEmail('');
      setMessage('');
    } catch (err) {
      toast.error(err.message || 'Invite failed');
    }
  };

  const decide = async (requestId, approve) => {
    try {
      await clinicPortal.decideJoinRequest(clinicId, requestId, { approve });
      toast.success(approve ? 'Doctor linked' : 'Request rejected');
      load();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">Invite doctors or approve join requests</p>
        </div>

        <form onSubmit={invite} className="glass-card !p-5 grid sm:grid-cols-2 gap-3">
          <h2 className="font-bold sm:col-span-2 flex items-center gap-2">
            <FaIcon icon="fa-envelope" className="text-primary-600" />
            Invite doctor by email
          </h2>
          <input
            className="input-field"
            type="email"
            placeholder="Doctor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-field"
            placeholder="Optional message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary sm:col-span-2">
            Send invitation
          </button>
        </form>

        {loading ? (
          <div className="glass-card h-40 animate-pulse" />
        ) : (
          <>
            <div className="glass-card !p-5">
              <h2 className="font-bold mb-3">Linked doctors</h2>
              <ul className="space-y-2 text-sm">
                {doctors.map((d) => (
                  <li key={d.doctor_id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Dr. {d.first_name} {d.last_name}
                        {Number(d.is_clinic_manager) === 1 && (
                          <span className="ml-2 text-[10px] uppercase bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                            Manager
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {d.specialization || 'Physiotherapy'} · {d.email} · {d.status}
                      </p>
                    </div>
                  </li>
                ))}
                {!doctors.length && <li className="text-slate-500">No doctors linked yet</li>}
              </ul>
            </div>

            <div className="glass-card !p-5">
              <h2 className="font-bold mb-3">Join requests</h2>
              <ul className="space-y-3 text-sm">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-semibold">
                        Dr. {r.first_name} {r.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.email} · {r.status} · {r.message || 'No message'}
                      </p>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button type="button" className="btn-primary !py-1.5 text-xs" onClick={() => decide(r.id, true)}>
                          Approve
                        </button>
                        <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => decide(r.id, false)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
                {!requests.length && <li className="text-slate-500">No join requests</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
