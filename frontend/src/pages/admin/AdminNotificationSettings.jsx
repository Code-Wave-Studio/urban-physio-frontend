import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { notificationSettings } from '../../services/api';
import toast from 'react-hot-toast';

const CHANNELS = [
  { key: 'in_app', label: 'In-App', icon: 'fa-bell' },
  { key: 'email', label: 'Email', icon: 'fa-envelope' },
  { key: 'sms', label: 'SMS', icon: 'fa-comment-sms' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  { key: 'push', label: 'Push', icon: 'fa-mobile-screen' },
];

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  skipped: 'bg-slate-100 text-slate-500 border-slate-200',
};

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date((d || '').replace(' ', 'T')).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminNotificationSettings() {
  const [events, setEvents] = useState([]);
  const [channelStatus, setChannelStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [tab, setTab] = useState('settings');
  const [queue, setQueue] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    notificationSettings
      .get()
      .then((res) => {
        setEvents(res.data?.events || []);
        setChannelStatus(res.data?.channel_status || {});
        setDirty(false);
      })
      .catch((e) => toast.error(e.message || 'Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadQueue = useCallback(() => {
    setQueueLoading(true);
    notificationSettings
      .queue({ limit: 100 })
      .then((res) => setQueue(res.data || {}))
      .catch((e) => toast.error(e.message || 'Could not load delivery log'))
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'delivery' && queue == null) loadQueue();
  }, [tab, queue, loadQueue]);

  const toggle = (eventKey, channel) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.key === eventKey
          ? { ...ev, channels: { ...ev.channels, [channel]: !ev.channels[channel] } }
          : ev
      )
    );
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      events.forEach((ev) => { payload[ev.key] = ev.channels; });
      await notificationSettings.update(payload);
      toast.success('Notification settings saved');
      setDirty(false);
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await notificationSettings.run();
      const d = res.data?.dispatch || {};
      toast.success(`Scheduler run complete — ${d.sent || 0} sent, ${d.failed || 0} failed`);
      loadQueue();
    } catch (e) {
      toast.error(e.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const retryFailed = async () => {
    try {
      const res = await notificationSettings.retryFailed();
      toast.success(res.message || 'Failed notifications requeued');
      loadQueue();
    } catch (e) {
      toast.error(e.message || 'Retry failed');
    }
  };

  const groups = events.reduce((acc, ev) => {
    (acc[ev.group] = acc[ev.group] || []).push(ev);
    return acc;
  }, {});

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            <FaIcon icon="fa-bell" className="mr-2 text-primary-600" />
            Notification Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Control which automatic notifications go out on each channel, and monitor delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline text-sm !py-2" onClick={runNow} disabled={running}>
            {running ? <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" /> : <FaIcon icon="fa-play" className="mr-1.5" />}
            Run scheduler now
          </button>
          {tab === 'settings' && (
            <button type="button" className="btn-primary text-sm !py-2" onClick={save} disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        {[
          { key: 'settings', label: 'Event settings', icon: 'fa-toggle-on' },
          { key: 'delivery', label: 'Delivery log', icon: 'fa-list-check' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <FaIcon icon={t.icon} className="mr-1.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        loading ? (
          <div className="glass-card h-64 animate-pulse" />
        ) : (
          <div className="space-y-5">
            {/* channel availability strip */}
            <div className="glass-card !p-4 flex flex-wrap gap-3">
              {CHANNELS.map((c) => {
                const on = !!channelStatus[c.key];
                return (
                  <span
                    key={c.key}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      on ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                    title={on ? 'Channel configured' : 'Provider not configured — deliveries will be skipped'}
                  >
                    <FaIcon icon={c.icon} /> {c.label}: {on ? 'ready' : 'not configured'}
                  </span>
                );
              })}
            </div>

            {Object.entries(groups).map(([group, evs]) => (
              <div key={group} className="glass-card !p-0 overflow-hidden">
                <div className="px-4 md:px-5 py-3 bg-slate-50/70 border-b border-slate-100">
                  <p className="font-semibold text-slate-800 text-sm">{group}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-4 md:px-5 py-2 font-medium">Event</th>
                        {CHANNELS.map((c) => (
                          <th key={c.key} className="px-3 py-2 font-medium text-center whitespace-nowrap">
                            <FaIcon icon={c.icon} className="mr-1" />
                            <span className="hidden md:inline">{c.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evs.map((ev) => (
                        <tr key={ev.key} className="border-t border-slate-100">
                          <td className="px-4 md:px-5 py-2.5 text-slate-700 font-medium">{ev.label}</td>
                          {CHANNELS.map((c) => (
                            <td key={c.key} className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-teal-600 cursor-pointer"
                                checked={!!ev.channels[c.key]}
                                onChange={() => toggle(ev.key, c.key)}
                                aria-label={`${ev.label} via ${c.label}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <p className="text-xs text-slate-400">
              Users can further mute Email / SMS / WhatsApp / Push in their own notification preferences.
              Schedule <code className="bg-slate-100 px-1 rounded">GET /cron/notifications?key=CRON_SECRET</code> every
              10–15 minutes on the server for automatic reminders.
            </p>
          </div>
        )
      )}

      {tab === 'delivery' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {queue?.counts && Object.entries(queue.counts).map(([status, count]) => (
              <span key={status} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${STATUS_BADGE[status] || STATUS_BADGE.skipped}`}>
                {status}: {count}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {(queue?.counts?.failed || 0) > 0 && (
                <button type="button" className="btn-outline text-sm !py-1.5" onClick={retryFailed}>
                  <FaIcon icon="fa-rotate-right" className="mr-1.5" /> Retry failed
                </button>
              )}
              <button type="button" className="btn-outline text-sm !py-1.5" onClick={loadQueue}>
                <FaIcon icon="fa-arrows-rotate" className="mr-1.5" /> Refresh
              </button>
            </div>
          </div>

          {queueLoading ? (
            <div className="glass-card h-64 animate-pulse" />
          ) : !queue?.items?.length ? (
            <div className="glass-card text-center py-12">
              <FaIcon icon="fa-inbox" className="text-4xl text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">No queued notifications yet</p>
              <p className="text-sm text-slate-400 mt-1">Run the scheduler or wait for events to appear here.</p>
            </div>
          ) : (
            <div className="glass-card !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50/70">
                      <th className="px-4 py-2.5 font-medium">User</th>
                      <th className="px-3 py-2.5 font-medium">Event</th>
                      <th className="px-3 py-2.5 font-medium">Channel</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Attempts</th>
                      <th className="px-3 py-2.5 font-medium">Created</th>
                      <th className="px-3 py-2.5 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.items.map((q) => (
                      <tr key={q.id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{q.user_name || `#${q.user_id || '—'}`}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{q.event_key}</td>
                        <td className="px-3 py-2.5 text-slate-600 capitalize whitespace-nowrap">{q.channel.replace('_', '-')}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[q.status] || STATUS_BADGE.skipped}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-center">{q.attempts}</td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{fmtDateTime(q.created_at)}</td>
                        <td className="px-3 py-2.5 text-rose-500 text-xs max-w-[220px] truncate" title={q.last_error || ''}>
                          {q.last_error || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminDashboardLayout>
  );
}
