import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

export default function ClinicCreatePackagePage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const initial = { name: '', description: '', total_sessions: 6, duration_days: 30, price: 0, included_modes: ['clinic'], is_active: true };
  const [form, setForm] = useState(initial);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.packageTemplates(clinicId);
      setRows(res.data || res || []);
    } catch (error) {
      toast.error(error.message || 'Could not load package templates');
    } finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { if (clinicId) load(); }, [clinicId, load]);

  if (!boot && (!isAdminMode || !can('packages.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const edit = (row) => {
    let modes = row.included_modes_json;
    try { modes = JSON.parse(modes || '[]'); } catch { modes = []; }
    setEditing(row.id);
    setForm({ name: row.name || '', description: row.description || '', total_sessions: row.total_sessions || 1, duration_days: row.duration_days || 30, price: row.price || 0, included_modes: modes || [], is_active: Boolean(Number(row.is_active)) });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, total_sessions: Number(form.total_sessions), duration_days: Number(form.duration_days), price: Number(form.price), mode_prices: Object.fromEntries(form.included_modes.map((mode) => [mode, Number(form.price)])) };
      if (editing) await clinicPortal.updatePackageTemplate(clinicId, editing, payload);
      else await clinicPortal.createPackageTemplate(clinicId, payload);
      toast.success(editing ? 'Package template updated' : 'Package template created');
      setEditing(null);
      setForm(initial);
      load();
    } catch (error) { toast.error(error.message || 'Could not save template'); }
    finally { setSaving(false); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? Existing assigned packages are not affected.`)) return;
    try { await clinicPortal.deletePackageTemplate(clinicId, row.id); toast.success('Template deleted'); load(); }
    catch (error) { toast.error(error.message || 'Could not delete template'); }
  };

  return (
    <ClinicPortalShell
      title="Create Package"
      subtitle="Build reusable multi-session treatment packages"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)] gap-4 sm:gap-5">
        <section className="glass-card !p-0 overflow-hidden order-2 lg:order-1">
          <div className="px-4 sm:px-5 py-4 border-b"><h2 className="font-bold">Package catalog</h2></div>
          {loading ? <div className="h-48 m-4 bg-slate-100 rounded-xl animate-pulse" /> : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{row.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${Number(row.is_active) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{Number(row.is_active) ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{row.total_sessions} sessions · {row.duration_days} days · ₹{Number(row.price || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{row.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => edit(row)}><FaIcon icon="fa-pen" className="mr-1" />Edit</button>
                    <button type="button" className="text-xs font-semibold text-rose-600 px-2" onClick={() => remove(row)}>Delete</button>
                  </div>
                </div>
              ))}
              {!rows.length && <div className="py-12 text-center text-sm text-slate-500">No templates yet. Create your first package.</div>}
            </div>
          )}
        </section>
        <form onSubmit={save} className="glass-card !p-4 sm:!p-5 space-y-4 self-start lg:sticky lg:top-4 order-1 lg:order-2">
          <div className="flex justify-between gap-2"><h2 className="font-bold">{editing ? 'Edit package' : 'New package'}</h2>{editing && <button type="button" className="text-xs text-slate-500 shrink-0" onClick={() => { setEditing(null); setForm(initial); }}>Cancel edit</button>}</div>
          <label className="block text-sm font-medium">Name<input className="input-field mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="14-day back rehab" /></label>
          <label className="block text-sm font-medium">Description<textarea className="input-field mt-1" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-medium">Sessions<input type="number" min="1" max="365" className="input-field mt-1" required value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} /></label>
            <label className="text-xs font-medium">Valid days<input type="number" min="1" className="input-field mt-1" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></label>
            <label className="text-xs font-medium">Price ₹<input type="number" min="0" step="0.01" className="input-field mt-1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          </div>
          <fieldset><legend className="text-sm font-medium mb-2">Included modes</legend><div className="flex flex-wrap gap-2">{[['clinic', 'Clinic'], ['home_visit', 'Home visit'], ['online', 'Online']].map(([mode, label]) => <label key={mode} className={`px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer ${form.included_modes.includes(mode) ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200'}`}><input type="checkbox" className="mr-2" checked={form.included_modes.includes(mode)} onChange={() => setForm({ ...form, included_modes: form.included_modes.includes(mode) ? form.included_modes.filter((m) => m !== mode) : [...form.included_modes, mode] })} />{label}</label>)}</div></fieldset>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Available for assignment</label>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update package' : 'Create package'}</button>
        </form>
      </div>
    </ClinicPortalShell>
  );
}
