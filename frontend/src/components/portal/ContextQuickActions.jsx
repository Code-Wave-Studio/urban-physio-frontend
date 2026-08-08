import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FaIcon from '../FaIcon';

/**
 * Context-aware quick-action bar that shows route-appropriate shortcuts.
 * Only links to EXISTING routes/pages — never creates fake actions.
 */

const PATIENT_PROFILE_ACTIONS = [
  { label: 'New Assessment', icon: 'fa-clipboard-list', to: '?tab=Assessments', relative: true },
  { label: 'Start Consultation', icon: 'fa-video', to: '?tab=Consultation Room', relative: true },
  { label: 'Add Note', icon: 'fa-note-sticky', to: '?tab=Clinical Notes', relative: true },
  { label: 'Payments', icon: 'fa-indian-rupee-sign', to: '?tab=Payments', relative: true },
  { label: 'Documents', icon: 'fa-folder-tree', to: '?tab=Documents', relative: true },
];

const BILLING_ACTIONS = [
  { label: 'Collect Payment', icon: 'fa-indian-rupee-sign', to: '/clinic-portal/billing' },
  { label: 'Generate Invoice', icon: 'fa-file-invoice', to: '/clinic-portal/invoices' },
  { label: 'Packages', icon: 'fa-box-open', to: '/clinic-portal/packages' },
];

const SCHEDULING_ACTIONS = [
  { label: 'Calendar', icon: 'fa-calendar-days' },
  { label: 'Appointments', icon: 'fa-calendar-check' },
  { label: 'Availability', icon: 'fa-clock' },
];

const REPORTS_ACTIONS = [
  { label: 'Reports', icon: 'fa-chart-column', to: '/clinic-portal/reports' },
  { label: 'Analytics Center', icon: 'fa-brain', to: '/clinic-portal/analytics-center' },
];

function resolveActionsForRoute(pathname, variant) {
  /* Clinic portal routes */
  if (variant === 'clinic') {
    if (/^\/clinic-portal\/patients\/[^/]+/.test(pathname)) return PATIENT_PROFILE_ACTIONS;
    if (pathname.startsWith('/clinic-portal/billing') || pathname.startsWith('/clinic-portal/invoices')) return BILLING_ACTIONS;
    if (pathname.startsWith('/clinic-portal/calendar') || pathname.startsWith('/clinic-portal/appointments') || pathname.startsWith('/clinic-portal/availability')) {
      return [
        { label: 'Calendar', icon: 'fa-calendar-days', to: '/clinic-portal/calendar' },
        { label: 'Appointments', icon: 'fa-calendar-check', to: '/clinic-portal/appointments' },
        { label: 'Availability', icon: 'fa-clock', to: '/clinic-portal/availability' },
      ];
    }
    if (pathname.startsWith('/clinic-portal/reports') || pathname.startsWith('/clinic-portal/analytics')) return REPORTS_ACTIONS;
  }

  /* Doctor portal routes */
  if (variant === 'doctor') {
    if (pathname.startsWith('/doctor/calendar') || pathname.startsWith('/doctor/appointments')) {
      return [
        { label: 'Calendar', icon: 'fa-calendar-days', to: '/doctor/calendar' },
        { label: 'Appointments', icon: 'fa-calendar-check', to: '/doctor/appointments' },
        { label: 'Availability', icon: 'fa-clock', to: '/doctor/clinic-availability' },
      ];
    }
  }

  return [];
}

export default function ContextQuickActions({ variant = 'patient', clinicId }) {
  const { pathname } = useLocation();

  const actions = useMemo(
    () => resolveActionsForRoute(pathname, variant),
    [pathname, variant]
  );

  if (!actions.length) return null;

  return (
    <div className="context-quick-actions" role="toolbar" aria-label="Quick actions">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
        Quick
      </span>
      {actions.map((action) => {
        const to = action.relative
          ? `${pathname}${action.to}`
          : action.to || pathname;

        return (
          <Link
            key={action.label}
            to={to}
            className="context-quick-action-btn"
          >
            <FaIcon icon={action.icon} className="text-[11px]" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
