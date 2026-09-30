import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const TYPE_TABS = [
  { type: 'service_page', label: 'Pages' },
  { type: 'service_section', label: 'Sections' },
  { type: 'service_item', label: 'Services & plans' },
];

const ACTION_STYLE = {
  baseline: 'bg-slate-100 text-slate-700',
  publish: 'bg-emerald-100 text-emerald-800',
  update: 'bg-sky-100 text-sky-800',
  unpublish: 'bg-amber-100 text-amber-800',
  restore: 'bg-violet-100 text-violet-800',
};

function formatWhen(d) {
  if (!d) return '—';
  const dt = new Date(String(d).replace(' ', 'T'));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StateBadge({ state }) {
  const published = state === 'published';
  return (
    <span className={`badge ${published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function show(v) {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
}

/* ------------------------------------------------------------------ */
/* Detail / editor panel                                              */
/* ------------------------------------------------------------------ */
function EntityPanel({ type, id, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({});
  const [preview, setPreview] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [note, setNote] = useState('');
  const [openRev, setOpenRev] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([admin.cmsShow(type, id), admin.cmsRevisions(type, id, { limit: 50 })]);
      const data = d.data;
      setDetail(data);
      setForm({ ...data.live, ...(data.draft || {}) });
      setRevisions(r.data?.items || []);
      setPreview(null);
      setFieldErrors({});
    } catch (e) {
      toast.error(e.message || 'Could not load this item');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [type, id, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const specs = detail?.editable_fields || [];
  const baseline = useMemo(() => ({ ...(detail?.live || {}), ...(detail?.draft || {}) }), [detail]);
  const dirtyKeys = useMemo(
    () => specs.map((s) => s.name).filter((k) => String(form[k] ?? '') !== String(baseline[k] ?? '')),
    [specs, form, baseline]
  );

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      if (okMsg) toast.success(okMsg || res.message);
      await load();
      onChanged?.();
      return res;
    } catch (e) {
      if (e.errors) setFieldErrors(e.errors);
      toast.error(e.message || 'Action failed');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = () => {
    const fields = {};
    dirtyKeys.forEach((k) => {
      fields[k] = form[k];
    });
    if (!Object.keys(fields).length) {
      toast('No changes to save');
      return;
    }
    return run(() => admin.cmsSaveDraft(type, id, fields), 'Draft saved. The live page is unchanged until you publish.');
  };

  const doPublish = async () => {
    if (dirtyKeys.length && !window.confirm('You have unsaved edits that will NOT be published. Publish the saved draft anyway?')) return;
    setBusy(true);
    try {
      await admin.cmsPublish(type, id, { note });
      toast.success('Published');
      setNote('');
      await load();
      onChanged?.();
    } catch (e) {
      if (e.status === 409 && window.confirm(`${e.message}\n\nPublish anyway (overwrite the newer live changes)?`)) {
        try {
          await admin.cmsPublish(type, id, { note, force: true });
          toast.success('Published');
          await load();
          onChanged?.();
        } catch (e2) {
          toast.error(e2.message || 'Publish failed');
        }
      } else {
        if (e.errors) setFieldErrors(e.errors);
        toast.error(e.message || 'Publish failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const doUnpublish = () => {
    if (!window.confirm('Unpublish? It will disappear from the public site immediately. Content and history are kept.')) return;
    return run(() => admin.cmsUnpublish(type, id, { note }), 'Unpublished');
  };

  const doDiscard = () => {
    if (!window.confirm('Discard the pending draft? The live content is not affected.')) return;
    return run(() => admin.cmsDiscardDraft(type, id), 'Draft discarded');
  };

  const loadPreview = async () => {
    try {
      const res = await admin.cmsPreview(type, id);
      setPreview(res.data);
    } catch (e) {
      toast.error(e.message || 'Could not build preview');
    }
  };

  const restore = (no, mode) => {
    const msg =
      mode === 'live'
        ? `Restore revision #${no} LIVE now? This changes the public content immediately (a new revision is recorded).`
        : `Load revision #${no} into the draft? Nothing goes live until you publish.`;
    if (!window.confirm(msg)) return;
    return run(() => admin.cmsRestore(type, id, no, { mode }), mode === 'live' ? 'Revision restored' : 'Revision loaded into draft');
  };

  const viewRevision = async (no) => {
    if (openRev?.revision_no === no) {
      setOpenRev(null);
      return;
    }
    try {
      const res = await admin.cmsRevision(type, id, no);
      setOpenRev(res.data);
    } catch (e) {
      toast.error(e.message || 'Could not load revision');
    }
  };

  const renderField = (s) => {
    const val = form[s.name] ?? '';
    const err = fieldErrors[s.name];
    const common = {
      id: `f-${s.name}`,
      className: `input-field w-full ${err ? 'border-red-400' : ''}`,
      disabled: busy,
    };
    let control;
    if (s.type === 'enum') {
      control = (
        <select {...common} value={val} onChange={(e) => setForm((f) => ({ ...f, [s.name]: e.target.value }))}>
          {!s.required && <option value="">—</option>}
          {(s.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else if (s.type === 'bool') {
      const checked = String(val) === '1' || val === true;
      control = (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, [s.name]: e.target.checked ? 1 : 0 }))}
          />
          {checked ? 'Yes' : 'No'}
        </label>
      );
    } else if (s.type === 'longtext' || s.type === 'json') {
      control = (
        <textarea
          {...common}
          rows={s.type === 'json' ? 3 : 4}
          value={val}
          onChange={(e) => setForm((f) => ({ ...f, [s.name]: e.target.value }))}
        />
      );
    } else {
      control = (
        <input {...common} type="text" value={val} onChange={(e) => setForm((f) => ({ ...f, [s.name]: e.target.value }))} />
      );
    }
    const changedInDraft = detail?.draft && Object.prototype.hasOwnProperty.call(detail.draft, s.name);
    return (
      <div key={s.name} className="min-w-0">
        <label htmlFor={`f-${s.name}`} className="block text-xs font-semibold text-slate-600 mb-1 break-words">
          {s.name.replace(/_/g, ' ')}
          {s.required && <span className="text-red-500"> *</span>}
          {changedInDraft && <span className="ml-2 badge bg-sky-100 text-sky-800">in draft</span>}
        </label>
        {control}
        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[125] flex justify-end bg-slate-900/50" role="dialog" aria-modal="true" aria-label="Edit content">
      <div className="w-full max-w-3xl bg-white h-full overflow-y-auto overflow-x-hidden shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {TYPE_TABS.find((t) => t.type === type)?.label} · #{id}
            </p>
            <h2 className="text-lg font-bold text-slate-900 break-words">{detail?.live?.title || '…'}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {detail && <StateBadge state={detail.state} />}
              {detail?.draft && <span className="badge bg-sky-100 text-sky-800">Unpublished draft changes</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon p-2 text-slate-500 hover:text-slate-900" aria-label="Close">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        {loading || !detail ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <section className="glass-card !p-3 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input-field flex-1 min-w-0"
                  placeholder="Optional note for the history (e.g. why)"
                  maxLength={255}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="Publish note"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-outline !px-4 !py-2 text-sm" disabled={busy || !dirtyKeys.length} onClick={saveDraft}>
                  Save draft{dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}
                </button>
                <button type="button" className="btn-outline !px-4 !py-2 text-sm" disabled={busy} onClick={loadPreview}>
                  Preview
                </button>
                <button type="button" className="btn-primary !px-4 !py-2 text-sm" disabled={busy || (detail.state === 'published' && !detail.draft)} onClick={doPublish}>
                  {detail.draft ? 'Publish draft' : 'Publish'}
                </button>
                {detail.state === 'published' && (
                  <button type="button" className="btn-danger !px-4 !py-2 text-sm" disabled={busy} onClick={doUnpublish}>
                    Unpublish
                  </button>
                )}
                {detail.draft && (
                  <button type="button" className="btn-outline !px-4 !py-2 text-sm" disabled={busy} onClick={doDiscard}>
                    Discard draft
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Editing saves to a draft only. Published content stays live and unchanged until you press Publish.
              </p>
            </section>

            {preview && (
              <section className="glass-card !p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">Preview (admin only)</h3>
                  <button type="button" className="text-xs text-slate-500 underline" onClick={() => setPreview(null)}>
                    Hide
                  </button>
                </div>
                {preview.changed_fields.length === 0 ? (
                  <p className="text-sm text-slate-600">No draft changes — the preview equals the live content.</p>
                ) : (
                  <ul className="space-y-2">
                    {preview.changed_fields.map((k) => (
                      <li key={k} className="text-sm min-w-0">
                        <p className="font-semibold text-slate-700 break-words">{k.replace(/_/g, ' ')}</p>
                        <p className="text-slate-500 break-words line-through">{show(preview.live[k])}</p>
                        <p className="text-emerald-700 break-words">{show(preview.preview[k])}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  After publishing this will be {preview.state === 'published' ? 'live' : 'published and live'}.
                </p>
              </section>
            )}

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">Content</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{specs.map(renderField)}</div>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                Revision history <span className="text-xs font-normal text-slate-500">({detail.revision_count})</span>
              </h3>
              {revisions.length === 0 ? (
                <p className="text-sm text-slate-500">No tracked changes yet. The original content is captured automatically on the first change.</p>
              ) : (
                <ul className="space-y-2">
                  {revisions.map((r) => (
                    <li key={r.revision_no} className="glass-card !p-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">#{r.revision_no}</span>
                        <span className={`badge ${ACTION_STYLE[r.action] || 'bg-slate-100 text-slate-700'}`}>{r.action}</span>
                        <span className="text-sm text-slate-800">{r.changed_by_name}</span>
                        <time className="text-xs text-slate-500 sm:ml-auto">{formatWhen(r.created_at)}</time>
                      </div>
                      {r.note && <p className="text-sm text-slate-600 mt-1 break-words">“{r.note}”</p>}
                      {r.changed_fields.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 break-words">Changed: {r.changed_fields.join(', ')}</p>
                      )}
                      {r.restored_from && <p className="text-xs text-violet-700 mt-1">Restored from #{r.restored_from}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button type="button" className="text-xs underline text-slate-600" onClick={() => viewRevision(r.revision_no)}>
                          {openRev?.revision_no === r.revision_no ? 'Hide' : 'View'}
                        </button>
                        <button type="button" className="text-xs underline text-primary-700" disabled={busy} onClick={() => restore(r.revision_no, 'draft')}>
                          Load into draft
                        </button>
                        <button type="button" className="text-xs underline text-red-700" disabled={busy} onClick={() => restore(r.revision_no, 'live')}>
                          Restore live
                        </button>
                      </div>
                      {openRev?.revision_no === r.revision_no && (
                        <dl className="mt-2 text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(openRev.snapshot || {})
                            .filter(([, v]) => v !== null && v !== '')
                            .map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <dt className="font-semibold text-slate-600">{k.replace(/_/g, ' ')}</dt>
                                <dd className="text-slate-700 break-words">{show(v)}</dd>
                              </div>
                            ))}
                        </dl>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function AdminCmsPublishing() {
  const [tab, setTab] = useState('content');
  const [type, setType] = useState('service_item');
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [offset, setOffset] = useState(0);
  const [list, setList] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [history, setHistory] = useState({ items: [], total: 0 });
  const [hAction, setHAction] = useState('');
  const [hType, setHType] = useState('');
  const [hOffset, setHOffset] = useState(0);
  const [hLoading, setHLoading] = useState(false);

  const LIMIT = 20;

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.cmsList(type, { q: q || undefined, state: state || undefined, limit: LIMIT, offset });
      setList(res.data || { items: [], total: 0 });
    } catch (e) {
      toast.error(e.message || 'Could not load content');
    } finally {
      setLoading(false);
    }
  }, [type, q, state, offset]);

  useEffect(() => {
    document.title = 'Publishing & History | The Urban Physio Admin';
  }, []);

  useEffect(() => {
    const t = setTimeout(loadList, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, q]);

  const loadHistory = useCallback(async () => {
    setHLoading(true);
    try {
      const res = await admin.cmsHistory({ entity_type: hType || undefined, action: hAction || undefined, limit: LIMIT, offset: hOffset });
      setHistory(res.data || { items: [], total: 0 });
    } catch (e) {
      toast.error(e.message || 'Could not load history');
    } finally {
      setHLoading(false);
    }
  }, [hType, hAction, hOffset]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const closePanel = useCallback(() => setSelected(null), []);
  const onChanged = useCallback(() => {
    loadList();
    if (tab === 'history') loadHistory();
  }, [loadList, loadHistory, tab]);

  const pager = (total, off, setOff) => (
    <div className="flex items-center justify-between gap-2 mt-4 text-sm text-slate-600">
      <span>
        {total === 0 ? 0 : off + 1}–{Math.min(off + LIMIT, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-outline !px-3 !py-1.5 text-sm" disabled={off === 0} onClick={() => setOff(Math.max(0, off - LIMIT))}>
          Previous
        </button>
        <button type="button" className="btn-outline !px-3 !py-1.5 text-sm" disabled={off + LIMIT >= total} onClick={() => setOff(off + LIMIT)}>
          Next
        </button>
      </div>
    </div>
  );

  return (
    <AdminDashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Publishing &amp; History</h1>
        <p className="text-slate-600 text-sm mt-1">
          Edit as a draft, preview, then publish. Published content stays live while a draft is being edited, and every change is recorded.
        </p>
      </div>

      <div className="flex gap-2 mb-4" role="tablist">
        {[
          ['content', 'Content'],
          ['history', 'Change history'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === k ? 'bg-primary-600 text-white' : 'bg-white/70 text-slate-700 border border-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {TYPE_TABS.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  setType(t.type);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-full text-sm ${type === t.type ? 'bg-slate-900 text-white' : 'bg-white/70 text-slate-700 border border-slate-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input
              className="input-field sm:col-span-2 min-w-0"
              placeholder="Search title or slug"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOffset(0);
              }}
              aria-label="Search"
            />
            <select
              className="input-field"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setOffset(0);
              }}
              aria-label="Filter by state"
            >
              <option value="">All states</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card h-16 animate-pulse" />
              ))}
            </div>
          ) : list.items.length === 0 ? (
            <div className="glass-card text-center py-10 px-6">
              <FaIcon icon="fa-file-circle-question" className="text-4xl text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">Nothing matches.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {list.items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => setSelected({ type, id: it.id })}
                    className="glass-card !p-3 w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 border border-white/80 hover:border-primary-300"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 break-words">{it.title}</p>
                      <p className="text-xs text-slate-500 font-mono break-all">
                        #{it.id} · {it.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StateBadge state={it.state} />
                      {it.has_draft && <span className="badge bg-sky-100 text-sky-800">Draft changes</span>}
                      <time className="text-xs text-slate-500">{formatWhen(it.updated_at)}</time>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pager(list.total, offset, setOffset)}
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <select
              className="input-field"
              value={hType}
              onChange={(e) => {
                setHType(e.target.value);
                setHOffset(0);
              }}
              aria-label="Filter by content type"
            >
              <option value="">All content types</option>
              {TYPE_TABS.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={hAction}
              onChange={(e) => {
                setHAction(e.target.value);
                setHOffset(0);
              }}
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {['publish', 'unpublish', 'update', 'restore', 'baseline'].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {hLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card h-16 animate-pulse" />
              ))}
            </div>
          ) : history.items.length === 0 ? (
            <div className="glass-card text-center py-10 px-6">
              <FaIcon icon="fa-clock-rotate-left" className="text-4xl text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">No changes recorded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.items.map((h) => (
                <li key={`${h.entity_type}-${h.entity_id}-${h.revision_no}`}>
                  <button
                    type="button"
                    onClick={() => setSelected({ type: h.entity_type, id: h.entity_id })}
                    className="glass-card !p-3 w-full text-left border border-white/80 hover:border-primary-300 min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${ACTION_STYLE[h.action] || 'bg-slate-100 text-slate-700'}`}>{h.action}</span>
                      <span className="text-sm font-semibold text-slate-900">{h.changed_by_name}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {h.entity_type.replace('service_', '')} #{h.entity_id} · rev {h.revision_no}
                      </span>
                      <time className="text-xs text-slate-500 sm:ml-auto">{formatWhen(h.created_at)}</time>
                    </div>
                    {h.note && <p className="text-sm text-slate-600 mt-1 break-words">“{h.note}”</p>}
                    {h.changed_fields.length > 0 && <p className="text-xs text-slate-500 mt-1 break-words">Changed: {h.changed_fields.join(', ')}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pager(history.total, hOffset, setHOffset)}
        </>
      )}

      {/* Portal: <main> is animated (own stacking context), so the slide-over must live on <body> to sit above the fixed site header. */}
      {selected && createPortal(
        <EntityPanel type={selected.type} id={selected.id} onClose={closePanel} onChanged={onChanged} />,
        document.body
      )}
    </AdminDashboardLayout>
  );
}
