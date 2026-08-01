import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import BulkInvitePanel from '../../components/clinic/BulkInvitePanel';
import ClinicOfflinePatientForm from '../../components/clinic/ClinicOfflinePatientForm';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import GlassModal, { GlassModalBody, GlassModalHeader } from '../../components/GlassModal';
import PatientCommandPalette from '../../components/clinic/patients/PatientCommandPalette';
import PatientFilterDrawer from '../../components/clinic/patients/PatientFilterDrawer';
import PatientGlanceSheet from '../../components/clinic/patients/PatientGlanceSheet';
import {
  FILTER_PILLS,
  PRIVACY_STORAGE_KEY,
  VIEW_STORAGE_KEY,
  formatDate,
  initials,
  mailLink,
  maskEmail,
  maskName,
  maskPhone,
  money,
  patientDetailPath,
  patientKey,
  smsLink,
  statusMeta,
  telLink,
  waLink,
} from '../../components/clinic/patients/patientDirectoryUtils';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

function readStored(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v != null ? v : fallback;
  } catch {
    return fallback;
  }
}

function CommIcon({ href, icon, label, privacy }) {
  if (privacy || !href) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300" title={label}>
        <FaIcon icon={icon} className="text-xs" />
      </span>
    );
  }
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
    >
      <FaIcon icon={icon} className="text-xs" />
    </a>
  );
}

function PatientCard({ patient, privacy, selected, onOpen, onToggleSelect, view }) {
  const meta = statusMeta(patient.portal_status);
  const path = patientDetailPath(patient);
  const phone = patient.phone;
  const email = patient.email;

  if (view === 'list') {
    return (
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="group border-t border-slate-100/80 transition hover:bg-teal-50/40"
      >
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(patient)}
            aria-label="Select patient"
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
        </td>
        <td className="px-3 py-3">
          <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => onOpen(patient)}>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-400/10 text-xs font-bold text-teal-800">
              {initials(patient.patient_name)}
              {patient.reminder_due ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-teal-800">
                {maskName(patient.patient_name, privacy)}
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                {patient.last_visit ? `Last ${formatDate(patient.last_visit)}` : 'No visits yet'}
              </span>
            </span>
          </button>
        </td>
        <td className="px-3 py-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}>
            {meta.label}
          </span>
        </td>
        <td className="px-3 py-3 text-sm text-slate-600">
          <p>{maskPhone(phone, privacy)}</p>
          <p className="truncate text-xs text-slate-400">{maskEmail(email, privacy)}</p>
        </td>
        <td className="px-3 py-3 text-xs text-slate-600">
          {patient.package_name ? (
            <>
              <p className="font-medium text-slate-800">{patient.package_name}</p>
              <p>
                {Number(patient.package_completed || 0)}/{Number(patient.package_sessions || 0)} sessions
              </p>
            </>
          ) : (
            '—'
          )}
        </td>
        <td className="px-3 py-3 text-sm font-semibold text-slate-800">{patient.visit_count || 0}</td>
        <td className="px-3 py-3 text-sm font-medium text-emerald-700">{money(patient.total_spent)}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-0.5">
            <CommIcon href={telLink(phone)} icon="fa-phone" label="Call" privacy={privacy} />
            <CommIcon href={waLink(phone)} icon="fa-brands fa-whatsapp" label="WhatsApp" privacy={privacy} />
            <CommIcon href={smsLink(phone)} icon="fa-comment-sms" label="SMS" privacy={privacy} />
            <CommIcon href={mailLink(email)} icon="fa-envelope" label="Email" privacy={privacy} />
            <Link
              to={path}
              onClick={(e) => e.stopPropagation()}
              className="ml-1 inline-flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              Open
            </Link>
          </div>
        </td>
      </motion.tr>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'border-teal-300 ring-2 ring-teal-100' : 'border-slate-200/80 hover:border-teal-200'
      }`}
    >
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(patient)}
          aria-label="Select patient"
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button type="button" className="w-full text-left" onClick={() => onOpen(patient)}>
        <div className="flex items-start gap-3 pr-8">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-400/10 text-sm font-bold text-teal-800">
            {initials(patient.patient_name)}
            {patient.reminder_due ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-teal-800">
                {maskName(patient.patient_name, privacy)}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {maskPhone(phone, privacy)}
              {email ? ` · ${maskEmail(email, privacy)}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50/90 px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Visits</p>
            <p className="text-sm font-bold text-slate-800">{patient.visit_count || 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50/90 px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Spent</p>
            <p className="truncate text-sm font-bold text-emerald-700">{money(patient.total_spent)}</p>
          </div>
          <div className="rounded-xl bg-slate-50/90 px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Last</p>
            <p className="truncate text-[11px] font-semibold text-slate-700">
              {patient.last_visit ? formatDate(patient.last_visit) : '—'}
            </p>
          </div>
        </div>

        {patient.package_name ? (
          <p className="mt-2 truncate text-[11px] text-slate-500">
            <FaIcon icon="fa-box" className="mr-1 text-slate-400" />
            {patient.package_name} · {Number(patient.package_completed || 0)}/{Number(patient.package_sessions || 0)}
          </p>
        ) : null}

        {(patient.tags || []).length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {patient.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-0.5">
          <CommIcon href={telLink(phone)} icon="fa-phone" label="Call" privacy={privacy} />
          <CommIcon href={waLink(phone)} icon="fa-brands fa-whatsapp" label="WhatsApp" privacy={privacy} />
          <CommIcon href={smsLink(phone)} icon="fa-comment-sms" label="SMS" privacy={privacy} />
          <CommIcon href={mailLink(email)} icon="fa-envelope" label="Email" privacy={privacy} />
        </div>
        <Link
          to={path}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          onClick={(e) => e.stopPropagation()}
        >
          Open chart →
        </Link>
      </div>
    </motion.article>
  );
}

export default function ClinicPortalPatients() {
  const { clinicId, loading: bootLoading } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, per_page: 36 });
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    invited: 0,
    offline: 0,
    total_visits: 0,
    due_reminders: 0,
    active_package: 0,
  });
  const [filterTags, setFilterTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState(() => readStored(VIEW_STORAGE_KEY, 'grid'));
  const [privacy, setPrivacy] = useState(() => readStored(PRIVACY_STORAGE_KEY, '0') === '1');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [glance, setGlance] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [resendingId, setResendingId] = useState(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [merging, setMerging] = useState(false);
  const [palettePatients, setPalettePatients] = useState([]);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patients(clinicId, {
        q: q.trim() || undefined,
        filter: filter !== 'all' ? filter : undefined,
        status: status !== 'all' ? status : undefined,
        tag: tag.trim() || undefined,
        page,
        per_page: view === 'list' ? 40 : 36,
      });
      const data = res.data || res || {};
      // Backward compatible if API ever returns a bare array
      if (Array.isArray(data)) {
        setRows(data);
        setMeta({ page: 1, pages: 1, total: data.length, per_page: data.length });
        setStats({
          total: data.length,
          online: data.filter((r) => (r.portal_status || 'online') === 'online').length,
          invited: data.filter((r) => r.portal_status === 'invited').length,
          offline: data.filter((r) => r.portal_status === 'offline').length,
          total_visits: data.reduce((s, r) => s + (Number(r.visit_count) || 0), 0),
          due_reminders: 0,
          active_package: 0,
        });
        setFilterTags([]);
      } else {
        setRows(data.items || []);
        setMeta(data.meta || { page: 1, pages: 1, total: 0 });
        setStats(data.stats || {});
        setFilterTags(data.filter_tags || []);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load patients');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, q, filter, status, tag, page, view]);

  useEffect(() => {
    if (!clinicId) return undefined;
    const t = setTimeout(load, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [clinicId, load, q]);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener('clinic-patients-changed', onChanged);
    return () => window.removeEventListener('clinic-patients-changed', onChanged);
  }, [load]);

  // Prefetch a larger set for Cmd+K jump-to
  useEffect(() => {
    if (!clinicId) return undefined;
    let cancelled = false;
    clinicPortal
      .patients(clinicId, { page: 1, per_page: 100 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || res || {};
        setPalettePatients(Array.isArray(data) ? data : data.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  useEffect(() => {
    setPage(1);
  }, [q, filter, status, tag]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, privacy ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [privacy]);

  useEffect(() => {
    const onKey = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resend = async (clinicPatientId) => {
    if (!clinicId || !clinicPatientId) return;
    setResendingId(clinicPatientId);
    try {
      const res = await clinicPortal.resendOfflinePatientInvite(clinicId, clinicPatientId);
      const n = res?.data ?? res ?? {};
      const channels = [n.email_sent && 'email', n.sms_sent && 'SMS', n.whatsapp_sent && 'WhatsApp'].filter(Boolean);
      toast.success(channels.length ? `Resent via ${channels.join(', ')}` : 'Resend attempted');
    } catch (e) {
      toast.error(e.message || 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  const toggleSelect = (p) => {
    const key = patientKey(p);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedList = useMemo(
    () => rows.filter((r) => selected.has(patientKey(r))),
    [rows, selected]
  );

  const printLabel = () => {
    const targets = selectedList.length ? selectedList : glance ? [glance] : [];
    if (!targets.length) {
      toast.error('Select a patient first');
      return;
    }
    const html = targets
      .map(
        (p) => `
      <div style="border:1px solid #cbd5e1;padding:12px 16px;margin:8px;width:280px;font-family:system-ui;border-radius:8px">
        <div style="font-weight:700;font-size:14px">${(p.patient_name || 'Patient').replace(/</g, '')}</div>
        <div style="font-size:12px;color:#475569;margin-top:4px">${(p.phone || '').replace(/</g, '')}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px">${patientKey(p)}</div>
      </div>`
      )
      .join('');
    const w = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
    if (!w) {
      toast.error('Allow pop-ups to print labels');
      return;
    }
    w.document.write(`<html><head><title>Patient labels</title></head><body onload="print()">${html}</body></html>`);
    w.document.close();
  };

  const runMerge = async () => {
    if (selectedList.length !== 2) {
      toast.error('Select exactly two patients to merge');
      return;
    }
    const [a, b] = selectedList;
    const primary = a.clinic_patient_id ? a : b.clinic_patient_id ? b : a;
    const secondary = patientKey(primary) === patientKey(a) ? b : a;
    setMerging(true);
    try {
      await clinicPortal.mergePatients(clinicId, {
        primary_key: patientKey(primary),
        secondary_key: patientKey(secondary),
      });
      toast.success('Patients merged');
      setMergeOpen(false);
      setSelected(new Set());
      load();
    } catch (e) {
      toast.error(e.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const kpis = [
    { label: 'On roster', value: stats.total ?? 0, tone: 'from-slate-500/15 to-slate-400/5 text-slate-900' },
    { label: 'Online', value: stats.online ?? 0, tone: 'from-emerald-500/15 to-emerald-400/5 text-emerald-800' },
    {
      label: 'Awaiting',
      value: (stats.invited ?? 0) + (stats.offline ?? 0),
      tone: 'from-amber-500/15 to-amber-400/5 text-amber-800',
    },
    { label: 'Visits', value: stats.total_visits ?? 0, tone: 'from-teal-500/15 to-cyan-400/5 text-teal-900' },
    {
      label: 'Reminders',
      value: stats.due_reminders ?? 0,
      tone: 'from-rose-500/15 to-rose-400/5 text-rose-800',
    },
  ];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

  return (
    <ClinicPortalShell
      title="Patients"
      subtitle="Modern directory — search, filter, communicate, and open charts in one place"
      actions={
        <div className="portal-page-actions">
          <button type="button" className="btn-primary text-sm" onClick={() => setNewPatientOpen(true)}>
            <FaIcon icon="fa-user-plus" className="mr-1.5" />
            <span className="hidden sm:inline">New Patient</span>
            <span className="sm:hidden">New</span>
          </button>
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={() => setBulkInviteOpen(true)}
            disabled={!clinicId || bootLoading}
          >
            <FaIcon icon="fa-envelope-open-text" className="mr-1.5" />
            <span className="hidden md:inline">Bulk Invite</span>
            <span className="md:hidden">Invite</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div
              key={k.label}
              className={`rounded-2xl border border-white/60 bg-gradient-to-br ${k.tone} p-3 shadow-sm backdrop-blur-sm sm:p-3.5`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500/90">{k.label}</p>
              <p className="mt-1 truncate text-xl font-bold sm:text-2xl">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Command search + toolbar */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur-md sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="group flex flex-1 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-left transition hover:border-teal-200 hover:bg-white"
            >
              <FaIcon icon="fa-magnifying-glass" className="text-slate-400 group-hover:text-teal-600" />
              <span className="flex-1 text-sm text-slate-400">Search patients…</span>
              <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline">
                {isMac ? '⌘' : 'Ctrl'}K
              </kbd>
            </button>

            <div className="relative flex-1 lg:max-w-sm">
              <FaIcon
                icon="fa-magnifying-glass"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
              />
              <input
                className="input-field w-full pl-9 text-sm"
                placeholder="Filter this page by name, phone, email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                  aria-label="Grid view"
                >
                  <FaIcon icon="fa-table-cells-large" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                  aria-label="List view"
                >
                  <FaIcon icon="fa-list" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPrivacy((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  privacy
                    ? 'border-violet-200 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="Privacy mode"
              >
                <FaIcon icon={privacy ? 'fa-eye-slash' : 'fa-eye'} />
                <span className="hidden sm:inline">Privacy</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FaIcon icon="fa-sliders" />
                Filters
                {(status !== 'all' || tag) && (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
                )}
              </button>

              <button
                type="button"
                onClick={printLabel}
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:inline-flex"
              >
                <FaIcon icon="fa-print" />
                Label
              </button>

              <button
                type="button"
                onClick={() => setMergeOpen(true)}
                disabled={selected.size !== 2}
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:inline-flex"
              >
                <FaIcon icon="fa-object-group" />
                Merge
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_PILLS.map((p) => {
              const active = filter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilter(p.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {p.label}
                  {p.id === 'reminders' && stats.due_reminders > 0 ? ` · ${stats.due_reminders}` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory */}
        <div className="min-h-[240px]">
          {bootLoading || loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100/80" />
              ))}
            </div>
          ) : !rows.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-16 text-center">
              <FaIcon icon="fa-users" className="mb-2 text-3xl text-slate-300" />
              <p className="font-medium text-slate-600">No patients match</p>
              <p className="mt-1 text-sm text-slate-400">Try clearing filters or add a walk-in patient</p>
              <button type="button" className="btn-primary mt-4 text-sm" onClick={() => setNewPatientOpen(true)}>
                <FaIcon icon="fa-user-plus" className="mr-1.5" />
                Add patient
              </button>
            </div>
          ) : view === 'list' ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
              <div className="portal-table-wrap overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-slate-50/90 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3 w-10" />
                      <th className="px-3 py-3">Patient</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Package</th>
                      <th className="px-3 py-3">Visits</th>
                      <th className="px-3 py-3">Spent</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {rows.map((p) => (
                        <PatientCard
                          key={patientKey(p)}
                          patient={p}
                          privacy={privacy}
                          selected={selected.has(patientKey(p))}
                          onOpen={setGlance}
                          onToggleSelect={toggleSelect}
                          view="list"
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {rows.map((p) => (
                  <PatientCard
                    key={patientKey(p)}
                    patient={p}
                    privacy={privacy}
                    selected={selected.has(patientKey(p))}
                    onOpen={setGlance}
                    onToggleSelect={toggleSelect}
                    view="grid"
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 text-sm">
            <p className="text-slate-500">
              Page <span className="font-semibold text-slate-800">{meta.page}</span> of {meta.pages}
              <span className="text-slate-400"> · {meta.total} patients</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-outline text-xs"
                disabled={!meta.has_more && page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400">
          Need clinical filters?{' '}
          <Link to="/clinic-portal/search" className="font-semibold text-teal-700 hover:underline">
            Advanced search
          </Link>
        </p>
      </div>

      <PatientCommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        patients={palettePatients.length ? palettePatients : rows}
        privacy={privacy}
        onNewPatient={() => setNewPatientOpen(true)}
      />

      <PatientFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={{ status, tag }}
        onChange={(f) => {
          setStatus(f.status || 'all');
          setTag(f.tag || '');
        }}
        filterTags={filterTags}
        onClear={() => {
          setStatus('all');
          setTag('');
        }}
      />

      <PatientGlanceSheet
        patient={glance}
        open={!!glance}
        onClose={() => setGlance(null)}
        privacy={privacy}
        clinicId={clinicId}
        onResend={resend}
        resendingId={resendingId}
        onReminderCreated={load}
      />

      <GlassModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} size="md">
        <GlassModalHeader
          title="New patient"
          subtitle="Walk-in / offline patient with optional invite"
          icon="fa-user-plus"
          onClose={() => setNewPatientOpen(false)}
        />
        <GlassModalBody>
          <ClinicOfflinePatientForm
            clinicId={clinicId}
            onCreated={() => {
              setNewPatientOpen(false);
              load();
            }}
            onClose={() => setNewPatientOpen(false)}
          />
        </GlassModalBody>
      </GlassModal>

      <GlassModal open={bulkInviteOpen} onClose={() => setBulkInviteOpen(false)} size="lg">
        <GlassModalHeader
          title="Bulk invite"
          subtitle="Paste up to 50 contacts to invite at once"
          icon="fa-envelope-open-text"
          onClose={() => setBulkInviteOpen(false)}
        />
        <GlassModalBody>
          <BulkInvitePanel
            title=""
            description="New patients get an account + temporary password by email and SMS; existing patients get a sign-in reminder."
            roleLabel="patient"
            disabled={!clinicId || bootLoading}
            onSubmit={(contacts) => clinicPortal.bulkInvitePatients(clinicId, { contacts })}
          />
        </GlassModalBody>
      </GlassModal>

      <GlassModal open={mergeOpen} onClose={() => setMergeOpen(false)} size="sm">
        <GlassModalHeader
          title="Merge patients"
          subtitle="Packages, tags, and notes move to the primary record"
          icon="fa-object-group"
          onClose={() => setMergeOpen(false)}
        />
        <GlassModalBody>
          <p className="text-sm text-slate-600">
            You selected{' '}
            <strong>{selectedList.map((p) => maskName(p.patient_name, privacy)).join(' + ')}</strong>. The
            roster record with a clinic patient ID is kept as primary when possible.
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-outline flex-1 text-sm" onClick={() => setMergeOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-1 text-sm" disabled={merging} onClick={runMerge}>
              {merging ? 'Merging…' : 'Confirm merge'}
            </button>
          </div>
        </GlassModalBody>
      </GlassModal>
    </ClinicPortalShell>
  );
}
