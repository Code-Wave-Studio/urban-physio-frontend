import FaIcon from '../FaIcon';
import { todayOpenStatus } from '../../utils/clinicProfileUtils';

/**
 * Real-time open / closed status from opening hours.
 */
export default function ClinicStatusBadge({ hours, className = '', prominent = false }) {
  const status = todayOpenStatus(hours);
  const open = status.open;

  if (prominent) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm ${
          open ? 'bg-emerald-500/95 text-white' : 'bg-red-500/95 text-white'
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full bg-white ${open ? 'animate-pulse' : ''}`} aria-hidden />
        {open ? 'Open Now' : 'Closed'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
        open
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {open ? 'Open Now' : 'Closed'}
    </span>
  );
}

export function ClinicStatusDetail({ hours, className = '' }) {
  const status = todayOpenStatus(hours);
  return (
    <p
      className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
        status.open ? 'text-emerald-700' : 'text-red-600'
      } ${className}`}
    >
      <FaIcon icon={status.open ? 'fa-circle-check' : 'fa-clock'} className="shrink-0" />
      {status.text}
    </p>
  );
}
