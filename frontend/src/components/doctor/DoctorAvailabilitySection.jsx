import { useState } from 'react';
import FaIcon from '../FaIcon';
import ProfileSlotsPreview from '../profile/ProfileSlotsPreview';
import { formatDoctorAvailabilityRows } from '../../utils/profileUrls';

/**
 * Weekly schedule + bookable dates for doctor profile popups.
 *
 * @param {{ doctor: object, onNavigate?: () => void, variant?: 'default' | 'compact' }} props
 */
export default function DoctorAvailabilitySection({ doctor, onNavigate, variant = 'compact', className = '' }) {
  const compact = variant === 'compact';
  const availabilityRows = formatDoctorAvailabilityRows(doctor?.availability);
  const [hasBookableDates, setHasBookableDates] = useState(null);

  if (!doctor?.id) return null;
  if (!availabilityRows.length && hasBookableDates === false) return null;

  const heading = compact
    ? 'text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2'
    : 'text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2';

  const todayIndex = new Date().getDay();

  return (
    <section className={className}>
      <h3 className={heading}>
        <FaIcon icon="fa-calendar-check" className={compact ? 'text-primary-500 text-xs' : 'text-primary-600'} />
        Appointment availability
      </h3>

      {availabilityRows.length > 0 && (
        <ul className="rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 text-sm mb-3">
          {availabilityRows.map((row) => (
            <li
              key={row.dayIndex}
              className={`flex justify-between gap-2 px-3 py-2 ${
                row.dayIndex === todayIndex ? 'bg-primary-50 font-medium' : 'bg-white'
              }`}
            >
              <span className={compact ? 'text-xs' : 'text-sm'}>{row.label}</span>
              <span className={`text-slate-600 text-right ${compact ? 'text-xs' : 'text-sm'}`}>{row.text}</span>
            </li>
          ))}
        </ul>
      )}

      <ProfileSlotsPreview
        doctorId={doctor.id}
        onNavigate={onNavigate}
        compact={compact}
        hideWhenEmpty
        onDatesLoaded={(count) => setHasBookableDates(count > 0)}
      />
    </section>
  );
}
