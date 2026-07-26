import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { PATIENT_NAV } from '../../constants/patientNav';
import { patientPortal } from '../../services/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function NoteBlock({ label, value, icon, tone = 'text-slate-600' }) {
  if (!value) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1.5">
        <FaIcon icon={icon} className={tone} /> {label}
      </p>
      <p className="text-sm text-slate-700 whitespace-pre-line mt-0.5">{value}</p>
    </div>
  );
}

export default function PatientPrescriptions() {
  const [data, setData] = useState({ prescriptions: [], doctor_notes: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('prescriptions');

  useEffect(() => {
    patientPortal
      .prescriptions()
      .then((r) => setData(r.data || { prescriptions: [], doctor_notes: [] }))
      .catch((e) => toast.error(e.message || 'Could not load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  const prescriptions = data.prescriptions || [];
  const notes = data.doctor_notes || [];

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Prescription & Doctor Notes</h1>
        <p className="text-sm text-slate-500 mt-1">Your exercise prescriptions, diagnosis notes and session-wise clinical notes.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('prescriptions')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition ${
            tab === 'prescriptions' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
          }`}
        >
          <FaIcon icon="fa-file-prescription" className="mr-1.5" /> Prescriptions ({prescriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition ${
            tab === 'notes' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
          }`}
        >
          <FaIcon icon="fa-notes-medical" className="mr-1.5" /> Doctor Notes ({notes.length})
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-10 text-center text-slate-400">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
        </div>
      ) : tab === 'prescriptions' ? (
        prescriptions.length === 0 ? (
          <div className="glass-card p-10 text-center text-slate-400">
            <FaIcon icon="fa-file-prescription" className="text-3xl mb-2" />
            <p className="text-sm">No prescriptions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p) => (
              <div key={p.id} className="glass-card !p-4 md:!p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.title || 'Exercise plan'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dr. {p.doctor_name || '—'}
                      {p.week_number ? ` · Week ${p.week_number}` : ''} · {fmtDate(p.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] capitalize px-2 py-0.5 rounded-full border ${
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                      {p.item_count} exercise{Number(p.item_count) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <NoteBlock label="Diagnosis" value={p.diagnosis_notes} icon="fa-stethoscope" tone="text-rose-500" />
                <NoteBlock label="Therapist notes" value={p.therapist_notes} icon="fa-user-nurse" tone="text-primary-600" />
                <div className="mt-3">
                  <Link
                    to="/patient/exercises"
                    className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-semibold text-xs"
                  >
                    <FaIcon icon="fa-dumbbell" /> View & log exercises
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : notes.length === 0 ? (
        <div className="glass-card p-10 text-center text-slate-400">
          <FaIcon icon="fa-notes-medical" className="text-3xl mb-2" />
          <p className="text-sm">No doctor notes recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="glass-card !p-4 md:!p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-slate-900">
                  Session {n.session_number} · {fmtDate(n.visit_date)}
                </h3>
                <div className="flex items-center gap-2">
                  {n.pain_score != null && (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
                      Pain {n.pain_score}/10
                    </span>
                  )}
                  <span className="text-xs text-slate-500">Dr. {n.doctor_name || '—'}</span>
                </div>
              </div>
              <NoteBlock label="Doctor notes" value={n.doctor_notes} icon="fa-user-doctor" tone="text-primary-600" />
              <NoteBlock label="Progress" value={n.progress_notes} icon="fa-arrow-trend-up" tone="text-emerald-600" />
              <NoteBlock label="Techniques" value={n.techniques} icon="fa-hand-holding-medical" tone="text-violet-600" />
              <NoteBlock label="Exercises advised" value={n.exercises} icon="fa-dumbbell" tone="text-amber-600" />
              <NoteBlock label="Medicines" value={n.medicines} icon="fa-pills" tone="text-rose-500" />
              <NoteBlock label="Next visit" value={n.next_visit} icon="fa-calendar-day" tone="text-sky-600" />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
