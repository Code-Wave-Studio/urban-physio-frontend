import { useState } from 'react';
import FaIcon from '../FaIcon';

function CompactStat({ label, value, icon, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    primary: 'text-primary-700',
  };
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-2 sm:px-3 sm:py-2 shadow-sm">
      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">
        {label}
      </p>
      <p
        className={`text-sm sm:text-base font-bold mt-0.5 flex items-center gap-1 truncate ${
          tones[tone] || tones.slate
        }`}
      >
        {icon && <FaIcon icon={icon} className="text-[10px] sm:text-xs shrink-0 opacity-80" />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

/**
 * Compact directory header: title, stats, search + location + filters.
 */
export default function DirectoryListingHeader({
  title,
  accent = 'primary',
  stats = { count: 0, avgRating: null, minFee: null },
  statsLoading = false,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortBy,
  sortOptions = [],
  onSortChange,
  city,
  onLocationClick,
  locLoading = false,
  extraActions = null,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const accentText = accent === 'emerald' ? 'text-emerald-700' : 'text-primary-700';
  const accentRing = accent === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-primary-500';
  const locationChip =
    accent === 'emerald'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
      : 'bg-primary-50 text-primary-800 border-primary-100';

  const resultLabel = stats.count === 1 ? '1 result' : `${stats.count} results`;
  const ratingValue = stats.avgRating ? stats.avgRating : '—';
  const priceValue = stats.minFee != null ? `₹${Number(stats.minFee).toLocaleString('en-IN')}` : '—';

  return (
    <section className="border-b border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 sm:pt-5 sm:pb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>

        <div className="mt-3 flex gap-2 sm:gap-2.5">
          {statsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 h-[3.25rem] rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </>
          ) : (
            <>
              <CompactStat label="Results" value={resultLabel} tone="slate" />
              <CompactStat label="Avg rating" value={ratingValue} icon="fa-star" tone="amber" />
              <CompactStat label="From" value={priceValue} tone={accent === 'emerald' ? 'emerald' : 'primary'} />
            </>
          )}
        </div>

        <div className="mt-3 flex flex-row gap-2 items-stretch">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FaIcon
              icon="fa-magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
            />
            <input
              type="search"
              className={`input-field !py-2.5 !pl-10 !text-sm w-full min-h-[44px] ${accentRing}`}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Location */}
          <button
            type="button"
            onClick={onLocationClick}
            className={`shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] px-3 sm:px-4 rounded-xl border text-sm font-semibold transition active:scale-[0.98] ${locationChip} border`}
            aria-label={city ? `Location: ${city.name}. Change city` : 'Select city'}
          >
            <FaIcon icon="fa-location-dot" className={`text-xs ${accentText}`} />
            <span className="truncate max-w-[7rem] sm:max-w-[9rem]">
              {locLoading ? 'Detecting…' : city?.name || 'Location'}
            </span>
            <FaIcon icon="fa-chevron-down" className="text-[10px] opacity-60" />
          </button>

          {/* Filters */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition ${filtersOpen ? 'ring-2 ring-slate-200' : ''}`}
              aria-expanded={filtersOpen}
              aria-haspopup="listbox"
              aria-label="Filters and sort"
            >
              <FaIcon icon="fa-sliders" className="text-sm text-slate-500" />
              <span className="hidden min-[480px]:inline">Filters</span>
            </button>
            {filtersOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-[min(100vw-2rem,16rem)] rounded-xl border border-slate-200 bg-white shadow-xl p-3 space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Sort by</label>
                  <select
                    className="input-field !py-2.5 text-sm w-full"
                    value={sortBy}
                    onChange={(e) => {
                      onSortChange(e.target.value);
                      setFiltersOpen(false);
                    }}
                  >
                    {sortOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {extraActions && <div className="pt-2 border-t border-slate-100">{extraActions}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
