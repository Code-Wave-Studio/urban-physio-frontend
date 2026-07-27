import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const TABS = [
  ['diagnosis', 'Diagnosis'],
  ['symptom', 'Symptoms'],
  ['treatment', 'Treatments'],
  ['assessment', 'Assessment Templates'],
];

const parseFields = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
};

export default function ClinicClinicalLibraryPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [tab, setTab] = useState('diagnosis');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = tab === 'assessment'
        ? await clinicPortal.assessmentTemplates(clinicId)
        : await clinicPortal.clinicalLibrary(clinicId, { type: tab });
      setRows(res.data || res || []);
    } catch (error) {
      toast.error(error.message || 'Could not load clinical library');
      setRows([]);
    } finally { setLoading(false); }
  }, [clinicId, tab]);

  useEffect(() => { if (clinicId) load(); }, [clinicId, load]);

  const reset = () => { setEditing(null); setName(''); setDescription(''); setFields([]); };

  const edit = (row) => {
    setEditing(row.id);
    setName(row.name || row.label || '');
    setDescription(row.description || '');
    setFields(parseFields(row.fields || row.fields_json));
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      if (tab === 'assessment') {
        const payload = { name, fields, is_active: true };
        if (editing) await clinicPortal.updateAssessmentTemplate(clinicId, editing, payload);
        else await clinicPortal.saveAssessmentTemplate(clinicId, payload);
      } else {
        const payload = { type: tab, name, description, is_active: true };
        if (editing) await clinicPortal.updateLibraryEntry(clinicId, editing, payload);
        else await clinicPortal.createLibraryEntry(clinicId, payload);
      }
      toast.success(editing ? 'Entry updated' : 'Entry created');
      reset(); load();
    } catch (error) { toast.error(error.message || 'Could not save entry'); }
  };

  const remove = async (row) => {
    if (tab === 'assessment') {
      try { await clinicPortal.updateAssessmentTemplate(clinicId, row.id, { name: row.name, fields: parseFields(row.fields_json), is_active: false }); toast.success('Template archived'); load(); }
      catch (error) { toast.error(error.message || 'Could not archive template'); }
      return;
    }
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try { await clinicPortal.deleteLibraryEntry(clinicId, row.id); toast.success('Entry deleted'); load(); }
    catch (error) { toast.error(error.message || 'Could not delete entry'); }
  };

  const addField = () => setFields((old) => [...old, { key: `field_${Date.now()}`, label: '', type: 'text', required: false }]);
  const moveField = (index, direction) => setFields((old) => {
    const next = [...old];
    const target = index + direction;
    if (target < 0 || target >= next.length) return old;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  if (!boot && (!isAdminMode || !(can('clinical_library.manage') || can('clinical_library.view') || can('assessments.manage') || can('profile.manage')))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  return (
    <ClinicPortalShell
      title="Clinical Library"
      subtitle="Custom diagnoses, symptoms, treatment types and assessment templates"
    >
      <div className="flex gap-2 overflow-x-auto mb-4">{TABS.map(([id, label]) => <button key={id} type="button" onClick={() => { setTab(id); reset(); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${tab === id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
      <div className="grid lg:grid-cols-[1fr_420px] gap-5">
        <section className="glass-card !p-0 overflow-hidden">
          {loading ? <div className="h-56 m-4 bg-slate-100 rounded-xl animate-pulse" /> : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.id} className="p-4 flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><FaIcon icon={tab === 'assessment' ? 'fa-clipboard-list' : 'fa-book-medical'} /></span>
                  <div className="flex-1"><p className="font-semibold text-slate-900">{row.name || row.label}</p><p className="text-xs text-slate-500 mt-1">{row.description || (tab === 'assessment' ? `${parseFields(row.fields_json).length} questions · version ${row.version || 1}` : 'Clinic library entry')}</p></div>
                  <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => edit(row)}>Edit</button>
                  <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => remove(row)}>{tab === 'assessment' ? 'Archive' : 'Delete'}</button>
                </div>
              ))}
              {!rows.length && <div className="py-12 text-center text-sm text-slate-500">No entries in this category.</div>}
            </div>
          )}
        </section>
        <form onSubmit={save} className="glass-card !p-5 space-y-4 self-start">
          <div className="flex justify-between"><h2 className="font-bold">{editing ? 'Edit' : 'Add'} {TABS.find(([id]) => id === tab)?.[1]}</h2>{editing && <button type="button" className="text-xs text-slate-500" onClick={reset}>Cancel</button>}</div>
          <label className="block text-sm font-medium">Name<input className="input-field mt-1" required value={name} onChange={(e) => setName(e.target.value)} /></label>
          {tab !== 'assessment' ? <label className="block text-sm font-medium">Description<textarea className="input-field mt-1" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></label> : (
            <section>
              <div className="flex justify-between items-center mb-2"><p className="text-sm font-medium">Assessment fields</p><button type="button" className="text-xs font-semibold text-teal-700" onClick={addField}><FaIcon icon="fa-plus" className="mr-1" />Add field</button></div>
              <div className="space-y-2 max-h-[430px] overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={field.key || index} className="rounded-xl border border-slate-100 p-3 space-y-2">
                    <div className="flex gap-2"><input className="input-field text-sm flex-1" placeholder="Question / label" required value={field.label || ''} onChange={(e) => setFields((old) => old.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /><select className="input-field text-xs !w-28" value={field.type || 'text'} onChange={(e) => setFields((old) => old.map((item, i) => i === index ? { ...item, type: e.target.value } : item))}><option value="text">Text</option><option value="textarea">Long text</option><option value="number">Number</option><option value="yesno">Yes / No</option><option value="dropdown">Dropdown</option></select></div>
                    <div className="flex items-center justify-between"><label className="text-xs"><input type="checkbox" className="mr-1" checked={Boolean(field.required)} onChange={(e) => setFields((old) => old.map((item, i) => i === index ? { ...item, required: e.target.checked } : item))} />Required</label><div className="flex gap-1"><button type="button" aria-label="Move up" disabled={index === 0} onClick={() => moveField(index, -1)} className="w-7 h-7 rounded bg-slate-100 disabled:opacity-30"><FaIcon icon="fa-arrow-up" /></button><button type="button" aria-label="Move down" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)} className="w-7 h-7 rounded bg-slate-100 disabled:opacity-30"><FaIcon icon="fa-arrow-down" /></button><button type="button" aria-label="Remove" onClick={() => setFields((old) => old.filter((_, i) => i !== index))} className="w-7 h-7 rounded bg-rose-50 text-rose-600"><FaIcon icon="fa-trash" /></button></div></div>
                  </div>
                ))}
                {!fields.length && <p className="text-xs text-slate-400 text-center py-6">Add the first assessment field.</p>}
              </div>
            </section>
          )}
          <button type="submit" className="btn-primary w-full justify-center">Save</button>
        </form>
      </div>
    </ClinicPortalShell>
  );
}
