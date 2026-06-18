import FaIcon from './FaIcon';
import { API_BASE } from '../services/api';
import AppointmentProgressPanel from './AppointmentProgressPanel';
import AppointmentRequestForm from './AppointmentRequestForm';
import { hasOfflinePaymentPending, isAwaitingOnlinePayment } from '../utils/razorpayCheckout';
import { clinicLocationText, googleMapsUrl } from '../utils/locationHelpers';
import { STATUS_STYLES, formatTime, formatType } from '../utils/appointmentListUtils';

const PAY_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-violet-50 text-violet-700',
  partial_refund: 'bg-violet-50 text-violet-700',
};

const DOCTOR_STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
const ADMIN_STATUS_OPTIONS = [...DOCTOR_STATUS_OPTIONS, 'no_show'];

function Detail({ label, value, children, className = '' }) {
  const content = children ?? value;
  if (content == null || content === '') return null;
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 break-words">{content}</p>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/50 p-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
        <FaIcon icon={icon} className="text-primary-600 text-xs" />
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

/**
 * @param {{ appt: object, onStatusChange?: (id: number, status: string) => void, updating?: boolean, view?: 'admin' | 'doctor', embedded?: boolean }} props
 */
export default function AppointmentDetailCard({
  appt,
  onStatusChange,
  onMarkOfflinePayment,
  updating,
  view = 'admin',
  embedded = false,
}) {
  const isDoctor = view === 'doctor';
  const meta = appt.booking_meta || {};
  const patientName =
    appt.patient_full_name ||
    [appt.patient_first_name, appt.patient_last_name].filter(Boolean).join(' ') ||
    '—';
  const clinicLoc = clinicLocationText(appt);
  const clinicMap =
    appt.consultation_type === 'clinic'
      ? googleMapsUrl(appt.clinic_latitude, appt.clinic_longitude) ||
        googleMapsUrl(appt.doctor_latitude, appt.doctor_longitude)
      : null;
  const homeMap =
    appt.consultation_type === 'home_visit' && meta.map_latitude != null
      ? googleMapsUrl(meta.map_latitude, meta.map_longitude)
      : null;

  const reportUrl = appt.report_file?.startsWith('http')
    ? appt.report_file
    : appt.report_file
      ? `${API_BASE.replace(/\/api\/?$/, '')}/uploads/reports/${appt.report_file}`
      : null;

  const statusOptions = isDoctor ? DOCTOR_STATUS_OPTIONS : ADMIN_STATUS_OPTIONS;
  const awaitingPayment = isAwaitingOnlinePayment(appt);
  const offlinePending = hasOfflinePaymentPending(appt);
  const metaObj = typeof meta === 'object' ? meta : {};

  return (
    <article className={embedded ? 'space-y-4' : 'glass-card space-y-4'}>
      {!embedded && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/60 pb-4">
            <div>
              <p className="text-xs text-slate-500">
                Booking ID:{' '}
                <span className="font-mono font-bold text-primary-700">{appt.booking_id || `TUP-L${appt.id}`}</span>
              </p>
              {!isDoctor && <p className="text-[10px] text-slate-400 font-mono">Internal #{appt.id}</p>}
              <p className="font-bold text-lg text-slate-800 mt-1">
                {isDoctor ? (
                  patientName
                ) : (
                  <>
                    {patientName}{' '}
                    <span className="text-slate-400 font-normal">→</span> Dr. {appt.doctor_first_name}{' '}
                    {appt.doctor_last_name}
                  </>
                )}
              </p>
              <p className="text-sm text-slate-600 capitalize mt-0.5">
                <FaIcon icon="fa-calendar-day" className="mr-1 text-primary-600" />
                {appt.appointment_date} · {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge border capitalize ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                {appt.status}
              </span>
              <span className={`badge capitalize ${PAY_STYLES[appt.payment_status] || PAY_STYLES.pending}`}>
                {appt.payment_status || 'unpaid'}
              </span>
              <span className="font-bold text-primary-700">₹{Number(appt.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {awaitingPayment && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {isDoctor
                ? 'Patient has not paid online yet. Booking will confirm automatically after payment.'
                : 'Complete online payment to confirm this booking.'}
            </p>
          )}

          {offlinePending && (
            <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {isDoctor ? (
                <>
                  Offline payment due: <strong>₹{Number(metaObj.pay_later_amount || 0).toLocaleString('en-IN')}</strong>
                  {metaObj.pay_later_label ? ` (${metaObj.pay_later_label})` : ''}. Mark received after patient pays.
                </>
              ) : (
                <>
                  Balance <strong>₹{Number(metaObj.pay_later_amount || 0).toLocaleString('en-IN')}</strong> due
                  {metaObj.pay_later_label ? ` — ${metaObj.pay_later_label}` : ''}. Doctor will confirm when paid.
                </>
              )}
            </p>
          )}

          {offlinePending && isDoctor && onMarkOfflinePayment && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onMarkOfflinePayment(appt.id)}
              className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
            >
              <FaIcon icon="fa-money-bill-wave" />
              Mark payment received
            </button>
          )}

          {appt.status === 'pending' && isDoctor && onStatusChange && !awaitingPayment && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => onStatusChange(appt.id, 'confirmed')}
                className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
              >
                <FaIcon icon="fa-check" />
                Accept
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => onStatusChange(appt.id, 'rejected')}
                className="btn-outline text-sm py-2 px-4 text-red-600 border-red-200 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          )}

          {appt.status === 'confirmed' && appt.google_meet_link && (
            <a
              href={appt.google_meet_link}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2 w-fit"
            >
              <FaIcon icon="fa-video" />
              Join video call
            </a>
          )}
        </>
      )}

      {onStatusChange && (
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs font-medium text-slate-600">Update status:</label>
          <select
            className="input-field py-1.5 text-sm max-w-[180px]"
            value={appt.status}
            disabled={updating}
            onChange={(e) => onStatusChange(appt.id, e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      <Section title="Patient details" icon="fa-user">
        <Detail label="Full name" value={patientName} />
        <Detail label="Mobile" value={appt.patient_mobile || appt.patient_account_phone} />
        <Detail label="Email" value={appt.patient_email || appt.patient_account_email} />
        <Detail label="Age" value={appt.patient_age != null ? `${appt.patient_age} years` : null} />
        <Detail label="Gender" value={appt.patient_gender} />
        {!isDoctor && (
          <Detail
            label="Account user"
            value={`${appt.patient_first_name || ''} ${appt.patient_last_name || ''}`.trim()}
          />
        )}
      </Section>

      <Section title={isDoctor ? 'Service details' : 'Doctor & service'} icon="fa-user-doctor">
        {!isDoctor && (
          <Detail label="Doctor" value={`Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}`} />
        )}
        {!isDoctor && <Detail label="Specialization" value={appt.specialization} />}
        <Detail label="Consultation type" value={formatType(appt.consultation_type)} />
        <Detail label="Session type" value={appt.session_type_name || `ID ${appt.session_type_id}`} />
        <Detail
          label="Sessions booked"
          value={appt.number_of_sessions ? `${appt.number_of_sessions} session(s)` : '1'}
        />
        {appt.doctor_address && isDoctor && (
          <Detail label="Your practice address" value={appt.doctor_address} className="sm:col-span-2" />
        )}
        {appt.doctor_address && !isDoctor && (
          <Detail label="Doctor address" value={appt.doctor_address} className="sm:col-span-2" />
        )}
      </Section>

      <Section title="Problem & pain" icon="fa-heart-pulse">
        <Detail label="Pain / problem type" value={appt.pain_type} />
        <Detail
          label="Description"
          value={appt.pain_description || appt.symptoms}
          className="sm:col-span-2 lg:col-span-3"
        />
        {appt.symptoms && appt.symptoms !== appt.pain_description && (
          <Detail label="Symptoms (notes)" value={appt.symptoms} className="sm:col-span-2" />
        )}
        {reportUrl && (
          <Detail label="Medical report">
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              <FaIcon icon="fa-file-medical" />
              View uploaded report
            </a>
          </Detail>
        )}
      </Section>

      {appt.consultation_type === 'online' && (
        <Section title="Online consultation" icon="fa-video">
          <Detail label="Device" value={meta.device_type} />
          <Detail label="Internet quality" value={meta.internet_quality} />
          <Detail label="Preferred language" value={meta.preferred_language} />
          {appt.google_meet_link && (
            <Detail label="Video call" className="sm:col-span-2">
              <a
                href={appt.google_meet_link}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 font-medium hover:underline break-all"
              >
                {appt.google_meet_link}
              </a>
            </Detail>
          )}
        </Section>
      )}

      {appt.consultation_type === 'home_visit' && (
        <Section title="Home visit — patient location" icon="fa-house-medical">
          <Detail label="Full address" value={meta.full_address} className="sm:col-span-2 lg:col-span-3" />
          <Detail label="Landmark" value={meta.landmark} />
          <Detail label="City" value={meta.city} />
          <Detail label="Pincode" value={meta.pincode} />
          <Detail label="Patient condition" value={meta.patient_condition} />
          <Detail label="Special instructions" value={meta.special_instructions} className="sm:col-span-2" />
          {meta.map_latitude != null && (
            <Detail
              label="Map coordinates"
              value={`${Number(meta.map_latitude).toFixed(5)}, ${Number(meta.map_longitude).toFixed(5)}`}
            />
          )}
          {homeMap && (
            <Detail label="Map">
              <a
                href={homeMap}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1"
              >
                <FaIcon icon="fa-map-location-dot" />
                Open on map
              </a>
            </Detail>
          )}
        </Section>
      )}

      {appt.consultation_type === 'clinic' && (
        <Section title="Clinic visit" icon="fa-hospital">
          <Detail label="Clinic" value={appt.clinic_name} />
          <Detail label="Clinic phone" value={appt.clinic_phone} />
          <Detail label="Address" value={appt.clinic_address || clinicLoc} className="sm:col-span-2" />
          <Detail label="First-time visit" value={meta.first_time_visit ? 'Yes' : 'No'} />
          {clinicMap && (
            <Detail label="Clinic map">
              <a
                href={clinicMap}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1"
              >
                <FaIcon icon="fa-map-location-dot" />
                Open on map
              </a>
            </Detail>
          )}
        </Section>
      )}

      <Section title="Payment" icon="fa-credit-card">
        <Detail label="Amount" value={`₹${Number(appt.amount).toLocaleString('en-IN')}`} />
        <Detail label="Payment status" value={appt.payment_status || 'pending'} />
        {!isDoctor && <Detail label="Invoice" value={appt.invoice_number} />}
        {!isDoctor && <Detail label="Razorpay payment ID" value={appt.razorpay_payment_id} />}
        {!isDoctor && <Detail label="Razorpay order ID" value={appt.razorpay_order_id} />}
        <Detail label="Paid at" value={appt.payment_paid_at} />
      </Section>

      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/50">
        {appt.created_at && <span>Booked: {appt.created_at}</span>}
        {appt.updated_at && <span>Updated: {appt.updated_at}</span>}
      </div>

      {(appt.number_of_sessions >= 1) && (
        <AppointmentProgressPanel
          appointmentId={appt.id}
          canEdit={isDoctor || view === 'admin'}
        />
      )}

      {view === 'patient' && (
        <AppointmentRequestForm appointment={appt} />
      )}
    </article>
  );
}
