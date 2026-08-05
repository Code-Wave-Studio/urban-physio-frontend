import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalHeader, GlassModalBody, GlassModalFooter } from '../GlassModal';
import FaIcon from '../FaIcon';
import { documents } from '../../services/api';
import {
  CATEGORY_LABELS,
  fileColor,
  fileIcon,
  formatBytes,
  isImage,
  isOffice,
  isPdf,
  officeViewerUrl,
  saveBlob,
  youtubeEmbed,
} from '../../constants/documents';

const ACTION_ICON = {
  uploaded: 'fa-cloud-arrow-up',
  edited: 'fa-pen',
  downloaded: 'fa-download',
  viewed: 'fa-eye',
  shared: 'fa-share-nodes',
  deleted: 'fa-trash',
  restored: 'fa-rotate-left',
  archived: 'fa-box-archive',
  replaced: 'fa-code-branch',
};

function fmtDateTime(d) {
  if (!d) return '';
  const dt = new Date((d || '').replace(' ', 'T'));
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString();
}

function Preview({ doc }) {
  if (doc.source === 'link') {
    const yt = doc.link_type === 'youtube' ? youtubeEmbed(doc.file_url) : null;
    if (yt) {
      return <iframe title="preview" src={yt} className="w-full h-full rounded-xl" allowFullScreen />;
    }
    const isDocPreview =
      doc.category === 'prescription' ||
      doc.category === 'prescriptions' ||
      doc.link_type === 'document' ||
      (typeof doc.file_url === 'string' && (doc.file_url.includes('/prescriptions/preview') || doc.file_url.includes('/preview')));

    if (isDocPreview) {
      return <iframe title="preview" src={doc.file_url} className="w-full h-full rounded-xl bg-white min-h-[500px] border-0" allowFullScreen />;
    }
    return (
      <div className="text-center p-8">
        <FaIcon icon={fileIcon(doc)} className="text-5xl text-teal-500" />
        <p className="mt-3 text-sm text-slate-600 break-all">{doc.file_url}</p>
        <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-flex">
          <FaIcon icon="fa-arrow-up-right-from-square" className="mr-1.5" /> Open link
        </a>
      </div>
    );
  }
  if (isImage(doc)) {
    return <img src={doc.file_url} alt={doc.title} className="max-h-full max-w-full mx-auto object-contain rounded-xl" />;
  }
  if (isPdf(doc)) {
    return <iframe title="preview" src={doc.file_url} className="w-full h-full rounded-xl bg-white" />;
  }
  if (isOffice(doc)) {
    return <iframe title="preview" src={officeViewerUrl(doc.file_url)} className="w-full h-full rounded-xl bg-white" />;
  }
  return (
    <div className="text-center p-8">
      <FaIcon icon={fileIcon(doc)} className={`text-5xl ${fileColor(doc)}`} />
      <p className="mt-3 text-sm text-slate-500">Preview not available for this file type.</p>
      <p className="text-xs text-slate-400 mt-1">Download the file to view it.</p>
    </div>
  );
}

export default function DocumentPreviewModal({ open, doc, onClose, onChanged, canModify = false, canDownload = true }) {
  const [tab, setTab] = useState('preview');
  const [versions, setVersions] = useState(null);
  const [activity, setActivity] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('preview');
    setVersions(null);
    setActivity(null);
  }, [open, doc?.id]);

  useEffect(() => {
    if (!open || !doc) return;
    if (tab === 'versions' && versions == null) {
      documents.versions(doc.id).then((r) => setVersions(r.data || [])).catch(() => setVersions([]));
    }
    if (tab === 'activity' && activity == null) {
      documents.activity(doc.id).then((r) => setActivity(r.data || [])).catch(() => setActivity([]));
    }
  }, [tab, open, doc, versions, activity]);

  if (!doc) return null;

  const download = async () => {
    if (doc.source === 'link') {
      window.open(doc.file_url, '_blank', 'noopener');
      return;
    }
    if (!canDownload) {
      toast.error('This document is view-only');
      return;
    }
    setDownloading(true);
    try {
      const blob = await documents.downloadBlob(doc.id);
      saveBlob(blob, doc.file_name || doc.title);
      onChanged?.();
    } catch (e) {
      toast.error(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const tabs = [
    { key: 'preview', label: 'Preview', icon: 'fa-eye' },
    { key: 'details', label: 'Details', icon: 'fa-circle-info' },
    { key: 'versions', label: 'Versions', icon: 'fa-code-branch' },
    { key: 'activity', label: 'Activity', icon: 'fa-clock-rotate-left' },
  ];

  return (
    <GlassModal open={open} onClose={onClose} size="xl" panelClassName="!max-h-[92dvh]">
      <GlassModalHeader
        title={doc.title}
        subtitle={CATEGORY_LABELS[doc.category] || 'Other'}
        icon={fileIcon(doc)}
        onClose={onClose}
      />
      <div className="px-5 md:px-6 pt-3 shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <FaIcon icon={t.icon} className="mr-1.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <GlassModalBody>
        {tab === 'preview' && (
          <div className="h-[55vh] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
            <Preview doc={doc} />
          </div>
        )}

        {tab === 'details' && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {doc.description && (
              <div className="sm:col-span-2">
                <dt className="doc-label">Description</dt>
                <dd className="text-slate-700">{doc.description}</dd>
              </div>
            )}
            <Detail label="Category" value={CATEGORY_LABELS[doc.category] || 'Other'} />
            <Detail label="Status" value={doc.status} />
            <Detail label="Patient" value={doc.patient_name} />
            <Detail label="Doctor" value={doc.doctor_name} />
            <Detail label="Clinic" value={doc.clinic_name} />
            <Detail label="Uploaded by" value={doc.uploaded_by_name} />
            <Detail label="Version" value={`v${doc.version}`} />
            {doc.source !== 'link' && <Detail label="File size" value={formatBytes(doc.file_size)} />}
            {doc.source !== 'link' && <Detail label="File type" value={(doc.file_ext || '').toUpperCase()} />}
            <Detail label="Uploaded" value={fmtDateTime(doc.created_at)} />
            <Detail label="Edited" value={fmtDateTime(doc.updated_at)} />
            {doc.expiry_date && <Detail label="Expiry" value={doc.expiry_date} />}
            {doc.tags?.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="doc-label">Tags</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {doc.tags.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">#{t}</span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}

        {tab === 'versions' && (
          <div className="space-y-2">
            {versions == null ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400">No version history.</p>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                  <FaIcon icon={fileIcon(v)} className={`text-lg ${fileColor(v)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      Version {v.version} {v.is_current && <span className="text-[10px] text-emerald-600 ml-1">current</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(v.file_size)} · {fmtDateTime(v.created_at)} · {v.uploaded_by_name || '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-2">
            {activity == null ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <FaIcon icon={ACTION_ICON[a.action] || 'fa-circle'} className="text-xs" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium capitalize">{a.action}</span>
                      {a.user_name ? ` by ${a.user_name}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400">{fmtDateTime(a.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </GlassModalBody>

      <GlassModalFooter>
        <button type="button" onClick={onClose} className="btn-outline">Close</button>
        {(doc.source === 'link' || canDownload) && (
          <button type="button" onClick={download} disabled={downloading} className="btn-primary">
            {downloading ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : (
              <FaIcon icon={doc.source === 'link' ? 'fa-arrow-up-right-from-square' : 'fa-download'} className="mr-1.5" />
            )}
            {doc.source === 'link' ? 'Open link' : 'Download'}
          </button>
        )}
        {!canDownload && doc.source !== 'link' && (
          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">View only — download disabled</span>
        )}
      </GlassModalFooter>
    </GlassModal>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="doc-label">{label}</dt>
      <dd className="text-slate-700 capitalize break-words">{value}</dd>
    </div>
  );
}
