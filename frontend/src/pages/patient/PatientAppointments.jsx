import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import InvoiceModal from '../../components/InvoiceModal';
import useAppointmentDeepLink from '../../hooks/useAppointmentDeepLink';
import { appointments } from '../../services/api';
import { clinicLocationText, googleMapsUrl } from '../../utils/locationHelpers';
import {
  completeAppointmentPayment,
  getOnlinePaymentDue,
  handlePaymentError,
  isAwaitingOnlinePayment,
  isInvoiceAvailable,
  hasOfflinePaymentPending,
} from '../../utils/razorpayCheckout';
import {
  STATUS_STYLES,
  TYPE_ICONS,
  formatTime,
  formatType,
} from '../../utils/appointmentListUtils';
import toast from 'react-hot-toast';
import { PATIENT_NAV } from '../../constants/patientNav';
import AppointmentProgressPanel from '../../components/AppointmentProgressPanel';
import AppointmentRequestForm from '../../components/AppointmentRequestForm';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function formatApptDate(d) {
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function matchesFilter(appt, filter) {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return ['pending', 'confirmed'].includes(appt.status);
  if (filter === 'completed') return appt.status === 'completed';
  if (filter === 'cancelled') return ['cancelled', 'rejected'].includes(appt.status);
  return true;
}

export default function PatientAppointments() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [payingId, setPayingId] = useState(null);
  const [invoiceApptId, setInvoiceApptId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    appointments
      .list()
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message || 'Could not load appointments'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      [...list]
        .filter((a) => matchesFilter(a, filter))
        .sort((a, b) => `${b.appointment_date}${b.start_time}`.localeCompare(`${a.appointment_date}${a.start_time}`)),
    [list, filter]
  );

  const highlightId = useAppointmentDeepLink(list);

  useEffect(() => {
    if (!highlightId || !list.length) return;
    const match = list.find((a) => a.id === highlightId);
    if (match && !matchesFilter(match, filter)) {
      setFilter('all');
    }
  }, [highlightId, list, filter]);

  const counts = useMemo(
    () => ({
      all: list.length,
      upcoming: list.filter((a) => matchesFilter(a, 'upcoming')).length,
      completed: list.filter((a) => matchesFilter(a, 'completed')).length,
      cancelled: list.filter((a) => matchesFilter(a, 'cancelled')).length,
    }),
    [list]
  );

  const handleCompletePayment = async (appt) => {
    setPayingId(appt.id);
    try {
      await completeAppointmentPayment(appt.id);
      toast.success('Payment received — booking confirmed!');
      load();
    } catch (err) {
      handlePaymentError(err);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-600 text-sm mt-1">View, pay, and join your scheduled sessions.</p>
        </div>
        <Link to="/book" className="btn-primary inline-flex items-center justify-center gap-2 text-sm shrink-0">
          <FaIcon icon="fa-calendar-plus" />
          Book new
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === f.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-white/70 text-slate-600 border border-slate-200 hover:border-primary-300'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-80">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-12 px-6">
          <FaIcon icon="fa-calendar-xmark" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">
            {filter === 'all' ? 'No appointments yet.' : `No ${filter} appointments.`}
          </p>
          <p className="text-sm text-slate-500 mt-1 mb-5">Book online, clinic, or home visit with a verified physio.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Link to="/book" className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
              <FaIcon icon="fa-calendar-plus" />
              Book appointment
            </Link>
            <Link to="/doctors" className="btn-outline inline-flex items-center justify-center gap-2 text-sm">
              <FaIcon icon="fa-user-doctor" />
              Find doctors
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const locText = clinicLocationText(a);
            const mapUrl =
              a.consultation_type === 'clinic'
                ? googleMapsUrl(a.clinic_latitude, a.clinic_longitude) ||
                  googleMapsUrl(a.doctor_latitude, a.doctor_longitude)
                : null;
            const awaitingPay = isAwaitingOnlinePayment(a);
            const dueNow = getOnlinePaymentDue(a);
            const typeIcon = TYPE_ICONS[a.consultation_type] || 'fa-calendar';

            return (
              <article
                key={a.id}
                id={`appt-${a.id}`}
                className={`glass-card !p-4 md:!p-5 border border-white/80 transition-shadow ${
                  highlightId === a.id ? 'ring-2 ring-primary-400 shadow-lg shadow-primary-200/40' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary-500/15 to-orange-500/10 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
                      <FaIcon icon={typeIcon} className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-[11px] font-mono text-primary-700 font-semibold">
                          {a.booking_id || `TUP-L${a.id}`}
                        </p>
                        <span
                          className={`text-[10px] capitalize px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-base md:text-lg">
                        Dr. {a.doctor_first_name} {a.doctor_last_name}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {formatApptDate(a.appointment_date)} · {formatTime(a.start_time)}
                        {a.end_time ? ` – ${formatTime(a.end_time)}` : ''}
                      </p>
                      <p className="text-sm text-slate-500 capitalize mt-1">
                        {formatType(a.consultation_type)} · ₹{Number(a.amount || 0).toLocaleString('en-IN')}
                        {awaitingPay && dueNow != null && (
                          <span className="text-amber-700 font-medium"> · Pay now: ₹{dueNow}</span>
                        )}
                      </p>

                      {awaitingPay && (
                        <p className="text-xs text-amber-800 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                          <FaIcon icon="fa-circle-exclamation" />
                          Payment pending — booking is not confirmed until you pay online.
                        </p>
                      )}
                      {!awaitingPay && hasOfflinePaymentPending(a) && (
                        <p className="text-xs text-emerald-800 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                          <FaIcon icon="fa-wallet" />
                          Balance due at visit.
                        </p>
                      )}
                      {a.pain_type && (
                        <p className="text-sm text-slate-600 mt-2">
                          <FaIcon icon="fa-notes-medical" className="text-primary-500 mr-1" />
                          {a.pain_type}
                        </p>
                      )}
                      {locText && (
                        <div className="mt-3 text-sm bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="font-medium text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                            <FaIcon icon="fa-hospital" className="text-primary-600" />
                            Clinic location
                          </p>
                          <p className="text-slate-600 mt-1">{locText}</p>
                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 text-xs font-semibold inline-flex items-center gap-1 mt-2 hover:underline"
                            >
                              <FaIcon icon="fa-map-location-dot" />
                              Open in Google Maps
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch lg:w-40 shrink-0">
                    {dueNow != null && (
                      <button
                        type="button"
                        disabled={payingId === a.id}
                        onClick={() => handleCompletePayment(a)}
                        className="btn-primary text-sm py-2 px-4 flex-1 lg:flex-none justify-center"
                      >
                        {payingId === a.id ? 'Opening…' : `Pay ₹${dueNow.toLocaleString('en-IN')}`}
                      </button>
                    )}
                    {a.consultation_type === 'online' && a.google_meet_link && a.status === 'confirmed' && (
                      <a
                        href={a.google_meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-sm py-2 px-4 flex-1 lg:flex-none text-center inline-flex items-center justify-center gap-1.5"
                      >
                        <FaIcon icon="fa-video" />
                        Join Meet
                      </a>
                    )}
                    {isInvoiceAvailable(a) && (
                      <button
                        type="button"
                        onClick={() => setInvoiceApptId(a.id)}
                        className="btn-outline text-sm py-2 px-4 flex-1 lg:flex-none justify-center"
                      >
                        Invoice
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(a.status) && (
                      <Link
                        to="/cancellation-help"
                        className="text-xs text-slate-500 hover:text-primary-600 text-center py-1 lg:mt-1"
                      >
                        Need to cancel?
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  <AppointmentProgressPanel appointmentId={a.id} patientView />
                  <AppointmentRequestForm appointment={a} onSubmitted={load} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <InvoiceModal appointmentId={invoiceApptId} open={!!invoiceApptId} onClose={() => setInvoiceApptId(null)} />
    </DashboardLayout>
  );
}
