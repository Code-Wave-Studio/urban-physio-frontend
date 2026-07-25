import FaIcon from '../FaIcon';
import { CATEGORY_LABELS, fileColor, fileIcon, formatBytes } from '../../constants/documents';

const STATUS_BADGE = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date((d || '').replace(' ', 'T'));
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DocumentCard({
  doc,
  view = 'grid',
  selected = false,
  onSelect,
  onOpen,
  onDownload,
  onEdit,
  onShare,
  onArchive,
  onRestore,
  onDelete,
  canModify = false,
  canDelete = false,
  canShare = false,
  canDownload = true,
}) {
  const icon = fileIcon(doc);
  const color = fileColor(doc);
  const isLink = doc.source === 'link';

  const meta = (
    <>
      {doc.patient_name && (
        <span className="inline-flex items-center gap-1">
          <FaIcon icon="fa-user" className="opacity-60" /> {doc.patient_name}
        </span>
      )}
      {doc.doctor_name && (
        <span className="inline-flex items-center gap-1">
          <FaIcon icon="fa-user-doctor" className="opacity-60" /> {doc.doctor_name}
        </span>
      )}
      {!isLink && <span>{formatBytes(doc.file_size)}</span>}
      <span>{fmtDate(doc.created_at)}</span>
      {doc.version > 1 && <span className="text-primary-600 font-medium">v{doc.version}</span>}
      {doc.is_view_only && (
        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
          View only
        </span>
      )}
    </>
  );

  const actions = (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onOpen(doc)} className="doc-action" title="Preview">
        <FaIcon icon="fa-eye" />
      </button>
      {(isLink || canDownload) && (
        <button type="button" onClick={() => onDownload(doc)} className="doc-action" title={isLink ? 'Open link' : 'Download'}>
          <FaIcon icon={isLink ? 'fa-arrow-up-right-from-square' : 'fa-download'} />
        </button>
      )}
      {canShare && (
        <button type="button" onClick={() => onShare?.(doc)} className="doc-action" title="Share">
          <FaIcon icon="fa-share-nodes" />
        </button>
      )}
      {canModify && (
        <button type="button" onClick={() => onEdit(doc)} className="doc-action" title="Edit">
          <FaIcon icon="fa-pen" />
        </button>
      )}
      {canModify && doc.status !== 'archived' && (
        <button type="button" onClick={() => onArchive(doc)} className="doc-action" title="Archive">
          <FaIcon icon="fa-box-archive" />
        </button>
      )}
      {canModify && doc.status === 'archived' && (
        <button type="button" onClick={() => onRestore(doc)} className="doc-action" title="Restore">
          <FaIcon icon="fa-rotate-left" />
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={() => onDelete(doc)} className="doc-action doc-action--danger" title="Delete">
          <FaIcon icon="fa-trash" />
        </button>
      )}
    </div>
  );

  if (view === 'list') {
    return (
      <div className={`doc-row group ${selected ? 'doc-row--selected' : ''}`}>
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(doc)}
            className="doc-checkbox"
            aria-label="Select document"
          />
        )}
        <button type="button" onClick={() => onOpen(doc)} className={`text-2xl shrink-0 ${color}`}>
          <FaIcon icon={icon} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => onOpen(doc)} className="font-semibold text-slate-800 truncate hover:text-primary-600 text-left">
              {doc.title}
            </button>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[doc.status] || STATUS_BADGE.active}`}>
              {doc.status}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 mt-0.5">
            <span className="text-primary-600 font-medium">{CATEGORY_LABELS[doc.category] || 'Other'}</span>
            {meta}
          </div>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className={`doc-card group ${selected ? 'doc-card--selected' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onOpen(doc)} className={`text-3xl ${color}`}>
          <FaIcon icon={icon} />
        </button>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[doc.status] || STATUS_BADGE.active}`}>
            {doc.status}
          </span>
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(doc)}
              className="doc-checkbox"
              aria-label="Select document"
            />
          )}
        </div>
      </div>

      <button type="button" onClick={() => onOpen(doc)} className="block text-left mt-3 w-full">
        <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary-600">{doc.title}</h3>
      </button>
      <p className="text-[11px] text-primary-600 font-medium mt-1">{CATEGORY_LABELS[doc.category] || 'Other'}</p>

      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {doc.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
        {meta}
      </div>

      <div className="mt-3 flex items-center justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {actions}
      </div>
    </div>
  );
}
