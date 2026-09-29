import FaIcon from '../FaIcon';

const TONES = {
  teal: {
    wrap: 'border-teal-100 bg-teal-50/60',
    icon: 'bg-teal-100 text-teal-700',
    kicker: 'text-teal-900',
  },
  violet: {
    wrap: 'border-violet-100 bg-violet-50/60',
    icon: 'bg-violet-100 text-violet-700',
    kicker: 'text-violet-900',
  },
  amber: {
    wrap: 'border-amber-100 bg-amber-50/70',
    icon: 'bg-amber-100 text-amber-800',
    kicker: 'text-amber-950',
  },
  orange: {
    wrap: 'border-orange-100 bg-orange-50/70',
    icon: 'bg-orange-100 text-orange-700',
    kicker: 'text-orange-950',
  },
  sky: {
    wrap: 'border-sky-100 bg-sky-50/70',
    icon: 'bg-sky-100 text-sky-800',
    kicker: 'text-sky-950',
  },
  slate: {
    wrap: 'border-slate-200 bg-slate-50',
    icon: 'bg-slate-200 text-slate-700',
    kicker: 'text-slate-800',
  },
};

export default function KinesteXMetricSection({ title, icon = 'fa-circle-info', tone = 'slate', rows = [] }) {
  const toneClass = TONES[tone] || TONES.slate;
  if (!rows.length) return null;

  return (
    <section className={`min-w-0 max-w-full rounded-xl border px-3 py-3 ${toneClass.wrap}`}>
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass.icon}`}>
          <FaIcon icon={icon} className="text-xs" />
        </span>
        <h4 className={`min-w-0 text-sm font-semibold leading-snug ${toneClass.kicker}`}>{title}</h4>
      </div>
      <dl className="kx-metric-grid">
        {rows.map((row, index) => (
          <div
            key={`${row.key || row.label}-${index}`}
            className="min-w-0 max-w-full rounded-lg border border-white/80 bg-white px-3 py-2"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-normal text-slate-500 leading-snug break-words">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-base font-bold leading-snug text-slate-900 break-words [overflow-wrap:anywhere]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
