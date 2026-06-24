import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import Logo from '../components/Logo';
import { notifications } from '../services/api';
import { hasStoredToken } from '../utils/authSession';

function NavLink({ link, pathname, unreadCount, compact = false }) {
  const active = pathname === link.to;
  const className = compact
    ? `dashboard-mobile-nav-link ${active ? 'dashboard-mobile-nav-link--active' : ''}`
    : `dashboard-nav-link ${active ? 'dashboard-nav-link--active' : ''}`;

  return (
    <Link key={link.to} to={link.to} className={className}>
      {typeof link.icon === 'string' && link.icon.startsWith('fa-') ? (
        <FaIcon icon={link.icon} className={compact ? 'text-xs shrink-0' : 'w-4 mr-2 opacity-80'} />
      ) : (
        <span className={compact ? '' : 'mr-1.5'}>{link.icon}</span>
      )}
      <span className={compact ? 'whitespace-nowrap' : 'flex items-center justify-between gap-2 flex-1 min-w-0'}>
        <span className={compact ? '' : 'truncate'}>{link.label}</span>
        {!compact && link.notifyKey && unreadCount > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      {compact && link.notifyKey && unreadCount > 0 && (
        <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function DashboardLayout({ children, links = [], variant }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = variant === 'admin';
  const isPatient = variant === 'patient';
  const isDoctor = variant === 'doctor';
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Mobile dashboard nav */}
      <nav
        className="lg:hidden sticky top-16 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
        aria-label="Dashboard navigation"
      >
        <div className="max-w-7xl mx-auto px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-thin">
          {links.map((link) => (
            <NavLink key={link.to} link={link} pathname={pathname} unreadCount={unreadCount} compact />
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="dashboard-sidebar-card glass-strong rounded-2xl p-6">
            {isAdmin ? (
              <div className="dashboard-sidebar-header mb-4 pb-4 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-3">
                  <Logo
                    linkToHome={false}
                    showText={false}
                    className="h-11 w-auto max-w-[130px] object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
                      Admin Console
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            ) : isPatient ? (
              <div className="dashboard-sidebar-header shrink-0 mb-4 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <Logo
                    linkToHome={false}
                    showText={false}
                    className="h-10 w-auto max-w-[120px] object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight">Patient Portal</p>
                    <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider mt-0.5">
                      My Health
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            ) : isDoctor ? (
              <div className="dashboard-sidebar-header shrink-0 mb-4 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <Logo
                    linkToHome={false}
                    showText={false}
                    className="h-10 w-auto max-w-[120px] object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight">Doctor Portal</p>
                    <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
                      Practice Hub
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 truncate">
                  Dr. {user?.first_name} {user?.last_name}
                </p>
              </div>
            ) : (
              <div className="dashboard-sidebar-header shrink-0 mb-4">
                <p className="text-sm text-slate-500 mb-1">Welcome back</p>
                <p className="font-semibold text-slate-800">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-primary-600 capitalize mt-1">{user?.role_slug?.replace('_', ' ')}</p>
              </div>
            )}
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
