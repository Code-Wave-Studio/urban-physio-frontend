/** Clinic Portal navigation — independent authenticated clinic accounts */
export const CLINIC_NAV = [
  { to: '/clinic-portal', label: 'Overview', icon: 'fa-chart-line' },
  { to: '/clinic-portal/doctors', label: 'Doctors', icon: 'fa-user-doctor' },
  { to: '/clinic-portal/appointments', label: 'Appointments', icon: 'fa-calendar-check' },
  { to: '/clinic-portal/profile', label: 'Clinic Profile', icon: 'fa-hospital' },
  { to: '/clinic-portal/notifications', label: 'Notifications', icon: 'fa-bell', notifyKey: true },
];
