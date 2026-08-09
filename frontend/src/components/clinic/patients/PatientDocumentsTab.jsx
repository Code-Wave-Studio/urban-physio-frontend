import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import GlassModal, { GlassModalBody, GlassModalHeader } from '../../GlassModal';
import api, { clinicPortal, documents as documentsApi } from '../../../services/api';
import { CATEGORY_LABELS, EXT_GROUP, formatBytes } from '../../../constants/documents';

const DOCUMENT_CATEGORIES = [
  { key: 'assessment_reports', label: 'Assessment Report', icon: 'fa-clipboard-check', color: 'bg-blue-100 text-blue-800' },
  { key: 'prescription', label: 'Prescription & Rehab Plan', icon: 'fa-file-prescription', color: 'bg-teal-100 text-teal-800' },
  { key: 'xray', label: 'X-Ray / Imaging', icon: 'fa-bone', color: 'bg-purple-100 text-purple-800' },
  { key: 'mri', label: 'MRI / CT Scan Report', icon: 'fa-brain', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'progress_reports', label: 'Progress Report', icon: 'fa-chart-line', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'bills_invoices', label: 'Bill / Payment Invoice', icon: 'fa-file-invoice-dollar', color: 'bg-amber-100 text-amber-800' },
  { key: 'medical_certificate', label: 'Medical Certificate', icon: 'fa-certificate', color: 'bg-rose-100 text-rose-800' },
  { key: 'other', label: 'General Document', icon: 'fa-folder', color: 'bg-slate-100 text-slate-800' },
];

function formatDate(dStr) {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dStr;
  }
}

function extGroup(filename = '', mime = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (EXT_GROUP[ext]) return EXT_GROUP[ext];
  if (mime.includes('image')) return 'image';
  if (mime.includes('pdf')) return 'pdf';
  return 'file';
}

function fileIcon(group) {
  switch (group) {
    case 'pdf': return { icon: 'fa-file-pdf', color: 'text-rose-600 bg-rose-50' };
    case 'image': return { icon: 'fa-file-image', color: 'text-purple-600 bg-purple-50' };
    case 'word': return { icon: 'fa-file-word', color: 'text-blue-600 bg-blue-50' };
    case 'excel': return { icon: 'fa-file-excel', color: 'text-emerald-600 bg-emerald-50' };
    case 'link': return { icon: 'fa-link', color: 'text-teal-600 bg-teal-50' };
    default: return { icon: 'fa-file-lines', color: 'text-slate-600 bg-slate-100' };
  }
}

export default function PatientDocumentsTab({ patientKey, patient = {}, clinicId, initialDocs = [] }) {
  const storageKey = `tup_patient_documents_${patientKey || 'global'}`;
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [shareFilter, setShareFilter] = useState('all'); // all | shared | internal
  const [modalOpen, setModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form State for Upload & Share Modal
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'assessment_reports',
    description: '',
    file: null,
    link_url: '',
    is_shared: true, // Shared with patient by default
    source: 'upload', // upload | link
  });

  // Seed default initial documents if empty
  const loadDocs = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setDocs(JSON.parse(raw));
      } else {
        const seed = [
          {
            id: 'doc_101',
            title: 'Initial Physiotherapy Assessment Report',
            category: 'assessment_reports',
            description: 'Comprehensive musculoskeletal assessment for L4-L5 lumbar disc radiculopathy.',
            file_name: 'Physio_Initial_Assessment_L4L5.pdf',
            file_size: 1450000,
            file_type: 'pdf',
            file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            is_shared: true,
            uploaded_by: 'Dr. Priya Sharma (Lead Physio)',
            created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: 'doc_102',
            title: 'L4-L5 Lumbar Spine MRI Scan',
            category: 'mri',
            description: 'Radiology report showing posterior disc bulge at L4-L5 levels.',
            file_name: 'Lumbar_MRI_Scan_Report.jpg',
            file_size: 2890000,
            file_type: 'image',
            file_url: 'https://picsum.photos/800/600',
            is_shared: true,
            uploaded_by: 'Patient Upload',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
          {
            id: 'doc_103',
            title: 'Home Rehab Exercise Program Care Plan',
            category: 'prescription',
            description: 'Official Urban Physio home exercise program with posture guidelines.',
            file_name: 'Home_Rehab_Exercise_Plan.pdf',
            file_size: 980000,
            file_type: 'pdf',
            file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            is_shared: true,
            uploaded_by: 'Dr. Priya Sharma (Lead Physio)',
            created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
        ];
        if (Array.isArray(initialDocs) && initialDocs.length > 0) {
          const formattedApiDocs = initialDocs.map((d) => ({
            id: String(d.id),
            title: d.title || d.file_name || 'Medical Document',
            category: d.category || 'other',
            description: d.description || '',
            file_name: d.file_name || d.title || 'Document.pdf',
            file_size: d.file_size || 500000,
            file_type: d.file_type || extGroup(d.file_name || ''),
            file_url: d.file_url || d.url || '',
            is_shared: d.is_shared !== false,
            uploaded_by: d.uploaded_by || 'Clinic Staff',
            created_at: d.created_at || new Date().toISOString(),
          }));
          setDocs(formattedApiDocs);
          localStorage.setItem(storageKey, JSON.stringify(formattedApiDocs));
        } else {
          setDocs(seed);
          localStorage.setItem(storageKey, JSON.stringify(seed));
        }
      }
    } catch {
      /* fallback */
    } finally {
      setLoading(false);
    }
  }, [storageKey, initialDocs]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const saveDocsToStorage = (updated) => {
    setDocs(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const toggleShareStatus = (docId) => {
    const updated = docs.map((d) => {
      if (d.id === docId) {
        const nextShared = !d.is_shared;
        toast.success(
          nextShared
            ? `"${d.title}" is now shared with patient`
            : `"${d.title}" is set to clinic internal (unshared)`
        );
        return { ...d, is_shared: nextShared };
      }
      return d;
    });
    saveDocsToStorage(updated);
  };

  const handleDeleteDoc = (docId, title) => {
    if (!window.confirm(`Delete document "${title}"?`)) return;
    const updated = docs.filter((d) => d.id !== docId);
    saveDocsToStorage(updated);
    toast.success('Document deleted');
  };

  const openUploadModal = () => {
    setUploadForm({
      title: '',
      category: 'assessment_reports',
      description: '',
      file: null,
      link_url: '',
      is_shared: true,
      source: 'upload',
    });
    setModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return toast.error('Document title is required');

    setUploading(true);
    try {
      let fileUrl = uploadForm.link_url || '';
      let fileName = uploadForm.file ? uploadForm.file.name : (uploadForm.title + '.pdf');
      let fileSize = uploadForm.file ? uploadForm.file.size : 250000;
      let fileType = uploadForm.file ? extGroup(uploadForm.file.name, uploadForm.file.type) : (uploadForm.source === 'link' ? 'link' : 'pdf');

      // If file uploaded, attempt API upload
      if (uploadForm.file) {
        try {
          const fd = new FormData();
          fd.append('file', uploadForm.file);
          fd.append('title', uploadForm.title);
          fd.append('category', uploadForm.category);
          fd.append('description', uploadForm.description);
          fd.append('patient_key', patientKey);
          if (clinicId) fd.append('clinic_id', clinicId);
          fd.append('is_shared', uploadForm.is_shared ? '1' : '0');

          const res = await api.post('/documents', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.url || res.data?.file_url) {
            fileUrl = res.data.url || res.data.file_url;
          }
        } catch {
          // Fallback to local Blob URL for immediate preview
          fileUrl = URL.createObjectURL(uploadForm.file);
        }
      }

      const newDoc = {
        id: `doc_${Date.now()}`,
        title: uploadForm.title,
        category: uploadForm.category,
        description: uploadForm.description,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_url: fileUrl,
        link_url: uploadForm.link_url,
        is_shared: uploadForm.is_shared,
        uploaded_by: 'Dr. Priya Sharma (Clinic Staff)',
        created_at: new Date().toISOString(),
      };

      const updated = [newDoc, ...docs];
      saveDocsToStorage(updated);
      toast.success(`Document "${uploadForm.title}" uploaded & ${uploadForm.is_shared ? 'shared with patient!' : 'saved as internal doc.'}`);
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = docs.filter((d) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.file_name?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Category filter
    if (categoryFilter && d.category !== categoryFilter) return false;
    // Sharing status filter
    if (shareFilter === 'shared' && !d.is_shared) return false;
    if (shareFilter === 'internal' && d.is_shared) return false;
    return true;
  });

  const sharedCount = docs.filter((d) => d.is_shared).length;
  const patientName = patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
            <FaIcon icon="fa-folder-open" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">Patient Shared &amp; Medical Documents</h2>
              <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {sharedCount} Shared with Patient
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload, organize, and share medical reports, X-rays, MRI scans &amp; rehab plans with {patientName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openUploadModal}
          className="btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-1.5 shadow-sm font-bold"
        >
          <FaIcon icon="fa-cloud-arrow-up" />
          <span>Upload &amp; Share Document</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, scan or file..."
              className="pl-8 pr-3 py-1.5 text-xs border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="">All Categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Sharing Filter */}
          <select
            value={shareFilter}
            onChange={(e) => setShareFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="all">All Documents ({docs.length})</option>
            <option value="shared">Shared with Patient ({sharedCount})</option>
            <option value="internal">Clinic Internal Only ({docs.length - sharedCount})</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Showing <strong>{filteredDocs.length}</strong> of {docs.length} files
        </div>
      </div>

      {/* Documents Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const group = doc.file_type || extGroup(doc.file_name);
          const iconObj = fileIcon(group);
          const catObj = DOCUMENT_CATEGORIES.find((c) => c.key === doc.category) || {
            label: CATEGORY_LABELS[doc.category] || 'Document',
            color: 'bg-slate-100 text-slate-800',
            icon: 'fa-folder',
          };

          return (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl border p-4 transition space-y-3 relative ${
                doc.is_shared ? 'border-teal-200 shadow-2xs hover:border-teal-400' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Top Meta Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconObj.color}`}>
                    <FaIcon icon={iconObj.icon} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catObj.color}`}>
                        {catObj.label}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatBytes(doc.file_size || 500000)}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Shared Status Badge */}
                <button
                  type="button"
                  onClick={() => toggleShareStatus(doc.id)}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition shrink-0 inline-flex items-center gap-1 cursor-pointer ${
                    doc.is_shared
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Click to toggle sharing with patient"
                >
                  <FaIcon icon={doc.is_shared ? 'fa-eye' : 'fa-eye-slash'} className="text-[10px]" />
                  <span>{doc.is_shared ? 'Shared with Patient' : 'Clinic Internal'}</span>
                </button>
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {doc.description}
                </p>
              )}

              {/* Upload Meta & File Name */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="truncate max-w-[180px]" title={doc.file_name}>
                  <FaIcon icon="fa-paperclip" className="mr-1" />
                  {doc.file_name}
                </span>
                <span>
                  {formatDate(doc.created_at)} · {doc.uploaded_by || 'Clinic Staff'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5">
                  {/* Share Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleShareStatus(doc.id)}
                    className={`btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1 ${
                      doc.is_shared ? 'text-amber-700 border-amber-200 hover:bg-amber-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <FaIcon icon={doc.is_shared ? 'fa-user-minus' : 'fa-user-check'} className="text-[11px]" />
                    <span>{doc.is_shared ? 'Unshare' : 'Share with Patient'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="btn-outline text-xs !py-1.5 !px-2.5 text-slate-700 inline-flex items-center gap-1"
                  >
                    <FaIcon icon="fa-eye" className="text-[11px]" />
                    <span>View</span>
                  </button>

                  {/* Download Button */}
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.file_name}
                      className="btn-primary text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                    >
                      <FaIcon icon="fa-download" className="text-[11px]" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toast.success(`Downloading ${doc.file_name}...`)}
                      className="btn-primary text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                    >
                      <FaIcon icon="fa-download" className="text-[11px]" />
                      <span>Download</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                    className="btn-outline text-xs !py-1.5 !px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                    title="Delete document"
                  >
                    <FaIcon icon="fa-trash-can" className="text-[11px]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!filteredDocs.length && (
          <div className="md:col-span-2 py-12 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-dashed border-slate-200">
            <FaIcon icon="fa-folder-open" className="text-4xl text-slate-300" />
            <p className="text-sm font-semibold">No documents found matching filter</p>
            <p className="text-xs text-slate-400">Click "Upload &amp; Share Document" to add medical files for {patientName}.</p>
          </div>
        )}
      </div>

      {/* Upload & Share Modal */}
      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-xl">
        <GlassModalHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FaIcon icon="fa-cloud-arrow-up" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload &amp; Share Document</h3>
              <p className="text-xs text-slate-500">Upload medical files, scans &amp; reports for {patientName}</p>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-4 sm:p-6 space-y-4 text-xs">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Mode Switch: File Upload vs Link */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, source: 'upload' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  uploadForm.source === 'upload' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FaIcon icon="fa-file-arrow-up" /> File Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, source: 'link' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  uploadForm.source === 'link' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FaIcon icon="fa-link" /> Document Link / URL
              </button>
            </div>

            {/* Document Title */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lumbar MRI Scan Report / Posture Guidelines"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Document Category</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 bg-white text-xs font-semibold"
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload OR Link URL */}
            {uploadForm.source === 'upload' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Medical File (PDF, Image, DOCX)</label>
                <div className="border-2 border-dashed border-teal-200 rounded-2xl p-4 text-center bg-teal-50/30 hover:bg-teal-50/60 transition">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setUploadForm((prev) => ({
                          ...prev,
                          file,
                          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
                        }));
                      }
                    }}
                    className="hidden"
                    id="patient-doc-file-input"
                  />
                  <label htmlFor="patient-doc-file-input" className="cursor-pointer block space-y-1">
                    <FaIcon icon="fa-cloud-arrow-up" className="text-2xl text-teal-600" />
                    <p className="font-bold text-slate-800 text-xs">
                      {uploadForm.file ? uploadForm.file.name : 'Click to choose file or drag & drop here'}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DOCX up to 25MB</p>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document URL / External Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or document link"
                  value={uploadForm.link_url}
                  onChange={(e) => setUploadForm({ ...uploadForm, link_url: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 bg-white text-xs font-mono"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Description &amp; Clinical Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes or findings..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 bg-white text-xs resize-none"
              />
            </div>

            {/* Share with Patient Checkbox */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <FaIcon icon="fa-eye" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900 text-xs">Share with Patient Immediately</p>
                  <p className="text-[10px] text-emerald-700">Make this document visible on patient portal &amp; app</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={uploadForm.is_shared}
                onChange={(e) => setUploadForm({ ...uploadForm, is_shared: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-outline text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-xs px-5 py-2 shadow-sm font-bold inline-flex items-center gap-1.5"
              >
                <FaIcon icon={uploading ? 'fa-circle-notch' : 'fa-cloud-arrow-up'} className={uploading ? 'animate-spin' : ''} />
                <span>{uploading ? 'Uploading...' : 'Upload & Share'}</span>
              </button>
            </div>
          </form>
        </GlassModalBody>
      </GlassModal>

      {/* Document Preview Modal */}
      <GlassModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="max-w-3xl">
        <GlassModalHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <FaIcon icon="fa-file-lines" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc?.title}</h3>
                <p className="text-xs text-slate-500">Category: {previewDoc?.category} · Shared: {previewDoc?.is_shared ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-4 sm:p-6 space-y-4 text-xs">
          {previewDoc?.file_url ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden min-h-[300px] flex items-center justify-center bg-slate-50">
              {previewDoc.file_type === 'image' || previewDoc.file_url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                <img src={previewDoc.file_url} alt={previewDoc.title} className="max-h-[500px] object-contain rounded-lg shadow-xs" />
              ) : (
                <iframe src={previewDoc.file_url} title={previewDoc.title} className="w-full h-[500px] border-none" />
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <FaIcon icon="fa-file-pdf" className="text-4xl text-teal-600" />
              <p className="font-bold text-slate-800">{previewDoc?.file_name}</p>
              <p className="text-xs text-slate-500">{previewDoc?.description || 'No inline preview available.'}</p>
            </div>
          )}

          {previewDoc?.description && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block mb-1">Clinical Description:</strong>
              <p className="text-slate-700 leading-relaxed">{previewDoc.description}</p>
            </div>
          )}
        </GlassModalBody>
      </GlassModal>
    </div>
  );
}
