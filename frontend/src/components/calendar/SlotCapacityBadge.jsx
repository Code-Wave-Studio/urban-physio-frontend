/**
 * SlotCapacityBadge
 * Displays slot occupancy indicator with color coding and progress bar.
 * Used inside Agenda cards, Event details modal, and Calendar slots.
 *
 * Props:
 *  - booked   {number}
 *  - capacity {number}
 *  - status   {'open'|'limited'|'full'|'blocked'|'holiday'|'leave'}
 *  - enabled  {boolean}  – false = capacity not enforced → show nothing
 *  - compact  {boolean}  – single-line badge mode
 */
export default function SlotCapacityBadge({ booked, capacity, status, enabled, compact = false }) {
  if (!enabled || capacity == null) return null;

  const remaining = Math.max(0, capacity - booked);
  const pct       = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;

  // Color scheme by status
  const scheme = (() => {
    if (status === 'full' || remaining === 0) return { dot: '🔴', bar: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Fully Booked' };
    if (status === 'limited' || remaining === 1) return { dot: '🟡', bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: `${remaining} slot available` };
    return { dot: '🟢', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: `${remaining} available` };
  })();

  // 5-block progress bar (Feature 9)
  const filledBlocks = Math.round((pct / 100) * 5);
  const progressBar  = Array.from({ length: 5 }, (_, i) =>
    i < filledBlocks ? '█' : '░'
  ).join('');

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${scheme.bg} ${scheme.border} ${scheme.text}`}>
        {scheme.dot} {scheme.label}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border px-3 py-2 ${scheme.bg} ${scheme.border} space-y-1`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${scheme.text}`}>
          {scheme.dot} {scheme.label}
        </span>
        <span className={`text-[11px] font-semibold ${scheme.text}`}>
          {booked} / {capacity}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs tracking-tighter text-slate-500">{progressBar}</span>
        <span className="text-[10px] text-slate-400">{pct}%</span>
      </div>
    </div>
  );
}
