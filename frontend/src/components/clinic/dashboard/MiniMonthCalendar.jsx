import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../../FaIcon';

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Lightweight calendar widget — highlights days with activity.
 * @param {{ markedDates?: string[], linkTo?: string }} props
 */
export default function MiniMonthCalendar({ markedDates = [], linkTo = '/clinic-portal/calendar' }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const today = ymd(new Date());
  const marked = useMemo(() => new Set(markedDates.filter(Boolean)), [markedDates]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < startPad; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return list;
  }, [cursor]);

  const label = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <FaIcon icon="fa-chevron-left" className="text-xs" />
        </button>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <button
          type="button"
          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50"
          aria-label="Next month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <FaIcon icon="fa-chevron-right" className="text-xs" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-semibold uppercase text-slate-400 py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((d, i) => {
          if (!d) return <span key={`e-${i}`} />;
          const key = ymd(d);
          const isToday = key === today;
          const hasMark = marked.has(key);
          return (
            <span
              key={key}
              className={`relative text-xs py-1.5 rounded-lg font-medium ${
                isToday
                  ? 'bg-teal-600 text-white'
                  : hasMark
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {d.getDate()}
              {hasMark && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </span>
          );
        })}
      </div>
      <Link to={linkTo} className="mt-3 inline-flex text-xs font-semibold text-teal-700 hover:underline">
        Open availability calendar →
      </Link>
    </div>
  );
}
