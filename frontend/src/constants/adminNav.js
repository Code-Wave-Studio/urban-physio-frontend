/** Admin console — architecture categories */

export const ADMIN_SECTION_ORDER = [
  'core',
  'network',
  'content',
  'finance_promos',
  'settings_marketing',
  'settings_system',
];

export const ADMIN_SPEED_DIAL = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-gauge-high', color: 'from-primary-500 to-orange-600' },
  { to: '/admin/appointments', label: 'Appointments', icon: 'fa-calendar-check', color: 'from-sky-500 to-blue-600' },
  { to: '/admin/appointment-requests', label: 'Doctor Change', icon: 'fa-user-doctor', color: 'from-amber-500 to-orange-600' },
  { to: '/admin/support', label: 'Support Centre', icon: 'fa-life-ring', color: 'from-rose-500 to-pink-600' },
  { to: '/admin/clinics', label: 'Clinics', icon: 'fa-hospital', color: 'from-emerald-500 to-teal-600' },
  { to: '/admin/users', label: 'Users', icon: 'fa-users', color: 'from-violet-500 to-purple-600' },
];

export const ADMIN_NAV = [
  // Core Operations
  { to: '/admin', label: 'Dashboard', icon: 'fa-chart-line', section: 'core', match: 'exact' },
  { to: '/admin/appointments', label: 'Appointments', icon: 'fa-calendar-check', section: 'core' },
  { to: '/admin/booking-settings', label: 'Booking', icon: 'fa-puzzle-piece', section: 'core' },
  { to: '/admin/zoom', label: 'Zoom Meetings', icon: 'fa-video', section: 'core' },
  { to: '/admin/emergency', label: 'Emergency', icon: 'fa-truck-medical', section: 'core' },
  { to: '/admin/support', label: 'Support Centre', icon: 'fa-life-ring', section: 'core' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-pie', section: 'core' },
  { to: '/admin/logs', label: 'Audit Logs', icon: 'fa-clipboard-list', section: 'core' },

  // Network Hub
  { to: '/admin/users', label: 'Users', icon: 'fa-users', section: 'network' },
  { to: '/admin/clinics', label: 'Clinics', icon: 'fa-hospital', section: 'network' },
  { to: '/admin/calendar', label: 'Doctor Calendar', icon: 'fa-calendar-days', section: 'network' },
  { to: '/admin/appointment-requests', label: 'Doctor Changes', icon: 'fa-user-doctor', section: 'network' },
  { to: '/admin/search', label: 'Advanced Search', icon: 'fa-magnifying-glass-plus', section: 'network' },
  { to: '/admin/locations', label: 'States & Cities', icon: 'fa-map-location-dot', section: 'network' },

  // Clinical & Content
  { to: '/admin/conditions', label: 'Conditions', icon: 'fa-notes-medical', section: 'content' },
  { to: '/admin/treatments', label: 'Treatments', icon: 'fa-hand-holding-medical', section: 'content' },
  { to: '/admin/exercises', label: 'Exercises', icon: 'fa-dumbbell', section: 'content' },
  { to: '/admin/pain-selection', label: 'Pain map', icon: 'fa-bullseye', section: 'content' },
  { to: '/admin/physiofeed', label: 'PhysioFeed', icon: 'fa-rss', section: 'content' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'fa-star', section: 'content' },
  { to: '/admin/about', label: 'About Us', icon: 'fa-building', section: 'content' },

  // Finance & Promos
  { to: '/admin/treatment-packages', label: 'Platform Packages', icon: 'fa-box-open', section: 'finance_promos' },
  { to: '/admin/doctor-packages', label: 'Doctor Packages', icon: 'fa-boxes-stacked', section: 'finance_promos' },
  { to: '/admin/billing', label: 'Billing', icon: 'fa-file-invoice-dollar', section: 'finance_promos' },
  { to: '/admin/wallet', label: 'Wallet', icon: 'fa-wallet', section: 'finance_promos' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'fa-tag', section: 'finance_promos' },
  { to: '/admin/invoice-settings', label: 'Invoice / GST', icon: 'fa-file-invoice', section: 'finance_promos' },

  // Settings · Marketing
  { to: '/admin/seo', label: 'SEO', icon: 'fa-magnifying-glass-chart', section: 'settings_marketing' },
  { to: '/admin/badges', label: 'Badges', icon: 'fa-award', section: 'settings_marketing' },
  { to: '/admin/home-hero', label: 'Homepage Hero', icon: 'fa-house-medical-circle-check', section: 'settings_marketing' },
  { to: '/admin/home-images', label: 'Homepage Images', icon: 'fa-image', section: 'settings_marketing' },
  { to: '/admin/home-banners', label: 'Homepage Banner', icon: 'fa-images', section: 'settings_marketing' },
  { to: '/admin/testimonials', label: 'Homepage Reviews', icon: 'fa-comment-dots', section: 'settings_marketing' },
  { to: '/admin/contact', label: 'Contact & Footer', icon: 'fa-envelope', section: 'settings_marketing' },

  // Settings · System
  { to: '/admin/notifications', label: 'Notifications', icon: 'fa-bell', section: 'settings_system', notifyKey: true },
  { to: '/admin/notification-settings', label: 'Notification Rules', icon: 'fa-bell-concierge', section: 'settings_system' },
  { to: '/admin/documents', label: 'Documents', icon: 'fa-folder-tree', section: 'settings_system' },
  { to: '/admin/profile', label: 'Profile', icon: 'fa-user-gear', section: 'settings_system' },
  { to: '/', label: 'View Public Site', icon: 'fa-arrow-up-right-from-square', section: 'settings_system' },
];
