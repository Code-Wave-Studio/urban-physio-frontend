import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import {
  PACKAGE_CATEGORIES,
  normalizePackagePricing,
  packageMatchesCategory,
} from '../../utils/packageHelpers';

const INITIAL_VISIBLE = 4;

function CategoryTabs({ active, onChange, counts }) {
  return (
    <div
      className="relative flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-inner"
      role="tablist"
      aria-label="Package category"
    >
      {PACKAGE_CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        const count = counts[cat.id] || 0;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className={`relative flex-1 min-w-0 z-[1] flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-300 ${
              isActive ? 'text-white' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="package-category-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 shadow-md shadow-orange-600/25"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative shrink-0 text-base sm:text-lg leading-none" aria-hidden>
              {cat.emoji}
            </span>
            <span className="relative truncate">{cat.label}</span>
            {count > 0 && (
              <span
                className={`relative hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PackageCard({
  pkg,
  index,
  interaction,
  selected,
  onSelect,
  bookUrl,
  bookLabel = 'Book Now',
}) {
  const { displayPrice, displayMrp, hasDiscount, discountPercent } = normalizePackagePricing(pkg);
  const sessions = pkg.total_sessions || 1;
  const duration = pkg.duration_days;

  const cardInner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">{pkg.name}</h3>
          {pkg.package_source === 'admin' && (
            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              Platform package
            </span>
          )}
        </div>
        {hasDiscount && discountPercent > 0 && (
          <span className="shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Save {discountPercent}%
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          <FaIcon icon="fa-calendar-check" className="text-orange-500 text-[10px]" />
          {sessions} session{sessions !== 1 ? 's' : ''}
        </span>
        {duration ? (
          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <FaIcon icon="fa-clock" className="text-orange-500 text-[10px]" />
            {duration} day{duration !== 1 ? 's' : ''}
          </span>
        ) : null}
      </div>

      {pkg.short_description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">{pkg.short_description}</p>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between gap-3 flex-wrap">
        <div>
          {hasDiscount && (
            <p className="text-sm text-slate-400 line-through">
              ₹{displayMrp.toLocaleString('en-IN')}
            </p>
          )}
          <p className={`text-xl sm:text-2xl font-bold ${hasDiscount ? 'text-emerald-600' : 'text-slate-900'}`}>
            ₹{displayPrice.toLocaleString('en-IN')}
          </p>
        </div>

        {interaction === 'select' ? (
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition ${
              selected
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}
          >
            {selected ? (
              <>
                <FaIcon icon="fa-check" className="text-xs" />
                Selected
              </>
            ) : (
              'Select'
            )}
          </span>
        ) : bookUrl ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 group-hover:shadow-lg group-hover:shadow-orange-600/30 transition">
            {bookLabel}
            <FaIcon icon="fa-arrow-right" className="text-xs group-hover:translate-x-0.5 transition-transform" />
          </span>
        ) : null}
      </div>
    </>
  );

  const cardClass = `group rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-300 ${
    interaction === 'select' && selected
      ? 'border-orange-400 ring-2 ring-orange-200 shadow-lg shadow-orange-100'
      : 'border-slate-200/90 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-0.5 active:scale-[0.99]'
  }`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      layout
    >
      {interaction === 'select' ? (
        <button type="button" onClick={onSelect} className={`${cardClass} w-full text-left`}>
          {cardInner}
        </button>
      ) : bookUrl ? (
        <Link to={bookUrl} className={`${cardClass} block`}>
          {cardInner}
        </Link>
      ) : (
        <div className={cardClass}>{cardInner}</div>
      )}
    </motion.article>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center"
    >
      <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
        <FaIcon icon="fa-box-open" className="text-xl" />
      </div>
      <p className="text-sm font-medium text-slate-600">No packages available for this service.</p>
    </motion.div>
  );
}

/**
 * Category-tabbed treatment package browser with modern cards, expand/collapse, and responsive layout.
 */
export default function TreatmentPackagesBrowser({
  packages = [],
  interaction = 'navigate',
  getBookUrl,
  getPackageKey,
  selectedKey,
  onSelect,
  defaultCategory = 'clinic',
  lockCategory = false,
  bookLabel = 'Book Now',
  className = '',
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (defaultCategory && PACKAGE_CATEGORIES.some((c) => c.id === defaultCategory)) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  const counts = useMemo(() => {
    const c = { clinic: 0, home_visit: 0, online: 0 };
    packages.forEach((pkg) => {
      PACKAGE_CATEGORIES.forEach((cat) => {
        if (packageMatchesCategory(pkg, cat.id)) c[cat.id] += 1;
      });
    });
    return c;
  }, [packages]);

  const activeCategory = lockCategory && defaultCategory ? defaultCategory : category;

  const filtered = useMemo(
    () => packages.filter((pkg) => packageMatchesCategory(pkg, activeCategory)),
    [packages, activeCategory]
  );

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  useEffect(() => {
    setExpanded(false);
  }, [activeCategory]);

  useEffect(() => {
    if (lockCategory) return;
    if (counts[category] > 0) return;
    const firstWithPackages = PACKAGE_CATEGORIES.find((cat) => counts[cat.id] > 0);
    if (firstWithPackages) setCategory(firstWithPackages.id);
  }, [counts, category, lockCategory]);

  if (!packages.length) return null;

  return (
    <div className={`space-y-5 sm:space-y-6 ${className}`}>
      {!lockCategory && <CategoryTabs active={category} onChange={setCategory} counts={counts} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                {visible.map((pkg, idx) => {
                  const key = getPackageKey ? getPackageKey(pkg) : String(pkg.id || pkg.slug);
                  const bookUrl = interaction === 'navigate' && getBookUrl ? getBookUrl(pkg) : null;
                  return (
                    <PackageCard
                      key={key}
                      pkg={pkg}
                      index={idx}
                      interaction={interaction}
                      selected={interaction === 'select' && selectedKey === key}
                      onSelect={() => onSelect?.(key, pkg)}
                      bookUrl={bookUrl}
                      bookLabel={bookLabel}
                    />
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {expanded ? (
                      <>
                        Show less
                        <FaIcon icon="fa-chevron-up" className="text-xs" />
                      </>
                    ) : (
                      <>
                        View More Packages
                        <FaIcon icon="fa-chevron-down" className="text-xs" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
