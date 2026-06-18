import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { customSlots } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  slot_date: '',
  start_time: '10:00',
  end_time: '12:00',
  slot_type: 'available',
  slot_duration_minutes: 30,
  label: '',
  notes: '',
  clinic_id: '',
});

export default function DoctorCustomSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customSlots.list({
        from: new Date().toISOString().slice(0, 10),
        to: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      });
      setSlots(res?.data ?? res ?? []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customSlots.create({
        ...form,
        clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
      });
      toast.success('Custom slot saved');
      setForm(emptyForm());
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this custom slot?')) return;
    try {
      await customSlots.remove(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout title="Custom Slots" navItems={DOCTOR_NAV}>
      <div className="max-w-4xl space-y-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <FaIcon icon="fa-calendar-plus" className="text-primary-600" />
            Advanced slot management
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Add extra availability or block time on specific dates. Works alongside your weekly schedule.
          </p>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Date</label>
              <input
                type="date"
                className="input-field mt-1"
                value={form.slot_date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, slot_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Type</label>
              <select
                className="input-field mt-1"
                value={form.slot_type}
                onChange={(e) => setForm({ ...form, slot_type: e.target.value })}
              >
                <option value="available">Extra availability</option>
                <option value="blocked">Block time off</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Start</label>
              <input
                type="time"
                className="input-field mt-1"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">End</label>
              <input
                type="time"
                className="input-field mt-1"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
            {form.slot_type === 'available' && (
              <div>
                <label className="text-xs font-medium text-slate-600">Slot duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  className="input-field mt-1"
                  value={form.slot_duration_minutes}
                  onChange={(e) => setForm({ ...form, slot_duration_minutes: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600">Label (optional)</label>
              <input
                className="input-field mt-1"
                placeholder="e.g. Extended hours"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Add custom slot'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-800 mb-4">Upcoming custom slots</h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : slots.length === 0 ? (
            <p className="text-slate-500 text-sm">No custom slots yet.</p>
          ) : (
            <div className="space-y-3">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {s.slot_date}{' '}
                      <span className="text-slate-500 font-normal">
                        {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                      </span>
                    </p>
                    <p className="text-sm mt-0.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.slot_type === 'blocked'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {s.slot_type === 'blocked' ? 'Blocked' : 'Extra slots'}
                      </span>
                      {s.label && <span className="ml-2 text-slate-600">{s.label}</span>}
                    </p>
                  </div>
                  <button type="button" className="text-red-600 text-sm font-medium" onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
