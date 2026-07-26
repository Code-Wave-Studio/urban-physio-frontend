/** Clinic Portal navigation — filtered by active portal role (receptionist | clinic_admin) */

export const CLINIC_RECEPTIONIST_NAV = [
  { to: '/clinic-portal', label: 'Front Desk', icon: 'fa-desktop', perm: 'dashboard.reception' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view' },
  { to: '/clinic-portal/search', label: 'Advanced Search', icon: 'fa-magnifying-glass-plus', perm: 'patients.view' },
  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.basic' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view' },
];

export const CLINIC_ADMIN_NAV = [
  { to: '/clinic-portal/admin', label: 'Admin Dashboard', icon: 'fa-chart-line', perm: 'dashboard.admin' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check', perm: 'appointments.view' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', perm: 'calendar.view' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', perm: 'patients.view' },
  { to: '/clinic-portal/search', label: 'Advanced Search', icon: 'fa-magnifying-glass-plus', perm: 'patients.view' },
  { to: '/clinic-portal/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', perm: 'billing.view' },
  { to: '/clinic-portal/doctors', label: 'Doctors', icon: 'fa-user-doctor', perm: 'doctors.manage' },
  { to: '/clinic-portal/staff', label: 'Staff', icon: 'fa-id-badge', perm: 'staff.manage' },
  { to: '/clinic-portal/documents', label: 'Documents', icon: 'fa-folder-tree', perm: 'documents.manage' },
  { to: '/clinic-portal/exercises', label: 'Exercises', icon: 'fa-dumbbell', perm: 'exercises.manage' },
  { to: '/clinic-portal/earnings', label: 'Finance', icon: 'fa-sack-dollar', perm: 'earnings.view' },
  { to: '/clinic-portal/profile', label: 'Clinic Settings', icon: 'fa-hospital', perm: 'profile.manage' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true, perm: 'notifications.view' },
];

/** Backward-compatible full list (admin). */
export const CLINIC_NAV = CLINIC_ADMIN_NAV;

export function clinicNavFor(portalRole, permissions = []) {
  const list = portalRole === 'clinic_admin' ? CLINIC_ADMIN_NAV : CLINIC_RECEPTIONIST_NAV;
  if (!permissions?.length) return list;
  return list.filter((item) => !item.perm || permissions.includes(item.perm));
}

export function hasClinicPerm(permissions, perm) {
  if (!perm) return true;
  return Array.isArray(permissions) && permissions.includes(perm);
}
