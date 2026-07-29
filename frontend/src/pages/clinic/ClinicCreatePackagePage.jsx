import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const SERVICE_MODES = [
  { id: 'clinic',     label: 'Clinic' },
  { id: 'home_visit', label: 'Home Visit' },
  { id: 'online',     label: 'Online' },
];

const INITIAL = {
  name: '',
  description: '',
  service_type: '',
  total_sessions: 6,
  duration_days: 30,
  never_expires: false,
  price: 0,
  included_modes: ['clinic'],
  is_active: true,
  eligible_providers: [],   // array of doctor IDs
};

function parseModes(row) {
  let modes = row.included_modes_json ?? row.included_modes;
  if (typeof modes === 'string') {
    try { modes = JSON.parse(modes || '[]'); } catch { modes = []; }
  }
  return Array.isArray(modes) ? modes : [];
}

function parseProviders(row) {
  let p = row.eligible_providers_json ?? row.eligible_providers;
  if (typeof p === 'string') {
    try { p = JSON.parse(p || '[]'); } catch { p = []; }
  }
  return Array.isArray(p) ? p : [];
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ClinicCreatePackagePage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [actingId, setActingId] = useState(null);
  const [filter, setFilter]   = useState('active');
  const [q, setQ]             = useState('');
  const [form, setForm]       = useState(INITIAL);
  const [doctors, setDoctors] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.packageTemplates(clinicId);
      setRows(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Could not load package templates');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    load();
    // Load doctors list for eligible_providers selector
    clinicPortal.doctors?.(clinicId)
      .then((r) => setDoctors(r.data || r || []))
      .catch(() => setDoctors([]));
    // Load service types
    clinicPortal.serviceTypes(clinicId)
      .then((r) => setServiceTypes(r.data || r || []))
      .catch(() => setServiceTypes([]));
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
        String(row.description || '').toLowerCase().includes(needle) ||
        String(row.service_type || '').toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, q]);

  const counts = useMemo(() => ({
    all:      rows.length,
    active:   rows.filter((r) => Number(r.is_active)).length,
    archived: rows.filter((r) => !Number(r.is_active)).length,
  }), [rows]);

  if (!boot && (!isAdminMode || !can('packages.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const resetForm = () => { setEditing(null); setForm(INITIAL); };

  const edit = (row) => {
    setEditing(row.id);
    setForm({
      name:               row.name || '',
      description:        row.description || '',
      service_type:       row.service_type || '',
      total_sessions:     row.total_sessions || 1,
      duration_days:      row.duration_days || 30,
      never_expires:      Boolean(Number(row.never_expires)),
      price:              row.price || 0,
      included_modes:     parseModes(row),
      is_active:          Boolean(Number(row.is_active)),
      eligible_providers: parseProviders(row),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicate = (row) => {
    setEditing(null);
    setForm({
      name:               `${row.name || 'Package'} (Copy)`,
      description:        row.description || '',
      service_type:       row.service_type || '',
      total_sessions:     row.total_sessions || 1,
      duration_days:      row.duration_days || 30,
      never_expires:      Boolean(Number(row.never_expires)),
      price:              row.price || 0,
      included_modes:     parseModes(row).length ? parseModes(row) : ['clinic'],
      is_active:          true,
      eligible_providers: parseProviders(row),
    });
    toast.success('Duplicated into the form — review and create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMode = (mode) => {
    setForm((f) => ({
      ...f,
      included_modes: f.included_modes.includes(mode)
        ? f.included_modes.filter((m) => m !== mode)
        : [...f.included_modes, mode],
    }));
  };

  const toggleProvider = (doctorId) => {
    setForm((f) => ({
      ...f,
      eligible_providers: f.eligible_providers.includes(doctorId)
        ? f.eligible_providers.filter((d) => d !== doctorId)
        : [...f.eligible_providers, doctorId],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.included_modes.length) {
      toast.error('Select at least one included mode');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:            form.name,
        description:     form.description,
        service_type:    form.service_type || null,
        total_sessions:  Number(form.total_sessions),
        duration_days:   form.never_expires ? 0 : Number(form.duration_days),
        never_expires:   form.never_expires ? 1 : 0,
        price:           Number(form.price),
        mode_prices:     Object.fromEntries(form.included_modes.map((m) => [m, Number(form.price)])),
        included_modes:  form.included_modes,
        is_active:       form.is_active ? 1 : 0,
        eligible_providers: form.eligible_providers,
      };
      if (editing) {
        await clinicPortal.updatePackageTemplate(clinicId, editing, payload);
      } else {
        await clinicPortal.createPackageTemplate(clinicId, payload);
      }
      toast.success(editing ? 'Package template updated' : 'Package template created');
      resetForm();
      load();
    } catch (e) {
      toast.error(e.message || 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (row) => {
    if (!window.confirm(`Archive "${row.name}"? Existing patient packages stay unchanged.`)) return;
    setActingId(row.id);
    try {
      await clinicPortal.deletePackageTemplate(clinicId, row.id);
      toast.success('Package archived');
      if (editing === row.id) resetForm();
      load();
    } catch (e) {
      toast.error(e.message || 'Could not archive');
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
    } catch (e) {
      toast.error(e.message || 'Could not restore');
    } finally {
      setActingId(null);
    }
  };

  return (
    <ClinicPortalShell
      title="Package Catalog"
      subtitle="Create, edit, duplicate and archive reusable multi-session package templates"
      actions={
        <div className="portal-page-actions">
          <Link to="/clinic-portal/packages" className="btn-outline inline-flex items-center gap-2 text-sm">
            <FaIcon icon="fa-box-open" />
            <span className="hidden sm:inline">Assigned packages</span>
            <span className="sm:hidden">Assigned</span>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] gap-4 sm:gap-5">
        {/* ── Template list ── */}
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
                ['active',   `Active (${counts.active})`],
                ['archived', `Archived (${counts.archived})`],
                ['all',      `All (${counts.all})`],
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
                const active  = Boolean(Number(row.is_active));
                const modes   = parseModes(row);
                const provs   = parseProviders(row);
                return (
                  <div key={row.id} className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{row.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {active ? 'Active' : 'Archived'}
                        </span>
                      </div>
                      {row.service_type && (
                        <p className="text-[11px] text-teal-600 font-medium mt-0.5">{row.service_type}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {row.total_sessions} sessions
                        {Number(row.never_expires) ? ' · Never expires' : ` · ${row.duration_days} days`}
                        {' · '}{money(row.price)}
                      </p>
                      {modes.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1 capitalize">
                          Modes: {modes.map((m) => String(m).replace(/_/g, ' ')).join(', ')}
                        </p>
                      )}
                      {provs.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          {provs.length} eligible provider{provs.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {row.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{row.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => edit(row)}>
                        <FaIcon icon="fa-pen" className="mr-1" />Edit
                      </button>
                      <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => duplicate(row)}>
                        <FaIcon icon="fa-copy" className="mr-1" />Duplicate
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
                  {rows.length ? 'No packages match this filter.' : 'No templates yet. Create your first package on the right.'}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Create / Edit form ── */}
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

          {/* Name */}
          <label className="block text-sm font-medium">
            Package Name
            <input
              className="input-field mt-1"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="14-day Back Rehab"
            />
          </label>

          {/* Description */}
          <label className="block text-sm font-medium">
            Description
            <textarea
              className="input-field mt-1"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of what this package covers…"
            />
          </label>

          {/* Service Type */}
          <label className="block text-sm font-medium">
            Service Type
            <select
              className="input-field mt-1"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            >
              <option value="">General / All services</option>
              {serviceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {/* Sessions / Validity / Price */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">
              Sessions
              <input
                type="number" min="1" max="365" required
                className="input-field mt-1"
                value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: e.target.value })}
              />
            </label>
            <label className="text-xs font-medium">
              Price ₹
              <input
                type="number" min="0" step="0.01" required
                className="input-field mt-1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
          </div>

          {/* Never expires toggle */}
          <label className="flex items-center gap-3 text-sm font-medium cursor-pointer select-none">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.never_expires ? 'bg-teal-500' : 'bg-slate-300'}`}
              onClick={() => setForm((f) => ({ ...f, never_expires: !f.never_expires }))}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.never_expires ? 'translate-x-5' : ''}`} />
            </div>
            Never Expires
          </label>

          {!form.never_expires && (
            <label className="text-xs font-medium">
              Valid days
              <input
                type="number" min="1" required
                className="input-field mt-1"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </label>
          )}

          {/* Included modes */}
          <fieldset>
            <legend className="text-sm font-medium mb-2">Service Modes</legend>
            <div className="flex flex-wrap gap-2">
              {SERVICE_MODES.map(({ id, label }) => (
                <label
                  key={id}
                  className={`px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer ${
                    form.included_modes.includes(id)
                      ? 'bg-teal-50 border-teal-300 text-teal-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={form.included_modes.includes(id)}
                    onChange={() => toggleMode(id)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Eligible providers */}
          {doctors.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Eligible Physiotherapists
                <span className="text-xs font-normal text-slate-500 ml-1">(leave empty = all)</span>
              </legend>
              <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2">
                {doctors.map((d) => {
                  const docId = String(d.id || d.doctor_id || '');
                  const checked = form.eligible_providers.includes(docId);
                  return (
                    <label key={docId} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProvider(docId)}
                      />
                      <span className="text-slate-700">{d.name || d.full_name || `Doctor #${docId}`}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Active flag */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
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
