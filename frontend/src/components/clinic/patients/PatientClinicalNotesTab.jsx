import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

const NOTE_TYPES = [
  { id: 'daily_treatment', label: 'Daily Treatment Note', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'fa-calendar-day' },
  { id: 'progress', label: 'Progress Note', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'fa-chart-line' },
  { id: 'follow_up', label: 'Follow-up Note', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'fa-user-clock' },
  { id: 'observation', label: 'Observation Note', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: 'fa-eye' },
  { id: 'internal', label: 'Internal Clinical Note', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'fa-lock' },
];

const NOTE_TYPE_MAP = Object.fromEntries(NOTE_TYPES.map((t) => [t.id, t]));

const TAG_PALETTE = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#64748b'];

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
}

function parseTags(raw) {
  let tags = [];
  try {
    tags = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
  } catch {
    tags = [];
  }
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t, i) => {
      if (typeof t === 'string') {
        const label = t.trim();
        return label ? { label, color: TAG_PALETTE[i % TAG_PALETTE.length] } : null;
      }
      const label = String(t?.label || t?.name || '').trim();
      return label ? { label, color: t?.color || TAG_PALETTE[i % TAG_PALETTE.length] } : null;
    })
    .filter(Boolean);
}

export default function PatientClinicalNotesTab({ clinicId, patientKey, appointments = [] }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState('');
  const [therapistFilter, setTherapistFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    note_type: 'daily_treatment',
    therapist_name: '',
    appointment_id: '',
    attachment_url: '',
    body_html: '',
    tags: [],
    is_pinned: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [detailModalNote, setDetailModalNote] = useState(null);

  const editorRef = useRef(null);

  const loadNotes = useCallback(async () => {
    if (!clinicId || !patientKey) return;
    setLoading(true);
    try {
      const res = await clinicPortal.notesList(clinicId, {
        patient_key: patientKey,
        q,
        note_type: noteTypeFilter,
        therapist: therapistFilter,
        date_from: dateFilter,
      });
      setNotes(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Could not load clinical notes');
    } finally {
      setLoading(false);
    }
  }, [clinicId, patientKey, q, noteTypeFilter, therapistFilter, dateFilter]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const uniqueTherapists = useMemo(() => {
    const list = new Set();
    notes.forEach((n) => {
      if (n.therapist_name) list.add(n.therapist_name);
    });
    return Array.from(list);
  }, [notes]);

  const openNewNote = () => {
    setEditingId(null);
    setForm({
      title: '',
      note_type: 'daily_treatment',
      therapist_name: '',
      appointment_id: '',
      attachment_url: '',
      body_html: '',
      tags: [],
      is_pinned: false,
    });
    setTagInput('');
    setShowEditor(true);
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = '';
    });
  };

  const openEditNote = (n) => {
    setEditingId(n.id);
    const html = n.body_html || '';
    setForm({
      title: n.title || '',
      note_type: n.note_type || 'daily_treatment',
      therapist_name: n.therapist_name || '',
      appointment_id: n.appointment_id || '',
      attachment_url: n.attachment_url || '',
      body_html: html,
      tags: parseTags(n.tags_json),
      is_pinned: !!Number(n.is_pinned),
    });
    setTagInput('');
    setShowEditor(true);
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = html;
    });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm((p) => ({ ...p, body_html: editorRef.current.innerHTML }));
    }
  };

  const insertChecklist = () => {
    const html = '<ul><li style="list-style-type: square;">☐ Checklist item</li></ul>';
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      setForm((p) => ({ ...p, body_html: editorRef.current.innerHTML }));
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  };

  const addTag = () => {
    const label = tagInput.trim();
    if (!label) return;
    if (form.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      toast.error('Tag already exists');
      return;
    }
    const color = TAG_PALETTE[form.tags.length % TAG_PALETTE.length];
    setForm((p) => ({ ...p, tags: [...p.tags, { label: label.slice(0, 40), color }] }));
    setTagInput('');
  };

  const removeTag = (idx) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((_, i) => i !== idx) }));
  };

  const saveNote = async (e) => {
    e.preventDefault();
    const bodyHtml = editorRef.current ? editorRef.current.innerHTML : form.body_html;
    if (!form.title.trim()) {
      return toast.error('Note title is required');
    }
    if (!stripHtml(bodyHtml).trim()) {
      return toast.error('Note content cannot be empty');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        body_html: bodyHtml,
        patient_key: patientKey,
      };

      if (editingId) {
        await clinicPortal.notesUpdate(clinicId, editingId, payload);
        toast.success('Clinical note updated');
      } else {
        await clinicPortal.notesCreate(clinicId, payload);
        toast.success('Clinical note added');
      }

      setShowEditor(false);
      loadNotes();
    } catch (err) {
      toast.error(err.message || 'Could not save clinical note');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (n) => {
    try {
      await clinicPortal.notesUpdate(clinicId, n.id, { is_pinned: !Number(n.is_pinned) });
      toast.success(n.is_pinned ? 'Note unpinned' : 'Note pinned');
      loadNotes();
    } catch (err) {
      toast.error(err.message || 'Could not update pin status');
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this clinical note?')) return;
    try {
      await clinicPortal.notesDelete(clinicId, id);
      toast.success('Clinical note deleted');
      loadNotes();
    } catch (err) {
      toast.error(err.message || 'Could not delete note');
    }
  };

  const toggleExpand = (id) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[150px]">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Search clinical notes..."
              className="input-field text-xs pl-8 py-1.5 bg-white w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Note Type Filter */}
          <select
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={noteTypeFilter}
            onChange={(e) => setNoteTypeFilter(e.target.value)}
          >
            <option value="">All Note Types</option>
            {NOTE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Therapist Filter */}
          {uniqueTherapists.length > 0 && (
            <select
              className="input-field text-xs py-1.5 px-2 bg-white"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
            >
              <option value="">All Therapists</option>
              {uniqueTherapists.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {/* Date Filter */}
          <input
            type="date"
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 shadow-xs"
          onClick={openNewNote}
        >
          <FaIcon icon="fa-plus" />
          <span>New Clinical Note</span>
        </button>
      </div>

      {/* Editor Drawer/Modal */}
      {showEditor && (
        <div className="rounded-2xl border border-teal-200 bg-white p-4 sm:p-5 shadow-lg space-y-4 transition-all">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaIcon icon="fa-pen-to-square" className="text-teal-600 text-sm" />
              {editingId ? 'Edit Clinical Note' : 'Add Clinical Note'}
            </h3>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-sm p-1"
              onClick={() => setShowEditor(false)}
            >
              <FaIcon icon="fa-xmark" />
            </button>
          </div>

          <form onSubmit={saveNote} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day 3 Post-op Quadriceps Rehabilitation"
                  className="input-field text-xs py-2 w-full"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Note Type *</label>
                <select
                  className="input-field text-xs py-2 w-full font-medium"
                  value={form.note_type}
                  onChange={(e) => setForm((p) => ({ ...p, note_type: e.target.value }))}
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Therapist / Doctor Name</label>
                <input
                  type="text"
                  placeholder="Doctor or Therapist Name"
                  className="input-field text-xs py-2 w-full"
                  value={form.therapist_name}
                  onChange={(e) => setForm((p) => ({ ...p, therapist_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Appointment Reference (Optional)</label>
                <select
                  className="input-field text-xs py-2 w-full"
                  value={form.appointment_id}
                  onChange={(e) => setForm((p) => ({ ...p, appointment_id: e.target.value }))}
                >
                  <option value="">None / General Note</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.booking_id || `Appt #${a.id}`} · {a.appointment_date} ({a.start_time?.slice(0, 5) || '—'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rich Editor Toolbar */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Note Content *</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-slate-200 bg-slate-100/70 text-xs">
                  <button type="button" onClick={() => execCmd('formatBlock', '<h1>')} title="Heading 1" className="px-2 py-1 bg-white rounded border hover:bg-slate-50 font-bold">H1</button>
                  <button type="button" onClick={() => execCmd('formatBlock', '<h2>')} title="Heading 2" className="px-2 py-1 bg-white rounded border hover:bg-slate-50 font-bold text-xs">H2</button>
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  <button type="button" onClick={() => execCmd('bold')} title="Bold" className="px-2 py-1 bg-white rounded border hover:bg-slate-50 font-bold">B</button>
                  <button type="button" onClick={() => execCmd('italic')} title="Italic" className="px-2 py-1 bg-white rounded border hover:bg-slate-50 italic">I</button>
                  <button type="button" onClick={() => execCmd('underline')} title="Underline" className="px-2 py-1 bg-white rounded border hover:bg-slate-50 underline">U</button>
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  <button type="button" onClick={() => execCmd('insertUnorderedList')} title="Bullet List" className="px-2 py-1 bg-white rounded border hover:bg-slate-50">
                    <FaIcon icon="fa-list-ul" />
                  </button>
                  <button type="button" onClick={() => execCmd('insertOrderedList')} title="Numbered List" className="px-2 py-1 bg-white rounded border hover:bg-slate-50">
                    <FaIcon icon="fa-list-ol" />
                  </button>
                  <button type="button" onClick={insertChecklist} title="Checklist Item" className="px-2 py-1 bg-white rounded border hover:bg-slate-50">
                    <FaIcon icon="fa-square-check" />
                  </button>
                  <button type="button" onClick={insertLink} title="Insert Link" className="px-2 py-1 bg-white rounded border hover:bg-slate-50">
                    <FaIcon icon="fa-link" />
                  </button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[140px] max-h-[300px] p-3 text-sm focus:outline-none bg-white overflow-y-auto leading-relaxed text-slate-800"
                  onInput={() => {
                    if (editorRef.current) {
                      setForm((p) => ({ ...p, body_html: editorRef.current.innerHTML }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Tags & Attachments */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add tag and press enter"
                    className="input-field text-xs py-1.5 flex-1"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button type="button" onClick={addTag} className="btn-outline text-xs py-1.5 px-3">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: t.color }}>
                      {t.label}
                      <button type="button" onClick={() => removeTag(idx)} className="hover:opacity-80">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Attachment Link (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or document URL"
                  className="input-field text-xs py-1.5 w-full"
                  value={form.attachment_url}
                  onChange={(e) => setForm((p) => ({ ...p, attachment_url: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={form.is_pinned}
                  onChange={(e) => setForm((p) => ({ ...p, is_pinned: e.target.checked }))}
                />
                Pin note to top of patient profile
              </label>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditor(false)} className="btn-outline text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-xs py-2 px-5">
                  {saving ? 'Saving...' : editingId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="glass-card h-40 animate-pulse" />
      ) : !notes.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <FaIcon icon="fa-notes-medical" className="text-3xl text-slate-300 mb-2 block mx-auto" />
          No clinical notes recorded for this patient yet. Click <strong>New Clinical Note</strong> to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const isPinned = !!Number(n.is_pinned);
            const typeInfo = NOTE_TYPE_MAP[n.note_type] || NOTE_TYPE_MAP.daily_treatment;
            const tags = parseTags(n.tags_json);
            const isExpanded = expandedNotes[n.id] ?? false;

            return (
              <article
                key={n.id}
                className={`rounded-2xl border bg-white shadow-xs p-4 transition-all hover:border-slate-300 ${
                  isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <FaIcon icon="fa-thumbtack" className="text-[9px]" /> Pinned
                        </span>
                      )}
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${typeInfo.color}`}>
                        <FaIcon icon={typeInfo.icon} className="mr-1 text-[9px]" />
                        {typeInfo.label}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        <FaIcon icon="fa-clock" className="mr-1 text-slate-400" />
                        {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                      {n.therapist_name && (
                        <span>
                          <FaIcon icon="fa-user-doctor" className="mr-1 text-slate-400" />
                          {n.therapist_name}
                        </span>
                      )}
                      {n.appointment_id && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          Appt #{n.appointment_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePin(n)}
                      title={isPinned ? 'Unpin note' : 'Pin note'}
                      className={`p-1.5 rounded-lg border transition-colors ${isPinned ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <FaIcon icon="fa-thumbtack" className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditNote(n)}
                      title="Edit note"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                    >
                      <FaIcon icon="fa-pen-to-square" className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      title="Delete note"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <FaIcon icon="fa-trash-can" className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: t.color }}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content snippet / full view */}
                <div className="mt-3 text-sm text-slate-700 prose prose-slate max-w-none">
                  {isExpanded ? (
                    <div dangerouslySetInnerHTML={{ __html: n.body_html || n.body_text }} />
                  ) : (
                    <p className="line-clamp-3">{n.body_text || stripHtml(n.body_html)}</p>
                  )}
                </div>

                {/* Footer Controls & Attachment */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  {n.attachment_url ? (
                    <a
                      href={n.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-medium"
                    >
                      <FaIcon icon="fa-paperclip" />
                      <span>Attachment</span>
                    </a>
                  ) : <span />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailModalNote(n)}
                      className="text-slate-500 hover:text-slate-800 font-medium hover:underline"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(n.id)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                      <FaIcon icon={isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Note Detail Modal */}
      {detailModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {detailModalNote.note_type?.replace(/_/g, ' ')}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{detailModalNote.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {detailModalNote.created_at ? new Date(detailModalNote.created_at).toLocaleString('en-IN') : '—'} · {detailModalNote.therapist_name || 'Therapist'}
                </p>
              </div>
              <button type="button" onClick={() => setDetailModalNote(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <FaIcon icon="fa-xmark" className="text-lg" />
              </button>
            </div>

            <div className="prose prose-slate max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: detailModalNote.body_html || detailModalNote.body_text }} />

            {detailModalNote.attachment_url && (
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-1">Attachment</p>
                <a href={detailModalNote.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 hover:underline flex items-center gap-1.5">
                  <FaIcon icon="fa-paperclip" /> {detailModalNote.attachment_url}
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setDetailModalNote(null)} className="btn-primary text-xs py-2 px-5">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
