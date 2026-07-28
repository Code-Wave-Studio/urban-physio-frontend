import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import AssessmentQuestionsEditor from '../../components/clinic/AssessmentQuestionsEditor';
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
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Group assessment rows by name; active first, then version DESC. */
function groupAssessments(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = (row.name || 'Untitled').trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return Array.from(map.entries()).map(([key, versions]) => {
    const sorted = [...versions].sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
    const active = sorted.find((v) => Number(v.is_active) === 1) || null;
    return {
      key,
      name: sorted[0]?.name || 'Untitled',
      active,
      versions: sorted,
    };
  });
}

export default function ClinicClinicalLibraryPage() {
  const { clinicId, can, loading: boot } = useClinicPortal();
  const [tab, setTab] = useState('diagnosis');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [clinicId, tab]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const assessmentGroups = useMemo(
    () => (tab === 'assessment' ? groupAssessments(rows) : []),
    [tab, rows]
  );

  const reset = () => {
    setEditing(null);
    setViewingVersion(null);
    setName('');
    setDescription('');
    setFields([]);
    setShowHistory(false);
  };

  const editActive = (group) => {
    const row = group.active;
    if (!row) {
      toast.error('No active version to edit — create a new template');
      return;
    }
    setEditing(row.id);
    setViewingVersion(null);
    setName(row.name || '');
    setDescription('');
    setFields(parseFields(row.fields || row.fields_json).map((f, i) => ({
      key: f.key || `field_${i}_${Date.now()}`,
      label: f.label || '',
      type: f.type || 'text',
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : [],
    })));
    setShowHistory(true);
  };

  const viewPast = (row) => {
    setEditing(null);
    setViewingVersion(row);
    setName(row.name || '');
    setFields(parseFields(row.fields || row.fields_json).map((f, i) => ({
      key: f.key || `field_${i}`,
      label: f.label || '',
      type: f.type || 'text',
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : [],
    })));
    setShowHistory(true);
  };

  const startNew = () => {
    reset();
    setName('');
    setFields([]);
  };

  const editLibrary = (row) => {
    setEditing(row.id);
    setViewingVersion(null);
    setName(row.name || row.label || '');
    setDescription(row.description || '');
    setFields([]);
  };

  const save = async (event) => {
    event.preventDefault();
    if (viewingVersion) {
      toast('Past versions are read-only. Edit the active version to publish a new one.');
      return;
    }
    setSaving(true);
    try {
      if (tab === 'assessment') {
        const payload = {
          name: name.trim(),
          fields: fields.map((f, i) => ({
            key: f.key || `field_${i}`,
            label: f.label,
            type: f.type || 'text',
            required: Boolean(f.required),
            options: f.options || [],
            sort_order: i,
          })),
          is_active: true,
        };
        if (!payload.fields.length) {
          toast.error('Add at least one assessment question');
          setSaving(false);
          return;
        }
        if (editing) {
          // Field changes on active template → backend creates a NEW version
          const res = await clinicPortal.updateAssessmentTemplate(clinicId, editing, payload);
          const created = res?.data || res;
          toast.success(
            created?.version
              ? `New version v${created.version} published — past responses stay on old version`
              : 'New assessment version published'
          );
        } else {
          await clinicPortal.saveAssessmentTemplate(clinicId, payload);
          toast.success('Assessment template created (v1)');
        }
      } else {
        const payload = { type: tab, name, description, is_active: true };
        if (editing) await clinicPortal.updateLibraryEntry(clinicId, editing, payload);
        else await clinicPortal.createLibraryEntry(clinicId, payload);
        toast.success(editing ? 'Entry updated' : 'Entry created');
      }
      reset();
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (tab === 'assessment') {
      if (!window.confirm(`Archive "${row.name}" v${row.version || 1}? New intakes will stop using it.`)) return;
      try {
        await clinicPortal.updateAssessmentTemplate(clinicId, row.id, { is_active: false });
        toast.success('Template archived');
        if (editing === row.id || viewingVersion?.id === row.id) reset();
        load();
      } catch (error) {
        toast.error(error.message || 'Could not archive template');
      }
      return;
    }
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await clinicPortal.deleteLibraryEntry(clinicId, row.id);
      toast.success('Entry deleted');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not delete entry');
    }
  };

  const readOnly = Boolean(viewingVersion);

  const canManageLibrary = can('clinical_library.manage');
  const canManageAssessments = can('assessments.manage');

  if (!boot && !(canManageLibrary || can('clinical_library.view') || canManageAssessments || can('profile.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  return (
    <ClinicPortalShell
      title="Clinical Library"
      subtitle="Custom diagnoses, symptoms, treatment types and versioned assessment templates"
    >
      <div className="portal-tabs mb-4">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); reset(); }}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'assessment' && (
        <div className="glass-card !p-4 mb-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Versioning rule</p>
          <p className="text-xs mt-1">
            Editing an active template and saving publishes a <strong>new version</strong>.
            Past patient assessment responses stay linked to the old version and are never overwritten.
            Drag the grip handle to reorder questions for new intakes only.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] gap-4 sm:gap-5">
        <section className="glass-card !p-0 overflow-hidden order-2 lg:order-1 min-w-0">
          {loading ? (
            <div className="h-56 m-4 bg-slate-100 rounded-xl animate-pulse" />
          ) : tab === 'assessment' ? (
            <div className="divide-y divide-slate-100">
              {assessmentGroups.map((group) => (
                <div key={group.key} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <FaIcon icon="fa-clipboard-list" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{group.name}</p>
                        {group.active ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                            Active v{group.active.version || 1}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            No active version
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {group.active
                          ? `${parseFields(group.active.fields_json).length} questions · ${group.versions.length} version${group.versions.length === 1 ? '' : 's'} total`
                          : `${group.versions.length} archived version${group.versions.length === 1 ? '' : 's'}`}
                      </p>
                      {group.versions.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.versions.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => (Number(v.is_active) ? editActive(group) : viewPast(v))}
                              className={`text-[10px] font-semibold rounded-full px-2 py-1 border ${
                                Number(v.is_active)
                                  ? 'border-teal-200 bg-teal-50 text-teal-800'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                              title={Number(v.is_active) ? 'Edit active (creates new version on save)' : 'View past version (read-only)'}
                            >
                              v{v.version || 1}{Number(v.is_active) ? ' · edit' : ' · view'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {group.active && canManageAssessments && (
                        <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => editActive(group)}>
                          Edit active
                        </button>
                      )}
                      {group.active && canManageAssessments && (
                        <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => remove(group.active)}>
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!assessmentGroups.length && (
                <div className="py-12 text-center text-sm text-slate-500">No assessment templates yet.</div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-book-medical" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{row.name || row.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{row.description || 'Clinic library entry'}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {canManageLibrary && <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => editLibrary(row)}>Edit</button>}
                    {canManageLibrary && <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => remove(row)}>Delete</button>}
                  </div>
                </div>
              ))}
              {!rows.length && <div className="py-12 text-center text-sm text-slate-500">No entries in this category.</div>}
            </div>
          )}
        </section>

        <form onSubmit={save} className="glass-card !p-4 sm:!p-5 space-y-4 self-start order-1 lg:order-2 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="font-bold">
                {tab === 'assessment'
                  ? (viewingVersion
                    ? `Past version v${viewingVersion.version || 1}`
                    : editing
                      ? 'Edit active → publish new version'
                      : 'New assessment template')
                  : `${editing ? 'Edit' : 'Add'} ${TABS.find(([id]) => id === tab)?.[1]}`}
              </h2>
              {tab === 'assessment' && viewingVersion && (
                <p className="text-[11px] text-amber-700 mt-1">Read-only · patient answers on this version are preserved</p>
              )}
              {tab === 'assessment' && editing && !viewingVersion && (
                <p className="text-[11px] text-teal-700 mt-1">Save will create version {(rows.find((r) => r.id === editing)?.version || 1) + 1}</p>
              )}
            </div>
            {(editing || viewingVersion) && (
              <button type="button" className="text-xs text-slate-500 shrink-0" onClick={startNew}>
                {tab === 'assessment' ? 'New template' : 'Cancel'}
              </button>
            )}
          </div>

          <label className="block text-sm font-medium">
            Name
            <input
              className="input-field mt-1"
              required
              disabled={readOnly || (tab === 'assessment' ? !canManageAssessments : !canManageLibrary)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          {tab !== 'assessment' ? (
            <label className="block text-sm font-medium">
              Description
              <textarea className="input-field mt-1" rows={4} value={description} disabled={!canManageLibrary} onChange={(e) => setDescription(e.target.value)} />
            </label>
          ) : (
            <>
              <AssessmentQuestionsEditor
                fields={fields}
                onChange={setFields}
                readOnly={readOnly || !canManageAssessments}
              />
              {showHistory && editing && !viewingVersion && (
                <p className="text-[11px] text-slate-400">
                  Tip: use version chips on the left to open past versions without changing them.
                </p>
              )}
            </>
          )}

          {!readOnly && (tab === 'assessment' ? canManageAssessments : canManageLibrary) ? (
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving
                ? 'Saving…'
                : tab === 'assessment' && editing
                  ? 'Publish new version'
                  : 'Save'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-outline w-full justify-center"
              onClick={() => {
                const group = assessmentGroups.find((g) =>
                  g.versions.some((v) => v.id === viewingVersion.id)
                );
                if (group?.active) editActive(group);
                else toast.error('No active version to edit');
              }}
            >
              Switch to active version editor
            </button>
          )}
        </form>
      </div>
    </ClinicPortalShell>
  );
}
