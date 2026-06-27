import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import GlassModal, { GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import { doctors, exercisePrescriptions, exercises } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { exercise_id: '', sets: 3, reps: '10', hold_seconds: '', frequency: 'Daily', special_instructions: '' };

export default function DoctorPrescriptions() {
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [exerciseList, setExerciseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    title: '',
    diagnosis_notes: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    exercises: [{ ...EMPTY_ITEM }],
  });

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
    doctors.patients().then((res) => setPatients(res.data || [])).catch(() => {});
    exercises
      .list()
      .then((res) => setExerciseList(res.data || []))
      .catch((err) => toast.error(err.message || 'Could not load exercises'));
  }, [load]);

  const addExercise = () => {
    setForm((f) => ({ ...f, exercises: [...f.exercises, { ...EMPTY_ITEM }] }));
  };

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

  const removeExercise = (idx) => {
    setForm((f) => ({ ...f, exercises: f.exercises.filter((_, i) => i !== idx) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.title.trim()) {
      toast.error('Patient and title required');
      return;
    }
    const validEx = form.exercises.filter((x) => x.exercise_id);
    if (!validEx.length) {
      toast.error('Add at least one exercise');
      return;
    }
    setSaving(true);
    try {
      await exercisePrescriptions.create({
        patient_id: parseInt(form.patient_id, 10),
        title: form.title,
        diagnosis_notes: form.diagnosis_notes,
        start_date: form.start_date,
        end_date: form.end_date || null,
        exercises: validEx.map((x) => ({
          exercise_id: parseInt(x.exercise_id, 10),
          sets: parseInt(x.sets, 10) || 3,
          reps: String(x.reps),
          hold_seconds: x.hold_seconds ? parseInt(x.hold_seconds, 10) : null,
          frequency: x.frequency || 'Daily',
          special_instructions: x.special_instructions,
        })),
      });
      toast.success('Prescription created');
      setModalOpen(false);
      setForm({
        patient_id: '',
        title: '',
        diagnosis_notes: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        exercises: [{ ...EMPTY_ITEM }],
      });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Exercise Prescriptions</h1>
          <p className="text-slate-600 text-sm mt-1">Create rehab plans for your patients</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-file-prescription" /> New prescription
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-600">No prescriptions yet.</div>
      ) : (
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-3">Title</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Start</th>
                <th className="p-3">Exercises</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((rx) => (
                <tr key={rx.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{rx.title}</td>
                  <td className="p-3">{rx.patient_first_name} {rx.patient_last_name}</td>
                  <td className="p-3">{rx.start_date}</td>
                  <td className="p-3">{rx.exercise_count || 0}</td>
                  <td className="p-3 capitalize">{rx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GlassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        preventClose={saving}
        size="lg"
        titleId="prescription-modal-title"
        panelClassName="flex flex-col max-h-[min(720px,calc(100vh-2rem))]"
      >
        <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            titleId="prescription-modal-title"
            title="New exercise prescription"
            subtitle="Assign rehab exercises to a patient"
            icon="fa-file-prescription"
            accent="primary"
            onClose={() => setModalOpen(false)}
            disabledClose={saving}
          />

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 sm:py-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Patient *</label>
              <select className="input-field w-full" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Plan title *</label>
              <input className="input-field w-full" placeholder="e.g. 2-week knee strengthening" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Diagnosis / notes</label>
              <textarea className="input-field w-full min-h-[72px]" placeholder="Clinical notes for the patient" value={form.diagnosis_notes} onChange={(e) => setForm({ ...form, diagnosis_notes: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start date</label>
                <input className="input-field w-full" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End date (optional)</label>
                <input className="input-field w-full" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-800">Exercises</h3>
                <button type="button" onClick={addExercise} className="text-sm text-primary-600 font-semibold hover:text-primary-700">
                  + Add exercise
                </button>
              </div>
              <div className="space-y-3">
                {form.exercises.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-3">
                    <select className="input-field w-full" value={item.exercise_id} onChange={(e) => updateExercise(idx, 'exercise_id', e.target.value)}>
                      <option value="">{exerciseList.length ? 'Select exercise' : 'No exercises available — ask admin to add exercises'}</option>
                      {exerciseList.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input className="input-field w-full" type="number" min={1} placeholder="Sets" value={item.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} />
                      <input className="input-field w-full" placeholder="Reps" value={item.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} />
                      <input className="input-field w-full" placeholder="Frequency" value={item.frequency} onChange={(e) => updateExercise(idx, 'frequency', e.target.value)} />
                    </div>
                    {form.exercises.length > 1 && (
                      <button type="button" onClick={() => removeExercise(idx)} className="text-xs text-red-600 font-semibold">Remove exercise</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <GlassModalFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-end sm:ml-auto">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-outline w-full sm:w-auto sm:min-w-[120px]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto sm:min-w-[140px]">
                {saving ? 'Saving…' : 'Create prescription'}
              </button>
            </div>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </DashboardLayout>
  );
}
