import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';
import MessagePreview from './MessagePreview';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  { id: 'sms', label: 'SMS', icon: 'fa-message' },
  { id: 'email', label: 'Email', icon: 'fa-envelope' },
  { id: 'in_app', label: 'In-App', icon: 'fa-bell' },
];

export default function BroadcastDrawer({ open, onClose, clinicId, audiences = {} }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience_key: 'appointments_today',
    channels: ['whatsapp', 'sms', 'email', 'in_app'],
  });
  const [previewCount, setPreviewCount] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewCh, setPreviewCh] = useState('whatsapp');
  const [audienceOptions, setAudienceOptions] = useState(() => (
    Object.keys(audiences).length
      ? audiences
      : {
          appointments_today: 'Appointments Today',
          appointments_tomorrow: 'Appointments Tomorrow',
          pending_payments: 'Pending Payments',
          all: 'All Patients',
        }
  ));

  useEffect(() => {
    if (audiences && Object.keys(audiences).length) {
      setAudienceOptions(audiences);
    }
  }, [audiences]);

  const loadPreview = useCallback(async () => {
    if (!clinicId || !open) return;
    try {
      const res = await clinicPortal.commAudiencePreview(clinicId, { audience: form.audience_key });
      setPreviewCount(res.data?.count ?? 0);
      if (res.data?.presets && typeof res.data.presets === 'object') {
        setAudienceOptions(res.data.presets);
      }
    } catch {
      setPreviewCount(null);
    }
  }, [clinicId, form.audience_key, open]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleChannel = (id) => {
    setForm((f) => {
      const has = f.channels.includes(id);
      const next = has ? f.channels.filter((c) => c !== id) : [...f.channels, id];
      return { ...f, channels: next.length ? next : ['in_app'] };
    });
  };

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await clinicPortal.createCampaign(clinicId, {
        ...form,
        smart_route: false,
        campaign_type: 'broadcast',
        send_now: true,
      });
      toast.success(`Broadcast queued for ${res.data?.sent_count ?? 0} patients`);
      onClose?.();
      setForm({
        title: '',
        message: '',
        audience_key: 'appointments_today',
        channels: ['whatsapp', 'sms', 'email', 'in_app'],
      });
    } catch (e) {
      toast.error(e.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  const audienceEntries = Object.keys(audienceOptions).length
    ? audienceOptions
    : {
        appointments_today: 'Appointments Today',
        appointments_tomorrow: 'Appointments Tomorrow',
        pending_payments: 'Pending Payments',
        all: 'All Patients',
      };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close broadcast" onClick={onClose} />
      <aside className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.25s_ease]">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FaIcon icon="fa-bullhorn" className="text-emerald-600" /> Urgent Broadcast
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Send on every selected channel</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/80" aria-label="Close">
            <FaIcon icon="fa-xmark" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 grid md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase">Audience</span>
              <select
                className="input-field mt-1"
                value={form.audience_key}
                onChange={(e) => setForm((f) => ({ ...f, audience_key: e.target.value }))}
              >
                {Object.entries(audienceEntries).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              {previewCount != null && (
                <p className="text-xs text-emerald-700 mt-1 font-medium">{previewCount} patients matched</p>
              )}
            </label>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Channels</span>
              <p className="text-[11px] text-slate-500 mt-1">All selected by default — tap to unselect.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      form.channels.includes(ch.id)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <FaIcon icon={ch.icon} className="mr-1" />{ch.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase">Title</span>
              <input
                className="input-field mt-1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Clinic closed tomorrow"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase">Message</span>
              <textarea
                className="input-field mt-1 min-h-[140px]"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Dear {{patient_name}}, …"
              />
              <p className="text-[10px] text-slate-400 mt-1">Variables: {'{{patient_name}}'}, {'{{clinic_name}}'}</p>
            </label>
          </div>

          <div>
            <div className="flex gap-1 mb-3">
              {['whatsapp', 'sms', 'email'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setPreviewCh(ch)}
                  className={`text-xs px-2.5 py-1 rounded-lg capitalize ${previewCh === ch ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <MessagePreview channel={previewCh} subject={form.title} body={form.message} />
          </div>
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={sending} onClick={send}>
            <FaIcon icon="fa-paper-plane" className="mr-2" />
            {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </footer>
      </aside>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
