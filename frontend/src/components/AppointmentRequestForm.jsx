import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import { appointmentRequests, doctors } from '../services/api';

const REQUEST_TYPES = [
  { value: 'reschedule', label: 'Reschedule', icon: 'fa-calendar-days' },
  { value: 'cancel', label: 'Cancel appointment', icon: 'fa-ban' },
  { value: 'doctor_change', label: 'Change doctor', icon: 'fa-user-doctor' },
];

export default function AppointmentRequestForm({ appointment, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('reschedule');
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [requestedDoctorId, setRequestedDoctorId] = useState('');
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDoctors = async () => {
    if (doctorOptions.length) return;
    try {
      const res = await doctors.list({ limit: 50 });
      setDoctorOptions(res?.data ?? res ?? []);
    } catch {
      setDoctorOptions([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await appointmentRequests.create({
        appointment_id: appointment.id,
        request_type: type,
        reason,
        requested_date: type === 'reschedule' ? requestedDate : undefined,
        requested_start_time: type === 'reschedule' ? requestedTime : undefined,
        requested_doctor_id: type === 'doctor_change' ? Number(requestedDoctorId) : undefined,
      });
      toast.success('Request submitted — pending review');
      setOpen(false);
      setReason('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      {!open ? (
        <button type="button" className="btn-outline text-sm w-full sm:w-auto" onClick={() => setOpen(true)}>
          <FaIcon icon="fa-pen-to-square" className="mr-1.5" />
          Request change / cancel
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">Submit a request</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {REQUEST_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value);
                  if (t.value === 'doctor_change') loadDoctors();
                }}
                className={`p-3 rounded-xl text-left text-xs font-semibold border transition ${
                  type === t.value
                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <FaIcon icon={t.icon} className="mb-1 block" />
                {t.label}
              </button>
            ))}
          </div>
          {type === 'reschedule' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600">New date</label>
                <input
                  type="date"
                  className="input-field mt-1"
                  value={requestedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Preferred time</label>
                <input
                  type="time"
                  className="input-field mt-1"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          {type === 'doctor_change' && (
            <div>
              <label className="text-xs text-slate-600">Preferred doctor</label>
              <select
                className="input-field mt-1"
                value={requestedDoctorId}
                onChange={(e) => setRequestedDoctorId(e.target.value)}
                required
              >
                <option value="">Select doctor</option>
                {doctorOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-600">Reason</label>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Brief reason for this request"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'Submitting…' : 'Submit request'}
            </button>
            <button type="button" className="btn-outline text-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
