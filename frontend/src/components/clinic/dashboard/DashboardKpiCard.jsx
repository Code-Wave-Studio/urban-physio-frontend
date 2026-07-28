import FaIcon from '../../FaIcon';

/** Brand-aligned KPI tints — primary orange default + semantic accents */
const TINTS = {
  primary: {
    chip: 'bg-primary-50 text-primary-600 border border-primary-100',
    bar: 'from-primary-500 via-primary-400 to-amber-400',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700 border border-amber-100',
    bar: 'from-amber-500 to-amber-400',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    bar: 'from-emerald-500 to-emerald-400',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-700 border border-rose-100',
    bar: 'from-rose-500 to-rose-400',
  },
  sky: {
    chip: 'bg-sky-50 text-sky-700 border border-sky-100',
    bar: 'from-sky-500 to-sky-400',
  },
  slate: {
    chip: 'bg-slate-50 text-slate-600 border border-slate-100',
    bar: 'from-slate-400 to-slate-300',
  },
  // legacy aliases
  teal: {
    chip: 'bg-primary-50 text-primary-600 border border-primary-100',
    bar: 'from-primary-500 via-primary-400 to-amber-400',
  },
  violet: {
    chip: 'bg-orange-50 text-orange-800 border border-orange-100',
    bar: 'from-orange-500 to-primary-400',
  },
  orange: {
    chip: 'bg-primary-50 text-primary-600 border border-primary-100',
    bar: 'from-primary-500 to-primary-400',
  },
};

export default function DashboardKpiCard({
  icon,
  label,
  value,
  hint,
  tint = 'primary',
  onClick,
  className = '',
}) {
  const t = TINTS[tint] || TINTS.primary;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`dash-kpi group relative overflow-hidden text-left ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="dash-kpi-label">{label}</p>
          <p className="dash-kpi-value mt-2 truncate">{value}</p>
          {hint != null && hint !== '' && (
            <p className="text-[11px] text-slate-500 mt-2 truncate font-medium">{hint}</p>
          )}
        </div>
        <span className={`dash-kpi-icon ${t.chip}`}>
          <FaIcon icon={icon} />
        </span>
      </div>
    </Tag>
  );
}
