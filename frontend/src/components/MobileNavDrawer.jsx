import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FaIcon from './FaIcon';
import Logo from './Logo';
import NavDrawerProfileCard from './nav/NavDrawerProfileCard';
import {
  EXPLORE_LINKS,
  PROVIDER_LINKS,
  MORE_LINKS,
  speedDialForRole,
} from './nav/navDrawerLinks';
import { useNavDrawerSummary } from '../hooks/useNavDrawerSummary';
import { hapticClose, hapticOpen } from '../utils/haptics';

function isLinkActive(pathname, search, to) {
  const [path, query = ''] = to.split('?');
  if (path === '/') return pathname === '/';
  if (query) {
    if (pathname !== path) return false;
    const expected = new URLSearchParams(query);
    const current = new URLSearchParams(search);
    for (const [key, value] of expected) {
      if (current.get(key) !== value) return false;
    }
    return true;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavCategoryCard({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-10px_rgba(15,23,42,0.12)] p-4 ${className}`}
    >
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-0.5">{title}</h2>
      {children}
    </section>
  );
}

function NavListItem({ to, label, icon, pathname, search, onNavigate, tone = 'primary' }) {
  const active = isLinkActive(pathname, search, to);
  const iconTone =
    tone === 'emerald'
      ? active
        ? 'bg-emerald-100 text-emerald-600'
        : 'bg-emerald-50 text-emerald-500'
      : active
        ? 'bg-primary-100 text-primary-600'
        : 'bg-slate-100 text-slate-500';

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 py-3 px-1 rounded-xl transition-colors active:scale-[0.99] ${
        active ? 'bg-primary-50/80' : 'hover:bg-slate-50'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${iconTone}`}>
        <FaIcon icon={icon} />
      </span>
      <span className={`flex-1 text-[15px] font-medium leading-snug ${active ? 'text-primary-800' : 'text-slate-700'}`}>
        {label}
      </span>
      <FaIcon icon="fa-chevron-right" className="text-[10px] text-slate-300 shrink-0" />
    </Link>
  );
}

function SpeedDialTile({ item, onNavigate, unreadCount = 0 }) {
  const badge = item.notifyKey ? unreadCount : 0;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 min-h-[5.5rem] shadow-sm active:scale-[0.98] transition-transform"
    >
      <div
        className={`absolute -right-3 -top-3 w-16 h-16 rounded-full bg-gradient-to-br ${item.color} opacity-15 group-active:opacity-25`}
      />
      <div
        className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md mb-2.5`}
      >
        <FaIcon icon={item.icon} className="text-sm" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5 ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <p className="relative text-sm font-bold text-slate-800 leading-tight pr-1">{item.label}</p>
    </Link>
  );
}

/**
 * Full-screen mobile navigation drawer — Zomato-inspired healthcare layout.
 */
export default function MobileNavDrawer({
  open,
  onClose,
  user,
  hasRole,
  city,
  locationLabel,
  onShowLocation,
  onLogout,
}) {
  const { pathname, search } = useLocation();
  const wasOpen = useRef(false);
  const { summary, loading: summaryLoading } = useNavDrawerSummary(open, user);
  const speedDial = speedDialForRole(hasRole);
  const speedDialTitle = user ? 'Speed Dial' : 'Quick access';
  const gridCols = speedDial.length === 5 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  useEffect(() => {
    if (open && !wasOpen.current) hapticOpen();
    if (!open && wasOpen.current) hapticClose();
    wasOpen.current = open;
  }, [open]);

  const handleNavigate = () => onClose();

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={`site-mobile-backdrop fixed inset-0 z-[105] md:hidden bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`site-mobile-drawer site-mobile-drawer--fullscreen fixed inset-0 z-[108] md:hidden flex flex-col bg-gradient-to-b from-slate-50 via-white to-primary-50/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
          <Link to="/" onClick={handleNavigate} className="shrink-0">
            <Logo linkToHome={false} className="h-8 w-auto max-w-[110px] object-contain" showText={false} />
          </Link>
          <button
            type="button"
            className="site-header-menu-btn shrink-0 !w-10 !h-10"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <FaIcon icon="fa-xmark" className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5 nav-drawer-scroll">
          <NavDrawerProfileCard
            user={user}
            hasRole={hasRole}
            summary={summary}
            loading={summaryLoading}
            onNavigate={handleNavigate}
          />

          {city && (
            <button
              type="button"
              onClick={() => {
                onShowLocation();
                onClose();
              }}
              className="w-full flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm font-semibold text-primary-800 shadow-sm active:scale-[0.99] transition"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                <FaIcon icon="fa-location-dot" />
              </span>
              <span className="flex-1 text-left truncate">{locationLabel || city.name}</span>
              <span className="text-xs text-primary-600 font-medium">Change</span>
            </button>
          )}

          <NavCategoryCard title={speedDialTitle}>
            <div className={`grid ${gridCols} gap-3`}>
              {speedDial.map((item) => (
                <SpeedDialTile
                  key={item.to + item.label}
                  item={item}
                  onNavigate={handleNavigate}
                  unreadCount={summary.unreadNotifications}
                />
              ))}
            </div>
          </NavCategoryCard>

          <NavCategoryCard title="Explore">
            <div className="divide-y divide-slate-100">
              {EXPLORE_LINKS.map((link) => (
                <NavListItem
                  key={link.to + link.label}
                  {...link}
                  pathname={pathname}
                  search={search}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </NavCategoryCard>

          <NavCategoryCard title="Providers">
            <div className="divide-y divide-slate-100">
              {PROVIDER_LINKS.map((link) => (
                <NavListItem
                  key={link.label}
                  {...link}
                  pathname={pathname}
                  search={search}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </NavCategoryCard>

          <NavCategoryCard title="More">
            <div className="divide-y divide-slate-100">
              {MORE_LINKS.map((link) => (
                <NavListItem
                  key={link.label}
                  {...link}
                  pathname={pathname}
                  search={search}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm active:scale-[0.99] transition"
              >
                <FaIcon icon="fa-right-from-bracket" />
                Logout
              </button>
            )}
          </NavCategoryCard>

          <div className="h-2" aria-hidden />
        </div>
      </div>
    </>
  );
}
