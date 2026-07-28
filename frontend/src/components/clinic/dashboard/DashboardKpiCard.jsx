import FaIcon from '../../FaIcon';

const TINTS = {
  teal: { chip: 'bg-teal-50 text-teal-700', bar: 'from-teal-500 to-teal-400' },
  amber: { chip: 'bg-amber-50 text-amber-700', bar: 'from-amber-500 to-amber-400' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700', bar: 'from-emerald-500 to-emerald-400' },
  rose: { chip: 'bg-rose-50 text-rose-700', bar: 'from-rose-500 to-rose-400' },
  violet: { chip: 'bg-violet-50 text-violet-700', bar: 'from-violet-500 to-violet-400' },
  sky: { chip: 'bg-sky-50 text-sky-700', bar: 'from-sky-500 to-sky-400' },
  orange: { chip: 'bg-orange-50 text-orange-700', bar: 'from-orange-500 to-orange-400' },
};

export default function DashboardKpiCard({
  icon,
  label,
  value,
  hint,
  tint = 'teal',
  onClick,
  className = '',
}) {
  const t = TINTS[tint] || TINTS.teal;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`dash-kpi group relative overflow-hidden text-left ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar} opacity-80`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="dash-kpi-label">{label}</p>
          <p className="dash-kpi-value mt-1.5 truncate">{value}</p>
          {hint != null && hint !== '' && (
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">{hint}</p>
          )}
        </div>
        <span className={`dash-kpi-icon ${t.chip}`}>
          <FaIcon icon={icon} />
        </span>
      </div>
    </Tag>
  );
}
