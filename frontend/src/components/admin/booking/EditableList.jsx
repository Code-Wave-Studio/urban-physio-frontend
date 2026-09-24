import { useEffect, useMemo, useState } from 'react';
import FaIcon from '../../FaIcon';
import toast from 'react-hot-toast';

/** Editable list for {id, label, sort_order, is_active} via load/create/update/remove. */
export default function EditableList({ title, subtitle = '', icon = 'fa-list', load, create, update, remove }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [newSort, setNewSort] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await load();
      setRows(res?.data ?? res ?? []);
    } catch (e) {
      toast.error(e.message || 'Could not load list');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    return [...(rows || [])].sort((a, b) => {
      const ao = Number(a.sort_order ?? 0);
      const bo = Number(b.sort_order ?? 0);
      if (ao !== bo) return ao - bo;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
  }, [rows]);

  const patchRow = (id, fields) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  };

  const saveRow = async (r) => {
    setSavingId(r.id);
    try {
      await update(r.id, {
        label: r.label,
        sort_order: Number(r.sort_order || 0),
        is_active: !!r.is_active,
      });
      toast.success('Saved');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const addRow = async () => {
    const label = newLabel.trim();
    if (!label) {
      toast.error('Enter a label');
      return;
    }
    setSavingId('new');
    try {
      await create({
        label,
        sort_order: Number(newSort || 0),
        is_active: 1,
      });
      toast.success('Added');
      setNewLabel('');
      setNewSort('');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Add failed');
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm('Delete this item?')) return;
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

      <div className="grid sm:grid-cols-[1fr_10rem_auto] gap-2">
        <input
          className="input-field"
          placeholder="New label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Sort"
          value={newSort}
          onChange={(e) => setNewSort(e.target.value)}
        />
        <button type="button" onClick={addRow} className="btn-primary" disabled={savingId === 'new'}>
          Add
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse bg-white/40 rounded-2xl" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-600">No items yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/50 border border-white/70 p-3">
              <div className="grid sm:grid-cols-[1fr_10rem_9rem_auto] gap-2 items-center">
                <input
                  className="input-field"
                  value={r.label || ''}
                  onChange={(e) => patchRow(r.id, { label: e.target.value })}
                />
                <input
                  className="input-field"
                  value={String(r.sort_order ?? '')}
                  onChange={(e) => patchRow(r.id, { sort_order: e.target.value })}
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!r.is_active}
                    onChange={(e) => patchRow(r.id, { is_active: e.target.checked ? 1 : 0 })}
                  />
                  Active
                </label>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-outline !px-4"
                    disabled={savingId === r.id}
                    onClick={() => saveRow(r)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-danger !px-4"
                    disabled={savingId === r.id}
                    onClick={() => deleteRow(r.id)}
                  >
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
