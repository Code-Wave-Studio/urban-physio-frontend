import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import CustomizableShortcuts from '../dashboard/CustomizableShortcuts';

/**
 * Clinic portal dashboard — Quick Work hub (admin + reception variants).
 */

const ADMIN_GROUPS = [
  {
    id: 'ops',
    title: 'Daily operations',
    blurb: 'Queue, calendar, patients, and collections you check often',
    items: [
      { to: '/clinic-portal/calendar', label: 'Calendar', desc: 'Clinic schedule board', icon: 'fa-calendar-days', tone: 'teal' },
      { to: '/clinic-portal/appointments', label: 'Appointments', desc: 'Bookings & queue', icon: 'fa-calendar-check', tone: 'sky' },
      { to: '/clinic-portal/patients', label: 'Patients', desc: 'Directory & intake', icon: 'fa-users', tone: 'primary' },
      { to: '/clinic-portal/packages', label: 'Packages', desc: 'Enrollments & expiry', icon: 'fa-box-open', tone: 'orange' },
      { to: '/clinic-portal/billing', label: 'Billing', desc: 'Collect payments', icon: 'fa-file-invoice-dollar', tone: 'emerald' },
      { to: '/clinic-portal/invoices', label: 'Invoices', desc: 'GST invoices', icon: 'fa-file-invoice', tone: 'lime' },
    ],
  },
  {
    id: 'clinical',
    title: 'Clinical & rehab',
    blurb: 'Notes, documents, exercises, and protocols',
    items: [
      { to: '/clinic-portal/notes', label: 'Notes', desc: 'Clinic sticky notes', icon: 'fa-note-sticky', tone: 'amber' },
      { to: '/clinic-portal/documents', label: 'Documents', desc: 'Files & consents', icon: 'fa-folder-tree', tone: 'slate' },
      { to: '/clinic-portal/rehab', label: 'Exercise & rehab', desc: 'HEP & library', icon: 'fa-dumbbell', tone: 'rose' },
      { to: '/clinic-portal/settings/assessments', label: 'Assessments', desc: 'Digital forms', icon: 'fa-clipboard-list', tone: 'violet' },
      { to: '/clinic-portal/settings/protocols', label: 'Protocols', desc: 'Treatment plans', icon: 'fa-notes-medical', tone: 'indigo' },
      { to: '/clinic-portal/clinical-library', label: 'Clinical library', desc: 'Shared templates', icon: 'fa-book-medical', tone: 'cyan' },
    ],
  },
  {
    id: 'insights',
    title: 'Reports & growth',
    blurb: 'Analytics, communication, and finance reviews',
    items: [
      { to: '/clinic-portal/reports', label: 'Reports', desc: 'Ops reports', icon: 'fa-chart-column', tone: 'primary' },
      { to: '/clinic-portal/analytics-center', label: 'Analytics Center', desc: 'AI layouts & insights', icon: 'fa-brain', tone: 'fuchsia' },
      { to: '/clinic-portal/communication', label: 'Communication', desc: 'Campaigns & rules', icon: 'fa-comments', tone: 'sky' },
      { to: '/clinic-portal/earnings', label: 'Finance', desc: 'Revenue & credits', icon: 'fa-sack-dollar', tone: 'emerald' },
      { to: '/clinic-portal/back-office', label: 'Back office', desc: 'Inventory & expenses', icon: 'fa-warehouse', tone: 'slate' },
      { to: '/clinic-portal/notifications', label: 'Notifications', desc: 'Inbox alerts', icon: 'fa-bell', tone: 'amber' },
    ],
  },
  {
    id: 'settings',
    title: 'Clinic settings',
    blurb: 'Pages you update when practice details change',
    items: [
      { to: '/clinic-portal/profile', label: 'Clinic profile', desc: 'Public page & details', icon: 'fa-hospital', tone: 'teal' },
      { to: '/clinic-portal/branding', label: 'Branding', desc: 'Logo & colours', icon: 'fa-palette', tone: 'rose' },
      { to: '/clinic-portal/team', label: 'My team', desc: 'Doctors & staff', icon: 'fa-user-group', tone: 'indigo' },
      { to: '/clinic-portal/settings/availability', label: 'Availability', desc: 'Rooms & capacity', icon: 'fa-sliders', tone: 'sky' },
      { to: '/clinic-portal/create-package', label: 'Package catalog', desc: 'Create / edit packs', icon: 'fa-boxes-stacked', tone: 'orange' },
      { to: '/clinic-portal/forms', label: 'Intake forms', desc: 'Registration fields', icon: 'fa-list-check', tone: 'violet' },
      { to: '/clinic-portal/qr', label: 'Clinic QR', desc: 'Walk-in intake QR', icon: 'fa-qrcode', tone: 'primary' },
      { to: '/clinic-portal/notifications/manage', label: 'Notification setup', desc: 'Templates & broadcast', icon: 'fa-bullhorn', tone: 'emerald' },
    ],
  },
];

const RECEPTION_GROUPS = [
  {
    id: 'desk',
    title: 'Front desk essentials',
    blurb: 'What you open most during the day',
    items: [
      { to: '/clinic-portal/appointments', label: "Today's queue", desc: 'Check-in & status', icon: 'fa-list-ol', tone: 'teal' },
      { to: '/clinic-portal/calendar', label: 'Calendar', desc: 'Day / week board', icon: 'fa-calendar-days', tone: 'sky' },
      { to: '/clinic-portal/patients', label: 'Patients', desc: 'Register & search', icon: 'fa-user-plus', tone: 'primary' },
      { to: '/clinic-portal/billing', label: 'Billing', desc: 'Collect payments', icon: 'fa-file-invoice-dollar', tone: 'emerald' },
      { to: '/clinic-portal/invoices', label: 'Invoices', desc: 'Print / share bills', icon: 'fa-file-invoice', tone: 'lime' },
      { to: '/clinic-portal/packages', label: 'Packages', desc: 'Sessions left', icon: 'fa-box-open', tone: 'orange' },
    ],
  },
  {
    id: 'follow',
    title: 'Follow-up & files',
    blurb: 'Notes, documents, and patient outreach',
    items: [
      { to: '/clinic-portal/notes', label: 'Notes', desc: 'Desk reminders', icon: 'fa-note-sticky', tone: 'amber' },
      { to: '/clinic-portal/documents', label: 'Documents', desc: 'Consents & uploads', icon: 'fa-folder-tree', tone: 'slate' },
      { to: '/clinic-portal/communication', label: 'Communication', desc: 'Messages & campaigns', icon: 'fa-comments', tone: 'sky' },
      { to: '/clinic-portal/notifications', label: 'Notifications', desc: 'Alerts inbox', icon: 'fa-bell', tone: 'rose' },
      { to: '/clinic-portal/reports', label: 'Reports', desc: 'Daily summaries', icon: 'fa-chart-column', tone: 'violet' },
      { to: '/clinic-portal/qr', label: 'Clinic QR', desc: 'Walk-in registration', icon: 'fa-qrcode', tone: 'primary' },
    ],
  },
];

const TONE = {
  teal: { grad: 'from-teal-500 to-teal-700', text: 'text-teal-700', soft: 'bg-teal-50', border: 'border-teal-100' },
  sky: { grad: 'from-sky-500 to-sky-700', text: 'text-sky-700', soft: 'bg-sky-50', border: 'border-sky-100' },
  indigo: { grad: 'from-indigo-500 to-indigo-700', text: 'text-indigo-700', soft: 'bg-indigo-50', border: 'border-indigo-100' },
  violet: { grad: 'from-violet-500 to-violet-700', text: 'text-violet-700', soft: 'bg-violet-50', border: 'border-violet-100' },
  primary: { grad: 'from-primary-500 to-primary-700', text: 'text-primary-700', soft: 'bg-primary-50', border: 'border-primary-100' },
  rose: { grad: 'from-rose-500 to-rose-700', text: 'text-rose-700', soft: 'bg-rose-50', border: 'border-rose-100' },
  amber: { grad: 'from-amber-500 to-orange-600', text: 'text-amber-800', soft: 'bg-amber-50', border: 'border-amber-100' },
  slate: { grad: 'from-slate-500 to-slate-700', text: 'text-slate-700', soft: 'bg-slate-100', border: 'border-slate-200' },
  emerald: { grad: 'from-emerald-500 to-emerald-700', text: 'text-emerald-700', soft: 'bg-emerald-50', border: 'border-emerald-100' },
  cyan: { grad: 'from-cyan-500 to-cyan-700', text: 'text-cyan-700', soft: 'bg-cyan-50', border: 'border-cyan-100' },
  orange: { grad: 'from-orange-500 to-orange-700', text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-100' },
  lime: { grad: 'from-lime-600 to-green-700', text: 'text-lime-800', soft: 'bg-lime-50', border: 'border-lime-100' },
  fuchsia: { grad: 'from-fuchsia-500 to-fuchsia-700', text: 'text-fuchsia-700', soft: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
};

function WorkCard({ item }) {
  const tone = TONE[item.tone] || TONE.primary;
  return (
    <Link
      to={item.to}
      className={`group relative flex flex-col rounded-2xl border ${tone.border} bg-white/90 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-emerald-200/70 transition-all active:scale-[0.99] min-h-[7.5rem] sm:min-h-[8rem]`}
    >
      <span
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${tone.grad} text-white flex items-center justify-center shadow-sm mb-2.5 sm:mb-3`}
      >
        <FaIcon icon={item.icon} className="text-sm sm:text-base" />
      </span>
      <p className="font-bold text-sm sm:text-[0.95rem] text-slate-900 leading-snug group-hover:text-emerald-700">
        {item.label}
      </p>
      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2 flex-1">{item.desc}</p>
      <span className={`mt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold ${tone.text}`}>
        Open
        <FaIcon icon="fa-arrow-right" className="text-[9px] opacity-70 group-hover:translate-x-0.5 transition-transform" />
      </span>
      <span
        className={`pointer-events-none absolute inset-0 rounded-2xl ${tone.soft} opacity-0 group-hover:opacity-40 transition-opacity`}
      />
    </Link>
  );
}
 
export default function ClinicQuickWork({ variant = 'admin', onPlaceAtTopChange = null }) {
  const isAdmin = variant === 'admin';
  const groups = isAdmin ? ADMIN_GROUPS : RECEPTION_GROUPS;

  return (
    <section className="mt-6 sm:mt-8 md:mt-10" aria-labelledby="clinic-quick-work-heading">
      <CustomizableShortcuts
        storageKey={isAdmin ? 'clinic_admin' : 'clinic_reception'}
        badge={isAdmin ? 'ADMIN WORKSPACE' : 'FRONT-DESK WORKSPACE'}
        title="Quick Work"
        subtitle={
          isAdmin
            ? 'Jump to pages you check and update often — ops, clinical tools, reports, and settings.'
            : 'Jump to pages you use all day — queue, patients, billing, notes, and follow-ups.'
        }
        groups={groups}
        onPlaceAtTopChange={onPlaceAtTopChange}
      />
    </section>
  );
}
