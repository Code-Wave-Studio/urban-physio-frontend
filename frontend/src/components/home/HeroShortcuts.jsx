import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

/*
 * Quick links under the homepage hero: 4×2 grid on phones and tablets,
 * one row of 8 inside a soft panel on desktop.
 */
const SHORTCUTS = [
  { to: '/home-physiotherapy', label: 'Physio at home', icon: 'fa-house-medical', bg: '#FDE7E3', fg: '#C2412F' },
  { to: '/telephysio', label: 'Tele-rehab', icon: 'fa-video', bg: '#ECE6FB', fg: '#5B45B0' },
  { to: '/doctors', label: 'Physios', icon: 'fa-user-doctor', bg: '#E3ECF8', fg: '#2B5288' },
  { to: '/clinics', label: 'Clinics', icon: 'fa-hospital', bg: '#DFF3EA', fg: '#1F7A55' },
  { to: '/exercises', label: 'Exercises', icon: 'fa-dumbbell', bg: '#FCEBDD', fg: '#A45512' },
  { to: '/blog', label: 'Blogs', icon: 'fa-newspaper', bg: '#E6E9F8', fg: '#3B4A9C' },
  { to: '/podcast', label: 'Podcasts', icon: 'fa-podcast', bg: '#F8E4EE', fg: '#9B2F66' },
  { to: '/offers', label: 'Offers', icon: 'fa-tags', bg: '#FAF1D6', fg: '#86680D' },
];

export default function HeroShortcuts({ baseDelay = 480 }) {
  return (
    <nav aria-label="Quick links">
      <ul className="tup-tiles">
        {SHORTCUTS.map((s, i) => (
          <li key={s.to} className="tup-rise" style={{ '--d': `${baseDelay + i * 45}ms` }}>
            <Link to={s.to} className="tup-tile" style={{ '--tile-bg': s.bg, '--tile-fg': s.fg }}>
              <span className="tup-tile-icon" aria-hidden="true">
                <FaIcon icon={s.icon} />
              </span>
              <span className="tup-tile-label">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
