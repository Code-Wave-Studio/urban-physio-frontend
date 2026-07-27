import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import { clinicPortal, doctors, exercisePrescriptions, exercises } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { useAuth } from '../../contexts/AuthContext';
import useClinicPortal from '../../hooks/useClinicPortal';
import toast from 'react-hot-toast';

const EMPTY_ITEM = {
  exercise_id: '',
  sets: 3,
  reps: '10',
  hold_seconds: '',
  frequency: 'Daily',
  duration_days: '',
  duration_weeks: '',
  scheduled_date: '',
  is_mandatory: false,
  special_instructions: '',
  therapist_notes: '',
};

const emptyForm = () => ({
  patient_id: '',
  title: '',
  diagnosis_notes: '',
  therapist_notes: '',
  week_number: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  status: 'active',
  is_protocol: true,
  publish_status: 'draft',
  protocol_goals: '',
  exercises: [{ ...EMPTY_ITEM }],
});

function ProgressBar({ percent = 0 }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const isClinic = user?.role_slug === 'clinic' || user?.role_slug === 'clinic_staff';
  const {
    clinicId,
    isAdminMode,
    can,
    loading: portalBoot,
  } = useClinicPortal();
  const nav = DOCTOR_NAV;
  const variant = isClinic ? 'clinic' : 'doctor';

  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [exerciseList, setExerciseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    exercisePrescriptions
      .list()
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    exercises.list().then((res) => setExerciseList(res.data || [])).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (isClinic) {
      if (!clinicId) return;
      clinicPortal
        .patients(clinicId)
        .then((pats) => {
          setPatients(
            (pats.data || []).map((p) => ({
              id: p.patient_id || p.id,
              first_name: p.first_name || p.patient_name || 'Patient',
              last_name: p.last_name || '',
            })).filter((p) => p.id)
          );
        })
        .catch(() => setPatients([]));
    } else {
      doctors.patients().then((res) => setPatients(res.data || [])).catch(() => {});
    }
  }, [isClinic, clinicId]);

  if (isClinic && !portalBoot && (!isAdminMode || !can('exercises.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = async (rx) => {
    setDetailLoading(true);
    try {
      const res = await exercisePrescriptions.get(rx.id);
      const data = res.data || {};
      setEditingId(rx.id);
      setForm({
        patient_id: String(data.patient_id || ''),
        title: data.title || '',
        diagnosis_notes: data.diagnosis_notes || '',
        therapist_notes: data.therapist_notes || '',
        week_number: data.week_number || '',
        start_date: data.start_date || new Date().toISOString().slice(0, 10),
        end_date: data.end_date || '',
        status: data.status || 'active',
        exercises: (data.exercises || []).map((ex) => ({
          exercise_id: String(ex.exercise_id),
          sets: ex.sets ?? 3,
          reps: ex.reps || '10',
          hold_seconds: ex.hold_seconds ?? '',
          frequency: ex.frequency || 'Daily',
          duration_days: ex.duration_days ?? '',
          duration_weeks: ex.duration_weeks ?? '',
          scheduled_date: ex.scheduled_date || '',
          is_mandatory: !!ex.is_mandatory,
          special_instructions: ex.special_instructions || '',
          therapist_notes: ex.therapist_notes || '',
        })) || [{ ...EMPTY_ITEM }],
      });
      setModalOpen(true);
    } catch (e) {
      toast.error(e.message || 'Could not load plan');
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (rx) => {
    setDetailLoading(true);
    try {
      const res = await exercisePrescriptions.get(rx.id);
      setDetail(res.data || null);
    } catch (e) {
      toast.error(e.message || 'Could not load plan');
    } finally {
      setDetailLoading(false);
    }
  };

  const addExercise = () => setForm((f) => ({ ...f, exercises: [...f.exercises, { ...EMPTY_ITEM }] }));
  const removeExercise = (idx) => setForm((f) => ({ ...f, exercises: f.exercises.filter((_, i) => i !== idx) }));

  const updateExercise = (idx, field, value) => {
    setForm((f) => {
      const next = [...f.exercises];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'exercise_id') {
        const ex = exerciseList.find((e) => String(e.id) === String(value));
        if (ex) {
          next[idx].sets = ex.default_sets ?? 3;
          next[idx].reps = ex.default_reps || '10';
          next[idx].hold_seconds = ex.default_hold_seconds ?? '';
        }
      }
      return { ...f, exercises: next };
    });
  };

  const mapExercises = (items) =>
    items
      .filter((x) => x.exercise_id)
      .map((x) => ({
        exercise_id: parseInt(x.exercise_id, 10),
        sets: parseInt(x.sets, 10) || 3,
        reps: String(x.reps),
        hold_seconds: x.hold_seconds ? parseInt(x.hold_seconds, 10) : null,
        frequency: x.frequency || 'Daily',
        duration_days: x.duration_days ? parseInt(x.duration_days, 10) : null,
        duration_weeks: x.duration_weeks ? parseInt(x.duration_weeks, 10) : null,
        scheduled_date: x.scheduled_date || null,
        is_mandatory: !!x.is_mandatory,
        special_instructions: x.special_instructions,
        therapist_notes: x.therapist_notes,
      }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.title.trim()) {
      toast.error('Patient and title required');
      return;
    }
    const validEx = mapExercises(form.exercises);
    if (!validEx.length) {
      toast.error('Add at least one exercise');
      return;
    }
    setSaving(true);
    const payload = {
      patient_id: parseInt(form.patient_id, 10),
      title: form.title,
      diagnosis_notes: form.diagnosis_notes,
      therapist_notes: form.therapist_notes,
      week_number: form.week_number ? parseInt(form.week_number, 10) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: form.status,
      is_protocol: Boolean(form.is_protocol),
      publish_status: form.publish_status || 'draft',
      protocol_goals: form.protocol_goals || '',
      exercises: validEx,
    };
    if (isClinic && clinicId) payload.clinic_id = clinicId;
    try {
      if (editingId) {
        await exercisePrescriptions.update(editingId, payload);
        toast.success('Plan updated');
      } else {
        await exercisePrescriptions.create(payload);
        toast.success(payload.publish_status === 'published' ? 'Protocol published to patient' : 'Draft protocol saved');
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelPlan = async (rx) => {
    if (!window.confirm(`Cancel plan "${rx.title}"?`)) return;
    try {
      await exercisePrescriptions.cancel(rx.id);
      toast.success('Plan cancelled');
      load();
      if (detail?.id === rx.id) setDetail(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const progress = detail?.progress;
  const todayPct = progress?.today?.percent ?? 0;
  const Layout = isClinic ? ClinicPortalShell : DashboardLayout;
  const layoutProps = isClinic
    ? {
        title: 'Exercise & Rehab Plans',
        subtitle: 'Assign, update and track patient rehabilitation exercises',
        actions: (
          <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" /> New plan
          </button>
        ),
      }
    : { links: nav, variant };

  return (
    <Layout {...layoutProps}>
      {!isClinic && (
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Exercise & Rehab Plans</h1>
          <p className="text-slate-600 text-sm mt-1">Assign, update and track patient rehabilitation exercises</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" /> New plan
        </button>
      </div>
      )}
      {isClinic && (
        <div className="mb-4 sm:hidden">
          <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" /> New plan
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3].map((i) => <div key={i} className="glass-card h-28 animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <FaIcon icon="fa-dumbbell" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold">No exercise plans yet</p>
          <p className="text-sm text-slate-500 mt-1">Create a rehab plan and assign exercises to a patient.</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4">Create plan</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((rx) => {
            const pct = rx.progress_today?.percent ?? null;
            return (
              <div key={rx.id} className="glass-card !p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{rx.title}</p>
                    <p className="text-sm text-slate-500">
                      {rx.patient_first_name} {rx.patient_last_name}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    rx.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {rx.publish_status === 'draft' ? 'draft' : rx.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span><FaIcon icon="fa-calendar" className="mr-1" />{rx.start_date}{rx.end_date ? ` → ${rx.end_date}` : ''}</span>
                  <span><FaIcon icon="fa-list" className="mr-1" />{rx.exercise_count || 0} exercises</span>
                  {rx.week_number && <span>Week {rx.week_number}</span>}
                  {Number(rx.is_protocol) === 1 && <span className="text-teal-700 font-semibold">Protocol</span>}
                </div>
                {pct != null && rx.status === 'active' && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Today</span>
                      <span className="font-semibold text-teal-700">{pct}%</span>
                    </div>
                    <ProgressBar percent={pct} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => openDetail(rx)} disabled={detailLoading}>
                    Progress
                  </button>
                  <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => openEdit(rx)}>
                    Edit
                  </button>
                  {rx.publish_status === 'draft' && (
                    <button
                      type="button"
                      className="btn-primary !py-1.5 !px-3 text-xs"
                      onClick={async () => {
                        try {
                          await exercisePrescriptions.publish(rx.id, { is_protocol: true });
                          toast.success('Published to patient');
                          load();
                        } catch (err) {
                          toast.error(err.message || 'Publish failed');
                        }
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {rx.status === 'active' && (
                    <button type="button" className="text-xs text-rose-600 font-medium px-2" onClick={() => cancelPlan(rx)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress detail modal */}
      <GlassModal open={!!detail} onClose={() => setDetail(null)} size="lg">
        <GlassModalHeader
          title={detail?.title || 'Plan progress'}
          subtitle={`${detail?.patient_first_name || ''} ${detail?.patient_last_name || ''}`.trim()}
          icon="fa-chart-line"
          onClose={() => setDetail(null)}
        />
        <GlassModalBody>
          {!detail ? null : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Today %', value: `${progress?.today?.percent ?? 0}%` },
                  { label: 'Completed', value: progress?.today?.completed ?? 0 },
                  { label: 'Pending', value: progress?.today?.pending ?? 0 },
                  { label: 'Avg pain', value: progress?.today?.pain_avg ?? '—' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</p>
                    <p className="text-lg font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Today</p>
                <ProgressBar percent={todayPct} />
              </div>

              {progress?.timeline?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Recovery timeline</p>
                  <div className="space-y-2">
                    {progress.timeline.map((t) => (
                      <div key={t.from} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28 shrink-0">{t.label}</span>
                        <div className="flex-1"><ProgressBar percent={t.percent} /></div>
                        <span className="text-xs font-semibold text-teal-700 w-10 text-right">{t.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progress?.pain_trend?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Pain trend (14 days)</p>
                  <div className="flex items-end gap-1 h-24">
                    {progress.pain_trend.map((p) => (
                      <div key={p.date} className="flex-1 flex flex-col items-center gap-1" title={`${p.date}: ${p.avg_pain}/10`}>
                        <div
                          className="w-full max-w-[18px] rounded-t bg-amber-400/80"
                          style={{ height: `${(p.avg_pain / 10) * 100}%`, minHeight: 4 }}
                        />
                        <span className="text-[9px] text-slate-400">{p.avg_pain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Assigned exercises</p>
                <ul className="space-y-2">
                  {(detail.exercises || []).map((ex) => (
                    <li key={ex.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                      <FaIcon icon="fa-dumbbell" className="text-teal-600 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {ex.exercise_name}
                          {ex.is_mandatory && <span className="ml-2 text-[10px] uppercase text-rose-600 font-bold">Mandatory</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ex.sets} sets · {ex.reps} reps · {ex.frequency}
                          {ex.hold_seconds ? ` · hold ${ex.hold_seconds}s` : ''}
                        </p>
                        {ex.today_log && (
                          <p className="text-[11px] mt-1 text-emerald-700 capitalize">Today: {ex.today_log.status}{ex.today_log.pain_level ? ` · pain ${ex.today_log.pain_level}/10` : ''}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {progress?.history?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Recent history</p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {progress.history.slice(0, 15).map((h) => (
                      <li key={h.id} className="text-xs text-slate-600 flex justify-between gap-2">
                        <span className="truncate">{h.log_date} · {h.exercise_name} · <span className="capitalize">{h.status}</span></span>
                        {h.pain_level != null && <span className="text-amber-700 shrink-0">pain {h.pain_level}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setDetail(null)}>Close</button>
          {detail && (
            <button type="button" className="btn-primary" onClick={() => { setDetail(null); openEdit(detail); }}>
              Edit plan
            </button>
          )}
        </GlassModalFooter>
      </GlassModal>

      {/* Create / Edit modal */}
      <GlassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        preventClose={saving}
        size="lg"
        panelClassName="flex flex-col max-h-[min(760px,calc(100vh-2rem))]"
      >
        <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            title={editingId ? 'Update exercise plan' : 'New exercise plan'}
            subtitle="Assign rehab exercises with sets, reps and schedule"
            icon="fa-dumbbell"
            onClose={() => setModalOpen(false)}
            disabledClose={saving}
          />
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Patient *</label>
              <select
                className="input-field w-full"
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                required
                disabled={!!editingId}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Plan title *</label>
              <input className="input-field w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Week 2 — knee strengthening" />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.is_protocol)} onChange={(e) => setForm({ ...form, is_protocol: e.target.checked })} />
                Treatment protocol (sync to patient portal)
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Publish</span>
                <select className="input-field w-full mt-1" value={form.publish_status} onChange={(e) => setForm({ ...form, publish_status: e.target.value })}>
                  <option value="draft">Save as draft</option>
                  <option value="published">Publish to patient now</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Protocol goals</span>
                <textarea className="input-field w-full mt-1" rows={2} value={form.protocol_goals || ''} onChange={(e) => setForm({ ...form, protocol_goals: e.target.value })} placeholder="e.g. Restore full knee ROM, pain &lt; 3/10" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start</label>
                <input type="date" className="input-field w-full" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End</label>
                <input type="date" className="input-field w-full" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Week #</label>
                <input type="number" min={1} className="input-field w-full" value={form.week_number} onChange={(e) => setForm({ ...form, week_number: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Diagnosis / notes</label>
              <textarea className="input-field w-full min-h-[64px]" value={form.diagnosis_notes} onChange={(e) => setForm({ ...form, diagnosis_notes: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Therapist notes</label>
              <textarea className="input-field w-full min-h-[56px]" value={form.therapist_notes} onChange={(e) => setForm({ ...form, therapist_notes: e.target.value })} placeholder="Internal notes for the care team" />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-800">Exercises</h3>
                <button type="button" onClick={addExercise} className="text-sm text-primary-600 font-semibold">+ Add</button>
              </div>
              <div className="space-y-3">
                {form.exercises.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-3">
                    <select className="input-field w-full" value={item.exercise_id} onChange={(e) => updateExercise(idx, 'exercise_id', e.target.value)}>
                      <option value="">Select exercise</option>
                      {exerciseList.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input className="input-field" type="number" min={1} placeholder="Sets" value={item.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} />
                      <input className="input-field" placeholder="Reps" value={item.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} />
                      <input className="input-field" type="number" min={0} placeholder="Hold (sec)" value={item.hold_seconds} onChange={(e) => updateExercise(idx, 'hold_seconds', e.target.value)} />
                      <select className="input-field" value={item.frequency} onChange={(e) => updateExercise(idx, 'frequency', e.target.value)}>
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input className="input-field" type="number" min={1} placeholder="Duration days" value={item.duration_days} onChange={(e) => updateExercise(idx, 'duration_days', e.target.value)} />
                      <input className="input-field" type="number" min={1} placeholder="Duration weeks" value={item.duration_weeks} onChange={(e) => updateExercise(idx, 'duration_weeks', e.target.value)} />
                      <input className="input-field" type="date" value={item.scheduled_date} onChange={(e) => updateExercise(idx, 'scheduled_date', e.target.value)} title="Schedule date" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={!!item.is_mandatory} onChange={(e) => updateExercise(idx, 'is_mandatory', e.target.checked)} />
                      Mandatory
                    </label>
                    <input className="input-field w-full" placeholder="Special instructions for patient" value={item.special_instructions} onChange={(e) => updateExercise(idx, 'special_instructions', e.target.value)} />
                    {form.exercises.length > 1 && (
                      <button type="button" onClick={() => removeExercise(idx)} className="text-xs text-rose-600 font-semibold">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <GlassModalFooter>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Assign plan'}
            </button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </Layout>
  );
}
