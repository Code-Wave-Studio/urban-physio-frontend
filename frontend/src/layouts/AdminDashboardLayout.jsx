import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import FaIcon from '../components/FaIcon';
import { ADMIN_NAV } from '../constants/adminNav';
import { notifications } from '../services/api';
import { hasStoredToken } from '../utils/authSession';

export default function AdminDashboardLayout({ children, links = ADMIN_NAV }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = () => {
    if (!hasStoredToken()) return;
    notifications
      .unreadCount()
      .then((res) => setUnreadCount(res.data?.unread_count ?? 0))
      .catch(() => setUnreadCount(0));
  };

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

  useEffect(() => {
    if (user && hasStoredToken()) refreshUnread();
  }, [user, pathname]);

  useEffect(() => {
    const onUpdate = () => refreshUnread();
    window.addEventListener('notifications-updated', onUpdate);
    return () => window.removeEventListener('notifications-updated', onUpdate);
  }, []);

  const closeSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const sidebarToggle = (
    <>
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="site-header-menu-btn lg:hidden shrink-0"
        aria-label={sidebarOpen ? 'Close admin menu' : 'Open admin menu'}
        aria-expanded={sidebarOpen}
      >
        <FaIcon icon={sidebarOpen ? 'fa-xmark' : 'fa-bars'} />
      </button>
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="site-header-menu-btn hidden lg:inline-flex shrink-0"
        aria-label={sidebarOpen ? 'Collapse admin menu' : 'Expand admin menu'}
        aria-expanded={sidebarOpen}
      >
        <FaIcon icon={sidebarOpen ? 'fa-angles-left' : 'fa-angles-right'} />
      </button>
    </>
  );

  return (
    <div className="min-h-screen relative admin-shell">
      <Navbar beforeLogo={sidebarToggle} portalMode />
      <AdminSidebar open={sidebarOpen} onClose={closeSidebar} links={links} unreadCount={unreadCount} />

      <div
        className={`admin-main-wrap transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
        }`}
      >
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
