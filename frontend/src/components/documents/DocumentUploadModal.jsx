import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalHeader, GlassModalBody, GlassModalFooter } from '../GlassModal';
import FaIcon from '../FaIcon';
import { documents } from '../../services/api';
import SearchablePatientSelect from './SearchablePatientSelect';
import {
  ACCEPT_ATTR,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  EXT_GROUP,
  LINK_TYPES,
  MAX_UPLOAD_BYTES,
  compressImage,
  fileGroup,
  formatBytes,
} from '../../constants/documents';

const GROUP_ICON = {
  pdf: 'fa-file-pdf', word: 'fa-file-word', excel: 'fa-file-excel',
  ppt: 'fa-file-powerpoint', image: 'fa-file-image', archive: 'fa-file-zipper', text: 'fa-file-lines',
};

function extOf(name) {
  return (name.split('.').pop() || '').toLowerCase();
}

export default function DocumentUploadModal({
  open,
  onClose,
  onUploaded,
  canTargetPatient = false,
  defaults = {},
}) {
  const [mode, setMode] = useState('file'); // file | link
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({});
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    category: defaults.category || 'other',
    description: '',
    tags: '',
    status: 'active',
    expiry_date: '',
    is_view_only: false,
    patient_id: defaults.patient_id || '',
    appointment_id: defaults.appointment_id || '',
  });
  const [linkType, setLinkType] = useState('gdrive');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    const accepted = [];
    for (const f of incoming) {
      const ext = extOf(f.name);
      if (!EXT_GROUP[ext]) {
        toast.error(`${f.name}: unsupported type`);
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        toast.error(`${f.name}: exceeds ${Math.round(MAX_UPLOAD_BYTES / 1048576)}MB`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const reset = () => {
    setFiles([]);
    setProgress({});
    setLinkUrl('');
    setLinkTitle('');
  };

  const commonFields = (fd) => {
    fd.append('category', form.category);
    if (form.description) fd.append('description', form.description);
    if (form.tags) fd.append('tags', form.tags);
    fd.append('status', form.status);
    if (form.expiry_date) fd.append('expiry_date', form.expiry_date);
    if (form.is_view_only) fd.append('is_view_only', '1');
    if (canTargetPatient && form.patient_id) fd.append('patient_id', String(form.patient_id));
    if (form.appointment_id) fd.append('appointment_id', String(form.appointment_id));
  };

  const submit = async () => {
    if (mode === 'link') {
      if (!linkUrl.trim()) {
        toast.error('Enter a link URL');
        return;
      }
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('source', 'link');
        fd.append('link_type', linkType);
        fd.append('link_url', linkUrl.trim());
        if (linkTitle.trim()) fd.append('title', linkTitle.trim());
        commonFields(fd);
        await documents.create(fd);
        toast.success('Link saved');
        reset();
        onUploaded?.();
        onClose();
      } catch (e) {
        toast.error(e.message || 'Could not save link');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!files.length) {
      toast.error('Add at least one file');
      return;
    }
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < files.length; i += 1) {
      let file = files[i];
      try {
        if (fileGroup({ file_ext: extOf(file.name) }) === 'image') {
          file = await compressImage(file);
        }
        const fd = new FormData();
        fd.append('file', file);
        // title auto-derived server-side from filename per file
        commonFields(fd);
        // eslint-disable-next-line no-await-in-loop
        await documents.create(fd, (evt) => {
          if (evt.total) {
            setProgress((p) => ({ ...p, [i]: Math.round((evt.loaded / evt.total) * 100) }));
          }
        });
        ok += 1;
        setProgress((p) => ({ ...p, [i]: 100 }));
      } catch (e) {
        toast.error(`${file.name}: ${e.message || 'upload failed'}`);
      }
    }
    setBusy(false);
    if (ok > 0) {
      toast.success(`${ok} document${ok > 1 ? 's' : ''} uploaded`);
      reset();
      onUploaded?.();
      onClose();
    }
  };

  return (
    <GlassModal open={open} onClose={busy ? () => {} : onClose} size="lg" preventClose={busy}>
      <GlassModalHeader
        title="Add documents"
        subtitle="Upload files or save an external link"
        icon="fa-cloud-arrow-up"
        onClose={busy ? undefined : onClose}
      />
      <GlassModalBody>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-4">
          {['file', 'link'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                mode === m ? 'bg-white shadow text-primary-700' : 'text-slate-500'
              }`}
            >
              <FaIcon icon={m === 'file' ? 'fa-file-arrow-up' : 'fa-link'} className="mr-1.5" />
              {m === 'file' ? 'Upload files' : 'External link'}
            </button>
          ))}
        </div>

        {mode === 'file' ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragging ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-300 bg-slate-50/60'
              }`}
            >
              <FaIcon icon="fa-cloud-arrow-up" className="text-3xl text-primary-500" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                Drag &amp; drop files here, or <span className="text-primary-600">browse</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                PDF, Word, Excel, PPT, Images, ZIP, TXT, CSV — up to {Math.round(MAX_UPLOAD_BYTES / 1048576)}MB each
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </button>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => {
                  const g = EXT_GROUP[extOf(f.name)] || 'text';
                  return (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5">
                      <FaIcon icon={GROUP_ICON[g] || 'fa-file'} className="text-lg text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 truncate">{f.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{formatBytes(f.size)}</span>
                          {progress[i] != null && (
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 transition-all" style={{ width: `${progress[i]}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                      {!busy && (
                        <button type="button" onClick={() => removeFile(i)} className="doc-action doc-action--danger">
                          <FaIcon icon="fa-xmark" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="doc-label">Link type</label>
              <div className="flex flex-wrap gap-2">
                {LINK_TYPES.map((lt) => (
                  <button
                    key={lt.key}
                    type="button"
                    onClick={() => setLinkType(lt.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      linkType === lt.key ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <FaIcon icon={lt.icon} className="mr-1.5" />
                    {lt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="doc-label">Title</label>
              <input className="doc-input" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="e.g. Shared MRI folder" />
            </div>
            <div>
              <label className="doc-label">Link URL</label>
              <input className="doc-input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="doc-label">Category</label>
            <select className="doc-input" value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="doc-label">Status</label>
            <select className="doc-input" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {DOCUMENT_STATUSES.filter((s) => s.key !== 'archived').map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          {canTargetPatient && (
            <div>
              <SearchablePatientSelect
                value={form.patient_id}
                onChange={(pid) => setField('patient_id', pid)}
                label="Link to Patient (optional)"
              />
            </div>
          )}
          <div>
            <label className="doc-label">Expiry date (optional)</label>
            <input type="date" className="doc-input" value={form.expiry_date} onChange={(e) => setField('expiry_date', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="doc-label">Tags (comma separated)</label>
            <input className="doc-input" value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="knee, post-op, 2026" />
          </div>
          <div className="sm:col-span-2">
            <label className="doc-label">Description (optional)</label>
            <textarea className="doc-input" rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.is_view_only} onChange={(e) => setField('is_view_only', e.target.checked)} />
            View-only (discourage downloads for patients)
          </label>
        </div>
      </GlassModalBody>
      <GlassModalFooter>
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={busy} className="btn-primary">
          {busy ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : <FaIcon icon="fa-check" className="mr-1.5" />}
          {mode === 'link' ? 'Save link' : `Upload ${files.length || ''}`.trim()}
        </button>
      </GlassModalFooter>
    </GlassModal>
  );
}
