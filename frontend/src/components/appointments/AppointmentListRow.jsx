import FaIcon from '../FaIcon';
import AppointmentDetailCard from '../AppointmentDetailCard';
import {
  STATUS_STYLES,
  TYPE_ICONS,
  formatTime,
  formatType,
  patientLabel,
} from '../../utils/appointmentListUtils';
import { hasOfflinePaymentPending, isAwaitingOnlinePayment } from '../../utils/razorpayCheckout';
import toast from 'react-hot-toast';

function copyId(id) {
  if (!id) return;
  navigator.clipboard?.writeText(id).then(() => toast.success('Booking ID copied'));
}

/**
 * Collapsible appointment row — compact summary + expandable full details.
 */
export default function AppointmentListRow({
  appt,
  expanded,
  highlighted = false,
  onToggle,
  view,
  onStatusChange,
  onMarkOfflinePayment,
  updating,
}) {
  const isDoctor = view === 'doctor';
  const name = patientLabel(appt);
  const bookingId = appt.booking_id || `TUP-L${appt.id}`;
  const isPending = appt.status === 'pending';
  const awaitingPayment = isAwaitingOnlinePayment(appt);
  const offlinePending = hasOfflinePaymentPending(appt);
  const showDoctorActions = isDoctor && isPending && !awaitingPayment && onStatusChange;

  return (
    <div
      id={`appt-${appt.id}`}
      className={`rounded-2xl border overflow-hidden transition-shadow ${
        highlighted ? 'ring-2 ring-primary-400 shadow-lg shadow-primary-200/40' : ''
      } ${
        isPending
          ? 'border-amber-300/80 bg-amber-50/30 shadow-md shadow-amber-500/5'
          : 'border-white/80 bg-white/40'
      } ${expanded ? 'ring-2 ring-primary-200/60 shadow-lg' : 'hover:shadow-md'}`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left p-4 md:p-5 min-w-0 hover:bg-white/50 transition"
        >
          <div className="flex flex-wrap items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isPending ? 'bg-amber-200/80 text-amber-900' : 'bg-primary-100 text-primary-700'
              }`}
            >
              <FaIcon icon={TYPE_ICONS[appt.consultation_type] || 'fa-calendar-check'} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                  {bookingId}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyId(bookingId);
                  }}
                  className="text-slate-400 hover:text-primary-600 p-0.5"
                  title="Copy booking ID"
                >
                  <FaIcon icon="fa-copy" className="text-xs" />
                </button>
              </div>
              <p className="font-bold text-slate-800 mt-1 truncate">
                {name}
                {!isDoctor && (
                  <span className="font-normal text-slate-500 text-sm">
                    {' '}
                    · Dr. {appt.doctor_first_name} {appt.doctor_last_name}
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                {appt.appointment_date} · {formatTime(appt.start_time)}
                <span className="text-slate-400"> · </span>
                <span className="capitalize">{formatType(appt.consultation_type)}</span>
                {appt.pain_type && (
                  <span className="text-slate-500"> · {appt.pain_type}</span>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`badge border capitalize text-xs ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                {appt.status}
              </span>
              <span className="font-bold text-primary-700 text-sm">
                ₹{Number(appt.amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 px-3 border-l border-white/60 flex items-center justify-center text-slate-500 hover:bg-white/60 hover:text-primary-600 transition"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          <FaIcon icon={expanded ? 'fa-chevron-up' : 'fa-chevron-down'} />
        </button>
      </div>

      {awaitingPayment && (
        <p className="px-4 pb-2 text-xs text-amber-800 bg-amber-50/60 border-t border-amber-200/50">
          Awaiting patient online payment — booking confirms automatically after payment.
        </p>
      )}

      {offlinePending && isDoctor && onMarkOfflinePayment && (
        <div
          className="px-4 pb-3 flex flex-wrap gap-2 border-t border-emerald-200/50 bg-emerald-50/40"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="w-full text-xs text-emerald-900 mb-1">
            Offline payment pending — confirm when patient pays at clinic/home.
          </p>
          <button
            type="button"
            disabled={updating}
            onClick={() => onMarkOfflinePayment(appt.id)}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <FaIcon icon="fa-money-bill-wave" />
            Mark payment received
          </button>
        </div>
      )}

      {showDoctorActions && (
        <div
          className="px-4 pb-3 flex flex-wrap gap-2 border-t border-amber-200/50 bg-amber-50/40"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(appt.id, 'confirmed')}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <FaIcon icon="fa-check" />
            Accept
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(appt.id, 'rejected')}
            className="btn-outline text-xs py-2 px-4 text-red-600 border-red-200"
          >
            Reject
          </button>
        </div>
      )}

      {expanded && (
        <div className="border-t border-white/70 bg-white/30 p-3 md:p-4 animate-slide-up">
          {appt.status === 'confirmed' && appt.google_meet_link && (
            <a
              href={appt.google_meet_link}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2 mb-3"
            >
              <FaIcon icon="fa-video" />
              Join video call
            </a>
          )}
          <AppointmentDetailCard
            appt={appt}
            view={view}
            onStatusChange={onStatusChange}
            onMarkOfflinePayment={onMarkOfflinePayment}
            updating={updating}
            embedded
          />
        </div>
      )}
    </div>
  );
}
