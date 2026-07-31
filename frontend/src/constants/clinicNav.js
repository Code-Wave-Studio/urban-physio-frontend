/**
 * Clinic Portal navigation — Feature Request v1.3 layout
 * TOP = daily/weekly operational menus
 * BOTTOM (Settings) = occasional configuration menus
 */

/** @typedef {{ to: string, label: string, icon: string, perm?: string, notifyKey?: boolean, section?: 'ops' | 'settings', match?: 'exact' | 'prefix' }} ClinicNavItem */

/** @type {ClinicNavItem[]} */
export const CLINIC_RECEPTIONIST_NAV = [
  // —— Top: Operational ——
  { to: '/clinic-portal', label: 'Dashboard', icon: 'fa-gauge-high', perm: 'dashboard.reception', section: 'ops', match: 'exact' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view', section: 'ops' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view', section: 'ops' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view', section: 'ops', match: 'prefix' },
  { to: '/clinic-portal/packages', label: 'Packages', icon: 'fa-box-open', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/reports', label: 'Reports', icon: 'fa-chart-column', perm: 'dashboard.reception', section: 'ops' },
  { to: '/clinic-portal/communication', label: 'Communication', icon: 'fa-comments', perm: 'notifications.view', section: 'ops', match: 'prefix' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view', section: 'ops' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.basic', section: 'ops' },
  { to: '/clinic-portal/notes', label: 'Notes', icon: 'fa-note-sticky', perm: 'documents.basic', section: 'ops' },
  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/invoices', label: 'Invoices', icon: 'fa-file-invoice', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/qr', label: 'Clinic QR', icon: 'fa-qrcode', perm: 'qr.view', section: 'ops' },
];

/** @type {ClinicNavItem[]} */
export const CLINIC_ADMIN_NAV = [
  // —— Top: Operational ——
  { to: '/clinic-portal/admin', label: 'Dashboard', icon: 'fa-gauge-high', perm: 'dashboard.admin', section: 'ops', match: 'exact' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view', section: 'ops' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view', section: 'ops' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view', section: 'ops', match: 'prefix' },
  { to: '/clinic-portal/packages', label: 'Packages', icon: 'fa-box-open', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/reports', label: 'Reports', icon: 'fa-chart-column', perm: 'analytics.view', section: 'ops' },
  { to: '/clinic-portal/communication', label: 'Communication', icon: 'fa-comments', perm: 'notifications.view', section: 'ops', match: 'prefix' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view', section: 'ops' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.manage', section: 'ops' },
  { to: '/clinic-portal/notes', label: 'Notes', icon: 'fa-note-sticky', perm: 'documents.manage', section: 'ops' },
  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/invoices', label: 'Invoices', icon: 'fa-file-invoice', perm: 'billing.view', section: 'ops' },
  { to: '/clinic-portal/exercises', label: 'Exercises', icon: 'fa-dumbbell', perm: 'exercises.manage', section: 'ops' },

  // —— Bottom: Settings ——
  { to: '/clinic-portal/settings/availability', label: 'Availability Settings', icon: 'fa-sliders', perm: 'availability.manage', section: 'settings' },
  { to: '/clinic-portal/profile', label: 'Clinic Profile', icon: 'fa-hospital', perm: 'profile.manage', section: 'settings' },
  { to: '/clinic-portal/branding', label: 'Branding', icon: 'fa-palette', perm: 'profile.manage', section: 'settings' },
  { to: '/clinic-portal/team', label: 'My Team', icon: 'fa-user-group', anyPerm: ['doctors.manage', 'staff.manage'], section: 'settings' },
  { to: '/clinic-portal/create-package', label: 'Package Catalog', icon: 'fa-boxes-stacked', perm: 'packages.manage', section: 'settings' },
  { to: '/clinic-portal/earnings', label: 'Finance', icon: 'fa-sack-dollar', perm: 'earnings.view', section: 'settings' },
  { to: '/clinic-portal/settings/support', label: 'Support Center', icon: 'fa-life-ring', perm: 'dashboard.admin', section: 'settings' },
  { to: '/clinic-portal/clinical-library', label: 'Clinical Library', icon: 'fa-book-medical', anyPerm: ['clinical_library.view', 'clinical_library.manage', 'profile.manage'], section: 'settings' },
  { to: '/clinic-portal/forms', label: 'Intake Form Builder', icon: 'fa-list-check', perm: 'forms.manage', section: 'settings' },
  { to: '/clinic-portal/settings/assessments', label: 'Digital Assessment', icon: 'fa-clipboard-list', perm: 'forms.manage', section: 'settings' },
  { to: '/clinic-portal/settings/protocols', label: 'Treatment Protocols', icon: 'fa-notes-medical', perm: 'forms.manage', section: 'settings' },
  { to: '/clinic-portal/settings/suggestion-chips', label: 'Suggestion Chips', icon: 'fa-tags', perm: 'forms.manage', section: 'settings' },
  { to: '/clinic-portal/qr', label: 'Clinic QR', icon: 'fa-qrcode', perm: 'qr.view', section: 'settings' },
  { to: '/clinic-portal/notifications/manage', label: 'Notification Setup', icon: 'fa-bullhorn', perm: 'notifications.manage', section: 'settings' },
];

/** Backward-compatible full list (admin). */
export const CLINIC_NAV = CLINIC_ADMIN_NAV;

export function clinicNavFor(portalRole, permissions = []) {
  const list = portalRole === 'clinic_admin' ? CLINIC_ADMIN_NAV : CLINIC_RECEPTIONIST_NAV;
  if (!permissions?.length) return list;
  return list.filter((item) => {
    if (item.anyPerm?.length) {
      return item.anyPerm.some((p) => permissions.includes(p));
    }
    return !item.perm || permissions.includes(item.perm);
  });
}

export function hasClinicPerm(permissions, perm) {
  if (!perm) return true;
  return Array.isArray(permissions) && permissions.includes(perm);
}

/** Group filtered nav into ops + settings for sidebar rendering. */
export function clinicNavSections(links = []) {
  const ops = links.filter((l) => (l.section || 'ops') === 'ops');
  const settings = links.filter((l) => l.section === 'settings');
  return { ops, settings };
}

export function isClinicNavActive(pathname, link) {
  if (!link?.to) return false;
  if (link.match === 'exact') {
    return pathname === link.to;
  }
  if (link.match === 'prefix') {
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
  }
  return pathname === link.to;
}
