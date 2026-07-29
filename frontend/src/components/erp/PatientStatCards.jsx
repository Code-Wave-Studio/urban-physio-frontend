import FaIcon from '../FaIcon';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const CARDS = [
  { key: 'first_visit_date',    label: 'First Visit',         icon: 'fa-calendar',       color: 'blue',    fmt: fmt },
  { key: 'last_visit_date',     label: 'Last Visit',          icon: 'fa-clock-rotate-left', color: 'indigo', fmt: fmt },
  { key: 'completed_visits',    label: 'Completed Visits',    icon: 'fa-circle-check',   color: 'green',   fmt: (v) => v ?? '0' },
  { key: 'upcoming_visit',      label: 'Upcoming Visit',      icon: 'fa-calendar-check', color: 'teal',    fmt: fmt },
  { key: 'missed_visits',       label: 'Missed Visits',       icon: 'fa-circle-xmark',   color: 'red',     fmt: (v) => v ?? '0' },
  { key: 'total_visits',        label: 'Total Visits',        icon: 'fa-list-check',     color: 'violet',  fmt: (v) => v ?? '0' },
  { key: 'total_revenue',       label: 'Total Revenue',       icon: 'fa-indian-rupee-sign', color: 'emerald', fmt: money },
  { key: 'outstanding_balance', label: 'Outstanding',         icon: 'fa-triangle-exclamation', color: 'amber', fmt: money },
  { key: 'patient_since',       label: 'Patient Since',       icon: 'fa-user-check',     color: 'sky',     fmt: fmt },
];

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
};

export default function PatientStatCards({ stats = {}, activePackage = null }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon, color, fmt: fmtFn }) => (
        <div key={key} className={`rounded-2xl border p-3 flex flex-col gap-1 ${colorMap[color] || ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaIcon icon={`fa-solid ${icon}`} className="text-sm opacity-70" />
            <span className="text-[10px] uppercase font-semibold opacity-70 leading-none">{label}</span>
          </div>
          <p className="text-base font-bold leading-tight">{fmtFn(stats[key])}</p>
        </div>
      ))}

      {activePackage && (
        <div className="rounded-2xl border p-3 flex flex-col gap-1 bg-purple-50 text-purple-700 border-purple-100 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <FaIcon icon="fa-solid fa-box" className="text-sm opacity-70" />
            <span className="text-[10px] uppercase font-semibold opacity-70 leading-none">Current Package</span>
          </div>
          <p className="text-sm font-bold leading-tight truncate">{activePackage.name}</p>
          <div className="mt-1">
            <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((activePackage.completed_sessions || 0) / Math.max(1, activePackage.total_sessions || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] mt-1 opacity-70">{activePackage.completed_sessions}/{activePackage.total_sessions} sessions</p>
          </div>
        </div>
      )}
    </div>
  );
}
