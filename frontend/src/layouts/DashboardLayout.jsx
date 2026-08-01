import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import Logo from '../components/Logo';
import DashboardPortalSidebar from '../components/dashboard/DashboardPortalSidebar';
import { notifications } from '../services/api';
import { hasStoredToken } from '../utils/authSession';
import { CODEWAVE_LICENSE_MARKER, CODEWAVE_URL } from '../core/codewaveLicense';

function PortalCreditFooter() {
  return (
    <footer className="mt-10 pt-4 border-t border-slate-200/60 text-center select-none">
      <p
        data-codewave-license={CODEWAVE_LICENSE_MARKER}
        className="text-[10px] sm:text-[11px] text-slate-400/85 leading-relaxed tracking-wide"
      >
        © {new Date().getFullYear()} The Urban Physio. All rights reserved.
        <span className="mx-1.5 text-slate-300/80 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="block sm:inline mt-0.5 sm:mt-0">
          Designed &amp; Developed by{' '}
          <a
            href={CODEWAVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500/90 hover:text-teal-700 underline-offset-2 hover:underline transition"
          >
            CodeWave Studio
          </a>
        </span>
      </p>
    </footer>
  );
}

function NavLink({ link, pathname, unreadCount }) {
  const active = pathname === link.to;
  return (
    <Link
      to={link.to}
      className={`dashboard-nav-link ${active ? 'dashboard-nav-link--active' : ''}`}
    >
      {typeof link.icon === 'string' && link.icon.startsWith('fa-') ? (
        <FaIcon icon={link.icon} className="w-4 mr-2 opacity-80" />
      ) : (
        <span className="mr-1.5">{link.icon}</span>
      )}
      <span className="flex items-center justify-between gap-2 flex-1 min-w-0">
        <span className="truncate">{link.label}</span>
        {link.notifyKey && unreadCount > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
  links = [],
  variant,
  sidebarFooter = null,
  brandLogoSrc = null,
  brandLogoAlt = 'The Urban Physio',
  clinicId = null,
  clinicClosed = false,
  avatarUrl = null,
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isPatient = variant === 'patient';
  const isDoctor = variant === 'doctor';
  const isClinic = variant === 'clinic';
  const usePortalSidebar = isPatient || isDoctor || isClinic;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const portalMeta = isDoctor
    ? { title: 'Doctor Portal', subtitle: `Dr. ${user?.first_name || ''} ${user?.last_name || ''}`.trim(), accent: 'teal' }
    : isClinic
      ? { title: 'Clinic Portal', subtitle: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Clinic', accent: 'emerald' }
      : isPatient
        ? { title: 'Patient Portal', subtitle: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'My Health', accent: 'primary' }
        : { title: 'Portal', subtitle: '', accent: 'primary' };

  const refreshUnread = () => {
    if (!hasStoredToken()) return;
    notifications
      .unreadCount()
      .then((res) => setUnreadCount(res.data?.unread_count ?? 0))
      .catch(() => setUnreadCount(0));
  };

  useEffect(() => {
    if (user && hasStoredToken()) refreshUnread();
  }, [user, pathname]);

  useEffect(() => {
    const onUpdate = () => refreshUnread();
    window.addEventListener('notifications-updated', onUpdate);
    return () => window.removeEventListener('notifications-updated', onUpdate);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setSidebarOpen(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen || window.innerWidth >= 1024) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const closeSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const sidebarToggle = usePortalSidebar ? (
    <>
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="site-header-menu-btn lg:hidden shrink-0"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        <FaIcon icon={sidebarOpen ? 'fa-xmark' : 'fa-bars'} />
      </button>
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="site-header-menu-btn hidden lg:inline-flex shrink-0"
        aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
        aria-expanded={sidebarOpen}
      >
        <FaIcon icon={sidebarOpen ? 'fa-angles-left' : 'fa-angles-right'} />
      </button>
    </>
  ) : null;

  if (usePortalSidebar) {
    return (
      <div className="min-h-screen relative admin-shell">
        <Navbar
          beforeLogo={sidebarToggle}
          portalMode
          logoSrc={brandLogoSrc || undefined}
          logoAlt={brandLogoAlt}
        />
        <DashboardPortalSidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          links={links}
          unreadCount={unreadCount}
          title={portalMeta.title}
          subtitle={portalMeta.subtitle}
          accent={portalMeta.accent}
          footerExtra={sidebarFooter}
          logoSrc={brandLogoSrc || undefined}
          logoAlt={brandLogoAlt}
          variant={isDoctor ? 'doctor' : isClinic ? 'clinic' : 'patient'}
          clinicId={clinicId}
          clinicClosed={clinicClosed}
          avatarUrl={avatarUrl}
        />

        <div
          className={`admin-main-wrap transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
          }`}
        >
          <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in min-w-0">
            {children}
            <PortalCreditFooter />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="dashboard-sidebar-card glass-strong rounded-2xl p-6">
            <div className="dashboard-sidebar-header mb-4 pb-4 border-b border-slate-200/80 shrink-0">
              <div className="flex items-center gap-3">
                <Logo linkToHome={false} showText={false} className="h-11 w-auto max-w-[130px] object-contain shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">Admin Console</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 truncate">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <nav className="dashboard-sidebar-nav space-y-1" aria-label="Dashboard navigation">
              {links.map((link) => (
                <NavLink key={link.to} link={link} pathname={pathname} unreadCount={unreadCount} />
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
