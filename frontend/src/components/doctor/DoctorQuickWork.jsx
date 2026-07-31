import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

/**
 * Doctor Overview — Quick Work hub.
 * Links to pages doctors check / update often (schedule, clinical, practice).
 */
const QUICK_WORK_GROUPS = [
  {
    id: 'schedule',
    title: 'Schedule & slots',
    blurb: 'Keep your calendar and booking windows current',
    items: [
      {
        to: '/doctor/calendar',
        label: 'Calendar',
        desc: 'Day / week view of sessions',
        icon: 'fa-calendar-days',
        tone: 'teal',
      },
      {
        to: '/doctor/clinic-availability',
        label: 'Availability',
        desc: 'Weekly slots & modes',
        icon: 'fa-clock',
        tone: 'sky',
      },
      {
        to: '/doctor/custom-slots',
        label: 'Custom slots',
        desc: 'One-off open times',
        icon: 'fa-calendar-plus',
        tone: 'indigo',
      },
      {
        to: '/doctor/booking-filters',
        label: 'Booking filters',
        desc: 'Who can book you',
        icon: 'fa-filter',
        tone: 'violet',
      },
    ],
  },
  {
    id: 'clinical',
    title: 'Clinical work',
    blurb: 'Patients, rehab plans, and notes you update regularly',
    items: [
      {
        to: '/doctor/patients',
        label: 'Patients',
        desc: 'History & profiles',
        icon: 'fa-users',
        tone: 'primary',
      },
      {
        to: '/doctor/prescriptions',
        label: 'Rehab plans',
        desc: 'Exercises & HEP',
        icon: 'fa-dumbbell',
        tone: 'rose',
      },
      {
        to: '/doctor/treatment-journey',
        label: 'Treatment journey',
        desc: 'Session progress',
        icon: 'fa-notes-medical',
        tone: 'amber',
      },
      {
        to: '/doctor/documents',
        label: 'Documents',
        desc: 'Files & reports',
        icon: 'fa-folder-tree',
        tone: 'slate',
      },
    ],
  },
  {
    id: 'practice',
    title: 'Practice settings',
    blurb: 'Fees, services, packages, and clinic links',
    items: [
      {
        to: '/doctor/profile',
        label: 'Profile & fees',
        desc: 'Bio, rates, public page',
        icon: 'fa-user-gear',
        tone: 'emerald',
      },
      {
        to: '/doctor/treatment-services',
        label: 'Services',
        desc: 'Treatments you offer',
        icon: 'fa-hand-holding-medical',
        tone: 'cyan',
      },
      {
        to: '/doctor/service-packages',
        label: 'My packages',
        desc: 'Edit package offers',
        icon: 'fa-box-open',
        tone: 'orange',
      },
      {
        to: '/doctor/admin-package-prices',
        label: 'Platform prices',
        desc: 'Your rates on platform packs',
        icon: 'fa-tags',
        tone: 'lime',
      },
      {
        to: '/doctor/clinics',
        label: 'My clinics',
        desc: 'Join / manage clinics',
        icon: 'fa-hospital',
        tone: 'teal',
      },
      {
        to: '/doctor/packages',
        label: 'Enrollments',
        desc: 'Patient package progress',
        icon: 'fa-user-plus',
        tone: 'fuchsia',
      },
    ],
  },
  {
    id: 'inbox',
    title: 'Requests & alerts',
    blurb: 'Things that need a quick check every day',
    items: [
      {
        to: '/doctor/appointments?status=pending',
        label: 'Pending bookings',
        desc: 'Accept or decline',
        icon: 'fa-hourglass-half',
        tone: 'amber',
      },
      {
        to: '/doctor/requests',
        label: 'Reschedule / cancel',
        desc: 'Patient change requests',
        icon: 'fa-inbox',
        tone: 'rose',
      },
      {
        to: '/doctor/notifications',
        label: 'Notifications',
        desc: 'Alerts & updates',
        icon: 'fa-bell',
        tone: 'sky',
      },
      {
        to: '/doctor/emergency',
        label: 'Emergency',
        desc: 'Urgent care requests',
        icon: 'fa-truck-medical',
        tone: 'red',
      },
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
  red: { grad: 'from-red-500 to-red-700', text: 'text-red-700', soft: 'bg-red-50', border: 'border-red-100' },
};

function WorkCard({ item }) {
  const tone = TONE[item.tone] || TONE.primary;

  return (
    <Link
      to={item.to}
      className={`group relative flex flex-col rounded-2xl border ${tone.border} bg-white/90 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-primary-200/70 transition-all active:scale-[0.99] min-h-[7.5rem] sm:min-h-[8rem]`}
    >
      <span
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${tone.grad} text-white flex items-center justify-center shadow-sm mb-2.5 sm:mb-3`}
      >
        <FaIcon icon={item.icon} className="text-sm sm:text-base" />
      </span>
      <p className="font-bold text-sm sm:text-[0.95rem] text-slate-900 leading-snug group-hover:text-primary-700">
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

export default function DoctorQuickWork() {
  return (
    <section className="mt-8 md:mt-10" aria-labelledby="doctor-quick-work-heading">
      <div className="relative overflow-hidden rounded-2xl border border-teal-100/80 bg-gradient-to-br from-teal-50/80 via-white to-slate-50 p-4 sm:p-6 md:p-7 shadow-sm">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-teal-200/20 blur-2xl pointer-events-none" />
        <div className="relative mb-5 sm:mb-6">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-700">Daily workspace</p>
          <h2 id="doctor-quick-work-heading" className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Quick Work
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Jump to pages you check and update often — slots, patients, fees, and requests.
          </p>
        </div>

        <div className="relative space-y-6 sm:space-y-7">
          {QUICK_WORK_GROUPS.map((group) => (
            <div key={group.id}>
              <div className="mb-2.5 sm:mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800">{group.title}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">{group.blurb}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                {group.items.map((item) => (
                  <WorkCard key={`${item.to}-${item.label}`} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
