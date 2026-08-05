import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { useAuth } from '../../contexts/AuthContext';
import { documents } from '../../services/api';
import {
  DATE_FILTERS,
  DOCUMENT_CATEGORIES,
  TYPE_FILTERS,
  getPrescriptionPreviewUrl,
  isPrescriptionDoc,
  saveBlob,
} from '../../constants/documents';
import DocumentCard from './DocumentCard';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import DocumentEditModal from './DocumentEditModal';
import DocumentShareModal from './DocumentShareModal';
import SharedDocumentsView from './SharedDocumentsView';

export default function DocumentsManager({ initialFilters = {} }) {
  const { user } = useAuth();
  const role = user?.role_slug || 'patient';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isStaff = isAdmin || role === 'doctor' || role === 'clinic' || role === 'clinic_staff';

  const [tab, setTab] = useState(initialFilters.tab || 'all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    category: '',
    type: '',
    range: '',
    status: '',
    ...initialFilters,
  });
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 350);
    return () => clearTimeout(t);
  }, [filters.q]);

  const load = useCallback(() => {
    if (tab === 'shared') return; // SharedDocumentsView manages its own query
    setLoading(true);
    const params = {};
    if (debouncedQ) params.q = debouncedQ;
    if (filters.category) params.category = filters.category;
    if (filters.type) params.type = filters.type;
    if (filters.range) params.range = filters.range;
    if (filters.status) params.status = filters.status;
    if (initialFilters.appointment_id) params.appointment_id = initialFilters.appointment_id;
    if (initialFilters.patient_id) params.patient_id = initialFilters.patient_id;
    documents
      .list(params)
      .then((res) => setItems(res.data?.items || []))
      .catch((e) => toast.error(e.message || 'Could not load documents'))
      .finally(() => setLoading(false));
  }, [tab, debouncedQ, filters.category, filters.type, filters.range, filters.status, initialFilters.appointment_id, initialFilters.patient_id]);

  useEffect(() => {
    load();
  }, [load]);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const canModify = (doc) =>
    doc.can_modify === true || isAdmin || (user && Number(doc.uploaded_by) === Number(user.id));
  const canDelete = (doc) =>
    doc.can_delete === true || isAdmin || (user && Number(doc.uploaded_by) === Number(user.id));
  const canShare = (doc) =>
    doc.can_share === true || (isStaff && canModify(doc));
  const canDownload = (doc) =>
    doc.can_download !== false && !(doc.is_view_only && !canModify(doc));

  const toggleSelect = (doc) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(doc.id)) next.delete(doc.id);
      else next.add(doc.id);
      return next;
    });
  };

  const openDoc = (doc) => setPreviewDoc(doc);

  const downloadDoc = async (doc) => {
    if (isPrescriptionDoc(doc)) {
      const previewUrl = getPrescriptionPreviewUrl(doc);
      window.open(previewUrl, '_blank', 'noopener');
      return;
    }
    if (!canDownload(doc) && doc.source !== 'link') {
      toast.error('This document is view-only');
      return;
    }
    if (doc.source === 'link') {
      window.open(doc.file_url, '_blank', 'noopener');
      return;
    }
    try {
      const blob = await documents.downloadBlob(doc.id);
      saveBlob(blob, doc.file_name || doc.title);
    } catch (e) {
      toast.error(e.message || 'Download failed');
    }
  };

  const archiveDoc = async (doc) => {
    try {
      await documents.archive(doc.id);
      toast.success('Archived');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const restoreDoc = async (doc) => {
    try {
      await documents.restore(doc.id);
      toast.success('Restored');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This can be restored by an admin.`)) return;
    try {
      await documents.remove(doc.id);
      toast.success('Deleted');
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
      load();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const bulkDownload = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const blob = await documents.bulkDownloadBlob(ids);
      saveBlob(blob, `documents_${Date.now()}.zip`);
    } catch (e) {
      toast.error(e.message || 'Bulk download failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const activeCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  return (
    <div>
      {/* Top Tab Bar for Doctor, Clinic & Admin */}
      {isStaff && (
        <div className="flex items-center gap-2 mb-5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
              tab === 'all'
                ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <FaIcon icon="fa-folder" /> All Documents
          </button>
          <button
            type="button"
            onClick={() => setTab('shared')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
              tab === 'shared'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <FaIcon icon="fa-share-nodes" /> Shared Documents
          </button>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'shared' ? (
        <SharedDocumentsView
          filters={filters}
          setF={setF}
          onOpenPreview={openDoc}
          onOpenEdit={setEditDoc}
          onDeleteDoc={deleteDoc}
          onDownloadDoc={downloadDoc}
          onUploadClick={() => setUploadOpen(true)}
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                value={filters.q}
                onChange={(e) => setF('q', e.target.value)}
                placeholder="Search by title, tag, patient, doctor, category…"
                className="doc-input !pl-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {[
                  { key: 'grid', icon: 'fa-table-cells-large' },
                  { key: 'list', icon: 'fa-list' },
                ].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setView(v.key)}
                    className={`w-9 h-8 rounded-lg text-sm transition ${
                      view === v.key ? 'bg-white shadow text-primary-700' : 'text-slate-500'
                    }`}
                    aria-label={`${v.key} view`}
                  >
                    <FaIcon icon={v.icon} />
                  </button>
                ))}
              </div>
              {selected.size > 0 && (
                <button type="button" onClick={bulkDownload} disabled={bulkBusy} className="btn-outline !py-2 !px-3">
                  {bulkBusy ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : <FaIcon icon="fa-download" className="mr-1.5" />}
                  {selected.size} selected
                </button>
              )}
              <button type="button" onClick={() => setUploadOpen(true)} className="btn-primary !py-2 !px-4">
                <FaIcon icon="fa-plus" className="mr-1.5" /> Add
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select className="doc-input !w-auto !py-1.5 text-sm" value={filters.type} onChange={(e) => setF('type', e.target.value)}>
              {TYPE_FILTERS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <select className="doc-input !w-auto !py-1.5 text-sm" value={filters.range} onChange={(e) => setF('range', e.target.value)}>
              {DATE_FILTERS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            <select className="doc-input !w-auto !py-1.5 text-sm" value={filters.status} onChange={(e) => setF('status', e.target.value)}>
              <option value="">Active &amp; drafts</option>
              <option value="active">Active</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({ q: '', category: '', type: '', range: '', status: '' })}
                className="text-sm text-slate-500 hover:text-primary-600 ml-1"
              >
                <FaIcon icon="fa-xmark" className="mr-1" /> Clear
              </button>
            )}
          </div>

          {/* Category chips (folder view) */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scroll-x-hide">
            <button
              type="button"
              onClick={() => setF('category', '')}
              className={`doc-chip ${!filters.category ? 'doc-chip--active' : 'doc-chip--idle'}`}
            >
              <FaIcon icon="fa-layer-group" /> All
            </button>
            {DOCUMENT_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setF('category', filters.category === c.key ? '' : c.key)}
                className={`doc-chip ${filters.category === c.key ? 'doc-chip--active' : 'doc-chip--idle'}`}
              >
                <FaIcon icon={c.icon} /> {c.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2'}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <FaIcon icon="fa-folder-open" className="text-4xl text-slate-300" />
              <p className="mt-3 text-slate-600 font-medium">No documents found</p>
              <p className="text-sm text-slate-400 mt-1">Upload files or save a link to get started.</p>
              <button type="button" onClick={() => setUploadOpen(true)} className="btn-primary mt-4">
                <FaIcon icon="fa-plus" className="mr-1.5" /> Add document
              </button>
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2'}>
              {items.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  view={view}
                  selected={selected.has(doc.id)}
                  onSelect={doc.source !== 'link' && canDownload(doc) ? toggleSelect : undefined}
                  onOpen={openDoc}
                  onDownload={downloadDoc}
                  onEdit={setEditDoc}
                  onShare={setShareDoc}
                  onArchive={archiveDoc}
                  onRestore={restoreDoc}
                  onDelete={deleteDoc}
                  canModify={canModify(doc)}
                  canDelete={canDelete(doc)}
                  canShare={canShare(doc)}
                  canDownload={canDownload(doc)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={load}
        canTargetPatient={isStaff}
        defaults={initialFilters}
      />
      <DocumentPreviewModal
        open={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onChanged={load}
        canModify={previewDoc ? canModify(previewDoc) : false}
        canDownload={previewDoc ? canDownload(previewDoc) : false}
      />
      <DocumentEditModal
        open={!!editDoc}
        doc={editDoc}
        onClose={() => setEditDoc(null)}
        onSaved={load}
      />
      <DocumentShareModal
        open={!!shareDoc}
        doc={shareDoc}
        onClose={() => setShareDoc(null)}
        onShared={load}
      />
    </div>
  );
}
