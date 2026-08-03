export const EXPLORE_LINKS = [
  { to: '/doctors', label: 'Find Physiotherapist', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital', tone: 'emerald' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical' },
  { to: '/treatments', label: 'Our Services', icon: 'fa-kit-medical' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell' },
  { to: '/physiofeed', label: 'PhysioFeed', icon: 'fa-newspaper' },
  { to: '/about', label: 'About Us', icon: 'fa-building' },
];

export const PATIENT_PORTAL_LINKS = [
  { to: '/patient', label: 'Patient Dashboard', icon: 'fa-gauge-high', tone: 'primary' },
  { to: '/patient/appointments', label: 'Appointments & Queue', icon: 'fa-calendar-check', tone: 'primary' },
  { to: '/patient/video-consultations', label: 'Video Consultations', icon: 'fa-video', tone: 'primary' },
  { to: '/patient/prescriptions', label: 'Prescriptions & Notes', icon: 'fa-file-prescription', tone: 'primary' },
  { to: '/patient/exercises', label: 'Exercise Library & HEP', icon: 'fa-dumbbell', tone: 'primary' },
  { to: '/patient/progress', label: 'Recovery Progress', icon: 'fa-chart-line', tone: 'primary' },
  { to: '/patient/reports', label: 'Medical Reports & Scans', icon: 'fa-folder-open', tone: 'primary' },
  { to: '/patient/packages', label: 'Active Packages', icon: 'fa-box-open', tone: 'primary' },
  { to: '/patient/bills', label: 'Bills & Receipts', icon: 'fa-file-invoice-dollar', tone: 'primary' },
  { to: '/patient/wallet', label: 'Health Wallet', icon: 'fa-wallet', tone: 'primary' },
  { to: '/patient/saved', label: 'Saved Favorites', icon: 'fa-heart', tone: 'primary' },
  { to: '/patient/profile', label: 'Patient Profile', icon: 'fa-user-pen', tone: 'primary' },
];

export const DOCTOR_PORTAL_LINKS = [
  { to: '/doctor', label: 'Doctor Overview', icon: 'fa-gauge-high', tone: 'emerald' },
  { to: '/doctor/appointments', label: 'Appointments Board', icon: 'fa-calendar-check', tone: 'emerald' },
  { to: '/doctor/calendar', label: 'Schedule Calendar', icon: 'fa-calendar-days', tone: 'emerald' },
  { to: '/doctor/clinic-availability', label: 'Slot Availability', icon: 'fa-clock', tone: 'emerald' },
  { to: '/doctor/custom-slots', label: 'Custom Open Slots', icon: 'fa-calendar-plus', tone: 'emerald' },
  { to: '/doctor/patients', label: 'Patient Records', icon: 'fa-users', tone: 'emerald' },
  { to: '/doctor/prescriptions', label: 'Rehab Plans & HEP', icon: 'fa-dumbbell', tone: 'emerald' },
  { to: '/doctor/earnings', label: 'Earnings & Payouts', icon: 'fa-indian-rupee-sign', tone: 'emerald' },
  { to: '/doctor/requests', label: 'Reschedule Requests', icon: 'fa-arrows-rotate', tone: 'emerald' },
  { to: '/doctor/profile', label: 'Doctor Profile & Fees', icon: 'fa-user-doctor', tone: 'emerald' },
];

export const CLINIC_PORTAL_LINKS = [
  { to: '/clinic-portal/admin', label: 'Clinic Admin Dashboard', icon: 'fa-hospital', tone: 'emerald' },
  { to: '/clinic-portal', label: 'Front Desk Queue', icon: 'fa-list-ol', tone: 'emerald' },
  { to: '/clinic-portal/calendar', label: 'Clinic Calendar', icon: 'fa-calendar-days', tone: 'emerald' },
  { to: '/clinic-portal/appointments', label: 'Appointments & Queue', icon: 'fa-calendar-check', tone: 'emerald' },
  { to: '/clinic-portal/patients', label: 'Patients Directory', icon: 'fa-users', tone: 'emerald' },
  { to: '/clinic-portal/notes', label: 'Clinical Notes', icon: 'fa-note-sticky', tone: 'emerald' },
  { to: '/clinic-portal/documents', label: 'Documents & Files', icon: 'fa-folder-tree', tone: 'emerald' },
  { to: '/clinic-portal/packages', label: 'Package Catalog', icon: 'fa-box-open', tone: 'emerald' },
  { to: '/clinic-portal/billing', label: 'Billing & Collections', icon: 'fa-file-invoice-dollar', tone: 'emerald' },
  { to: '/clinic-portal/invoices', label: 'GST Invoices', icon: 'fa-file-invoice', tone: 'emerald' },
  { to: '/clinic-portal/earnings', label: 'Finance & Payouts', icon: 'fa-sack-dollar', tone: 'emerald' },
  { to: '/clinic-portal/team', label: 'My Team & Staff', icon: 'fa-user-group', tone: 'emerald' },
  { to: '/clinic-portal/profile', label: 'Clinic Profile Settings', icon: 'fa-sliders', tone: 'emerald' },
];

export const ADMIN_PORTAL_LINKS = [
  { to: '/admin', label: 'Admin Console', icon: 'fa-shield-halved', tone: 'primary' },
  { to: '/admin/appointments', label: 'All Appointments', icon: 'fa-calendar-check', tone: 'primary' },
  { to: '/admin/calendar', label: 'Platform Schedule', icon: 'fa-calendar-days', tone: 'primary' },
  { to: '/admin/users?role=doctor', label: 'Doctors Verification', icon: 'fa-user-doctor', tone: 'primary' },
  { to: '/admin/users?role=patient', label: 'Registered Patients', icon: 'fa-users', tone: 'primary' },
  { to: '/admin/emergency', label: 'Emergency Triage Board', icon: 'fa-kit-medical', tone: 'primary' },
  { to: '/admin/seo', label: 'SEO Center', icon: 'fa-magnifying-glass-chart', tone: 'primary' },
  { to: '/admin/home-banners', label: 'Banners & Media', icon: 'fa-images', tone: 'primary' },
  { to: '/admin/reviews', label: 'Patient Reviews', icon: 'fa-star', tone: 'primary' },
  { to: '/admin/treatment-packages', label: 'Package Templates', icon: 'fa-box-open', tone: 'primary' },
  { to: '/admin/logs', label: 'System Audit Logs', icon: 'fa-list-check', tone: 'primary' },
];

export const PROVIDER_LINKS = [
  { to: '/careers', label: 'Careers', icon: 'fa-briefcase' },
  { to: '/clinic/login', label: 'Clinic Portal', icon: 'fa-hospital-user' },
  { to: '/doctor/login', label: 'Physiotherapist Portal', icon: 'fa-user-doctor' },
];

export const MORE_LINKS = [
  { to: '/faq', label: 'FAQ', icon: 'fa-circle-question' },
  { to: '/contact', label: 'Contact Us', icon: 'fa-envelope' },
  { to: '/contact', label: 'Provider Support', icon: 'fa-headset' },
  { to: '/contact', label: 'Send Feedback', icon: 'fa-comment-dots' },
];

export const GUEST_SPEED_DIAL = [
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-primary-500 to-orange-600' },
  { to: '/doctors', label: 'Find Physiotherapist', icon: 'fa-user-doctor', color: 'from-sky-500 to-blue-600' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital', color: 'from-emerald-500 to-teal-600' },
  { to: '/patient/login', label: 'Sign In', icon: 'fa-right-to-bracket', color: 'from-violet-500 to-indigo-600' },
];

export const PATIENT_SPEED_DIAL = [
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-primary-500 to-orange-600' },
  { to: '/patient/prescriptions', label: 'Prescription & Notes', icon: 'fa-file-prescription', color: 'from-violet-500 to-purple-600' },
  { to: '/patient/exercises', label: 'My Rehab Plan', icon: 'fa-dumbbell', color: 'from-emerald-500 to-teal-600' },
  { to: '/patient/saved', label: 'Favorites', icon: 'fa-heart', color: 'from-rose-500 to-pink-600' },
];

export const DOCTOR_SPEED_DIAL = [
  { to: '/doctor/appointments', label: 'Appointments', icon: 'fa-calendar-check', color: 'from-teal-500 to-emerald-600' },
  { to: '/doctor/clinic-availability', label: 'Availability', icon: 'fa-calendar-days', color: 'from-sky-500 to-cyan-600' },
  { to: '/doctor/patients', label: 'Patients', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
  { to: '/doctor/requests', label: 'Reschedule / Cancel', icon: 'fa-arrows-rotate', color: 'from-amber-500 to-orange-600' },
];

export const ADMIN_SPEED_DIAL = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-gauge-high', color: 'from-primary-500 to-orange-600' },
  { to: '/admin/appointments', label: 'Appointments', icon: 'fa-calendar-check', color: 'from-sky-500 to-blue-600' },
  { to: '/admin/appointment-requests', label: 'Doctor Change', icon: 'fa-user-doctor', color: 'from-amber-500 to-orange-600' },
  { to: '/admin/support', label: 'Support Centre', icon: 'fa-life-ring', color: 'from-rose-500 to-pink-600' },
  { to: '/admin/clinics', label: 'Clinics', icon: 'fa-hospital', color: 'from-emerald-500 to-teal-600' },
  { to: '/admin/users', label: 'Users', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
];

export const CLINIC_SPEED_DIAL = [
  { action: 'book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-orange-500 to-amber-600' },
  { action: 'new-patient', label: 'New Patient', icon: 'fa-user-plus', color: 'from-teal-500 to-emerald-600' },
  { to: '/clinic-portal/calendar', label: 'Calendar', icon: 'fa-calendar-days', color: 'from-sky-500 to-blue-600' },
  { to: '/clinic-portal/patients', label: 'Patients', icon: 'fa-users', color: 'from-rose-500 to-pink-600' },
];

export function speedDialForRole(hasRole) {
  if (hasRole('super_admin', 'admin')) return ADMIN_SPEED_DIAL;
  if (hasRole('doctor')) return DOCTOR_SPEED_DIAL;
  if (hasRole('clinic', 'clinic_staff', 'clinic_admin')) return CLINIC_SPEED_DIAL;
  if (hasRole('patient')) return PATIENT_SPEED_DIAL;
  return GUEST_SPEED_DIAL;
}
