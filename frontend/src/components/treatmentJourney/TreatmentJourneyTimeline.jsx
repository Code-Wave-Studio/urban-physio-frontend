import FaIcon from '../FaIcon';

export function formatVisitDate(d) {
  if (!d) return '—';
  const raw = String(d).includes('T') ? d : `${d}T12:00:00`;
  return new Date(raw).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatVisitTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return '';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function painColor(score) {
  if (score === null || score === undefined) return 'bg-slate-100 text-slate-500';
  if (score <= 3) return 'bg-emerald-100 text-emerald-800';
  if (score <= 6) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <FaIcon icon={icon} className="text-teal-600 mt-0.5 shrink-0 w-4 text-center" />
      <div className="min-w-0">
        <span className="font-medium text-slate-700">{label}: </span>
        <span className="text-slate-600 whitespace-pre-line break-words">{value}</span>
      </div>
    </div>
  );
}

/** First vs latest session comparison panel. */
export function JourneyCompareSummary({ summary }) {
  if (!summary || !summary.first || summary.total_sessions < 2) return null;
  const { first, latest, pain_change: painChange } = summary;

  const painBadge = (score) =>
    score === null || score === undefined ? '—' : `${score}/10`;

  return (
    <div className="glass-card !p-5">
      <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <FaIcon icon="fa-chart-line" className="text-teal-600" />
        Progress: first visit vs latest
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Session {first.session_number} · {formatVisitDate(first.visit_date)} (initial)
          </p>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <p>
              Pain:{' '}
              <span className={`px-2 py-0.5 rounded font-semibold ${painColor(first.pain_score)}`}>
                {painBadge(first.pain_score)}
              </span>
            </p>
            {first.rom && <p>ROM: {first.rom}</p>}
            {first.muscle_strength && <p>Strength: {first.muscle_strength}</p>}
          </div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
          <p className="text-[11px] uppercase tracking-wide text-teal-700 font-semibold">
            Session {latest.session_number} · {formatVisitDate(latest.visit_date)} (latest)
          </p>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <p>
              Pain:{' '}
              <span className={`px-2 py-0.5 rounded font-semibold ${painColor(latest.pain_score)}`}>
                {painBadge(latest.pain_score)}
              </span>
              {painChange !== null && painChange !== undefined && (
                <span
                  className={`ml-2 text-xs font-bold ${
                    painChange < 0 ? 'text-emerald-700' : painChange > 0 ? 'text-rose-700' : 'text-slate-500'
                  }`}
                >
                  {painChange < 0 ? `▼ ${Math.abs(painChange)} improved` : painChange > 0 ? `▲ ${painChange} worse` : 'no change'}
                </span>
              )}
            </p>
            {latest.rom && <p>ROM: {latest.rom}</p>}
            {latest.muscle_strength && <p>Strength: {latest.muscle_strength}</p>}
            {latest.progress_notes && (
              <p className="text-teal-800 font-medium mt-1">{latest.progress_notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card/timeline UI for treatment sessions (chronological).
 * @param {{
 *   sessions: object[],
 *   canEdit?: boolean,
 *   editableDoctorId?: number | null,
 *   onEdit?: (session: object) => void,
 *   onDelete?: (session: object) => void,
 * }} props
 */
export default function TreatmentJourneyTimeline({
  sessions,
  canEdit = false,
  editableDoctorId = null,
  onEdit,
  onDelete,
}) {
  if (!sessions?.length) {
    return (
      <div className="glass-card text-center py-14 text-slate-500">
        <FaIcon icon="fa-notes-medical" className="text-3xl text-slate-300 mb-3" />
        <p>No treatment sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative border-s-2 border-teal-200 ml-3 sm:ml-4 space-y-5">
      {sessions.map((s) => {
        const editable =
          canEdit && (editableDoctorId === null || Number(s.doctor_id) === Number(editableDoctorId));
        return (
          <li key={s.id} className="ms-5 sm:ms-6 relative">
            <span className="absolute -start-[31px] sm:-start-[35px] top-4 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold ring-4 ring-white">
              {s.session_number}
            </span>

            <div className="glass-card !p-4 sm:!p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">
                    Session {s.session_number}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      {formatVisitDate(s.visit_date)}
                      {s.visit_time ? ` · ${formatVisitTime(s.visit_time)}` : ''}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dr. {s.doctor_first_name} {s.doctor_last_name}
                    {s.doctor_specialization ? ` · ${s.doctor_specialization}` : ''}
                    {s.clinic_name ? ` · ${s.clinic_name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.pain_score !== null && s.pain_score !== undefined && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${painColor(s.pain_score)}`}>
                      Pain {s.pain_score}/10
                    </span>
                  )}
                  {editable && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit?.(s)}
                        className="btn-outline !py-1.5 !px-2.5 text-xs"
                        title="Edit session"
                      >
                        <FaIcon icon="fa-pen" />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(s)}
                          className="btn-outline !py-1.5 !px-2.5 text-xs text-rose-600 border-rose-200"
                          title="Delete session"
                        >
                          <FaIcon icon="fa-trash" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {(s.rom || s.muscle_strength) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.rom && (
                    <span className="text-xs bg-sky-50 text-sky-800 border border-sky-100 px-2.5 py-1 rounded-full">
                      ROM: {s.rom}
                    </span>
                  )}
                  {s.muscle_strength && (
                    <span className="text-xs bg-violet-50 text-violet-800 border border-violet-100 px-2.5 py-1 rounded-full">
                      Strength: {s.muscle_strength}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-2">
                <DetailRow icon="fa-hand-holding-medical" label="Techniques" value={s.techniques} />
                <DetailRow icon="fa-person-running" label="Exercises" value={s.exercises} />
                <DetailRow icon="fa-pills" label="Medicines" value={s.medicines} />
                <DetailRow icon="fa-notes-medical" label="Doctor notes" value={s.doctor_notes} />
                <DetailRow icon="fa-arrow-trend-up" label="Progress" value={s.progress_notes} />
                <DetailRow icon="fa-calendar-plus" label="Next visit" value={s.next_visit} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
