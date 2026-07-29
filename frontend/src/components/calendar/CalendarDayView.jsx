import FaIcon from '../FaIcon';
import { to12Hour } from '../../utils/timeFormat';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 – 21:00

function parseMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

/** Format hour number (7-21) to 12h label e.g. 7 → "7 AM", 13 → "1 PM" */
function hourLabel(h) {
  const period = h < 12 ? 'AM' : 'PM';
  const h12    = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

/**
 * Single-day timeline with appointments / leave / holidays / rooms.
 */
export default function CalendarDayView({
  date,
  events = [],
  today,
  sameDay,
  EventChip,
  onSelect,
  onBook,
  canBook,
  loading,
}) {
  const isToday = sameDay(date, today);
  const timed = events.filter((ev) => !ev.all_day && ev.start_time);
  const allDay = events.filter((ev) => ev.all_day || !ev.start_time);

  const positioned = timed.map((ev) => {
    const start = parseMinutes(ev.start_time) ?? 7 * 60;
    const end = parseMinutes(ev.end_time) ?? start + 30;
    const top = ((Math.max(start, 7 * 60) - 7 * 60) / 60) * 56;
    const height = Math.max(28, ((Math.min(end, 21 * 60) - Math.max(start, 7 * 60)) / 60) * 56);
    return { ev, top, height };
  });

  return (
    <div className="glass-card !p-0 overflow-hidden">
      <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${isToday ? 'bg-teal-50/60' : 'bg-slate-50/60'}`}>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            {date.toLocaleDateString(undefined, { weekday: 'long' })}
          </p>
          <p className={`text-lg font-bold ${isToday ? 'text-teal-700' : 'text-slate-900'}`}>
            {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            {isToday && <span className="ml-2 text-xs font-semibold text-teal-600">Today</span>}
          </p>
        </div>
        {canBook && (
          <button
            type="button"
            className="btn-primary text-xs !py-2"
            onClick={() => onBook?.(date)}
          >
            <FaIcon icon="fa-calendar-plus" className="mr-1.5" />
            Book on this day
          </button>
        )}
      </div>

      {allDay.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-100 space-y-1 bg-amber-50/30">
          <p className="text-[10px] uppercase font-bold text-slate-400 px-1">All day</p>
          {allDay.map((ev) => (
            <EventChip key={ev.id} ev={ev} onClick={onSelect} />
          ))}
        </div>
      )}

      <div className="portal-calendar-scroll">
        <div className="relative min-w-[320px]" style={{ height: HOURS.length * 56 }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-slate-100 flex"
              style={{ top: (h - 7) * 56, height: 56 }}
            >
              <span className="w-14 shrink-0 text-[10px] text-slate-400 font-semibold pl-2 pt-1">
                {hourLabel(h)}
              </span>
              <div className="flex-1 border-l border-slate-50" />
            </div>
          ))}
          {positioned.map(({ ev, top, height }) => (
            <div
              key={ev.id}
              className="absolute left-14 right-2 z-[1]"
              style={{ top, height }}
            >
              <EventChip ev={ev} onClick={onSelect} dense />
            </div>
          ))}
          {!loading && events.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none">
              No events this day
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
