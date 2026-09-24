import {
  buildWorkoutOverviewRows,
  formatAccuracy,
  formatDuration,
} from './kinestexWorkoutOverviewMetrics';

export { buildWorkoutOverviewRows, formatAccuracy, formatDuration };

export function MetricTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  );
}

/**
 * Workout Overview grid — only renders metrics that are actually available.
 */
export default function KinesteXWorkoutOverview({
  metrics,
  title = 'Workout Overview',
  emptyMessage = 'No performance metrics were recorded for this session.',
  className = '',
}) {
  const rows = buildWorkoutOverviewRows(metrics);

  return (
    <div className={className}>
      {title ? (
        <p className="text-sm font-semibold text-slate-800 mb-2">{title}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {rows.map((row) => (
            <MetricTile key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}
    </div>
  );
}
