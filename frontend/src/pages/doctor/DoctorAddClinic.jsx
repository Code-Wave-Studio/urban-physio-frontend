import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationMapModal from '../../components/LocationMapModal';
import FaIcon from '../../components/FaIcon';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import ClinicLogoUpload from '../../components/ClinicLogoUpload';
import ClinicGalleryUpload from '../../components/clinic/ClinicGalleryUpload';
import {
  ClinicOpeningHoursFields,
  ClinicProfileDetailsFields,
  ClinicSocialLinksFields,
  ClinicStatisticsFields,
  ClinicTagListFields,
} from '../../components/clinic/ClinicProfileFormSections';
import { doctors, location } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import {
  emptyOpeningHours,
  normalizeOpeningHours,
  normalizeSocialLinks,
  parseTagInput,
  tagsToInput,
} from '../../utils/clinicProfileUtils';
import toast from 'react-hot-toast';

const empty = () => ({
  name: '',
  address: '',
  city_id: '',
  pincode: '',
  phone: '',
  email: '',
  logo: '',
  cover_image: '',
  website: '',
  description: '',
  latitude: null,
  longitude: null,
  opening_hours: emptyOpeningHours(),
  social_links: normalizeSocialLinks(),
  services: '',
  facilities: '',
  equipment_modalities: '',
  stats_patients_treated: '',
  stats_staff_count: '',
  stats_satisfaction_rate: '',
  image_urls: [],
});

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
          <FaIcon icon={icon} className="text-emerald-600" />
          {title}
        </span>
        <FaIcon icon={open ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 text-xs" />
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

function buildPayload(form) {
  const satisfaction = form.stats_satisfaction_rate === '' ? null : Number(form.stats_satisfaction_rate);
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    city_id: parseInt(form.city_id, 10),
    pincode: form.pincode.trim() || undefined,
    phone: form.phone.trim(),
    email: form.email.trim() || undefined,
    logo: form.logo || undefined,
    cover_image: form.cover_image.trim() || undefined,
    website: form.website.trim() || undefined,
    description: form.description.trim() || undefined,
    latitude: form.latitude,
    longitude: form.longitude,
    opening_hours: normalizeOpeningHours(form.opening_hours),
    social_links: form.social_links,
    services: parseTagInput(form.services),
    facilities: parseTagInput(form.facilities),
    equipment_modalities: parseTagInput(form.equipment_modalities),
    stats_patients_treated: form.stats_patients_treated === '' ? 0 : parseInt(form.stats_patients_treated, 10),
    stats_staff_count: form.stats_staff_count === '' ? 0 : parseInt(form.stats_staff_count, 10),
    stats_satisfaction_rate: Number.isFinite(satisfaction) ? satisfaction : null,
    image_urls: form.image_urls,
  };
}

export default function DoctorAddClinic() {
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');

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

  useEffect(() => {
    location.states().then((res) => setStates(res.data || []));
  }, []);

  useEffect(() => {
    if (stateId) {
      location.cities(stateId).then((res) => setCities(res.data || []));
    } else {
      setCities([]);
    }
  }, [stateId]);

  useEffect(() => {
    if (!editId) return;
    doctors
      .getClinic(editId)
      .then((res) => {
        const found = res.data ?? res;
        if (!found) return;
        setForm({
          ...empty(),
          name: found.name || '',
          address: found.address || '',
          city_id: found.city_id ? String(found.city_id) : '',
          pincode: found.pincode || '',
          phone: found.phone || '',
          email: found.email || '',
          logo: found.logo || '',
          cover_image: found.cover_image || '',
          website: found.website || '',
          description: found.description || '',
          latitude: found.latitude != null ? parseFloat(found.latitude) : null,
          longitude: found.longitude != null ? parseFloat(found.longitude) : null,
          opening_hours: normalizeOpeningHours(found.opening_hours),
          social_links: normalizeSocialLinks(found.social_links),
          services: tagsToInput(found.services_list || found.services),
          facilities: tagsToInput(found.facilities_list || found.facilities),
          equipment_modalities: tagsToInput(found.equipment_list || found.equipment_modalities),
          stats_patients_treated: found.stats_patients_treated != null ? String(found.stats_patients_treated) : '',
          stats_staff_count: found.stats_staff_count != null ? String(found.stats_staff_count) : '',
          stats_satisfaction_rate:
            found.stats_satisfaction_rate != null && found.stats_satisfaction_rate !== ''
              ? String(found.stats_satisfaction_rate)
              : '',
          image_urls: found.image_urls || (found.gallery || []).map((g) => g.image_url).filter(Boolean),
        });
      })
      .catch(() => toast.error('Could not load clinic'));
  }, [editId]);

  const selectedCity = useMemo(
    () => cities.find((c) => String(c.id) === String(form.city_id)),
    [cities, form.city_id]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city_id || !form.phone.trim()) {
      toast.error('Please fill clinic name, address, city and phone');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editId) {
        await doctors.updateClinic(editId, payload);
        toast.success('Clinic profile updated');
      } else {
        const res = await doctors.createClinic(payload);
        const newId = res.data?.id;
        toast.success('Clinic submitted for approval');
        if (newId) navigate(`/doctor/clinics/new?edit=${newId}`);
        else navigate('/doctor/clinics');
        return;
      }
      navigate('/doctor/clinics');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{editId ? 'Edit clinic profile' : 'Add clinic'}</h1>
        <p className="text-sm text-slate-600 mt-1">
          Complete your clinic profile — hours, services, gallery & stats appear on your public clinic page.
        </p>
      </div>

      <form onSubmit={submit} className="max-w-3xl space-y-4">
        <FormSection title="Basic details" icon="fa-hospital">
          <ClinicLogoUpload
            logo={form.logo}
            name={form.name}
            clinicId={editId || null}
            onUploaded={(url) => set('logo', url)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinic name</label>
            <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full address</label>
            <textarea className="input-field" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
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
              value={form.city_id}
              onChange={(id) => set('city_id', id)}
              disabled={!stateId}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
              <input className="input-field" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <FaIcon icon="fa-map-location-dot" className="text-emerald-600" /> Map location
            </p>
            <button type="button" className="btn-outline text-sm mt-3 w-full sm:w-auto" onClick={() => setMapOpen(true)}>
              Pick on map
            </button>
            {form.latitude != null && (
              <p className="text-xs text-slate-600 mt-2">
                Pin: {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
                {selectedCity?.name ? ` · ${selectedCity.name}` : ''}
              </p>
            )}
          </div>
        </FormSection>

        <FormSection title="About & website" icon="fa-circle-info">
          <ClinicProfileDetailsFields form={form} set={set} setHours={setHours} />
        </FormSection>

        <FormSection title="Opening hours" icon="fa-clock">
          <ClinicOpeningHoursFields form={form} setHours={setHours} />
        </FormSection>

        <FormSection title="Social media & links" icon="fa-share-nodes">
          <ClinicSocialLinksFields form={form} setSocial={setSocial} />
        </FormSection>

        <FormSection title="Services & equipment" icon="fa-hand-holding-medical">
          <ClinicTagListFields form={form} set={set} />
        </FormSection>

        <FormSection title="Clinic statistics" icon="fa-chart-simple" defaultOpen={false}>
          <ClinicStatisticsFields form={form} set={set} />
          <p className="text-xs text-slate-500">Average rating is calculated automatically from patient reviews.</p>
        </FormSection>

        <FormSection title="Clinic photos" icon="fa-images">
          <ClinicGalleryUpload
            images={form.image_urls}
            clinicId={editId}
            onChange={(urls) => set('image_urls', urls)}
          />
        </FormSection>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sticky bottom-0 bg-slate-50/95 backdrop-blur py-3 -mx-1 px-1 border-t border-slate-200 sm:border-0 sm:static sm:bg-transparent sm:py-0">
          <button type="button" className="btn-outline flex-1 sm:flex-none sm:min-w-[8rem]" onClick={() => navigate('/doctor/clinics')}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none sm:min-w-[10rem] !bg-emerald-600 hover:!bg-emerald-700">
            {saving ? 'Saving…' : editId ? 'Save profile' : 'Submit for approval'}
          </button>
        </div>
      </form>

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
