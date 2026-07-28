import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { booking, clinicPortal } from '../../services/api';

const emptySlot = (overrides = {}) => ({
  date: overrides.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  start_time: overrides.start_time || '10:00',
  end_time: overrides.end_time || '10:30',
});

/**
 * Clinic multi-day booking modal.
 * Packages = patient-assigned packages with remaining sessions (catalog appears as assignable context).
 */
export default function ClinicBookingModal({
  clinicId,
  open,
  onClose,
  onBooked,
  initialPatient,
  initialDate,
  initialDoctorId,
  initialStartTime,
  initialEndTime,
}) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotHints, setSlotHints] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({
    patient_key: '',
    doctor_id: '',
    consultation_type: 'clinic',
    package_assignment_id: '',
    assign_template_id: '',
    pain_type: '',
  });
  const [dates, setDates] = useState([emptySlot()]);

  useEffect(() => {
    if (!open || !clinicId) return;
    setLoading(true);
    Promise.all([
      clinicPortal.patients(clinicId, { limit: 250 }),
      clinicPortal.doctors(clinicId),
      clinicPortal.billingPackages(clinicId),
      clinicPortal.packageTemplates(clinicId).catch(() => ({ data: [] })),
    ])
      .then(([p, d, pk, tpl]) => {
        setPatients(p.data || p || []);
        setDoctors(d.data || d || []);
        setPackages(pk.data || pk || []);
        setTemplates(tpl.data || tpl || []);
      })
      .catch((error) => toast.error(error.message || 'Could not load booking options'))
      .finally(() => setLoading(false));
  }, [clinicId, open]);

  useEffect(() => {
    if (!open) return;
    setForm((old) => ({
      ...old,
      patient_key: initialPatient || old.patient_key,
      doctor_id: initialDoctorId ? String(initialDoctorId) : old.doctor_id,
    }));
    if (initialDate || initialStartTime || initialEndTime) {
      setDates([
        emptySlot({
          date: initialDate,
          start_time: initialStartTime,
          end_time: initialEndTime,
        }),
      ]);
    }
  }, [open, initialPatient, initialDate, initialDoctorId, initialStartTime, initialEndTime]);

  const selectedPatient = useMemo(
    () =>
      patients.find((p) => {
        const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
        return key === form.patient_key;
      }),
    [form.patient_key, patients]
  );

  const patientPackages = useMemo(() => {
    const active = packages.filter(
      (p) => !['terminated', 'expired', 'completed'].includes(String(p.status || '').toLowerCase())
    );
    if (!form.patient_key) return active;
    return active.filter(
      (p) => !p.patient_id || !selectedPatient?.patient_id || Number(p.patient_id) === Number(selectedPatient.patient_id)
    );
  }, [packages, form.patient_key, selectedPatient]);

  const activeTemplates = useMemo(
    () => templates.filter((t) => Number(t.is_active) !== 0),
    [templates]
  );

  // Load available slots when doctor + first date selected
  useEffect(() => {
    if (!open || !clinicId || !form.doctor_id || !dates[0]?.date) {
      setSlotHints([]);
      return undefined;
    }
    let cancelled = false;
    setSlotsLoading(true);
    booking
      .slotsForClinic(form.doctor_id, clinicId, dates[0].date)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.slots || res.data || res.slots || res || [];
        const list = Array.isArray(raw) ? raw : [];
        setSlotHints(
          list
            .map((s) => ({
              start: String(s.start_time || s.start || s.time || '').slice(0, 5),
              end: String(s.end_time || s.end || '').slice(0, 5),
              available: s.available !== false && s.is_available !== false && !s.booked,
            }))
            .filter((s) => s.start)
        );
      })
      .catch(() => {
        if (!cancelled) setSlotHints([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clinicId, form.doctor_id, dates[0]?.date]);

  const updateSlot = (index, key, value) =>
    setDates((old) => old.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot)));

  const applyHint = (hint) => {
    setDates((old) => {
      const next = [...old];
      next[0] = {
        ...next[0],
        start_time: hint.start,
        end_time: hint.end || next[0].end_time,
      };
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return toast.error('Select a patient');
    setSaving(true);
    try {
      let packageAssignmentId = form.package_assignment_id
        ? Number(form.package_assignment_id)
        : undefined;

      // Assign catalog template to patient first, then book against it
      if (!packageAssignmentId && form.assign_template_id) {
        const assigned = await clinicPortal.assignPackageTemplate(clinicId, {
          template_id: Number(form.assign_template_id),
          patient_id: selectedPatient.patient_id || undefined,
          clinic_patient_id: selectedPatient.clinic_patient_id || undefined,
          doctor_id: form.doctor_id ? Number(form.doctor_id) : undefined,
        });
        const pkg = assigned.data || assigned;
        packageAssignmentId = pkg?.id ? Number(pkg.id) : undefined;
        if (!packageAssignmentId) {
          throw new Error('Package assigned but id missing — book again selecting the package');
        }
        toast.success('Catalog package assigned to patient');
      }

      const payload = {
        doctor_id: Number(form.doctor_id),
        consultation_type: form.consultation_type,
        dates,
        pain_type: form.pain_type,
        patient_id: selectedPatient.patient_id || undefined,
        clinic_patient_id: selectedPatient.clinic_patient_id || undefined,
        package_assignment_id: packageAssignmentId,
      };
      await clinicPortal.createBooking(clinicId, payload);
      toast.success(`${dates.length} appointment${dates.length > 1 ? 's' : ''} booked`);
      onBooked?.();
      onClose();
      setDates([emptySlot()]);
      setForm((old) => ({ ...old, package_assignment_id: '', assign_template_id: '' }));
    } catch (error) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-slate-900">Book appointment</h2>
            <p className="text-xs text-slate-500">Walk-in or advance booking · packages with remaining sessions</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100">
            <FaIcon icon="fa-xmark" />
          </button>
        </header>
        {loading ? (
          <div className="h-72 m-5 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <form onSubmit={submit} className="p-4 sm:p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Patient
                <select
                  className="input-field mt-1"
                  required
                  value={form.patient_key}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      patient_key: e.target.value,
                      package_assignment_id: '',
                      assign_template_id: '',
                    })
                  }
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => {
                    const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
                    return (
                      <option key={key} value={key}>
                        {p.patient_name || [p.first_name, p.last_name].filter(Boolean).join(' ')} · {p.phone || ''}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Doctor
                <select
                  className="input-field mt-1"
                  required
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctor_id || d.id} value={d.doctor_id || d.id}>
                      {d.doctor_name || d.name || `${d.first_name || ''} ${d.last_name || ''}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Mode
                <select
                  className="input-field mt-1"
                  value={form.consultation_type}
                  onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                >
                  <option value="clinic">At clinic</option>
                  <option value="home_visit">Home visit</option>
                  <option value="online">Online</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Existing patient package
                <select
                  className="input-field mt-1"
                  value={form.package_assignment_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      package_assignment_id: e.target.value,
                      assign_template_id: e.target.value ? '' : form.assign_template_id,
                    })
                  }
                >
                  <option value="">Pay per session / none</option>
                  {patientPackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.package_name || p.name} (
                      {Math.max(0, Number(p.total_sessions || 0) - Number(p.completed_sessions || 0))} left)
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Or assign from catalog (then book)
                <select
                  className="input-field mt-1"
                  value={form.assign_template_id}
                  disabled={Boolean(form.package_assignment_id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assign_template_id: e.target.value,
                      package_assignment_id: e.target.value ? '' : form.package_assignment_id,
                    })
                  }
                >
                  <option value="">Don’t assign new package</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.total_sessions} sess · ₹{Number(t.price || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Active catalog packages appear here. Assigning creates a patient package, then books against it.
                </span>
              </label>
            </div>

            {activeTemplates.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-500">
                No active catalog packages yet.{' '}
                <a href="/clinic-portal/create-package" className="text-teal-700 font-semibold hover:underline">
                  Create package catalog →
                </a>
              </div>
            )}

            {activeTemplates.length > 0 && !form.assign_template_id && !form.package_assignment_id && (
              <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-2.5 text-xs text-slate-600">
                <p className="font-semibold text-teal-800 mb-1">Clinic package catalog</p>
                <ul className="flex flex-wrap gap-1.5">
                  {activeTemplates.slice(0, 8).map((t) => (
                    <li key={t.id} className="px-2 py-1 rounded-full bg-white border border-teal-100 text-teal-800 font-medium">
                      {t.name} · {t.total_sessions} sess · ₹{Number(t.price || 0).toLocaleString('en-IN')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="block text-sm font-medium text-slate-700">
              Pain / visit reason
              <input
                className="input-field mt-1"
                value={form.pain_type}
                onChange={(e) => setForm({ ...form, pain_type: e.target.value })}
                placeholder="e.g. lower back pain"
              />
            </label>

            <section>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-900">Appointment days</h3>
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-700"
                  onClick={() => setDates((old) => [...old, emptySlot({ date: old[0]?.date })])}
                >
                  <FaIcon icon="fa-plus" className="mr-1" />
                  Add day
                </button>
              </div>
              <div className="space-y-2">
                {dates.map((slot, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-xl bg-slate-50 p-3"
                  >
                    <input
                      aria-label="Date"
                      type="date"
                      className="input-field"
                      required
                      value={slot.date}
                      onChange={(e) => updateSlot(index, 'date', e.target.value)}
                    />
                    <input
                      aria-label="Start time"
                      type="time"
                      className="input-field"
                      required
                      value={slot.start_time}
                      onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                    />
                    <input
                      aria-label="End time"
                      type="time"
                      className="input-field"
                      required
                      value={slot.end_time}
                      onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={dates.length === 1}
                      onClick={() => setDates((old) => old.filter((_, i) => i !== index))}
                      className="w-10 h-10 text-rose-600 disabled:text-slate-300"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                ))}
              </div>

              {form.doctor_id && dates[0]?.date && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    Available slots {slotsLoading ? '(loading…)' : `for ${dates[0].date}`}
                  </p>
                  {slotHints.length === 0 && !slotsLoading ? (
                    <p className="text-xs text-slate-400">No open slots returned — enter times manually.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {slotHints
                        .filter((s) => s.available)
                        .slice(0, 24)
                        .map((s) => (
                          <button
                            key={`${s.start}-${s.end}`}
                            type="button"
                            onClick={() => applyHint(s)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                              dates[0].start_time === s.start
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                            }`}
                          >
                            {s.start}
                            {s.end ? `–${s.end}` : ''}
                          </button>
                        ))}
                      {slotHints.some((s) => !s.available) && (
                        <span className="text-[11px] text-slate-400 self-center ml-1">
                          · booked slots hidden
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" className="btn-outline w-full sm:w-auto" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                {saving ? 'Booking…' : 'Book appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
