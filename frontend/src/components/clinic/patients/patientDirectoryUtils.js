/** Shared helpers for the Clinic Patient Directory */

export function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function formatDate(d) {
  if (!d) return '—';
  const raw = String(d).includes('T') ? d : `${d}T12:00:00`;
  return new Date(raw).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function patientKey(p) {
  if (!p) return '';
  if (p.patient_key) return p.patient_key;
  if (p.clinic_patient_id) return `cp-${p.clinic_patient_id}`;
  return `p-${p.patient_id}`;
}

export function patientDetailPath(p) {
  return `/clinic-portal/patients/${patientKey(p)}`;
}

export function initials(name) {
  const parts = String(name || 'P').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function maskPhone(phone, privacy) {
  if (!phone) return '—';
  if (!privacy) return phone;
  const s = String(phone).replace(/\s/g, '');
  if (s.length < 4) return '••••';
  return `${'•'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

export function maskEmail(email, privacy) {
  if (!email) return '';
  if (!privacy) return email;
  const [u, d] = String(email).split('@');
  if (!d) return '••••';
  return `${(u || '?').slice(0, 1)}•••@${d}`;
}

export function maskName(name, privacy) {
  if (!privacy) return name || 'Patient';
  const s = String(name || 'Patient');
  return `${s.slice(0, 1)}${'•'.repeat(Math.min(8, Math.max(2, s.length - 1)))}`;
}

export function waLink(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  const n = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${n}`;
}

export function smsLink(phone) {
  if (!phone) return null;
  return `sms:${String(phone).replace(/\s/g, '')}`;
}

export function telLink(phone) {
  if (!phone) return null;
  return `tel:${String(phone).replace(/\s/g, '')}`;
}

export function mailLink(email) {
  if (!email) return null;
  return `mailto:${email}`;
}

export const FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'recently_visited', label: 'Recent visits' },
  { id: 'recently_added', label: 'Newly added' },
  { id: 'awaiting', label: 'Awaiting account' },
  { id: 'active_package', label: 'Active package' },
  { id: 'reminders', label: 'Reminders due' },
];

export const STATUS_PILLS = [
  { id: 'all', label: 'Any status' },
  { id: 'online', label: 'Online' },
  { id: 'invited', label: 'Invited' },
  { id: 'offline', label: 'Offline' },
];

export function statusMeta(status) {
  const s = (status || 'online').toLowerCase();
  const map = {
    offline: { label: 'Offline', className: 'bg-slate-100 text-slate-600 ring-slate-200/80' },
    invited: { label: 'Invited', className: 'bg-amber-50 text-amber-800 ring-amber-200/70' },
    online: { label: 'Online', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  };
  return map[s] || map.online;
}

export const VIEW_STORAGE_KEY = 'tup.clinic.patients.view';
export const PRIVACY_STORAGE_KEY = 'tup.clinic.patients.privacy';
