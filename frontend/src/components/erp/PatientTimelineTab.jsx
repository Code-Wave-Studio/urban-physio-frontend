import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { erpPatient } from '../../services/api';

const COLOR_MAP = {
  blue:    'bg-blue-100 text-blue-700 border-blue-200',
  indigo:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  green:   'bg-green-100 text-green-700 border-green-200',
  teal:    'bg-teal-100 text-teal-700 border-teal-200',
  red:     'bg-red-100 text-red-700 border-red-200',
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber:   'bg-amber-100 text-amber-700 border-amber-200',
  sky:     'bg-sky-100 text-sky-700 border-sky-200',
  gray:    'bg-slate-100 text-slate-700 border-slate-200',
  purple:  'bg-purple-100 text-purple-700 border-purple-200',
  orange:  'bg-orange-100 text-orange-700 border-orange-200',
  cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  yellow:  'bg-yellow-100 text-yellow-700 border-yellow-200',
};
const LINE_COLOR = {
  blue: 'border-blue-300', indigo: 'border-indigo-300', green: 'border-green-300',
  teal: 'border-teal-300', red: 'border-red-300', violet: 'border-violet-300',
  emerald: 'border-emerald-300', amber: 'border-amber-300', sky: 'border-sky-300',
  gray: 'border-slate-300', purple: 'border-purple-300', orange: 'border-orange-300',
  cyan: 'border-cyan-300', yellow: 'border-yellow-300',
};
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  'appointment_created','appointment_updated','appointment_cancelled','visit_completed',
  'payment','refund','assessment','protocol','exercise_assigned','package_purchased',
  'document_uploaded','note_added','doctor_changed','status_changed','manual',
].map((v) => typeof v === 'string' ? { value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) } : v);

function AddEventModal({ patientKey, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', event_at: new Date().toISOString().slice(0, 16) });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await erpPatient.addTimelineEvent(patientKey, form);
      toast.success('Timeline event recorded');
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to add event');
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto transition-opacity"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 my-auto flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <FaIcon icon="fa-timeline" className="text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add Timeline Event</h3>
              <p className="text-[11px] text-slate-500">Record a custom clinical event or milestone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FaIcon icon="fa-xmark" className="text-base" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Assessment Report Uploaded or Initial Visit"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Event Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none transition-all"
              rows={3}
              placeholder="Provide context or notes about this milestone..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
              value={form.event_at}
              onChange={(e) => setForm((p) => ({ ...p, event_at: e.target.value }))}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold shadow-sm shadow-teal-600/20 disabled:opacity-60 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <FaIcon icon="fa-spinner" className="animate-spin text-xs" />
                  Adding Event…
                </>
              ) : (
                <>
                  <FaIcon icon="fa-plus" className="text-xs" />
                  Add Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TimelineEvent({ event, patientKey, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({ title: event.title, description: event.description || '', event_at: event.event_at?.slice(0, 16) || '' });
  const [saving, setSaving]     = useState(false);
  const c = COLOR_MAP[event.color] || COLOR_MAP.gray;
  const l = LINE_COLOR[event.color] || 'border-slate-300';

  const saveEdit = async () => {
    setSaving(true);
    try {
      await erpPatient.updateTimelineEvent(patientKey, event.id, editForm);
      toast.success('Updated');
      setEditing(false);
      onRefresh();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await erpPatient.deleteTimelineEvent(patientKey, event.id);
      toast.success('Deleted');
      onRefresh();
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${c} ${l}`}>
        <FaIcon icon={`fa-solid ${event.icon || 'fa-circle-info'}`} className="text-xs" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="rounded-2xl border border-teal-200 p-3 space-y-2 bg-white shadow-sm">
            <input className="w-full border rounded-lg px-2 py-1 text-sm" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full border rounded-lg px-2 py-1 text-sm resize-none" rows={2} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
            <input type="datetime-local" className="w-full border rounded-lg px-2 py-1 text-sm" value={editForm.event_at} onChange={(e) => setEditForm((p) => ({ ...p, event_at: e.target.value }))} />
            <div className="flex gap-2">
              <button type="button" onClick={saveEdit} disabled={saving} className="btn-primary text-xs !py-1.5">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline text-xs !py-1.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 p-3 bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${event.event_source === 'manual' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {event.event_source === 'manual' ? 'Manual' : 'System'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{fmt(event.event_at)}{event.actor_name ? ` · ${event.actor_name}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {event.description && (
                  <button type="button" onClick={() => setExpanded((v) => !v)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <FaIcon icon={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} className="text-[10px] text-slate-400" />
                  </button>
                )}
                {event.is_editable && (
                  <>
                    <button type="button" onClick={() => setEditing(true)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                      <FaIcon icon="fa-solid fa-pen" className="text-[10px] text-teal-600" />
                    </button>
                    <button type="button" onClick={remove} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                      <FaIcon icon="fa-solid fa-trash" className="text-[10px] text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {expanded && event.description && (
              <p className="text-sm text-slate-600 mt-2 border-t border-slate-100 pt-2">{event.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientTimelineTab({ patientKey }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState({ event_type: '', event_source: '', date_from: '', date_to: '' });
  const [showAdd, setShowAdd] = useState(false);
  const loaderRef             = useRef(null);

  const load = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const res = await erpPatient.getTimeline(patientKey, { ...filters, page: p, per_page: 20 });
      const d   = res.data || res;
      setData((prev) =>
        reset || p === 1
          ? d
          : { ...d, events: [...(prev?.events || []), ...(d.events || [])] }
      );
      setPage(p);
    } catch {
      toast.error('Could not load timeline');
    } finally { setLoading(false); }
  }, [patientKey, filters]);

  useEffect(() => { load(1, true); }, [load]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && data && page < data.total_pages) {
        load(page + 1);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, data, page, load]);

  const refresh = () => load(1, true);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="text-xs border rounded-full px-3 py-1.5 bg-white"
          value={filters.event_type}
          onChange={(e) => setFilters((p) => ({ ...p, event_type: e.target.value }))}
        >
          {EVENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          className="text-xs border rounded-full px-3 py-1.5 bg-white"
          value={filters.event_source}
          onChange={(e) => setFilters((p) => ({ ...p, event_source: e.target.value }))}
        >
          <option value="">All Sources</option>
          <option value="system">System</option>
          <option value="manual">Manual</option>
        </select>
        <input
          type="date"
          className="text-xs border rounded-full px-3 py-1.5 bg-white"
          value={filters.date_from}
          onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
          placeholder="From"
        />
        <input
          type="date"
          className="text-xs border rounded-full px-3 py-1.5 bg-white"
          value={filters.date_to}
          onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
          placeholder="To"
        />
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="ml-auto btn-primary text-xs !py-1.5 !px-4 inline-flex items-center gap-2"
        >
          <FaIcon icon="fa-solid fa-plus" />
          Add Event
        </button>
      </div>

      {/* Timeline */}
      {loading && !data ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 h-14 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10" />
          {(data?.events || []).map((event) => (
            <TimelineEvent key={event.id} event={event} patientKey={patientKey} onRefresh={refresh} />
          ))}
          {!data?.events?.length && (
            <p className="py-10 text-center text-sm text-slate-400">No timeline events yet.</p>
          )}
          {/* Infinite scroll sentinel */}
          <div ref={loaderRef} className="h-4" />
          {loading && data && <p className="text-center text-xs text-slate-400 py-2">Loading more…</p>}
        </div>
      )}

      {showAdd && (
        <AddEventModal
          patientKey={patientKey}
          onSave={() => { setShowAdd(false); refresh(); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
