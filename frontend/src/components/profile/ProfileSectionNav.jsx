import { useEffect, useState } from 'react';

export const PROFILE_TABS = [
  { id: 'profile-overview', label: 'Overview' },
  { id: 'profile-services', label: 'Services/Treatments' },
  { id: 'profile-media', label: 'Photos & Videos' },
];

export function scrollToProfileSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ProfileSectionNav({ tabs = PROFILE_TABS, accent = 'primary' }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const ids = tabs.map((t) => t.id);
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= 140) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tabs]);

  const activeClass =
    accent === 'emerald'
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
      : 'bg-primary-600 text-white border-primary-600 shadow-primary-600/20';

  return (
    <nav
      className="sticky top-14 sm:top-16 z-30 -mx-4 px-4 py-2.5 bg-white/90 backdrop-blur-md border-y border-slate-200/80 shadow-sm"
      aria-label="Profile sections"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin max-w-6xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActive(tab.id);
              scrollToProfileSection(tab.id);
            }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
              active === tab.id
                ? `${activeClass} shadow-md`
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
