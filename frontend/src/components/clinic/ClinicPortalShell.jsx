import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../FaIcon';
import ClinicRoleSwitch from './ClinicRoleSwitch';
import HelpFeedbackFab from './HelpFeedbackFab';
import { clinicNavFor } from '../../constants/clinicNav';
import useClinicPortal from '../../hooks/useClinicPortal';
import { ClinicPortalProvider } from '../../contexts/ClinicPortalContext';

/**
 * Shared clinic portal chrome: role-aware nav + mode switcher in sidebar footer.
 * Header/sidebar always use the company (The Urban Physio) logo — not the clinic brand logo.
 * Broadcast lives on Communication / Notification Setup — not on every page header.
 */
function ClinicPortalShellInner({ children, title, subtitle, actions, hideHeaderTitle = false }) {
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
      clinicId={clinicId || clinic?.id || null}
      clinicClosed={Boolean(Number(clinic?.is_closed))}
    >
      {(!hideHeaderTitle || actions) && (
        <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {!hideHeaderTitle && (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {title && (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">
                    {title}
                  </h1>
                )}
                <div className="inline-flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                    isAdminMode
                      ? 'bg-primary-50 text-primary-800 border-primary-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    <FaIcon icon={isAdminMode ? 'fa-user-shield' : 'fa-desktop'} className="text-[11px]" />
                    {isAdminMode ? 'Clinic Admin' : 'Front Desk'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSwitchOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Switch between Clinic Admin and Front Desk modes"
                  >
                    <FaIcon icon="fa-right-left" className="text-[9px] text-slate-500" />
                    <span>Switch</span>
                  </button>
                </div>
              </div>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1 break-words">{subtitle}</p>
              )}
            </div>
          )}
          {actions ? (
            <div className="portal-page-actions shrink-0 flex flex-wrap items-center gap-2 ml-auto">{actions}</div>
          ) : null}
        </div>
      )}

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

export default function ClinicPortalShell({ children, title, subtitle, actions, hideHeaderTitle = false }) {
  return (
    <ClinicPortalProvider>
      <ClinicPortalShellInner title={title} subtitle={subtitle} actions={actions} hideHeaderTitle={hideHeaderTitle}>
        {children}
      </ClinicPortalShellInner>
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
