import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import PortalNavSections from '../components/portal/PortalNavSections';
import PortalProfileCard from '../components/portal/PortalProfileCard';
import PortalSpeedDial from '../components/portal/PortalSpeedDial';
import ContextQuickActions from '../components/portal/ContextQuickActions';
import PrimarySidebarNav from '../components/portal/PrimarySidebarNav';
import ContextPanel from '../components/portal/ContextPanel';
import { useAuth } from '../contexts/AuthContext';
import { CODEWAVE_LICENSE_MARKER, CODEWAVE_URL } from '../core/codewaveLicense';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { speedDialForRole } from '../components/nav/navDrawerLinks';
import { groupPortalNav, isNavLinkActive } from '../constants/portalArchitecture';

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
  /* Portal sidebar props */
  links,
  variant = 'patient',
  sidebarFooter = null,
  clinicId = null,
  clinicClosed = false,
}) {
  const hasPortalNav = Array.isArray(links) && links.length > 0;
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();
  const { user, hasRole } = useAuth() || {};

  /* Context panel collapse state — persisted in localStorage */
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

  /* Group nav into sections for 3-column layout */
  const sections = useMemo(
    () => groupPortalNav(links || [], sectionOrder),
    [links, sectionOrder],
  );

  /* Determine active section from current route */
  const activeSectionId = useMemo(() => {
    for (const section of sections) {
      if (section.items.some((item) => item.to && isNavLinkActive(pathname, item))) {
        return section.id;
      }
    }
    return sections[0]?.id;
  }, [sections, pathname]);

  /* Manual section override — clicking a primary nav icon selects that section */
  const [selectedSection, setSelectedSection] = useState(null);
  const currentSectionId = selectedSection || activeSectionId;
  const currentSection = sections.find((s) => s.id === currentSectionId) || sections[0];

  /* Reset manual selection when route changes (auto-detect takes over) */
  useEffect(() => {
    setSelectedSection(null);
  }, [pathname]);

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

  /* Handle section click in primary nav */
  const handleSectionClick = useCallback((sectionId) => {
    setSelectedSection(sectionId);
    if (collapsed) {
      setCollapsed(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
    }
  }, [collapsed]);

  /* Sidebar toggle rendered before logo in Navbar */
  const sidebarToggle = hasPortalNav ? (
    <div className="flex items-center gap-1">
      {/* Desktop: toggle context panel visibility */}
      <button
        type="button"
        className="shell-sidebar-toggle hidden lg:flex"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Show navigation panel' : 'Collapse navigation panel'}
        title={collapsed ? 'Show navigation panel' : 'Collapse navigation panel'}
      >
        <FaIcon icon={collapsed ? 'fa-bars' : 'fa-angles-left'} className="text-sm" />
      </button>
      {/* Mobile/tablet: open sidebar drawer */}
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

  /* Workspace class names */
  const workspaceClass = [
    'app-shell__workspace',
    hasPortalNav && collapsed ? 'app-shell__workspace--ctx-collapsed' : '',
    !hasPortalNav ? 'app-shell__workspace--no-nav' : '',
  ].filter(Boolean).join(' ');

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

  /* Shared profile card props — same data for both desktop context panel and mobile drawer */
  const profileCardProps = {
    name: profileName,
    roleLabel: profileRole,
    avatarUrl: resolveMediaUrl(profileAvatar) || profileAvatar,
    accent,
    showPresence: variant === 'clinic' || variant === 'doctor',
    presenceOnline: variant === 'clinic' ? !clinicClosed : true,
    clinicId,
  };

  /* --- Portal layout with 3-column shell --- */
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

        {/* ── Desktop: Primary icon rail ── */}
        <aside className="app-shell__primary-nav" aria-label="Module navigation">
          <div className="primary-nav__profile-wrap">
            {profileAvatar ? (
              <img
                src={resolveMediaUrl(profileAvatar) || profileAvatar}
                alt={profileName}
                className="primary-nav__avatar"
              />
            ) : (
              <div className="primary-nav__avatar primary-nav__avatar--fallback">
                <FaIcon icon="fa-user" className="text-sm" />
              </div>
            )}
          </div>

          <PrimarySidebarNav
            sections={sections}
            activeSectionId={currentSectionId}
            onSectionClick={handleSectionClick}
            accent={accent}
          />

          <div className="primary-nav__footer">
            <button
              type="button"
              className="primary-nav__toggle"
              onClick={toggleCollapsed}
              title={collapsed ? 'Show panel' : 'Hide panel'}
              aria-label={collapsed ? 'Show navigation panel' : 'Hide navigation panel'}
            >
              <FaIcon icon={collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} className="text-xs" />
            </button>
          </div>
        </aside>

        {/* ── Desktop: Context panel ── */}
        <aside
          className={`app-shell__context-panel ${collapsed ? 'app-shell__context-panel--hidden' : ''}`}
          aria-label={currentSection?.label || 'Section navigation'}
        >
          <div className="app-shell__context-panel-scroll">
            {/* Profile card */}
            <div className="mb-3">
              <PortalProfileCard {...profileCardProps} />
            </div>

            {/* Speed dial */}
            {speedDialItems.length > 0 && (
              <div className="mb-3">
                <PortalSpeedDial items={speedDialItems} onNavigate={() => {}} />
              </div>
            )}

            {/* Section navigation */}
            <ContextPanel
              section={currentSection}
              accent={accent}
              onNavigate={() => {}}
            />
          </div>

          {/* Context panel footer — role switch, etc. */}
          {sidebarFooter && (
            <div className="app-shell__context-panel-footer">
              {sidebarFooter}
            </div>
          )}
        </aside>

        {/* ── Mobile: Full sidebar drawer (preserves existing mobile behavior) ── */}
        <aside
          className={`app-shell__sidebar ${mobileOpen && !isDesktop ? 'app-shell__sidebar--mobile-open' : ''}`}
          aria-label="Portal navigation"
        >
          <div className="app-shell__sidebar-scroll">
            <div className="mb-3">
              <PortalProfileCard {...profileCardProps} />
            </div>

            {speedDialItems.length > 0 && (
              <div className="mb-3">
                <PortalSpeedDial
                  items={speedDialItems}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            )}

            <PortalNavSections
              links={links}
              sectionOrder={sectionOrder}
              accent={accent}
              onNavigate={() => setMobileOpen(false)}
              open={true}
            />
          </div>

          <div className="app-shell__sidebar-footer">
            {sidebarFooter}
            <button
              type="button"
              className="shell-sidebar-toggle w-full mt-2 justify-center text-slate-400 hover:text-slate-600"
              onClick={() => setMobileOpen(false)}
            >
              <FaIcon icon="fa-xmark" className="text-base mr-1.5" />
              <span className="text-xs font-medium">Close</span>
            </button>
          </div>
        </aside>

        {/* ── Workspace ── */}
        <div className={workspaceClass}>
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
