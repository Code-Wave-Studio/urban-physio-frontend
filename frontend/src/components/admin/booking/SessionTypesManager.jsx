import { useEffect, useMemo, useState } from 'react';
import FaIcon from '../../FaIcon';
import { admin } from '../../../services/api';
import toast from 'react-hot-toast';

const empty = () => ({
  name: '',
  slug: '',
  duration_minutes: 30,
  base_price: 0,
  sort_order: 0,
  is_active: 1,
});

export default function SessionTypesManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const res = await admin.sessionTypesList();
      setList(res?.data ?? res ?? []);
    } catch (e) {
      toast.error(e.message || 'Could not load session types');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...(list || [])].sort((a, b) => {
      const ao = Number(a.sort_order ?? 0);
      const bo = Number(b.sort_order ?? 0);
      if (ao !== bo) return ao - bo;
      return Number(a.id) - Number(b.id);
    });
  }, [list]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await admin.createSessionType({
        ...form,
        duration_minutes: Number(form.duration_minutes) || 30,
        base_price: Number(form.base_price) || 0,
        sort_order: Number(form.sort_order) || 0,
        is_active: !!form.is_active,
      });
      toast.success('Session type added');
      setForm(empty());
      await load();
    } catch (e) {
      toast.error(e.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const patchRow = (id, fields) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  };

  const saveRow = async (r) => {
    setSaving(true);
    try {
      await admin.updateSessionType(r.id, {
        name: r.name,
        slug: r.slug,
        duration_minutes: Number(r.duration_minutes) || 30,
        base_price: Number(r.base_price) || 0,
        sort_order: Number(r.sort_order) || 0,
        is_active: !!r.is_active,
      });
      toast.success('Saved');
      await load();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm('Delete (or deactivate) this session type?')) return;
    setSaving(true);
    try {
      await admin.deleteSessionType(id);
      toast.success('Updated');
      await load();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card !p-6 md:!p-8 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FaIcon icon="fa-clock" className="text-primary-600" />
          Session types
        </h2>
        <p className="text-sm text-slate-600 mt-1">Control duration options shown in booking.</p>
      </div>

      <div className="rounded-2xl bg-white/45 border border-white/70 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-800">Add new</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className="input-field" placeholder="Slug (optional)" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          <input type="number" className="input-field" placeholder="Duration minutes" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} />
          <input type="number" className="input-field" placeholder="Base price (optional)" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} />
          <input type="number" className="input-field" placeholder="Sort" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked ? 1 : 0)} />
            Active
          </label>
        </div>
        <button type="button" className="btn-primary" onClick={create} disabled={saving}>
          Add session type
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse bg-white/40 rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {sorted.length === 0 && <p className="text-sm text-slate-500 px-1 py-3">No session types yet.</p>}
          {sorted.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/50 border border-white/70 p-3">
              <div className="grid md:grid-cols-[1fr_1fr_10rem_10rem_8rem_auto] gap-2 items-center">
                <input className="input-field" value={r.name || ''} onChange={(e) => patchRow(r.id, { name: e.target.value })} />
                <input className="input-field" value={r.slug || ''} onChange={(e) => patchRow(r.id, { slug: e.target.value })} />
                <input className="input-field" value={String(r.duration_minutes ?? '')} onChange={(e) => patchRow(r.id, { duration_minutes: e.target.value })} />
                <input className="input-field" value={String(r.base_price ?? '')} onChange={(e) => patchRow(r.id, { base_price: e.target.value })} />
                <div className="flex items-center gap-3">
                  <input className="input-field" value={String(r.sort_order ?? 0)} onChange={(e) => patchRow(r.id, { sort_order: e.target.value })} />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!r.is_active} onChange={(e) => patchRow(r.id, { is_active: e.target.checked ? 1 : 0 })} />
                    Active
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-outline !px-4" onClick={() => saveRow(r)} disabled={saving}>
                    Save
                  </button>
                  <button type="button" className="btn-danger !px-4" onClick={() => deleteRow(r.id)} disabled={saving}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
