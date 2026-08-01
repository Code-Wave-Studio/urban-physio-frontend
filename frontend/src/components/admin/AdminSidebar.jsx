import { useAuth } from '../../contexts/AuthContext';
import FaIcon from '../FaIcon';
import { SITE_LOGO_SRC } from '../../constants/siteBrand';
import PortalNavSections from '../portal/PortalNavSections';
import PortalSpeedDial from '../portal/PortalSpeedDial';
import PortalProfileCard from '../portal/PortalProfileCard';
import { ADMIN_SPEED_DIAL, ADMIN_SECTION_ORDER } from '../../constants/adminNav';

export default function AdminSidebar({ open, onClose, links, unreadCount = 0 }) {
  const { user } = useAuth();
  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Admin';

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
            <img src={SITE_LOGO_SRC} alt="The Urban Physio" className="h-9 w-auto max-w-[110px] object-contain shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">Admin Console</p>
              <p className="text-xs text-slate-500 truncate">{name}</p>
            </div>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close menu">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        <div className="p-3 space-y-3 border-b border-slate-200/80 shrink-0">
          <div className="hidden lg:flex items-center gap-3 px-1">
            <img src={SITE_LOGO_SRC} alt="The Urban Physio" className="h-11 w-auto max-w-[130px] object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">Admin Console</p>
              <p className="text-[10px] text-slate-500 truncate mt-1">{name}</p>
            </div>
          </div>
          <PortalProfileCard name={name} roleLabel="Super Admin" accent="primary" allowAvatarUpload={false} />
          <PortalSpeedDial items={ADMIN_SPEED_DIAL} onNavigate={onClose} />
        </div>

        <nav className="dashboard-sidebar-nav flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain" aria-label="Admin navigation">
          <PortalNavSections
            links={links}
            sectionOrder={ADMIN_SECTION_ORDER}
            unreadCount={unreadCount}
            onNavigate={onClose}
            accent="primary"
            open={open}
          />
        </nav>
      </aside>
    </>
  );
}
