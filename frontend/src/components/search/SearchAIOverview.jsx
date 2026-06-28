import FaIcon from '../FaIcon';

export default function SearchAIOverview({ text, parsed }) {
  if (!text) return null;

  const tags = [];
  if (parsed?.near_me) tags.push({ label: 'Near you', icon: 'fa-location-crosshairs' });
  if (parsed?.consultation_mode === 'home_visit') tags.push({ label: 'Home visit', icon: 'fa-house-medical' });
  if (parsed?.consultation_mode === 'online') tags.push({ label: 'Online', icon: 'fa-video' });
  if (parsed?.gender === 'female') tags.push({ label: 'Female physio', icon: 'fa-venus' });
  if (parsed?.concepts?.length) {
    tags.push({ label: parsed.concepts[0].replace(/_/g, ' '), icon: 'fa-brain' });
  }

  return (
    <section
      className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50/40 p-4 sm:p-5 mb-6 shadow-sm"
      aria-label="Search insight"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
          <FaIcon icon="fa-lightbulb" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700 mb-1">Quick insight</p>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{text}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-orange-100 text-orange-800"
                >
                  <FaIcon icon={t.icon} className="text-[10px]" />
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
