import { useRef, useState } from 'react';
import FaIcon from '../FaIcon';

/**
 * AppointmentDateNavigator
 *
 * Calendar-style date navigator for the Appointments page.
 * Replaces the old Today / All toggle with Day, Week, Month, Agenda tabs
 * plus Prev / Today / Next navigation.
 *
 * Props:
 *   view      : 'day' | 'week' | 'month' | 'agenda'
 *   anchor    : Date  – the active navigation anchor
 *   onChange  : ({ view, anchor, from, to }) => void
 */

const VIEWS = [
  { id: 'day',    label: 'Day' },
  { id: 'week',   label: 'Week' },
  { id: 'month',  label: 'Month' },
  { id: 'agenda', label: 'Agenda' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function toYmd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function startOfWeek(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Compute { from, to } ISO date strings for a given view + anchor. */
export function computeRange(view, anchor) {
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);

  if (view === 'day') {
    const s = toYmd(a);
    return { from: s, to: s };
  }
  if (view === 'week') {
    const from = startOfWeek(a);
    const to = addDays(from, 6);
    return { from: toYmd(from), to: toYmd(to) };
  }
  if (view === 'month') {
    const first = new Date(a.getFullYear(), a.getMonth(), 1);
    const last  = new Date(a.getFullYear(), a.getMonth() + 1, 0);
    return { from: toYmd(first), to: toYmd(last) };
  }
  // agenda = 14 days
  const to = addDays(a, 13);
  return { from: toYmd(a), to: toYmd(to) };
}

function rangeLabel(view, anchor) {
  const a = new Date(anchor);

  if (view === 'day') {
    return a.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    const from = startOfWeek(a);
    const to   = addDays(from, 6);
    const fStr = from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const tStr = to.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fStr} – ${tStr}`;
  }
  if (view === 'month') {
    return a.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  // agenda
  const from = a;
  const to   = addDays(a, 13);
  const fStr = from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const tStr = to.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fStr} – ${tStr}`;
}

function navigate(view, anchor, dir) {
  const a = new Date(anchor);
  if (view === 'day') return addDays(a, dir);
  if (view === 'week' || view === 'agenda') return addDays(a, dir * (view === 'agenda' ? 14 : 7));
  // month
  return new Date(a.getFullYear(), a.getMonth() + dir, 1);
}

export default function AppointmentDateNavigator({ view, anchor, onChange }) {
  const dateInputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const emit = (newView, newAnchor) => {
    const range = computeRange(newView, newAnchor);
    onChange({ view: newView, anchor: newAnchor, ...range });
  };

  const handleViewChange = (v) => emit(v, anchor);

  const handlePrev = () => emit(view, navigate(view, anchor, -1));
  const handleNext = () => emit(view, navigate(view, anchor, 1));
  const handleToday = () => emit(view, new Date());

  const handleDatePick = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    emit(view, new Date(y, m - 1, d));
    setPickerOpen(false);
  };

  const label = rangeLabel(view, anchor);
  const anchorYmd = toYmd(new Date(anchor));

  return (
    <div className="glass-card !p-3 sm:!p-4 !bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {/* Left: view tabs + prev/today/next */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleViewChange(v.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                  view === v.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Navigation buttons */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FaIcon icon="fa-chevron-left" className="text-xs" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FaIcon icon="fa-chevron-right" className="text-xs" />
          </button>
        </div>

        {/* Right: date range label + date picker */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPickerOpen(true);
              setTimeout(() => dateInputRef.current?.showPicker?.(), 50);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
            title="Click to pick a date"
          >
            <FaIcon icon="fa-calendar-days" className="text-teal-600 text-xs group-hover:scale-110 transition-transform" />
            <span className="hidden xs:inline">{label}</span>
            <span className="xs:hidden text-xs">{anchorYmd}</span>
            <FaIcon icon="fa-caret-down" className="text-slate-400 text-[10px] ml-1" />
          </button>

          {/* Hidden native date picker — positioned absolutely to avoid layout shift */}
          <input
            ref={dateInputRef}
            type="date"
            value={anchorYmd}
            onChange={handleDatePick}
            className="w-0 h-0 opacity-0 absolute pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
