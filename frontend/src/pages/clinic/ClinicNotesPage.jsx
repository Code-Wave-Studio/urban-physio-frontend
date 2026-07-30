import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const MIN_LIST = 220;
const DEFAULT_LIST = 320;

const NOTE_BG_PRESETS = [
  { id: 'default', label: 'Default', value: '' },
  { id: 'cream', label: 'Cream', value: '#FFF8F0' },
  { id: 'mint', label: 'Mint', value: '#F0FDF9' },
  { id: 'sky', label: 'Sky', value: '#F0F9FF' },
  { id: 'lavender', label: 'Lavender', value: '#F5F3FF' },
  { id: 'rose', label: 'Rose', value: '#FFF1F2' },
  { id: 'lemon', label: 'Lemon', value: '#FEFCE8' },
  { id: 'slate', label: 'Slate', value: '#F8FAFC' },
];

const TAG_COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#64748b', '#be123c'];

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
        if (!label) return null;
        return { label, color: TAG_COLORS[i % TAG_COLORS.length] };
      }
      const label = String(t?.label || t?.name || '').trim();
      if (!label) return null;
      const color = t?.color && /^#[0-9A-Fa-f]{3,8}$/.test(t.color)
        ? t.color
        : TAG_COLORS[i % TAG_COLORS.length];
      return { label, color };
    })
    .filter(Boolean);
}

export default function ClinicNotesPage() {
  const { clinicId, loading: boot } = useClinicPortal();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(0);
  const [folderId, setFolderId] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState({
    title: '',
    body_html: '',
    tags: [],
    bg_color: '',
    is_pinned: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [listWidth, setListWidth] = useState(() => {
    const saved = Number(localStorage.getItem('clinic_notes_list_w') || DEFAULT_LIST);
    return Math.max(MIN_LIST, Math.min(saved, typeof window !== 'undefined' ? window.innerWidth * 0.5 : DEFAULT_LIST));
  });
  const [dragging, setDragging] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);
  const saveTimer = useRef(null);
  const dirty = useRef(false);
  const editorRef = useRef(null);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [n, f] = await Promise.all([
        clinicPortal.notesList(clinicId, { q, archived, folder_id: folderId }),
        clinicPortal.notesFolders(clinicId),
      ]);
      setNotes(n.data || n || []);
      setFolders(f.data || f || []);
    } catch (e) {
      toast.error(e.message || 'Could not load notes');
    } finally {
      setLoading(false);
    }
  }, [clinicId, q, archived, folderId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const active = useMemo(() => notes.find((n) => n.id === activeId), [notes, activeId]);
  const selectedFolder = useMemo(
    () => folders.find((f) => String(f.id) === String(folderId)),
    [folders, folderId]
  );

  useEffect(() => {
    if (!active) {
      setDraft({ title: '', body_html: '', tags: [], bg_color: '', is_pinned: false });
      setTagInput('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      return;
    }
    const html = active.body_html || '';
    setDraft({
      title: active.title || '',
      body_html: html,
      tags: parseTags(active.tags_json),
      bg_color: active.bg_color || '',
      is_pinned: !!Number(active.is_pinned),
    });
    requestAnimationFrame(() => {
      if (editorRef.current && editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    });
    dirty.current = false;
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const autosave = useCallback((next) => {
    if (!clinicId || !activeId) return;
    dirty.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const payload = {
          title: next.title,
          body_html: next.body_html,
          tags: next.tags,
          bg_color: next.bg_color || null,
          is_pinned: next.is_pinned,
        };
        await clinicPortal.notesUpdate(clinicId, activeId, payload);
        dirty.current = false;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === activeId
              ? {
                  ...n,
                  title: next.title,
                  body_html: next.body_html,
                  body_text: stripHtml(next.body_html || n.body_html),
                  tags_json: JSON.stringify(next.tags || []),
                  bg_color: next.bg_color || null,
                  is_pinned: next.is_pinned ? 1 : 0,
                  updated_at: new Date().toISOString(),
                }
              : n
          )
        );
      } catch {
        /* silent autosave fail */
      }
    }, 700);
  }, [clinicId, activeId]);

  const updateDraft = (patch) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      autosave(next);
      return next;
    });
  };

  const createNote = async () => {
    try {
      const res = await clinicPortal.notesCreate(clinicId, {
        title: 'Untitled',
        body_html: '',
        folder_id: folderId !== 'all' && folderId !== 'none' ? folderId : null,
        tags: [],
        bg_color: null,
      });
      const note = res.data || res;
      toast.success('Note created');
      await load();
      setActiveId(note.id);
      setMobileEditor(true);
    } catch (e) {
      toast.error(e.message || 'Could not create note');
    }
  };

  const createFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    try {
      await clinicPortal.notesCreateFolder(clinicId, { name: name.trim(), color: '#0d9488' });
      toast.success('Folder created');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not create folder');
    }
  };

  const renameFolder = async () => {
    if (!selectedFolder) {
      toast.error('Select a folder first');
      return;
    }
    const name = window.prompt('Rename folder', selectedFolder.name || '');
    if (!name?.trim() || name.trim() === selectedFolder.name) return;
    try {
      await clinicPortal.notesUpdateFolder(clinicId, selectedFolder.id, { name: name.trim() });
      toast.success('Folder renamed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not rename folder');
    }
  };

  const deleteFolder = async () => {
    if (!selectedFolder) {
      toast.error('Select a folder first');
      return;
    }
    if (!window.confirm(`Delete folder "${selectedFolder.name}"? Notes inside will move to No folder.`)) return;
    try {
      await clinicPortal.notesDeleteFolder(clinicId, selectedFolder.id);
      toast.success('Folder deleted');
      setFolderId('all');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not delete folder');
    }
  };

  const addTag = () => {
    const label = tagInput.trim();
    if (!label) return;
    if ((draft.tags || []).some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      toast.error('Tag already added');
      return;
    }
    const nextTags = [...(draft.tags || []), { label: label.slice(0, 40), color: tagColor }];
    setTagInput('');
    updateDraft({ tags: nextTags });
  };

  const removeTag = (label) => {
    updateDraft({ tags: (draft.tags || []).filter((t) => t.label !== label) });
  };

  const togglePin = () => updateDraft({ is_pinned: !draft.is_pinned });

  const archiveNote = async () => {
    if (!activeId) return;
    try {
      await clinicPortal.notesUpdate(clinicId, activeId, { is_archived: archived ? 0 : 1 });
      toast.success(archived ? 'Restored' : 'Archived');
      setActiveId(null);
      setMobileEditor(false);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const deleteNote = async () => {
    if (!activeId || !window.confirm('Delete this note?')) return;
    try {
      await clinicPortal.notesDelete(clinicId, activeId);
      toast.success('Deleted');
      setActiveId(null);
      setMobileEditor(false);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const max = Math.min(window.innerWidth * 0.5, 480);
      const w = Math.max(MIN_LIST, Math.min(max, x - 16));
      setListWidth(w);
    };
    const onUp = () => {
      setDragging(false);
      localStorage.setItem('clinic_notes_list_w', String(listWidth));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, listWidth]);

  const resetLayout = () => {
    setListWidth(DEFAULT_LIST);
    localStorage.setItem('clinic_notes_list_w', String(DEFAULT_LIST));
  };

  const applyFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    if (editorRef.current) updateDraft({ body_html: editorRef.current.innerHTML });
  };

  const noteBg = draft.bg_color || '#ffffff';

  const FolderBar = (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <select
          className="input-field text-xs flex-1 min-w-0"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="all">All folders</option>
          <option value="none">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={renameFolder}
          disabled={!selectedFolder}
          className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          title="Rename folder"
        >
          <FaIcon icon="fa-pen" className="text-[11px]" />
        </button>
        <button
          type="button"
          onClick={deleteFolder}
          disabled={!selectedFolder}
          className="shrink-0 w-8 h-8 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
          title="Delete folder"
        >
          <FaIcon icon="fa-trash" className="text-[11px]" />
        </button>
      </div>
    </div>
  );

  return (
    <ClinicPortalShell
      title="Notes"
      subtitle="Clinic notes with auto-save, folders, tags, and colors"
      actions={
        <button type="button" className="btn-primary text-sm inline-flex items-center gap-2" onClick={createNote}>
          <FaIcon icon="fa-plus" /> New Note
        </button>
      }
    >
      {boot || (loading && !notes.length) ? (
        <div className="glass-card h-64 animate-pulse" />
      ) : (
        <div className="glass-card !p-0 overflow-hidden flex h-[min(72vh,720px)] relative">
          <aside
            className={`border-r border-slate-100 flex flex-col shrink-0 ${
              mobileEditor ? 'hidden md:flex' : 'flex'
            } w-full md:w-auto`}
            style={typeof window !== 'undefined' && window.innerWidth >= 768 ? { width: listWidth } : undefined}
          >
            <div className="hidden md:flex md:flex-col md:h-full md:w-full">
              <div className="p-3 space-y-2 border-b">
                <input
                  className="input-field text-sm"
                  placeholder="Search notes…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setArchived(0)}
                    className={`text-[11px] px-2 py-1 rounded-full ${!archived ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchived(1)}
                    className={`text-[11px] px-2 py-1 rounded-full ${archived ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                  >
                    Archive
                  </button>
                  <button type="button" onClick={createFolder} className="text-[11px] px-2 py-1 text-teal-700 ml-auto font-semibold">
                    + Folder
                  </button>
                </div>
                {FolderBar}
              </div>
              <div className="overflow-y-auto flex-1">
                {notes.map((n) => {
                  const tags = parseTags(n.tags_json);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => { setActiveId(n.id); setMobileEditor(true); }}
                      className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 ${
                        activeId === n.id ? 'bg-teal-50' : ''
                      }`}
                      style={n.bg_color ? { backgroundColor: `${n.bg_color}99` } : undefined}
                    >
                      <div className="flex items-start gap-2">
                        {!!Number(n.is_pinned) && <FaIcon icon="fa-thumbtack" className="text-amber-500 text-xs mt-1" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{n.title || 'Untitled'}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.body_text || 'Empty note'}</p>
                          {!!tags.length && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {tags.slice(0, 3).map((t) => (
                                <span
                                  key={t.label}
                                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: t.color }}
                                >
                                  {t.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!notes.length && (
                  <p className="text-sm text-slate-400 text-center py-10">No notes yet</p>
                )}
              </div>
            </div>

            <div className="md:hidden flex-1 flex flex-col">
              <div className="p-3 space-y-2 border-b">
                <input className="input-field text-sm" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
                {FolderBar}
              </div>
              <div className="overflow-y-auto flex-1">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { setActiveId(n.id); setMobileEditor(true); }}
                    className="w-full text-left px-4 py-3 border-b"
                    style={n.bg_color ? { backgroundColor: `${n.bg_color}99` } : undefined}
                  >
                    <p className="font-semibold text-sm">{n.title || 'Untitled'}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{n.body_text}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => setDragging(true)}
            onDoubleClick={resetLayout}
            className="hidden md:block w-1.5 cursor-col-resize bg-slate-100 hover:bg-teal-200 transition-colors shrink-0"
            title="Drag to resize · Double-click to reset"
          />

          <section
            className={`flex-1 flex flex-col min-w-0 ${mobileEditor ? 'flex' : 'hidden md:flex'}`}
            style={activeId ? { backgroundColor: noteBg } : undefined}
          >
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm bg-white">
                Select or create a note
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap bg-white/70 backdrop-blur-sm">
                  <button type="button" className="md:hidden text-sm text-slate-600" onClick={() => setMobileEditor(false)}>
                    <FaIcon icon="fa-arrow-left" />
                  </button>
                  <input
                    className="flex-1 min-w-0 font-bold text-base outline-none bg-transparent"
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    placeholder="Title"
                  />
                  <button type="button" onClick={togglePin} className={`text-sm px-2 ${draft.is_pinned ? 'text-amber-600' : 'text-slate-400'}`} title="Pin">
                    <FaIcon icon="fa-thumbtack" />
                  </button>
                  <button type="button" onClick={archiveNote} className="text-sm text-slate-500 px-2" title="Archive">
                    <FaIcon icon="fa-box-archive" />
                  </button>
                  <button type="button" onClick={deleteNote} className="text-sm text-rose-500 px-2" title="Delete">
                    <FaIcon icon="fa-trash" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-white/60">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Background</span>
                  {NOTE_BG_PRESETS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      title={bg.label}
                      onClick={() => updateDraft({ bg_color: bg.value })}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        (draft.bg_color || '') === bg.value ? 'border-slate-800 scale-110' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: bg.value || '#ffffff' }}
                    />
                  ))}
                </div>

                <div className="flex gap-1 px-3 py-1.5 border-b bg-white/50 text-xs">
                  {['bold', 'italic', 'underline', 'insertUnorderedList'].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      className="px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200"
                      onMouseDown={(e) => { e.preventDefault(); applyFormat(cmd); }}
                    >
                      <FaIcon icon={
                        cmd === 'bold' ? 'fa-bold'
                          : cmd === 'italic' ? 'fa-italic'
                            : cmd === 'underline' ? 'fa-underline'
                              : 'fa-list-ul'
                      } />
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-slate-400 self-center">Auto-save</span>
                </div>

                <div
                  key={activeId}
                  id="note-editor"
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="flex-1 overflow-y-auto p-4 text-sm outline-none prose prose-sm max-w-none"
                  onInput={(e) => updateDraft({ body_html: e.currentTarget.innerHTML })}
                />

                <div className="px-3 py-3 border-t bg-white/80 space-y-2">
                  <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                    {(draft.tags || []).map((t) => (
                      <span
                        key={t.label}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.label}
                        <button
                          type="button"
                          className="opacity-80 hover:opacity-100"
                          onClick={() => removeTag(t.label)}
                          title="Remove tag"
                        >
                          <FaIcon icon="fa-xmark" className="text-[9px]" />
                        </button>
                      </span>
                    ))}
                    {!draft.tags?.length && (
                      <span className="text-[11px] text-slate-400 self-center">No tags yet</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1">
                      {TAG_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTagColor(c)}
                          className={`w-5 h-5 rounded-full border-2 ${tagColor === c ? 'border-slate-800' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                          title="Tag color"
                        />
                      ))}
                    </div>
                    <input
                      className="input-field text-xs flex-1 min-w-[140px]"
                      placeholder="Add tag…"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <button type="button" className="btn-outline text-xs !py-1.5" onClick={addTag}>
                      Add tag
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </ClinicPortalShell>
  );
}
