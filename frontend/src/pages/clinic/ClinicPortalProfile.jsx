import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PasswordSecuritySection from '../../components/PasswordSecuritySection';
import ClinicLogoUpload from '../../components/ClinicLogoUpload';
import ClinicCoverUpload from '../../components/clinic/ClinicCoverUpload';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { auth, clinicPortal, location } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TABS = [
  { id: 'clinic', label: 'Clinic details', icon: 'fa-hospital' },
  { id: 'security', label: 'Account & security', icon: 'fa-shield-halved' },
];

const empty = () => ({
  name: '',
  owner_name: '',
  manager_name: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  pincode: '',
  city_id: '',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'security' ? 'security' : 'clinic';
  const { user, setUser } = useAuth();

  const [form, setForm] = useState(empty);
  const [clinicId, setClinicId] = useState(null);
  const [status, setStatus] = useState('');
  const [rejection, setRejection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  const setTab = (id) => {
    if (id === 'security') setSearchParams({ tab: 'security' });
    else setSearchParams({});
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
          ...empty(),
          ...c,
          city_id: c.city_id ? String(c.city_id) : '',
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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e, resubmit = false) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicPortal.updateProfile({
        ...form,
        city_id: form.city_id || undefined,
        resubmit,
      });
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
          <form onSubmit={(e) => save(e, false)} className="glass-card !p-6 space-y-4">
            <ClinicLogoUpload
              logo={form.logo}
              name={form.name}
              clinicId={clinicId}
              onUploaded={(url) => set('logo', url)}
            />
            <ClinicCoverUpload
              coverImage={form.cover_image}
              clinicId={clinicId}
              onChange={(url) => set('cover_image', url)}
            />

            <input
              className="input-field"
              placeholder="Clinic name"
              value={form.name || ''}
              onChange={(e) => set('name', e.target.value)}
              required
            />
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

            <textarea className="input-field min-h-[70px]" placeholder="Address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            <textarea className="input-field min-h-[90px]" placeholder="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
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
