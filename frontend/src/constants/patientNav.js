/** Patient portal — architecture categories */

export const PATIENT_SECTION_ORDER = ['visits', 'explore', 'health', 'billing', 'settings'];

export const PATIENT_SPEED_DIAL = [
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus', color: 'from-primary-500 to-orange-600' },
  { to: '/patient/prescriptions', label: 'Prescription & Notes', icon: 'fa-file-prescription', color: 'from-violet-500 to-purple-600' },
  { to: '/patient/exercises', label: 'My Rehab Plan', icon: 'fa-dumbbell', color: 'from-emerald-500 to-teal-600' },
  { to: '/patient/saved', label: 'Favorites', icon: 'fa-heart', color: 'from-rose-500 to-pink-600' },
];

export const PATIENT_NAV = [
  // Visits & Consults
  { to: '/patient', label: 'Overview', icon: 'fa-house', section: 'visits', match: 'exact' },
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-plus', section: 'visits' },
  { to: '/patient/appointments', label: 'Appointments', icon: 'fa-calendar-check', section: 'visits' },
  { to: '/patient/video-consultations', label: 'Video Consultation', icon: 'fa-video', section: 'visits' },
  { to: '/emergency/book', label: 'Emergency Care', icon: 'fa-truck-medical', section: 'visits' },

  // Explore
  { to: '/doctors', label: 'Find Doctors', icon: 'fa-user-doctor', section: 'explore' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital', section: 'explore' },
  { to: '/book?type=home_visit', label: 'Home Physiotherapy', icon: 'fa-house-medical', section: 'explore' },
  { to: '/treatments', label: 'Our Services', icon: 'fa-kit-medical', section: 'explore' },
  { to: '/exercises', label: 'Exercise Library', icon: 'fa-dumbbell', section: 'explore' },
  { to: '/physiofeed', label: 'PhysioFeed', icon: 'fa-newspaper', section: 'explore' },

  // Health Records
  { to: '/patient/exercises', label: 'My Rehab Plan', icon: 'fa-person-walking', section: 'health' },
  { to: '/patient/treatment-journey', label: 'Treatment Journey', icon: 'fa-notes-medical', section: 'health' },
  { to: '/patient/prescriptions', label: 'Prescription & Notes', icon: 'fa-file-prescription', section: 'health' },
  { to: '/patient/progress', label: 'Progress', icon: 'fa-chart-line', section: 'health' },
  { to: '/patient/reports', label: 'My Reports', icon: 'fa-file-medical', section: 'health' },
  { to: '/patient/documents', label: 'Documents', icon: 'fa-folder-tree', section: 'health' },

  // Billing & Plans
  { to: '/patient/bills', label: 'Bills & Payments', icon: 'fa-file-invoice-dollar', section: 'billing' },
  { to: '/patient/packages', label: 'My Packages', icon: 'fa-box-open', section: 'billing' },
  { to: '/patient/wallet', label: 'Wallet', icon: 'fa-wallet', section: 'billing' },

  // Settings
  { to: '/patient/profile', label: 'Profile', icon: 'fa-user-gear', section: 'settings' },
  { to: '/patient/saved', label: 'Saved', icon: 'fa-heart', section: 'settings' },
  { to: '/patient/notifications', label: 'Notifications', icon: 'fa-bell', section: 'settings', notifyKey: true },
  { to: '/faq', label: 'FAQ', icon: 'fa-circle-question', section: 'settings' },
  { to: '/contact', label: 'Contact Us', icon: 'fa-envelope', section: 'settings' },
];
