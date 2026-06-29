import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PasswordSecuritySection from '../../components/PasswordSecuritySection';
import LocationMapModal from '../../components/LocationMapModal';
import FaIcon from '../../components/FaIcon';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import { auth, doctors, location, uploadAvatar } from '../../services/api';
import DoctorAvatar from '../../components/DoctorAvatar';
import { googleMapsUrl } from '../../utils/locationHelpers';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import { useAuth } from '../../contexts/AuthContext';
import { ClinicSocialLinksFields } from '../../components/clinic/ClinicProfileFormSections';
import DoctorProfessionalFields from '../../components/doctor/DoctorProfessionalFields';
import { normalizeSocialLinks } from '../../utils/clinicProfileUtils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'fa-user' },
  { id: 'professional', label: 'Professional', icon: 'fa-stethoscope' },
  { id: 'fees', label: 'Fees & radius', icon: 'fa-indian-rupee-sign' },
  { id: 'location', label: 'Location', icon: 'fa-map-location-dot' },
  { id: 'security', label: 'Security', icon: 'fa-shield-halved' },
];

const emptyForm = () => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  state_id: '',
  city_id: '',
  city_name: '',
  state_name: '',
  license_number: '',
  specialization: '',
  experience_years: '',
  bio: '',
  consultation_fee: '',
  online_fee: '',
  home_visit_fee: '',
  service_radius_km: '',
  address: '',
  latitude: null,
  longitude: null,
  is_verified: 0,
  rating_avg: 0,
  rating_count: 0,
  avatar: '',
  social_links: normalizeSocialLinks(),
  profile_public: 1,
  seo_title: '',
  seo_description: '',
  degree_bpt: '',
  degree_mpt: '',
  certifications: [],
  experience_timeline: [],
});

function profileToForm(p) {
  if (!p) return emptyForm();
  return {
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    email: p.email || '',
    phone: p.phone || '',
    state_id: p.state_id ? String(p.state_id) : '',
    city_id: p.city_id ? String(p.city_id) : '',
    city_name: p.city_name || '',
    state_name: p.state_name || '',
    license_number: p.license_number || '',
    specialization: p.specialization || '',
    experience_years: p.experience_years ?? '',
    bio: p.bio || '',
    consultation_fee: p.consultation_fee ?? '',
    online_fee: p.online_fee ?? '',
    home_visit_fee: p.home_visit_fee ?? '',
    service_radius_km: p.service_radius_km ?? 25,
    address: p.address || '',
    latitude: p.latitude != null ? parseFloat(p.latitude) : null,
    longitude: p.longitude != null ? parseFloat(p.longitude) : null,
    is_verified: p.is_verified,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    avatar: p.avatar || '',
    social_links: normalizeSocialLinks(p.social_links_parsed || p.social_links),
    profile_public: p.profile_public != null ? Number(p.profile_public) : 1,
    seo_title: p.seo_title || '',
    seo_description: p.seo_description || '',
    degree_bpt: p.degree_bpt || '',
    degree_mpt: p.degree_mpt || '',
    certifications: p.certifications_list?.length
      ? [...p.certifications_list]
      : Array.isArray(p.certifications)
        ? p.certifications
        : [],
    experience_timeline: p.experience_timeline_list?.length
      ? p.experience_timeline_list.map((e) => ({ ...e }))
      : Array.isArray(p.experience_timeline)
        ? p.experience_timeline
        : [],
  };
}

export default function DoctorProfile() {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'personal');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    doctors
      .getProfile()
      .then((res) => {
        const p = res?.data ?? res;
        setForm(profileToForm(p));
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    location.states().then((res) => setStates(res.data || []));
  }, [load]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [searchParams]);

  const onPasswordUpdated = (authUser) => {
    if (authUser && typeof authUser === 'object') {
      setUser((u) => {
        const merged = { ...u, ...authUser };
        localStorage.setItem('user', JSON.stringify(merged));
        return merged;
      });
    }
  };

  const switchTab = (id) => {
    setTab(id);
    navigate(id === 'personal' ? '/doctor/profile' : `/doctor/profile?tab=${id}`, { replace: true });
  };

  useEffect(() => {
    if (form.state_id) {
      location.cities(form.state_id).then((res) => setCities(res.data || []));
    } else {
      setCities([]);
    }
  }, [form.state_id]);

  useEffect(() => {
    if (!loading && form.state_id && states.length && !cities.length) {
      location.cities(form.state_id).then((res) => setCities(res.data || []));
    }
  }, [loading, form.state_id, states.length, cities.length]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleApiError = (err) => {
    if (err.errors) setFieldErrors(err.errors);
    toast.error(err.message || 'Save failed');
  };

  const refreshAuth = async () => {
    try {
      const res = await auth.me();
      const u = res?.data ?? res;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch {
      /* ignore */
    }
  };

  const save = async (payload, successMsg) => {
    setSaving(true);
    setFieldErrors({});
    try {
      const res = await doctors.updateProfile(payload);
      const updated = res?.data ?? res;
      if (updated && typeof updated === 'object') {
        setForm(profileToForm(updated));
      }
      await refreshAuth();
      toast.success(successMsg);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const savePersonal = () =>
    save(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        city_id: form.city_id ? parseInt(form.city_id, 10) : null,
      },
      'Personal details saved'
    );

  const saveProfessional = () =>
    save(
      {
        specialization: form.specialization.trim(),
        license_number: form.license_number.trim(),
        experience_years: parseInt(form.experience_years, 10) || 0,
        bio: form.bio.trim(),
        social_links: form.social_links,
        profile_public: form.profile_public ? 1 : 0,
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
        degree_bpt: form.degree_bpt.trim(),
        degree_mpt: form.degree_mpt.trim(),
        certifications: (form.certifications || []).map((c) => c.trim()).filter(Boolean),
        experience_timeline: (form.experience_timeline || [])
          .map((e) => ({
            duration: (e.duration || '').trim(),
            organization: (e.organization || '').trim(),
          }))
          .filter((e) => e.duration || e.organization),
      },
      'Professional details saved'
    );

  const saveFees = () =>
    save(
      {
        consultation_fee: parseFloat(form.consultation_fee) || 0,
        online_fee: parseFloat(form.online_fee) || 0,
        home_visit_fee: parseFloat(form.home_visit_fee) || 0,
        service_radius_km: parseInt(form.service_radius_km, 10) || 25,
      },
      'Fees updated'
    );

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG or WebP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2MB or smaller');
      return;
    }
    setUploadingPhoto(true);
    try {
      const res = await uploadAvatar(file);
      const url = res.data?.avatar ?? res.data?.avatar_url ?? '';
      set('avatar', url);
      await refreshAuth();
      toast.success('Profile photo updated — patients can see it now');
    } catch (err) {
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const saveLocation = () =>
    save(
      {
        address: form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
      },
      'Practice location saved'
    );

  const mapUrl = googleMapsUrl(form.latitude, form.longitude);

  if (loading) {
    return (
      <DashboardLayout links={DOCTOR_NAV} variant="doctor">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600 text-sm mt-1">
          Update your details, consultation fees, and practice location. Patients see this on your public profile.
        </p>
      </div>

      {/* Status strip */}
      <div className="glass-card mb-5 md:mb-6 flex flex-wrap items-center gap-4 !p-4">
        <div className="flex items-center gap-3 min-w-0">
          <DoctorAvatar
            doctor={{ avatar: form.avatar, first_name: form.first_name, last_name: form.last_name }}
            size="md"
            className="!rounded-full"
          />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">
              Dr. {form.first_name} {form.last_name}
            </p>
            <p className="text-sm text-slate-500 truncate">{form.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 ml-auto">
          {Number(form.is_verified) === 1 ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified by admin
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Pending verification
            </span>
          )}
          {Number(form.rating_avg) > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              ★ {Number(form.rating_avg).toFixed(1)} ({form.rating_count} reviews)
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 md:mb-6 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`shrink-0 px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition inline-flex items-center gap-1.5 md:gap-2 ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-white/70 text-slate-600 border border-slate-200 hover:border-primary-300'
            }`}
          >
            <FaIcon icon={t.icon} className="text-xs" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal */}
      {tab === 'personal' && (
        <div className="glass-card max-w-2xl space-y-4 !p-4 md:!p-6">
          <h2 className="font-semibold text-slate-800">Personal information</h2>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col sm:flex-row items-center gap-4">
            <DoctorAvatar
              doctor={{ avatar: form.avatar, first_name: form.first_name, last_name: form.last_name }}
              size="xl"
              className="!rounded-full"
            />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="font-medium text-slate-800">Profile photo</p>
              <p className="text-xs text-slate-500">
                Shown publicly on Find Doctors, your profile page, and booking. JPG, PNG or WebP · max 2MB.
              </p>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoChange}
                />
                <span
                  className={`btn-primary text-sm cursor-pointer inline-flex items-center gap-2 ${
                    uploadingPhoto ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <FaIcon icon={uploadingPhoto ? 'fa-spinner' : 'fa-camera'} className={uploadingPhoto ? 'fa-spin' : ''} />
                  {uploadingPhoto ? 'Uploading…' : form.avatar ? 'Change photo' : 'Upload photo'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
              <input
                className={`input-field ${fieldErrors.first_name ? 'border-red-400' : ''}`}
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
              />
              {fieldErrors.first_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                className={`input-field ${fieldErrors.last_name ? 'border-red-400' : ''}`}
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
              />
              {fieldErrors.last_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.last_name}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input className="input-field bg-slate-50 text-slate-500" value={form.email} disabled />
            <p className="text-xs text-slate-500 mt-1">Contact admin to change your login email.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              className="input-field"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SearchableLocationSelect
              id="doctor-profile-state"
              label="State"
              placeholder="Select state"
              options={states}
              value={form.state_id}
              onChange={(id) => {
                set('state_id', id);
                set('city_id', '');
              }}
              emptyMessage="No state found"
            />
            <SearchableLocationSelect
              id="doctor-profile-city"
              label="City"
              placeholder={form.state_id ? 'Select city' : 'Select state first'}
              options={cities}
              value={form.city_id}
              onChange={(id) => set('city_id', id)}
              disabled={!form.state_id}
              emptyMessage="No city found — try another spelling"
            />
          </div>
          <p className="text-xs text-slate-500">
            All Indian states and major cities are listed. Type to search if your city is not visible immediately.
          </p>
          <button type="button" onClick={savePersonal} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save personal details'}
          </button>
        </div>
      )}

      {/* Professional */}
      {tab === 'professional' && (
        <div className="glass-card max-w-2xl space-y-4 !p-4 md:!p-6">
          <h2 className="font-semibold text-slate-800">Professional details</h2>
          <p className="text-sm text-slate-500">Shown on your public doctor profile and booking pages.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
            <input
              className="input-field"
              placeholder="e.g. Sports Physiotherapy, Orthopedic Rehab"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">License / registration number</label>
            <input
              className="input-field"
              placeholder="State council or license ID"
              value={form.license_number}
              onChange={(e) => set('license_number', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years of experience</label>
            <input
              type="number"
              min={0}
              max={60}
              className="input-field"
              value={form.experience_years}
              onChange={(e) => set('experience_years', e.target.value)}
            />
            {fieldErrors.experience_years && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.experience_years}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Tell patients about your approach, qualifications, and areas of expertise..."
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </div>
          <DoctorProfessionalFields form={form} set={set} setForm={setForm} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Social media links</label>
            <ClinicSocialLinksFields
              form={form}
              setSocial={(key, value) => setForm((f) => ({ ...f, social_links: { ...f.social_links, [key]: value } }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SEO title</label>
              <input className="input-field" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Public profile title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SEO description</label>
              <input className="input-field" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="Short meta description" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.profile_public} onChange={(e) => set('profile_public', e.target.checked ? 1 : 0)} />
            Show my public profile on the website (SEO on)
          </label>
          <button type="button" onClick={saveProfessional} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save professional details'}
          </button>
        </div>
      )}

      {/* Fees */}
      {tab === 'fees' && (
        <div className="glass-card max-w-2xl space-y-4 !p-4 md:!p-6">
          <h2 className="font-semibold text-slate-800">Consultation fees</h2>
          <p className="text-sm text-slate-500">
            These amounts are used when patients book online, clinic, or home visits with you.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FaIcon icon="fa-hospital" className="mr-1 text-primary-600" />
                Clinic (₹)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                className={`input-field ${fieldErrors.consultation_fee ? 'border-red-400' : ''}`}
                value={form.consultation_fee}
                onChange={(e) => set('consultation_fee', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FaIcon icon="fa-video" className="mr-1 text-primary-600" />
                Online (₹)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                className={`input-field ${fieldErrors.online_fee ? 'border-red-400' : ''}`}
                value={form.online_fee}
                onChange={(e) => set('online_fee', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FaIcon icon="fa-house-medical" className="mr-1 text-primary-600" />
                Home visit (₹)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                className={`input-field ${fieldErrors.home_visit_fee ? 'border-red-400' : ''}`}
                value={form.home_visit_fee}
                onChange={(e) => set('home_visit_fee', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Home visit service radius (km)</label>
            <input
              type="number"
              min={1}
              max={200}
              className={`input-field max-w-xs ${fieldErrors.service_radius_km ? 'border-red-400' : ''}`}
              value={form.service_radius_km}
              onChange={(e) => set('service_radius_km', e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">How far you travel for home visits (1–200 km).</p>
            {fieldErrors.service_radius_km && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.service_radius_km}</p>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800 mb-2">Preview for patients</p>
            <ul className="space-y-1">
              <li>Clinic: ₹{Number(form.consultation_fee || 0).toLocaleString('en-IN')}</li>
              <li>Online: ₹{Number(form.online_fee || 0).toLocaleString('en-IN')}</li>
              <li>Home visit: ₹{Number(form.home_visit_fee || 0).toLocaleString('en-IN')}</li>
            </ul>
          </div>
          <button type="button" onClick={saveFees} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save fees'}
          </button>
        </div>
      )}

      {tab === 'security' && (
        <div className="glass-card max-w-2xl space-y-4 !p-4 md:!p-6">
          <h2 className="font-semibold text-slate-800">Password & security</h2>
          <PasswordSecuritySection
            passwordCustomized={!!user?.password_customized}
            onUpdated={onPasswordUpdated}
          />
        </div>
      )}

      {/* Location */}
      {tab === 'location' && (
        <div className="glass-card max-w-2xl space-y-4 !p-4 md:!p-6">
          <h2 className="font-semibold text-slate-800">Practice location</h2>
          <p className="text-sm text-slate-500">
            Used for clinic bookings when no separate clinic address is set. Helps patients find you on the map.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Clinic / practice full address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <button type="button" onClick={() => setMapOpen(true)} className="btn-outline w-full text-sm">
            <FaIcon icon="fa-map" className="mr-2" />
            Set pin on map
          </button>
          {form.latitude != null && (
            <p className="text-xs text-slate-600">
              Coordinates: {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="block text-primary-600 mt-1 font-medium">
                  Preview on Google Maps →
                </a>
              )}
            </p>
          )}
          <button type="button" onClick={saveLocation} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save location'}
          </button>
        </div>
      )}

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
