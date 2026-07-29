import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { erpAssessments } from '../../services/api';

const DEFAULT_CATEGORIES = [
  'chief_complaint','observation','palpation','diagnosis','treatment_plan',
  'goals','special_tests','investigation','general',
];

function ChipModal({ chip, onClose, onSaved }) {
  const [form, setForm] = useState(chip || { label: '', insert_text: '', category: 'general', sort_order: 0, is_active: 1 });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.label || !form.insert_text) return toast.error('Label and text required');
    setSaving(true);
    try {
      if (chip?.id) {
        await erpAssessments.updateChip(chip.id, form);
        toast.success('Chip updated');
      } else {
        await erpAssessments.createChip(form);
        toast.success('Chip created');
      }
      onSaved();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="font-bold text-lg mb-4">{chip?.id ? 'Edit Chip' : 'New Chip'}</h2>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Label *</label>
            <input required className="w-full border rounded-xl px-3 py-2 text-sm mt-1" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Insert Text *</label>
            <textarea required rows={3} className="w-full border rounded-xl px-3 py-2 text-sm mt-1 resize-none" value={form.insert_text} onChange={(e) => setForm((p) => ({ ...p, insert_text: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <input list="chip-cats" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              <datalist id="chip-cats">
                {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-slate-500">Sort Order</label>
              <input type="number" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked ? 1 : 0 }))} />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClinicSuggestionChipsPage() {
  const [chips, setChips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | {} | chip
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpAssessments.listChips({});
      setChips(res.data || res || []);
    } catch { toast.error('Could not load chips'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this chip?')) return;
    try {
      await erpAssessments.deleteChip(id);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const categories = [...new Set(chips.map((c) => c.category))].sort();

  const filtered = chips.filter((c) => {
    if (catFilter && c.category !== catFilter) return false;
    if (search && !c.label.toLowerCase().includes(search.toLowerCase()) && !c.insert_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ClinicPortalShell
      title="Suggestion Chips"
      subtitle="Manage quick-insert text chips for assessment forms"
      actions={
        <button type="button" className="btn-primary text-sm inline-flex items-center gap-2" onClick={() => setModal({})}>
          <FaIcon icon="fa-solid fa-plus" /> New Chip
        </button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          className="border rounded-full px-4 py-1.5 text-sm flex-1 min-w-0 max-w-xs"
          placeholder="Search chips…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-full px-3 py-1.5 text-sm"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FaIcon icon="fa-solid fa-tags" className="text-4xl mb-3 block" />
          <p>No chips found. Create your first suggestion chip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((chip) => (
            <div key={chip.id} className={`rounded-2xl border p-4 bg-white shadow-sm ${!chip.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{chip.label}</p>
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">{chip.category}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => setModal(chip)} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <FaIcon icon="fa-solid fa-pen" className="text-xs text-teal-600" />
                  </button>
                  <button type="button" onClick={() => remove(chip.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <FaIcon icon="fa-solid fa-trash" className="text-xs text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{chip.insert_text}</p>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ChipModal
          chip={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </ClinicPortalShell>
  );
}
