import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import TreatmentJourneyTimeline, {
  JourneyCompareSummary,
} from '../../components/treatmentJourney/TreatmentJourneyTimeline';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import { doctors, treatmentJourney } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = () => ({
  visit_date: new Date().toISOString().slice(0, 10),
  visit_time: '',
  pain_score: '',
  rom: '',
  muscle_strength: '',
  techniques: '',
  exercises: '',
  medicines: '',
  doctor_notes: '',
  progress_notes: '',
  next_visit: '',
});

function SessionForm({ form, set, onSubmit, onCancel, saving, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="glass-card !p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visit date *</label>
          <input
            type="date"
            className="input-field"
            value={form.visit_date}
            onChange={(e) => set('visit_date', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visit time</label>
          <input
            type="time"
            className="input-field"
            value={form.visit_time}
            onChange={(e) => set('visit_time', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pain score (0–10)</label>
          <input
            type="number"
            min={0}
            max={10}
            className="input-field"
            placeholder="e.g. 6"
            value={form.pain_score}
            onChange={(e) => set('pain_score', e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Range of Motion (ROM)</label>
          <input
            className="input-field"
            placeholder="e.g. Knee flexion 90°"
            value={form.rom}
            onChange={(e) => set('rom', e.target.value)}
            maxLength={255}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Muscle strength</label>
          <input
            className="input-field"
            placeholder="e.g. Quadriceps 3/5"
            value={form.muscle_strength}
            onChange={(e) => set('muscle_strength', e.target.value)}
            maxLength={255}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Treatment techniques used</label>
        <textarea
          className="input-field"
          rows={2}
          placeholder="e.g. IFT, ultrasound, manual therapy, dry needling…"
          value={form.techniques}
          onChange={(e) => set('techniques', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Exercises prescribed</label>
        <textarea
          className="input-field"
          rows={2}
          placeholder="e.g. Quad sets 3×10, heel slides 3×15…"
          value={form.exercises}
          onChange={(e) => set('exercises', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Medicines (if applicable)</label>
        <textarea
          className="input-field"
          rows={2}
          value={form.medicines}
          onChange={(e) => set('medicines', e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor notes</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.doctor_notes}
            onChange={(e) => set('doctor_notes', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Progress / improvement</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="e.g. Pain reduced from 7 to 5, walking improved"
            value={form.progress_notes}
            onChange={(e) => set('progress_notes', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Next visit recommendation</label>
        <input
          className="input-field"
          placeholder="e.g. After 2 days — continue home exercises"
          value={form.next_visit}
          onChange={(e) => set('next_visit', e.target.value)}
          maxLength={255}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function DoctorTreatmentJourney() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [search, setSearch] = useState('');
  const [journey, setJourney] = useState({ sessions: [], summary: null });
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [myDoctorId, setMyDoctorId] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    doctors
      .patients()
      .then((res) => setPatients(res.data || []))
      .catch((err) => toast.error(err.message || 'Failed to load patients'))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    doctors
      .getProfile()
      .then((res) => {
        const d = res.data || res;
        if (d?.doctor_id) setMyDoctorId(Number(d.doctor_id));
      })
      .catch(() => {});
  }, []);

  const loadJourney = useCallback(async (pid) => {
    if (!pid) {
      setJourney({ sessions: [], summary: null });
      return;
    }
    setLoadingJourney(true);
    try {
      const res = await treatmentJourney.list({ patient_id: pid });
      const data = res.data || res || {};
      setJourney({ sessions: data.sessions || [], summary: data.summary || null });
    } catch (e) {
      toast.error(e.message || 'Failed to load treatment journey');
      setJourney({ sessions: [], summary: null });
    } finally {
      setLoadingJourney(false);
    }
  }, []);

  useEffect(() => {
    setShowAdd(false);
    setEditingId(null);
    loadJourney(patientId);
  }, [patientId, loadJourney]);

  const q = search.trim().toLowerCase();
  const filteredPatients = useMemo(
    () =>
      q
        ? patients.filter((p) =>
            [p.first_name, p.last_name, p.phone, p.email]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(q)
          )
        : patients,
    [patients, q]
  );

  const selectedPatient = patients.find((p) => String(p.id) === String(patientId));

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowAdd(true);
  };

  const startEdit = (session) => {
    setShowAdd(false);
    setEditingId(session.id);
    setForm({
      visit_date: session.visit_date || new Date().toISOString().slice(0, 10),
      visit_time: session.visit_time ? String(session.visit_time).slice(0, 5) : '',
      pain_score: session.pain_score ?? '',
      rom: session.rom || '',
      muscle_strength: session.muscle_strength || '',
      techniques: session.techniques || '',
      exercises: session.exercises || '',
      medicines: session.medicines || '',
      doctor_notes: session.doctor_notes || '',
      progress_notes: session.progress_notes || '',
      next_visit: session.next_visit || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    setSaving(true);
    try {
      const payload = {
        visit_date: form.visit_date,
        visit_time: form.visit_time || null,
        pain_score: form.pain_score === '' ? null : Number(form.pain_score),
        rom: form.rom,
        muscle_strength: form.muscle_strength,
        techniques: form.techniques,
        exercises: form.exercises,
        medicines: form.medicines,
        doctor_notes: form.doctor_notes,
        progress_notes: form.progress_notes,
        next_visit: form.next_visit,
      };
      if (editingId) {
        await treatmentJourney.update(editingId, payload);
        toast.success('Session updated');
      } else {
        await treatmentJourney.create({ ...payload, patient_id: Number(patientId) });
        toast.success('Session recorded');
      }
      cancelForm();
      loadJourney(patientId);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (session) => {
    if (!window.confirm(`Delete session ${session.session_number}? This cannot be undone.`)) return;
    try {
      await treatmentJourney.remove(session.id);
      toast.success('Session removed');
      if (editingId === session.id) cancelForm();
      loadJourney(patientId);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Treatment Journey</h1>
        <p className="text-slate-600 text-sm mt-1">
          Session-by-session clinical records — pain, ROM, strength, techniques, exercises & progress
        </p>
      </div>

      <div className="glass-card !p-4 mb-5 grid sm:grid-cols-2 gap-3">
        <div className="relative">
          <FaIcon
            icon="fa-magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            className="input-field pl-9"
            placeholder="Filter patients by name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={loadingPatients}
        >
          <option value="">
            {loadingPatients ? 'Loading patients…' : 'Select a patient'}
          </option>
          {filteredPatients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
              {p.phone ? ` · ${p.phone}` : ''}
            </option>
          ))}
        </select>
      </div>

      {!patientId ? (
        <div className="glass-card text-center py-16 text-slate-500">
          <FaIcon icon="fa-notes-medical" className="text-3xl text-teal-500 mb-3" />
          <p>Select a patient to view or record their treatment journey.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <strong>
                {selectedPatient
                  ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                  : 'Patient'}
              </strong>
              {' · '}
              {journey.sessions.length} session{journey.sessions.length === 1 ? '' : 's'} recorded
            </p>
            {!showAdd && !editingId && (
              <button type="button" className="btn-primary text-sm inline-flex items-center gap-2" onClick={startAdd}>
                <FaIcon icon="fa-plus" />
                Record new session
              </button>
            )}
          </div>

          {(showAdd || editingId) && (
            <SessionForm
              form={form}
              set={set}
              onSubmit={submit}
              onCancel={cancelForm}
              saving={saving}
              submitLabel={editingId ? 'Update session' : 'Save session'}
            />
          )}

          {loadingJourney ? (
            <div className="glass-card h-40 animate-pulse" />
          ) : (
            <>
              <JourneyCompareSummary summary={journey.summary} />
              <TreatmentJourneyTimeline
                sessions={journey.sessions}
                canEdit
                editableDoctorId={myDoctorId}
                onEdit={startEdit}
                onDelete={remove}
              />
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
