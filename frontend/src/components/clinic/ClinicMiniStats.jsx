import FaIcon from '../FaIcon';

/**
 * Compact stat chips — same height as badge buttons, horizontal scroll.
 */
export default function ClinicMiniStats({ clinic, className = '' }) {
  const rating = Number(clinic.rating_avg ?? clinic.statistics?.avg_rating) || 0;
  const reviews = Number(clinic.rating_count ?? clinic.statistics?.rating_count) || 0;
  const doctors = Number(clinic.doctor_count ?? clinic.statistics?.doctor_count) || 0;
  const patients = clinic.statistics?.patients_treated;

  const chips = [
    rating > 0 && {
      key: 'rating',
      icon: 'fa-star',
      label: rating.toFixed(1),
      tone: 'amber',
    },
    {
      key: 'reviews',
      icon: 'fa-comment-dots',
      label: reviews > 0 ? reviews.toLocaleString('en-IN') : '0',
      tone: 'slate',
    },
    doctors > 0 && {
      key: 'doctors',
      icon: 'fa-user-doctor',
      label: String(doctors),
      tone: 'emerald',
    },
    patients > 0 && {
      key: 'patients',
      icon: 'fa-users',
      label: `${Number(patients).toLocaleString('en-IN')}+`,
      tone: 'teal',
    },
  ].filter(Boolean);

  const tones = {
    amber: 'bg-amber-50 text-amber-900 border-amber-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    teal: 'bg-teal-50 text-teal-800 border-teal-100',
  };

  return (
    <div
      className={`flex gap-1.5 overflow-x-auto pb-0.5 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {chips.map((c) => (
        <span
          key={c.key}
          className={`shrink-0 snap-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${tones[c.tone]}`}
        >
          <FaIcon icon={c.icon} className="text-[10px] opacity-80" />
          {c.label}
        </span>
      ))}
    </div>
  );
}
