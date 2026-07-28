import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const DAYS = [
  { id: 0, label: 'Sun', full: 'Sunday' },
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
];

const SERVICE_DEFS = [
  {
    type: 'online',
    label: 'Online Consultation',
    icon: 'fa-video',
    desc: 'Video call via Zoom',
  },
  {
    type: 'home_visit',
    label: 'Home Visit',
    icon: 'fa-house-medical',
    desc: 'Physio at patient doorstep',
  },
  {
    type: 'clinic',
    label: 'Clinic Visit',
    icon: 'fa-hospital',
    desc: 'In-person at your mapped clinics',
  },
];

function emptySlot(day) {
  return {
    day_of_week: day,
    start_time: '10:00',
    end_time: '13:00',
    slot_duration_minutes: 30,
    is_active: 1,
  };
}

function serviceStatus(row) {
  if (!row) return { key: 'unknown', label: 'Not configured' };
  if (row.approval_status === 'pending') {
    return {
      key: 'pending',
      label: `Pending approval (${row.requested_enabled ? 'enable' : 'disable'})`,
    };
  }
  if (row.approval_status === 'rejected') {
    return { key: 'rejected', label: 'Change rejected — contact admin' };
  }
  return row.is_enabled
    ? { key: 'live', label: 'Active — patients can book' }
    : { key: 'off', label: 'Disabled' };
}

function DaySlotEditor({ day, daySlots, onUpdate, onAdd, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-800 text-sm">
          {DAYS.find((d) => d.id === day)?.full}
        </p>
        <button type="button" className="text-sm text-primary-700 font-medium hover:underline" onClick={onAdd}>
          + Add time range
        </button>
      </div>
      {daySlots.length === 0 ? (
        <p className="text-sm text-slate-500">No slots for this day.</p>
      ) : (
        <div className="space-y-2">
          {daySlots.map((s, idx) => (
            <div
              key={`${day}-${idx}`}
              className="grid grid-cols-12 gap-2 items-end bg-white border border-white rounded-xl p-3 shadow-sm"
            >
              <div className="col-span-4 sm:col-span-3">
                <label className="text-xs text-slate-500">Start</label>
                <input
                  type="time"
                  className="input-field !py-2"
                  value={String(s.start_time).slice(0, 5)}
                  onChange={(e) => onUpdate(idx, { start_time: e.target.value })}
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <label className="text-xs text-slate-500">End</label>
                <input
                  type="time"
                  className="input-field !py-2"
                  value={String(s.end_time).slice(0, 5)}
                  onChange={(e) => onUpdate(idx, { end_time: e.target.value })}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="text-xs text-slate-500">Min</label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  className="input-field !py-2"
                  value={s.slot_duration_minutes || 30}
                  onChange={(e) => onUpdate(idx, { slot_duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1 flex justify-end pb-1">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove"
                >
                  <FaIcon icon="fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorClinicAvailability() {
  const [clinics, setClinics] = useState([]);
  const [activeTab, setActiveTab] = useState('online_home');
  const [day, setDay] = useState(1);
  const [generalSlots, setGeneralSlots] = useState([]);
  const [clinicSlots, setClinicSlots] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceDraft, setServiceDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingServices, setSavingServices] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);

  const approvedClinics = useMemo(
    () => clinics.filter((c) => c.approval_status === 'approved'),
    [clinics]
  );

  const loadServices = useCallback(() => {
    return doctors.getServices().then((res) => {
      const rows = res.data || [];
      setServices(rows);
      const draft = {};
      rows.forEach((r) => {
        draft[r.service_type] = Number(r.requested_enabled) === 1;
      });
      setServiceDraft(draft);
    });
  }, []);

  const loadGeneral = useCallback(() => {
    return doctors.getAvailability().then((res) => setGeneralSlots(res.data || []));
  }, []);

  const loadClinicSlots = useCallback(
    (clinicId) => {
      if (!clinicId) return Promise.resolve();
      return doctors.clinicAvailability(clinicId).then((res) => setClinicSlots(res.data || []));
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      doctors.clinics().then((res) => setClinics(res.data || [])),
      loadServices(),
      loadGeneral(),
    ])
      .catch((e) => toast.error(e.message || 'Could not load settings'))
      .finally(() => setLoading(false));
  }, [loadServices, loadGeneral]);

  const activeClinicId = useMemo(() => {
    if (String(activeTab).startsWith('clinic_')) {
      return String(activeTab).replace('clinic_', '');
    }
    return '';
  }, [activeTab]);

  useEffect(() => {
    if (activeClinicId) {
      setLoading(true);
      loadClinicSlots(activeClinicId).finally(() => setLoading(false));
    }
  }, [activeClinicId, loadClinicSlots]);

  const activeSlots = activeClinicId ? clinicSlots : generalSlots;
  const setActiveSlots = activeClinicId ? setClinicSlots : setGeneralSlots;

  const daySlots = useMemo(
    () => activeSlots.filter((s) => Number(s.day_of_week) === Number(day)),
    [activeSlots, day]
  );

  const updateSlot = (idx, patch) => {
    const target = daySlots[idx];
    setActiveSlots((prev) => prev.map((s) => (s === target ? { ...s, ...patch } : s)));
  };

  const addRange = () => {
    setActiveSlots((prev) => [...prev, emptySlot(day)]);
  };

  const removeRange = (idx) => {
    const target = daySlots[idx];
    setActiveSlots((prev) => prev.filter((s) => s !== target));
  };

  const saveServices = async () => {
    setSavingServices(true);
    try {
      const payload = SERVICE_DEFS.map((d) => ({
        service_type: d.type,
        enabled: serviceDraft[d.type] ? 1 : 0,
      }));
      const res = await doctors.updateServices(payload);
      const rows = res.data || [];
      setServices(rows);
      toast.success(res.message || 'Services updated');
    } catch (e) {
      toast.error(e.message || 'Could not save services');
    } finally {
      setSavingServices(false);
    }
  };

  const saveSlots = async () => {
    setSavingSlots(true);
    try {
      if (activeClinicId) {
        await doctors.setClinicAvailability(activeClinicId, clinicSlots);
      } else {
        await doctors.setAvailability(generalSlots);
      }
      toast.success('Availability saved');
      if (activeClinicId) await loadClinicSlots(activeClinicId);
      else await loadGeneral();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingSlots(false);
    }
  };

  const toggleService = (type) => {
    setServiceDraft((d) => ({ ...d, [type]: !d[type] }));
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Availability & Services</h1>
        <p className="text-sm text-slate-600 mt-1">
          Choose which consultation types you offer (admin approves changes). Set weekly hours for online/home
          and separately for each clinic.
        </p>
      </div>

      {/* Services */}
      <section className="card !p-5 md:!p-6 max-w-4xl mb-6 space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <FaIcon icon="fa-briefcase-medical" className="text-primary-600" />
          Consultation services
        </h2>
        <p className="text-xs text-slate-500">
          All services are on by default. Turning a service off or on requires admin approval before patients
          see the change.
        </p>
        <div className="space-y-3">
          {SERVICE_DEFS.map((def) => {
            const row = services.find((s) => s.service_type === def.type);
            const st = serviceStatus(row);
            const on = Boolean(serviceDraft[def.type]);
            return (
              <div
                key={def.type}
                className="flex flex-wrap items-center gap-4 justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <FaIcon icon={def.icon} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{def.label}</p>
                    <p className="text-xs text-slate-500">{def.desc}</p>
                    <span
                      className={`inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        st.key === 'live'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.key === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : st.key === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleService(def.type)}
                  className={`relative w-14 h-8 rounded-full transition shrink-0 ${
                    on ? 'bg-primary-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition ${
                      on ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          disabled={savingServices}
          onClick={saveServices}
          className="btn-primary text-sm"
        >
          {savingServices ? 'Submitting…' : 'Save service preferences'}
        </button>
      </section>

      {/* Schedule tabs */}
      <section className="card !p-5 md:!p-6 max-w-4xl space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <FaIcon icon="fa-calendar-week" className="text-primary-600" />
          Weekly schedule
        </h2>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('online_home')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
              activeTab === 'online_home'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'
            }`}
          >
            <FaIcon icon="fa-video" className="mr-1.5" />
            Online & Home
          </button>
          {approvedClinics.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveTab(`clinic_${c.id}`)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition max-w-[200px] truncate ${
                activeTab === `clinic_${c.id}`
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
              }`}
              title={c.name}
            >
              <FaIcon icon="fa-hospital" className="mr-1.5" />
              {c.name}
            </button>
          ))}
        </div>

        {activeTab === 'online_home' ? (
          <p className="text-xs text-slate-500">
            These hours apply to <strong>online consultation</strong> and <strong>home visit</strong> bookings.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Clinic-only hours for{' '}
            <strong>{approvedClinics.find((c) => String(c.id) === activeClinicId)?.name}</strong>.
          </p>
        )}

        {approvedClinics.length === 0 && activeTab !== 'online_home' && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            No approved clinics yet.{' '}
            <Link to="/doctor/clinics" className="font-semibold underline">
              Add a clinic
            </Link>{' '}
            and wait for admin approval.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDay(d.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                day === d.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse h-28 bg-slate-200 rounded-2xl" />
        ) : (
          <DaySlotEditor
            day={day}
            daySlots={daySlots}
            onUpdate={updateSlot}
            onAdd={addRange}
            onRemove={removeRange}
          />
        )}

        <button
          type="button"
          disabled={savingSlots || (activeClinicId && !approvedClinics.length)}
          onClick={saveSlots}
          className="btn-primary"
        >
          {savingSlots ? 'Saving…' : 'Save schedule'}
        </button>
      </section>
    </DashboardLayout>
  );
}
