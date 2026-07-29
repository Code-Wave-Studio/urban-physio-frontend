import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { calendar } from '../../services/api';

/**
 * CapacitySettingsPanel
 * Admin panel for configuring slot capacity for the clinic.
 * Renders inline inside the Availability Settings page.
 */
export default function CapacitySettingsPanel({ clinicId }) {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [form,     setForm]     = useState({
    default_slot_capacity: 1,
    capacity_enabled: false,
    auto_close_slot: true,
    allow_waitlist: false,
    max_daily_capacity: '',
  });

  useEffect(() => {
    if (!clinicId) return;
    setLoading(true);
    calendar.capacitySettings({ clinic_id: clinicId })
      .then((r) => {
        const s = r.data;
        setSettings(s);
        setForm({
          default_slot_capacity: s.default_slot_capacity ?? 1,
          capacity_enabled:      !!s.capacity_enabled,
          auto_close_slot:       !!s.auto_close_slot,
          allow_waitlist:        !!s.allow_waitlist,
          max_daily_capacity:    s.max_daily_capacity ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicId]);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await calendar.saveCapacitySettings({
        ...form,
        clinic_id: clinicId,
        max_daily_capacity: form.max_daily_capacity !== '' ? Number(form.max_daily_capacity) : null,
      });
      toast.success('Capacity settings saved');
      setDirty(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />;
  }

  return (
    <div className="glass-card space-y-5">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
          <FaIcon icon="fa-sliders" />
        </span>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Slot Capacity Management</h3>
          <p className="text-xs text-slate-500">Control how many appointments are allowed per time slot</p>
        </div>
      </div>

      {/* Enable Capacity */}
      <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
        <div>
          <p className="text-sm font-semibold text-slate-800">Enable Capacity Limit</p>
          <p className="text-xs text-slate-500 mt-0.5">Enforce maximum appointments per slot</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.capacity_enabled}
          onClick={() => update('capacity_enabled', !form.capacity_enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${
            form.capacity_enabled ? 'bg-teal-600' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            form.capacity_enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </label>

      <div className={`space-y-4 transition-opacity ${form.capacity_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {/* Default Capacity */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Maximum Appointments Per Slot
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
              onClick={() => update('default_slot_capacity', Math.max(1, form.default_slot_capacity - 1))}
            >
              <FaIcon icon="fa-minus" />
            </button>
            <input
              type="number"
              min="1"
              max="999"
              value={form.default_slot_capacity}
              onChange={(e) => update('default_slot_capacity', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 rounded-lg border border-slate-200 text-center py-2 text-sm font-bold focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
              onClick={() => update('default_slot_capacity', form.default_slot_capacity + 1)}
            >
              <FaIcon icon="fa-plus" />
            </button>
            <span className="text-xs text-slate-500">appointments per slot</span>
          </div>
        </div>

        {/* Max Daily Capacity */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Maximum Daily Capacity <span className="font-normal text-slate-400">(optional, leave blank for unlimited)</span>
          </label>
          <input
            type="number"
            min="1"
            value={form.max_daily_capacity}
            onChange={(e) => update('max_daily_capacity', e.target.value)}
            placeholder="e.g. 40"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
          />
        </div>

        {/* Auto Close */}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-slate-800">Auto Close Slot When Full</p>
            <p className="text-xs text-slate-500 mt-0.5">Automatically block slot when capacity is reached</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.auto_close_slot}
            onClick={() => update('auto_close_slot', !form.auto_close_slot)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              form.auto_close_slot ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.auto_close_slot ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>

        {/* Allow Waitlist */}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-slate-800">Allow Waiting List</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="bg-sky-100 text-sky-700 text-[10px] font-bold rounded px-1">FUTURE</span>
              Patients can join a waitlist when slot is full
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.allow_waitlist}
            onClick={() => update('allow_waitlist', !form.allow_waitlist)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              form.allow_waitlist ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.allow_waitlist ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {settings ? 'Last updated · ' + (settings.updated_at ? new Date(settings.updated_at).toLocaleDateString() : 'N/A') : ''}
        </p>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> Saving…</>
          ) : (
            <><FaIcon icon="fa-floppy-disk" className="mr-1.5" /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}
