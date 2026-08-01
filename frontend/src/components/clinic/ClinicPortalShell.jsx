import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../FaIcon';
import ClinicRoleSwitch from './ClinicRoleSwitch';
import HelpFeedbackFab from './HelpFeedbackFab';
import { clinicNavFor } from '../../constants/clinicNav';
import useClinicPortal from '../../hooks/useClinicPortal';
import { ClinicPortalProvider } from '../../contexts/ClinicPortalContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';

/**
 * Shared clinic portal chrome: role-aware nav + mode switcher in sidebar footer.
 * Broadcast lives on Communication / Notification Setup — not on every page header.
 */
function ClinicPortalShellInner({ children, title, subtitle, actions }) {
  const {
    portalRole,
    permissions,
    canSwitchAdmin,
    isAdminMode,
    loading,
    reload,
    clinic,
    clinicId,
  } = useClinicPortal();
  const [switchOpen, setSwitchOpen] = useState(false);
  const links = clinicNavFor(portalRole, permissions);

  const brandLogoSrc = useMemo(() => {
    const raw = clinic?.logo || clinic?.logo_url || '';
    if (!raw || !String(raw).trim()) return null;
    return resolveMediaUrl(raw) || String(raw).trim();
  }, [clinic?.logo, clinic?.logo_url]);

  const brandLogoAlt = clinic?.name ? `${clinic.name} logo` : 'Clinic logo';

  const modeSwitch = (
    <button
      type="button"
      onClick={() => setSwitchOpen(true)}
      className={`w-full inline-flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition ${
        isAdminMode
          ? 'bg-primary-50 text-primary-800 border-primary-200 hover:bg-primary-100'
          : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
      }`}
      title="Switch portal role"
    >
      <FaIcon icon={isAdminMode ? 'fa-user-shield' : 'fa-desktop'} className="shrink-0" />
      <span className="flex-1 text-left truncate">
        {isAdminMode ? 'Clinic Admin' : 'Receptionist'}
      </span>
      {(canSwitchAdmin || isAdminMode) && (
        <span className="text-[10px] uppercase tracking-wide opacity-70 shrink-0 inline-flex items-center gap-1">
          Switch
          <FaIcon icon="fa-right-left" />
        </span>
      )}
    </button>
  );

  return (
    <DashboardLayout
      links={links}
      variant="clinic"
      sidebarFooter={modeSwitch}
      brandLogoSrc={brandLogoSrc}
      brandLogoAlt={brandLogoAlt}
      clinicId={clinicId || clinic?.id || null}
      clinicClosed={Boolean(Number(clinic?.is_closed))}
      avatarUrl={clinic?.logo || clinic?.logo_url}
    >
      <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1 break-words">{subtitle}</p>
          )}
        </div>
        {actions ? (
          <div className="portal-page-actions shrink-0 flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {!loading && !clinic && (
        <div className="glass-card text-center py-10 mb-4">
          <FaIcon icon="fa-hospital" className="text-3xl text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No clinic linked to this account</p>
          <p className="text-sm text-slate-500 mt-1">Contact support if you believe this is an error.</p>
        </div>
      )}

      <div className="min-w-0 w-full">{children}</div>

      <ClinicRoleSwitch
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        portalRole={portalRole}
        canSwitchAdmin={canSwitchAdmin}
        onSwitched={() => {
          reload();
          window.dispatchEvent(new Event('clinic-role-changed'));
        }}
      />
      <HelpFeedbackFab />
    </DashboardLayout>
  );
}

export default function ClinicPortalShell(props) {
  return (
    <ClinicPortalProvider>
      <ClinicPortalShellInner {...props} />
    </ClinicPortalProvider>
  );
}

export function ClinicQuickActions({ isAdmin }) {
  const reception = [
    { to: '/clinic-portal/patients', label: 'Register patient', icon: 'fa-user-plus' },
    { to: '/clinic-portal/appointments', label: "Today's queue", icon: 'fa-list-ol' },
    { to: '/clinic-portal/packages', label: 'Packages', icon: 'fa-box-open' },
    { to: '/clinic-portal/billing', label: 'Billing / collect', icon: 'fa-file-invoice-dollar' },
  ];
  const admin = [
    { to: '/clinic-portal/reports', label: 'Reports', icon: 'fa-chart-column' },
    { to: '/clinic-portal/team', label: 'My Team', icon: 'fa-user-group' },
    { to: '/clinic-portal/earnings', label: 'Finance', icon: 'fa-sack-dollar' },
    { to: '/clinic-portal/profile', label: 'Clinic Profile', icon: 'fa-hospital' },
  ];
  const items = isAdmin ? [...reception, ...admin] : reception;
  return (
    <div className="dash-quick-grid">
      {items.map((a) => (
        <Link key={a.label} to={a.to} className="dash-quick-action group">
          <span className="dash-quick-action-icon">
            <FaIcon icon={a.icon} />
          </span>
          <p className="dash-quick-action-label">{a.label}</p>
        </Link>
      ))}
    </div>
  );
}
