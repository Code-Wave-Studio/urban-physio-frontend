import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import FaIcon from '../../components/FaIcon';
import { PATIENT_NAV } from '../../constants/patientNav';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import { teleRehab } from '../../services/api';
import { useTeleRehabPageName } from '../../hooks/useTeleRehabPageName';
import { formatTime } from '../../utils/appointmentListUtils';
import {
  consultationHref,
  countText,
  dashboardViewState,
  metricText,
  sectionVisible,
} from './teleRehabDashboardModel';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status) {
  if (status === 'confirmed' || status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'cancelled' || status === 'rejected' || status === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function Metric({ label, value, digits = 0 }) {
  const text = metricText(value, digits);
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 truncate">{text === null ? 'Not recorded' : text}</p>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  const text = countText(value);
  return (
    <div className="glass-card !p-3 sm:!p-4 h-full border border-white/80">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
          <FaIcon icon={icon} className="text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">{text === null ? '—' : text}</p>
          {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyBlock({ icon, title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center">
      <FaIcon icon={icon} className="text-2xl text-slate-300" />
      <p className="mt-2 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">{body}</p>
    </div>
  );
}

function Section({ title, icon, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FaIcon icon={icon} className="text-primary-600" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SessionCard({ session, links, showPatient }) {
  const href = consultationHref(links, session.id);
  return (
    <article className="rounded-2xl border border-slate-100 bg-white/80 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="font-semibold text-slate-900 truncate">
          {showPatient ? (session.patient_name || 'Patient') : (session.doctor_name ? `Dr. ${session.doctor_name}` : 'Online session')}
        </p>
        <p className="text-sm text-slate-600 mt-1">
          {formatDate(session.appointment_date)}
          {session.start_time ? ` · ${formatTime(session.start_time)}` : ''}
          {session.end_time ? ` – ${formatTime(session.end_time)}` : ''}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {session.clinic_name || 'Online'}
          {session.booking_id ? ` · ${session.booking_id}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
        <span className={`text-[11px] capitalize px-2.5 py-1 rounded-full border self-center sm:self-end ${statusClass(session.status)}`}>
          {session.status || 'unknown'}
        </span>
        {session.can_join && <span className="text-[10px] text-sky-700 self-center sm:self-end">Join link on file</span>}
        {href ? (
          <Link to={href} className="btn-primary inline-flex items-center justify-center gap-2 text-sm px-4 py-2">
            <FaIcon icon="fa-door-open" /> {session.can_join ? 'Enter consultation' : 'Open room'}
          </Link>
        ) : (
          <span className="text-xs text-slate-400 self-center sm:self-end">Room opens from the existing consultation tools</span>
        )}
      </div>
    </article>
  );
}

function HistoryCard({ session, links, showPatient }) {
  const href = consultationHref(links, session.appointment_id);
  const metrics = session.metrics || {};
  return (
    <article className="rounded-2xl border border-slate-100 bg-white/80 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{session.exercise_name || 'Exercise'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {showPatient && session.patient_name ? `${session.patient_name} · ` : ''}
            {session.prescription_title || 'Rehab plan'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{formatWhen(session.session_at)}</p>
        </div>
        <span className={`text-[11px] capitalize px-2.5 py-1 rounded-full border self-start ${statusClass(session.session_status)}`}>
          {session.session_status || 'unknown'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Score" value={metrics.score} digits={1} />
        <Metric label="Accuracy" value={metrics.accuracy} digits={1} />
        <Metric label="Repetitions" value={metrics.repetitions} />
        <Metric label="Duration (sec)" value={metrics.duration_seconds} />
      </div>
      {href && (
        <Link to={href} className="text-xs font-semibold text-primary-700 hover:underline">
          Open consultation
        </Link>
      )}
    </article>
  );
}

function DashboardBody({ portal, pageName }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    teleRehab
      .dashboard()
      .then((res) => {
        const payload = res?.data ?? res;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          throw { message: 'Invalid dashboard response', status: 500 };
        }
        setData(payload);
      })
      .catch((err) => {
        setData(null);
        setError(err || { message: 'Could not load the Tele-Rehab dashboard' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = `${pageName} dashboard | The Urban Physio`;
    load();
  }, [load, pageName]);

  const state = dashboardViewState({ loading, error, data });
  const showHeader = portal !== 'clinic';

  if (state === 'loading') {
    return (
      <div className="glass-card p-10 text-center text-slate-400" role="status">
        <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
        <p className="mt-3 text-sm">Loading {pageName}</p>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="glass-card p-8 sm:p-10 text-center" role="alert">
        <FaIcon icon="fa-lock" className="text-3xl text-slate-400" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          {error?.message || 'You do not have access to this Tele-Rehab dashboard.'}
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="glass-card p-8 sm:p-10 text-center" role="alert">
        <FaIcon icon="fa-triangle-exclamation" className="text-3xl text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          {error?.message || 'The Tele-Rehab dashboard could not be loaded.'}
        </p>
        <button type="button" onClick={load} className="btn-primary mt-4 inline-flex items-center gap-2">
          <FaIcon icon="fa-rotate-right" /> Try again
        </button>
      </div>
    );
  }

  const counts = data.counts || {};
  const permissions = data.permissions || {};
  const links = data.links || {};
  const isPatient = data.role === 'patient';
  const showPatientNames = !isPatient;
  const ai = data.progress?.ai;
  const limitations = Array.isArray(data.limitations) ? data.limitations : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {showHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-600">Tele-Rehab</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">{pageName}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {data.scope?.clinic_name
                ? `Clinic: ${data.scope.clinic_name}`
                : isPatient
                  ? 'Your online sessions, assigned exercises, and stored results.'
                  : 'Online sessions and stored results in your access scope.'}
            </p>
          </div>
          {links.sessions && (
            <Link to={links.sessions} className="btn-outline inline-flex items-center gap-2 text-sm self-start">
              <FaIcon icon="fa-arrow-up-right-from-square" /> Open sessions
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon="fa-clock" label="Upcoming" value={counts.upcoming_sessions} />
        <StatCard icon="fa-clock-rotate-left" label="Earlier sessions" value={counts.recent_sessions} />
        {isPatient ? (
          <StatCard icon="fa-dumbbell" label="Assigned exercises" value={counts.assigned_exercises} />
        ) : (
          <StatCard icon="fa-users" label="Patients in view" value={counts.patients} hint="Recent slice" />
        )}
        <StatCard
          icon="fa-person-walking"
          label="AI sessions"
          value={counts.ai_sessions}
          hint={counts.ai_sessions === null ? 'Not available' : 'Stored only'}
        />
      </div>

      {sectionVisible(permissions, 'sessions') && (
        <Section
          title="Upcoming"
          icon="fa-video"
          action={links.sessions ? <Link to={links.sessions} className="text-xs font-semibold text-primary-700">All video sessions</Link> : null}
        >
          {(data.upcoming_sessions || []).length === 0 ? (
            <EmptyBlock
              icon="fa-video-slash"
              title="No upcoming Tele-Rehab sessions"
              body="Confirmed and pending online visits will show here. Nothing is booked from this screen."
            />
          ) : (
            <div className="space-y-3">
              {data.upcoming_sessions.map((session) => (
                <SessionCard key={session.id} session={session} links={links} showPatient={showPatientNames} />
              ))}
            </div>
          )}
        </Section>
      )}

      {sectionVisible(permissions, 'sessions') && (
        <Section title="Recent sessions" icon="fa-clock-rotate-left">
          {(data.recent_sessions || []).length === 0 ? (
            <EmptyBlock
              icon="fa-calendar"
              title="No earlier online sessions"
              body="Completed, cancelled, and past online visits from your existing appointments appear here."
            />
          ) : (
            <div className="space-y-3">
              {data.recent_sessions.map((session) => (
                <SessionCard key={session.id} session={session} links={links} showPatient={showPatientNames} />
              ))}
            </div>
          )}
        </Section>
      )}

      {sectionVisible(permissions, 'patients') && (
        <Section
          title="Assigned patients"
          icon="fa-users"
          action={links.patients ? <Link to={links.patients} className="text-xs font-semibold text-primary-700">Patient directory</Link> : null}
        >
          {(data.patients || []).length === 0 ? (
            <EmptyBlock
              icon="fa-users"
              title="No Tele-Rehab patients in this view"
              body="Patients appear when they have an online visit, an active rehab plan, or a stored AI session you are allowed to see."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.patients.map((patient) => {
                const href = consultationHref(links, patient.next_session?.id || patient.last_session?.id);
                return (
                  <article key={patient.patient_id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                    <p className="font-semibold text-slate-900 truncate">{patient.patient_name || `Patient #${patient.patient_id}`}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Next: {patient.next_session ? formatDate(patient.next_session.appointment_date) : 'None scheduled'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Last: {patient.last_session ? formatDate(patient.last_session.appointment_date) : 'No earlier online visit in this slice'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      AI sessions: {countText(patient.ai_sessions) === null ? 'Not available' : countText(patient.ai_sessions)}
                    </p>
                    {href && (
                      <Link to={href} className="inline-flex mt-3 text-xs font-semibold text-primary-700">
                        Open consultation
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {sectionVisible(permissions, 'exercises') && (
        <Section
          title={isPatient ? 'Assigned exercises' : 'Active rehab exercises'}
          icon="fa-dumbbell"
          action={links.exercises ? <Link to={links.exercises} className="text-xs font-semibold text-primary-700">Open rehab plans</Link> : null}
        >
          {(data.exercises || []).length === 0 ? (
            <EmptyBlock
              icon="fa-dumbbell"
              title="No active assigned exercises"
              body="Exercises come from existing rehab plans. This dashboard does not add a separate catalogue."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.exercises.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">{item.exercise_name || `Exercise #${item.exercise_id}`}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.prescription_title || 'Rehab plan'}</p>
                  {showPatientNames && item.patient_name && (
                    <p className="text-xs text-slate-500">{item.patient_name}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-2">
                    {item.sets != null ? `${item.sets} sets` : 'Sets not recorded'}
                    {item.reps ? ` · ${item.reps} reps` : ''}
                    {item.frequency ? ` · ${item.frequency}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Completed logs: {item.completed_logs ?? 0}</p>
                </article>
              ))}
            </div>
          )}
        </Section>
      )}

      {isPatient && sectionVisible(permissions, 'exercises') && (
        <Section
          title="Progress"
          icon="fa-chart-line"
          action={links.progress ? <Link to={links.progress} className="text-xs font-semibold text-primary-700">Full progress</Link> : null}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon="fa-list-check" label="Active plans" value={data.progress?.active_plans} />
            <StatCard icon="fa-check" label="Items with logs" value={data.progress?.items_with_completions} />
            <StatCard icon="fa-clipboard-check" label="Completed logs" value={data.progress?.completed_logs} />
            <StatCard icon="fa-video" label="Online visits done" value={data.progress?.online_completed} />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Metric label="Average AI score" value={ai?.average_score} digits={1} />
            <Metric label="Average accuracy" value={ai?.average_accuracy} digits={1} />
            <p className="sm:col-span-2 text-xs text-slate-400">
              Averages use only sessions that stored that metric
              {ai ? ` (${ai.score_sample_count || 0} score, ${ai.accuracy_sample_count || 0} accuracy).` : '. AI summary is not available.'}
            </p>
          </div>
        </Section>
      )}

      {sectionVisible(permissions, 'performance') && (
        <Section title="Session history" icon="fa-chart-line">
          {(data.session_history || []).length === 0 ? (
            <EmptyBlock
              icon="fa-chart-line"
              title="No stored AI sessions"
              body="KinesteX results show up after a monitored exercise is saved. Scores are not estimated when a session has no stored metric."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {data.session_history.map((session) => (
                <HistoryCard key={session.id} session={session} links={links} showPatient={showPatientNames} />
              ))}
            </div>
          )}
        </Section>
      )}

      {limitations.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h2 className="text-sm font-bold text-slate-700">What this dashboard does not fill in</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
            {limitations.map((note) => (
              <li key={`${note.section}-${note.message}`}>{note.message}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function TeleRehabDashboardPage({ portal = 'patient' }) {
  const pageName = useTeleRehabPageName();
  const body = <DashboardBody portal={portal} pageName={pageName} />;

  if (portal === 'clinic') {
    return (
      <ClinicPortalShell title={pageName} subtitle="Tele-Rehab dashboard for this clinic">
        {body}
      </ClinicPortalShell>
    );
  }
  if (portal === 'admin') {
    return <AdminDashboardLayout>{body}</AdminDashboardLayout>;
  }
  return (
    <DashboardLayout links={portal === 'doctor' ? DOCTOR_NAV : PATIENT_NAV} variant={portal === 'doctor' ? 'doctor' : 'patient'}>
      {body}
    </DashboardLayout>
  );
}
