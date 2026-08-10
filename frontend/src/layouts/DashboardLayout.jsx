import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import PortalProfileCard from '../components/portal/PortalProfileCard';
import PortalSpeedDial from '../components/portal/PortalSpeedDial';
import ContextQuickActions from '../components/portal/ContextQuickActions';
import PrimarySidebarNav from '../components/portal/PrimarySidebarNav';
import ContextPanel from '../components/portal/ContextPanel';
import { useAuth } from '../contexts/AuthContext';
import { CODEWAVE_LICENSE_MARKER, CODEWAVE_URL } from '../core/codewaveLicense';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { SITE_LOGO_SRC } from '../constants/siteBrand';
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
  clinicLogo = null,
  clinicName = null,
}) {
  const hasPortalNav = Array.isArray(links) && links.length > 0;
  const { pathname } = useLocation();
  const { user, hasRole } = useAuth() || {};

  /* Context panel collapse state — persisted in localStorage (desktop only) */
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

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
  const profileName = clinicName || user?.clinic?.name || user?.name || user?.full_name || 'Account';
  const profileAvatar =
    clinicLogo ||
    user?.clinic_logo ||
    user?.clinic?.logo ||
    user?.clinic?.logo_url ||
    user?.logo ||
    user?.logo_url ||
    user?.avatar ||
    user?.avatar_url ||
    null;

  const profileRole = useMemo(() => {
    if (variant === 'clinic') return 'Clinic Portal';
    if (variant === 'doctor') return 'Physiotherapist';
    if (variant === 'admin') return 'Administrator';
    return 'Patient';
  }, [variant]);

  /* Speed dial items & action handler */
  const speedDialItems = useMemo(() => {
    if (!hasRole) return [];
    return speedDialForRole(hasRole);
  }, [hasRole]);

  const handleSpeedDialAction = useCallback((action) => {
    if (action === 'book') {
      window.dispatchEvent(new CustomEvent('clinic-fab-open', { detail: { mode: 'booking' } }));
    } else if (action === 'new-patient') {
      window.dispatchEvent(new CustomEvent('clinic-fab-open', { detail: { mode: 'patient' } }));
    } else if (action === 'help' || action === 'support') {
      window.dispatchEvent(new CustomEvent('clinic-fab-open', { detail: { mode: 'support' } }));
    }
  }, []);

  /* Handle section click in primary nav */
  const handleSectionClick = useCallback((sectionId) => {
    setSelectedSection(sectionId);
    if (collapsed) {
      setCollapsed(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
    }
  }, [collapsed]);

  /* Sidebar collapse toggle rendered before logo in Navbar (desktop only) */
  const sidebarToggle = hasPortalNav ? (
    <button
      type="button"
      className="shell-sidebar-toggle hidden lg:flex"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'Show navigation panel' : 'Collapse navigation panel'}
      title={collapsed ? 'Show navigation panel' : 'Collapse navigation panel'}
    >
      <FaIcon icon={collapsed ? 'fa-bars' : 'fa-angles-left'} className="text-sm" />
    </button>
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
          <main className={`mx-auto pt-3 sm:pt-4 pb-6 animate-fade-in min-w-0 ${
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

  /* Shared profile card props for desktop context panel */
  const profileCardProps = {
    name: profileName,
    roleLabel: profileRole,
    avatarUrl: resolveMediaUrl(profileAvatar) || profileAvatar,
    accent,
    showPresence: variant === 'clinic' || variant === 'doctor',
    presenceOnline: variant === 'clinic' ? !clinicClosed : true,
    clinicId,
  };

  /* --- Portal layout with desktop 3-column shell --- */
  return (
    <div className="app-shell">
      <Navbar
        portalMode
        beforeLogo={sidebarToggle}
        portalProfileProps={profileCardProps}
        logoSrc={brandLogoSrc || undefined}
        logoAlt={brandLogoAlt}
      />

      <div className="app-shell__body">
        {/* ── Desktop ONLY: Primary navigation sidebar (Icon Only Rail) ── */}
        <aside
          className="app-shell__primary-nav"
          aria-label="Module navigation"
        >
          <div className="primary-nav__logo-wrap py-2.5 px-1 flex flex-col items-center justify-center shrink-0 border-b border-slate-200/70 mb-2">
            <Link to="/" className="flex flex-col items-center justify-center group" title="The Urban Physio">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-teal-700 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                <img
                  src={SITE_LOGO_SRC}
                  alt="TUP Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.classList.remove('hidden');
                  }}
                />
                <span className="hidden font-black text-[10px] text-white tracking-tighter leading-none">TUP</span>
              </div>
              <span className="text-[9px] font-black uppercase text-primary-700 tracking-wider mt-1 group-hover:text-teal-700 transition-colors leading-none">TUP</span>
            </Link>
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
              title={collapsed ? 'Show context panel' : 'Hide context panel'}
              aria-label={collapsed ? 'Show context panel' : 'Hide context panel'}
            >
              <FaIcon icon={collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} className="text-xs" />
            </button>
          </div>
        </aside>

        {/* ── Desktop ONLY: Context panel ── */}
        <aside
          className={`app-shell__context-panel ${collapsed ? 'app-shell__context-panel--hidden' : ''}`}
          aria-label={currentSection?.label || 'Section navigation'}
        >
          <div className="app-shell__context-panel-scroll">
            {/* Speed dial */}
            {speedDialItems.length > 0 && (
              <div className="mb-3">
                <PortalSpeedDial items={speedDialItems} onAction={handleSpeedDialAction} onNavigate={() => {}} />
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

        {/* ── Workspace (Full width on tablet/mobile, margin-left on desktop) ── */}
        <div className={workspaceClass}>
          <main className={`mx-auto pt-3 sm:pt-4 pb-6 animate-fade-in min-w-0 ${
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

