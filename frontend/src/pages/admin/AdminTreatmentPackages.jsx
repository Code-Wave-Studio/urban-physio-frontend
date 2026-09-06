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
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Platform packages</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage all treatment packages shown on the website packages page and offered to doctors for pricing.
          </p>
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
      ) : list.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <FaIcon icon="fa-box-open" className="text-3xl text-slate-300 mb-3" />
          <p className="font-semibold text-slate-800">No platform packages yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Packages shown on the public <strong>/packages</strong> page appear here. Add one below or run the database migration if you see a server error.
          </p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" /> Add first package
          </button>
        </div>
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
            <GlassModalBody className="space-y-3.5">

              {/* Section: Package Identity */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <FaIcon icon="fa-tag" className="text-primary-500" />
                    Package Info
                  </span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Package Name <span className="text-rose-500">*</span></label>
                    <input className="input-field !text-sm" placeholder="e.g. 10-Day Recovery Package" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">URL Slug <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                    <input className="input-field !text-sm" placeholder="e.g. 10-day-recovery" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section: Duration & Sessions */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <FaIcon icon="fa-calendar-days" className="text-sky-500" />
                    Duration & Sessions
                  </span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quick Duration Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {DAY_PRESETS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, duration_days: d, total_sessions: d }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            Number(form.duration_days) === d
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                          }`}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Duration (days)</label>
                      <input
                        className="input-field !text-sm"
                        type="number"
                        min={1}
                        max={365}
                        placeholder="Custom days"
                        value={form.duration_days}
                        onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Sessions</label>
                      <input className="input-field !text-sm" type="number" min={1} placeholder="Sessions" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Pricing */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <FaIcon icon="fa-indian-rupee-sign" className="text-emerald-500" />
                    Pricing
                  </span>
                </div>
                <div className="px-4 py-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Price (INR)</label>
                  <input className="input-field !text-sm" type="number" step="0.01" placeholder="e.g. 4999.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>

              {/* Section: Description */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <FaIcon icon="fa-align-left" className="text-violet-500" />
                    Description
                  </span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Short Description</label>
                    <input className="input-field !text-sm" placeholder="One-liner summary" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Description</label>
                    <textarea className="input-field !text-sm min-h-[70px] resize-none" placeholder="Detailed package description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section: Settings */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <FaIcon icon="fa-sliders" className="text-slate-400" />
                    Settings
                  </span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Consultation Mode</label>
                    <select className="input-field !text-sm" value={form.consultation_type} onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}>
                      <option value="any">Any mode</option>
                      <option value="online">Online</option>
                      <option value="clinic">Clinic</option>
                      <option value="home_visit">Home visit</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition text-sm">
                    <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-primary-600 border-slate-300 focus:ring-primary-500" />
                    <span className="font-semibold text-slate-700 text-xs">Active on website</span>
                  </label>
                </div>
              </div>

            </GlassModalBody>
            <GlassModalFooter>
              <button type="button" onClick={() => setModalOpen(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer" disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer ml-auto"
              >
                <FaIcon icon={saving ? 'fa-spinner' : 'fa-floppy-disk'} className={saving ? 'fa-spin text-[10px]' : 'text-[10px]'} />
                {saving ? 'Saving…' : 'Save package'}
              </button>
            </GlassModalFooter>
          </form>
        </GlassModal>
      )}
    </AdminDashboardLayout>
  );
}
