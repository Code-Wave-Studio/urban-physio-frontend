import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const MIN_LIST = 220;
const DEFAULT_LIST = 320;

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
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
  const [draft, setDraft] = useState({ title: '', body_html: '', tags: [], is_pinned: false });
  const [listWidth, setListWidth] = useState(() => {
    const saved = Number(localStorage.getItem('clinic_notes_list_w') || DEFAULT_LIST);
    return Math.max(MIN_LIST, Math.min(saved, window.innerWidth * 0.5));
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

  useEffect(() => {
    if (!active) {
      setDraft({ title: '', body_html: '', tags: [], is_pinned: false });
      if (editorRef.current) editorRef.current.innerHTML = '';
      return;
    }
    let tags = [];
    try { tags = JSON.parse(active.tags_json || '[]'); } catch { tags = []; }
    const html = active.body_html || '';
    setDraft({
      title: active.title || '',
      body_html: html,
      tags: Array.isArray(tags) ? tags : [],
      is_pinned: !!Number(active.is_pinned),
    });
    // Set editor HTML only when switching notes — avoid cursor reset on autosave
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
        await clinicPortal.notesUpdate(clinicId, activeId, next);
        dirty.current = false;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === activeId
              ? { ...n, ...next, body_text: stripHtml(next.body_html || n.body_html), updated_at: new Date().toISOString() }
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
    if (!name) return;
    try {
      await clinicPortal.notesCreateFolder(clinicId, { name });
      toast.success('Folder created');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not create folder');
    }
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

  // Resize handlers
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

  return (
    <ClinicPortalShell
      title="Notes"
      subtitle="Clinic notes with auto-save, folders, and rich text"
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
          {/* Left list — hidden on mobile when editor open */}
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
                  <button type="button" onClick={createFolder} className="text-[11px] px-2 py-1 text-teal-700 ml-auto">
                    + Folder
                  </button>
                </div>
                <select
                  className="input-field text-xs"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                >
                  <option value="all">All folders</option>
                  <option value="none">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="overflow-y-auto flex-1">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { setActiveId(n.id); setMobileEditor(true); }}
                    className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 ${
                      activeId === n.id ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!!Number(n.is_pinned) && <FaIcon icon="fa-thumbtack" className="text-amber-500 text-xs mt-1" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{n.title || 'Untitled'}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.body_text || 'Empty note'}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {!notes.length && (
                  <p className="text-sm text-slate-400 text-center py-10">No notes yet</p>
                )}
              </div>
            </div>

            {/* Mobile list */}
            <div className="md:hidden flex-1 flex flex-col">
              <div className="p-3 space-y-2 border-b">
                <input className="input-field text-sm" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="overflow-y-auto flex-1">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { setActiveId(n.id); setMobileEditor(true); }}
                    className="w-full text-left px-4 py-3 border-b"
                  >
                    <p className="font-semibold text-sm">{n.title || 'Untitled'}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{n.body_text}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Divider */}
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => setDragging(true)}
            onDoubleClick={resetLayout}
            className="hidden md:block w-1.5 cursor-col-resize bg-slate-100 hover:bg-teal-200 transition-colors shrink-0"
            title="Drag to resize · Double-click to reset"
          />

          {/* Editor */}
          <section
            className={`flex-1 flex flex-col min-w-0 ${
              mobileEditor ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select or create a note
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap">
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
                <div className="flex gap-1 px-3 py-1.5 border-b bg-slate-50 text-xs">
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
                <div className="px-3 py-2 border-t">
                  <input
                    className="input-field text-xs"
                    placeholder="Tags (comma separated)"
                    value={(draft.tags || []).join(', ')}
                    onChange={(e) =>
                      updateDraft({
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </ClinicPortalShell>
  );
}
