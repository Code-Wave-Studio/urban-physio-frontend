import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin, doctors, exercisePrescriptions, exercises } from '../../services/api';
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
    admin.exercisesList().then((res) => setExerciseList(res.data || [])).catch(() => {
      exercises.list().then((r) => setExerciseList(r.data || [])).catch(() => {});
    });
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">New exercise prescription</h2>
            <div className="space-y-3">
              <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
              <input className="input-field" placeholder="Plan title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <textarea className="input-field min-h-[60px]" placeholder="Diagnosis / notes" value={form.diagnosis_notes} onChange={(e) => setForm({ ...form, diagnosis_notes: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                <input className="input-field" type="date" placeholder="End date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-800">Exercises</h3>
                  <button type="button" onClick={addExercise} className="text-sm text-primary-600 font-semibold">
                    + Add
                  </button>
                </div>
                {form.exercises.map((item, idx) => (
                  <div key={idx} className="p-3 mb-2 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <select className="input-field" value={item.exercise_id} onChange={(e) => updateExercise(idx, 'exercise_id', e.target.value)}>
                      <option value="">Select exercise</option>
                      {exerciseList.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input-field" type="number" placeholder="Sets" value={item.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} />
                      <input className="input-field" placeholder="Reps" value={item.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} />
                      <input className="input-field" placeholder="Frequency" value={item.frequency} onChange={(e) => updateExercise(idx, 'frequency', e.target.value)} />
                    </div>
                    {form.exercises.length > 1 && (
                      <button type="button" onClick={() => removeExercise(idx)} className="text-xs text-red-600">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Create'}</button>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
