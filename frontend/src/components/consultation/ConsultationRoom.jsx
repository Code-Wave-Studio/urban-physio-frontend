import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import DocumentsManager from '../documents/DocumentsManager';
import ConsultationChatPanel from './ConsultationChatPanel';
import {
  consultation,
  exercisePrescriptions,
  exercises as exercisesApi,
  treatmentJourney,
  doctors as doctorsApi,
  clinicPortal,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatTime } from '../../utils/appointmentListUtils';

const TABS = [
  { id: 'video', label: 'Video Call', icon: 'fa-video' },
  { id: 'chat', label: 'Chat', icon: 'fa-comments' },
  { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
  { id: 'exercises', label: 'Exercise Explain', icon: 'fa-dumbbell' },
  { id: 'prescription', label: 'Prescription', icon: 'fa-file-prescription' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function youtubeEmbed(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function StatusPill({ join, status }) {
  if (status === 'completed') {
    return <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1">Completed</span>;
  }
  if (status === 'confirmed' && join?.can_join) {
    return <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1">Live · Ready to join</span>;
  }
  if (status === 'confirmed' && join?.is_today) {
    return <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2.5 py-1">Today · Preparing</span>;
  }
  if (status === 'confirmed') {
    return <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold px-2.5 py-1">Confirmed</span>;
  }
  return <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold px-2.5 py-1 capitalize">{status}</span>;
}

/* ---------- Video panel (Zoom — opens in Zoom app / browser) ---------- */
function VideoPanel({ room, canStart, onSessionStarted }) {
  const appt = room.appointment || {};
  const viewer = room.viewer;
  const joinUrl = appt.zoom_join_url || appt.google_meet_link;
  const startUrl = viewer === 'doctor' || viewer === 'admin' ? appt.zoom_start_url : null;
  const hostUrl = startUrl || joinUrl;
  const join = room.join || {};
  const ready = Boolean(canStart && hostUrl);
  const statusLabel = appt.status === 'completed'
    ? 'completed'
    : (appt.zoom_status || (joinUrl ? 'scheduled' : 'pending'));
  const [starting, setStarting] = useState(false);

  let helperText = 'Open Zoom when you are ready. Waiting room is enabled — the host admits participants.';
  if (!joinUrl) {
    if (appt.status === 'pending') {
      helperText = 'Zoom link will appear after the appointment is confirmed.';
    } else if (appt.status === 'confirmed') {
      helperText = 'Zoom meeting is being prepared. Refresh in a moment, or ask admin to regenerate the meeting.';
    } else {
      helperText = join.reason || 'Zoom meeting is not available for this session yet.';
    }
  } else if (appt.status === 'completed') {
    helperText = 'Session marked completed. You can still reopen Zoom if needed. Only the doctor can change appointment status.';
  } else if (join.reason && !ready) {
    helperText = join.reason;
  }

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success('Meeting link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const openZoom = async () => {
    if (!hostUrl || starting) return;
    setStarting(true);
    try {
      if (appt.status === 'confirmed') {
        await consultation.completeSession(appt.id);
        toast.success('Consultation marked completed');
        onSessionStarted?.();
      }
    } catch (err) {
      // Still allow joining Zoom even if auto-complete fails
      toast.error(err.message || 'Could not update session status');
    } finally {
      setStarting(false);
      window.open(hostUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-900 text-white overflow-hidden min-h-[280px] md:min-h-[360px] relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <FaIcon icon="fa-video" className="text-2xl text-primary-300" />
          </div>
          <h3 className="text-lg font-bold">Zoom Video Consultation</h3>
          <p className="text-sm text-slate-300 mt-1 max-w-md">{helperText}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center text-[11px]">
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 capitalize">
              Status · {statusLabel}
            </span>
            {appt.zoom_meeting_id && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                ID · {appt.zoom_meeting_id}
              </span>
            )}
            {appt.zoom_password && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                Password · {appt.zoom_password}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-5 justify-center">
            {ready ? (
              <>
                <button
                  type="button"
                  disabled={starting}
                  onClick={openZoom}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm px-4 py-2.5 disabled:opacity-60"
                >
                  <FaIcon icon={starting ? 'fa-spinner' : 'fa-play'} className={starting ? 'fa-spin' : undefined} />
                  {startUrl ? 'Start Zoom meeting' : 'Join Zoom meeting'}
                </button>
                {joinUrl && (
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5"
                  >
                    <FaIcon icon="fa-copy" /> Copy join link
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Appointment</p>
          <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(room.appointment?.appointment_date)}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {formatTime(room.appointment?.start_time)}
            {room.appointment?.end_time ? ` – ${formatTime(room.appointment.end_time)}` : ''}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Patient</p>
          <p className="font-semibold text-slate-800 mt-0.5">
            {room.patient?.first_name} {room.patient?.last_name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Doctor</p>
          <p className="font-semibold text-slate-800 mt-0.5">
            Dr. {room.doctor?.first_name} {room.doctor?.last_name}
          </p>
          {room.doctor?.specialization && <p className="text-xs text-primary-600 mt-0.5">{room.doctor.specialization}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Exercise panel ---------- */
function ExercisePanel({ room, onReload }) {
  const isDoctor = room.permissions?.can_prescribe;
  const [library, setLibrary] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: 'Home exercise plan',
    diagnosis_notes: '',
    therapist_notes: '',
    start_date: new Date().toISOString().slice(0, 10),
    exercises: [{ exercise_id: '', sets: 3, reps: '10', frequency: 'Daily', special_instructions: '' }],
  });

  const plans = room.exercise_plans || [];

  useEffect(() => {
    if (isDoctor) {
      exercisesApi.list().then((r) => setLibrary(r.data || [])).catch(() => {});
    }
  }, [isDoctor]);

  useEffect(() => {
    if (!selectedPlanId && plans.length) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const loadDetail = useCallback(
    (id) => {
      if (!id) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      consultation
        .exerciseDetail(room.appointment.id, id)
        .then((r) => setDetail(r.data))
        .catch((e) => toast.error(e.message || 'Could not load exercises'))
        .finally(() => setDetailLoading(false));
    },
    [room.appointment.id]
  );

  useEffect(() => {
    loadDetail(selectedPlanId);
  }, [selectedPlanId, loadDetail]);

  const setEx = (i, k, v) => {
    setForm((f) => {
      const exercises = [...f.exercises];
      exercises[i] = { ...exercises[i], [k]: v };
      return { ...f, exercises };
    });
  };

  const createPlan = async () => {
    if (!form.exercises.some((e) => e.exercise_id)) {
      toast.error('Select at least one exercise');
      return;
    }
    setSaving(true);
    try {
      await exercisePrescriptions.create({
        patient_id: room.patient.id,
        title: form.title || 'Home exercise plan',
        diagnosis_notes: form.diagnosis_notes,
        therapist_notes: form.therapist_notes,
        start_date: form.start_date,
        exercises: form.exercises
          .filter((e) => e.exercise_id)
          .map((e) => ({
            exercise_id: Number(e.exercise_id),
            sets: Number(e.sets) || 3,
            reps: String(e.reps || '10'),
            frequency: e.frequency || 'Daily',
            special_instructions: e.special_instructions || '',
          })),
      });
      toast.success('Exercise plan shared with patient');
      setShowCreate(false);
      onReload?.();
    } catch (e) {
      toast.error(e.message || 'Could not create plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Explain exercises live — show videos, sets & instructions side-by-side with the call.</p>
        {isDoctor && (
          <button type="button" onClick={() => setShowCreate((v) => !v)} className="btn-primary text-sm py-1.5 px-3">
            <FaIcon icon="fa-plus" className="mr-1.5" /> {showCreate ? 'Cancel' : 'Prescribe exercises'}
          </button>
        )}
      </div>

      {showCreate && isDoctor && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 space-y-3">
          <input
            className="input w-full"
            placeholder="Plan title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="input w-full min-h-[60px]"
            placeholder="Diagnosis notes (optional)"
            value={form.diagnosis_notes}
            onChange={(e) => setForm((f) => ({ ...f, diagnosis_notes: e.target.value }))}
          />
          {form.exercises.map((row, i) => (
            <div key={i} className="grid sm:grid-cols-12 gap-2 items-start bg-white rounded-xl p-3 border border-slate-100">
              <select
                className="input sm:col-span-5"
                value={row.exercise_id}
                onChange={(e) => setEx(i, 'exercise_id', e.target.value)}
              >
                <option value="">Select exercise…</option>
                {library.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <input className="input sm:col-span-2" type="number" min="1" placeholder="Sets" value={row.sets} onChange={(e) => setEx(i, 'sets', e.target.value)} />
              <input className="input sm:col-span-2" placeholder="Reps" value={row.reps} onChange={(e) => setEx(i, 'reps', e.target.value)} />
              <input className="input sm:col-span-3" placeholder="Instructions for patient" value={row.special_instructions} onChange={(e) => setEx(i, 'special_instructions', e.target.value)} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline text-sm py-1.5 px-3"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  exercises: [...f.exercises, { exercise_id: '', sets: 3, reps: '10', frequency: 'Daily', special_instructions: '' }],
                }))
              }
            >
              <FaIcon icon="fa-plus" className="mr-1" /> Add exercise
            </button>
            <button type="button" disabled={saving} onClick={createPlan} className="btn-primary text-sm py-1.5 px-3">
              {saving ? 'Saving…' : 'Share with patient'}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          No exercise plans yet for this patient.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[220px_1fr] gap-3">
          <div className="space-y-1.5">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlanId(p.id)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition ${
                  selectedPlanId === p.id ? 'border-primary-300 bg-primary-50 text-primary-800' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <p className="font-semibold truncate">{p.title}</p>
                <p className="text-[11px] text-slate-500">{p.item_count} exercises · {p.status}</p>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {detailLoading ? (
              <div className="p-8 text-center text-slate-400">
                <FaIcon icon="fa-spinner" className="fa-spin text-xl" />
              </div>
            ) : !detail ? (
              <p className="text-sm text-slate-400 p-4">Select a plan</p>
            ) : (
              (detail.exercises || []).map((ex) => {
                const yt = youtubeEmbed(ex.video_url);
                return (
                  <div key={ex.id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="bg-slate-900 min-h-[180px] relative">
                        {yt ? (
                          <iframe title={ex.exercise_name} src={yt} className="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : ex.image_url ? (
                          <img src={ex.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            <FaIcon icon="fa-person-walking" className="text-3xl" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-slate-900">{ex.exercise_name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                          {ex.body_area || 'General'} · {ex.difficulty || 'beginner'}
                          {ex.equipment ? ` · ${ex.equipment}` : ''}
                        </p>
                        <p className="text-sm font-semibold text-primary-700 mt-2">
                          {ex.sets} sets × {ex.reps} reps
                          {ex.hold_seconds ? ` · hold ${ex.hold_seconds}s` : ''} · {ex.frequency || 'Daily'}
                        </p>
                        {ex.special_instructions && (
                          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2">{ex.special_instructions}</p>
                        )}
                        {ex.instructions && (
                          <p className="text-sm text-slate-600 mt-2 whitespace-pre-line line-clamp-6">{ex.instructions}</p>
                        )}
                        {ex.precautions && (
                          <p className="text-xs text-rose-600 mt-2">
                            <FaIcon icon="fa-triangle-exclamation" className="mr-1" />
                            {ex.precautions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ---------- Prescription / notes panel ---------- */
function PrescriptionPanel({ room, onReload }) {
  const canWrite = room.permissions?.can_write_notes;
  const existing = room.session_note;
  const [form, setForm] = useState({
    pain_score: existing?.pain_score ?? '',
    medicines: existing?.medicines || '',
    techniques: existing?.techniques || '',
    exercises: existing?.exercises || '',
    doctor_notes: existing?.doctor_notes || '',
    progress_notes: existing?.progress_notes || '',
    next_visit: existing?.next_visit || '',
  });
  const [saving, setSaving] = useState(false);
  const [noteId, setNoteId] = useState(existing?.id || null);

  useEffect(() => {
    if (existing) {
      setNoteId(existing.id);
      setForm({
        pain_score: existing.pain_score ?? '',
        medicines: existing.medicines || '',
        techniques: existing.techniques || '',
        exercises: existing.exercises || '',
        doctor_notes: existing.doctor_notes || '',
        progress_notes: existing.progress_notes || '',
        next_visit: existing.next_visit || '',
      });
    }
  }, [existing]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        patient_id: room.patient.id,
        appointment_id: room.appointment.id,
        clinic_id: room.appointment.clinic_id || undefined,
        visit_date: room.appointment.appointment_date,
        visit_time: String(room.appointment.start_time || '').slice(0, 5) || undefined,
        pain_score: form.pain_score === '' ? null : Number(form.pain_score),
        medicines: form.medicines,
        techniques: form.techniques,
        exercises: form.exercises,
        doctor_notes: form.doctor_notes,
        progress_notes: form.progress_notes,
        next_visit: form.next_visit,
      };
      if (noteId) {
        await treatmentJourney.update(noteId, payload);
        toast.success('Prescription updated');
      } else {
        const res = await treatmentJourney.create(payload);
        setNoteId(res.data?.id || null);
        toast.success('Prescription saved — patient can view it now');
      }
      onReload?.();
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    const notes = room.recent_notes || [];
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Prescriptions and notes from your doctor for this consultation.</p>
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            No prescription or notes yet. They will appear here once the doctor saves them.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 ${
                Number(n.appointment_id) === Number(room.appointment.id)
                  ? 'border-primary-200 bg-primary-50/30'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="font-bold text-slate-900">
                  Session {n.session_number} · {fmtDate(n.visit_date)}
                  {Number(n.appointment_id) === Number(room.appointment.id) && (
                    <span className="ml-2 text-[10px] uppercase bg-primary-600 text-white rounded-full px-2 py-0.5">This visit</span>
                  )}
                </p>
                {n.pain_score != null && (
                  <span className="text-xs font-semibold text-rose-600">Pain {n.pain_score}/10</span>
                )}
              </div>
              {n.medicines && (
                <p className="text-sm mt-1">
                  <span className="font-semibold text-slate-700">Medicines: </span>
                  {n.medicines}
                </p>
              )}
              {n.doctor_notes && (
                <p className="text-sm mt-1 whitespace-pre-line">
                  <span className="font-semibold text-slate-700">Doctor notes: </span>
                  {n.doctor_notes}
                </p>
              )}
              {n.exercises && (
                <p className="text-sm mt-1">
                  <span className="font-semibold text-slate-700">Exercises: </span>
                  {n.exercises}
                </p>
              )}
              {n.techniques && (
                <p className="text-sm mt-1">
                  <span className="font-semibold text-slate-700">Techniques: </span>
                  {n.techniques}
                </p>
              )}
              {n.next_visit && (
                <p className="text-sm mt-1 text-sky-700">
                  <FaIcon icon="fa-calendar-day" className="mr-1" />
                  Next: {n.next_visit}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Write prescription & clinical notes for this visit. Patient sees them instantly in their portal.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Pain score (0–10)">
          <input
            type="number"
            min="0"
            max="10"
            className="input w-full"
            value={form.pain_score}
            onChange={(e) => setForm((f) => ({ ...f, pain_score: e.target.value }))}
          />
        </Field>
        <Field label="Next visit">
          <input
            className="input w-full"
            placeholder="e.g. Follow-up in 7 days"
            value={form.next_visit}
            onChange={(e) => setForm((f) => ({ ...f, next_visit: e.target.value }))}
          />
        </Field>
        <Field label="Medicines / advice">
          <textarea className="input w-full min-h-[72px]" value={form.medicines} onChange={(e) => setForm((f) => ({ ...f, medicines: e.target.value }))} />
        </Field>
        <Field label="Techniques used">
          <textarea className="input w-full min-h-[72px]" value={form.techniques} onChange={(e) => setForm((f) => ({ ...f, techniques: e.target.value }))} />
        </Field>
        <Field label="Exercises advised">
          <textarea className="input w-full min-h-[72px]" value={form.exercises} onChange={(e) => setForm((f) => ({ ...f, exercises: e.target.value }))} />
        </Field>
        <Field label="Progress notes">
          <textarea className="input w-full min-h-[72px]" value={form.progress_notes} onChange={(e) => setForm((f) => ({ ...f, progress_notes: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Doctor notes / prescription">
            <textarea className="input w-full min-h-[100px]" value={form.doctor_notes} onChange={(e) => setForm((f) => ({ ...f, doctor_notes: e.target.value }))} />
          </Field>
        </div>
      </div>
      <button type="button" disabled={saving} onClick={save} className="btn-primary text-sm py-2 px-4">
        <FaIcon icon="fa-floppy-disk" className="mr-1.5" />
        {saving ? 'Saving…' : noteId ? 'Update prescription' : 'Save & share with patient'}
      </button>
    </div>
  );
}

function ConsultationAvailabilityToggle({ isDoctorOrAdmin, clinicId }) {
  const { user, setUser } = useAuth();
  const [toggling, setToggling] = useState(false);

  const isOnline = Boolean(user?.profile_public ?? 1);

  const toggle = async () => {
    if (toggling) return;
    const next = !isOnline;
    setToggling(true);
    try {
      if (clinicId) {
        await clinicPortal.setClinicClosure(clinicId, {
          is_closed: next ? 0 : 1,
          closure_reason: next ? '' : 'Temporarily offline',
        });
      } else {
        await doctorsApi.updateProfile({ profile_public: next ? 1 : 0 });
      }
      setUser((u) => (u ? { ...u, profile_public: next ? 1 : 0 } : u));
      toast.success(next ? 'You are now Online' : 'You are now Offline');
    } catch (err) {
      toast.error(err.message || 'Could not update availability status');
    } finally {
      setToggling(false);
    }
  };

  if (!isDoctorOrAdmin) {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-2xs">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </span>
        <div className="text-left select-none">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">Doctor Status</p>
          <p className={`text-xs font-bold leading-tight mt-0.5 ${isOnline ? 'text-emerald-700' : 'text-slate-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-2 pr-3.5 shadow-xs backdrop-blur-sm">
      <button
        type="button"
        onClick={toggle}
        disabled={toggling}
        aria-pressed={isOnline}
        title={isOnline ? 'Click to switch to Offline' : 'Click to switch to Online'}
        className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span className="sr-only">Toggle availability</span>
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isOnline ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {toggling ? (
            <span className="flex h-full w-full items-center justify-center text-slate-400">
              <FaIcon icon="fa-spinner" className="fa-spin text-[10px]" />
            </span>
          ) : (
            <span className={`flex h-full w-full items-center justify-center text-[10px] ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
              <FaIcon icon={isOnline ? 'fa-check' : 'fa-xmark'} />
            </span>
          )}
        </span>
      </button>

      <div className="text-left select-none cursor-pointer" onClick={toggle}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-700' : 'text-slate-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium truncate">
          {isOnline ? 'Ready for sessions' : 'Not taking calls'}
        </p>
      </div>
    </div>
  );
}

/**
 * Shared Online Consultation Room.
 * @param {{ appointmentId: number|string, backTo: string, layout: (props: {children: React.ReactNode}) => React.ReactNode }} props
 */
export default function ConsultationRoom({ appointmentId, backTo, layout: Layout }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('video');

  const load = useCallback((opts = {}) => {
    // Soft refresh keeps the video iframe mounted during prescribe/save.
    if (!opts.silent) setLoading(true);
    consultation
      .room(appointmentId)
      .then((r) => setRoom(r.data))
      .catch((e) => {
        toast.error(e.message || 'Could not open consultation room');
        navigate(backTo);
      })
      .finally(() => setLoading(false));
  }, [appointmentId, backTo, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const softReload = useCallback(() => load({ silent: true }), [load]);

  const canStart = useMemo(() => {
    if (!room) return false;
    return room.permissions?.can_start_video || room.join?.can_join;
  }, [room]);

  const content = loading || !room ? (
    <div className="glass-card p-12 text-center text-slate-400">
      <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
      <p className="text-sm mt-2">Opening consultation room…</p>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link to={backTo} className="text-sm text-slate-500 hover:text-primary-600">
              <FaIcon icon="fa-arrow-left" className="mr-1" /> Back
            </Link>
            <StatusPill join={room.join} status={room.appointment.status} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Consultation Room</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {room.appointment.booking_id} · {fmtDate(room.appointment.appointment_date)} ·{' '}
            {formatTime(room.appointment.start_time)}
            {room.viewer === 'doctor'
              ? ` · ${room.patient.first_name} ${room.patient.last_name}`
              : ` · Dr. ${room.doctor.first_name} ${room.doctor.last_name}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <ConsultationAvailabilityToggle
            isDoctorOrAdmin={room.viewer === 'doctor' || room.viewer === 'admin'}
            clinicId={room.appointment?.clinic_id}
          />
          {canStart && room.appointment.google_meet_link && (
            <button type="button" onClick={() => setTab('video')} className="btn-primary inline-flex items-center gap-2 text-sm">
              <FaIcon icon="fa-video" /> Join Video Call
            </button>
          )}
        </div>
      </div>

      <div className="portal-tabs p-1 rounded-xl bg-slate-100/80">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[7.5rem] sm:min-w-[120px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      <div className={`glass-card ${tab === 'chat' ? '!p-0 overflow-hidden' : '!p-4 md:!p-5'}`}>
        {tab === 'video' && <VideoPanel room={room} canStart={canStart} onSessionStarted={softReload} />}
        {tab === 'chat' && <ConsultationChatPanel room={room} active={tab === 'chat'} />}
        {tab === 'documents' && (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Share MRI, X-ray, reports or any file during the call. Both of you see the same folder.
            </p>
            <DocumentsManager
              initialFilters={{
                patient_id: room.patient.id,
                appointment_id: room.appointment.id,
              }}
            />
          </div>
        )}
        {tab === 'exercises' && <ExercisePanel room={room} onReload={softReload} />}
        {tab === 'prescription' && <PrescriptionPanel room={room} onReload={softReload} />}
      </div>
    </div>
  );

  return <Layout>{content}</Layout>;
}
