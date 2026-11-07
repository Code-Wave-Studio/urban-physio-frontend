import { JS_DAY_TO_KEY, resolveClinicHours } from './clinicProfileUtils';

/*
 * Booking slots built from a clinic's own opening hours.
 * The server only builds clinic slots from the schedules of attached physios, so a clinic with no
 * physio schedule shows nothing. These helpers fill that gap from the hours set on the clinic profile.
 * All times are India time (+05:30), matching how the server stores clinic hours.
 */

const IST = 'Asia/Kolkata';
/** Slots starting sooner than this are not offered. */
export const CLINIC_HOURS_LEAD_MINUTES = 30;
const DEFAULT_SLOT_MINUTES = 30;

function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || '').trim());
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v <= 24 * 60 ? v : null;
}

function hhmm(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function label(mins) {
  const h = Math.floor(mins / 60);
  return `${h % 12 || 12}:${String(mins % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Today's date in India as YYYY-MM-DD. */
export function istTodayIso(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(now);
}

function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayKey(iso) {
  return JS_DAY_TO_KEY[new Date(`${iso}T12:00:00Z`).getUTCDay()];
}

function slotMinutes(clinic) {
  const n = parseInt(clinic?.default_slot_duration_minutes, 10);
  return n >= 10 && n <= 120 ? n : DEFAULT_SLOT_MINUTES;
}

/** True when the clinic can take bookings at all (active and not marked closed). */
export function clinicAcceptsBookings(clinic) {
  if (!clinic) return false;
  if (clinic.is_closed === true || clinic.is_closed === 1 || clinic.is_closed === '1') return false;
  if (clinic.is_active === 0 || clinic.is_active === false || clinic.is_active === '0') return false;
  return true;
}

/**
 * Slots for one date from the clinic's opening hours, in the same shape the server returns
 * ({ time, value, label, available }). Past slots and slots inside the lead time are left out.
 */
export function clinicHoursSlots(clinic, dateIso, now = new Date()) {
  if (!clinicAcceptsBookings(clinic) || !dateIso) return [];
  const ranges = resolveClinicHours(clinic)[dayKey(dateIso)] || [];
  const step = slotMinutes(clinic);
  const earliest = now.getTime() + CLINIC_HOURS_LEAD_MINUTES * 60 * 1000;
  const seen = new Set();
  const out = [];
  for (const range of ranges) {
    const [a, b] = String(range).split('-');
    const start = toMinutes(a);
    let end = toMinutes(b);
    if (start == null || end == null) continue;
    if (end <= start) end = 24 * 60; // "09:00-00:00" style ranges run to midnight
    for (let t = start; t + step <= end; t += step) {
      const time = hhmm(t);
      if (seen.has(time)) continue;
      if (Date.parse(`${dateIso}T${time}:00+05:30`) < earliest) continue;
      seen.add(time);
      out.push({ time, value: `${time}:00`, label: label(t), available: true, source: 'clinic_hours' });
    }
  }
  return out.sort((x, y) => x.time.localeCompare(y.time));
}

/** Dates (YYYY-MM-DD) from `from` for `days` days on which the clinic has at least one open slot. */
export function clinicHoursDates(clinic, { from, days = 14 } = {}, now = new Date()) {
  if (!clinicAcceptsBookings(clinic)) return [];
  const today = istTodayIso(now);
  const start = from && from > today ? from : today;
  const total = Math.max(1, Math.min(90, parseInt(days, 10) || 14));
  const out = [];
  for (let i = 0; i < total; i += 1) {
    const iso = addDays(start, i);
    if (clinicHoursSlots(clinic, iso, now).length) out.push(iso);
  }
  return out;
}
