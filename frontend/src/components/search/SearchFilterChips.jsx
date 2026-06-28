import FaIcon from '../FaIcon';

export default function SearchFilterChips({ filters, activeType, onSelect, query }) {
  if (!filters?.length) return null;

  return (
    <div className="mb-6" role="navigation" aria-label="Search result filters">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
        Filter results for &ldquo;{query}&rdquo;
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition ${
            !activeType
              ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
          }`}
        >
          <FaIcon icon="fa-layer-group" className="text-xs" />
          All results
        </button>
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.type)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition ${
              activeType === f.type
                ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
            }`}
          >
            <FaIcon icon={f.icon} className="text-xs" />
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeType === f.type ? 'bg-white/20' : 'bg-slate-100'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
