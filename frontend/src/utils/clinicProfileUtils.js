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

/** Up to 10 banner images: cover first, then gallery (deduped). */
export function getBannerImages(clinic, max = 10) {
  if (!clinic) return [];
  const seen = new Set();
  const out = [];
  const push = (url) => {
    const u = url ? String(url).trim() : '';
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  push(clinic.cover_image);
  for (const g of clinic.gallery || []) {
    push(g?.image_url || g?.url);
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

export function emptyClinicForm() {
  return {
    name: '',
    address: '',
    city_id: '',
    pincode: '',
    phone: '',
    email: '',
    logo: '',
    cover_image: '',
    website: '',
    description: '',
    latitude: null,
    longitude: null,
    opening_hours: emptyOpeningHours(),
    social_links: normalizeSocialLinks(),
    services: '',
    facilities: '',
    equipment_modalities: '',
    stats_patients_treated: '',
    stats_staff_count: '',
    stats_satisfaction_rate: '',
    image_urls: [],
  };
}

export function clinicRecordToForm(c) {
  if (!c) return emptyClinicForm();
  return {
    name: c.name || '',
    address: c.address || '',
    city_id: c.city_id ? String(c.city_id) : '',
    pincode: c.pincode || '',
    phone: c.phone || '',
    email: c.email || '',
    logo: c.logo || '',
    cover_image: c.cover_image || '',
    website: c.website || '',
    description: c.description || '',
    latitude: c.latitude != null ? parseFloat(c.latitude) : null,
    longitude: c.longitude != null ? parseFloat(c.longitude) : null,
    opening_hours: normalizeOpeningHours(c.opening_hours_parsed || c.opening_hours),
    social_links: normalizeSocialLinks(c.social_links_parsed || c.social_links),
    services: tagsToInput(c.services_list || c.services),
    facilities: tagsToInput(c.facilities_list || c.facilities),
    equipment_modalities: tagsToInput(c.equipment_list || c.equipment_modalities),
    stats_patients_treated: c.stats_patients_treated ?? '',
    stats_staff_count: c.stats_staff_count ?? '',
    stats_satisfaction_rate: c.stats_satisfaction_rate ?? '',
    image_urls: c.image_urls?.length
      ? c.image_urls
      : (c.gallery || []).map((g) => g.image_url).filter(Boolean),
  };
}

export function buildClinicPayload(form) {
  const satisfaction = form.stats_satisfaction_rate === '' ? null : Number(form.stats_satisfaction_rate);
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    city_id: parseInt(form.city_id, 10),
    pincode: form.pincode.trim() || undefined,
    phone: form.phone.trim(),
    email: form.email.trim() || undefined,
    logo: form.logo || undefined,
    cover_image: form.cover_image.trim() || undefined,
    website: form.website.trim() || undefined,
    description: form.description.trim() || undefined,
    latitude: form.latitude,
    longitude: form.longitude,
    opening_hours: normalizeOpeningHours(form.opening_hours),
    social_links: form.social_links,
    services: parseTagInput(form.services),
    facilities: parseTagInput(form.facilities),
    equipment_modalities: parseTagInput(form.equipment_modalities),
    stats_patients_treated: form.stats_patients_treated === '' ? 0 : parseInt(form.stats_patients_treated, 10),
    stats_staff_count: form.stats_staff_count === '' ? 0 : parseInt(form.stats_staff_count, 10),
    stats_satisfaction_rate: Number.isFinite(satisfaction) ? satisfaction : null,
    image_urls: form.image_urls,
  };
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
