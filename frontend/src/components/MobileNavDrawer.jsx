import { Link, useLocation } from 'react-router-dom';
import FaIcon from './FaIcon';
import GlobalSearch from './GlobalSearch';

const EXPLORE_LINKS = [
  { to: '/', label: 'Home', icon: 'fa-house' },
  { to: '/doctors', label: 'Find Physiotherapists', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinic', icon: 'fa-hospital', tone: 'emerald' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical' },
  { to: '/treatments', label: 'Services', icon: 'fa-kit-medical' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell' },
  { to: '/physiofeed', label: 'Blogs / PhysioFeed', icon: 'fa-newspaper' },
];

const HELP_LINKS = [
  { to: '/faq', label: 'FAQ', icon: 'fa-circle-question' },
  { to: '/contact', label: 'Contact Us', icon: 'fa-envelope' },
  { to: '/cancellation-help', label: 'Cancellation Help', icon: 'fa-calendar-xmark' },
];

const PROVIDER_LINKS = [
  { to: '/register?role=doctor', label: 'Join as a Physiotherapist', icon: 'fa-user-plus' },
  { to: '/register?role=doctor', label: 'Join as a Clinic Partner', icon: 'fa-building' },
  { to: '/contact', label: 'Provider Support', icon: 'fa-headset' },
];

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

function NavSection({ title, children }) {
  return (
    <div className="mb-5">
      <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ to, label, icon, pathname, search, onNavigate, tone = 'primary' }) {
  const active = isLinkActive(pathname, search, to);
  const activeBg = tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : 'bg-primary-50 text-primary-700';
  const activeIcon = tone === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary-600';
  const hoverBg = tone === 'emerald' ? 'hover:bg-emerald-50' : 'hover:bg-slate-50';
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
        active ? activeBg : `text-slate-700 ${hoverBg}`
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
          active ? activeIcon : 'bg-slate-100 text-slate-500'
        }`}
      >
        <FaIcon icon={icon} />
      </span>
      <span className="leading-snug">{label}</span>
    </Link>
  );
}

/**
 * Mobile slide-out menu — full site navigation for small screens.
 */
export default function MobileNavDrawer({
  open,
  onClose,
  user,
  hasRole,
  dashboardPath,
  dashboardLabel,
  city,
  locationLabel,
  onShowLocation,
  onLogout,
}) {
  const { pathname, search } = useLocation();

  const patientLinks = [
    { to: '/patient/profile', label: 'Profile', icon: 'fa-user' },
    { to: '/patient/appointments', label: 'Appointments', icon: 'fa-calendar-check' },
    { to: '/patient/packages', label: 'Orders', icon: 'fa-box-open' },
  ];

  const doctorLinks = [
    { to: '/doctor', label: 'Dashboard', icon: 'fa-gauge-high' },
    { to: '/doctor/profile', label: 'Profile', icon: 'fa-user-doctor' },
    { to: '/doctor/clinics', label: 'My Clinics', icon: 'fa-hospital' },
  ];

  const adminLinks = [{ to: '/admin', label: 'Admin Dashboard', icon: 'fa-shield-halved' }];

  let accountLinks = [];
  let accountTitle = 'My account';
  if (user) {
    if (hasRole('super_admin', 'admin')) {
      accountLinks = adminLinks;
      accountTitle = 'Admin';
    } else if (hasRole('doctor')) {
      accountLinks = doctorLinks;
      accountTitle = 'Provider account';
    } else if (hasRole('patient')) {
      accountLinks = patientLinks;
    } else {
      accountLinks = [{ to: dashboardPath(), label: dashboardLabel(), icon: 'fa-gauge-high' }];
    }
  }

  const providerDashboardTo = user && hasRole('doctor', 'admin', 'super_admin') ? dashboardPath() : '/login?role=doctor';
  const providerDashboardLabel =
    user && hasRole('doctor') ? 'Provider Dashboard' : user && hasRole('admin', 'super_admin') ? 'Admin Dashboard' : 'Provider Login';

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={`site-mobile-backdrop fixed inset-0 z-[105] lg:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`site-mobile-drawer fixed top-0 right-0 z-[108] h-full w-[min(22rem,92vw)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50/80 to-white">
          <div className="min-w-0">
            <span className="font-bold text-slate-900 block">Menu</span>
            {user && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.first_name ? `Hi, ${user.first_name}` : user.email}
              </p>
            )}
          </div>
          <button type="button" className="site-header-menu-btn shrink-0" onClick={onClose} aria-label="Close">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="pb-4 mb-3 border-b border-slate-100">
            <GlobalSearch variant="mobile" autoFocus={open} onNavigate={onClose} />
          </div>

          {user ? (
            accountLinks.length > 0 && (
              <NavSection title={accountTitle}>
                {accountLinks.map((link) => (
                  <NavItem key={link.to + link.label} {...link} pathname={pathname} search={search} onNavigate={onClose} />
                ))}
              </NavSection>
            )
          ) : (
            <NavSection title="My account">
              <NavItem to="/login?role=patient" label="Login" icon="fa-right-to-bracket" pathname={pathname} search={search} onNavigate={onClose} />
              <NavItem to="/register?role=patient" label="Register" icon="fa-user-plus" pathname={pathname} search={search} onNavigate={onClose} />
            </NavSection>
          )}

          <NavSection title="Explore">
            {EXPLORE_LINKS.map((link) => (
              <NavItem key={link.to + link.label} {...link} pathname={pathname} search={search} onNavigate={onClose} />
            ))}
          </NavSection>

          <NavSection title="Need help?">
            {HELP_LINKS.map((link) => (
              <NavItem key={link.to} {...link} pathname={pathname} search={search} onNavigate={onClose} />
            ))}
          </NavSection>

          <NavSection title="For providers">
            <NavItem
              to={providerDashboardTo}
              label={providerDashboardLabel}
              icon="fa-gauge-high"
              pathname={pathname}
              search={search}
              onNavigate={onClose}
            />
            {PROVIDER_LINKS.map((link) => (
              <NavItem key={link.label} {...link} pathname={pathname} search={search} onNavigate={onClose} />
            ))}
          </NavSection>

          {city && (
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-primary-700 hover:bg-primary-50 mt-1"
              onClick={() => {
                onShowLocation();
                onClose();
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 text-sm">
                <FaIcon icon="fa-location-dot" />
              </span>
              <span className="truncate text-left">{locationLabel || city.name}</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0 bg-slate-50/80">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/clinics"
              className="btn-primary w-full text-center text-sm !py-2.5 !bg-emerald-600 hover:!bg-emerald-700 inline-flex items-center justify-center gap-1.5"
              onClick={onClose}
            >
              <FaIcon icon="fa-hospital" className="text-xs" />
              Find Clinic
            </Link>
            <Link to="/book" className="btn-outline w-full text-center text-sm !py-2.5 block" onClick={onClose}>
              Book
            </Link>
          </div>
          <Link to="/doctors" className="btn-outline w-full text-center block text-sm !py-2.5" onClick={onClose}>
            Find Physiotherapists
          </Link>
          {user ? (
            <button type="button" className="btn-outline w-full text-sm text-red-700 border-red-200" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <Link to="/login?role=patient" className="btn-outline w-full text-center block text-sm" onClick={onClose}>
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
