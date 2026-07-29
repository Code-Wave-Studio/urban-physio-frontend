import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { supportTickets } from '../../services/api';

const COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-sky-50 border-sky-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-50 border-amber-200' },
  { id: 'resolved', label: 'Resolved', color: 'bg-emerald-50 border-emerald-200' },
];

export default function ClinicSupportCenterPage() {
  const { clinicId, loading: boot, isAdminMode } = useClinicPortal();
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, an] = await Promise.all([
        supportTickets.list({ type: filterType === 'all' ? undefined : filterType }),
        supportTickets.analytics(),
      ]);
      setTickets(list.data || list || []);
      setAnalytics(an.data || an);
    } catch (e) {
      toast.error(e.message || 'Could not load support center');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (!boot) load();
  }, [boot, load]);

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

  const moveStatus = async (id, status) => {
    try {
      await supportTickets.updateStatus(id, { status });
      toast.success(`Moved to ${status.replace('_', ' ')}`);
      load();
      if (selected === id) openTicket({ id });
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const addNote = async (noteType = 'internal') => {
    if (!note.trim() || !selected) return;
    try {
      await supportTickets.addNote(selected, { body: note, note_type: noteType });
      setNote('');
      toast.success(noteType === 'whatsapp' ? 'WhatsApp reply logged' : 'Note added');
      openTicket({ id: selected });
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const waLink = detail?.requester_phone
    ? `https://wa.me/${String(detail.requester_phone).replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi ${detail.requester_name || ''}, regarding ticket ${detail.ticket_number}: `
      )}`
    : null;

  return (
    <ClinicPortalShell
      title="Support Center"
      subtitle="Feedback & support tickets — kanban, notes, analytics"
      actions={
        <div className="portal-page-actions">
          {['all', 'feedback', 'support'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filterType === t ? 'bg-slate-900 text-white' : 'bg-slate-100'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button type="button" className="btn-outline text-sm" onClick={load}>Refresh</button>
        </div>
      }
    >
      {/* Analytics */}
      {analytics && (
        <div className="portal-kpi-grid mb-4">
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Avg Rating</p>
            <p className="text-xl font-bold text-amber-600">{analytics.avg_rating || '—'} ★</p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Feedback</p>
            <p className="text-xl font-bold">{analytics.feedback_count || 0}</p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Avg Resolution</p>
            <p className="text-xl font-bold text-teal-700">{analytics.avg_resolution_hours || 0}h</p>
          </div>
          <div className="glass-card !p-3">
            <p className="text-xs text-slate-500">Top Category</p>
            <p className="text-sm font-bold truncate mt-1">
              {analytics.categories?.[0]?.category || '—'}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card h-48 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`rounded-2xl border p-3 min-h-[280px] ${col.color}`}>
              <p className="font-bold text-sm mb-3 flex justify-between">
                {col.label}
                <span className="text-xs font-normal text-slate-500">{byStatus[col.id]?.length || 0}</span>
              </p>
              <div className="space-y-2">
                {(byStatus[col.id] || []).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTicket(t)}
                    className={`w-full text-left bg-white rounded-xl border p-3 shadow-sm hover:border-teal-300 ${
                      selected === t.id ? 'ring-2 ring-teal-400' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="text-[10px] font-mono text-slate-400">{t.ticket_number}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{t.type}</span>
                    </div>
                    <p className="text-sm font-semibold mt-1 truncate">{t.category}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                    {t.rating && <p className="text-xs text-amber-500 mt-1">{'★'.repeat(t.rating)}</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {col.id !== 'in_progress' && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                          onClick={(e) => { e.stopPropagation(); moveStatus(t.id, 'in_progress'); }}
                        >
                          Start
                        </span>
                      )}
                      {col.id !== 'resolved' && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
                          onClick={(e) => { e.stopPropagation(); moveStatus(t.id, 'resolved'); }}
                        >
                          Resolve
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => { setDetail(null); setSelected(null); }}>
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono text-slate-400">{detail.ticket_number}</p>
                <h3 className="font-bold text-lg">{detail.category}</h3>
                <p className="text-xs text-slate-500 capitalize">{detail.status?.replace('_', ' ')} · {detail.type}</p>
              </div>
              <button type="button" onClick={() => { setDetail(null); setSelected(null); }}>
                <FaIcon icon="fa-xmark" />
              </button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
            <div className="text-xs text-slate-500 space-y-1 rounded-xl bg-slate-50 p-3">
              <p>{detail.requester_name} · {detail.requester_email} · {detail.requester_phone}</p>
              <p>{detail.browser} · {detail.device} · {detail.screen_res}</p>
              <p className="truncate">{detail.page_url}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline text-xs" onClick={() => moveStatus(detail.id, 'in_progress')}>In Progress</button>
              <button type="button" className="btn-outline text-xs" onClick={() => moveStatus(detail.id, 'resolved')}>Resolve</button>
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary text-xs inline-flex items-center gap-1">
                  <FaIcon icon="fa-whatsapp" brand /> WhatsApp Reply
                </a>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Ticket History</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(detail.history || []).map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-teal-300 pl-3 py-1">
                    <p className="text-slate-400 uppercase text-[10px]">{h.note_type} · {String(h.created_at || '').slice(0, 16)}</p>
                    <p className="text-slate-700">{h.body}</p>
                  </div>
                ))}
                {!detail.history?.length && <p className="text-xs text-slate-400">No history yet</p>}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                className="input-field text-sm"
                rows={3}
                placeholder="Internal note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" className="btn-outline text-xs" onClick={() => addNote('internal')}>Add Internal Note</button>
                <button type="button" className="btn-outline text-xs" onClick={() => addNote('whatsapp')}>Log WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
