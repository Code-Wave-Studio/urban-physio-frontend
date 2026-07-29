import { useCallback, useEffect, useReducer, useRef } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import EditableField from './EditableField';
import PatientStatCards from './PatientStatCards';
import UnsavedChangesGuard from './UnsavedChangesGuard';
import { erpPatient } from '../../services/api';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const BLOOD_OPTIONS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((v) => ({ value: v, label: v }));
const MARITAL_OPTIONS = ['single','married','divorced','widowed','other'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const ACTIVITY_OPTIONS = ['sedentary','lightly_active','moderately_active','very_active','athlete'].map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
const PHYSIO_GENDER_OPTIONS = [{ value: 'any', label: 'Any' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];
const REFERRAL_OPTIONS = ['Social Media','Google','Doctor Referral','Friend/Family','Walk-in','Online Ad','Other'].map((v) => ({ value: v, label: v }));

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.key]: action.value, isDirty: true };
    case 'RESET':     return { ...action.profile, isDirty: false };
    default:          return state;
  }
}

export default function PatientOverviewTab({ patientKey, initialData }) {
  const [state, dispatch] = useReducer(reducer, { ...(initialData?.profile || {}), isDirty: false });
  const [stats, setStats]   = useReducer((_, v) => v, initialData?.stats || {});
  const [activePackage, setActivePkg] = useReducer((_, v) => v, initialData?.active_package || null);
  const [saving, setSaving] = useReducer((_, v) => v, false);
  const loadedRef           = useRef(false);

  const load = useCallback(async () => {
    if (!patientKey) return;
    try {
      const res = await erpPatient.getOverview(patientKey);
      const d   = res.data || res;
      dispatch({ type: 'RESET', profile: d.profile || {} });
      setStats(d.stats || {});
      setActivePkg(d.active_package || null);
    } catch {
      // Use initial data
    }
  }, [patientKey]);

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; load(); }
  }, [load]);

  const setField = (key) => (value) => dispatch({ type: 'SET_FIELD', key, value });

  const save = async () => {
    setSaving(true);
    try {
      const { isDirty, ...profile } = state;
      await erpPatient.updateOverview(patientKey, profile);
      toast.success('Profile saved');
      dispatch({ type: 'RESET', profile });
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    load();
    toast('Changes discarded');
  };

  const age = (() => {
    if (!state.date_of_birth) return null;
    try {
      const d = new Date(state.date_of_birth);
      return Math.floor((Date.now() - d) / (365.25 * 24 * 3600 * 1000));
    } catch { return null; }
  })();

  return (
    <div className="space-y-5">
      <UnsavedChangesGuard isDirty={state.isDirty} />

      {/* Summary Stats */}
      <PatientStatCards stats={stats} activePackage={activePackage} />

      {/* Unsaved Banner */}
      {state.isDirty && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <FaIcon icon="fa-solid fa-triangle-exclamation" />
            You have unsaved changes
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={discard} className="text-xs text-slate-600 hover:underline">Discard</button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-primary text-xs !py-1.5 !px-4"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Demographic Information */}
        <section className="glass-card !p-4 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-solid fa-user" className="text-teal-600 text-sm" />
            Demographic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField label="First Name"   value={state.first_name} onChange={setField('first_name')} />
            <EditableField label="Last Name"    value={state.last_name}  onChange={setField('last_name')} />
            <EditableField label="Date of Birth" value={state.date_of_birth} onChange={setField('date_of_birth')} type="date" />
            <div>
              <p className="text-[10px] uppercase text-slate-400 mb-0.5">Age</p>
              <p className="text-sm text-slate-700">{age !== null ? `${age} years` : '—'}</p>
            </div>
            <EditableField label="Gender" value={state.gender} onChange={setField('gender')} type="select" options={GENDER_OPTIONS} />
            <EditableField label="Blood Group" value={state.blood_group} onChange={setField('blood_group')} type="select" options={BLOOD_OPTIONS} />
            <EditableField label="Marital Status" value={state.marital_status} onChange={setField('marital_status')} type="select" options={MARITAL_OPTIONS} />
            <EditableField label="Occupation" value={state.occupation} onChange={setField('occupation')} />
            <EditableField label="Activity Level" value={state.activity_level} onChange={setField('activity_level')} type="select" options={ACTIVITY_OPTIONS} />
            <EditableField label="Preferred Language" value={state.preferred_language} onChange={setField('preferred_language')} />
            <EditableField label="Preferred Physio Gender" value={state.preferred_physio_gender} onChange={setField('preferred_physio_gender')} type="select" options={PHYSIO_GENDER_OPTIONS} />
            <EditableField label="Referral Source" value={state.referral_source} onChange={setField('referral_source')} type="select" options={REFERRAL_OPTIONS} />
          </div>
          <EditableField label="Referral Details" value={state.referral_details} onChange={setField('referral_details')} type="textarea" />
        </section>

        {/* Contact Information */}
        <section className="glass-card !p-4 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-solid fa-address-book" className="text-teal-600 text-sm" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <EditableField label="Phone" value={state.phone} onChange={setField('phone')} type="tel" />
              {state.phone && (
                <div className="flex gap-2 mt-1">
                  <a href={`tel:${state.phone}`} className="text-[10px] text-teal-600 hover:underline flex items-center gap-1">
                    <FaIcon icon="fa-solid fa-phone" className="text-[9px]" /> Call
                  </a>
                  <a href={`sms:${state.phone}`} className="text-[10px] text-teal-600 hover:underline flex items-center gap-1">
                    <FaIcon icon="fa-solid fa-message" className="text-[9px]" /> SMS
                  </a>
                </div>
              )}
            </div>
            <div>
              <EditableField label="WhatsApp Number" value={state.whatsapp_number} onChange={setField('whatsapp_number')} type="tel" />
              {state.whatsapp_number && (
                <a
                  href={`https://wa.me/${state.whatsapp_number?.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-green-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <FaIcon icon="fa-brands fa-whatsapp" className="text-[9px]" /> WhatsApp
                </a>
              )}
            </div>
            <EditableField label="Email" value={state.email} onChange={setField('email')} type="email" className="col-span-full sm:col-span-2" />
            <EditableField label="Address" value={state.address} onChange={setField('address')} type="textarea" className="col-span-full sm:col-span-2" />
          </div>

          {/* Google Maps */}
          {(state.latitude && state.longitude) && (
            <a
              href={`https://maps.google.com/?q=${state.latitude},${state.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-teal-700 hover:underline"
            >
              <FaIcon icon="fa-solid fa-map-location-dot" />
              View on Google Maps
            </a>
          )}

          {/* Emergency Contact */}
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 space-y-3">
            <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <FaIcon icon="fa-solid fa-circle-exclamation" className="text-sm" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EditableField label="Name"         value={state.emergency_contact_name}         onChange={setField('emergency_contact_name')} />
              <EditableField label="Relationship" value={state.emergency_contact_relationship} onChange={setField('emergency_contact_relationship')} />
              <EditableField label="Phone"        value={state.emergency_contact_phone}        onChange={setField('emergency_contact_phone')} type="tel" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
