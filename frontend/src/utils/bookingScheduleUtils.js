import { CUSTOM_PACKAGE_ID, SINGLE_PACKAGE_ID } from '../components/booking/BookingScheduleStep';

export function isStructuredPackageId(packageId) {
  return packageId && packageId !== SINGLE_PACKAGE_ID && packageId !== CUSTOM_PACKAGE_ID;
}

export function buildSchedulePayload(packageId, scheduleSessions) {
  if (isStructuredPackageId(packageId) || packageId === SINGLE_PACKAGE_ID) {
    const first = scheduleSessions[0];
    if (!first?.date || !first?.time) return [];
    return [{ date: first.date, start_time: first.time, time: first.time }];
  }
  return scheduleSessions
    .filter((s) => s.date && s.time)
    .map((s) => ({ date: s.date, start_time: s.time, time: s.time }));
}

export function formatSlotLabel(time) {
  if (!time) return '';
  const [h, m] = String(time).slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateChip(d) {
  if (d === todayIso()) return 'Today';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateHeading(d) {
  if (!d) return '';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).toUpperCase();
}
