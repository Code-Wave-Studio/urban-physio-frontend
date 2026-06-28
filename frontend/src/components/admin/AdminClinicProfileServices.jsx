import { useCallback, useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  name: '',
  price: '',
  short_description: '',
  is_active: 1,
});

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function ServiceForm({ form, set, onSubmit, onCancel, saving, submitLabel }) {
  const words = wordCount(form.short_description || '');
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Service name</label>
        <input
          className="input-field"
          placeholder="e.g. Cupping Therapy, Dry Needling"
          value={form.name}
          onChange={(e) => set({ ...form, name: e.target.value })}
          required
          maxLength={120}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
        <input
          type="number"
          min={0}
          step={50}
          className="input-field"
          placeholder="0 for on request"
          value={form.price}
          onChange={(e) => set({ ...form, price: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Short description <span className="text-slate-400 font-normal">(max 50 words)</span>
        </label>
        <textarea
          className="input-field"
          rows={3}
          placeholder="Briefly describe what this service includes…"
          value={form.short_description}
          onChange={(e) => set({ ...form, short_description: e.target.value })}
        />
        <p className={`text-xs mt-1 ${words > 50 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
          {words}/50 words
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={!!form.is_active}
          onChange={(e) => set({ ...form, is_active: e.target.checked ? 1 : 0 })}
        />
        Visible on public profile
      </label>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={onSubmit} disabled={saving || words > 50} className="btn-primary text-sm">
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-outline text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminClinicProfileServices({ clinicId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await admin.clinicProfileServices(clinicId);
      setServices(res?.data || []);
    } catch (e) {
      toast.error(e.message || 'Could not load treatment services');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setShowAdd(false);
    setForm({
      name: service.name || '',
      price: service.price ?? '',
      short_description: service.short_description || '',
      is_active: service.is_active ? 1 : 0,
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (wordCount(form.short_description) > 50) {
      toast.error('Description must be 50 words or fewer');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        short_description: form.short_description.trim(),
        is_active: form.is_active ? 1 : 0,
      };
      if (editingId) {
        await admin.updateClinicProfileService(clinicId, editingId, payload);
      } else {
        await admin.createClinicProfileService(clinicId, payload);
      }
      toast.success(editingId ? 'Service updated' : 'Service added');
      resetForm();
      await load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this service from the clinic profile?')) return;
    try {
      await admin.deleteClinicProfileService(clinicId, id);
      toast.success('Service removed');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Treatment cards shown on the public clinic profile (name, price, description). This is separate from the comma-separated service tags below.
      </p>

      {!showAdd && !editingId && (
        <button
          type="button"
          onClick={() => { setShowAdd(true); setForm(emptyForm()); }}
          className="btn-primary text-sm inline-flex items-center gap-2"
        >
          <FaIcon icon="fa-plus" />
          Add treatment service
        </button>
      )}

      {(showAdd || editingId) && (
        <ServiceForm
          form={form}
          set={setForm}
          onSubmit={handleSave}
          onCancel={resetForm}
          saving={saving}
          submitLabel={editingId ? 'Update service' : 'Add service'}
        />
      )}

      {loading ? (
        <div className="animate-pulse h-16 bg-slate-100 rounded-xl" />
      ) : services.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">No treatment services yet.</p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  {!service.is_active && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">Hidden</span>
                  )}
                </div>
                {service.short_description && (
                  <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{service.short_description}</p>
                )}
                <p className="text-sm font-bold text-primary-700 mt-1">
                  {Number(service.price) > 0 ? `₹${Number(service.price).toLocaleString('en-IN')}` : 'On request'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEdit(service)} className="btn-outline text-xs !py-2 !px-3">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service.id)}
                  className="btn-outline text-xs !py-2 !px-3 text-red-600 border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
