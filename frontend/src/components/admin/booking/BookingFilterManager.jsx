import { useEffect, useMemo, useState } from 'react';
import FaIcon from '../../FaIcon';
import toast from 'react-hot-toast';

export default function BookingFilterManager({
  title,
  subtitle,
  icon,
  mode = 'sort',
  load,
  create,
  update,
  remove,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [draft, setDraft] = useState({ slug: '', label: '', icon: 'fa-star', match_patterns: '', sort_order: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await load();
      setRows(res?.data ?? res ?? []);
    } catch (e) {
      toast.error(e.message || 'Could not load filters');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || String(a.label).localeCompare(String(b.label))),
    [rows],
  );

  const patch = (id, fields) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));

  const saveRow = async (r) => {
    setSavingId(r.id);
    try {
      const payload = {
        slug: r.slug,
        label: r.label,
        sort_order: Number(r.sort_order || 0),
        is_active: !!r.is_active,
      };
      if (mode === 'sort') payload.icon = r.icon || 'fa-star';
      else {
        const raw = Array.isArray(r.match_patterns) ? r.match_patterns.join(', ') : String(r.match_patterns || '');
        payload.match_patterns = raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
      await update(r.id, payload);
      toast.success('Saved');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const addRow = async () => {
    if (!draft.slug.trim() || !draft.label.trim()) {
      toast.error('Slug and label required');
      return;
    }
    setSavingId('new');
    try {
      const payload = {
        slug: draft.slug.trim(),
        label: draft.label.trim(),
        sort_order: Number(draft.sort_order || 0),
        is_active: 1,
      };
      if (mode === 'sort') payload.icon = draft.icon || 'fa-star';
      else {
        payload.match_patterns = draft.match_patterns.split(',').map((s) => s.trim()).filter(Boolean);
      }
      await create(payload);
      toast.success('Added');
      setDraft({ slug: '', label: '', icon: 'fa-star', match_patterns: '', sort_order: '' });
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Add failed');
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm('Delete this filter?')) return;
    setSavingId(id);
    try {
      await remove(id);
      toast.success('Deleted');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="glass-card !p-6 md:!p-8 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FaIcon icon={icon} className="text-primary-600" />
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>

      <div className={`grid gap-2 ${mode === 'sort' ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <input className="input-field" placeholder="slug (e.g. rating)" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
        <input className="input-field" placeholder="Label" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
        {mode === 'sort' ? (
          <input className="input-field" placeholder="Icon (fa-star)" value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} />
        ) : (
          <input className="input-field lg:col-span-2" placeholder="Keywords: ortho, bone, joint" value={draft.match_patterns} onChange={(e) => setDraft((d) => ({ ...d, match_patterns: e.target.value }))} />
        )}
        <input className="input-field" placeholder="Sort" value={draft.sort_order} onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))} />
        <button type="button" onClick={addRow} className="btn-primary" disabled={savingId === 'new'}>
          Add
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse bg-white/40 rounded-2xl" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-600">No filters yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/50 border border-white/70 p-3 space-y-2">
              <div className={`grid gap-2 ${mode === 'sort' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                <input className="input-field" value={r.slug || ''} onChange={(e) => patch(r.id, { slug: e.target.value })} placeholder="slug" />
                <input className="input-field" value={r.label || ''} onChange={(e) => patch(r.id, { label: e.target.value })} placeholder="label" />
                {mode === 'sort' ? (
                  <input className="input-field" value={r.icon || ''} onChange={(e) => patch(r.id, { icon: e.target.value })} placeholder="icon" />
                ) : (
                  <input
                    className="input-field"
                    value={Array.isArray(r.match_patterns) ? r.match_patterns.join(', ') : String(r.match_patterns || '')}
                    onChange={(e) => patch(r.id, { match_patterns: e.target.value })}
                    placeholder="keywords"
                  />
                )}
                <input className="input-field" value={String(r.sort_order ?? '')} onChange={(e) => patch(r.id, { sort_order: e.target.value })} placeholder="sort" />
                <label className="inline-flex items-center gap-2 text-sm px-2">
                  <input type="checkbox" checked={!!r.is_active} onChange={(e) => patch(r.id, { is_active: e.target.checked ? 1 : 0 })} />
                  Active
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-outline !px-4" disabled={savingId === r.id} onClick={() => saveRow(r)}>
                  Save
                </button>
                <button type="button" className="btn-danger !px-4" disabled={savingId === r.id || r.slug === 'all' || r.slug === 'recommended'} onClick={() => deleteRow(r.id)}>
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
