/**
 * Mobile-first horizontal chip scroller — shows ~3–4 items, swipe for more.
 */
export default function HorizontalScrollRow({ children, className = '', ariaLabel }) {
  return (
    <div
      className={`flex gap-2.5 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x snap-mandatory scroll-smooth touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role={ariaLabel ? 'list' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function scrollChipClass(selected, variant = 'default') {
  const base =
    'shrink-0 snap-start min-h-[44px] rounded-2xl border-2 font-semibold transition-all duration-200 active:scale-[0.98]';
  if (variant === 'session') {
    return `${base} min-w-[7.5rem] px-4 py-2.5 text-xs ${
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-md'
        : 'bg-white text-slate-700 border-slate-200'
    }`;
  }
  if (variant === 'date') {
    return `${base} min-w-[8.5rem] max-w-[9.5rem] px-3 py-2.5 text-left ${
      selected
        ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
        : 'border-slate-200 bg-white hover:border-emerald-300'
    }`;
  }
  if (variant === 'time') {
    return `${base} min-w-[6.5rem] max-w-[7.5rem] px-3 py-2.5 text-sm flex items-center justify-center gap-2 ${
      selected
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10'
        : 'border-emerald-100 bg-emerald-50/40 text-emerald-800 hover:border-emerald-300'
    }`;
  }
  return base;
}
