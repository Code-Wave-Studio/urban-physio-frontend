import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';

const empty = () => ({
  name: '',
  owner_name: '',
  manager_name: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  pincode: '',
  gstin: '',
  pan: '',
  registration_number: '',
  clinic_type: '',
  specialization: '',
  emergency_contact: '',
  description: '',
  logo: '',
  cover_image: '',
  google_maps_url: '',
  resubmit_note: '',
});

export default function ClinicPortalProfile() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState('');
  const [rejection, setRejection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    clinicPortal
      .me()
      .then((res) => {
        const me = res.data || res;
        const c = me.clinic || {};
        setForm({ ...empty(), ...c });
        setStatus(c.portal_status || c.approval_status || '');
        setRejection(c.rejection_reason || '');
      })
      .catch((e) => toast.error(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e, resubmit = false) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicPortal.updateProfile({ ...form, resubmit });
      toast.success(resubmit ? 'Resubmitted for review' : 'Profile saved');
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Status: <span className="font-semibold capitalize">{status || '—'}</span>
          </p>
          {rejection && <p className="text-sm text-rose-600 mt-1">Rejection: {rejection}</p>}
        </div>

        {loading ? (
          <div className="glass-card h-64 animate-pulse" />
        ) : (
          <form onSubmit={(e) => save(e, false)} className="glass-card !p-6 space-y-3">
            <input className="input-field" placeholder="Clinic name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Owner name" value={form.owner_name || ''} onChange={(e) => set('owner_name', e.target.value)} />
              <input className="input-field" placeholder="Manager name" value={form.manager_name || ''} onChange={(e) => set('manager_name', e.target.value)} />
              <input className="input-field" placeholder="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
              <input className="input-field" placeholder="Email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
              <input className="input-field" placeholder="Website" value={form.website || ''} onChange={(e) => set('website', e.target.value)} />
              <input className="input-field" placeholder="Emergency contact" value={form.emergency_contact || ''} onChange={(e) => set('emergency_contact', e.target.value)} />
              <input className="input-field" placeholder="PIN code" value={form.pincode || ''} onChange={(e) => set('pincode', e.target.value)} />
              <input className="input-field" placeholder="Clinic type" value={form.clinic_type || ''} onChange={(e) => set('clinic_type', e.target.value)} />
              <input className="input-field" placeholder="GSTIN" value={form.gstin || ''} onChange={(e) => set('gstin', e.target.value)} />
              <input className="input-field" placeholder="PAN" value={form.pan || ''} onChange={(e) => set('pan', e.target.value)} />
              <input className="input-field sm:col-span-2" placeholder="Registration number" value={form.registration_number || ''} onChange={(e) => set('registration_number', e.target.value)} />
              <input className="input-field sm:col-span-2" placeholder="Specialization / focus" value={form.specialization || ''} onChange={(e) => set('specialization', e.target.value)} />
            </div>
            <textarea className="input-field min-h-[70px]" placeholder="Address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            <textarea className="input-field min-h-[90px]" placeholder="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
            <input className="input-field" placeholder="Logo URL" value={form.logo || ''} onChange={(e) => set('logo', e.target.value)} />
            <input className="input-field" placeholder="Cover image URL" value={form.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} />
            <input className="input-field" placeholder="Google Maps URL" value={form.google_maps_url || ''} onChange={(e) => set('google_maps_url', e.target.value)} />
            {(status === 'rejected' || status === 'pending') && (
              <textarea
                className="input-field min-h-[60px]"
                placeholder="Note for admin when resubmitting"
                value={form.resubmit_note || ''}
                onChange={(e) => set('resubmit_note', e.target.value)}
              />
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              {status === 'rejected' && (
                <button type="button" className="btn-outline" disabled={saving} onClick={(e) => save(e, true)}>
                  Resubmit for approval
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
