import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

export default function ClinicFormsPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.registrationFields(clinicId);
      setFields((res.data || res || []).map((field) => ({ ...field, is_enabled: Boolean(Number(field.is_enabled)), is_required: Boolean(Number(field.is_required)) })));
    } catch (error) { toast.error(error.message || 'Could not load form fields'); }
    finally { setLoading(false); }
  }, [clinicId]);
  useEffect(() => { if (clinicId) load(); }, [clinicId, load]);

  if (!boot && (!isAdminMode || !can('forms.manage'))) return <Navigate to="/clinic-portal" replace />;

  const update = (index, values) => setFields((old) => old.map((field, i) => i === index ? { ...field, ...values } : field));
  const move = (index, direction) => setFields((old) => {
    const target = index + direction;
    if (target < 0 || target >= old.length) return old;
    const next = [...old];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const add = () => setFields((old) => [...old, { field_key: `custom_${Date.now()}`, label: 'Custom field', field_type: 'text', is_enabled: true, is_required: false, is_locked: false }]);
  const remove = (index) => {
    const field = fields[index];
    if (Number(field.is_locked)) return;
    setFields((old) => old.filter((_, i) => i !== index));
  };
  const parseOptions = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (raw == null || raw === '') return [];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          /* fall through */
        }
      }
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const save = async () => {
    setSaving(true);
    try {
      await clinicPortal.saveRegistrationFields(clinicId, {
        fields: fields.map((field, index) => ({
          ...field,
          sort_order: index,
          options: parseOptions(field.options ?? field.options_json),
        })),
      });
      toast.success('Registration form saved');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClinicPortalShell
      title="Registration Forms"
      subtitle="Choose the details patients provide through your intake QR"
      actions={(
        <div className="portal-page-actions">
          <Link to="/clinic-portal/clinical-library" className="btn-outline inline-flex items-center gap-2">
            <FaIcon icon="fa-clipboard-list" />
            <span className="hidden sm:inline">Assessment templates</span>
            <span className="sm:hidden">Templates</span>
          </Link>
        </div>
      )}
    >
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="min-w-0">
            <h2 className="font-bold">Intake fields</h2>
            <p className="text-xs text-slate-500">Locked system fields remain enabled and required.</p>
          </div>
          <button type="button" className="btn-primary text-xs !py-2 w-full sm:w-auto" onClick={add}>
            <FaIcon icon="fa-plus" className="mr-1" />Custom field
          </button>
        </div>
        {boot || loading ? <div className="h-64 m-4 rounded-xl bg-slate-100 animate-pulse" /> : (
          <div className="divide-y divide-slate-100">
            {fields.map((field, index) => (
              <div key={field.id || field.field_key} className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_150px_auto_auto_auto] gap-3 items-stretch sm:items-center">
                <input className="input-field sm:col-span-2 lg:col-span-1" value={field.label || ''} disabled={Boolean(Number(field.is_locked))} onChange={(e) => update(index, { label: e.target.value })} />
                <select className="input-field text-sm" disabled={Boolean(field.id)} value={field.field_type || 'text'} onChange={(e) => update(index, { field_type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="textarea">Long text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="yesno">Yes / No</option>
                </select>
                <div className="flex flex-wrap gap-3 sm:contents">
                  <label className="text-xs flex items-center gap-1.5"><input type="checkbox" disabled={Boolean(Number(field.is_locked))} checked={field.is_enabled} onChange={(e) => update(index, { is_enabled: e.target.checked })} />Enabled</label>
                  <label className="text-xs flex items-center gap-1.5"><input type="checkbox" disabled={Boolean(Number(field.is_locked))} checked={field.is_required} onChange={(e) => update(index, { is_required: e.target.checked })} />Required</label>
                </div>
                <div className="flex justify-start sm:justify-end gap-1">
                  <button type="button" aria-label="Move up" disabled={index === 0} className="w-9 h-9 rounded bg-slate-100 disabled:opacity-30" onClick={() => move(index, -1)}><FaIcon icon="fa-arrow-up" /></button>
                  <button type="button" aria-label="Move down" disabled={index === fields.length - 1} className="w-9 h-9 rounded bg-slate-100 disabled:opacity-30" onClick={() => move(index, 1)}><FaIcon icon="fa-arrow-down" /></button>
                  <button type="button" aria-label="Delete" disabled={Boolean(Number(field.is_locked))} className="w-9 h-9 rounded bg-rose-50 text-rose-600 disabled:opacity-30" onClick={() => remove(index)}><FaIcon icon="fa-trash" /></button>
                </div>
                {['dropdown', 'multiselect'].includes(field.field_type) && (
                  <input
                    className="input-field sm:col-span-2 lg:col-span-5 text-sm"
                    placeholder="Options, separated by commas"
                    value={Array.isArray(parseOptions(field.options_json)) ? parseOptions(field.options_json).join(', ') : (field.options_json || '')}
                    onChange={(e) => update(index, { options_json: e.target.value, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <div className="p-3 sm:p-4 border-t bg-slate-50 flex justify-stretch sm:justify-end">
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={saving || loading} onClick={save}>{saving ? 'Saving…' : 'Save form'}</button>
        </div>
      </div>
    </ClinicPortalShell>
  );
}
