import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import PatientAvatar from '../PatientAvatar';
import { documents } from '../../services/api';
import {
  DATE_FILTERS,
  DOCUMENT_CATEGORIES,
  EXT_GROUP,
  TYPE_FILTERS,
  formatBytes,
  formatDate,
} from '../../constants/documents';

const GROUP_ICON = {
  pdf: 'fa-file-pdf',
  word: 'fa-file-word',
  excel: 'fa-file-excel',
  ppt: 'fa-file-powerpoint',
  image: 'fa-file-image',
  archive: 'fa-file-zipper',
  text: 'fa-file-lines',
  link: 'fa-link',
};

function getInitials(name) {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function extOf(name) {
  return (name ? name.split('.').pop() : '').toLowerCase();
}

export default function SharedDocumentsView({
  filters,
  setF,
  onOpenPreview,
  onOpenEdit,
  onDeleteDoc,
  onDownloadDoc,
  onUploadClick,
}) {
  const [patientGroups, setPatientGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedPatients, setCollapsedPatients] = useState({});

  const loadShared = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.type) params.type = filters.type;
    if (filters.range) params.range = filters.range;

    documents
      .sharedPatients(params)
      .then((res) => {
        setPatientGroups(res.data?.items || []);
      })
      .catch((err) => {
        toast.error(err.message || 'Could not load shared documents');
      })
      .finally(() => setLoading(false));
  }, [filters.q, filters.category, filters.type, filters.range]);

  useEffect(() => {
    loadShared();
  }, [loadShared]);

  const togglePatientCollapse = (pid) => {
    setCollapsedPatients((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  const activeCount = [filters.q, filters.category, filters.type, filters.range].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <FaIcon
              icon="fa-magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setF('q', e.target.value)}
              placeholder="Search by patient name, mobile, PAT ID, document title, tags…"
              className="doc-input !pl-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onUploadClick}
              className="btn-primary !py-2 !px-3.5 text-xs sm:text-sm font-semibold shrink-0"
            >
              <FaIcon icon="fa-plus" className="mr-1.5" /> Link &amp; Upload
            </button>
          </div>
        </div>

        {/* Filters strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <select
            className="doc-input !w-auto !py-1.5 text-xs font-medium"
            value={filters.category}
            onChange={(e) => setF('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            className="doc-input !w-auto !py-1.5 text-xs font-medium"
            value={filters.type}
            onChange={(e) => setF('type', e.target.value)}
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            className="doc-input !w-auto !py-1.5 text-xs font-medium"
            value={filters.range}
            onChange={(e) => setF('range', e.target.value)}
          >
            {DATE_FILTERS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setF('q', '');
                setF('category', '');
                setF('type', '');
                setF('range', '');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition ml-auto"
            >
              <FaIcon icon="fa-xmark" className="mr-1" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl text-teal-600 mb-2" />
          <p className="text-sm font-medium">Loading shared documents…</p>
        </div>
      ) : patientGroups.length === 0 ? (
        /* Empty state */
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl text-teal-600 flex items-center justify-center mx-auto text-xl">
            <FaIcon icon="fa-folder-open" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No shared documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {activeCount > 0
                ? 'Try adjusting your search or filters to locate shared patient records.'
                : 'There are no patients with shared medical documents linked yet.'}
            </p>
          </div>
          <button type="button" onClick={onUploadClick} className="btn-primary !py-2 !px-4 text-xs">
            <FaIcon icon="fa-plus" className="mr-1.5" /> Upload &amp; Link Document
          </button>
        </div>
      ) : (
        /* Patient Cards List */
        <div className="space-y-4">
          {patientGroups.map((group) => {
            const isCollapsed = collapsedPatients[group.patient_id];
            return (
              <div
                key={group.patient_id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md"
              >
                {/* Patient Header */}
                <div
                  onClick={() => togglePatientCollapse(group.patient_id)}
                  className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50/90 via-teal-50/30 to-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PatientAvatar patient={{ avatar: group.avatar, name: group.name }} size="md" className="w-11 h-11 rounded-2xl" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-900 truncate">{group.name}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100/80 text-teal-800 tracking-wider">
                          PAT-{group.patient_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        {group.phone ? (
                          <span className="flex items-center gap-1">
                            <FaIcon icon="fa-phone" className="text-[10px] text-teal-600" />
                            {group.phone}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">No mobile</span>
                        )}
                        {group.email && (
                          <span className="hidden sm:inline text-slate-400 truncate max-w-[200px]">
                            • {group.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      <FaIcon icon="fa-file-lines" className="text-[10px]" />
                      {group.document_count} Shared Doc{group.document_count !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Toggle patient accordion"
                    >
                      <FaIcon icon={isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Patient Shared Documents Accordion Body */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 p-2 sm:p-3 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                      {group.documents.map((doc) => {
                        const isLink = doc.source === 'link';
                        const ext = isLink ? 'link' : extOf(doc.file_name);
                        const groupKey = EXT_GROUP[ext] || (isLink ? 'link' : 'text');
                        const iconName = GROUP_ICON[groupKey] || 'fa-file';

                        return (
                          <div
                            key={doc.id}
                            className="flex flex-col justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-teal-300 hover:shadow-md transition group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 text-sm">
                                    <FaIcon icon={iconName} />
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      onClick={() => onOpenPreview(doc)}
                                      className="text-sm font-semibold text-slate-800 hover:text-teal-700 truncate cursor-pointer"
                                      title={doc.title}
                                    >
                                      {doc.title}
                                    </p>
                                    <span className="inline-block text-[10px] font-semibold uppercase text-slate-400">
                                      {doc.category_label || doc.category}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {doc.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2 italic">
                                  "{doc.description}"
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 mt-2">
                                <span>{formatDate(doc.created_at)}</span>
                                <span>{isLink ? 'External Link' : formatBytes(doc.file_size)}</span>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-100/80">
                              <button
                                type="button"
                                onClick={() => onOpenPreview(doc)}
                                className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
                                title="View document"
                              >
                                <FaIcon icon="fa-eye" className="mr-1" /> View
                              </button>

                              {doc.can_download && (
                                <button
                                  type="button"
                                  onClick={() => onDownloadDoc(doc)}
                                  className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
                                  title={isLink ? 'Open link' : 'Download document'}
                                >
                                  <FaIcon icon={isLink ? 'fa-arrow-up-right-from-square' : 'fa-download'} className="mr-1" />
                                  {isLink ? 'Open' : 'Download'}
                                </button>
                              )}

                              {doc.can_modify && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEdit(doc)}
                                  className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition"
                                  title="Edit document"
                                >
                                  <FaIcon icon="fa-pen" className="mr-1" /> Edit
                                </button>
                              )}

                              {doc.can_delete && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteDoc(doc)}
                                  className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition"
                                  title="Delete document"
                                >
                                  <FaIcon icon="fa-trash-can" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
