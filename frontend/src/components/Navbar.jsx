import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import FaIcon from './FaIcon';
import Logo from './Logo';
import MobileNavDrawer from './MobileNavDrawer';
import NotificationBell from './NotificationBell';
import PortalProfileCard from './portal/PortalProfileCard';
import { setFloatingActionsHidden } from '../utils/floatingActionsBus';

const PRIMARY_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Find Doctor' },
  { to: '/clinics', label: 'Find Clinic' },
  { to: '/exercises', label: 'Exercise Library' },
  { to: '/physiofeed', label: 'PhysioFeed' },
  { to: '/about', label: 'About Us' },
];

const EXPLORE_SECTIONS = [
  {
    title: 'Clinical Services',
    icon: 'fa-kit-medical',
    items: [
      {
        to: '/treatments',
        label: 'Treatments',
        desc: 'Advanced physical therapy & manual care',
        icon: 'fa-kit-medical',
        iconBg: 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
      },
      {
        to: '/conditions',
        label: 'Conditions',
        desc: 'Targeted spine, joint & injury rehab',
        icon: 'fa-notes-medical',
        iconBg: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      },
      {
        to: '/packages',
        label: 'Packages',
        desc: 'Curated recovery plans & treatment tiers',
        icon: 'fa-box-open',
        iconBg: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      },
      {
        to: '/home-physiotherapy',
        label: 'Home Physiotherapy',
        desc: 'Hospital-trained physios at your doorstep',
        icon: 'fa-house-medical',
        iconBg: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
        badge: 'Home Visit',
      },
      {
        to: '/telephysio',
        label: 'TelePhysio by Myoreset',
        desc: 'Virtual video consult & online rehab',
        icon: 'fa-video',
        iconBg: 'bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
        badge: 'Online',
      },
    ],
  },
  {
    title: 'Community & Resources',
    icon: 'fa-users',
    items: [
      {
        to: '/offers',
        label: 'Offers',
        desc: '10 KM run challenge & free sessions',
        icon: 'fa-tag',
        iconBg: 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
        badge: 'Reward',
      },
      {
        to: '/podcast',
        label: 'Podcast',
        desc: 'Clinical talks, recovery & health episodes',
        icon: 'fa-podcast',
        iconBg: 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      },
      {
        to: '/careers',
        label: 'Careers',
        desc: 'Join our team of clinical specialists',
        icon: 'fa-briefcase',
        iconBg: 'bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
      },
      {
        to: '/faq',
        label: 'FAQ',
        desc: 'Answers to patient questions & booking',
        icon: 'fa-circle-question',
        iconBg: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      },
      {
        to: '/contact',
        label: 'Contact Us',
        desc: 'Clinic support, helpline & inquiries',
        icon: 'fa-envelope',
        iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white',
      },
    ],
  },
];

const ALL_EXPLORE_LINKS = EXPLORE_SECTIONS.flatMap((s) => s.items);

/**
 * Public site header — same on home, booking, login, and portals (portals add sidebar toggle via beforeLogo).
 * @param {{ beforeLogo?: import('react').ReactNode, headerSpacerClass?: string, portalMode?: boolean }} props
 */
export default function Navbar({
  beforeLogo = null,
  headerSpacerClass = '',
  portalMode = false,
  logoSrc = null,
  logoAlt = 'The Urban Physio',
  portalProfileProps = null,
  portalProfileCard = null,
}) {
  const { pathname, search } = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { city, setShowSelector, locationLabel } = useLocationContext();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreCloseTimer = useRef(null);

  const openMore = () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    setMoreOpen(true);
  };
  const scheduleCloseMore = () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    moreCloseTimer.current = setTimeout(() => setMoreOpen(false), 160);
  };

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
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setFloatingActionsHidden(mobileOpen, 'menu');
    return () => setFloatingActionsHidden(false, 'menu');
  }, [mobileOpen]);

  const dashboardPath = () => {
    if (!user) return '/login';
    if (hasRole('super_admin', 'admin')) return '/admin';
    if (hasRole('clinic', 'clinic_staff')) return '/clinic-portal';
    if (hasRole('doctor')) return '/doctor';
    return '/patient';
  };

  const dashboardLabel = () => {
    if (hasRole('super_admin', 'admin')) return 'Admin';
    if (hasRole('clinic', 'clinic_staff')) return 'Clinic portal';
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

  const moreMenuActive = ALL_EXPLORE_LINKS.some((link) => isMoreLinkActive(link.to));

  return (
    <>
      <header
        className={`site-header glass-nav fixed top-0 left-0 right-0 z-[110] w-full ${
          scrolled ? 'glass-nav--scrolled' : ''
        }`}
      >
        <div className={portalMode ? 'w-full px-3 sm:px-4 lg:px-6' : 'max-w-7xl mx-auto px-3 sm:px-4 lg:px-8'}>
          <div className="flex items-center h-14 sm:h-16 w-full">
            {/* Logo or Portal Profile Card + optional admin sidebar toggle */}
            <div className="flex items-center gap-2 min-w-0 shrink">
              {beforeLogo}
              {portalProfileCard ? (
                portalProfileCard
              ) : portalMode && portalProfileProps ? (
                <PortalProfileCard {...portalProfileProps} inHeader />
              ) : !portalMode ? (
                <Link to="/" className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
                  <Logo
                    linkToHome={false}
                    className="h-8 sm:h-9 md:h-10 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain"
                    showText={false}
                    src={logoSrc || undefined}
                    alt={logoAlt}
                  />
                </Link>
              ) : null}
            </div>

            {/* Tablet + desktop public navigation (hidden inside portals — use sidebar) */}
            {!portalMode && (
            <nav
              className="hidden md:flex items-center gap-0.5 ml-4 lg:ml-6 xl:ml-10 shrink-0"
              aria-label="Main"
            >
              {PRIMARY_NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
              <div
                className="relative"
                ref={moreRef}
                onMouseEnter={openMore}
                onMouseLeave={scheduleCloseMore}
              >
                <button
                  type="button"
                  className={`site-header-link inline-flex items-center gap-1.5 ${moreMenuActive ? 'site-header-link--active' : ''}`}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  Explore
                  <FaIcon icon="fa-chevron-down" className={`text-[10px] transition-transform duration-200 ${moreOpen ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
                </button>
                {moreOpen && (
                  <div
                    className="site-nav-mega-menu absolute right-0 top-full z-[120] pt-2 animate-fade-in"
                    onMouseEnter={openMore}
                    onMouseLeave={scheduleCloseMore}
                  >
                    <div className="site-nav-mega-menu__container">
                      {/* Mega Menu Top Header */}
                      <div className="site-nav-mega-menu__header">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100/90 border border-orange-200/80 px-2.5 py-0.5 rounded-full">
                            <FaIcon icon="fa-compass" className="text-[9px]" />
                            Explore Hub
                          </span>
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            Specialized treatments, at-home visits &amp; resources
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-full">
                          10 Options
                        </span>
                      </div>

                      {/* Mega Menu Grid Body */}
                      <div className="site-nav-mega-menu__body">
                        {EXPLORE_SECTIONS.map((section) => (
                          <div key={section.title} className="site-nav-mega-menu__col">
                            <div className="site-nav-mega-menu__col-header">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <FaIcon icon={section.icon} className="text-[10px] text-primary-500" />
                                {section.title}
                              </h4>
                            </div>
                            <div className="space-y-1">
                              {section.items.map((link) => {
                                const active = isMoreLinkActive(link.to);
                                return (
                                  <Link
                                    key={link.to + link.label}
                                    to={link.to}
                                    onClick={() => setMoreOpen(false)}
                                    className={`site-nav-mega-menu__item group ${
                                      active ? 'site-nav-mega-menu__item--active' : ''
                                    }`}
                                  >
                                    <span className={`site-nav-mega-menu__icon ${link.iconBg}`}>
                                      <FaIcon icon={link.icon} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="site-nav-mega-menu__label">
                                          {link.label}
                                        </span>
                                        {link.badge && (
                                          <span className="site-nav-mega-menu__badge">
                                            {link.badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className="site-nav-mega-menu__desc">
                                        {link.desc}
                                      </p>
                                    </div>
                                    <FaIcon
                                      icon="fa-chevron-right"
                                      className="site-nav-mega-menu__arrow"
                                    />
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mega Menu Bottom Footer Strip */}
                      <div className="site-nav-mega-menu__footer">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <FaIcon icon="fa-shield-heart" className="text-emerald-500 text-xs" />
                          <span>Hospital-Trained Clinicians &amp; Evidence-Based Recovery</span>
                        </div>
                        <Link
                          to="/book"
                          onClick={() => setMoreOpen(false)}
                          className="site-nav-mega-menu__footer-cta"
                        >
                          <span>Book an Appointment</span>
                          <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
            )}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              {user && <NotificationBell />}
              {!portalMode && (
                <Link to="/book" className="hidden sm:inline-flex btn-primary text-sm !py-2 !px-4">
                  Book Appointment
                </Link>
              )}
              {user ? (
                <>
                  {!portalMode && (
                    <Link
                      to={dashboardPath()}
                      className="hidden md:inline-flex text-sm font-medium text-slate-600 hover:text-primary-600 px-1"
                    >
                      {dashboardLabel()}
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-primary-600 px-2"
                >
                  Login
                </Link>
              )}

              {/* Universal right-side menu toggle (hamburger) button */}
              <button
                type="button"
                className="site-header-menu-btn"
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
        city={city}
        locationLabel={locationLabel}
        onShowLocation={() => setShowSelector(true)}
        onLogout={handleLogout}
      />

      <div
        className={`site-header-spacer shrink-0 ${headerSpacerClass}`}
        aria-hidden="true"
      />
    </>
  );
}
