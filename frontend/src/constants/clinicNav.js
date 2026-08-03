/**
 * Clinic Portal navigation — architecture categories
 * RBAC still filtered via clinicNavFor(); UI groups via section.
 */

/** @typedef {{ to?: string, action?: string, label: string, icon: string, perm?: string, anyPerm?: string[], notifyKey?: boolean, section?: string, match?: 'exact' | 'prefix' }} ClinicNavItem */

export const CLINIC_SECTION_ORDER = [
  'operations',
  'clinical_hub',
  'finance',
  'settings_team',
  'settings_clinical',
  'settings_admin',
];

export const CLINIC_SPEED_DIAL = [
  { action: 'book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-orange-500 to-amber-600' },
  { action: 'new-patient', label: 'New Patient', icon: 'fa-user-plus', color: 'from-teal-500 to-emerald-600' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', color: 'from-sky-500 to-blue-600' },
  { to: '/clinic-portal/appointments', label: 'e-Health', icon: 'fa-video', color: 'from-violet-500 to-purple-600' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', color: 'from-rose-500 to-pink-600' },
  { to: '/clinic-portal/qr', label: 'Clinic QR', icon: 'fa-qrcode', color: 'from-slate-600 to-slate-800' },
];

/** @type {ClinicNavItem[]} */
export const CLINIC_RECEPTIONIST_NAV = [
  { to: '/clinic-portal', label: 'Dashboard', icon: 'fa-gauge-high', perm: 'dashboard.reception', section: 'operations', match: 'exact' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view', section: 'operations' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view', section: 'operations' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view', section: 'operations', match: 'prefix' },
  { to: '/clinic-portal/communication', label: 'Communication', icon: 'fa-comments', perm: 'notifications.view', section: 'operations', match: 'prefix' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view', section: 'operations' },

  { to: '/clinic-portal/notes', label: 'Notes', icon: 'fa-note-sticky', perm: 'documents.basic', section: 'clinical_hub' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.basic', section: 'clinical_hub' },

  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/invoices', label: 'Invoices', icon: 'fa-file-invoice', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/packages', label: 'Packages', icon: 'fa-box-open', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/reports', label: 'Reports', icon: 'fa-chart-column', perm: 'dashboard.reception', section: 'finance' },

  { to: '/clinic-portal/qr', label: 'Clinic QR', icon: 'fa-qrcode', perm: 'qr.view', section: 'settings_team' },
];

/** @type {ClinicNavItem[]} */
export const CLINIC_ADMIN_NAV = [
  // Operations
  { to: '/clinic-portal/admin', label: 'Dashboard', icon: 'fa-gauge-high', perm: 'dashboard.admin', section: 'operations', match: 'exact' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view', section: 'operations' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view', section: 'operations' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view', section: 'operations', match: 'prefix' },
  { to: '/clinic-portal/communication', label: 'Communication', icon: 'fa-comments', perm: 'notifications.view', section: 'operations', match: 'prefix' },
  { to: '/clinic-portal/back-office', label: 'Back Office', icon: 'fa-warehouse', perm: 'backoffice.view', section: 'operations', match: 'prefix' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view', section: 'operations' },

  // Clinical Hub
  { to: '/clinic-portal/rehab', label: 'Exercise & Rehab', icon: 'fa-dumbbell', perm: 'exercises.manage', section: 'clinical_hub', match: 'prefix' },
  { to: '/clinic-portal/notes', label: 'Notes', icon: 'fa-note-sticky', perm: 'documents.manage', section: 'clinical_hub' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.manage', section: 'clinical_hub' },

  // Finance
  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/invoices', label: 'Invoices', icon: 'fa-file-invoice', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/packages', label: 'Packages', icon: 'fa-box-open', perm: 'billing.view', section: 'finance' },
  { to: '/clinic-portal/reports', label: 'Reports', icon: 'fa-chart-column', perm: 'analytics.view', section: 'finance' },
  { to: '/clinic-portal/analytics-center', label: 'Analytics Center', icon: 'fa-brain', perm: 'analytics.view', section: 'finance', match: 'prefix' },

  // Settings · Team
  { to: '/clinic-portal/profile', label: 'Clinic Profile', icon: 'fa-hospital', perm: 'profile.manage', section: 'settings_team' },
  { to: '/clinic-portal/branding', label: 'Branding', icon: 'fa-palette', perm: 'profile.manage', section: 'settings_team' },
  { to: '/clinic-portal/team', label: 'My Team', icon: 'fa-user-group', anyPerm: ['doctors.manage', 'staff.manage'], section: 'settings_team' },
  { to: '/clinic-portal/qr', label: 'Clinic QR', icon: 'fa-qrcode', perm: 'qr.view', section: 'settings_team' },

  // Settings · Clinical
  { to: '/clinic-portal/clinical-library', label: 'Clinical Library', icon: 'fa-book-medical', anyPerm: ['clinical_library.view', 'clinical_library.manage', 'profile.manage'], section: 'settings_clinical' },
  { to: '/clinic-portal/settings/assessments', label: 'Digital Assessment', icon: 'fa-clipboard-list', perm: 'forms.manage', section: 'settings_clinical' },
  { to: '/clinic-portal/forms', label: 'Intake Form Builder', icon: 'fa-list-check', perm: 'forms.manage', section: 'settings_clinical' },
  { to: '/clinic-portal/settings/protocols', label: 'Treatment Protocols', icon: 'fa-notes-medical', perm: 'forms.manage', section: 'settings_clinical' },
  { to: '/clinic-portal/settings/suggestion-chips', label: 'Suggestion Chips', icon: 'fa-tags', perm: 'forms.manage', section: 'settings_clinical' },

  // Settings · Admin
  { to: '/clinic-portal/settings/availability', label: 'Availability Settings', icon: 'fa-sliders', perm: 'availability.manage', section: 'settings_admin' },
  { to: '/clinic-portal/create-package', label: 'Package Catalog', icon: 'fa-boxes-stacked', perm: 'packages.manage', section: 'settings_admin' },
  { to: '/clinic-portal/earnings', label: 'Finance', icon: 'fa-sack-dollar', perm: 'earnings.view', section: 'settings_admin' },
  { to: '/clinic-portal/notifications/manage', label: 'Notification Setup', icon: 'fa-bullhorn', perm: 'notifications.manage', section: 'settings_admin' },
  { to: '/clinic-portal/settings/support', label: 'Support Center', icon: 'fa-life-ring', perm: 'dashboard.admin', section: 'settings_admin' },
];

/** Backward-compatible full list (admin). */
export const CLINIC_NAV = CLINIC_ADMIN_NAV;

export function clinicNavFor(portalRole, permissions = []) {
  const list = portalRole === 'clinic_admin' ? CLINIC_ADMIN_NAV : CLINIC_RECEPTIONIST_NAV;
  if (!permissions?.length) return list;
  return list.filter((item) => {
    if (item.action === 'logout') return true;
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

/** @deprecated Prefer groupPortalNav from portalArchitecture — kept for older callers */
export function clinicNavSections(links = []) {
  const ops = links.filter((l) =>
    ['operations', 'clinical_hub', 'finance', 'ops'].includes(l.section || 'operations')
  );
  const settings = links.filter((l) => String(l.section || '').startsWith('settings'));
  return { ops, settings };
}

export function isClinicNavActive(pathname, link) {
  if (!link?.to) return false;
  if (link.match === 'exact') return pathname === link.to;
  if (link.match === 'prefix') {
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
  }
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}
