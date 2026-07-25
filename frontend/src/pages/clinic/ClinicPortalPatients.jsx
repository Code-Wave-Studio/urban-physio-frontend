import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import BulkInvitePanel from '../../components/clinic/BulkInvitePanel';
import ClinicOfflinePatientForm from '../../components/clinic/ClinicOfflinePatientForm';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(d) {
  if (!d) return '—';
  const raw = String(d).includes('T') ? d : `${d}T12:00:00`;
  return new Date(raw).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const s = (status || 'online').toLowerCase();
  const styles = {
    offline: 'bg-slate-100 text-slate-700',
    invited: 'bg-amber-100 text-amber-800',
    online: 'bg-emerald-100 text-emerald-800',
  };
  const labels = {
    offline: 'Offline',
    invited: 'Invited',
    online: 'Online',
  };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded ${styles[s] || styles.online}`}>
      {labels[s] || s}
    </span>
  );
}

export default function ClinicPortalPatients() {
  const { clinicId, loading: bootLoading } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [resendingId, setResendingId] = useState(null);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patients(clinicId, { q: q.trim() || undefined });
      setRows(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load patients');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, q]);

  useEffect(() => {
    if (!clinicId) return undefined;
    const t = setTimeout(load, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [clinicId, load, q]);

  const totalVisits = rows.reduce((s, r) => s + (Number(r.visit_count) || 0), 0);
  const invited = rows.filter((r) => r.portal_status === 'invited' || r.portal_status === 'offline').length;
  const online = rows.filter((r) => (r.portal_status || 'online') === 'online').length;

  const resend = async (clinicPatientId) => {
    if (!clinicId || !clinicPatientId) return;
    setResendingId(clinicPatientId);
    try {
      const res = await clinicPortal.resendOfflinePatientInvite(clinicId, clinicPatientId);
      const n = res?.data ?? res ?? {};
      const channels = [
        n.email_sent && 'email',
        n.sms_sent && 'SMS',
        n.whatsapp_sent && 'WhatsApp',
      ].filter(Boolean);
      toast.success(channels.length ? `Resent via ${channels.join(', ')}` : 'Resend attempted');
    } catch (e) {
      toast.error(e.message || 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Walk-in (offline) patients, invites, and people who booked at your clinic
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">On roster</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{rows.length}</p>
          </div>
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Online</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{online}</p>
          </div>
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Awaiting account</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{invited}</p>
          </div>
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Total visits</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalVisits}</p>
          </div>
        </div>

        <ClinicOfflinePatientForm clinicId={clinicId} onCreated={() => load()} />

        <BulkInvitePanel
          title="Bulk invite patients"
          description="Paste up to 50 contacts. New patients get an account + temporary password by email and SMS; existing patients get a sign-in reminder."
          roleLabel="patient"
          disabled={!clinicId || bootLoading}
          onSubmit={(contacts) => clinicPortal.bulkInvitePatients(clinicId, { contacts })}
        />

        <div className="glass-card !p-4 flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn-outline text-sm" onClick={load}>
            Search
          </button>
        </div>

        <div className="glass-card !p-0 overflow-hidden">
          {bootLoading || loading ? (
            <div className="h-40 animate-pulse bg-slate-100 m-4 rounded-xl" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80 text-left">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Visits</th>
                    <th className="px-4 py-3">Spent</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const key = p.clinic_patient_id
                      ? `cp-${p.clinic_patient_id}`
                      : `p-${p.patient_id}`;
                    return (
                      <tr key={key} className="border-t border-slate-100 hover:bg-teal-50/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                              {(p.patient_name || 'P').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{p.patient_name || 'Patient'}</p>
                              {p.last_visit && (
                                <p className="text-[11px] text-slate-400">Last visit {formatDate(p.last_visit)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.portal_status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{p.phone || '—'}</p>
                          <p className="text-xs text-slate-400">{p.email || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {p.package_name ? (
                            <>
                              <p className="font-medium text-slate-800">{p.package_name}</p>
                              <p>
                                {Number(p.package_completed || 0)}/{Number(p.package_sessions || 0)} sessions
                              </p>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">{p.visit_count || 0}</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">{money(p.total_spent)}</td>
                        <td className="px-4 py-3">
                          {p.clinic_patient_id && p.portal_status !== 'online' ? (
                            <button
                              type="button"
                              className="btn-outline text-xs !py-1.5"
                              disabled={resendingId === p.clinic_patient_id}
                              onClick={() => resend(p.clinic_patient_id)}
                            >
                              {resendingId === p.clinic_patient_id ? 'Sending…' : 'Resend invite'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <FaIcon icon="fa-users" className="text-3xl text-slate-300 mb-2" />
                        <p>No patients yet — add a walk-in or wait for bookings.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
