import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const INITIAL = {
  name: '',
  description: '',
  total_sessions: 6,
  duration_days: 30,
  price: 0,
  included_modes: ['clinic'],
  is_active: true,
};

function parseModes(row) {
  let modes = row.included_modes_json ?? row.included_modes;
  if (typeof modes === 'string') {
    try {
      modes = JSON.parse(modes || '[]');
    } catch {
      modes = [];
    }
  }
  return Array.isArray(modes) ? modes : [];
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ClinicCreatePackagePage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [filter, setFilter] = useState('active'); // active | archived | all
  const [q, setQ] = useState('');
  const [form, setForm] = useState(INITIAL);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.packageTemplates(clinicId);
      setRows(res.data || res || []);
    } catch (error) {
      toast.error(error.message || 'Could not load package templates');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      const active = Boolean(Number(row.is_active));
      if (filter === 'active' && !active) return false;
      if (filter === 'archived' && active) return false;
      if (!needle) return true;
      return (
        String(row.name || '').toLowerCase().includes(needle) ||
        String(row.description || '').toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, q]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => Number(r.is_active)).length,
      archived: rows.filter((r) => !Number(r.is_active)).length,
    }),
    [rows]
  );

  if (!boot && (!isAdminMode || !can('packages.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const resetForm = () => {
    setEditing(null);
    setForm(INITIAL);
  };

  const edit = (row) => {
    setEditing(row.id);
    setForm({
      name: row.name || '',
      description: row.description || '',
      total_sessions: row.total_sessions || 1,
      duration_days: row.duration_days || 30,
      price: row.price || 0,
      included_modes: parseModes(row),
      is_active: Boolean(Number(row.is_active)),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicate = (row) => {
    setEditing(null);
    setForm({
      name: `${row.name || 'Package'} (Copy)`,
      description: row.description || '',
      total_sessions: row.total_sessions || 1,
      duration_days: row.duration_days || 30,
      price: row.price || 0,
      included_modes: parseModes(row).length ? parseModes(row) : ['clinic'],
      is_active: true,
    });
    toast.success('Duplicated into the form — review and create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.included_modes.length) {
      toast.error('Select at least one included mode');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_sessions: Number(form.total_sessions),
        duration_days: Number(form.duration_days),
        price: Number(form.price),
        mode_prices: Object.fromEntries(form.included_modes.map((mode) => [mode, Number(form.price)])),
      };
      if (editing) await clinicPortal.updatePackageTemplate(clinicId, editing, payload);
      else await clinicPortal.createPackageTemplate(clinicId, payload);
      toast.success(editing ? 'Package template updated' : 'Package template created');
      resetForm();
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (row) => {
    if (!window.confirm(`Archive "${row.name}"? It will hide from new assignments. Existing patient packages stay unchanged.`)) {
      return;
    }
    setActingId(row.id);
    try {
      // Backend DELETE soft-deactivates (is_active=0)
      await clinicPortal.deletePackageTemplate(clinicId, row.id);
      toast.success('Package archived');
      if (editing === row.id) resetForm();
      load();
    } catch (error) {
      toast.error(error.message || 'Could not archive');
    } finally {
      setActingId(null);
    }
  };

  const restore = async (row) => {
    setActingId(row.id);
    try {
      await clinicPortal.updatePackageTemplate(clinicId, row.id, { is_active: true });
      toast.success('Package restored to catalog');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not restore');
    } finally {
      setActingId(null);
    }
  };

  return (
    <ClinicPortalShell
      title="Package Catalog"
      subtitle="Create, edit, duplicate and archive reusable multi-session packages"
      actions={
        <div className="portal-page-actions">
          <Link to="/clinic-portal/packages" className="btn-outline inline-flex items-center gap-2">
            <FaIcon icon="fa-box-open" />
            <span className="hidden sm:inline">Assigned packages</span>
            <span className="sm:hidden">Assigned</span>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] gap-4 sm:gap-5">
        <section className="glass-card !p-0 overflow-hidden order-2 lg:order-1">
          <div className="px-4 sm:px-5 py-4 border-b space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Catalog</h2>
              <p className="text-xs text-slate-500">
                {counts.active} active · {counts.archived} archived
              </p>
            </div>
            <div className="portal-tabs">
              {[
                ['active', `Active (${counts.active})`],
                ['archived', `Archived (${counts.archived})`],
                ['all', `All (${counts.all})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    filter === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="input-field text-sm"
              placeholder="Search packages…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="h-48 m-4 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const active = Boolean(Number(row.is_active));
                const modes = parseModes(row);
                return (
                  <div key={row.id} className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{row.name}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {active ? 'Active' : 'Archived'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {row.total_sessions} sessions · {row.duration_days} days · {money(row.price)}
                      </p>
                      {modes.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1 capitalize">
                          Modes: {modes.map((m) => String(m).replace(/_/g, ' ')).join(', ')}
                        </p>
                      )}
                      {row.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{row.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => edit(row)}>
                        <FaIcon icon="fa-pen" className="mr-1" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-outline text-xs !py-1.5"
                        onClick={() => duplicate(row)}
                      >
                        <FaIcon icon="fa-copy" className="mr-1" />
                        Duplicate
                      </button>
                      {active ? (
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          className="text-xs font-semibold text-amber-700 px-2"
                          onClick={() => archive(row)}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          className="text-xs font-semibold text-emerald-700 px-2"
                          onClick={() => restore(row)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="py-12 text-center text-sm text-slate-500">
                  {rows.length
                    ? 'No packages match this filter.'
                    : 'No templates yet. Create your first package on the right.'}
                </div>
              )}
            </div>
          )}
        </section>

        <form
          onSubmit={save}
          className="glass-card !p-4 sm:!p-5 space-y-4 self-start lg:sticky lg:top-4 order-1 lg:order-2"
        >
          <div className="flex justify-between gap-2">
            <h2 className="font-bold">{editing ? 'Edit package' : 'New package'}</h2>
            {editing && (
              <button type="button" className="text-xs text-slate-500 shrink-0" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
          <label className="block text-sm font-medium">
            Name
            <input
              className="input-field mt-1"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="14-day back rehab"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              className="input-field mt-1"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-medium">
              Sessions
              <input
                type="number"
                min="1"
                max="365"
                className="input-field mt-1"
                required
                value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: e.target.value })}
              />
            </label>
            <label className="text-xs font-medium">
              Valid days
              <input
                type="number"
                min="1"
                className="input-field mt-1"
                required
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </label>
            <label className="text-xs font-medium">
              Price ₹
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field mt-1"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-2">Included modes</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ['clinic', 'Clinic'],
                ['home_visit', 'Home visit'],
                ['online', 'Online'],
              ].map(([mode, label]) => (
                <label
                  key={mode}
                  className={`px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer ${
                    form.included_modes.includes(mode)
                      ? 'bg-teal-50 border-teal-300 text-teal-800'
                      : 'border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={form.included_modes.includes(mode)}
                    onChange={() =>
                      setForm({
                        ...form,
                        included_modes: form.included_modes.includes(mode)
                          ? form.included_modes.filter((m) => m !== mode)
                          : [...form.included_modes, mode],
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Available for assignment (active in catalog)
          </label>
          <p className="text-[11px] text-slate-500">
            Active packages appear when assigning to patients and during appointment booking.
          </p>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update package' : 'Create package'}
          </button>
        </form>
      </div>
    </ClinicPortalShell>
  );
}
