import FaIcon from '../FaIcon';

const COLOR_MAP = {
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  sky: 'bg-sky-100 text-sky-800 border-sky-200',
};

export default function BadgeList({ badges = [], compact = false }) {
  if (!badges?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>
      {badges.map((b) => (
        <span
          key={b.id || b.slug}
          title={b.description || b.name}
          className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full border ${
            COLOR_MAP[b.color] || COLOR_MAP.orange
          }`}
        >
          <FaIcon icon={b.icon || 'fa-award'} className="text-[10px]" />
          {b.name}
        </span>
      ))}
    </div>
  );
}
