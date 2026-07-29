import FaIcon from '../FaIcon';
import { to12Hour } from '../../utils/timeFormat';
import SlotCapacityBadge from './SlotCapacityBadge';

const STATUS_COLORS = {
  available:  'bg-emerald-100 text-emerald-800',
  confirmed:  'bg-teal-100 text-teal-800',
  completed:  'bg-slate-100 text-slate-700',
  cancelled:  'bg-rose-100 text-rose-700',
  no_show:    'bg-orange-100 text-orange-800',
  full:       'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const TYPE_DOT = {
  schedule: 'bg-sky-500',
  appointment: 'bg-teal-500',
  room: 'bg-indigo-500',
  holiday: 'bg-amber-500',
  leave: 'bg-rose-500',
  custom_slot: 'bg-violet-500',
};

/**
 * Agenda list — chronological events across the visible range.
 */
export default function CalendarAgendaView({
  days = [],
  byDate = {},
  today,
  sameDay,
  toYmd,
  onSelect,
  onBook,
  canBook,
  loading,
}) {
  const hasAny = days.some((d) => (byDate[toYmd(d)] || []).length > 0);

  if (loading && !hasAny) {
    return (
      <div className="glass-card h-64 animate-pulse" />
    );
  }

  if (!hasAny) {
    return (
      <div className="glass-card text-center py-14 text-slate-500">
        <FaIcon icon="fa-calendar" className="text-3xl text-slate-300 mb-2" />
        <p className="font-medium text-slate-700">Nothing on the agenda</p>
        <p className="text-sm mt-1">No appointments, leave, or holidays in this range.</p>
        {canBook && (
          <button type="button" className="btn-primary mt-4 text-sm" onClick={() => onBook?.(today)}>
            Book appointment
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card !p-0 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {days.map((d) => {
          const key = toYmd(d);
          const events = [...(byDate[key] || [])].sort((a, b) =>
            String(a.start_time || '').localeCompare(String(b.start_time || ''))
          );
          if (!events.length) return null;
          const isToday = sameDay(d, today);
          return (
            <section key={key} className={isToday ? 'bg-teal-50/30' : ''}>
              <header className="px-4 py-2.5 flex items-center justify-between gap-2 bg-slate-50/80 sticky top-0">
                <div>
                  <p className={`text-sm font-bold ${isToday ? 'text-teal-700' : 'text-slate-900'}`}>
                    {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    {isToday && <span className="ml-2 text-[10px] uppercase font-bold text-teal-600">Today</span>}
                  </p>
                </div>
                {canBook && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-teal-700 hover:underline"
                    onClick={() => onBook?.(d)}
                  >
                    + Book
                  </button>
                )}
              </header>
              <ul className="px-3 py-2 space-y-1.5">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(ev)}
                      className="w-full text-left rounded-xl border border-slate-100 bg-white px-3 py-2.5 hover:border-teal-200 hover:shadow-sm transition flex gap-3 items-start"
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[ev.type] || 'bg-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">{ev.title}</p>
                          {ev.status && (
                            <StatusBadge status={ev.status} />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ev.all_day
                            ? 'All day'
                            : `${to12Hour(ev.start_time) || '—'} – ${to12Hour(ev.end_time) || '—'}`}
                          {ev.doctor_name ? ` · ${ev.doctor_name}` : ''}
                          {ev.meta?.consultation_type ? ` · ${String(ev.meta.consultation_type).replace(/_/g, ' ')}` : ''}
                        </p>
                        {ev.type === 'appointment' && ev.meta?.cap_enabled && (
                          <div className="mt-1.5">
                            <SlotCapacityBadge
                              booked={ev.meta.slot_booked ?? 0}
                              capacity={ev.meta.slot_capacity ?? 1}
                              status={ev.meta.slot_status ?? 'open'}
                              enabled={!!ev.meta.cap_enabled}
                              compact
                            />
                          </div>
                        )}
                      </div>
                      <FaIcon icon="fa-chevron-right" className="text-slate-300 text-xs mt-1 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
