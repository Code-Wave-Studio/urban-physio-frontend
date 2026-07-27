import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { calendar } from '../../services/api';

const TYPE_META = {
  schedule: { label: 'Schedule', color: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500', icon: 'fa-clock' },
  appointment: { label: 'Appointment', color: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500', icon: 'fa-calendar-check' },
  room: { label: 'Room booking', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500', icon: 'fa-door-open' },
  holiday: { label: 'Holiday', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: 'fa-umbrella-beach' },
  leave: { label: 'Leave', color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500', icon: 'fa-plane-departure' },
  custom_slot: { label: 'Custom slot', color: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500', icon: 'fa-calendar-plus' },
};

const ALL_TYPES = Object.keys(TYPE_META);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEAVE_TYPES = ['personal', 'sick', 'vacation', 'emergency', 'other'];

function pad(n) {
  return String(n).padStart(2, '0');
}
function toYmd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function startOfWeek(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function weekLabel(from, to) {
  const opts = { month: 'short', day: 'numeric' };
  return `${from.toLocaleDateString(undefined, opts)} – ${to.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
}

function EventChip({ ev, onClick }) {
  const meta = TYPE_META[ev.type] || TYPE_META.appointment;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(ev);
      }}
      className={`w-full text-left rounded-md border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium leading-tight truncate hover:opacity-90 transition ${meta.color}`}
      title={`${ev.title}${ev.start_time ? ` · ${ev.start_time}` : ''}`}
    >
      {!ev.all_day && ev.start_time && <span className="opacity-70 mr-1">{ev.start_time}</span>}
      {ev.title}
    </button>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none';

/**
 * Shared Doctor Calendar board — week / month planners with all event types.
 *
 * props:
 *  - canManage: can create leave/holiday/room bookings
 *  - canManageRooms: can create clinic rooms (clinic admin / main admin)
 *  - showDoctorFilter: admin / clinic
 *  - roleLabel: subtitle hint
 *  - lockedClinicId: lock feed + forms to one clinic (clinic portal)
 *  - hideClinicFilter: hide the All clinics dropdown
 */
export default function CalendarBoard({
  canManage = true,
  canManageRooms = false,
  showDoctorFilter = false,
  roleLabel = '',
  lockedClinicId = null,
  hideClinicFilter = false,
}) {
  const [view, setView] = useState('week'); // week | month
  const [anchor, setAnchor] = useState(() => new Date());
  const [types, setTypes] = useState(() => [...ALL_TYPES]);
  const [doctorId, setDoctorId] = useState('');
  const [clinicId, setClinicId] = useState(() => (lockedClinicId ? String(lockedClinicId) : ''));
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null); // 'leave' | 'holiday' | 'room' | 'roomBooking' | null
  const [rooms, setRooms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const addMenuRef = useRef(null);

  useEffect(() => {
    if (lockedClinicId) setClinicId(String(lockedClinicId));
  }, [lockedClinicId]);

  useEffect(() => {
    if (!addOpen) return undefined;
    const onDoc = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setAddOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [addOpen]);

  const range = useMemo(() => {
    if (view === 'week') {
      const from = startOfWeek(anchor);
      const to = addDays(from, 6);
      return { from: toYmd(from), to: toYmd(to), fromDate: from, toDate: to };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridStart = startOfWeek(first);
    const gridEnd = addDays(startOfWeek(last), 6);
    return { from: toYmd(gridStart), to: toYmd(gridEnd), fromDate: gridStart, toDate: gridEnd, monthFirst: first };
  }, [view, anchor]);

  useEffect(() => {
    calendar.doctors().then((r) => setDoctors(r.data || [])).catch(() => {});
    calendar.clinics().then((r) => setClinics(r.data || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      from: range.from,
      to: range.to,
      types: types.join(','),
    };
    if (doctorId) params.doctor_id = doctorId;
    if (clinicId) params.clinic_id = clinicId;
    calendar
      .feed(params)
      .then((res) => setEvents(res.data?.events || []))
      .catch((err) => toast.error(err?.message || 'Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [range.from, range.to, types, doctorId, clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!clinicId) {
      setRooms([]);
      return;
    }
    calendar.rooms(clinicId).then((r) => setRooms(r.data || [])).catch(() => setRooms([]));
  }, [clinicId]);

  const byDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const toggleType = (t) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const goPrev = () => {
    if (view === 'week') setAnchor(addDays(anchor, -7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (view === 'week') setAnchor(addDays(anchor, 7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  };
  const goToday = () => setAnchor(new Date());

  const weekDays = useMemo(() => {
    const start = view === 'week' ? range.fromDate : null;
    if (!start) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, range.fromDate]);

  const monthCells = useMemo(() => {
    if (view !== 'month') return [];
    const cells = [];
    let cursor = new Date(range.fromDate);
    while (cursor <= range.toDate) {
      cells.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return cells;
  }, [view, range.fromDate, range.toDate]);

  const submitLeave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSaving(true);
    try {
      await calendar.createLeave({
        doctor_id: fd.get('doctor_id') || doctorId || undefined,
        clinic_id: fd.get('clinic_id') || clinicId || undefined,
        start_date: fd.get('start_date'),
        end_date: fd.get('end_date'),
        leave_type: fd.get('leave_type'),
        reason: fd.get('reason'),
      });
      toast.success('Leave added');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const submitHoliday = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSaving(true);
    try {
      await calendar.createHoliday({
        title: fd.get('title'),
        holiday_date: fd.get('holiday_date'),
        end_date: fd.get('end_date') || undefined,
        doctor_id: fd.get('doctor_id') || doctorId || undefined,
        clinic_id: fd.get('clinic_id') || clinicId || undefined,
        notes: fd.get('notes'),
      });
      toast.success('Holiday added');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const submitRoom = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cid = fd.get('clinic_id') || clinicId;
    if (!cid) {
      toast.error('Select a clinic first');
      return;
    }
    setSaving(true);
    try {
      await calendar.createRoom({
        clinic_id: cid,
        name: fd.get('name'),
        room_code: fd.get('room_code'),
        capacity: fd.get('capacity'),
        floor_label: fd.get('floor_label'),
      });
      toast.success('Room created');
      setForm(null);
      if (String(cid) === String(clinicId)) {
        calendar.rooms(cid).then((r) => setRooms(r.data || []));
      }
      setClinicId(String(cid));
    } catch (err) {
      toast.error(err?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const submitRoomBooking = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSaving(true);
    try {
      await calendar.bookRoom({
        room_id: fd.get('room_id'),
        booking_date: fd.get('booking_date'),
        start_time: fd.get('start_time'),
        end_time: fd.get('end_time'),
        doctor_id: fd.get('doctor_id') || doctorId || undefined,
        title: fd.get('title'),
        notes: fd.get('notes'),
      });
      toast.success('Room booked');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selected) return;
    const m = selected.meta || {};
    try {
      if (selected.type === 'leave' && m.leave_id) {
        await calendar.deleteLeave(m.leave_id);
        toast.success('Leave cancelled');
      } else if (selected.type === 'holiday' && m.holiday_id) {
        await calendar.deleteHoliday(m.holiday_id);
        toast.success('Holiday removed');
      } else if (selected.type === 'room' && m.room_booking_id) {
        await calendar.cancelRoomBooking(m.room_booking_id);
        toast.success('Room booking cancelled');
      } else {
        toast('This event is managed elsewhere (appointments / availability)');
        setSelected(null);
        return;
      }
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed');
    }
  };

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="glass-card !p-3 sm:!p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-semibold ${view === 'week' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-semibold ${view === 'month' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Monthly
              </button>
            </div>
            <button type="button" onClick={goPrev} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="Previous">
              <FaIcon icon="fa-chevron-left" />
            </button>
            <button type="button" onClick={goToday} className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 hover:bg-slate-50">
              Today
            </button>
            <button type="button" onClick={goNext} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="Next">
              <FaIcon icon="fa-chevron-right" />
            </button>
            <p className="text-sm sm:text-base font-bold text-slate-900 ml-1">
              {view === 'week' ? weekLabel(range.fromDate, range.toDate) : monthLabel(anchor)}
            </p>
            {roleLabel && <span className="text-xs text-slate-400 hidden sm:inline">· {roleLabel}</span>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {showDoctorFilter && (
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={`${inputCls} !w-auto min-w-[160px]`}>
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
            {!hideClinicFilter && !lockedClinicId && clinics.length > 0 && (
              <select value={clinicId} onChange={(e) => setClinicId(e.target.value)} className={`${inputCls} !w-auto min-w-[140px]`}>
                <option value="">All clinics</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {canManage && (
              <div className="relative" ref={addMenuRef}>
                <button
                  type="button"
                  aria-expanded={addOpen}
                  onClick={() => setAddOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-3 py-2"
                >
                  <FaIcon icon="fa-plus" />
                  Add
                  <FaIcon icon="fa-chevron-down" className="text-[10px] opacity-80" />
                </button>
                {addOpen && (
                  <div className="absolute right-0 top-full mt-1 z-40 min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                    <button
                      type="button"
                      onClick={() => { setForm('leave'); setAddOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaIcon icon="fa-plane-departure" className="text-rose-500 w-4" /> Leave
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForm('holiday'); setAddOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaIcon icon="fa-umbrella-beach" className="text-amber-500 w-4" /> Holiday
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForm('roomBooking'); setAddOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaIcon icon="fa-door-open" className="text-indigo-500 w-4" /> Room booking
                    </button>
                    {canManageRooms && (
                      <button
                        type="button"
                        onClick={() => { setForm('room'); setAddOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FaIcon icon="fa-hospital" className="text-slate-500 w-4" /> New room
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Type filters */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ALL_TYPES.map((t) => {
            const on = types.includes(t);
            const m = TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  on ? m.color : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${on ? m.dot : 'bg-slate-300'}`} />
                {m.label}
              </button>
            );
          })}
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 ml-2">
              <FaIcon icon="fa-spinner" className="fa-spin" /> Loading…
            </span>
          )}
          {!loading && (
            <span className="text-xs text-slate-400 ml-2 self-center">{events.length} events</span>
          )}
        </div>
      </div>

      {/* Week view */}
      {view === 'week' && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="portal-calendar-scroll">
            <div className="portal-calendar-grid">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {weekDays.map((d) => {
                  const isToday = sameDay(d, today);
                  return (
                    <div
                      key={toYmd(d)}
                      className={`px-1 sm:px-2 py-2 text-center border-r border-slate-50 last:border-0 ${isToday ? 'bg-teal-50' : 'bg-slate-50/60'}`}
                    >
                      <p className="text-[10px] sm:text-xs font-semibold uppercase text-slate-500">{WEEKDAYS[d.getDay()]}</p>
                      <p className={`text-sm sm:text-lg font-bold ${isToday ? 'text-teal-700' : 'text-slate-800'}`}>{d.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 min-h-[360px] sm:min-h-[420px]">
                {weekDays.map((d) => {
                  const key = toYmd(d);
                  const dayEvents = byDate[key] || [];
                  const isToday = sameDay(d, today);
                  return (
                    <div
                      key={key}
                      className={`border-r border-slate-50 last:border-0 p-1 sm:p-1.5 space-y-1 overflow-y-auto max-h-[520px] ${isToday ? 'bg-teal-50/30' : ''}`}
                    >
                      {dayEvents.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center pt-8 px-1 leading-snug">
                          {canManage ? 'Free' : 'No events'}
                        </p>
                      )}
                      {dayEvents.map((ev) => (
                        <EventChip key={ev.id} ev={ev} onClick={setSelected} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {!loading && events.length === 0 && (
            <div className="border-t border-slate-100 px-4 py-3 text-center text-sm text-slate-500">
              No schedules, appointments, leave or holidays in this range.
              {canManage && (
                <button type="button" className="text-teal-700 font-semibold ml-1 hover:underline" onClick={() => setAddOpen(true)}>
                  Add leave or holiday
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="portal-calendar-scroll">
            <div className="portal-calendar-grid">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="px-2 py-2 text-center text-[11px] font-semibold uppercase text-slate-500 border-r border-slate-50 last:border-0">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((d) => {
                  const key = toYmd(d);
                  const inMonth = d.getMonth() === anchor.getMonth();
                  const isToday = sameDay(d, today);
                  const dayEvents = byDate[key] || [];
                  return (
                    <div
                      key={key}
                      className={`min-h-[88px] sm:min-h-[110px] border-r border-b border-slate-50 last:border-r-0 p-1 ${
                        !inMonth ? 'bg-slate-50/40' : isToday ? 'bg-teal-50/40' : 'bg-white'
                      }`}
                    >
                      <p className={`text-[11px] font-bold mb-0.5 px-0.5 ${isToday ? 'text-teal-700' : inMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                        {d.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <EventChip key={ev.id} ev={ev} onClick={setSelected} />
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {ALL_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${TYPE_META[t].dot}`} />
            {TYPE_META[t].label}
          </span>
        ))}
      </div>

      {/* Event detail */}
      <Modal open={!!selected} title={selected?.title || 'Event'} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TYPE_META[selected.type]?.color}`}>
                <FaIcon icon={TYPE_META[selected.type]?.icon} />
                {TYPE_META[selected.type]?.label}
              </span>
              {selected.status && (
                <span className="text-xs text-slate-500 capitalize">{selected.status}</span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Date</dt>
                <dd className="font-medium">{selected.date}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Time</dt>
                <dd className="font-medium">
                  {selected.all_day ? 'All day' : `${selected.start_time || '—'} – ${selected.end_time || '—'}`}
                </dd>
              </div>
              {selected.doctor_name && (
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Doctor</dt>
                  <dd className="font-medium">{selected.doctor_name}</dd>
                </div>
              )}
              {selected.clinic_name && (
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Clinic</dt>
                  <dd className="font-medium">{selected.clinic_name}</dd>
                </div>
              )}
            </dl>
            {selected.meta?.reason && <p className="text-slate-600"><span className="text-slate-400">Reason:</span> {selected.meta.reason}</p>}
            {selected.meta?.notes && <p className="text-slate-600"><span className="text-slate-400">Notes:</span> {selected.meta.notes}</p>}
            {selected.meta?.booking_id && <p className="text-slate-600"><span className="text-slate-400">Booking:</span> {selected.meta.booking_id}</p>}
            {selected.meta?.room_name && <p className="text-slate-600"><span className="text-slate-400">Room:</span> {selected.meta.room_name}</p>}

            {canManage && ['leave', 'holiday', 'room'].includes(selected.type) && (
              <button
                type="button"
                onClick={removeSelected}
                className="w-full mt-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-semibold py-2 hover:bg-rose-100"
              >
                {selected.type === 'leave' ? 'Cancel leave' : selected.type === 'holiday' ? 'Remove holiday' : 'Cancel room booking'}
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Leave form */}
      <Modal open={form === 'leave'} title="Add leave" onClose={() => setForm(null)}>
        <form onSubmit={submitLeave} className="space-y-3">
          {showDoctorFilter && (
            <label className="block text-xs font-semibold text-slate-500">
              Doctor
              <select name="doctor_id" defaultValue={doctorId} className={`${inputCls} mt-1`} required={showDoctorFilter}>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-500">
              From
              <input type="date" name="start_date" required className={`${inputCls} mt-1`} defaultValue={toYmd(today)} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              To
              <input type="date" name="end_date" required className={`${inputCls} mt-1`} defaultValue={toYmd(today)} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-500">
            Type
            <select name="leave_type" className={`${inputCls} mt-1`} defaultValue="personal">
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          {lockedClinicId ? (
            <input type="hidden" name="clinic_id" value={clinicId} />
          ) : clinics.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-500">
              Clinic (optional)
              <select name="clinic_id" defaultValue={clinicId} className={`${inputCls} mt-1`}>
                <option value="">—</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-xs font-semibold text-slate-500">
            Reason
            <input type="text" name="reason" className={`${inputCls} mt-1`} placeholder="Optional" />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save leave'}
          </button>
        </form>
      </Modal>

      {/* Holiday form */}
      <Modal open={form === 'holiday'} title="Add holiday" onClose={() => setForm(null)}>
        <form onSubmit={submitHoliday} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500">
            Title
            <input type="text" name="title" required className={`${inputCls} mt-1`} placeholder="e.g. Diwali" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-500">
              Date
              <input type="date" name="holiday_date" required className={`${inputCls} mt-1`} defaultValue={toYmd(today)} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              End (optional)
              <input type="date" name="end_date" className={`${inputCls} mt-1`} />
            </label>
          </div>
          {lockedClinicId ? (
            <input type="hidden" name="clinic_id" value={clinicId} />
          ) : clinics.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-500">
              Clinic (optional)
              <select name="clinic_id" defaultValue={clinicId} className={`${inputCls} mt-1`}>
                <option value="">Doctor / personal</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {showDoctorFilter && (
            <label className="block text-xs font-semibold text-slate-500">
              Doctor (optional)
              <select name="doctor_id" defaultValue={doctorId} className={`${inputCls} mt-1`}>
                <option value="">Clinic-wide</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-500">
            Notes
            <input type="text" name="notes" className={`${inputCls} mt-1`} />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save holiday'}
          </button>
        </form>
      </Modal>

      {/* New room */}
      <Modal open={form === 'room'} title="Add clinic room" onClose={() => setForm(null)}>
        <form onSubmit={submitRoom} className="space-y-3">
          {lockedClinicId ? (
            <input type="hidden" name="clinic_id" value={clinicId} />
          ) : (
            <label className="block text-xs font-semibold text-slate-500">
              Clinic
              <select name="clinic_id" defaultValue={clinicId} required className={`${inputCls} mt-1`}>
                <option value="">Select clinic</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-500">
            Room name
            <input type="text" name="name" required className={`${inputCls} mt-1`} placeholder="e.g. Therapy Room 1" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-500">
              Code
              <input type="text" name="room_code" className={`${inputCls} mt-1`} placeholder="R1" />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              Capacity
              <input type="number" name="capacity" min="1" defaultValue="1" className={`${inputCls} mt-1`} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-500">
            Floor
            <input type="text" name="floor_label" className={`${inputCls} mt-1`} placeholder="Ground" />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Create room'}
          </button>
        </form>
      </Modal>

      {/* Room booking */}
      <Modal open={form === 'roomBooking'} title="Book a room" onClose={() => setForm(null)}>
        <form onSubmit={submitRoomBooking} className="space-y-3">
          {!lockedClinicId && clinics.length > 1 && (
            <label className="block text-xs font-semibold text-slate-500">
              Clinic
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className={`${inputCls} mt-1`}
                required
              >
                <option value="">Select clinic</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-500">
            Room
            <select name="room_id" required className={`${inputCls} mt-1`} disabled={!rooms.length}>
              <option value="">{rooms.length ? 'Select room' : 'Add a room first (Add → New room)'}</option>
              {rooms.filter((r) => Number(r.is_active) !== 0).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.room_code ? ` (${r.room_code})` : ''}
                </option>
              ))}
            </select>
          </label>
          {showDoctorFilter && (
            <label className="block text-xs font-semibold text-slate-500">
              Doctor
              <select name="doctor_id" defaultValue={doctorId} className={`${inputCls} mt-1`}>
                <option value="">—</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-500">
            Date
            <input type="date" name="booking_date" required defaultValue={toYmd(today)} className={`${inputCls} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-500">
              Start
              <input type="time" name="start_time" required defaultValue="10:00" className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              End
              <input type="time" name="end_time" required defaultValue="11:00" className={`${inputCls} mt-1`} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-500">
            Title
            <input type="text" name="title" className={`${inputCls} mt-1`} placeholder="Session / meeting" />
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Notes
            <input type="text" name="notes" className={`${inputCls} mt-1`} />
          </label>
          <button type="submit" disabled={saving || !rooms.length} className="w-full rounded-lg bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700 disabled:opacity-60">
            {saving ? 'Booking…' : 'Book room'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
