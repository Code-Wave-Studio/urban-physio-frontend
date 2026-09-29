import {
  buildWorkoutOverviewRows,
  buildWorkoutOverviewSections,
  formatAccuracy,
  formatDuration,
} from './kinestexWorkoutOverviewMetrics';
import KinesteXMetricSection from './KinesteXMetricSection';

export { buildWorkoutOverviewRows, buildWorkoutOverviewSections, formatAccuracy, formatDuration };

export function MetricTile({ label, value }) {
  return (
    <div className="min-w-0 max-w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-normal text-slate-500 leading-snug break-words">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold leading-snug text-slate-900 break-words [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

/** Workout Overview — only renders metrics that are actually available. */
export default function KinesteXWorkoutOverview({
  metrics,
  title = 'Workout Overview',
  emptyMessage = 'No performance metrics were recorded for this session.',
  className = '',
}) {
  const sections = buildWorkoutOverviewSections(metrics);

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
      {title ? <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p> : null}
      {sections.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-2.5">
          {sections.map((section) => (
            <KinesteXMetricSection
              key={section.id}
              title={section.title}
              icon={section.icon}
              tone={section.tone}
              rows={section.items}
            />
          ))}
        </div>
      )}
    </div>
  );
}
