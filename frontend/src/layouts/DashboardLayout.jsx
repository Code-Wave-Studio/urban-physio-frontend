import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import PortalNavSections from '../components/portal/PortalNavSections';
import PortalProfileCard from '../components/portal/PortalProfileCard';
import PortalSpeedDial from '../components/portal/PortalSpeedDial';
import ContextQuickActions from '../components/portal/ContextQuickActions';
import { useAuth } from '../contexts/AuthContext';
import { CODEWAVE_LICENSE_MARKER, CODEWAVE_URL } from '../core/codewaveLicense';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { speedDialForRole } from '../components/nav/navDrawerLinks';

/* Section ordering per variant */
import { PATIENT_SECTION_ORDER } from '../constants/patientNav';
import { DOCTOR_SECTION_ORDER } from '../constants/doctorNav';
import { CLINIC_SECTION_ORDER } from '../constants/clinicNav';
import { ADMIN_SECTION_ORDER } from '../constants/adminNav';

const SECTION_ORDER_MAP = {
  patient: PATIENT_SECTION_ORDER,
  doctor: DOCTOR_SECTION_ORDER,
  clinic: CLINIC_SECTION_ORDER,
  admin: ADMIN_SECTION_ORDER,
};

const ACCENT_MAP = {
  patient: 'primary',
  doctor: 'teal',
  clinic: 'emerald',
  admin: 'primary',
};

const STORAGE_KEY = 'urbanphysio_sidebar_collapsed';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

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

export default function DashboardLayout({
  children,
  brandLogoSrc = null,
  brandLogoAlt = 'The Urban Physio',
  fluid = false,
  /* Portal sidebar props — already passed by consumers but previously ignored */
  links,
  variant = 'patient',
  sidebarFooter = null,
  clinicId = null,
  clinicClosed = false,
}) {
  const hasPortalNav = variant !== 'admin' && Array.isArray(links) && links.length > 0;
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();
  const { user, hasRole } = useAuth() || {};

  /* Collapse state — persisted in localStorage */
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  /* Mobile sidebar open state */
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  /* Close mobile sidebar on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Close mobile sidebar on escape */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  /* Body scroll lock for mobile sidebar */
  useEffect(() => {
    if (mobileOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, isDesktop]);

  const sectionOrder = SECTION_ORDER_MAP[variant] || [];
  const accent = ACCENT_MAP[variant] || 'primary';

  /* Profile info for sidebar card */
  const profileName = user?.name || user?.full_name || 'Account';
  const profileRole = useMemo(() => {
    if (variant === 'clinic') return 'Clinic Portal';
    if (variant === 'doctor') return 'Physiotherapist';
    if (variant === 'admin') return 'Administrator';
    return 'Patient';
  }, [variant]);
  const profileAvatar = user?.avatar || user?.avatar_url || null;

  /* Speed dial items */
  const speedDialItems = useMemo(() => {
    if (!hasRole) return [];
    return speedDialForRole(hasRole);
  }, [hasRole]);

  const sidebarIsVisible = hasPortalNav && (isDesktop || mobileOpen);
  const sidebarClassname = [
    'app-shell__sidebar',
    collapsed && isDesktop ? 'app-shell__sidebar--collapsed' : '',
    mobileOpen && !isDesktop ? 'app-shell__sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  const workspaceClassname = [
    'app-shell__workspace',
    hasPortalNav && collapsed && isDesktop ? 'app-shell__workspace--collapsed' : '',
    !hasPortalNav ? 'app-shell__workspace--collapsed' : '',
  ].filter(Boolean).join(' ');

  /* Sidebar toggle as the beforeLogo element in Navbar */
  const sidebarToggle = hasPortalNav ? (
    <div className="flex items-center gap-1">
      {/* Desktop: collapse/expand toggle */}
      <button
        type="button"
        className="shell-sidebar-toggle hidden lg:flex"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <FaIcon icon={collapsed ? 'fa-bars' : 'fa-angles-left'} className="text-sm" />
      </button>
      {/* Mobile/tablet: open sidebar as drawer */}
      <button
        type="button"
        className="shell-sidebar-toggle lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <FaIcon icon="fa-bars" className="text-sm" />
      </button>
    </div>
  ) : null;

  /* --- No portal nav: original simple layout --- */
  if (!hasPortalNav) {
    return (
      <div className="min-h-screen relative admin-shell">
        <Navbar
          portalMode
          logoSrc={brandLogoSrc || undefined}
          logoAlt={brandLogoAlt}
        />
        <div className="admin-main-wrap">
          <main className={`mx-auto py-4 sm:py-6 animate-fade-in min-w-0 ${
            fluid
              ? 'w-full max-w-none px-3 sm:px-6 lg:px-8'
              : 'max-w-7xl px-3 sm:px-4 lg:px-8'
          }`}>
            {children}
            <PortalCreditFooter />
          </main>
        </div>
      </div>
    );
  }

  /* --- Portal layout with sidebar --- */
  return (
    <div className="app-shell">
      <Navbar
        portalMode
        beforeLogo={sidebarToggle}
        logoSrc={brandLogoSrc || undefined}
        logoAlt={brandLogoAlt}
      />

      <div className="app-shell__body">
        {/* Sidebar overlay (mobile) */}
        <div
          className={`app-shell__sidebar-overlay ${mobileOpen && !isDesktop ? 'app-shell__sidebar-overlay--visible' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside className={sidebarClassname} aria-label="Portal navigation">
          <div className="app-shell__sidebar-scroll">
            {/* Profile card */}
            <div className="mb-3">
              <PortalProfileCard
                name={profileName}
                roleLabel={profileRole}
                avatarUrl={resolveMediaUrl(profileAvatar) || profileAvatar}
                accent={accent}
                showPresence={variant === 'clinic' || variant === 'doctor'}
                presenceOnline={variant === 'clinic' ? !clinicClosed : true}
                clinicId={clinicId}
              />
            </div>

            {/* Speed dial */}
            {speedDialItems.length > 0 && (
              <div className="mb-3">
                <PortalSpeedDial
                  items={speedDialItems}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            )}

            {/* Navigation sections */}
            <PortalNavSections
              links={links}
              sectionOrder={sectionOrder}
              accent={accent}
              onNavigate={() => setMobileOpen(false)}
              open={!collapsed || !isDesktop}
            />
          </div>

          {/* Sidebar footer — role switch (clinic), or collapse toggle */}
          <div className="app-shell__sidebar-footer">
            {sidebarFooter}
            {/* Close button for mobile sidebar */}
            {!isDesktop && (
              <button
                type="button"
                className="shell-sidebar-toggle w-full mt-2 justify-center text-slate-400 hover:text-slate-600"
                onClick={() => setMobileOpen(false)}
              >
                <FaIcon icon="fa-xmark" className="text-base mr-1.5" />
                <span className="text-xs font-medium">Close</span>
              </button>
            )}
          </div>
        </aside>

        {/* Workspace */}
        <div className={workspaceClassname}>
          <main className={`mx-auto py-4 sm:py-6 animate-fade-in min-w-0 ${
            fluid
              ? 'w-full max-w-none px-3 sm:px-6 lg:px-8'
              : 'max-w-7xl px-3 sm:px-4 lg:px-8'
          }`}>
            {children}
            <PortalCreditFooter />
          </main>

          {/* Context-aware quick actions */}
          <ContextQuickActions variant={variant} clinicId={clinicId} />
        </div>
      </div>
    </div>
  );
}
