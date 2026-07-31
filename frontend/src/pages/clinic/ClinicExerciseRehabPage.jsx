import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal, exercisePrescriptions } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'library', label: 'Exercise Library', icon: 'fa-book-open' },
  { id: 'hep', label: 'Home Exercise Programs', icon: 'fa-notes-medical' },
  { id: 'progress', label: 'Rehab Progress', icon: 'fa-chart-line' },
  { id: 'media', label: 'Video & Media Hub', icon: 'fa-photo-film' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
];

const EMPTY_EX = {
  name: '',
  body_area: '',
  category: '',
  difficulty: 'beginner',
  instructions: '',
  precautions: '',
  equipment: '',
  default_sets: 3,
  default_reps: '10',
  default_hold_seconds: '',
  video_url: '',
  image_url: '',
  pdf_url: '',
};

function Kpi({ label, value, hint, tone = 'teal' }) {
  const tones = {
    teal: 'from-teal-500/15 to-cyan-500/5 text-teal-900',
    amber: 'from-amber-500/15 to-orange-500/5 text-amber-900',
    rose: 'from-rose-500/15 to-pink-500/5 text-rose-900',
    emerald: 'from-emerald-500/15 to-green-500/5 text-emerald-900',
    sky: 'from-sky-500/15 to-blue-500/5 text-sky-900',
  };
  return (
    <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone] || tones.teal} p-4 shadow-sm backdrop-blur-sm`}>
      <p className="text-[11px] uppercase tracking-wide opacity-70 font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint ? <p className="text-xs opacity-60 mt-1">{hint}</p> : null}
    </div>
  );
}

function alertTone(sev) {
  if (sev === 'high') return 'border-rose-200 bg-rose-50/80 text-rose-900';
  if (sev === 'success') return 'border-emerald-200 bg-emerald-50/80 text-emerald-900';
  return 'border-amber-200 bg-amber-50/80 text-amber-900';
}

export default function ClinicExerciseRehabPage() {
  const { clinicId, can, loading: boot, clinic } = useClinicPortal();
  const [params, setParams] = useSearchParams();
  const section = params.get('tab') || 'dashboard';
  const setSection = (id) => setParams({ tab: id }, { replace: true });

  const brand = clinic?.primary_color || clinic?.brand_primary || null;
  const brandStyle = brand ? { ['--hep-accent']: brand } : undefined;

  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [library, setLibrary] = useState([]);
  const [libScope, setLibScope] = useState('all');
  const [libQ, setLibQ] = useState('');
  const [media, setMedia] = useState({ exercises: [], assets: [], providers: [] });
  const [plans, setPlans] = useState([]);
  const [exModal, setExModal] = useState(false);
  const [exForm, setExForm] = useState(EMPTY_EX);
  const [editingEx, setEditingEx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mediaForm, setMediaForm] = useState({ title: '', url: '', kind: 'video', provider: 'cdn' });

  const loadDash = useCallback(async () => {
    if (!clinicId) return;
    if (section === 'dashboard') setLoading(true);
    try {
      const r = await clinicPortal.hepDashboard(Number(clinicId));
      setDash(r.data || r);
    } catch (e) {
      toast.error(e.message || 'Failed to load HEP dashboard');
    } finally {
      setLoading(false);
    }
  }, [clinicId, section]);

  useEffect(() => {
    if (clinicId && (section === 'dashboard' || section === 'progress')) loadDash();
  }, [clinicId, section, loadDash]);

  useEffect(() => {
    if (!clinicId || section !== 'library') return;
    const cid = Number(clinicId);
    const t = setTimeout(() => {
      clinicPortal
        .hepLibrary(cid, { scope: libScope, search: libQ || undefined })
        .then((r) => setLibrary((r.data || r)?.exercises || []))
        .catch((e) => toast.error(e.message || 'Library failed'));
    }, libQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [clinicId, section, libScope, libQ]);

  useEffect(() => {
    if (!clinicId || (section !== 'hep' && section !== 'progress')) return;
    exercisePrescriptions
      .list()
      .then((r) => setPlans(r.data || []))
      .catch(() => setPlans([]));
  }, [clinicId, section]);

  useEffect(() => {
    if (!clinicId || section !== 'media') return;
    clinicPortal
      .hepMedia(Number(clinicId))
      .then((r) => setMedia(r.data || r || { exercises: [], assets: [] }))
      .catch((e) => toast.error(e.message || 'Media hub failed'));
  }, [clinicId, section]);

  useEffect(() => {
    if (!clinicId || section !== 'analytics') return;
    clinicPortal
      .hepAnalytics(Number(clinicId), { days: 30 })
      .then((r) => setAnalytics(r.data || r))
      .catch((e) => toast.error(e.message || 'Analytics failed'));
  }, [clinicId, section]);

  const kpis = dash?.kpis || analytics?.kpis || {};
  const alerts = dash?.alerts || [];

  const chartData = useMemo(() => {
    const daily = analytics?.daily || [];
    return {
      labels: daily.map((d) => d.day?.slice(5) || ''),
      datasets: [
        {
          label: 'Completed',
          data: daily.map((d) => d.completed),
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,0.15)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Avg pain',
          data: daily.map((d) => (d.avg_pain == null ? null : d.avg_pain)),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          tension: 0.35,
          spanGaps: true,
        },
      ],
    };
  }, [analytics]);

  const popularData = useMemo(() => {
    const rows = analytics?.popular_exercises || [];
    return {
      labels: rows.map((r) => r.name?.slice(0, 18) || ''),
      datasets: [
        {
          label: 'Assigned',
          data: rows.map((r) => r.assigned_count),
          backgroundColor: 'rgba(14,165,233,0.55)',
          borderRadius: 8,
        },
      ],
    };
  }, [analytics]);

  if (!boot && !can('exercises.manage')) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const openCreateEx = () => {
    setEditingEx(null);
    setExForm(EMPTY_EX);
    setExModal(true);
  };

  const openEditEx = (ex) => {
    if (!(Number(ex.clinic_id) > 0)) {
      toast.error('Global TUP library is read-only');
      return;
    }
    setEditingEx(ex);
    setExForm({
      name: ex.name || '',
      body_area: ex.body_area || '',
      category: ex.category || '',
      difficulty: ex.difficulty || 'beginner',
      instructions: ex.instructions || '',
      precautions: ex.precautions || '',
      equipment: ex.equipment || '',
      default_sets: ex.default_sets ?? 3,
      default_reps: ex.default_reps || '10',
      default_hold_seconds: ex.default_hold_seconds || '',
      video_url: ex.video_url || '',
      image_url: ex.image_url || '',
      pdf_url: ex.pdf_url || '',
    });
    setExModal(true);
  };

  const saveExercise = async (e) => {
    e.preventDefault();
    if (!exForm.name.trim() || !exForm.instructions.trim()) {
      toast.error('Name and instructions required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...exForm,
        default_hold_seconds: exForm.default_hold_seconds ? Number(exForm.default_hold_seconds) : null,
        default_sets: Number(exForm.default_sets) || 3,
      };
      if (editingEx) {
        await clinicPortal.hepUpdateExercise(Number(clinicId), editingEx.id, payload);
        toast.success('Exercise updated');
      } else {
        await clinicPortal.hepCreateExercise(Number(clinicId), payload);
        toast.success('Clinic exercise created');
      }
      setExModal(false);
      setLibScope('clinic');
      const r = await clinicPortal.hepLibrary(Number(clinicId), { scope: 'clinic' });
      setLibrary((r.data || r)?.exercises || []);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const archiveEx = async (ex) => {
    if (!(Number(ex.clinic_id) > 0)) return;
    if (!window.confirm(`Archive "${ex.name}"?`)) return;
    try {
      await clinicPortal.hepArchiveExercise(Number(clinicId), ex.id);
      toast.success('Archived');
      setLibrary((prev) => prev.filter((x) => x.id !== ex.id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const clonePlan = async (rx) => {
    try {
      await exercisePrescriptions.clone(rx.id);
      toast.success('Program cloned as draft');
      const r = await exercisePrescriptions.list();
      setPlans(r.data || []);
    } catch (err) {
      toast.error(err.message || 'Clone failed');
    }
  };

  const registerMedia = async (e) => {
    e.preventDefault();
    if (!mediaForm.url.trim()) {
      toast.error('URL required');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.hepRegisterMedia(Number(clinicId), mediaForm);
      toast.success('Media registered (CDN / S3 / Cloudinary URL)');
      setMediaForm({ title: '', url: '', kind: 'video', provider: 'cdn' });
      const r = await clinicPortal.hepMedia(Number(clinicId));
      setMedia(r.data || r);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activePlans = plans.filter((p) => p.status === 'active');

  return (
    <ClinicPortalShell
      title="Exercise & Rehab"
      subtitle="Library, HEP assignment, progress tracking, media and analytics"
      actions={
        section === 'library' ? (
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreateEx}>
            <FaIcon icon="fa-plus" /> Clinic exercise
          </button>
        ) : section === 'hep' ? (
          <Link to="/clinic-portal/exercises" className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" /> Assign HEP
          </Link>
        ) : null
      }
    >
      <div style={brandStyle} className="space-y-5">
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition inline-flex items-center gap-1.5 ${
                section === s.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white/70 text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <FaIcon icon={s.icon} className="text-xs opacity-80" />
              {s.label}
            </button>
          ))}
        </div>

        {section === 'dashboard' && (
          <div className="space-y-5">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Kpi label="Active programs" value={kpis.active_programs ?? 0} tone="teal" />
                  <Kpi label="Completed" value={kpis.completed_programs ?? 0} tone="emerald" />
                  <Kpi label="Avg adherence" value={`${kpis.avg_adherence ?? 0}%`} tone="sky" hint="This week" />
                  <Kpi label="High pain" value={kpis.high_pain_patients ?? 0} tone="rose" />
                  <Kpi label="Missed today" value={kpis.missed_today ?? 0} tone="amber" />
                </div>

                <div className="glass-card !p-4 md:!p-5">
                  <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FaIcon icon="fa-bell" className="text-teal-600" /> Smart alerts
                  </h2>
                  {!alerts.length ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No alerts — rehab programs look healthy.</p>
                  ) : (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                      {alerts.map((a, i) => (
                        <li key={`${a.type}-${a.prescription_id}-${i}`} className={`rounded-xl border px-3 py-2.5 text-sm ${alertTone(a.severity)}`}>
                          <p className="font-semibold">{a.title}</p>
                          <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {dash?.active_programs?.length > 0 && (
                  <div className="glass-card !p-4">
                    <h2 className="text-sm font-bold text-slate-800 mb-3">Active rehab programs</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dash.active_programs.map((p) => (
                        <div key={p.id} className="rounded-xl border border-slate-100 bg-white/60 px-3 py-2.5">
                          <p className="font-medium text-slate-800 text-sm">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.patient_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {section === 'library' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-1 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'global', label: 'TUP Global' },
                  { id: 'clinic', label: 'Clinic Library' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLibScope(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      libScope === s.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <input
                className="input-field flex-1"
                placeholder="Search exercises…"
                value={libQ}
                onChange={(e) => setLibQ(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {library.map((ex) => {
                const isGlobal = !(Number(ex.clinic_id) > 0);
                return (
                  <div
                    key={ex.id}
                    className="group rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex gap-3">
                      {ex.image_url ? (
                        <img src={ex.image_url} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                          <FaIcon icon="fa-dumbbell" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">{ex.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                          {isGlobal ? 'Global · read-only' : 'Clinic'} · {ex.difficulty || '—'}
                          {ex.body_area ? ` · ${ex.body_area}` : ''}
                        </p>
                      </div>
                    </div>
                    {(ex.video_url || ex.pdf_url) && (
                      <p className="text-[10px] text-slate-400 mt-2 flex gap-2">
                        {ex.video_url && <span><FaIcon icon="fa-video" className="mr-1" />Video</span>}
                        {ex.pdf_url && <span><FaIcon icon="fa-file-pdf" className="mr-1" />PDF</span>}
                      </p>
                    )}
                    {!isGlobal && (
                      <div className="flex gap-2 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button type="button" className="text-xs font-medium text-teal-700" onClick={() => openEditEx(ex)}>
                          Edit
                        </button>
                        <button type="button" className="text-xs font-medium text-rose-600" onClick={() => archiveEx(ex)}>
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!library.length && (
                <p className="text-sm text-slate-500 col-span-full text-center py-10">No exercises in this view.</p>
              )}
            </div>
          </div>
        )}

        {section === 'hep' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Rehab Command Center</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Create multi-exercise weekly/monthly HEPs, publish to patients, and clone programs.
                </p>
              </div>
              <Link to="/clinic-portal/exercises" className="btn-primary inline-flex items-center gap-2 shrink-0">
                <FaIcon icon="fa-wand-magic-sparkles" /> Open assignment workspace
              </Link>
            </div>
            <div className="grid gap-3">
              {plans.slice(0, 40).map((rx) => (
                <div key={rx.id} className="glass-card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{rx.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rx.patient_first_name} {rx.patient_last_name} · {rx.status}
                      {rx.publish_status ? ` · ${rx.publish_status}` : ''}
                      {rx.progress_today ? ` · today ${rx.progress_today.percent}%` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => clonePlan(rx)}>
                      <FaIcon icon="fa-clone" className="mr-1" /> Clone
                    </button>
                    <Link to="/clinic-portal/exercises" className="btn-outline !py-1.5 !px-3 text-xs">
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
              {!plans.length && <p className="text-sm text-slate-500 text-center py-8">No programs yet — assign your first HEP.</p>}
            </div>
          </div>
        )}

        {section === 'progress' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Active tracked" value={activePlans.length} tone="teal" />
              <Kpi label="Avg adherence" value={`${kpis.avg_adherence ?? '—'}%`} tone="sky" />
              <Kpi label="High-risk alerts" value={(dash?.alerts || analytics?.high_risk || []).filter((a) => a.severity !== 'success').length || 0} tone="rose" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {activePlans.map((rx) => {
                const pct = rx.progress_today?.percent ?? 0;
                return (
                  <div key={rx.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <div className="flex justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{rx.patient_first_name} {rx.patient_last_name}</p>
                        <p className="text-xs text-slate-500">{rx.title}</p>
                      </div>
                      <span className="text-sm font-bold text-teal-700">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Today · pain {rx.progress_today?.pain_avg ?? '—'}
                    </p>
                  </div>
                );
              })}
              {!activePlans.length && (
                <p className="text-sm text-slate-500 col-span-full text-center py-8">No active programs to track.</p>
              )}
            </div>
          </div>
        )}

        {section === 'media' && (
          <div className="space-y-4">
            <div className="glass-card !p-4">
              <p className="text-sm text-slate-600 mb-3">
                Register remote media URLs (AWS S3, Cloudinary, CDN). Files are not stored on the application server.
              </p>
              <form onSubmit={registerMedia} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <input className="input-field" placeholder="Title" value={mediaForm.title} onChange={(e) => setMediaForm((f) => ({ ...f, title: e.target.value }))} />
                <input className="input-field sm:col-span-2" placeholder="https://cdn…/video.mp4" value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))} required />
                <select className="input-field" value={mediaForm.kind} onChange={(e) => setMediaForm((f) => ({ ...f, kind: e.target.value }))}>
                  {['video', 'image', 'gif', 'pdf', 'performance'].map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <select className="input-field" value={mediaForm.provider} onChange={(e) => setMediaForm((f) => ({ ...f, provider: e.target.value }))}>
                  {(media.providers || ['cdn', 'aws_s3', 'cloudinary', 'local']).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-5" disabled={saving}>
                  Register media asset
                </button>
              </form>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(media.assets || []).map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-white/70 p-3 text-sm">
                  <p className="font-medium">{a.title || a.kind}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">{a.url}</p>
                  <p className="text-[10px] uppercase text-slate-400 mt-1">{a.provider} · {a.kind}</p>
                </div>
              ))}
              {(media.exercises || []).slice(0, 12).map((ex) => (
                <div key={`ex-${ex.id}`} className="rounded-xl border border-slate-100 bg-white/70 p-3 text-sm flex gap-3">
                  {ex.image_url ? <img src={ex.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-slate-100" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ex.name}</p>
                    <p className="text-xs text-slate-500">
                      {[ex.video_url && 'video', ex.image_url && 'image', ex.pdf_url && 'pdf'].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'analytics' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Active" value={analytics?.kpis?.active_programs ?? 0} />
              <Kpi label="Completed" value={analytics?.kpis?.completed_programs ?? 0} tone="emerald" />
              <Kpi label="Adherence" value={`${analytics?.kpis?.avg_adherence ?? 0}%`} tone="sky" />
              <Kpi label="High risk" value={(analytics?.high_risk || []).length} tone="rose" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass-card !p-4">
                <p className="text-sm font-semibold mb-3">Completion & pain (30d)</p>
                {(analytics?.daily || []).length ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom' } },
                      scales: {
                        y: { beginAtZero: true },
                        y1: { position: 'right', min: 0, max: 10, grid: { drawOnChartArea: false } },
                      },
                    }}
                  />
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No completion data yet.</p>
                )}
              </div>
              <div className="glass-card !p-4">
                <p className="text-sm font-semibold mb-3">Exercise popularity</p>
                {(analytics?.popular_exercises || []).length ? (
                  <Bar data={popularData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No assignments yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <GlassModal open={exModal} onClose={() => setExModal(false)} size="lg">
        <GlassModalHeader
          title={editingEx ? 'Edit clinic exercise' : 'Create clinic exercise'}
          subtitle="Local clinic library — does not modify the global TUP library"
          icon="fa-dumbbell"
          onClose={() => setExModal(false)}
        />
        <form onSubmit={saveExercise} className="flex flex-col flex-1 min-h-0">
          <GlassModalBody className="!px-4 !py-3 sm:!px-6 sm:!py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="sm:col-span-2 block text-sm font-medium text-slate-700">
                Name
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.name}
                  onChange={(e) => setExForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Ankle dorsiflexion stretch"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Body region
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.body_area}
                  onChange={(e) => setExForm((f) => ({ ...f, body_area: e.target.value }))}
                  placeholder="Knee, Shoulder…"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Difficulty
                <select
                  className="input-field mt-1.5 w-full"
                  value={exForm.difficulty}
                  onChange={(e) => setExForm((f) => ({ ...f, difficulty: e.target.value }))}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Sets
                <input
                  type="number"
                  min={1}
                  className="input-field mt-1.5 w-full"
                  value={exForm.default_sets}
                  onChange={(e) => setExForm((f) => ({ ...f, default_sets: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Reps
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.default_reps}
                  onChange={(e) => setExForm((f) => ({ ...f, default_reps: e.target.value }))}
                />
              </label>
              <label className="sm:col-span-2 block text-sm font-medium text-slate-700">
                Instructions
                <textarea
                  className="input-field mt-1.5 w-full min-h-[88px] resize-y"
                  value={exForm.instructions}
                  onChange={(e) => setExForm((f) => ({ ...f, instructions: e.target.value }))}
                  required
                  placeholder="Step-by-step instructions for the patient"
                />
              </label>
              <label className="sm:col-span-2 block text-sm font-medium text-slate-700">
                Precautions
                <textarea
                  className="input-field mt-1.5 w-full min-h-[64px] resize-y"
                  value={exForm.precautions}
                  onChange={(e) => setExForm((f) => ({ ...f, precautions: e.target.value }))}
                  placeholder="Stop if pain increases…"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Video URL (CDN/S3)
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.video_url}
                  onChange={(e) => setExForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://"
                  inputMode="url"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Image URL
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.image_url}
                  onChange={(e) => setExForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://"
                  inputMode="url"
                />
              </label>
              <label className="sm:col-span-2 block text-sm font-medium text-slate-700">
                PDF URL
                <input
                  className="input-field mt-1.5 w-full"
                  value={exForm.pdf_url}
                  onChange={(e) => setExForm((f) => ({ ...f, pdf_url: e.target.value }))}
                  placeholder="https://"
                  inputMode="url"
                />
              </label>
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
              <button type="button" className="btn-outline w-full sm:w-auto" onClick={() => setExModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </ClinicPortalShell>
  );
}
