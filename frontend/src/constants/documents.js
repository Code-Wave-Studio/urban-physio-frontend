// Document Management System — shared client constants & helpers

export const DOCUMENT_CATEGORIES = [
  { key: 'bills_invoices', label: 'Bills & Invoices', icon: 'fa-file-invoice-dollar' },
  { key: 'payment_receipts', label: 'Payment Receipts', icon: 'fa-receipt' },
  { key: 'assessment_reports', label: 'Assessment Reports', icon: 'fa-clipboard-check' },
  { key: 'initial_evaluation', label: 'Initial Evaluation', icon: 'fa-stethoscope' },
  { key: 'progress_reports', label: 'Progress Reports', icon: 'fa-chart-line' },
  { key: 'weekly_treatment_plan', label: 'Weekly Treatment Plans', icon: 'fa-calendar-week' },
  { key: 'exercise_pdfs', label: 'Exercise PDFs', icon: 'fa-file-pdf' },
  { key: 'exercise_videos', label: 'Exercise Videos', icon: 'fa-video' },
  { key: 'xray', label: 'X-Ray Reports', icon: 'fa-bone' },
  { key: 'mri', label: 'MRI Reports', icon: 'fa-brain' },
  { key: 'ct_scan', label: 'CT Scan Reports', icon: 'fa-radiation' },
  { key: 'blood_test', label: 'Blood Test Reports', icon: 'fa-droplet' },
  { key: 'prescription', label: 'Prescription', icon: 'fa-prescription' },
  { key: 'referral_letter', label: 'Referral Letters', icon: 'fa-envelope-open-text' },
  { key: 'consent_forms', label: 'Consent Forms', icon: 'fa-file-signature' },
  { key: 'insurance', label: 'Insurance Documents', icon: 'fa-shield-heart' },
  { key: 'discharge_summary', label: 'Discharge Summary', icon: 'fa-file-circle-check' },
  { key: 'medical_certificate', label: 'Medical Certificates', icon: 'fa-certificate' },
  { key: 'insurance_claims', label: 'Insurance Claims', icon: 'fa-hand-holding-medical' },
  { key: 'clinical_notes', label: 'Clinical Notes', icon: 'fa-notes-medical' },
  { key: 'other', label: 'Other', icon: 'fa-folder' },
];

export const CATEGORY_LABELS = Object.fromEntries(DOCUMENT_CATEGORIES.map((c) => [c.key, c.label]));
export const CATEGORY_ICONS = Object.fromEntries(DOCUMENT_CATEGORIES.map((c) => [c.key, c.icon]));

export const DOCUMENT_STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];

export const LINK_TYPES = [
  { key: 'gdrive', label: 'Google Drive', icon: 'fa-brands fa-google-drive' },
  { key: 'dropbox', label: 'Dropbox', icon: 'fa-brands fa-dropbox' },
  { key: 'onedrive', label: 'OneDrive', icon: 'fa-brands fa-microsoft' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
  { key: 'url', label: 'External URL', icon: 'fa-link' },
];

// Accepted upload extensions -> type group
export const EXT_GROUP = {
  pdf: 'pdf',
  doc: 'word', docx: 'word',
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image',
  xls: 'excel', xlsx: 'excel', csv: 'excel',
  ppt: 'ppt', pptx: 'ppt',
  zip: 'archive',
  txt: 'text',
};

export const ACCEPT_ATTR =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const TYPE_FILTERS = [
  { key: '', label: 'All types' },
  { key: 'pdf', label: 'PDF' },
  { key: 'image', label: 'Images' },
  { key: 'word', label: 'Word' },
  { key: 'excel', label: 'Excel / CSV' },
  { key: 'ppt', label: 'PowerPoint' },
  { key: 'archive', label: 'Archives' },
  { key: 'link', label: 'Links' },
];

export const DATE_FILTERS = [
  { key: '', label: 'Any date' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: '3months', label: 'Last 3 months' },
];

const GROUP_ICON = {
  pdf: 'fa-file-pdf',
  word: 'fa-file-word',
  excel: 'fa-file-excel',
  ppt: 'fa-file-powerpoint',
  image: 'fa-file-image',
  archive: 'fa-file-zipper',
  text: 'fa-file-lines',
};

const GROUP_COLOR = {
  pdf: 'text-red-500',
  word: 'text-blue-500',
  excel: 'text-green-600',
  ppt: 'text-orange-500',
  image: 'text-purple-500',
  archive: 'text-amber-500',
  text: 'text-slate-500',
  link: 'text-teal-500',
};

export function fileGroup(doc) {
  if (!doc) return 'text';
  if (doc.source === 'link') return 'link';
  return EXT_GROUP[(doc.file_ext || '').toLowerCase()] || 'text';
}

export function fileIcon(doc) {
  const g = fileGroup(doc);
  if (g === 'link') {
    const lt = LINK_TYPES.find((l) => l.key === doc.link_type);
    return lt?.icon || 'fa-link';
  }
  return GROUP_ICON[g] || 'fa-file';
}

export function fileColor(doc) {
  return GROUP_COLOR[fileGroup(doc)] || 'text-slate-500';
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

export function isImage(doc) {
  return fileGroup(doc) === 'image';
}

export function isPdf(doc) {
  return fileGroup(doc) === 'pdf';
}

export function isOffice(doc) {
  return ['word', 'excel', 'ppt'].includes(fileGroup(doc));
}

// Google Docs viewer works for public URLs (office + pdf) without auth.
export function officeViewerUrl(fileUrl) {
  return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(fileUrl)}`;
}

export function youtubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Client-side image compression before upload (jpeg/png/webp).
export async function compressImage(file, { maxDim = 1920, quality = 0.82 } = {}) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (file.size < 400 * 1024) return file; // small enough, skip
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;
    const newName = file.name.replace(/\.(png|webp)$/i, '.jpg');
    return new File([blob], type === 'image/jpeg' ? newName : file.name, { type });
  } catch {
    return file;
  }
}

export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function isPrescriptionDoc(doc) {
  if (!doc) return false;
  const cat = (doc.category || '').toLowerCase();
  if (cat === 'prescription' || cat === 'prescriptions') return true;
  const title = (doc.title || '').toLowerCase();
  if (title.includes('prescription') || title.includes('rx-')) return true;
  const fileUrl = typeof doc.file_url === 'string' ? doc.file_url : '';
  const linkUrl = typeof doc.link_url === 'string' ? doc.link_url : '';
  if (fileUrl.includes('/prescriptions/preview') || linkUrl.includes('/prescriptions/preview')) return true;
  return false;
}

export function getPrescriptionPreviewUrl(doc) {
  if (!doc) return '/clinic-portal/prescriptions/preview';
  const fileUrl = typeof doc.file_url === 'string' ? doc.file_url : '';
  const linkUrl = typeof doc.link_url === 'string' ? doc.link_url : '';
  const urlToParse = fileUrl.includes('/prescriptions/preview') ? fileUrl : linkUrl.includes('/prescriptions/preview') ? linkUrl : '';

  let rxParam = '';
  let patientParam = doc.patient_key || doc.patient_id || '';

  if (urlToParse) {
    try {
      const u = new URL(urlToParse, window.location.origin);
      rxParam = u.searchParams.get('rx') || '';
      if (!patientParam) patientParam = u.searchParams.get('patient') || '';
    } catch {
      /* ignore */
    }
  }

  if (!rxParam) {
    if (doc.rx_number) {
      rxParam = doc.rx_number;
    } else {
      const match = (doc.title || '').match(/RX-\d{4}-\d+/i);
      if (match) rxParam = match[0];
    }
  }

  if (!rxParam) rxParam = 'RX-2026-0041';
  if (!patientParam) patientParam = 'p-13';

  return `/clinic-portal/prescriptions/preview?rx=${encodeURIComponent(rxParam)}&patient=${encodeURIComponent(patientParam)}`;
}

