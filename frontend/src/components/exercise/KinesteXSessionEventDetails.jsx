import { presentSessionEvents } from './kinestexSessionEventPresent';
import KinesteXMetricSection from './KinesteXMetricSection';

/**
 * Human-readable KinesteX session events. Replaces the raw key/value dump.
 */
export default function KinesteXSessionEventDetails({ events }) {
  const blocks = presentSessionEvents(events);
  if (!blocks.length) return null;

  return (
    <section className="min-w-0 max-w-full space-y-3">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-slate-900">Session details</h4>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          KinesteX event data grouped by category. Every recorded value is kept.
        </p>
      </div>
      <div className="space-y-3">
        {blocks.map((block) => (
          <article
            key={block.id}
            className="min-w-0 max-w-full space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3"
          >
            <h5 className="text-sm font-semibold leading-snug text-slate-800 break-words">{block.title}</h5>
            {block.groups.map((group) => (
              <KinesteXMetricSection
                key={`${block.id}-${group.id}`}
                title={group.title}
                icon={group.icon}
                tone={group.tone}
                rows={group.rows}
              />
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
