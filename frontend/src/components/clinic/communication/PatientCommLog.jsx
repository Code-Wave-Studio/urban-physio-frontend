import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

const STATUS_TONE = {
  sent: 'bg-emerald-50 text-emerald-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  read: 'bg-sky-50 text-sky-700',
  unread: 'bg-amber-50 text-amber-800',
  failed: 'bg-rose-50 text-rose-700',
  pending: 'bg-amber-50 text-amber-700',
};

export default function PatientCommLog({ clinicId, patientKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!clinicId || !patientKey) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patientCommunicationLog(clinicId, patientKey, {
        channel: channel || undefined,
        status: status || undefined,
        q: q.trim() || undefined,
      });
      setData(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Failed to load communication log');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clinicId, patientKey, channel, status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const timeline = useMemo(() => data?.timeline || [], [data]);

  const markRead = async () => {
    try {
      await clinicPortal.markPatientCommRead(clinicId, patientKey);
      toast.success('Replies marked as read');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not mark as read');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Communication Log</h3>
          <p className="text-xs text-slate-500">WhatsApp-style timeline of all outbound & inbound messages</p>
        </div>
        {(data?.unread_count || 0) > 0 && (
          <button type="button" onClick={markRead} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">{data.unread_count}</span>
            Unread replies · Mark read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="input-field flex-1 min-w-[140px]"
          placeholder="Search messages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input-field w-auto" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">All channels</option>
          {['whatsapp', 'sms', 'email', 'in_app'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'sent', 'failed', 'unread', 'read'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <div className="py-10 text-center text-sm text-slate-500">Loading timeline…</div>}

      {!loading && (
        <div className="rounded-2xl border border-slate-200 bg-[#0b141a]/10 overflow-hidden">
          <div className="bg-emerald-800 text-white px-4 py-3 flex items-center gap-2">
            <FaIcon icon="fa-comments" />
            <span className="font-semibold text-sm">Patient chat timeline</span>
          </div>
          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_40%),linear-gradient(#f8fafc,#ecfdf5)]">
            {timeline.map((item) => {
              const outbound = item.direction === 'outbound';
              return (
                <div key={item.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                      outbound
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${outbound ? 'bg-white/20' : STATUS_TONE[item.status] || 'bg-slate-100'}`}>
                        {item.channel}
                      </span>
                      <span className={`text-[9px] font-bold uppercase ${outbound ? 'text-white/70' : 'text-slate-400'}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.title && item.title !== item.body && (
                      <p className={`text-xs font-semibold mb-0.5 ${outbound ? 'text-emerald-50' : 'text-slate-500'}`}>{item.title}</p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{item.body}</p>
                    <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] ${outbound ? 'text-white/60' : 'text-slate-400'}`}>
                      <span>{String(item.sent_at || item.created_at || '').slice(0, 16)}</span>
                      {item.delivered_at && <span>Delivered {String(item.delivered_at).slice(0, 16)}</span>}
                      {item.read_at && <span>Read {String(item.read_at).slice(0, 16)}</span>}
                      {item.retry_count > 0 && <span>Retries {item.retry_count}</span>}
                      {item.trigger_source && <span className="capitalize">{item.trigger_source}</span>}
                    </div>
                    {item.failed_reason && (
                      <p className={`text-[10px] mt-1 ${outbound ? 'text-rose-100' : 'text-rose-600'}`}>{item.failed_reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {!timeline.length && (
              <div className="py-12 text-center text-sm text-slate-500">No messages for this patient yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
