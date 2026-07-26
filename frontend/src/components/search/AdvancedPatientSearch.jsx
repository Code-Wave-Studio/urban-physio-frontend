import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { patientSearch } from '../../services/api';

const EMPTY_FILTERS = {
  q: '',
  name: '',
  phone: '',
  disease: '',
  diagnosis: '',
  therapist_id: '',
  date_from: '',
  date_to: '',
  city_id: '',
  package: '',
  session_number: '',
  tag: '',
  treatment_status: '',
};

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  no_show: 'No show',
  active: 'Active (package)',
  paused: 'Paused (package)',
};

const statusBadge = (s) => {
  const map = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    no_show: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[s] || 'bg-slate-100 text-slate-600 border-slate-200';
};

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none';

/**
 * Advanced Patient Search — shared by Main Admin, Doctor, Clinic Admin and Receptionist.
 * The backend scopes results to the caller's role automatically.
 */
export default function AdvancedPatientSearch({ patientLinkFor, canTag = true }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [options, setOptions] = useState(null);
  const [results, setResults] = useState({ items: [], walkins: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagBusy, setTagBusy] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    patientSearch
      .filters()
      .then((res) => setOptions(res.data || null))
      .catch(() => setOptions(null));
  }, []);

  const activeFilters = useMemo(
    () => Object.entries(filters).filter(([, v]) => String(v).trim() !== ''),
    [filters]
  );

  const runSearch = useCallback(
    (f) => {
      const hasAny = Object.values(f).some((v) => String(v).trim() !== '');
      if (!hasAny) {
        setResults({ items: [], walkins: [] });
        setSearched(false);
        setLoading(false);
        return;
      }
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const started = performance.now();
      const params = {};
      Object.entries(f).forEach(([k, v]) => {
        if (String(v).trim() !== '') params[k] = v;
      });
      patientSearch
        .run(params, { signal: controller.signal })
        .then((res) => {
          if (controller.signal.aborted) return;
          setResults({
            items: res.data?.items || [],
            walkins: res.data?.walkins || [],
          });
          setSearched(true);
          setElapsed(Math.round(performance.now() - started));
        })
        .catch((err) => {
          if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
          toast.error(err?.message || 'Search failed');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(filters), 350);
    return () => clearTimeout(debounceRef.current);
  }, [filters, runSearch]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const reset = () => setFilters(EMPTY_FILTERS);

  const addTag = async (row) => {
    const tag = window.prompt('Add tag for this patient (e.g. VIP, Follow-up, Chronic):');
    if (!tag || !tag.trim()) return;
    const key = row.patient_id ? `p-${row.patient_id}` : `cp-${row.clinic_patient_id}`;
    setTagBusy(key);
    try {
      await patientSearch.addTag({
        tag: tag.trim(),
        patient_id: row.patient_id || undefined,
        clinic_patient_id: row.clinic_patient_id || undefined,
      });
      toast.success('Tag added');
      runSearch(filters);
    } catch (err) {
      toast.error(err?.message || 'Could not add tag');
    } finally {
      setTagBusy(null);
    }
  };

  const removeTag = async (row, tag) => {
    const key = row.patient_id ? `p-${row.patient_id}` : `cp-${row.clinic_patient_id}`;
    setTagBusy(key);
    try {
      await patientSearch.removeTag({
        tag,
        patient_id: row.patient_id || undefined,
        clinic_patient_id: row.clinic_patient_id || undefined,
      });
      runSearch(filters);
    } catch (err) {
      toast.error(err?.message || 'Could not remove tag');
    } finally {
      setTagBusy(null);
    }
  };

  const allRows = [...results.items, ...results.walkins];

  const renderTags = (row) => {
    const key = row.patient_id ? `p-${row.patient_id}` : `cp-${row.clinic_patient_id}`;
    return (
      <div className="flex flex-wrap items-center gap-1">
        {(row.tags || []).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 text-[11px] font-medium"
          >
            {t}
            {canTag && (
              <button
                type="button"
                onClick={() => removeTag(row, t)}
                disabled={tagBusy === key}
                className="text-violet-400 hover:text-violet-700"
                title={`Remove tag ${t}`}
              >
                <FaIcon icon="fa-xmark" className="text-[9px]" />
              </button>
            )}
          </span>
        ))}
        {canTag && (
          <button
            type="button"
            onClick={() => addTag(row)}
            disabled={tagBusy === key}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 text-slate-500 hover:text-teal-700 hover:border-teal-300 px-2 py-0.5 text-[11px]"
            title="Add tag"
          >
            <FaIcon icon="fa-plus" className="text-[9px]" />
            Tag
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quick search bar */}
      <div className="glass-card !p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <FaIcon
              icon="fa-magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              value={filters.q}
              onChange={set('q')}
              placeholder="Search by patient name, phone number or booking ID…"
              className={`${inputCls} !pl-9 !py-2.5`}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                showAdvanced
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'
              }`}
            >
              <FaIcon icon="fa-sliders" />
              Advanced filters
              {activeFilters.length > 0 && (
                <span className="rounded-full bg-white/20 border border-white/30 px-1.5 text-[11px]">
                  {activeFilters.length}
                </span>
              )}
            </button>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:text-rose-600 hover:border-rose-200 transition"
              >
                <FaIcon icon="fa-eraser" />
                Clear
              </button>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
            <Field label="Patient name">
              <input type="text" value={filters.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" className={inputCls} />
            </Field>
            <Field label="Phone number">
              <input type="text" value={filters.phone} onChange={set('phone')} placeholder="e.g. 98765…" className={inputCls} inputMode="tel" />
            </Field>
            <Field label="Disease / pain type">
              <input type="text" value={filters.disease} onChange={set('disease')} placeholder="e.g. Back pain" className={inputCls} list="aps-diseases" />
              <datalist id="aps-diseases">
                {(options?.diseases || []).map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Diagnosis">
              <input type="text" value={filters.diagnosis} onChange={set('diagnosis')} placeholder="e.g. Disc bulge L4-L5" className={inputCls} />
            </Field>
            <Field label="Therapist">
              <select value={filters.therapist_id} onChange={set('therapist_id')} className={inputCls}>
                <option value="">Any therapist</option>
                {(options?.therapists || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visit date from">
              <input type="date" value={filters.date_from} onChange={set('date_from')} className={inputCls} />
            </Field>
            <Field label="Visit date to">
              <input type="date" value={filters.date_to} onChange={set('date_to')} className={inputCls} />
            </Field>
            <Field label="City">
              <select value={filters.city_id} onChange={set('city_id')} className={inputCls}>
                <option value="">Any city</option>
                {(options?.cities || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Package">
              <input type="text" value={filters.package} onChange={set('package')} placeholder="e.g. 10-session plan" className={inputCls} list="aps-packages" />
              <datalist id="aps-packages">
                {(options?.packages || []).map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>
            <Field label="Session number">
              <input type="number" min="1" value={filters.session_number} onChange={set('session_number')} placeholder="e.g. 6" className={inputCls} />
            </Field>
            <Field label="Tag">
              <input type="text" value={filters.tag} onChange={set('tag')} placeholder="e.g. VIP" className={inputCls} list="aps-tags" />
              <datalist id="aps-tags">
                {(options?.tags || []).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Treatment status">
              <select value={filters.treatment_status} onChange={set('treatment_status')} className={inputCls}>
                <option value="">Any status</option>
                {(options?.treatment_statuses || Object.keys(STATUS_LABELS)).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <p className="text-sm font-semibold text-slate-700">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <FaIcon icon="fa-spinner" className="fa-spin text-teal-600" />
                Searching…
              </span>
            ) : searched ? (
              <>
                {allRows.length} patient{allRows.length === 1 ? '' : 's'} found
                {elapsed != null && (
                  <span className="ml-2 text-xs font-normal text-slate-400">in {elapsed} ms</span>
                )}
              </>
            ) : (
              'Start typing or set filters to search patients'
            )}
          </p>
        </div>

        {!searched && !loading ? (
          <div className="px-4 py-12 text-center text-slate-400">
            <FaIcon icon="fa-users-viewfinder" className="text-3xl mb-2" />
            <p className="text-sm">
              Search across name, phone, disease, diagnosis, therapist, date, city, package,
              session number, tags and treatment status.
            </p>
          </div>
        ) : searched && allRows.length === 0 && !loading ? (
          <div className="px-4 py-12 text-center text-slate-400">
            <FaIcon icon="fa-face-frown" className="text-3xl mb-2" />
            <p className="text-sm">No patients match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-3 py-2.5">City</th>
                  <th className="px-3 py-2.5">Last visit</th>
                  <th className="px-3 py-2.5">Therapist</th>
                  <th className="px-3 py-2.5">Disease</th>
                  <th className="px-3 py-2.5">Package</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Tags</th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((row) => {
                  const key = row.record_type === 'walkin' ? `cp-${row.clinic_patient_id}` : `p-${row.patient_id}`;
                  const link = patientLinkFor ? patientLinkFor(row) : null;
                  const status = row.progress_status || row.last_status || row.package_status || row.roster_status;
                  return (
                    <tr key={key} className="border-b border-slate-50 hover:bg-teal-50/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase">
                            {(row.name || '?').slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            {link ? (
                              <a href={link} className="block font-semibold text-slate-900 hover:text-teal-700 truncate">
                                {row.name || 'Unknown'}
                              </a>
                            ) : (
                              <p className="font-semibold text-slate-900 truncate">{row.name || 'Unknown'}</p>
                            )}
                            <p className="text-xs text-slate-500 truncate">
                              {row.phone || '—'}
                              {row.record_type === 'walkin' && (
                                <span className="ml-1.5 rounded bg-amber-50 border border-amber-200 text-amber-700 px-1 text-[10px]">
                                  Walk-in
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.city_name || '—'}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {row.last_visit || '—'}
                        {row.visit_count > 0 && (
                          <span className="block text-[11px] text-slate-400">{row.visit_count} visits</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.last_therapist || '—'}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[160px]">
                        <span className="block truncate" title={row.last_disease || ''}>
                          {row.last_disease || '—'}
                        </span>
                        {row.last_diagnosis && (
                          <span className="block text-[11px] text-slate-400 truncate" title={row.last_diagnosis}>
                            Dx: {row.last_diagnosis}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {row.package_name ? (
                          <>
                            <span className="block truncate max-w-[140px]" title={row.package_name}>
                              {row.package_name}
                            </span>
                            {row.package_sessions && (
                              <span className="block text-[11px] text-slate-400">
                                Sessions {row.package_sessions}
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {status ? (
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadge(status)}`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 min-w-[140px]">{renderTags(row)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
