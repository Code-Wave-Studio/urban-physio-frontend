import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';
import MessagePreview from './MessagePreview';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', brand: true },
  { id: 'sms', label: 'SMS', icon: 'fa-message' },
  { id: 'email', label: 'Email', icon: 'fa-envelope' },
  { id: 'in_app', label: 'In-App', icon: 'fa-bell' },
];

const STEPS = [
  { id: 1, label: 'Audience' },
  { id: 2, label: 'Message' },
  { id: 3, label: 'Review & send' },
];

const ALL_CHANNELS = ['whatsapp', 'sms', 'email', 'in_app'];

const EMPTY = {
  title: '',
  subject: '',
  message: '',
  audience_key: 'all',
  channels: [...ALL_CHANNELS],
  scheduled_at: '',
  template_id: '',
  media_url: '',
  campaign_type: 'broadcast',
};

const STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-sky-50 text-sky-800 border-sky-200',
  sent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
};

function parseChannels(raw) {
  if (Array.isArray(raw)) return raw.length ? raw : [...ALL_CHANNELS];
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) && j.length ? j : [...ALL_CHANNELS];
    } catch {
      return [...ALL_CHANNELS];
    }
  }
  return [...ALL_CHANNELS];
}

function maskPhone(phone) {
  const p = String(phone || '').replace(/\s+/g, '');
  if (!p) return '—';
  if (p.length <= 4) return p;
  return `${'•'.repeat(Math.min(6, p.length - 4))}${p.slice(-4)}`;
}

function maskEmail(email) {
  const e = String(email || '').trim();
  if (!e || !e.includes('@')) return e || '—';
  const [user, domain] = e.split('@');
  const u = user.length <= 2 ? `${user[0] || ''}•` : `${user.slice(0, 2)}${'•'.repeat(Math.min(4, user.length - 2))}`;
  return `${u}@${domain}`;
}

function recipientReachable(r, channels) {
  return channels.some((ch) => {
    if (ch === 'whatsapp') return r.can_whatsapp;
    if (ch === 'sms') return r.can_sms;
    if (ch === 'email') return r.can_email;
    if (ch === 'in_app') return r.can_in_app;
    return false;
  });
}

export default function CampaignBuilderPanel({
  clinicId,
  audiences = {},
  templates = [],
  canSend = false,
  canManage = false,
  onSent,
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [audienceCount, setAudienceCount] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientsTruncated, setRecipientsTruncated] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [previewCh, setPreviewCh] = useState('whatsapp');
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [audienceMap, setAudienceMap] = useState(audiences);

  const manualTpls = useMemo(
    () => templates.filter((t) => (t.mode || '') === 'manual' || t.event_key === 'custom_manual'),
    [templates]
  );
  const autoTpls = useMemo(
    () => templates.filter((t) => (t.mode || 'auto') === 'auto'),
    [templates]
  );

  const loadCampaigns = useCallback(async () => {
    if (!clinicId) return;
    setListLoading(true);
    try {
      const res = await clinicPortal.listCampaigns(clinicId);
      setCampaigns(res.data || res || []);
    } catch {
      setCampaigns([]);
    } finally {
      setListLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (audiences && Object.keys(audiences).length) setAudienceMap(audiences);
  }, [audiences]);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    setAudienceLoading(true);
    clinicPortal
      .commAudiencePreview(clinicId, { audience: form.audience_key, limit: 200 })
      .then((r) => {
        if (cancelled) return;
        setAudienceCount(r.data?.count ?? 0);
        setRecipients(Array.isArray(r.data?.recipients) ? r.data.recipients : r.data?.sample || []);
        setRecipientsTruncated(Boolean(r.data?.truncated));
        if (r.data?.presets) setAudienceMap(r.data.presets);
      })
      .catch(() => {
        if (!cancelled) {
          setAudienceCount(null);
          setRecipients([]);
          setRecipientsTruncated(false);
        }
      })
      .finally(() => {
        if (!cancelled) setAudienceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId, form.audience_key]);

  useEffect(() => {
    setRecipientQuery('');
  }, [form.audience_key]);

  const filteredRecipients = useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => {
      const hay = `${r.name || ''} ${r.phone || ''} ${r.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [recipients, recipientQuery]);

  const reachStats = useMemo(() => {
    const total = recipients.length;
    let reachable = 0;
    recipients.forEach((r) => {
      if (recipientReachable(r, form.channels)) reachable += 1;
    });
    return { total, reachable, skipped: total - reachable };
  }, [recipients, form.channels]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleChannel = (id) => {
    setForm((f) => {
      const has = f.channels.includes(id);
      const next = has ? f.channels.filter((c) => c !== id) : [...f.channels, id];
      return { ...f, channels: next.length ? next : ['in_app'] };
    });
  };

  const applyTemplate = (id) => {
    const tpl = templates.find((t) => String(t.id) === String(id));
    if (!tpl) {
      set({ template_id: id });
      return;
    }
    set({
      template_id: id,
      title: tpl.name || form.title,
      subject: tpl.subject || tpl.name || form.subject,
      message: tpl.body_template || form.message,
      channels: parseChannels(tpl.channels_json),
      media_url: tpl.media_url || '',
    });
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.audience_key) {
        toast.error('Pick an audience');
        return false;
      }
      if (!form.channels.length) {
        toast.error('Select at least one channel');
        return false;
      }
      if (audienceCount === 0) {
        toast.error('This audience has 0 patients — pick another');
        return false;
      }
    }
    if (s === 2) {
      if (!form.title.trim() || !form.message.trim()) {
        toast.error('Title and message are required');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const resetForm = () => {
    setForm(EMPTY);
    setStep(1);
    setPreviewCh('whatsapp');
  };

  const saveCampaign = async (sendNow) => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    if (sendNow && !canSend) {
      toast.error('You do not have permission to send');
      return;
    }
    if (!sendNow && !canManage) {
      toast.error('You do not have permission to save drafts');
      return;
    }
    setSaving(true);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), 75000);
    try {
      const payload = {
        title: form.title.trim(),
        subject: (form.subject || form.title).trim(),
        message: form.message.trim(),
        audience_key: form.audience_key,
        channels: form.channels?.length ? form.channels : [...ALL_CHANNELS],
        smart_route: false,
        campaign_type: form.campaign_type || 'broadcast',
        media_url: form.media_url || undefined,
        template_id: form.template_id || undefined,
        scheduled_at: form.scheduled_at || undefined,
        send_now: Boolean(sendNow),
        filters: { audience: form.audience_key },
      };
      const res = await clinicPortal.createCampaign(clinicId, payload, { signal: controller?.signal, timeout: 70000 });
      const data = res?.data ?? res ?? {};
      const sent = Number(data.sent_count ?? 0);
      const failed = Number(data.failed_count ?? 0);
      const dispatched = Number(data?.dispatched?.sent ?? 0);
      const status = data.status || (sendNow ? 'sent' : 'draft');
      if (sendNow) {
        toast.success(
          status === 'sent'
            ? `Campaign sent · ${sent} patient${sent === 1 ? '' : 's'}` +
                (failed ? ` · ${failed} skipped` : '') +
                (dispatched ? ` · ${dispatched} delivered` : '')
            : `Campaign queued · ${sent} patient${sent === 1 ? '' : 's'}`
        );
        // Stay on builder; refresh list so status is visible (don't jump away mid-feedback)
        resetForm();
        await loadCampaigns();
        onSent?.();
      } else {
        toast.success(form.scheduled_at ? 'Campaign scheduled' : 'Draft saved — use Send now in the list below');
        resetForm();
        await loadCampaigns();
      }
    } catch (e) {
      const aborted = e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.message?.includes?.('abort');
      toast.error(
        aborted
          ? 'Send timed out — check Recent campaigns / History. Cron may still deliver pending messages.'
          : e.message || 'Campaign failed'
      );
      loadCampaigns();
    } finally {
      clearTimeout(timer);
      setSaving(false);
    }
  };

  const sendExisting = async (row) => {
    if (!canSend) {
      toast.error('You do not have permission to send');
      return;
    }
    setSendingId(row.id);
    try {
      const res = await clinicPortal.sendCampaign(clinicId, row.id, { timeout: 70000 });
      const data = res?.data ?? res ?? {};
      toast.success(`Sent to ${data?.sent_count ?? 0} patients`);
      await loadCampaigns();
      onSent?.();
    } catch (e) {
      toast.error(e.message || 'Send failed');
      loadCampaigns();
    } finally {
      setSendingId(null);
    }
  };

  const audienceEntries = Object.keys(audienceMap || {}).length
    ? audienceMap
    : {
        all: 'All Patients (same as Patients page)',
        active_patients: 'Active Patients (online + visit 90d)',
        appointments_today: 'Appointments Today',
        pending_payments: 'Pending Payments',
      };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="glass-card !p-3 sm:!p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Campaign Builder</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Build once, preview live, then save or send.
            </p>
          </div>
          <button type="button" className="btn-outline text-xs !py-2 w-full sm:w-auto" onClick={resetForm}>
            <FaIcon icon="fa-rotate-left" className="mr-1.5" />
            Reset
          </button>
        </div>

        <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <li key={s.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (s.id < step || (s.id === step + 1 && validateStep(step))) setStep(s.id);
                    else if (s.id <= step) setStep(s.id);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold border transition ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : done
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                      active ? 'bg-white/20' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100'
                    }`}
                  >
                    {done ? <FaIcon icon="fa-check" /> : s.id}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <FaIcon icon="fa-chevron-right" className="text-slate-300 text-[10px]" />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] gap-4 sm:gap-5">
        <div className="glass-card !p-4 sm:!p-5 space-y-4 min-w-0">
          {step === 1 && (
            <>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Audience</span>
                <select
                  className="input-field mt-1.5"
                  value={form.audience_key}
                  onChange={(e) => set({ audience_key: e.target.value })}
                >
                  {Object.entries(audienceEntries).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-2 font-medium text-emerald-700">
                  {audienceLoading || audienceCount == null
                    ? 'Counting patients…'
                    : `${audienceCount} patient${audienceCount === 1 ? '' : 's'} matched${
                        form.audience_key === 'all' ? ' (same list as Patients page)' : ''
                      }`}
                </p>
              </label>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Channels</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  All selected by default — message goes on every selected channel. Tap to unselect any you don’t want.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {CHANNELS.map((ch) => {
                    const on = form.channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          on
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <FaIcon icon={ch.icon} brand={ch.brand} className="text-base" />
                        <p className="text-xs font-bold mt-1.5">{ch.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Schedule (optional)</span>
                <input
                  type="datetime-local"
                  className="input-field mt-1.5"
                  value={form.scheduled_at}
                  onChange={(e) => set({ scheduled_at: e.target.value })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Leave empty to send immediately from Review.</p>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Start from template</span>
                <select
                  className="input-field mt-1.5"
                  value={form.template_id}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  <option value="">Custom message</option>
                  {[...manualTpls, ...autoTpls].map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Campaign title *</span>
                <input
                  className="input-field mt-1.5"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. August wellness offer"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email subject</span>
                <input
                  className="input-field mt-1.5"
                  value={form.subject}
                  onChange={(e) => set({ subject: e.target.value })}
                  placeholder="Shown for email channel"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message *</span>
                <textarea
                  className="input-field mt-1.5 min-h-[160px] sm:min-h-[200px]"
                  value={form.message}
                  onChange={(e) => set({ message: e.target.value })}
                  placeholder="Hi {{patient_name}}, … Use {{clinic_name}} for clinic name."
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Variables: {'{{patient_name}}'}, {'{{clinic_name}}'}
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Media URL (optional)</span>
                <input
                  className="input-field mt-1.5"
                  value={form.media_url}
                  onChange={(e) => set({ media_url: e.target.value })}
                  placeholder="https://…"
                />
              </label>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h4 className="font-bold text-slate-900">Ready to go</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex justify-between gap-3">
                    <span className="text-slate-500">Audience</span>
                    <span className="font-semibold text-right">
                      {audienceEntries[form.audience_key] || form.audience_key}
                      {audienceCount != null ? ` · ${audienceCount}` : ''}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-slate-500">Channels</span>
                    <span className="font-semibold capitalize text-right">{form.channels.join(', ').replace(/_/g, ' ')}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-slate-500">Title</span>
                    <span className="font-semibold text-right truncate max-w-[60%]">{form.title || '—'}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-slate-500">When</span>
                    <span className="font-semibold text-right">
                      {form.scheduled_at ? `Scheduled ${form.scheduled_at.replace('T', ' ')}` : 'Send now'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {form.message || 'No message'}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                <div className="px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">Patients who will receive this</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {audienceLoading
                        ? 'Loading list…'
                        : audienceCount == null
                          ? 'Could not load audience'
                          : `${reachStats.reachable} reachable of ${audienceCount} matched${
                              reachStats.skipped ? ` · ${reachStats.skipped} may skip (no contact for selected channels)` : ''
                            }`}
                    </p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      className="input-field !pl-8 !py-2 text-sm"
                      placeholder="Search name / phone…"
                      value={recipientQuery}
                      onChange={(e) => setRecipientQuery(e.target.value)}
                      disabled={audienceLoading || !recipients.length}
                    />
                  </div>
                </div>

                {audienceLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
                    Loading patients…
                  </div>
                ) : !recipients.length ? (
                  <div className="p-8 text-center text-sm text-slate-500">No patients in this audience.</div>
                ) : (
                  <ul className="max-h-[min(52vh,420px)] overflow-y-auto divide-y divide-slate-100">
                    {filteredRecipients.map((r) => {
                      const ok = recipientReachable(r, form.channels);
                      const initials = r.initials || String(r.name || 'P').slice(0, 1).toUpperCase();
                      return (
                        <li
                          key={`${r.patient_id || r.clinic_patient_id || r.user_id}-${r.phone || r.email || r.name}`}
                          className={`flex items-start gap-3 px-3 sm:px-4 py-3 transition ${
                            ok ? 'bg-white hover:bg-emerald-50/40' : 'bg-amber-50/40'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                              ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}
                            aria-hidden
                          >
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">{r.name || 'Patient'}</p>
                              {!ok && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  May skip
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {maskPhone(r.phone)}
                              {r.email ? ` · ${maskEmail(r.email)}` : ''}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {CHANNELS.filter((ch) => form.channels.includes(ch.id)).map((ch) => {
                                const can =
                                  (ch.id === 'whatsapp' && r.can_whatsapp) ||
                                  (ch.id === 'sms' && r.can_sms) ||
                                  (ch.id === 'email' && r.can_email) ||
                                  (ch.id === 'in_app' && r.can_in_app);
                                return (
                                  <span
                                    key={ch.id}
                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                                      can
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                                    }`}
                                    title={can ? `${ch.label} available` : `No ${ch.label} contact`}
                                  >
                                    <FaIcon icon={ch.icon} brand={ch.brand} className="text-[9px]" />
                                    {ch.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {!filteredRecipients.length && (
                      <li className="p-6 text-center text-sm text-slate-500">No match for “{recipientQuery}”.</li>
                    )}
                  </ul>
                )}

                {recipientsTruncated && audienceCount != null && (
                  <p className="px-3 sm:px-4 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50/60">
                    Showing first {recipients.length} of {audienceCount}. Full list is used when you send.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="btn-outline text-sm w-full sm:w-auto"
              disabled={step === 1 || saving}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {step < 3 ? (
                <button type="button" className="btn-primary text-sm w-full sm:w-auto justify-center" onClick={goNext}>
                  Continue
                  <FaIcon icon="fa-arrow-right" className="ml-2 text-xs" />
                </button>
              ) : (
                <>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-outline text-sm w-full sm:w-auto justify-center"
                      disabled={saving}
                      onClick={() => saveCampaign(false)}
                    >
                      {form.scheduled_at ? 'Schedule' : 'Save draft'}
                    </button>
                  )}
                  {canSend && (
                    <button
                      type="button"
                      className="btn-primary text-sm w-full sm:w-auto justify-center min-w-[9rem]"
                      disabled={saving || Boolean(form.scheduled_at)}
                      onClick={() => saveCampaign(true)}
                      title={form.scheduled_at ? 'Clear schedule to send now' : 'Send immediately'}
                    >
                      {saving ? (
                        <>
                          <FaIcon icon="fa-spinner" className="mr-2 fa-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <FaIcon icon="fa-paper-plane" className="mr-2" />
                          Send now
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {!canSend && !canManage && (
            <p className="text-xs text-slate-500">You do not have permission to create or send campaigns.</p>
          )}
        </div>

        {/* Preview */}
        <div className="glass-card !p-4 sm:!p-5 self-start lg:sticky lg:top-24">
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {['whatsapp', 'sms', 'email'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setPreviewCh(ch)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg capitalize font-semibold ${
                  previewCh === ch ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          <MessagePreview
            channel={previewCh}
            subject={form.subject || form.title}
            body={form.message}
            mediaUrl={form.media_url}
          />
          <p className="text-center text-[11px] text-slate-400 mt-4">Live preview · updates as you type</p>
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Recent campaigns</h3>
            <p className="text-xs text-slate-500">Drafts stay here until you send — status updates after delivery.</p>
          </div>
          <button type="button" className="text-xs font-semibold text-emerald-700" onClick={loadCampaigns}>
            Refresh
          </button>
        </div>
        {listLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No campaigns yet. Build one above.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {campaigns.slice(0, 12).map((row) => {
              const st = String(row.status || 'draft').toLowerCase();
              const canPush = ['draft', 'scheduled'].includes(st) && canSend;
              return (
                <li key={row.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{row.title || row.name}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[st] || STATUS_STYLE.draft}`}>
                        {st}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {(row.campaign_type || 'broadcast').replace(/_/g, ' ')}
                      {row.sent_count != null ? ` · ${row.sent_count} recipients` : ''}
                      {row.sent_at ? ` · sent ${String(row.sent_at).slice(0, 16).replace('T', ' ')}` : ''}
                      {row.scheduled_at && st === 'scheduled'
                        ? ` · schedule ${String(row.scheduled_at).slice(0, 16).replace('T', ' ')}`
                        : ''}
                    </p>
                  </div>
                  {canPush && (
                    <button
                      type="button"
                      className="btn-primary text-xs !py-2 w-full sm:w-auto shrink-0 justify-center"
                      disabled={sendingId === row.id}
                      onClick={() => sendExisting(row)}
                    >
                      {sendingId === row.id ? 'Sending…' : 'Send now'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
