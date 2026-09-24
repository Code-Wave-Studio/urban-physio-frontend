import { useState } from 'react';
import FaIcon from './FaIcon';
import { downloadAuthenticatedFile, openAuthenticatedFile } from '../utils/downloadFile';

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fileIcon(mime) {
  if (mime?.includes('pdf')) return 'fa-file-pdf';
  if (mime?.startsWith('image/')) return 'fa-file-image';
  return 'fa-file';
}

/** Patient medical reports list with optional upload / delete. */
export default function PatientReportsPanel({
  reports = [],
  loading = false,
  canUpload = false,
  canDelete = false,
  onUpload,
  onDelete,
  onRefresh,
  emptyHint = 'No reports uploaded yet.',
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !onUpload) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title.trim() || file.name);
    fd.append('description', description.trim());
    setUploading(true);
    try {
      await onUpload(fd);
      setTitle('');
      setDescription('');
      setFile(null);
      e.target.reset();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!onDelete || !window.confirm('Delete this report permanently?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canUpload && onUpload && (
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-dashed border-primary-300/60 bg-primary-50/40 p-4 md:p-5 space-y-3"
        >
          <p className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <FaIcon icon="fa-cloud-arrow-up" className="text-primary-600" />
            Upload medical report
          </p>
          <p className="text-xs text-slate-500">PDF, JPG, PNG or WebP · max 10MB · multiple files allowed</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input-field text-sm"
              placeholder="Report title (e.g. MRI lumbar spine)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="flex items-center justify-center gap-2 input-field cursor-pointer text-sm text-slate-600 hover:border-primary-400">
              <FaIcon icon="fa-paperclip" />
              {file ? file.name : 'Choose file'}
              <input
                type="file"
                className="sr-only"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </label>
          </div>
          <textarea
            className="input-field text-sm"
            rows={2}
            placeholder="Optional notes for your doctor…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" disabled={uploading || !file} className="btn-primary text-sm">
            {uploading ? 'Uploading…' : 'Upload report'}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </p>
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="text-xs text-primary-600 font-medium hover:underline">
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
          <FaIcon icon="fa-folder-open" className="text-2xl text-slate-300 mb-2" />
          {emptyHint}
        </div>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 md:p-4 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <FaIcon icon={fileIcon(r.mime_type)} className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{r.title}</p>
                <p className="text-xs text-slate-500 truncate">{r.file_name}</p>
                {r.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.description}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {formatDate(r.uploaded_at)} · {formatSize(r.file_size)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
                  onClick={() => openAuthenticatedFile(`/patient-reports/${r.id}/download`)}
                >
                  <FaIcon icon="fa-eye" />
                  View
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
                  onClick={() =>
                    downloadAuthenticatedFile(`/patient-reports/${r.id}/download`, r.file_name || 'report')
                  }
                >
                  <FaIcon icon="fa-download" />
                  Download
                </button>
                {canDelete && onDelete && (
                  <button
                    type="button"
                    disabled={deletingId === r.id}
                    className="text-xs !py-1.5 !px-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(r.id)}
                  >
                    <FaIcon icon="fa-trash" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
