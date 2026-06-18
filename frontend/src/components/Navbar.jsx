import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import FaIcon from './FaIcon';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Find Doctors' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/packages', label: 'Packages' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/conditions', label: 'Conditions' },
];

/**
 * Public site header — same on home, booking, login, and admin (admin adds sidebar toggle via beforeLogo).
 * @param {{ beforeLogo?: import('react').ReactNode, headerSpacerClass?: string }} props
 */
export default function Navbar({ beforeLogo = null, headerSpacerClass = '' }) {
  const { pathname } = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { city, setShowSelector } = useLocationContext();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  return (
    <>
      <header
        className={`site-header glass-nav fixed top-0 left-0 right-0 z-[110] w-full ${
          scrolled ? 'glass-nav--scrolled' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-14 sm:h-16">
            {/* Logo + optional admin sidebar toggle */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              {beforeLogo}
              <Link to="/" className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
                <Logo className="h-8 md:h-9 w-auto max-w-[120px] md:max-w-[150px] object-contain" showText={false} />
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-0.5 flex-1 px-2 xl:px-4 min-w-0" aria-label="Main">
              {NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden xl:flex flex-1 max-w-[280px] min-w-0 justify-center px-2">
              <GlobalSearch variant="header" onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="hidden md:inline-flex xl:hidden site-header-menu-btn"
                aria-label="Open search and menu"
              >
                <FaIcon icon="fa-magnifying-glass" />
              </button>
              {city && (
                <button
                  type="button"
                  onClick={() => setShowSelector(true)}
                  className="hidden md:inline-flex text-xs text-primary-700 glass px-2.5 py-1.5 rounded-full font-medium items-center gap-1 max-w-[140px]"
                >
                  <FaIcon icon="fa-location-dot" className="shrink-0" />
                  <span className="truncate">{city.name}</span>
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
                className="site-header-menu-btn lg:hidden"
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

      {/* Mobile menu overlay */}
      <button
        type="button"
        aria-label="Close menu"
        className={`site-mobile-backdrop fixed inset-0 z-[105] lg:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`site-mobile-drawer fixed top-0 right-0 z-[108] h-full w-[min(20rem,92vw)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="font-bold text-slate-900">Menu</span>
          <button type="button" className="site-header-menu-btn" onClick={() => setMobileOpen(false)} aria-label="Close">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="pb-3 mb-2 border-b border-slate-100">
            <GlobalSearch variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-3 rounded-xl text-base font-medium ${
                pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to))
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {city && (
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-primary-700 hover:bg-primary-50 flex items-center gap-2"
              onClick={() => {
                setShowSelector(true);
                setMobileOpen(false);
              }}
            >
              <FaIcon icon="fa-location-dot" />
              {city.name}
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
          <Link to="/book" className="btn-primary w-full text-center block text-sm" onClick={() => setMobileOpen(false)}>
            Book Appointment
          </Link>
          {user ? (
            <>
              <Link
                to={dashboardPath()}
                className="btn-outline w-full text-center block text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {dashboardLabel()}
              </Link>
              <button type="button" className="btn-outline w-full text-sm text-red-700 border-red-200" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-outline w-full text-center block text-sm" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
          )}
        </div>
      </div>

      <div
        className={`site-header-spacer h-14 sm:h-16 shrink-0 ${headerSpacerClass}`}
        aria-hidden="true"
      />
    </>
  );
}
