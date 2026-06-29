export const EXPLORE_LINKS = [
  { to: '/doctors', label: 'Find Physiotherapist', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital', tone: 'emerald' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical' },
  { to: '/treatments', label: 'Our Services', icon: 'fa-kit-medical' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell' },
  { to: '/physiofeed', label: 'PhysioFeed', icon: 'fa-newspaper' },
  { to: '/about', label: 'About Us', icon: 'fa-building' },
];

export const PROVIDER_LINKS = [
  { to: '/contact', label: 'Careers', icon: 'fa-briefcase' },
  { to: '/doctor/login', label: 'Clinic Portal', icon: 'fa-hospital-user' },
  { to: '/doctor/register', label: 'Physiotherapist Portal', icon: 'fa-user-doctor' },
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
  { to: '/patient', label: 'Patient Dashboard', icon: 'fa-gauge-high', color: 'from-primary-500 to-orange-600' },
  { to: '/patient/saved', label: 'My Favourites', icon: 'fa-heart', color: 'from-rose-500 to-pink-600' },
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-emerald-500 to-teal-600' },
  { to: '/patient/notifications', label: 'Notifications', icon: 'fa-bell', color: 'from-violet-500 to-indigo-600', notifyKey: true },
];

export const DOCTOR_SPEED_DIAL = [
  { to: '/doctor', label: 'Doctor Dashboard', icon: 'fa-gauge-high', color: 'from-primary-500 to-primary-700' },
  { to: '/doctor/clinic-availability', label: 'Availability', icon: 'fa-calendar-days', color: 'from-sky-500 to-cyan-600' },
  { to: '/doctor/requests', label: 'Rescheduling & Cancellation', icon: 'fa-arrows-rotate', color: 'from-amber-500 to-orange-600' },
  { to: '/doctor/notifications', label: 'Notifications', icon: 'fa-bell', color: 'from-violet-500 to-indigo-600', notifyKey: true },
];

export const ADMIN_SPEED_DIAL = [
  { to: '/admin', label: 'Admin Dashboard', icon: 'fa-gauge-high', color: 'from-primary-500 to-primary-700' },
  { to: '/admin/users', label: 'Users', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
  { to: '/admin/clinics', label: 'Clinics', icon: 'fa-hospital', color: 'from-emerald-500 to-teal-600' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-line', color: 'from-sky-500 to-blue-600' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'fa-bell', color: 'from-amber-500 to-orange-600', notifyKey: true },
];

export function speedDialForRole(hasRole) {
  if (hasRole('super_admin', 'admin')) return ADMIN_SPEED_DIAL;
  if (hasRole('doctor')) return DOCTOR_SPEED_DIAL;
  if (hasRole('patient')) return PATIENT_SPEED_DIAL;
  return GUEST_SPEED_DIAL;
}
