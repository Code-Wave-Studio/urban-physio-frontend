/** Doctor portal — architecture categories */

export const DOCTOR_SECTION_ORDER = ['workspace', 'clinical', 'practice', 'finance', 'settings'];

export const DOCTOR_SPEED_DIAL = [
  { to: '/doctor/appointments', label: 'Appointments', icon: 'fa-calendar-check', color: 'from-teal-500 to-emerald-600' },
  { to: '/doctor/clinic-availability', label: 'Availability', icon: 'fa-calendar-days', color: 'from-sky-500 to-cyan-600' },
  { to: '/doctor/patients', label: 'Patients', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
  { to: '/doctor/requests', label: 'Reschedule / Cancel', icon: 'fa-arrows-rotate', color: 'from-amber-500 to-orange-600' },
];

export const DOCTOR_NAV = [
  // Workspace
  { to: '/doctor', label: 'Overview', icon: 'fa-chart-line', section: 'workspace', match: 'exact' },
  { to: '/doctor/calendar', label: 'Calendar', icon: 'fa-calendar-days', section: 'workspace' },
  { to: '/doctor/appointments', label: 'Appointments', icon: 'fa-calendar-check', section: 'workspace' },
  { to: '/doctor/consultation-rooms', label: 'Consultation Rooms', icon: 'fa-comments', section: 'workspace' },
  { to: '/doctor/requests', label: 'Reschedule / Cancel', icon: 'fa-inbox', section: 'workspace' },
  { to: '/doctor/patients', label: 'Patients', icon: 'fa-users', section: 'workspace' },
  { to: '/doctor/search', label: 'Advanced Search', icon: 'fa-magnifying-glass-plus', section: 'workspace' },
  { to: '/doctor/emergency', label: 'Emergency', icon: 'fa-truck-medical', section: 'workspace' },

  // Clinical Tools
  { to: '/doctor/treatment-journey', label: 'Treatment Journey', icon: 'fa-notes-medical', section: 'clinical' },
  { to: '/doctor/prescriptions', label: 'Rehab Plans', icon: 'fa-dumbbell', section: 'clinical' },
  { to: '/doctor/documents', label: 'Documents', icon: 'fa-folder-tree', section: 'clinical' },

  // Practice & Growth
  { to: '/doctor/clinics', label: 'My Clinics', icon: 'fa-hospital', section: 'practice', match: 'exact' },
  { to: '/doctor/clinics/new', label: 'Add Clinic', icon: 'fa-plus', section: 'practice' },
  { to: '/doctor/treatment-services', label: 'Services & Treatments', icon: 'fa-hand-holding-medical', section: 'practice' },
  { to: '/doctor/service-packages', label: 'My Packages', icon: 'fa-box-open', section: 'practice' },
  { to: '/doctor/packages', label: 'Enrollments', icon: 'fa-user-plus', section: 'practice' },
  { to: '/clinic-manage', label: 'Clinic Analytics', icon: 'fa-hospital-user', section: 'practice' },

  // Finance
  { to: '/doctor/admin-package-prices', label: 'Platform Prices', icon: 'fa-tags', section: 'finance' },
  { to: '/doctor/earnings', label: 'Earnings', icon: 'fa-indian-rupee-sign', section: 'finance' },

  // Settings
  { to: '/doctor/clinic-availability', label: 'Availability', icon: 'fa-clock', section: 'settings' },
  { to: '/doctor/booking-filters', label: 'Booking Filters', icon: 'fa-filter', section: 'settings' },
  { to: '/doctor/custom-slots', label: 'Custom Slots', icon: 'fa-calendar-plus', section: 'settings' },
  { to: '/doctor/profile', label: 'Profile', icon: 'fa-user-gear', section: 'settings' },
  { to: '/doctor/notifications', label: 'Notifications', icon: 'fa-bell', section: 'settings', notifyKey: true },
];
