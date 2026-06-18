import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '',
  slug: '',
  duration_days: 10,
  total_sessions: 10,
  short_description: '',
  description: '',
  includes: '',
  price: '',
  consultation_type: 'any',
  is_active: 1,
  sort_order: 0,
};

export default function AdminTreatmentPackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    admin
      .treatmentPackagesList(params)
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setModalOpen(true);
    setEditingId(id);
    try {
      const res = await admin.treatmentPackageGet(id);
      const p = res.data;
      setForm({
        name: p.name || '',
        slug: p.slug || '',
        duration_days: p.duration_days || 10,
        total_sessions: p.total_sessions || 10,
        short_description: p.short_description || '',
        description: p.description || '',
        includes: p.includes || '',
        price: p.price ?? '',
        consultation_type: p.consultation_type || 'any',
        is_active: p.is_active ? 1 : 0,
        sort_order: p.sort_order ?? 0,
      });
    } catch (err) {
      toast.error(err.message);
      setModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      duration_days: parseInt(form.duration_days, 10),
      total_sessions: parseInt(form.total_sessions, 10),
      price: parseFloat(form.price) || 0,
      is_active: form.is_active ? 1 : 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    try {
      if (editingId) {
        await admin.treatmentPackageUpdate(editingId, payload);
        toast.success('Package updated');
      } else {
        await admin.treatmentPackageCreate(payload);
        toast.success('Package created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this package?')) return;
    try {
      await admin.treatmentPackageDelete(id);
      toast.success('Package deactivated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Treatment Packages</h1>
          <p className="text-slate-600 text-sm mt-1">Manage 10 / 15 / 30 day programs</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" /> Add package
        </button>
      </div>

      <div className="glass-card p-4 mb-6">
        <input
          className="input-field"
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-3">Name</th>
                <th className="p-3">Days</th>
                <th className="p-3">Sessions</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3">{p.duration_days}</td>
                  <td className="p-3">{p.total_sessions}</td>
                  <td className="p-3">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => openEdit(p.id)} className="text-primary-600 font-semibold mr-3">
                      Edit
                    </button>
                    {p.is_active ? (
                      <button type="button" onClick={() => deactivate(p.id)} className="text-red-600 font-semibold">
                        Deactivate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit package' : 'New package'}</h2>
            <div className="space-y-3">
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input-field" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input-field" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}>
                  <option value={10}>10 days</option>
                  <option value={15}>15 days</option>
                  <option value={30}>30 days</option>
                </select>
                <input className="input-field" type="number" placeholder="Sessions" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} />
              </div>
              <input className="input-field" type="number" step="0.01" placeholder="Price (INR)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input className="input-field" placeholder="Short description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              <textarea className="input-field min-h-[80px]" placeholder="Full description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="input-field" value={form.consultation_type} onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}>
                <option value="any">Any mode</option>
                <option value="online">Online</option>
                <option value="clinic">Clinic</option>
                <option value="home_visit">Home visit</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
                Active
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
