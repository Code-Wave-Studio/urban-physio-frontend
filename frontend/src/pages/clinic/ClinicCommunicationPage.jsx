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
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import MessagePreview from '../../components/clinic/communication/MessagePreview';
import CampaignBuilderPanel from '../../components/clinic/communication/CampaignBuilderPanel';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'campaigns', label: 'Campaign Builder', icon: 'fa-wand-magic-sparkles' },
  { id: 'rules', label: 'Automated Rules', icon: 'fa-bolt' },
  { id: 'templates', label: 'Template Manager', icon: 'fa-file-lines' },
  { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
];

const CHANNEL_LIST = ['whatsapp', 'sms', 'email', 'in_app'];

function Kpi({ label, value, hint, tone = 'emerald' }) {
  const tones = {
    emerald: 'from-emerald-500/15 to-teal-500/5 text-emerald-800',
    amber: 'from-amber-500/15 to-orange-500/5 text-amber-800',
    rose: 'from-rose-500/15 to-pink-500/5 text-rose-800',
    sky: 'from-sky-500/15 to-blue-500/5 text-sky-800',
  };
  return (
    <div className={`rounded-2xl border border-white/60 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
      <p className="text-[11px] uppercase tracking-wide opacity-70 font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint ? <p className="text-xs opacity-60 mt-1">{hint}</p> : null}
    </div>
  );
}

function parseChannels(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : CHANNEL_LIST;
    } catch {
      return CHANNEL_LIST;
    }
  }
  return CHANNEL_LIST;
}

export default function ClinicCommunicationPage() {
  const { clinicId, can, loading: boot } = useClinicPortal();
  const [params, setParams] = useSearchParams();
  const section = params.get('tab') || 'dashboard';
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [audiences, setAudiences] = useState({});
  const [automationEvents, setAutomationEvents] = useState({});
  const [histFilter, setHistFilter] = useState({ channel: '', status: '', q: '' });
  const [tplQ, setTplQ] = useState('');
  const [providers, setProviders] = useState([]);

  const setSection = (id) => setParams({ tab: id }, { replace: true });

  const loadCore = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [d, t] = await Promise.all([
        clinicPortal.commDashboard(clinicId),
        clinicPortal.notificationTemplates(clinicId, { meta: 1 }),
      ]);
      setDash(d.data || d);
      const meta = t.data || t;
      if (Array.isArray(meta)) {
        setTemplates(meta);
      } else {
        setTemplates(meta.templates || []);
        setAudiences(meta.audiences || {});
        setAutomationEvents(meta.automation_events || {});
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load communication engine');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) loadCore();
  }, [clinicId, loadCore]);

  useEffect(() => {
    if (!clinicId || section !== 'history') return;
    const t = setTimeout(() => {
      clinicPortal
        .commHistory(clinicId, {
          channel: histFilter.channel || undefined,
          status: histFilter.status || undefined,
          q: histFilter.q || undefined,
          limit: 80,
        })
        .then((r) => setHistory(r.data || r || []))
        .catch((e) => toast.error(e.message || 'Failed to load history'));
    }, histFilter.q ? 350 : 0);
    return () => clearTimeout(t);
  }, [clinicId, section, histFilter]);

  useEffect(() => {
    if (!clinicId || section !== 'analytics') return;
    clinicPortal
      .commAnalytics(clinicId, { days: 30 })
      .then((r) => setAnalytics(r.data || r))
      .catch((e) => toast.error(e.message || 'Failed to load analytics'));
  }, [clinicId, section]);

  useEffect(() => {
    if (!clinicId || !can('notifications.manage')) return;
    if (section !== 'templates' && section !== 'dashboard') return;
    clinicPortal
      .commProviders(clinicId)
      .then((r) => setProviders(r.data || r || []))
      .catch(() => {});
  }, [clinicId, section, can]);

  const kpis = dash?.kpis || analytics?.kpis || {};

  const lineData = useMemo(() => {
    const daily = (analytics?.daily || dash?.daily || []);
    return {
      labels: daily.map((d) => String(d.day || d.date || '').slice(5)),
      datasets: [
        {
          label: 'Sent',
          data: daily.map((d) => Number(d.total || d.sent || 0)),
          borderColor: '#059669',
          backgroundColor: 'rgba(5,150,105,0.15)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'WhatsApp',
          data: daily.map((d) => Number(d.whatsapp || 0)),
          borderColor: '#25D366',
          backgroundColor: 'rgba(37,211,102,0.08)',
          fill: false,
          tension: 0.35,
        },
      ],
    };
  }, [analytics, dash]);

  const doughnutData = useMemo(() => ({
    labels: ['WhatsApp', 'SMS', 'Email', 'In-App'],
    datasets: [{
      data: [kpis.whatsapp_sent || kpis.whatsapp || 0, kpis.sms_sent || kpis.sms || 0, kpis.emails_sent || kpis.email || 0, kpis.in_app || 0],
      backgroundColor: ['#25D366', '#0ea5e9', '#8b5cf6', '#64748b'],
      borderWidth: 0,
    }],
  }), [kpis]);

  if (!boot && !can('notifications.view')) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const autoRules = templates.filter((t) => (t.mode || 'auto') === 'auto');
  const filteredTpls = templates.filter((t) => {
    if (!tplQ.trim()) return true;
    const q = tplQ.toLowerCase();
    return [t.name, t.event_key, t.category, t.body_template].join(' ').toLowerCase().includes(q);
  });

  const saveRule = async (tpl) => {
    try {
      await clinicPortal.saveNotificationTemplate(clinicId, tpl.id, {
        is_enabled: Boolean(Number(tpl.is_enabled)),
        timing_hours: tpl.timing_hours === '' || tpl.timing_hours == null ? null : Number(tpl.timing_hours),
        subject: tpl.subject || '',
        body_template: tpl.body_template || '',
        channels: parseChannels(tpl.channels_json),
        mode: 'auto',
      });
      toast.success('Rule saved');
      loadCore();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
  };

  const duplicateTpl = async (id) => {
    try {
      await clinicPortal.duplicateNotificationTemplate(clinicId, id);
      toast.success('Template duplicated');
      loadCore();
    } catch (e) {
      toast.error(e.message || 'Duplicate failed');
    }
  };

  const archiveTpl = async (id) => {
    try {
      await clinicPortal.saveNotificationTemplate(clinicId, id, { is_archived: 1 });
      toast.success('Template archived');
      loadCore();
    } catch (e) {
      toast.error(e.message || 'Archive failed');
    }
  };

  const createManualTpl = async () => {
    try {
      await clinicPortal.createNotificationTemplate(clinicId, {
        name: 'New manual template',
        body_template: 'Hi {{patient_name}}, message from {{clinic_name}}.',
        mode: 'manual',
        category: 'general',
        channels: ['whatsapp', 'sms', 'email'],
      });
      toast.success('Template created');
      loadCore();
    } catch (e) {
      toast.error(e.message || 'Create failed');
    }
  };

  const syncWa = async () => {
    try {
      const res = await clinicPortal.commSyncWhatsAppTemplates(clinicId);
      toast.success(res.message || res.data?.message || 'WhatsApp templates synced');
      loadCore();
    } catch (e) {
      toast.error(e.message || 'Sync failed');
    }
  };

  return (
    <ClinicPortalShell
      title="Communication"
      subtitle="Omnichannel campaigns, automations & delivery analytics"
    >
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
              section === s.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
            }`}
          >
            <FaIcon icon={s.icon} />
            {s.label}
          </button>
        ))}
      </div>

      {loading && <div className="glass-card p-8 text-center text-slate-500">Loading communication engine…</div>}

      {!loading && section === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Total Messages" value={kpis.total_messages ?? kpis.total ?? 0} tone="sky" />
            <Kpi label="Delivery Rate" value={`${kpis.delivery_rate ?? 0}%`} tone="emerald" />
            <Kpi label="Read Rate" value={`${kpis.read_rate ?? 0}%`} tone="amber" />
            <Kpi label="Failed" value={kpis.failed_messages ?? 0} tone="rose" />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="glass-card p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase">Active Rules</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dash?.active_rules ?? 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase">Scheduled</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dash?.scheduled_campaigns ?? 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase">Unread Replies</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{dash?.unread_replies ?? 0}</p>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="glass-card p-4 lg:col-span-2">
              <h3 className="font-bold text-slate-800 mb-3">30-day volume</h3>
              <div className="h-56">
                {(lineData.labels || []).length === 0 ? (
                  <p className="h-full flex items-center justify-center text-sm text-slate-500">No message volume yet</p>
                ) : (
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                )}
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="font-bold text-slate-800 mb-3">By channel</h3>
              <div className="h-56 flex items-center justify-center">
                {(doughnutData.datasets?.[0]?.data || []).every((n) => !n) ? (
                  <p className="text-sm text-slate-500">No channel data yet</p>
                ) : (
                  <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                )}
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">Recent deliveries</h3>
              <button type="button" className="text-sm text-emerald-700 font-semibold" onClick={() => setSection('history')}>View all</button>
            </div>
            <ul className="divide-y divide-slate-100">
              {(dash?.recent || []).slice(0, 6).map((row) => (
                <li key={row.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{row.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{row.channel} · {row.user_name || row.recipient || '—'}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    row.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : row.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>{row.status}</span>
                </li>
              ))}
              {!dash?.recent?.length && <li className="py-6 text-center text-slate-500 text-sm">No messages yet</li>}
            </ul>
          </div>
        </div>
      )}

      {!loading && section === 'campaigns' && (
        <CampaignBuilderPanel
          clinicId={clinicId}
          audiences={audiences}
          templates={templates}
          canSend={can('notifications.send')}
          canManage={can('notifications.manage')}
          onSent={() => {
            loadCore();
          }}
        />
      )}

      {!loading && section === 'rules' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Trigger-based automations. Enable, set timing, and choose channels.</p>
          {autoRules.map((tpl) => (
            <article key={tpl.id} className="glass-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {automationEvents[tpl.event_key] || tpl.event_key} · {tpl.category || 'general'}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(Number(tpl.is_enabled))}
                    onChange={(e) => {
                      const next = templates.map((t) => (t.id === tpl.id ? { ...t, is_enabled: e.target.checked ? 1 : 0 } : t));
                      setTemplates(next);
                    }}
                  />
                  Enabled
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <label className="block text-xs">
                  Timing (hours)
                  <input
                    className="input-field mt-1"
                    type="number"
                    value={tpl.timing_hours ?? ''}
                    onChange={(e) => setTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, timing_hours: e.target.value } : t)))}
                  />
                </label>
                <label className="block text-xs">
                  Subject
                  <input
                    className="input-field mt-1"
                    value={tpl.subject || ''}
                    onChange={(e) => setTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, subject: e.target.value } : t)))}
                  />
                </label>
              </div>
              <textarea
                className="input-field mt-3 min-h-[80px] text-sm"
                value={tpl.body_template || ''}
                onChange={(e) => setTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, body_template: e.target.value } : t)))}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {CHANNEL_LIST.map((ch) => {
                  const chs = parseChannels(tpl.channels_json);
                  const on = chs.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      className={`text-[11px] px-2.5 py-1 rounded-full border capitalize ${on ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'border-slate-200 text-slate-500'}`}
                      onClick={() => {
                        const next = on ? chs.filter((c) => c !== ch) : [...chs, ch];
                        setTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, channels_json: JSON.stringify(next.length ? next : ['in_app']) } : t)));
                      }}
                    >
                      {ch.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
              {can('notifications.manage') && (
                <button type="button" className="btn-primary mt-3 text-sm" onClick={() => saveRule(tpl)}>Save rule</button>
              )}
            </article>
          ))}
          {!autoRules.length && <div className="glass-card p-8 text-center text-slate-500">No automation rules yet</div>}
        </div>
      )}

      {!loading && section === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <input className="input-field max-w-xs" placeholder="Search templates…" value={tplQ} onChange={(e) => setTplQ(e.target.value)} />
            <div className="flex gap-2">
              {can('notifications.manage') && (
                <>
                  <button type="button" className="btn-outline text-sm" onClick={syncWa}>
                    <FaIcon icon="fa-brands fa-whatsapp" className="mr-1" /> Sync WA templates
                  </button>
                  <button type="button" className="btn-primary text-sm" onClick={createManualTpl}>
                    <FaIcon icon="fa-plus" className="mr-1" /> New template
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {filteredTpls.map((tpl) => (
              <article key={tpl.id} className="glass-card p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{tpl.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">{tpl.mode} · {tpl.category || 'general'} · v{tpl.version || 1}</p>
                  </div>
                  {tpl.wa_template_status && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 h-fit">{tpl.wa_template_status}</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap">{tpl.body_template}</p>
                {can('notifications.manage') && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="text-xs font-semibold text-emerald-700" onClick={() => duplicateTpl(tpl.id)}>Duplicate</button>
                    <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => archiveTpl(tpl.id)}>Archive</button>
                    <Link to={`/clinic-portal/notifications/manage`} className="text-xs font-semibold text-sky-700">Edit in setup</Link>
                  </div>
                )}
              </article>
            ))}
          </div>
          {!filteredTpls.length && <div className="glass-card p-8 text-center text-slate-500">No templates found</div>}

          {can('notifications.manage') && providers.length > 0 && (
            <div className="glass-card p-4 mt-4">
              <h3 className="font-bold text-slate-800 mb-3">Provider configuration</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {providers.map((p) => (
                  <div key={`${p.channel}-${p.provider}`} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <p className="font-semibold capitalize">{p.channel} · {p.provider}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.is_enabled ? 'Enabled' : 'Disabled'}
                      {p.env_configured ? ' · env ready' : ''}
                      {p.is_primary ? ' · primary' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && section === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input className="input-field flex-1 min-w-[160px]" placeholder="Search…" value={histFilter.q} onChange={(e) => setHistFilter((f) => ({ ...f, q: e.target.value }))} />
            <select className="input-field w-auto" value={histFilter.channel} onChange={(e) => setHistFilter((f) => ({ ...f, channel: e.target.value }))}>
              <option value="">All channels</option>
              {CHANNEL_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input-field w-auto" value={histFilter.status} onChange={(e) => setHistFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              {['pending', 'sent', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50/80">
                <tr>
                  <th className="px-3 py-2">Patient / Recipient</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Sent</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.user_name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{row.title}</p>
                    </td>
                    <td className="px-3 py-2 capitalize">{row.channel}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        row.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : row.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>{row.status}</span>
                      {row.last_error ? <p className="text-[10px] text-rose-500 mt-1 max-w-[180px] truncate">{row.last_error}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{String(row.sent_at || row.created_at || '').slice(0, 16)}</td>
                    <td className="px-3 py-2 text-xs capitalize">{row.trigger_source || '—'}</td>
                  </tr>
                ))}
                {!history.length && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">No communication history yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && section === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="WhatsApp" value={kpis.whatsapp_sent ?? kpis.whatsapp ?? 0} tone="emerald" />
            <Kpi label="SMS" value={kpis.sms_sent ?? kpis.sms ?? 0} tone="sky" />
            <Kpi label="Email" value={kpis.emails_sent ?? kpis.email ?? 0} tone="amber" />
            <Kpi label="Engagement" value={`${kpis.engagement_rate ?? 0}%`} tone="sky" />
          </div>
          <div className="glass-card p-4">
            <h3 className="font-bold mb-3">Campaign performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="text-xs uppercase text-slate-500 text-left">
                  <tr>
                    <th className="py-2">Campaign</th>
                    <th className="py-2">Sent</th>
                    <th className="py-2">Delivered</th>
                    <th className="py-2">Failed</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.campaigns || []).map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-2 font-medium">{c.title || c.name}</td>
                      <td className="py-2">{c.sent_count ?? 0}</td>
                      <td className="py-2">{c.delivered_count ?? 0}</td>
                      <td className="py-2">{c.failed_count ?? 0}</td>
                      <td className="py-2 capitalize text-xs">{c.status}</td>
                    </tr>
                  ))}
                  {!analytics?.campaigns?.length && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No campaigns in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="glass-card p-4 h-64">
            {(lineData.labels || []).length === 0 ? (
              <p className="h-full flex items-center justify-center text-sm text-slate-500">No analytics data for this period</p>
            ) : (
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
