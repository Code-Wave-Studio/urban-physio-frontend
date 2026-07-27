import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';

const emptySlot = () => ({
  date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  start_time: '10:00',
  end_time: '10:30',
});

export default function ClinicBookingModal({ clinicId, open, onClose, onBooked, initialPatient }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_key: '', doctor_id: '', consultation_type: 'clinic', package_assignment_id: '', pain_type: '' });
  const [dates, setDates] = useState([emptySlot()]);

  useEffect(() => {
    if (!open || !clinicId) return;
    setLoading(true);
    Promise.all([
      clinicPortal.patients(clinicId, { limit: 250 }),
      clinicPortal.doctors(clinicId),
      clinicPortal.billingPackages(clinicId),
    ]).then(([p, d, pk]) => {
      setPatients(p.data || p || []);
      setDoctors(d.data || d || []);
      setPackages(pk.data || pk || []);
    }).catch((error) => toast.error(error.message || 'Could not load booking options'))
      .finally(() => setLoading(false));
  }, [clinicId, open]);

  useEffect(() => {
    if (initialPatient) setForm((old) => ({ ...old, patient_key: initialPatient }));
  }, [initialPatient]);

  const selectedPatient = useMemo(() => patients.find((p) => {
    const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
    return key === form.patient_key;
  }), [form.patient_key, patients]);

  const updateSlot = (index, key, value) => setDates((old) => old.map((slot, i) => i === index ? { ...slot, [key]: value } : slot));

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return toast.error('Select a patient');
    setSaving(true);
    try {
      const payload = {
        doctor_id: Number(form.doctor_id),
        consultation_type: form.consultation_type,
        dates,
        pain_type: form.pain_type,
        patient_id: selectedPatient.patient_id || undefined,
        clinic_patient_id: selectedPatient.clinic_patient_id || undefined,
        package_assignment_id: form.package_assignment_id ? Number(form.package_assignment_id) : undefined,
      };
      await clinicPortal.createBooking(clinicId, payload);
      toast.success(`${dates.length} appointment${dates.length > 1 ? 's' : ''} booked`);
      onBooked?.();
      onClose();
      setDates([emptySlot()]);
    } catch (error) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div><h2 className="font-bold text-slate-900">Book appointment</h2><p className="text-xs text-slate-500">Add one or multiple treatment days</p></div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100"><FaIcon icon="fa-xmark" /></button>
        </header>
        {loading ? <div className="h-72 m-5 bg-slate-100 rounded-xl animate-pulse" /> : (
          <form onSubmit={submit} className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">Patient
                <select className="input-field mt-1" required value={form.patient_key} onChange={(e) => setForm({ ...form, patient_key: e.target.value })}>
                  <option value="">Select patient</option>
                  {patients.map((p) => {
                    const key = p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
                    return <option key={key} value={key}>{p.patient_name || [p.first_name, p.last_name].filter(Boolean).join(' ')} · {p.phone || ''}</option>;
                  })}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Doctor
                <select className="input-field mt-1" required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Select doctor</option>
                  {doctors.map((d) => <option key={d.doctor_id || d.id} value={d.doctor_id || d.id}>{d.doctor_name || d.name || `${d.first_name || ''} ${d.last_name || ''}`}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Mode
                <select className="input-field mt-1" value={form.consultation_type} onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}>
                  <option value="clinic">At clinic</option><option value="home_visit">Home visit</option><option value="online">Online</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Package (optional)
                <select className="input-field mt-1" value={form.package_assignment_id} onChange={(e) => setForm({ ...form, package_assignment_id: e.target.value })}>
                  <option value="">Pay per session</option>
                  {packages.filter((p) => !form.patient_key || !p.patient_id || p.patient_id === selectedPatient?.patient_id).map((p) => <option key={p.id} value={p.id}>{p.package_name || p.name} ({Math.max(0, Number(p.total_sessions || 0) - Number(p.completed_sessions || 0))} left)</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">Pain / visit reason
              <input className="input-field mt-1" value={form.pain_type} onChange={(e) => setForm({ ...form, pain_type: e.target.value })} placeholder="e.g. lower back pain" />
            </label>
            <section>
              <div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-slate-900">Appointment days</h3><button type="button" className="text-xs font-semibold text-teal-700" onClick={() => setDates((old) => [...old, emptySlot()])}><FaIcon icon="fa-plus" className="mr-1" />Add day</button></div>
              <div className="space-y-2">
                {dates.map((slot, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-xl bg-slate-50 p-3">
                    <input aria-label="Date" type="date" className="input-field" required value={slot.date} onChange={(e) => updateSlot(index, 'date', e.target.value)} />
                    <input aria-label="Start time" type="time" className="input-field" required value={slot.start_time} onChange={(e) => updateSlot(index, 'start_time', e.target.value)} />
                    <input aria-label="End time" type="time" className="input-field" required value={slot.end_time} onChange={(e) => updateSlot(index, 'end_time', e.target.value)} />
                    <button type="button" disabled={dates.length === 1} onClick={() => setDates((old) => old.filter((_, i) => i !== index))} className="w-10 h-10 text-rose-600 disabled:text-slate-300"><FaIcon icon="fa-trash" /></button>
                  </div>
                ))}
              </div>
            </section>
            <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Booking…' : 'Book appointment'}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
