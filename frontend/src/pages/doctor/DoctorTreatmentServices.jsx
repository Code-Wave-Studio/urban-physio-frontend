import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { profileServices } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
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
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Service name</label>
        <input
          className="input-field"
          placeholder="e.g. Dry Needling, Cupping Therapy"
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
        <button type="submit" disabled={saving || words > 50} className="btn-primary text-sm">
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

/** Doctor-owned treatment services only. Clinic profile services live in the Clinic Portal. */
export default function DoctorTreatmentServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profileServices.listDoctor();
      setServices(res?.data || []);
    } catch {
      toast.error('Could not load services');
    } finally {
      setLoading(false);
    }
  }, []);

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
    e.preventDefault();
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
        await profileServices.updateDoctor(editingId, payload);
      } else {
        await profileServices.createDoctor(payload);
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
    if (!window.confirm('Remove this service?')) return;
    try {
      await profileServices.deleteDoctor(id);
      toast.success('Service removed');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const examples = ['Dry Needling', 'Cupping Therapy', 'Sports Rehab', 'Neuro Physiotherapy'];

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services & treatments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal treatment services. Clinic profile services are managed by the clinic owner
            in the Clinic Portal.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1">Examples</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <span key={ex} className="text-xs px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200">
                {ex}
              </span>
            ))}
          </div>
        </div>

        {!showAdd && !editingId && (
          <button type="button" onClick={() => { setShowAdd(true); setForm(emptyForm()); }} className="btn-primary text-sm inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" />
            Add service
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
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card text-center py-12 px-6 text-slate-500 text-sm">
            No services yet. Add your first treatment service above.
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    {!service.is_active && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">Hidden</span>
                    )}
                  </div>
                  {service.short_description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{service.short_description}</p>
                  )}
                  <p className="text-sm font-bold text-primary-700 mt-2">
                    {Number(service.price) > 0 ? `₹${Number(service.price).toLocaleString('en-IN')}` : 'On request'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(service)} className="btn-outline text-xs !py-2 !px-3">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(service.id)} className="btn-outline text-xs !py-2 !px-3 text-red-600 border-red-200">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
