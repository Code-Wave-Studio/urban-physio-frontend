import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';

function fmtWhen(date, time) {
  if (!date) return '—';
  const t = time ? String(time).slice(0, 5) : '';
  return `${date}${t ? ` · ${t}` : ''}`;
}

export default function AdminZoomMeetings() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('meetings');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meetingsRes, logsRes, statusRes] = await Promise.all([
        admin.zoomMeetings({ q: q.trim() || undefined }),
        admin.zoomLogs(),
        admin.zoomStatus(),
      ]);
      const m = meetingsRes.data || meetingsRes;
      setItems(m.items || []);
      setConfigured(Boolean(m.configured ?? statusRes.data?.configured));
      setLogs(logsRes.data || logsRes || []);
    } catch (e) {
      toast.error(e.message || 'Could not load Zoom data');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const regenerate = async (id) => {
    if (!window.confirm('Regenerate Zoom meeting for this appointment?')) return;
    setBusyId(id);
    try {
      await admin.zoomRegenerate(id);
      toast.success('Meeting regenerated');
      load();
    } catch (e) {
      toast.error(e.message || 'Meeting creation failed');
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this Zoom meeting?')) return;
    setBusyId(id);
    try {
      await admin.zoomCancel(id);
      toast.success('Meeting cancelled');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not cancel meeting');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Zoom Meetings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Server-to-Server OAuth meetings, regenerate / cancel, and API logs.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            configured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {configured ? 'Zoom configured' : 'Zoom credentials missing'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'meetings', label: 'Meetings' },
          { id: 'logs', label: 'API logs' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
              tab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button type="button" className="btn-outline text-sm !py-1.5 ml-auto" onClick={load}>
          <FaIcon icon="fa-rotate" className="mr-1.5" /> Refresh
        </button>
      </div>

      {tab === 'meetings' && (
        <>
          <div className="mb-3">
            <input
              className="input-field max-w-md"
              placeholder="Search patient, booking id, meeting id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="glass-card !p-0 overflow-hidden">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No Zoom meetings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase text-slate-400 border-b bg-slate-50/70">
                      <th className="px-4 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">When</th>
                      <th className="px-3 py-2.5">Meeting</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{row.patient_full_name || 'Patient'}</p>
                          <p className="text-xs text-slate-400">{row.booking_id} · Dr. {row.doctor_name || '—'}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{fmtWhen(row.appointment_date, row.start_time)}</td>
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs">{row.zoom_meeting_id || row.google_meet_id || '—'}</p>
                          {row.zoom_join_url || row.google_meet_link ? (
                            <a
                              href={row.zoom_join_url || row.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-700 hover:underline"
                            >
                              Open join URL
                            </a>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 capitalize text-xs">
                          {row.zoom_status || '—'}
                          <span className="block text-slate-400 mt-0.5">{row.appointment_status}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busyId === row.id}
                              className="text-xs font-semibold text-primary-700"
                              onClick={() => regenerate(row.id)}
                            >
                              Regenerate
                            </button>
                            <button
                              type="button"
                              disabled={busyId === row.id}
                              className="text-xs font-semibold text-rose-700"
                              onClick={() => cancel(row.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'logs' && (
        <div className="glass-card !p-0 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="p-8 text-center text-slate-400">No Zoom API logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-400 border-b bg-slate-50/70">
                    <th className="px-4 py-2.5">When</th>
                    <th className="px-3 py-2.5">Action</th>
                    <th className="px-3 py-2.5">HTTP</th>
                    <th className="px-3 py-2.5">Appt</th>
                    <th className="px-3 py-2.5">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{log.created_at}</td>
                      <td className="px-3 py-3 font-medium">{log.action}</td>
                      <td className="px-3 py-3">{log.http_code}</td>
                      <td className="px-3 py-3">{log.appointment_id || '—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-500 max-w-md break-all">
                        {String(log.response_json || '').slice(0, 180)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminDashboardLayout>
  );
}
