import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import BulkInvitePanel from '../../components/clinic/BulkInvitePanel';
import ClinicOfflinePatientForm from '../../components/clinic/ClinicOfflinePatientForm';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
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
    online:  'bg-emerald-100 text-emerald-800',
  };
  const labels = {
    offline: 'Offline',
    invited: 'Invited',
    online:  'Online',
  };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded ${styles[s] || styles.online}`}>
      {labels[s] || s}
    </span>
  );
}

/** Shared centered modal wrapper */
function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ClinicPortalPatients() {
  const { clinicId, loading: bootLoading } = useClinicPortal();
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [q,           setQ]           = useState('');
  const [resendingId, setResendingId] = useState(null);

  // Modal state
  const [newPatientOpen,  setNewPatientOpen]  = useState(false);
  const [bulkInviteOpen,  setBulkInviteOpen]  = useState(false);

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
  const invited     = rows.filter((r) => r.portal_status === 'invited' || r.portal_status === 'offline').length;
  const online      = rows.filter((r) => (r.portal_status || 'online') === 'online').length;

  const resend = async (clinicPatientId) => {
    if (!clinicId || !clinicPatientId) return;
    setResendingId(clinicPatientId);
    try {
      const res      = await clinicPortal.resendOfflinePatientInvite(clinicId, clinicPatientId);
      const n        = res?.data ?? res ?? {};
      const channels = [n.email_sent && 'email', n.sms_sent && 'SMS', n.whatsapp_sent && 'WhatsApp'].filter(Boolean);
      toast.success(channels.length ? `Resent via ${channels.join(', ')}` : 'Resend attempted');
    } catch (e) {
      toast.error(e.message || 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  const handlePatientCreated = (data) => {
    setNewPatientOpen(false);
    load();
  };

  return (
    <ClinicPortalShell
      title="Patients"
      subtitle="Walk-in (offline) patients, invites, and people who booked at your clinic"
      actions={
        <div className="portal-page-actions">
          {/* New Patient button */}
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => setNewPatientOpen(true)}
          >
            <FaIcon icon="fa-user-plus" className="mr-1.5" />
            <span className="hidden sm:inline">New Patient</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Bulk Invite button */}
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={() => setBulkInviteOpen(true)}
            disabled={!clinicId || bootLoading}
          >
            <FaIcon icon="fa-envelope-open-text" className="mr-1.5" />
            <span className="hidden sm:inline">Bulk Invite</span>
            <span className="sm:hidden">Invite</span>
          </button>

          {/* Advanced Search */}
          <Link to="/clinic-portal/search" className="btn-outline text-sm inline-flex items-center gap-2">
            <FaIcon icon="fa-magnifying-glass-plus" />
            <span className="hidden sm:inline">Advanced search</span>
            <span className="sm:hidden">Search</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5">

        {/* KPI cards */}
        <div className="portal-kpi-grid">
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">On roster</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">{rows.length}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Online</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 truncate">{online}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Awaiting account</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1 truncate">{invited}</p>
          </div>
          <div className="glass-card !p-3 sm:!p-4 min-w-0">
            <p className="text-xs text-slate-500">Total visits</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">{totalVisits}</p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card !p-3 sm:!p-4">
          <div className="portal-toolbar">
            <input
              className="input-field flex-1 text-sm w-full sm:max-w-md"
              placeholder="Search name, phone, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="button" className="btn-outline text-sm w-full sm:w-auto" onClick={load}>
              Search
            </button>
          </div>
        </div>

        {/* Patient table */}
        <div className="glass-card !p-0 overflow-hidden">
          {bootLoading || loading ? (
            <div className="h-40 animate-pulse bg-slate-100 m-4 rounded-xl" />
          ) : !rows.length ? (
            <div className="px-4 py-12 text-center">
              <FaIcon icon="fa-users" className="text-3xl text-slate-300 mb-2" />
              <p className="text-slate-500">No patients yet.</p>
              <button
                type="button"
                className="btn-primary mt-4 text-sm"
                onClick={() => setNewPatientOpen(true)}
              >
                <FaIcon icon="fa-user-plus" className="mr-1.5" />
                Add first patient
              </button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="portal-mobile-list">
                {rows.map((p) => {
                  const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
                  return (
                    <article key={key} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {(p.patient_name || 'P').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/clinic-portal/patients/${key}`}
                              className="font-semibold text-slate-900 hover:text-teal-700 truncate block"
                            >
                              {p.patient_name || 'Patient'}
                            </Link>
                            {p.last_visit && (
                              <p className="text-[11px] text-slate-400">Last visit {formatDate(p.last_visit)}</p>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={p.portal_status} />
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>{p.phone || '—'}{p.email ? ` · ${p.email}` : ''}</p>
                        {p.package_name && (
                          <p className="text-slate-800">
                            {p.package_name} · {Number(p.package_completed || 0)}/{Number(p.package_sessions || 0)} sessions
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">{p.visit_count || 0}</span> visits ·{' '}
                          <span className="font-medium text-emerald-700">{money(p.total_spent)}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                        <Link to={`/clinic-portal/patients/${key}`} className="btn-outline text-xs !py-1.5">View</Link>
                        {p.clinic_patient_id && p.portal_status !== 'online' && (
                          <button
                            type="button"
                            className="btn-outline text-xs !py-1.5"
                            disabled={resendingId === p.clinic_patient_id}
                            onClick={() => resend(p.clinic_patient_id)}
                          >
                            {resendingId === p.clinic_patient_id ? 'Sending…' : 'Resend invite'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="portal-desktop-table portal-table-wrap">
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
                      const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
                      return (
                        <tr key={key} className="border-t border-slate-100 hover:bg-teal-50/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {(p.patient_name || 'P').slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <Link
                                  to={`/clinic-portal/patients/${key}`}
                                  className="font-medium text-slate-900 hover:text-teal-700 hover:underline"
                                >
                                  {p.patient_name || 'Patient'}
                                </Link>
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
                                <p>{Number(p.package_completed || 0)}/{Number(p.package_sessions || 0)} sessions</p>
                              </>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold">{p.visit_count || 0}</td>
                          <td className="px-4 py-3 font-medium text-emerald-700">{money(p.total_spent)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Link to={`/clinic-portal/patients/${key}`} className="btn-outline text-xs !py-1.5">View</Link>
                              {p.clinic_patient_id && p.portal_status !== 'online' && (
                                <button
                                  type="button"
                                  className="btn-outline text-xs !py-1.5"
                                  disabled={resendingId === p.clinic_patient_id}
                                  onClick={() => resend(p.clinic_patient_id)}
                                >
                                  {resendingId === p.clinic_patient_id ? 'Sending…' : 'Resend invite'}
                                </button>
                              )}
                            </div>
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

      {/* ── New Patient Modal ── */}
      <Modal open={newPatientOpen} onClose={() => setNewPatientOpen(false)}>
        <ClinicOfflinePatientForm
          clinicId={clinicId}
          onCreated={handlePatientCreated}
          onClose={() => setNewPatientOpen(false)}
        />
      </Modal>

      {/* ── Bulk Invite Modal ── */}
      <Modal open={bulkInviteOpen} onClose={() => setBulkInviteOpen(false)} maxWidth="max-w-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-envelope-open-text" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Bulk Invite Patients</h2>
              <p className="text-xs text-slate-500">Paste up to 50 contacts to invite at once</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBulkInviteOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"
            aria-label="Close"
          >
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        <BulkInvitePanel
          title=""
          description="New patients get an account + temporary password by email and SMS; existing patients get a sign-in reminder."
          roleLabel="patient"
          disabled={!clinicId || bootLoading}
          onSubmit={(contacts) => clinicPortal.bulkInvitePatients(clinicId, { contacts })}
        />
      </Modal>
    </ClinicPortalShell>
  );
}
