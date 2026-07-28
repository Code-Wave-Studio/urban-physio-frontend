import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PatientAvatar from '../../components/PatientAvatar';
import { PATIENT_NAV } from '../../constants/patientNav';
import { patientPortal } from '../../services/api';
import { formatTime } from '../../utils/appointmentListUtils';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ConsultCard({ appt, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
        highlight ? 'border-primary-200 bg-primary-50/40' : 'border-slate-100 bg-white/80'
      }`}
    >
      <PatientAvatar
        patient={{ avatar: appt.doctor_avatar, first_name: appt.doctor_name }}
        size="lg"
        className="!rounded-xl shrink-0 mx-auto sm:mx-0"
      />
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="font-bold text-slate-900">Dr. {appt.doctor_name}</p>
        {appt.specialization && <p className="text-xs text-primary-600 font-medium">{appt.specialization}</p>}
        <p className="text-sm text-slate-600 mt-1">
          <FaIcon icon="fa-calendar" className="mr-1.5 text-slate-400" />
          {fmtDate(appt.appointment_date)} · {formatTime(appt.start_time)}
          {appt.end_time ? ` – ${formatTime(appt.end_time)}` : ''}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{appt.booking_id}</p>
      </div>
      <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
        <span
          className={`text-[11px] capitalize px-2.5 py-1 rounded-full border self-center sm:self-end ${
            appt.status === 'confirmed'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : appt.status === 'completed'
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : appt.status === 'cancelled' || appt.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {appt.status}
        </span>
        {(appt.zoom_status || appt.google_meet_link || appt.zoom_join_url) && (
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 self-center sm:self-end">
            Zoom · {appt.zoom_status || (appt.can_join ? 'ready' : 'scheduled')}
          </span>
        )}
        {appt.status === 'confirmed' || appt.can_join ? (
          <Link
            to={`/patient/consultation/${appt.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-2"
          >
            <FaIcon icon="fa-video" /> {appt.can_join ? 'Enter Consultation' : 'Open Room'}
          </Link>
        ) : appt.status === 'pending' ? (
          <span className="text-xs text-amber-600">Awaiting confirmation</span>
        ) : appt.status === 'completed' ? (
          <Link
            to={`/patient/consultation/${appt.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm px-4 py-2 hover:border-primary-300"
          >
            <FaIcon icon="fa-door-open" /> View session
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function PatientVideoConsultations() {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientPortal
      .videoConsultations()
      .then((r) => setData(r.data || { upcoming: [], past: [] }))
      .catch((e) => toast.error(e.message || 'Could not load video consultations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Video Consultation</h1>
          <p className="text-sm text-slate-500 mt-1">Join your online physiotherapy sessions and view past calls.</p>
        </div>
        <Link to="/book" className="btn-primary inline-flex items-center gap-2 text-sm self-start">
          <FaIcon icon="fa-calendar-plus" /> Book online consult
        </Link>
      </div>

      {loading ? (
        <div className="glass-card p-10 text-center text-slate-400">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-clock" className="text-primary-600" />
              Upcoming ({data.upcoming.length})
            </h2>
            {data.upcoming.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-400">
                <FaIcon icon="fa-video-slash" className="text-3xl mb-2" />
                <p className="text-sm">No upcoming online consultations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcoming.map((a) => (
                  <ConsultCard key={a.id} appt={a} highlight />
                ))}
              </div>
            )}
          </section>

          {data.past.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FaIcon icon="fa-clock-rotate-left" className="text-slate-500" />
                Past consultations
              </h2>
              <div className="space-y-3">
                {data.past.map((a) => (
                  <ConsultCard key={a.id} appt={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
