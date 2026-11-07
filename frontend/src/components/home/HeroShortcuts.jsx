import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

/*
 * Swipeable quick-access chips under the homepage hero.
 * Mobile and tablet only (hidden from lg up, where the navbar covers these).
 */
const SHORTCUTS = [
  { to: '/home-physiotherapy', label: 'Physio at home', icon: 'fa-house-medical', tint: '#FFE9E6', color: '#E8584A' },
  { to: '/telephysio', label: 'Tele-rehab', icon: 'fa-video', tint: '#ECE9FF', color: '#5E50E0' },
  { to: '/doctors', label: 'Physiotherapists', icon: 'fa-user-doctor', tint: '#E6EEF8', color: '#376299' },
  { to: '/clinics', label: 'Clinics', icon: 'fa-hospital', tint: '#DDF6F1', color: '#0E8A7E' },
  { to: '/exercises', label: 'Exercises', icon: 'fa-dumbbell', tint: '#FFEAD8', color: '#EA6A12' },
  { to: '/blog', label: 'Blogs', icon: 'fa-newspaper', tint: '#E8EDFB', color: '#3F51B5' },
  { to: '/podcast', label: 'Podcasts', icon: 'fa-podcast', tint: '#FCE7F3', color: '#C0267A' },
  { to: '/offers', label: 'Offers', icon: 'fa-tags', tint: '#FEF3C7', color: '#B7791F' },
];

export default function HeroShortcuts() {
  return (
    <nav aria-label="Quick links" className="lg:hidden">
      <ul className="tup-shortcuts flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 pb-1 -mb-1">
        {SHORTCUTS.map((s, i) => (
          <li key={s.to} className="snap-start shrink-0 tup-slide" style={{ '--d': `${520 + i * 55}ms` }}>
            <Link
              to={s.to}
              className="tup-chip group inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 whitespace-nowrap"
            >
              <span
                className="tup-chip-icon inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{ backgroundColor: s.tint, color: s.color }}
              >
                <FaIcon icon={s.icon} className="text-[12px]" />
              </span>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
