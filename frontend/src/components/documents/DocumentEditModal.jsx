import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalHeader, GlassModalBody, GlassModalFooter } from '../GlassModal';
import FaIcon from '../FaIcon';
import { documents } from '../../services/api';
import { ACCEPT_ATTR, DOCUMENT_CATEGORIES, DOCUMENT_STATUSES } from '../../constants/documents';
import SearchablePatientSelect from './SearchablePatientSelect';

export default function DocumentEditModal({ open, doc, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (doc) {
      setForm({
        title: doc.title || '',
        description: doc.description || '',
        category: doc.category || 'other',
        status: doc.status || 'active',
        tags: (doc.tags || []).join(', '),
        expiry_date: doc.expiry_date || '',
        is_view_only: !!doc.is_view_only,
        patient_id: doc.patient_id || '',
      });
    }
  }, [doc]);

  if (!doc) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await documents.update(doc.id, {
        ...form,
        tags: form.tags,
        is_view_only: form.is_view_only ? 1 : 0,
      });
      toast.success('Document updated');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const replace = async (file) => {
    if (!file) return;
    setReplacing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await documents.replace(doc.id, fd);
      toast.success('New version uploaded');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Replace failed');
    } finally {
      setReplacing(false);
    }
  };

  return (
    <GlassModal open={open} onClose={busy ? () => {} : onClose} size="lg" preventClose={busy}>
      <GlassModalHeader title="Edit document" icon="fa-pen" onClose={busy ? undefined : onClose} />
      <GlassModalBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="doc-label">Title</label>
            <input className="doc-input" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="doc-label">Category</label>
            <select className="doc-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="doc-label">Status</label>
            <select className="doc-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="doc-label">Expiry date</label>
            <input type="date" className="doc-input" value={form.expiry_date || ''} onChange={(e) => set('expiry_date', e.target.value)} />
          </div>
          <div>
            <label className="doc-label">Tags (comma separated)</label>
            <input className="doc-input" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <SearchablePatientSelect
              value={form.patient_id}
              onChange={(pid) => set('patient_id', pid)}
              label="Linked Patient"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="doc-label">Description</label>
            <textarea className="doc-input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.is_view_only} onChange={(e) => set('is_view_only', e.target.checked)} />
            View-only
          </label>
        </div>

        {doc.source !== 'link' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="doc-label">Replace file (creates a new version)</p>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={replacing} className="btn-outline">
              {replacing ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : <FaIcon icon="fa-upload" className="mr-1.5" />}
              Upload new version
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                replace(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        )}
      </GlassModalBody>
      <GlassModalFooter>
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline">Cancel</button>
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : <FaIcon icon="fa-check" className="mr-1.5" />}
          Save changes
        </button>
      </GlassModalFooter>
    </GlassModal>
  );
}
