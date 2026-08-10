/** SEO-friendly public profile URLs */

function slugifyText(value, fallback = 'india') {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function localitySlugFromAddress(address, cityName, citySlug) {
  const city = citySlug || slugifyText(cityName);
  const parts = String(address || '')
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  let raw = '';
  for (const part of parts) {
    // Skip building / unit / door / plot / flat / shop number prefixes (e.g. "D-15", "No. 12", "Plot 4")
    if (/^(d-?\d+|no\.?\s*\d+|plot\s*\d+|flat\s*\d+|shop\s*\d+|building\s*\w+|door\s*\d+|\#?\d+[a-z]?)$/i.test(part)) {
      continue;
    }
    raw = part;
    break;
  }

  if (!raw) return 'city-centre';
  const locality = slugifyText(raw, 'city-centre');
  // Avoid /noida/noida/... when address starts with the city name (or is empty)
  if (locality === city || locality === slugifyText(cityName, 'city-centre')) {
    return 'city-centre';
  }
  return locality;
}

export function doctorProfileUrl(doctor) {
  if (!doctor) return '/doctors';
  if (doctor.page_path) return doctor.page_path;
  if (doctor.canonical_path) return doctor.canonical_path;
  if (doctor.slug) {
    const citySlug = doctor.city_slug || slugifyText(doctor.city_name);
    const localitySlug =
      doctor.locality_slug || doctor.locality || localitySlugFromAddress(doctor.address, doctor.city_name, citySlug);
    return `/${encodeURIComponent(citySlug)}/${encodeURIComponent(localitySlug)}/physiotherapists/${encodeURIComponent(doctor.slug)}`;
  }
  if (doctor.id) return `/doctors/${doctor.id}`;
  return '/doctors';
}

export function clinicProfileUrl(clinic) {
  if (!clinic) return '/clinics';
  if (clinic.page_path) return clinic.page_path;
  if (clinic.canonical_path) return clinic.canonical_path;
  if (clinic.slug) {
    const citySlug = clinic.city_slug || slugifyText(clinic.city_name);
    const localitySlug =
      clinic.locality_slug || clinic.locality || localitySlugFromAddress(clinic.address, clinic.city_name, citySlug);
    return `/${encodeURIComponent(citySlug)}/${encodeURIComponent(localitySlug)}/physiotherapy-clinic/${encodeURIComponent(clinic.slug)}`;
  }
  if (clinic.id) return `/clinic/id/${clinic.id}`;
  return '/clinics';
}

export function doctorBookUrl(doctor) {
  if (!doctor) return '/book';
  if (doctor.id) return `/doctors/${doctor.id}/book`;
  return '/book';
}

export function clinicBookUrl(clinic) {
  const id = typeof clinic === 'object' && clinic ? clinic.id : clinic;
  if (!id) return '/book?type=clinic';
  return `/book?type=clinic&clinic_id=${id}`;
}

export const bookClinicUrl = clinicBookUrl;
export const bookDoctorUrl = doctorBookUrl;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime12h(time) {
  const [h, m] = String(time || '').slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h)) return String(time || '');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
}

/** Weekly schedule rows for doctor availability slots. */
export function formatDoctorAvailabilityRows(slots = []) {
  if (!Array.isArray(slots) || !slots.length) return [];
  const byDay = {};
  for (const s of slots) {
    const d = Number(s.day_of_week);
    if (Number.isNaN(d) || d < 0 || d > 6) continue;
    const start = String(s.start_time || '').slice(0, 5);
    const end = String(s.end_time || '').slice(0, 5);
    if (!start || !end) continue;
    const range = `${formatTime12h(start)} – ${formatTime12h(end)}`;
    if (!byDay[d]) {
      byDay[d] = { dayIndex: d, label: FULL_DAY_NAMES[d] ?? DAY_NAMES[d], ranges: [] };
    }
    byDay[d].ranges.push(range);
  }
  return Object.values(byDay)
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map(({ dayIndex, label, ranges }) => ({
      dayIndex,
      label,
      text: ranges.join(', '),
    }));
}

export function formatAvailabilitySummary(slots = []) {
  if (!slots.length) return 'Contact for availability';
  const byDay = {};
  slots.forEach((s) => {
    const d = Number(s.day_of_week);
    const label = DAY_NAMES[d] ?? `Day ${d}`;
    const range = `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}`;
    byDay[label] = byDay[label] ? `${byDay[label]}, ${range}` : range;
  });
  return Object.entries(byDay)
    .map(([day, time]) => `${day}: ${time}`)
    .join(' · ');
}

export function formatOpeningHours(hours) {
  if (!hours || typeof hours !== 'object') return null;
  return Object.entries(hours)
    .map(([day, slots]) => {
      const list = Array.isArray(slots) ? slots.join(', ') : String(slots);
      return `${day.charAt(0).toUpperCase()}${day.slice(1)}: ${list}`;
    })
    .join(' · ');
}
