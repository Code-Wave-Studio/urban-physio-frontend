import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const DAY_PRESETS = [7, 10, 15, 20, 30];

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
          <p className="text-slate-600 text-sm mt-1">Create custom-day rehab programs (7, 10, 15, 20 days or any duration)</p>
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
        <GlassModal open={modalOpen} onClose={() => !saving && setModalOpen(false)} size="lg" titleId="pkg-form" preventClose={saving}>
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <GlassModalHeader
              titleId="pkg-form"
              title={editingId ? 'Edit package' : 'New treatment package'}
              subtitle="Set any duration from 1–365 days and matching session count"
              icon="fa-box-open"
              accent="primary"
              onClose={() => !saving && setModalOpen(false)}
              disabledClose={saving}
            />
            <GlassModalBody className="space-y-4">
              <input className="input-field" placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input-field" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (days)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DAY_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, duration_days: d, total_sessions: d }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                        Number(form.duration_days) === d
                          ? 'border-primary-500 bg-primary-50 text-primary-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="Custom days e.g. 7"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  required
                />
              </div>
              <input className="input-field" type="number" min={1} placeholder="Total sessions" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} />
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
                Active on website
              </label>
            </GlassModalBody>
            <GlassModalFooter>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline" disabled={saving}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary ml-auto">{saving ? 'Saving…' : 'Save package'}</button>
            </GlassModalFooter>
          </form>
        </GlassModal>
      )}
    </AdminDashboardLayout>
  );
}
