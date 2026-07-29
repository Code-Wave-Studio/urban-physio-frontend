import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { erpAssessments } from '../../services/api';

// ─── Default Clinical Sections ─────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: 'presentation', title: 'Patient Presentation', fields: [
    { id: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', required: true },
    { id: 'onset', label: 'Date of Onset', type: 'date', required: false },
    { id: 'mechanism', label: 'Mechanism of Injury', type: 'textarea', required: false },
  ]},
  { id: 'hopi', title: 'History of Present Illness', fields: [
    { id: 'hopi_text', label: 'History', type: 'textarea', required: false },
  ]},
  { id: 'pain', title: 'Pain Assessment', fields: [
    { id: 'pain_score', label: 'Pain Score (0-10)', type: 'number', required: true, min: 0, max: 10 },
    { id: 'pain_location', label: 'Pain Location', type: 'text', required: false },
    { id: 'pain_character', label: 'Pain Character', type: 'select', required: false, options: ['Sharp','Dull','Burning','Throbbing','Aching','Cramping','Stabbing','Other'] },
    { id: 'pain_aggravating', label: 'Aggravating Factors', type: 'textarea', required: false },
    { id: 'pain_relieving', label: 'Relieving Factors', type: 'textarea', required: false },
  ]},
  { id: 'medical_history', title: 'Medical History', fields: [
    { id: 'past_medical', label: 'Past Medical History', type: 'textarea', required: false },
    { id: 'surgeries', label: 'Previous Surgeries', type: 'textarea', required: false },
    { id: 'medications', label: 'Current Medications', type: 'textarea', required: false },
    { id: 'allergies', label: 'Allergies', type: 'textarea', required: false },
  ]},
  { id: 'social_history', title: 'Social History', fields: [
    { id: 'occupation', label: 'Occupation', type: 'text', required: false },
    { id: 'smoking', label: 'Smoking Status', type: 'select', required: false, options: ['Never','Former','Current'] },
    { id: 'alcohol', label: 'Alcohol Use', type: 'select', required: false, options: ['None','Occasional','Regular'] },
    { id: 'exercise_habits', label: 'Exercise Habits', type: 'textarea', required: false },
  ]},
  { id: 'observation', title: 'Observation', fields: [
    { id: 'posture', label: 'Posture', type: 'textarea', required: false },
    { id: 'gait', label: 'Gait', type: 'textarea', required: false },
    { id: 'swelling', label: 'Swelling / Deformity', type: 'textarea', required: false },
  ]},
  { id: 'examination', title: 'Examination', fields: [
    { id: 'palpation', label: 'Palpation', type: 'textarea', required: false },
    { id: 'rom_notes', label: 'Range of Motion Notes', type: 'textarea', required: false },
    { id: 'mmt_notes', label: 'Muscle Strength Notes', type: 'textarea', required: false },
    { id: 'neuro', label: 'Neurological Assessment', type: 'textarea', required: false },
    { id: 'special_tests', label: 'Special Tests', type: 'textarea', required: false },
  ]},
  { id: 'investigations', title: 'Investigations', fields: [
    { id: 'investigation_text', label: 'Investigations / Reports', type: 'textarea', required: false },
  ]},
  { id: 'diagnosis', title: 'Diagnosis', fields: [
    { id: 'diagnosis', label: 'Clinical Diagnosis', type: 'textarea', required: true },
    { id: 'icd_code', label: 'ICD Code', type: 'text', required: false },
  ]},
  { id: 'treatment_plan', title: 'Treatment Plan', fields: [
    { id: 'goals_short', label: 'Short-term Goals', type: 'textarea', required: false },
    { id: 'goals_long', label: 'Long-term Goals', type: 'textarea', required: false },
    { id: 'treatment_approach', label: 'Treatment Approach', type: 'textarea', required: false },
    { id: 'frequency', label: 'Frequency / Duration', type: 'text', required: false },
  ]},
  { id: 'consent', title: 'Consent', fields: [
    { id: 'consent_text', label: 'Consent Statement', type: 'display', required: false },
    { id: 'patient_signature', label: 'Patient Signature', type: 'signature', required: false },
  ]},
];

const FIELD_TYPES = ['text','textarea','number','date','select','checkbox','radio','display','signature'];

// ─── FieldEditor ───────────────────────────────────────────────────────────
function FieldEditor({ field, onChange, onDelete }) {
  return (
    <div className="border border-slate-100 rounded-xl p-3 space-y-2 bg-white">
      <div className="flex items-center gap-2">
        <FaIcon icon="fa-solid fa-grip-vertical" className="text-slate-300 cursor-grab" />
        <input
          className="flex-1 text-sm border rounded-lg px-2 py-1"
          placeholder="Field label"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
        <select
          className="text-xs border rounded-lg px-2 py-1"
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value })}
        >
          {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          <input type="checkbox" checked={!!field.required} onChange={(e) => onChange({ ...field, required: e.target.checked })} />
          Req
        </label>
        <button type="button" onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 transition-colors">
          <FaIcon icon="fa-solid fa-trash" className="text-xs" />
        </button>
      </div>
      {field.type === 'select' && (
        <input
          className="w-full text-xs border rounded-lg px-2 py-1"
          placeholder="Options (comma separated)"
          value={Array.isArray(field.options) ? field.options.join(',') : ''}
          onChange={(e) => onChange({ ...field, options: e.target.value.split(',').map((s) => s.trim()) })}
        />
      )}
    </div>
  );
}

// ─── SectionEditor ─────────────────────────────────────────────────────────
function SectionEditor({ section, onChange, onDelete }) {
  const addField = () => {
    const newField = { id: `field_${Date.now()}`, label: 'New Field', type: 'text', required: false };
    onChange({ ...section, fields: [...(section.fields || []), newField] });
  };
  const updateField = (idx, f) => {
    const fields = [...section.fields];
    fields[idx] = f;
    onChange({ ...section, fields });
  };
  const deleteField = (idx) => {
    const fields = section.fields.filter((_, i) => i !== idx);
    onChange({ ...section, fields });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FaIcon icon="fa-solid fa-grip-vertical" className="text-slate-300 cursor-grab" />
        <input
          className="flex-1 font-semibold text-sm border rounded-lg px-2 py-1 bg-white"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
        <label className="flex items-center gap-1 text-xs text-slate-500">
          <input type="checkbox" checked={section.visible !== false} onChange={(e) => onChange({ ...section, visible: e.target.checked })} />
          Visible
        </label>
        <button type="button" onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
          <FaIcon icon="fa-solid fa-trash" className="text-xs" />
        </button>
      </div>
      <div className="space-y-2">
        {(section.fields || []).map((f, idx) => (
          <FieldEditor key={f.id || idx} field={f} onChange={(updated) => updateField(idx, updated)} onDelete={() => deleteField(idx)} />
        ))}
      </div>
      <button type="button" onClick={addField} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
        <FaIcon icon="fa-solid fa-plus" /> Add Field
      </button>
    </div>
  );
}

// ─── Main AssessmentBuilder ─────────────────────────────────────────────────
export default function AssessmentBuilder({ clinicId, templateId, onSaved }) {
  const [template, setTemplate] = useState(null);
  const [schema, setSchema]     = useState(DEFAULT_SECTIONS);
  const [name, setName]         = useState('New Assessment');
  const [status, setStatus]     = useState('draft');
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(!!templateId);
  const [tab, setTab]           = useState('builder'); // builder | preview | versions

  const load = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await erpAssessments.getTemplate(templateId);
      const d   = res.data || res;
      setTemplate(d);
      setName(d.name);
      setStatus(d.status);
      setSchema(Array.isArray(d.schema) ? d.schema : DEFAULT_SECTIONS);
    } catch { toast.error('Could not load template'); }
    finally { setLoading(false); }
  }, [templateId]);

  useEffect(() => { load(); }, [load]);

  const save = async (newStatus) => {
    const s = newStatus || status;
    setSaving(true);
    try {
      const payload = { name, status: s, schema };
      if (templateId) {
        await erpAssessments.updateTemplate(templateId, payload);
        toast.success(s === 'published' ? 'Published!' : 'Saved');
      } else {
        const res = await erpAssessments.createTemplate(payload);
        toast.success('Template created');
        onSaved?.(res.id);
      }
      if (newStatus) setStatus(newStatus);
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const addSection = () => {
    setSchema((prev) => [...prev, { id: `section_${Date.now()}`, title: 'New Section', fields: [], visible: true }]);
  };

  const updateSection = (idx, s) => {
    const sections = [...schema];
    sections[idx] = s;
    setSchema(sections);
  };

  const deleteSection = (idx) => setSchema((prev) => prev.filter((_, i) => i !== idx));

  if (loading) return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card !p-4 flex flex-wrap items-center gap-3">
        <input
          className="flex-1 min-w-0 text-lg font-bold border-b-2 border-teal-400 bg-transparent focus:outline-none py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Assessment Name"
        />
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
            {status}
          </span>
          <button type="button" onClick={() => save()} disabled={saving} className="btn-outline text-sm !py-1.5">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {status !== 'published' && (
            <button type="button" onClick={() => save('published')} disabled={saving} className="btn-primary text-sm !py-1.5">
              Publish
            </button>
          )}
          {status !== 'archived' && templateId && (
            <button type="button" onClick={() => save('archived')} disabled={saving} className="btn-outline text-sm !py-1.5 text-slate-400">
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {['builder', 'versions'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 rounded-t-lg font-medium transition-colors ${tab === t ? 'bg-white border border-b-0 border-slate-200 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'builder' && (
        <div className="space-y-3">
          {schema.map((section, idx) => (
            <SectionEditor
              key={section.id || idx}
              section={section}
              onChange={(s) => updateSection(idx, s)}
              onDelete={() => deleteSection(idx)}
            />
          ))}
          <button
            type="button"
            onClick={addSection}
            className="w-full rounded-2xl border-2 border-dashed border-teal-300 py-4 text-sm text-teal-600 font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
          >
            <FaIcon icon="fa-solid fa-plus" />
            Add Section
          </button>
        </div>
      )}

      {tab === 'versions' && templateId && (
        <VersionHistory templateId={templateId} />
      )}
    </div>
  );
}

function VersionHistory({ templateId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    erpAssessments.getVersionHistory(templateId)
      .then((r) => setVersions(r.data || r || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId]);

  const restore = async (versionId) => {
    if (!window.confirm('Restore this version?')) return;
    try {
      await erpAssessments.restoreVersion(templateId, versionId);
      toast.success('Version restored');
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  if (loading) return <div className="h-20 bg-slate-100 animate-pulse rounded-2xl" />;
  if (!versions.length) return <p className="text-sm text-slate-500 py-6 text-center">No version history yet.</p>;

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 bg-white">
          <div>
            <p className="text-sm font-medium">Version {v.version}</p>
            <p className="text-xs text-slate-400">{v.change_note || 'No note'} · {String(v.created_at || '').slice(0, 10)}</p>
          </div>
          <button type="button" onClick={() => restore(v.id)} className="text-xs text-teal-600 hover:underline">Restore</button>
        </div>
      ))}
    </div>
  );
}
