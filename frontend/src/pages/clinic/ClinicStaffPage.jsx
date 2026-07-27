import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

const ROLE_OPTIONS = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'clinic_admin', label: 'Clinic Admin (can unlock admin)' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

export default function ClinicStaffPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    staff_role: 'receptionist',
  });

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.listStaff(clinicId);
      setStaff(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Could not load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && isAdminMode && can('staff.manage')) load();
  }, [clinicId, isAdminMode, can, load]);

  if (!boot && (!isAdminMode || !can('staff.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    try {
      const res = await clinicPortal.createStaff(clinicId, form);
      const data = res.data || res;
      if (data?.temp_password) {
        toast.success(`Staff created. Temp password: ${data.temp_password}`, { duration: 8000 });
      } else {
        toast.success(data?.email_sent === false ? 'Staff saved (email may have failed)' : 'Staff saved');
      }
      setForm({ full_name: '', email: '', phone: '', staff_role: 'receptionist' });
      load();
    } catch (err) {
      toast.error(err.message || 'Could not save staff');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (row) => {
    if (!window.confirm(`Deactivate ${row.full_name}? They will lose portal access.`)) return;
    try {
      await clinicPortal.removeStaff(clinicId, row.id);
      toast.success('Staff deactivated');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not deactivate');
    }
  };

  const setRole = async (row, staff_role) => {
    try {
      await clinicPortal.updateStaff(clinicId, row.id, { staff_role });
      toast.success('Role updated');
      load();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  return (
    <ClinicPortalShell
      title="Staff Management"
      subtitle="Receptionists and clinic admin users for this clinic"
      actions={
        <Link to="/clinic-portal/team" className="text-sm text-teal-700 font-medium hover:underline">
          ← My Team
        </Link>
      }
    >
      <div className="space-y-5 max-w-4xl">
        <form onSubmit={submit} className="glass-card !p-5 grid sm:grid-cols-2 gap-3">
          <h2 className="font-bold sm:col-span-2 flex items-center gap-2">
            <FaIcon icon="fa-user-plus" className="text-primary-600" />
            Add staff member
          </h2>
          <input
            className="input-field"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            required
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="input-field"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.staff_role}
            onChange={(e) => setForm((f) => ({ ...f, staff_role: e.target.value }))}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary sm:col-span-2" disabled={saving || !clinicId}>
            {saving ? 'Saving…' : 'Create / invite staff'}
          </button>
          <p className="sm:col-span-2 text-xs text-slate-500">
            New users get a temporary password emailed to the clinic login. Only Clinic Admin staff can unlock the admin dashboard.
          </p>
        </form>

        <div className="glass-card !p-0 overflow-hidden">
          {boot || loading ? (
            <div className="h-32 animate-pulse bg-slate-100 m-4 rounded-xl" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80 text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.email || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          className="input-field !py-1 text-xs"
                          value={s.staff_role || 'receptionist'}
                          onChange={(e) => setRole(s, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${Number(s.is_active) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {Number(s.is_active) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(s.is_active) ? (
                          <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => deactivate(s)}>
                            Deactivate
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {!staff.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No staff yet. Add a receptionist to share front-desk access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ClinicPortalShell>
  );
}
