export const EXPLORE_LINKS = [
  { to: '/doctors', label: 'Find Physiotherapist', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital', tone: 'emerald' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical' },
  { to: '/treatments', label: 'Our Services', icon: 'fa-kit-medical' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell' },
  { to: '/physiofeed', label: 'PhysioFeed', icon: 'fa-newspaper' },
  { to: '/podcast', label: 'Podcast', icon: 'fa-podcast' },
  { to: '/about', label: 'About Us', icon: 'fa-building' },
];

import { PATIENT_NAV } from '../../constants/patientNav';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import { CLINIC_ADMIN_NAV } from '../../constants/clinicNav';
import { ADMIN_NAV } from '../../constants/adminNav';

export const PATIENT_PORTAL_LINKS = PATIENT_NAV;
export const DOCTOR_PORTAL_LINKS = DOCTOR_NAV;
export const CLINIC_PORTAL_LINKS = CLINIC_ADMIN_NAV;
export const ADMIN_PORTAL_LINKS = ADMIN_NAV;

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
  if (typeof hasRole === 'function') {
    if (hasRole('super_admin', 'admin', 'sub_admin')) return ADMIN_SPEED_DIAL;
    if (hasRole('doctor')) return DOCTOR_SPEED_DIAL;
    if (hasRole('clinic', 'clinic_staff', 'clinic_admin')) return CLINIC_SPEED_DIAL;
    if (hasRole('patient')) return PATIENT_SPEED_DIAL;
  }
  return GUEST_SPEED_DIAL;
}
