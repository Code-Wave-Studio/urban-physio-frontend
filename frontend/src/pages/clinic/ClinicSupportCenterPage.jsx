import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { supportTickets } from '../../services/api';

const COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-sky-50 border-sky-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-50 border-amber-200' },
  { id: 'resolved', label: 'Resolved', color: 'bg-emerald-50 border-emerald-200' },
];

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(String(iso).includes('T') ? iso : String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 16);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function ClinicSupportCenterPage() {
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, an] = await Promise.all([
        supportTickets.list({ type: filterType === 'all' ? undefined : filterType }),
        supportTickets.analytics(),
      ]);
      setTickets(Array.isArray(list.data) ? list.data : Array.isArray(list) ? list : list.data?.items || []);
      setAnalytics(an.data || an);
    } catch (e) {
      toast.error(e.message || 'Could not load support centre');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const byStatus = useMemo(() => {
    const map = { new: [], in_progress: [], resolved: [] };
    tickets.forEach((t) => {
      const st = t.status === 'closed' ? 'resolved' : t.status;
      if (map[st]) map[st].push(t);
      else map.new.push(t);
    });
    return map;
  }, [tickets]);

  const openTicket = async (t) => {
    setSelected(t.id);
    try {
      const res = await supportTickets.get(t.id);
      setDetail(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Could not load ticket');
    }
  };

  return (
    <ClinicPortalShell
      title="Support Center"
      subtitle="Feedback & support tickets — kanban, notes, analytics"
      actions={
        <div className="portal-page-actions flex flex-wrap gap-2">
          {['all', 'feedback', 'support'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filterType === t ? 'bg-slate-900 text-white' : 'btn-outline !py-1.5'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button type="button" className="btn-outline text-sm" onClick={load}>
            Refresh
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-500 mb-4">
        Use the floating + button for quick add, or Help & Feedback from its menu. Platform admins manage resolution.
      </p>

      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Avg Rating</p>
            <p className="text-xl font-bold text-amber-600">{analytics.avg_rating || '—'} ★</p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Feedback</p>
            <p className="text-xl font-bold">{analytics.feedback_count ?? 0}</p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Open</p>
            <p className="text-xl font-bold text-sky-600">
              {(byStatus.new?.length || 0) + (byStatus.in_progress?.length || 0)}
            </p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Avg resolve (hrs)</p>
            <p className="text-xl font-bold">{analytics.avg_resolution_hours ?? '—'}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`rounded-2xl border p-3 min-h-[220px] ${col.color}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-slate-800">{col.label}</h2>
                <span className="text-xs font-semibold text-slate-500">{byStatus[col.id]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(byStatus[col.id] || []).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTicket(t)}
                    className={`w-full text-left rounded-xl bg-white border p-3 shadow-sm hover:border-teal-300 transition-colors ${
                      selected === t.id ? 'border-teal-400 ring-1 ring-teal-200' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-mono text-slate-400">{t.ticket_number}</p>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">{t.type}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2">
                      {t.subject || t.category}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{fmtDateTime(t.created_at)}</p>
                  </button>
                ))}
                {!(byStatus[col.id] || []).length && (
                  <p className="text-xs text-slate-400 text-center py-6">0</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => { setDetail(null); setSelected(null); }}>
          <aside
            className="w-full max-w-md h-full bg-white shadow-xl p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-xs font-mono text-slate-400">{detail.ticket_number}</p>
                <h3 className="font-bold text-lg text-slate-900">{detail.subject || detail.category}</h3>
              </div>
              <button type="button" className="p-2 rounded-lg hover:bg-slate-100" onClick={() => { setDetail(null); setSelected(null); }}>
                <FaIcon icon="fa-xmark" />
              </button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-slate-400">Status:</span> <strong>{detail.status}</strong></p>
              <p><span className="text-slate-400">Type:</span> {detail.type} · {detail.category}</p>
              <p><span className="text-slate-400">Submitted:</span> {fmtDateTime(detail.created_at)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap mb-4">
              {detail.description}
            </div>
            <h4 className="font-semibold text-sm mb-2">Updates</h4>
            <div className="space-y-2">
              {(detail.history || []).length === 0 && (
                <p className="text-xs text-slate-400">No public updates yet.</p>
              )}
              {(detail.history || []).map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-100 p-2 text-xs">
                  <p className="text-slate-400 mb-1">{n.note_type} · {fmtDateTime(n.created_at)}</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </ClinicPortalShell>
  );
}
