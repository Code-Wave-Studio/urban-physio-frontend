export const WEEKDAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', icon: 'fa-facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', icon: 'fa-instagram', placeholder: 'https://instagram.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: 'fa-x-twitter', placeholder: 'https://x.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin', placeholder: 'https://linkedin.com/...' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-youtube', placeholder: 'https://youtube.com/...' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-whatsapp', placeholder: 'https://wa.me/91...' },
];

export function emptyOpeningHours() {
  return {
    mon: ['09:00-18:00'],
    tue: ['09:00-18:00'],
    wed: ['09:00-18:00'],
    thu: ['09:00-18:00'],
    fri: ['09:00-18:00'],
    sat: ['09:00-14:00'],
    sun: [],
  };
}

export function normalizeOpeningHours(raw) {
  if (!raw || typeof raw !== 'object') return emptyOpeningHours();
  const out = emptyOpeningHours();
  for (const { key } of WEEKDAYS) {
    const slots = raw[key];
    if (Array.isArray(slots)) {
      out[key] = slots.map(String).filter(Boolean);
    } else if (typeof slots === 'string' && slots.trim()) {
      out[key] = [slots.trim()];
    } else {
      out[key] = [];
    }
  }
  return out;
}

export function parseTagInput(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean))];
}

export function tagsToInput(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

export function normalizeSocialLinks(raw) {
  const base = {};
  for (const { key } of SOCIAL_FIELDS) base[key] = '';
  if (!raw || typeof raw !== 'object') return base;
  for (const { key } of SOCIAL_FIELDS) {
    base[key] = raw[key] ? String(raw[key]).trim() : '';
  }
  return base;
}

export function openingHoursSummary(hours) {
  const normalized = normalizeOpeningHours(hours);
  const openDays = WEEKDAYS.filter(({ key }) => normalized[key]?.length);
  if (!openDays.length) return 'Hours not listed';
  const first = normalized[openDays[0].key][0];
  const allSame = openDays.every(({ key }) => normalized[key].join(',') === normalized[openDays[0].key].join(','));
  if (allSame && openDays.length >= 5) {
    return `Open ${openDays[0].label.slice(0, 3)}–${openDays[openDays.length - 1].label.slice(0, 3)} · ${first}`;
  }
  return `${openDays.length} days/week · see hours below`;
}

export function formatOpeningHoursRows(hours) {
  const normalized = normalizeOpeningHours(hours);
  return WEEKDAYS.map(({ key, label }) => {
    const slots = normalized[key];
    return {
      key,
      label,
      text: slots?.length ? slots.join(', ') : 'Closed',
      closed: !slots?.length,
    };
  });
}
