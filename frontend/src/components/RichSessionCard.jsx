import FaIcon from './FaIcon';

const STATUS_STYLES = {
  scheduled: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-700',
  missed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-rose-50 text-rose-700',
};

function Chip({ icon, children }) {
  if (!children && children !== 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
      {icon && <FaIcon icon={icon} className="text-[10px] text-teal-600" />}
      {children}
    </span>
  );
}

/**
 * PDF-style rich session card: physios, mode, token, bed/room, payment, SOAP snippet.
 */
export default function RichSessionCard({
  session,
  index,
  canEdit = false,
  updating = false,
  noteDraft = '',
  onNoteChange,
  onComplete,
}) {
  const number = session.session_number ?? index + 1;
  const status = session.status || session.appt_status || 'scheduled';
  const date = session.scheduled_date || session.appointment_date || 'Date TBD';
  const time = session.start_time ? String(session.start_time).slice(0, 5) : null;
  const mode = session.mode || session.consultation_type;
  const soap = session.soap || {};
  const soapBits = [soap.subjective, soap.objective, soap.assessment, soap.plan]
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter(Boolean);

  return (
    <article className="rounded-2xl border border-slate-150 bg-white/80 p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">Session {number}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {date}{time ? ` · ${time}` : ''}
            {session.booking_id ? ` · ${session.booking_id}` : ''}
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || STATUS_STYLES.scheduled}`}>
          {String(status).replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip icon="fa-stethoscope">{session.assessing_physio ? `Assessing: ${session.assessing_physio}` : null}</Chip>
        <Chip icon="fa-user-doctor">{session.treating_physio ? `Treating: ${session.treating_physio}` : null}</Chip>
        <Chip icon="fa-house-medical">{mode ? String(mode).replace(/_/g, ' ') : null}</Chip>
        <Chip icon="fa-ticket">{session.token_number != null ? `Token #${session.token_number}` : null}</Chip>
        <Chip icon="fa-bed">{session.bed_id ? `Bed ${session.bed_id}` : null}</Chip>
        <Chip icon="fa-door-open">{session.room_id ? `Room ${session.room_id}` : null}</Chip>
        <Chip icon="fa-indian-rupee-sign">
          {session.amount != null ? `₹${Number(session.amount).toLocaleString('en-IN')}` : null}
          {session.payment_status ? ` · ${session.payment_status}` : null}
        </Chip>
        <Chip icon="fa-hourglass-half">{session.waiting_status}</Chip>
      </div>

      {(session.session_notes || session.notes || session.symptoms) && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          {session.session_notes || session.notes || session.symptoms}
        </p>
      )}

      {soapBits.length > 0 && (
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide font-bold text-teal-700 mb-1">SOAP</p>
          <p className="text-xs text-slate-700 line-clamp-3">{soapBits.join(' · ')}</p>
        </div>
      )}

      {canEdit && status === 'scheduled' && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <input
            className="input-field text-xs py-1.5 px-2 flex-1 min-w-[140px]"
            placeholder="Session notes"
            value={noteDraft}
            onChange={(e) => onNoteChange?.(e.target.value)}
          />
          <button
            type="button"
            disabled={updating}
            onClick={() => onComplete?.(number)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {updating ? 'Saving…' : 'Mark complete'}
          </button>
        </div>
      )}
    </article>
  );
}
