import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import FaIcon from './FaIcon';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';
import MobileNavDrawer from './MobileNavDrawer';

const PRIMARY_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Find Doctor' },
  { to: '/clinics', label: 'Find Clinic' },
];

const MORE_NAV_LINKS = [
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical' },
  { to: '/treatments', label: 'Treatments', icon: 'fa-kit-medical' },
  { to: '/packages', label: 'Packages', icon: 'fa-box-open' },
  { to: '/conditions', label: 'Conditions', icon: 'fa-notes-medical' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell' },
  { to: '/physiofeed', label: 'PhysioFeed', icon: 'fa-newspaper' },
  { to: '/faq', label: 'FAQ', icon: 'fa-circle-question' },
  { to: '/contact', label: 'Contact Us', icon: 'fa-envelope' },
  { to: '/cancellation-help', label: 'Cancellation Help', icon: 'fa-calendar-xmark' },
  { to: '/register?role=doctor', label: 'Join as Provider', icon: 'fa-user-plus' },
];

/**
 * Public site header — same on home, booking, login, and admin (admin adds sidebar toggle via beforeLogo).
 * @param {{ beforeLogo?: import('react').ReactNode, headerSpacerClass?: string }} props
 */
export default function Navbar({ beforeLogo = null, headerSpacerClass = '' }) {
  const { pathname, search } = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { city, setShowSelector, locationLabel } = useLocationContext();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointerDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const dashboardPath = () => {
    if (!user) return '/login';
    if (hasRole('super_admin', 'admin')) return '/admin';
    if (hasRole('doctor')) return '/doctor';
    return '/patient';
  };

  const dashboardLabel = () => {
    if (hasRole('super_admin', 'admin')) return 'Admin';
    if (hasRole('doctor')) return 'Dashboard';
    if (hasRole('patient')) return 'My account';
    return 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const linkClass = (to) => {
    const active = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
    return `site-header-link ${active ? 'site-header-link--active' : ''}`;
  };

  const isMoreLinkActive = (to) => {
    const [path, query = ''] = to.split('?');
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
  };

  const moreMenuActive = MORE_NAV_LINKS.some((link) => isMoreLinkActive(link.to));

  return (
    <>
      <header
        className={`site-header glass-nav fixed top-0 left-0 right-0 z-[110] w-full ${
          scrolled ? 'glass-nav--scrolled' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 w-full">
            {/* Logo + optional admin sidebar toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {beforeLogo}
              <Link to="/" className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
                <Logo className="h-8 md:h-9 w-auto max-w-[120px] md:max-w-[150px] object-contain" showText={false} />
              </Link>
            </div>

            {/* Tablet + desktop navigation */}
            <nav
              className="hidden md:flex items-center gap-0.5 ml-4 lg:ml-6 xl:ml-10 shrink-0"
              aria-label="Main"
            >
              {PRIMARY_NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  className={`site-header-link inline-flex items-center gap-1.5 ${moreMenuActive ? 'site-header-link--active' : ''}`}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  More
                  <FaIcon icon="fa-chevron-down" className={`text-[10px] transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full z-[120] mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-900/10 p-2">
                    <div className="grid sm:grid-cols-2 gap-0.5">
                      {MORE_NAV_LINKS.map((link) => (
                        <Link
                          key={link.to + link.label}
                          to={link.to}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isMoreLinkActive(link.to)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-primary-700'
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-xs">
                            <FaIcon icon={link.icon} />
                          </span>
                          <span className="leading-snug">{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="hidden xl:flex flex-1 max-w-[280px] min-w-0 justify-center px-4 lg:px-6 mx-auto">
              <GlobalSearch variant="header" onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              {city && (
                <button
                  type="button"
                  onClick={() => setShowSelector(true)}
                  className="hidden md:inline-flex text-xs text-primary-700 glass px-2.5 py-1.5 rounded-full font-medium items-center gap-1 max-w-[140px]"
                >
                  <FaIcon icon="fa-location-dot" className="shrink-0" />
                  <span className="truncate">{locationLabel || city.name}</span>
                </button>
              )}
              <Link to="/book" className="hidden sm:inline-flex btn-primary text-sm !py-2 !px-4">
                Book Appointment
              </Link>
              {user ? (
                <>
                  <Link
                    to={dashboardPath()}
                    className="hidden md:inline-flex text-sm font-medium text-slate-600 hover:text-primary-600 px-1"
                  >
                    {dashboardLabel()}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden sm:inline-flex btn-outline text-sm !py-2 !px-3"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-primary-600 px-2"
                >
                  Login
                </Link>
              )}
              <button
                type="button"
                className="site-header-menu-btn md:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <FaIcon icon={mobileOpen ? 'fa-xmark' : 'fa-bars'} className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        hasRole={hasRole}
        dashboardPath={dashboardPath}
        dashboardLabel={dashboardLabel}
        city={city}
        locationLabel={locationLabel}
        onShowLocation={() => setShowSelector(true)}
        onLogout={handleLogout}
      />

      <div
        className={`site-header-spacer h-14 sm:h-16 shrink-0 ${headerSpacerClass}`}
        aria-hidden="true"
      />
    </>
  );
}
