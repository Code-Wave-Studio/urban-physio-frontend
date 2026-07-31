import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
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
const BLOOD_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }));
const MARITAL_OPTIONS = ['single', 'married', 'divorced', 'widowed', 'other'].map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));
const ACTIVITY_OPTIONS = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete'].map((v) => ({
  value: v,
  label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));
const PHYSIO_GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
const REFERRAL_OPTIONS = [
  'Social Media',
  'Google',
  'Doctor Referral',
  'Friend/Family',
  'Walk-in',
  'Online Ad',
  'Other',
].map((v) => ({ value: v, label: v }));

const PROFILE_KEYS = [
  'first_name',
  'last_name',
  'phone',
  'whatsapp_number',
  'email',
  'gender',
  'date_of_birth',
  'blood_group',
  'marital_status',
  'occupation',
  'activity_level',
  'preferred_language',
  'preferred_physio_gender',
  'referral_source',
  'referral_details',
  'address',
  'latitude',
  'longitude',
  'emergency_contact_name',
  'emergency_contact_relationship',
  'emergency_contact_phone',
];

function pickProfile(src = {}) {
  const out = {};
  PROFILE_KEYS.forEach((key) => {
    out[key] = src[key] ?? '';
  });
  return out;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.key]: action.value, isDirty: true };
    case 'RESET':
      return { ...pickProfile(action.profile), isDirty: false };
    default:
      return state;
  }
}

export default function PatientOverviewTab({ patientKey, clinicId, initialData, onSaved }) {
  const [state, dispatch] = useReducer(reducer, {
    ...pickProfile(initialData?.profile || {}),
    isDirty: false,
  });
  const [stats, setStats] = useReducer((_, v) => v, initialData?.stats || {});
  const [activePackage, setActivePkg] = useReducer((_, v) => v, initialData?.active_package || null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const snapshotRef = useRef(pickProfile(initialData?.profile || {}));
  const loadedRef = useRef(false);

  const erpParams = clinicId ? { clinic_id: clinicId } : undefined;

  const load = useCallback(async () => {
    if (!patientKey) return;
    try {
      const res = await erpPatient.getOverview(patientKey, erpParams);
      const d = res.data || res;
      const profile = pickProfile(d.profile || {});
      snapshotRef.current = profile;
      dispatch({ type: 'RESET', profile });
      setStats(d.stats || {});
      setActivePkg(d.active_package || null);
    } catch {
      // Keep initial / current data
    }
  }, [patientKey, clinicId]);

  useEffect(() => {
    loadedRef.current = false;
  }, [patientKey, clinicId]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, [load]);

  const setField = (key) => (value) => dispatch({ type: 'SET_FIELD', key, value });

  const startEdit = () => {
    snapshotRef.current = pickProfile(state);
    setEditing(true);
  };

  const cancelEdit = () => {
    dispatch({ type: 'RESET', profile: snapshotRef.current });
    setEditing(false);
    toast('Changes discarded');
  };

  const save = async () => {
    if (!patientKey) return;
    setSaving(true);
    try {
      const profile = pickProfile(state);
      // Empty email must not fail backend email validation
      if (!String(profile.email || '').trim()) {
        profile.email = null;
      }
      const res = await erpPatient.updateOverview(patientKey, profile, erpParams);
      const d = res.data || res;
      const saved = pickProfile(d?.profile || profile);
      snapshotRef.current = saved;
      dispatch({ type: 'RESET', profile: saved });
      if (d?.stats) setStats(d.stats);
      if (d && d.active_package !== undefined) setActivePkg(d.active_package || null);
      setEditing(false);
      toast.success('Profile saved');
      onSaved?.(saved);
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const age = (() => {
    if (!state.date_of_birth) return null;
    try {
      const d = new Date(state.date_of_birth);
      if (Number.isNaN(d.getTime())) return null;
      return Math.floor((Date.now() - d) / (365.25 * 24 * 3600 * 1000));
    } catch {
      return null;
    }
  })();

  return (
    <div className="space-y-5">
      <UnsavedChangesGuard isDirty={editing && state.isDirty} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Patient profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {editing ? 'Edit details below, then save once.' : 'View patient demographics and contact info.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button type="button" className="btn-primary text-xs !py-2 !px-4 inline-flex items-center gap-2" onClick={startEdit}>
              <FaIcon icon="fa-pen" className="text-[10px]" />
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline text-xs !py-2 !px-4"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-xs !py-2 !px-4 inline-flex items-center gap-2"
                onClick={save}
                disabled={saving}
              >
                <FaIcon icon="fa-floppy-disk" className="text-[10px]" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <PatientStatCards stats={stats} activePackage={activePackage} />

      {editing && state.isDirty && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <FaIcon icon="fa-triangle-exclamation" />
            You have unsaved changes
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cancelEdit} disabled={saving} className="text-xs text-slate-600 hover:underline">
              Discard
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn-primary text-xs !py-1.5 !px-4">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card !p-4 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-user" className="text-teal-600 text-sm" />
            Demographic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField editing={editing} label="First Name" value={state.first_name} onChange={setField('first_name')} />
            <EditableField editing={editing} label="Last Name" value={state.last_name} onChange={setField('last_name')} />
            <EditableField editing={editing} label="Date of Birth" value={state.date_of_birth} onChange={setField('date_of_birth')} type="date" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5 font-semibold">Age</p>
              <p className="text-sm text-slate-800 py-1.5">{age !== null ? `${age} years` : '—'}</p>
            </div>
            <EditableField editing={editing} label="Gender" value={state.gender} onChange={setField('gender')} type="select" options={GENDER_OPTIONS} />
            <EditableField editing={editing} label="Blood Group" value={state.blood_group} onChange={setField('blood_group')} type="select" options={BLOOD_OPTIONS} />
            <EditableField editing={editing} label="Marital Status" value={state.marital_status} onChange={setField('marital_status')} type="select" options={MARITAL_OPTIONS} />
            <EditableField editing={editing} label="Occupation" value={state.occupation} onChange={setField('occupation')} />
            <EditableField editing={editing} label="Activity Level" value={state.activity_level} onChange={setField('activity_level')} type="select" options={ACTIVITY_OPTIONS} />
            <EditableField editing={editing} label="Preferred Language" value={state.preferred_language} onChange={setField('preferred_language')} />
            <EditableField editing={editing} label="Preferred Physio Gender" value={state.preferred_physio_gender} onChange={setField('preferred_physio_gender')} type="select" options={PHYSIO_GENDER_OPTIONS} />
            <EditableField editing={editing} label="Referral Source" value={state.referral_source} onChange={setField('referral_source')} type="select" options={REFERRAL_OPTIONS} />
          </div>
          <EditableField editing={editing} label="Referral Details" value={state.referral_details} onChange={setField('referral_details')} type="textarea" />
        </section>

        <section className="glass-card !p-4 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-address-book" className="text-teal-600 text-sm" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <EditableField editing={editing} label="Phone" value={state.phone} onChange={setField('phone')} type="tel" />
              {!editing && state.phone && (
                <div className="flex gap-2 mt-1">
                  <a href={`tel:${state.phone}`} className="text-[10px] text-teal-600 hover:underline inline-flex items-center gap-1">
                    <FaIcon icon="fa-phone" className="text-[9px]" /> Call
                  </a>
                  <a href={`sms:${state.phone}`} className="text-[10px] text-teal-600 hover:underline inline-flex items-center gap-1">
                    <FaIcon icon="fa-message" className="text-[9px]" /> SMS
                  </a>
                </div>
              )}
            </div>
            <div>
              <EditableField editing={editing} label="WhatsApp Number" value={state.whatsapp_number} onChange={setField('whatsapp_number')} type="tel" />
              {!editing && state.whatsapp_number && (
                <a
                  href={`https://wa.me/${String(state.whatsapp_number).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-green-600 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <FaIcon icon="fa-whatsapp" brand className="text-[9px]" /> WhatsApp
                </a>
              )}
            </div>
            <EditableField editing={editing} label="Email" value={state.email} onChange={setField('email')} type="email" className="col-span-full sm:col-span-2" />
            <EditableField editing={editing} label="Address" value={state.address} onChange={setField('address')} type="textarea" className="col-span-full sm:col-span-2" />
          </div>

          {state.latitude && state.longitude && (
            <a
              href={`https://maps.google.com/?q=${state.latitude},${state.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline"
            >
              <FaIcon icon="fa-map-location-dot" />
              View on Google Maps
            </a>
          )}

          <div className="rounded-xl bg-red-50 border border-red-100 p-3 space-y-3">
            <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <FaIcon icon="fa-circle-exclamation" className="text-sm" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EditableField editing={editing} label="Name" value={state.emergency_contact_name} onChange={setField('emergency_contact_name')} />
              <EditableField editing={editing} label="Relationship" value={state.emergency_contact_relationship} onChange={setField('emergency_contact_relationship')} />
              <EditableField editing={editing} label="Phone" value={state.emergency_contact_phone} onChange={setField('emergency_contact_phone')} type="tel" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
