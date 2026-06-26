import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FaIcon from '../FaIcon';
import Logo from '../Logo';

/**
 * Slide-in sidebar for Doctor & Patient portals (matches Admin mobile UX).
 */
export default function DashboardPortalSidebar({
  open,
  onClose,
  links,
  unreadCount = 0,
  title,
  subtitle,
  accent = 'primary',
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const activeClass =
    accent === 'teal'
      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
      : 'bg-primary-600 text-white shadow-md shadow-primary-600/25';

  const accentLabel = accent === 'teal' ? 'text-teal-700' : 'text-primary-600';

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`admin-sidebar-backdrop fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`admin-sidebar fixed left-0 z-[95] w-[min(18rem,88vw)] flex flex-col glass-strong border-r border-white/60 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:top-16 lg:h-[calc(100vh-4rem)] lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-200/80 lg:hidden shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo linkToHome={false} showText={false} className="h-9 w-auto max-w-[110px] object-contain shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">{title}</p>
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close menu">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        <div className="hidden lg:block p-4 pb-3 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <Logo linkToHome={false} showText={false} className="h-11 w-auto max-w-[130px] object-contain shrink-0" />
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${accentLabel}`}>{title}</p>
              <p className="text-[10px] text-slate-500 truncate mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="dashboard-sidebar-nav flex-1 p-3 space-y-0.5 overflow-y-auto overscroll-contain" aria-label="Portal navigation">
          {links.map((link, i) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`admin-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? activeClass : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
                style={{ transitionDelay: open ? `${i * 16}ms` : '0ms' }}
              >
                {typeof link.icon === 'string' && link.icon.startsWith('fa-') ? (
                  <span className="w-6 flex items-center justify-center shrink-0 opacity-90">
                    <FaIcon icon={link.icon} className="text-sm" />
                  </span>
                ) : (
                  <span className="text-lg w-6 text-center shrink-0" aria-hidden="true">
                    {link.icon}
                  </span>
                )}
                <span className="truncate flex-1">{link.label}</span>
                {link.notifyKey && unreadCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {active && !link.notifyKey && (
                  <FaIcon icon="fa-chevron-right" className="ml-auto text-xs opacity-80 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 shrink-0 text-xs text-slate-500">
          <p className="truncate mb-2">
            {user?.first_name} {user?.last_name}
          </p>
          <Link to="/" className={`${accentLabel} font-medium hover:underline inline-flex items-center gap-1`}>
            <FaIcon icon="fa-arrow-up-right-from-square" className="text-[10px]" />
            View public site
          </Link>
        </div>
      </aside>
    </>
  );
}
