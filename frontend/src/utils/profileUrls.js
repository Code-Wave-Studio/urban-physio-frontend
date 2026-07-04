/** SEO-friendly public profile URLs */

export function doctorProfileUrl(doctor) {
  if (!doctor) return '/doctors';
  if (doctor.slug) return `/doctor/${encodeURIComponent(doctor.slug)}`;
  if (doctor.id) return `/doctors/${doctor.id}`;
  return '/doctors';
}

export function clinicProfileUrl(clinic) {
  if (!clinic) return '/clinics';
  if (clinic.slug) return `/clinic/${encodeURIComponent(clinic.slug)}`;
  if (clinic.id) return `/clinic/id/${clinic.id}`;
  return '/clinics';
}

export function doctorBookUrl(doctor) {
  if (!doctor) return '/book';
  if (doctor.id) return `/doctors/${doctor.id}/book`;
  return '/book';
}

export function clinicBookUrl(clinic) {
  if (!clinic?.id) return '/book?type=clinic';
  return `/book?type=clinic&clinic_id=${clinic.id}`;
}

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
