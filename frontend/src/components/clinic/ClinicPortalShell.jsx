import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../FaIcon';
import ClinicRoleSwitch from './ClinicRoleSwitch';
import { clinicNavFor } from '../../constants/clinicNav';
import useClinicPortal from '../../hooks/useClinicPortal';
import { ClinicPortalProvider } from '../../contexts/ClinicPortalContext';

/**
 * Shared clinic portal chrome: role-aware nav + mode switcher badge.
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
  } = useClinicPortal();
  const [switchOpen, setSwitchOpen] = useState(false);
  const links = clinicNavFor(portalRole, permissions);

  return (
    <DashboardLayout links={links} variant="clinic">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          {title && <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">{title}</h1>}
          {subtitle && <p className="text-sm text-slate-500 mt-1 break-words">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {actions}
          <button
            type="button"
            onClick={() => setSwitchOpen(true)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              isAdminMode
                ? 'bg-violet-50 text-violet-800 border-violet-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}
            title="Switch portal role"
          >
            <FaIcon icon={isAdminMode ? 'fa-user-shield' : 'fa-desktop'} />
            {isAdminMode ? 'Clinic Admin' : 'Receptionist'}
            {(canSwitchAdmin || isAdminMode) && (
              <FaIcon icon="fa-right-left" className="opacity-60" />
            )}
          </button>
        </div>
      </div>

      {!loading && !clinic && (
        <div className="glass-card text-center py-10 mb-4">
          <FaIcon icon="fa-hospital" className="text-3xl text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No clinic linked to this account</p>
          <p className="text-sm text-slate-500 mt-1">Contact support if you believe this is an error.</p>
        </div>
      )}

      {children}

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
    { to: '/clinic-portal/appointments', label: 'Today\'s queue', icon: 'fa-list-ol' },
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((a) => (
        <Link
          key={a.label}
          to={a.to}
          className="glass-card !p-3 text-center hover:border-teal-300 transition"
        >
          <FaIcon icon={a.icon} className="text-teal-600 mb-1" />
          <p className="text-xs font-medium text-slate-700">{a.label}</p>
        </Link>
      ))}
    </div>
  );
}
