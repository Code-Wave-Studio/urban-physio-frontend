import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal, erpAssessments } from '../../services/api';
import AssessmentFormChrome, { defaultLetterhead } from './AssessmentFormChrome';

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
    { id: 'clinical_images', label: 'Clinical Images / Body Chart / X-ray', type: 'image', required: false },
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

const FIELD_TYPES = ['text','textarea','number','date','select','checkbox','radio','display','signature','image'];

const SUBTITLE_OPTIONS = ['Initial Evaluation', 'Re-assessment', 'Discharge Assessment'];
const DEPT_OPTIONS = [
  'Orthopaedic Physiotherapy',
  'Neurological Physiotherapy',
  'Sports Physiotherapy',
  'Paediatric Physiotherapy',
  'Cardiopulmonary Physiotherapy',
  'Geriatric Physiotherapy',
];

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
      {(field.type === 'select' || field.type === 'radio') && (
        <input
          className="w-full text-xs border rounded-lg px-2 py-1"
          placeholder="Options (comma separated)"
          value={Array.isArray(field.options) ? field.options.join(',') : ''}
          onChange={(e) => onChange({ ...field, options: e.target.value.split(',').map((s) => s.trim()) })}
        />
      )}
      {field.type === 'image' && (
        <p className="text-[11px] text-slate-400">Clinicians can upload body charts, X-rays, or clinical photos when filling this form.</p>
      )}
    </div>
  );
}

// ─── SectionEditor ─────────────────────────────────────────────────────────
function SectionEditor({ section, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
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
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 text-slate-400 hover:text-teal-600 disabled:opacity-30 text-[10px]"
            title="Move Section Up"
          >
            <FaIcon icon="fa-solid fa-chevron-up" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 text-slate-400 hover:text-teal-600 disabled:opacity-30 text-[10px]"
            title="Move Section Down"
          >
            <FaIcon icon="fa-solid fa-chevron-down" />
          </button>
        </div>
        <input
          className="flex-1 font-semibold text-sm border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={section.visible !== false} onChange={(e) => onChange({ ...section, visible: e.target.checked })} />
          Visible
        </label>
        <button type="button" onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 transition-colors" title="Delete Section">
          <FaIcon icon="fa-solid fa-trash" className="text-xs" />
        </button>
      </div>
      <div className="space-y-2">
        {(section.fields || []).map((f, idx) => (
          <FieldEditor key={f.id || idx} field={f} onChange={(updated) => updateField(idx, updated)} onDelete={() => deleteField(idx)} />
        ))}
      </div>
      <button type="button" onClick={addField} className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">
        <FaIcon icon="fa-solid fa-plus" /> Add Field
      </button>
    </div>
  );
}

function LetterheadEditor({ letterhead, onChange }) {
  const set = (key, value) => onChange({ ...letterhead, [key]: value });
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-sm text-slate-800">Brand & clinic identity</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Primary brand colour</span>
            <div className="flex gap-2">
              <input type="color" value={letterhead.primary_color || '#0d9488'} onChange={(e) => set('primary_color', e.target.value)} className="h-9 w-12 rounded border" />
              <input className="flex-1 border rounded-lg px-2 py-1.5 text-sm" value={letterhead.primary_color || ''} onChange={(e) => set('primary_color', e.target.value)} />
            </div>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Logo URL</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://… or clinic branding logo" />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-slate-500">Clinic name</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm font-semibold" value={letterhead.clinic_name || ''} onChange={(e) => set('clinic_name', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Tagline</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.tagline || ''} onChange={(e) => set('tagline', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Branch / location</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.branch_name || ''} onChange={(e) => set('branch_name', e.target.value)} />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-slate-500">Full address</span>
            <textarea rows={2} className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.address || ''} onChange={(e) => set('address', e.target.value)} />
          </label>
          {[['phone','Phone'],['whatsapp','WhatsApp'],['email','Email'],['website','Website'],['registration_no','Registration No'],['gstin','GST No']].map(([k, label]) => (
            <label key={k} className="text-xs space-y-1">
              <span className="text-slate-500">{label}</span>
              <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead[k] || ''} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-sm text-slate-800">Form identity</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-slate-500">Form title</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm font-semibold" value={letterhead.form_title || ''} onChange={(e) => set('form_title', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Subtitle</span>
            <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.subtitle || 'Initial Evaluation'} onChange={(e) => set('subtitle', e.target.value)}>
              {SUBTITLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Department</span>
            <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.department || DEPT_OPTIONS[0]} onChange={(e) => set('department', e.target.value)}>
              {DEPT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Form code</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.form_code || ''} onChange={(e) => set('form_code', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Version</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.form_version || ''} onChange={(e) => set('form_version', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Revision date</span>
            <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.revision_date || ''} onChange={(e) => set('revision_date', e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Language</span>
            <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.language || 'English'} onChange={(e) => set('language', e.target.value)}>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-sm text-slate-800">Consent & disclaimer</h3>
        <label className="text-xs space-y-1 block">
          <span className="text-slate-500">Patient consent text</span>
          <textarea rows={3} className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.consent_text || ''} onChange={(e) => set('consent_text', e.target.value)} />
        </label>
        <label className="text-xs space-y-1 block">
          <span className="text-slate-500">DPDP disclaimer</span>
          <textarea rows={2} className="w-full border rounded-lg px-2 py-1.5 text-sm" value={letterhead.disclaimer || ''} onChange={(e) => set('disclaimer', e.target.value)} />
        </label>
      </div>
    </div>
  );
}

function PreviewBody({ schema }) {
  return (
    <div className="space-y-4">
      {schema.filter((s) => s.visible !== false).map((section) => (
        <section key={section.id} className="border-b border-slate-100 pb-4">
          <h3 className="font-semibold text-sm text-slate-900 mb-2">{section.title}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {(section.fields || []).map((field) => (
              <div key={field.id} className={field.type === 'textarea' || field.type === 'image' || field.type === 'display' ? 'sm:col-span-2' : ''}>
                {field.type !== 'checkbox' && (
                  <p className="text-[11px] font-medium text-slate-500 mb-1">
                    {field.label}{field.required ? ' *' : ''}
                  </p>
                )}
                {field.type === 'display' && <p className="text-sm italic text-slate-600">{field.label}</p>}
                {field.type === 'textarea' && <div className="h-16 rounded-lg border border-dashed border-slate-200 bg-slate-50" />}
                {field.type === 'image' && (
                  <div className="h-28 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                    <FaIcon icon="fa-solid fa-image" className="text-lg" />
                    Image upload
                  </div>
                )}
                {field.type === 'signature' && (
                  <div className="h-14 rounded-lg border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center">
                    Signature pad
                  </div>
                )}
                {field.type === 'checkbox' && (
                  <label className="text-sm flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 border rounded" />{field.label}</label>
                )}
                {!['display','textarea','image','signature','checkbox'].includes(field.type) && (
                  <div className="h-9 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Main AssessmentBuilder ─────────────────────────────────────────────────
export default function AssessmentBuilder({ clinicId, templateId, onSaved }) {
  const [schema, setSchema]     = useState(DEFAULT_SECTIONS);
  const [name, setName]         = useState('New Assessment');
  const [status, setStatus]     = useState('draft');
  const [letterhead, setLetterhead] = useState(() => defaultLetterhead());
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(!!templateId);
  const [tab, setTab]           = useState('builder'); // builder | letterhead | preview | versions

  const load = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await erpAssessments.getTemplate(templateId, clinicId ? { clinic_id: clinicId } : undefined);
      const d   = res.data || res;
      setName(d.name);
      setStatus(d.status);
      setSchema(Array.isArray(d.schema) ? d.schema : DEFAULT_SECTIONS);
      setLetterhead(defaultLetterhead(d.letterhead || {}));
    } catch { toast.error('Could not load template'); }
    finally { setLoading(false); }
  }, [templateId, clinicId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clinicId || templateId) return;
    clinicPortal.getBranding(clinicId)
      .then((res) => {
        const b = res.data || res || {};
        setLetterhead((prev) => defaultLetterhead({
          ...prev,
          clinic_name: b.clinic_name || b.name || prev.clinic_name,
          tagline: b.tagline || prev.tagline,
          branch_name: b.branch_name || prev.branch_name,
          logo_url: b.logo_url || prev.logo_url,
          primary_color: b.primary_color || prev.primary_color,
          phone: b.phone || prev.phone,
          email: b.email || prev.email,
          address: b.address || prev.address,
          website: b.website || prev.website,
          gstin: b.gstin || prev.gstin,
        }));
      })
      .catch(() => {});
  }, [clinicId, templateId]);

  const clinicParams = clinicId ? { clinic_id: clinicId } : undefined;

  const save = async (newStatus) => {
    const s = newStatus || status;
    setSaving(true);
    try {
      const payload = { name, status: s, schema, letterhead };
      if (templateId) {
        await erpAssessments.updateTemplate(templateId, payload, clinicParams);
        toast.success(s === 'published' ? 'Published!' : 'Saved');
        onSaved?.(templateId);
        if (s === 'published') setStatus('published');
        else if (newStatus) setStatus(newStatus);
        await load();
      } else {
        const res = await erpAssessments.createTemplate(payload, clinicParams);
        const newId = res.id || res.data?.id;
        toast.success('Template created');
        onSaved?.(newId);
        if (newStatus) setStatus(newStatus);
      }
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

  const moveSection = (idx, direction) => {
    setSchema((prev) => {
      const next = [...prev];
      const target = idx + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  if (loading) return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />;

  const TABS = [
    { id: 'builder', label: 'Form builder' },
    { id: 'letterhead', label: 'Letterhead & Branding' },
    { id: 'preview', label: 'Live print preview' },
    ...(templateId ? [{ id: 'versions', label: 'Version History' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            className="font-bold text-lg border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none bg-transparent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name…"
          />
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-sm px-3 py-1.5 rounded-t-lg font-medium transition-colors ${tab === t.id ? 'bg-white border border-b-0 border-slate-200 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
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
              onMoveUp={() => moveSection(idx, -1)}
              onMoveDown={() => moveSection(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === schema.length - 1}
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

      {tab === 'letterhead' && (
        <LetterheadEditor letterhead={letterhead} onChange={setLetterhead} />
      )}

      {tab === 'preview' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2" data-print-hide>
            <button
              type="button"
              className="btn-outline text-sm !py-1.5 inline-flex items-center gap-1.5"
              onClick={() => window.print()}
            >
              <FaIcon icon="fa-solid fa-print" className="text-xs" />
              Print preview
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <AssessmentFormChrome
              letterhead={letterhead}
              mode="preview"
              patient={{
                name: 'Rahul Sharma',
                id_code: 'TUP-2026-00847',
                dob: '1990-03-12',
                gender: 'Male',
                blood_group: 'B+',
              }}
              visit={{ type: 'New', mode: 'Clinic', number: '1 of 18', assessment_date: new Date().toISOString() }}
              physio={{ name: 'Dr. Priya Menon', qualification: 'MPT', specialization: 'Ortho' }}
              digitalRecordUrl="https://theurbanphysio.com"
            >
              <PreviewBody schema={schema} />
            </AssessmentFormChrome>
          </div>
        </div>
      )}

      {tab === 'versions' && templateId && (
        <VersionHistory templateId={templateId} clinicId={clinicId} />
      )}
    </div>
  );
}

function VersionHistory({ templateId, clinicId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const clinicParams = clinicId ? { clinic_id: clinicId } : undefined;

  useEffect(() => {
    erpAssessments.getVersionHistory(templateId, clinicParams)
      .then((r) => setVersions(r.data || r || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId, clinicId]);

  const restore = async (versionId) => {
    if (!window.confirm('Restore this version?')) return;
    try {
      await erpAssessments.restoreVersion(templateId, versionId, clinicParams);
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
