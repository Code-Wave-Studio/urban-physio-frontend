import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PasswordSecuritySection from '../../components/PasswordSecuritySection';
import ClinicLogoUpload from '../../components/ClinicLogoUpload';
import ClinicGalleryUpload from '../../components/clinic/ClinicGalleryUpload';
import ClinicPortalProfileServices from '../../components/clinic/ClinicPortalProfileServices';
import LocationMapModal from '../../components/LocationMapModal';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import {
  ClinicOpeningHoursFields,
  ClinicLocationFields,
  ClinicProfileDetailsFields,
  ClinicSocialLinksFields,
  ClinicStatisticsFields,
  ClinicTagListFields,
} from '../../components/clinic/ClinicProfileFormSections';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { auth, clinicPortal, location } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  buildClinicPayload,
  clinicRecordToForm,
  emptyClinicForm,
} from '../../utils/clinicProfileUtils';

const TABS = [
  { id: 'clinic', label: 'Clinic details', icon: 'fa-hospital' },
  { id: 'security', label: 'Account & security', icon: 'fa-shield-halved' },
];

function FormSection({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-slate-50/80 border-b border-slate-100"
      >
        <span className="font-semibold text-slate-800 text-sm inline-flex items-center gap-2">
          <FaIcon icon={icon} className="text-teal-600" />
          {title}
        </span>
        <FaIcon icon={open ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 text-xs" />
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

const emptyOrg = () => ({
  owner_name: '',
  manager_name: '',
  gstin: '',
  pan: '',
  registration_number: '',
  clinic_type: '',
  specialization: '',
  emergency_contact: '',
  resubmit_note: '',
});

export default function ClinicPortalProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'security' ? 'security' : 'clinic';
  const { user, setUser } = useAuth();

  const [form, setForm] = useState(() => ({ ...emptyClinicForm(), ...emptyOrg() }));
  const [clinicId, setClinicId] = useState(null);
  const [status, setStatus] = useState('');
  const [rejection, setRejection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  const setTab = (id) => {
    if (id === 'security') setSearchParams({ tab: 'security' });
    else setSearchParams({});
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, social_links: { ...f.social_links, [key]: value } }));
  const setHours = (key, value) => {
    const slots = value.trim()
      ? value.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    setForm((f) => ({
      ...f,
      opening_hours: { ...f.opening_hours, [key]: slots },
    }));
  };

  const load = useCallback(() => {
    setLoading(true);
    clinicPortal
      .me()
      .then((res) => {
        const me = res.data || res;
        const c = me.clinic || {};
        setClinicId(c.id || null);
        setForm({
          ...clinicRecordToForm(c),
          owner_name: c.owner_name || '',
          manager_name: c.manager_name || '',
          gstin: c.gstin || '',
          pan: c.pan || '',
          registration_number: c.registration_number || '',
          clinic_type: c.clinic_type || '',
          specialization: c.specialization || '',
          emergency_contact: c.emergency_contact || '',
          resubmit_note: c.resubmit_note || '',
        });
        setStatus(c.portal_status || c.approval_status || '');
        setRejection(c.rejection_reason || '');
        setAccountForm({
          first_name: me.user?.first_name || user?.first_name || '',
          last_name: me.user?.last_name || user?.last_name || '',
          phone: me.user?.phone || user?.phone || '',
        });
        if (c.state_id) setStateId(String(c.state_id));
      })
      .catch((e) => toast.error(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [user?.first_name, user?.last_name, user?.phone]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    location.states().then((res) => setStates(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    location.cities(stateId).then((res) => setCities(res.data || [])).catch(() => setCities([]));
  }, [stateId]);

  const save = async (e, resubmit = false) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      toast.error('Clinic name, address and phone are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...buildClinicPayload(form),
        owner_name: form.owner_name.trim() || undefined,
        manager_name: form.manager_name.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
        pan: form.pan.trim() || undefined,
        registration_number: form.registration_number.trim() || undefined,
        clinic_type: form.clinic_type.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        emergency_contact: form.emergency_contact.trim() || undefined,
        resubmit,
        resubmit_note: form.resubmit_note.trim() || undefined,
      };
      await clinicPortal.updateProfile(payload);
      toast.success(resubmit ? 'Resubmitted for review' : 'Profile saved');
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const res = await auth.updateProfile({
        first_name: accountForm.first_name.trim(),
        last_name: accountForm.last_name.trim(),
        phone: accountForm.phone.trim(),
      });
      const updated = res?.data ?? res;
      if (updated && typeof updated === 'object') {
        const next = { ...user, ...updated };
        setUser(next);
        localStorage.setItem('user', JSON.stringify(next));
      }
      toast.success('Account details saved');
    } catch (err) {
      toast.error(err.message || 'Could not update account');
    } finally {
      setSavingAccount(false);
    }
  };

  const onPasswordUpdated = (updated) => {
    if (updated && typeof updated === 'object') {
      const next = { ...user, ...updated, password_customized: 1 };
      setUser(next);
      localStorage.setItem('user', JSON.stringify(next));
    } else {
      const next = { ...user, password_customized: 1 };
      setUser(next);
      localStorage.setItem('user', JSON.stringify(next));
    }
  };

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Status: <span className="font-semibold capitalize">{status || '—'}</span>
            {' · '}Manage banner photos, hours, services, stats and more
          </p>
          {rejection && <p className="text-sm text-rose-600 mt-1">Rejection: {rejection}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-300'
              }`}
            >
              <FaIcon icon={t.icon} className="text-xs" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card h-64 animate-pulse" />
        ) : tab === 'security' ? (
          <div className="space-y-4">
            <div className="glass-card !p-6 space-y-4">
              <h2 className="font-semibold text-slate-800">Login account</h2>
              <p className="text-sm text-slate-500">
                Signed in as <strong>{user?.email}</strong>
                {user?.auth_provider === 'google' ? ' · Google account linked' : ''}
              </p>
              <form onSubmit={saveAccount} className="space-y-3 max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="First name"
                    value={accountForm.first_name}
                    onChange={(e) => setAccountForm((f) => ({ ...f, first_name: e.target.value }))}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="Last name"
                    value={accountForm.last_name}
                    onChange={(e) => setAccountForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
                <input
                  className="input-field"
                  placeholder="Mobile number"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <button type="submit" className="btn-primary" disabled={savingAccount}>
                  {savingAccount ? 'Saving…' : 'Save account details'}
                </button>
              </form>
            </div>

            <div className="glass-card !p-6 space-y-4">
              <h2 className="font-semibold text-slate-800">Password & security</h2>
              <PasswordSecuritySection
                passwordCustomized={!!user?.password_customized}
                onUpdated={onPasswordUpdated}
                forgotLoginPath="/clinic/login"
                forgotLoginRole="clinic"
              />
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Locked out?{' '}
                <Link
                  to="/forgot-password"
                  state={{ loginRole: 'clinic', loginPath: '/clinic/login' }}
                  className="text-primary-600 font-medium hover:underline"
                >
                  Reset password via email
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => save(e, false)} className="space-y-4">
            <FormSection title="Basic details" icon="fa-hospital">
              <ClinicLogoUpload
                logo={form.logo}
                name={form.name}
                clinicId={clinicId}
                onUploaded={(url) => set('logo', url)}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clinic name</label>
                  <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea className="input-field" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <SearchableLocationSelect
                  label="State"
                  placeholder="Select state"
                  options={states}
                  value={stateId}
                  onChange={(id) => {
                    setStateId(id);
                    set('city_id', '');
                  }}
                />
                <SearchableLocationSelect
                  label="City"
                  placeholder={stateId ? 'Select city' : 'Select state first'}
                  options={cities}
                  value={form.city_id || ''}
                  onChange={(id) => set('city_id', id)}
                  disabled={!stateId}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input className="input-field" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" className="input-field" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="input-field" placeholder="Owner name" value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
                <input className="input-field" placeholder="Manager name" value={form.manager_name} onChange={(e) => set('manager_name', e.target.value)} />
                <input className="input-field" placeholder="Clinic type" value={form.clinic_type} onChange={(e) => set('clinic_type', e.target.value)} />
                <input className="input-field" placeholder="Emergency contact" value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} />
                <input className="input-field" placeholder="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
                <input className="input-field" placeholder="PAN" value={form.pan} onChange={(e) => set('pan', e.target.value)} />
                <input className="input-field sm:col-span-2" placeholder="Registration number" value={form.registration_number} onChange={(e) => set('registration_number', e.target.value)} />
                <input className="input-field sm:col-span-2" placeholder="Specialization / focus" value={form.specialization} onChange={(e) => set('specialization', e.target.value)} />
              </div>
              <ClinicLocationFields form={form} set={set} onPickMap={() => setMapOpen(true)} />
            </FormSection>

            <FormSection title="About, cover & website" icon="fa-circle-info">
              <ClinicProfileDetailsFields form={form} set={set} setHours={setHours} clinicId={clinicId} />
            </FormSection>

            <FormSection title="Opening hours" icon="fa-clock">
              <ClinicOpeningHoursFields form={form} setHours={setHours} />
            </FormSection>

            <FormSection title="Social media" icon="fa-share-nodes" defaultOpen={false}>
              <ClinicSocialLinksFields form={form} setSocial={setSocial} />
            </FormSection>

            <FormSection title="Services & equipment" icon="fa-hand-holding-medical" defaultOpen={false}>
              <ClinicTagListFields form={form} set={set} />
            </FormSection>

            {clinicId ? (
              <FormSection title="Treatment services (profile cards)" icon="fa-spa">
                <ClinicPortalProfileServices clinicId={clinicId} />
              </FormSection>
            ) : null}

            <FormSection title="Clinic statistics" icon="fa-chart-simple" defaultOpen={false}>
              <ClinicStatisticsFields form={form} set={set} />
            </FormSection>

            <FormSection title="Banner photos (max 10)" icon="fa-images">
              <p className="text-xs text-slate-500 -mt-1 mb-2">
                Extra photos for the profile carousel. Recommended 1600 × 1000 px · max 3MB each.
              </p>
              <ClinicGalleryUpload
                images={form.image_urls}
                clinicId={clinicId}
                onChange={(urls) => set('image_urls', urls)}
                max={10}
              />
            </FormSection>

            {(status === 'rejected' || status === 'pending') && (
              <div className="glass-card !p-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Note for admin when resubmitting</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={form.resubmit_note || ''}
                  onChange={(e) => set('resubmit_note', e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1 pb-4">
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

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form.latitude}
        initialLng={form.longitude}
        onConfirm={({ lat, lng }) => {
          set('latitude', lat);
          set('longitude', lng);
        }}
      />
    </DashboardLayout>
  );
}
