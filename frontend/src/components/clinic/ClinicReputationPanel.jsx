import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import ReviewStars from '../platform/ReviewStars';
import { clinicPortal } from '../../services/api';

function moneyPct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function sentimentClass(s) {
  if (s === 'negative') return 'bg-rose-50 text-rose-800 border-rose-100';
  if (s === 'positive') return 'bg-emerald-50 text-emerald-800 border-emerald-100';
  return 'bg-slate-50 text-slate-700 border-slate-100';
}

export default function ClinicReputationPanel({ clinicId, clinicSlug }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState({
    auto_request_enabled: true,
    delay_hours: 24,
    channels: ['whatsapp', 'sms', 'email', 'in_app'],
  });
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState({ q: '', rating: '', sentiment: '', unreplied: '' });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!clinicId) return;
    try {
      const r = await clinicPortal.reputationOverview(clinicId);
      const d = r.data || r;
      setAnalytics(d.analytics || null);
      if (d.settings) setSettings(d.settings);
    } catch (e) {
      toast.error(e.message || 'Could not load reputation overview');
    }
  }, [clinicId]);

  const loadInbox = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const r = await clinicPortal.reputationReviews(clinicId, {
        q: filters.q || undefined,
        rating: filters.rating || undefined,
        sentiment: filters.sentiment || undefined,
        unreplied: filters.unreplied ? 1 : undefined,
      });
      setReviews((r.data || r)?.reviews || []);
    } catch (e) {
      toast.error(e.message || 'Inbox failed');
    } finally {
      setLoading(false);
    }
  }, [clinicId, filters]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const t = setTimeout(loadInbox, filters.q ? 280 : 0);
    return () => clearTimeout(t);
  }, [loadInbox, filters.q]);

  const openReview = (r) => {
    setSelected(r);
    setReply(r.clinic_reply || '');
  };

  const applySuggestion = (text) => setReply(text);

  const saveReply = async () => {
    if (!selected || !reply.trim()) {
      toast.error('Write a reply first');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.reputationReply(clinicId, selected.id, { reply: reply.trim() });
      toast.success('Reply published');
      setSelected((s) => (s ? { ...s, clinic_reply: reply.trim() } : s));
      loadInbox();
      loadOverview();
    } catch (e) {
      toast.error(e.message || 'Reply failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteReply = async () => {
    if (!selected || !window.confirm('Remove clinic reply?')) return;
    setSaving(true);
    try {
      await clinicPortal.reputationDeleteReply(clinicId, selected.id);
      toast.success('Reply removed');
      setReply('');
      setSelected((s) => (s ? { ...s, clinic_reply: null } : s));
      loadInbox();
    } catch (e) {
      toast.error(e.message || 'Could not delete reply');
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async (r, isPublic) => {
    try {
      await clinicPortal.reputationModerate(clinicId, r.id, { is_public: isPublic, is_approved: r.is_approved });
      toast.success(isPublic ? 'Visible on public profile' : 'Hidden from public profile');
      loadInbox();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const r = await clinicPortal.reputationSaveSettings(clinicId, settings);
      setSettings(r.data || r || settings);
      toast.success('Auto review-request settings saved');
    } catch (e) {
      toast.error(e.message || 'Settings failed');
    } finally {
      setSaving(false);
    }
  };

  const dist = analytics?.rating_distribution || {};
  const maxDist = Math.max(1, ...Object.values(dist).map(Number));

  const publicUrl = clinicSlug
    ? `/clinic/${clinicSlug}`
    : clinicId
      ? `/clinic/id/${clinicId}`
      : null;

  const channelToggle = (ch) => {
    const set = new Set(settings.channels || []);
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    setSettings((s) => ({ ...s, channels: [...set] }));
  };

  const suggestions = useMemo(() => selected?.suggestions || [], [selected]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Reputation &amp; Reviews</p>
          <p className="text-sm text-slate-600 mt-0.5">
            Inbox, AI reply suggestions, sentiment insights, and automatic review requests after completed appointments.
          </p>
        </div>
        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-outline text-xs shrink-0">
            <FaIcon icon="fa-arrow-up-right-from-square" className="mr-1" /> Preview public profile
          </a>
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card !p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Average</p>
          <p className="text-2xl font-bold mt-1">{analytics?.average_rating?.toFixed?.(1) ?? analytics?.average_rating ?? '—'}</p>
          <ReviewStars rating={analytics?.average_rating || 0} count={analytics?.total_reviews || 0} size="sm" showValue={false} />
        </div>
        <div className="glass-card !p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Total</p>
          <p className="text-2xl font-bold mt-1">{analytics?.total_reviews ?? 0}</p>
          <p className="text-xs text-slate-500">This month: {analytics?.monthly_reviews ?? 0}</p>
        </div>
        <div className="glass-card !p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">Response rate</p>
          <p className="text-2xl font-bold mt-1">{moneyPct(analytics?.response_rate)}</p>
          <p className="text-xs text-slate-500">
            +{analytics?.positive_reviews ?? 0} / −{analytics?.negative_reviews ?? 0}
          </p>
        </div>
        <div className="glass-card !p-3">
          <p className="text-[11px] uppercase text-slate-400 font-semibold mb-2">Distribution</p>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-[10px] mb-0.5">
              <span className="w-3">{star}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${((dist[star] || 0) / maxDist) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right text-slate-500">{dist[star] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {(analytics?.topic_insights || []).length > 0 && (
        <div className="glass-card !p-4">
          <p className="font-semibold text-sm mb-2">AI topic insights</p>
          <div className="flex flex-wrap gap-2">
            {analytics.topic_insights.map((t) => (
              <span key={t.topic} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                {String(t.topic).replace(/_/g, ' ')} · {t.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Auto request settings */}
      <div className="glass-card !p-4 space-y-3">
        <p className="font-semibold text-sm">Automatic review requests</p>
        <p className="text-xs text-slate-500">
          After an appointment is marked Completed, schedule a WhatsApp / SMS / Email review ask via the Communication Engine.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!settings.auto_request_enabled}
            onChange={(e) => setSettings((s) => ({ ...s, auto_request_enabled: e.target.checked }))}
          />
          Enable automatic review requests
        </label>
        <label className="text-xs block max-w-xs">
          Delay (hours after completion)
          <input
            type="number"
            min={0}
            max={168}
            className="input-field mt-1"
            value={settings.delay_hours}
            onChange={(e) => setSettings((s) => ({ ...s, delay_hours: Number(e.target.value) }))}
          />
        </label>
        <div className="flex flex-wrap gap-2 text-xs">
          {['whatsapp', 'sms', 'email', 'in_app'].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => channelToggle(ch)}
              className={`px-2.5 py-1 rounded-lg border capitalize ${
                (settings.channels || []).includes(ch)
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {ch.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary text-xs" disabled={saving} onClick={saveSettings}>
          Save request settings
        </button>
        <p className="text-[11px] text-slate-400">
          Template key <code className="bg-slate-100 px-1 rounded">review_request</code> — edit copy in Communication → Templates.
        </p>
      </div>

      {/* Inbox */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="input-field flex-1 min-w-[140px] text-sm"
              placeholder="Search reviews…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
            <select
              className="input-field text-xs w-auto"
              value={filters.rating}
              onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
            >
              <option value="">All stars</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}★
                </option>
              ))}
            </select>
            <select
              className="input-field text-xs w-auto"
              value={filters.sentiment}
              onChange={(e) => setFilters((f) => ({ ...f, sentiment: e.target.value }))}
            >
              <option value="">All sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            <label className="inline-flex items-center gap-1 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!filters.unreplied}
                onChange={(e) => setFilters((f) => ({ ...f, unreplied: e.target.checked }))}
              />
              Unreplied
            </label>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {loading && !reviews.length ? (
              <p className="text-sm text-slate-500 py-6 text-center">Loading inbox…</p>
            ) : (
              reviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openReview(r)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    selected?.id === r.id ? 'border-teal-400 bg-teal-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900">
                      {r.patient_first_name || 'Patient'}
                      {r.verified ? (
                        <span className="ml-1 text-[10px] text-teal-700 font-bold uppercase">Verified</span>
                      ) : null}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${sentimentClass(r.sentiment)}`}>
                      {r.sentiment || '—'}
                    </span>
                  </div>
                  <ReviewStars rating={r.rating} count={0} size="sm" showValue={false} className="mt-1" />
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.comment || 'No written comment'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {r.clinic_reply ? 'Replied' : 'Needs reply'} · {String(r.created_at || '').slice(0, 10)}
                  </p>
                </button>
              ))
            )}
            {!loading && !reviews.length && (
              <p className="text-sm text-slate-500 text-center py-8">No reviews match these filters.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 glass-card !p-4 min-h-[320px]">
          {!selected ? (
            <p className="text-sm text-slate-500 text-center py-16">Select a review to reply with AI suggestions.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {selected.patient_first_name || 'Patient'}{' '}
                    {selected.verified && <span className="text-xs text-teal-700">· Verified patient</span>}
                  </p>
                  <ReviewStars rating={selected.rating} count={0} size="sm" showValue={false} className="mt-1" />
                </div>
                <label className="text-xs inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Number(selected.is_public) !== 0}
                    onChange={(e) => {
                      togglePublic(selected, e.target.checked);
                      setSelected((s) => ({ ...s, is_public: e.target.checked ? 1 : 0 }));
                    }}
                  />
                  Show on public profile
                </label>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-3">
                {selected.comment || '—'}
              </p>
              {(selected.topics || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.topics.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 capitalize">
                      {String(t).replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">AI reply assistant</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.tone}
                      type="button"
                      className="btn-outline !py-1 !px-2 text-[11px]"
                      onClick={() => applySuggestion(s.text)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="input-field text-sm"
                  rows={5}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write or edit your clinic reply…"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" className="btn-primary text-xs" disabled={saving} onClick={saveReply}>
                    {saving ? 'Saving…' : 'Publish reply'}
                  </button>
                  {selected.clinic_reply && (
                    <button type="button" className="btn-outline text-xs text-rose-600" disabled={saving} onClick={deleteReply}>
                      Delete reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
