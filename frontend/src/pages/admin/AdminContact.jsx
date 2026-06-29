import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import { displayContactText, unwrapApiData } from '../../utils/contactText';
import toast from 'react-hot-toast';

const emptySettings = () => ({
  email: '',
  phone: '',
  whatsapp: '',
  hours: '',
  address: '',
  footer_tagline: '',
  notify_email: '',
  form_subjects: [],
});

function formatDt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminContact() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'settings');
  const [form, setForm] = useState(emptySettings);
  const [subjectsText, setSubjectsText] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadSettings = useCallback(() => {
    setLoadingSettings(true);
    admin
      .contactSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        const subjects = Array.isArray(d.form_subjects) ? d.form_subjects : [];
        setForm({
          email: displayContactText(d.email),
          phone: displayContactText(d.phone),
          whatsapp: displayContactText(d.whatsapp),
          hours: displayContactText(d.hours),
          address: displayContactText(d.address),
          footer_tagline: displayContactText(d.footer_tagline),
          notify_email: displayContactText(d.notify_email),
        });
        setSubjectsText(subjects.map((s) => displayContactText(s)).join('\n'));
      })
      .catch((e) => toast.error(e.message || 'Could not load settings'))
      .finally(() => setLoadingSettings(false));
  }, []);

  const loadMessages = useCallback(() => {
    setLoadingMessages(true);
    admin
      .contactMessages({ limit: 100 })
      .then((res) => {
        const d = res.data || res;
        setMessages(d.items || []);
        setUnreadCount(d.unread_count ?? 0);
      })
      .catch((e) => toast.error(e.message || 'Could not load messages'))
      .finally(() => setLoadingMessages(false));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (tab === 'messages') loadMessages();
  }, [tab, loadMessages]);

  useEffect(() => {
    const msgId = searchParams.get('msg');
    if (!msgId || tab !== 'messages' || !messages.length) return;
    const id = Number(msgId);
    if (!messages.some((m) => m.id === id)) return;
    setExpandedId(id);
    requestAnimationFrame(() => {
      document.getElementById(`contact-msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [searchParams, tab, messages]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const saveSettings = async (e) => {
    e.preventDefault();
    const subjects = subjectsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setSaving(true);
    try {
      await admin.updateContactSettings({ ...form, form_subjects: subjects });
      toast.success('Contact & footer details saved');
      loadSettings();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id) => {
    try {
      await admin.markContactMessageRead(id);
      loadMessages();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await admin.deleteContactMessage(id);
      toast.success('Deleted');
      loadMessages();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Contact & footer</h1>
        <p className="text-slate-600 text-sm mb-6">
          Edit &quot;Get in touch&quot; on the Contact page and footer. Form submissions appear under Messages and
          are emailed to the notify address.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'settings' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Contact details
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              tab === 'messages' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Messages
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        </div>

        {tab === 'settings' && (
          <>
            {loadingSettings ? (
              <div className="glass-card h-64 animate-pulse bg-white/40" />
            ) : (
              <form onSubmit={saveSettings} className="glass-card !p-6 md:!p-8 space-y-6">
                {!form.email && !form.phone && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Could not load saved settings. Check you are logged in as admin, then click Refresh below.
                  </p>
                )}
                <section>
                  <h2 className="text-sm font-bold text-slate-800 mb-3">Get in touch & footer bar</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Shown on Contact page and site footer. Type &amp; and - directly (not ?). Spaces are kept as entered.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Public email</label>
                      <input className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp number (optional)</label>
                      <input
                        className="input-field"
                        value={form.whatsapp || ''}
                        onChange={(e) => set('whatsapp', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Country code required. Green chat button shows on public pages only (not doctor/admin dashboard).
                        Leave empty to hide.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business hours</label>
                      <input className="input-field" value={form.hours} onChange={(e) => set('hours', e.target.value)} required />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address / location line</label>
                    <input className="input-field" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Footer tagline (under logo)</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={form.footer_tagline || ''}
                      onChange={(e) => set('footer_tagline', e.target.value)}
                    />
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-bold text-slate-800 mb-3">Contact form</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Send form submissions to (admin email)
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      value={form.notify_email || ''}
                      onChange={(e) => set('notify_email', e.target.value)}
                      placeholder="admin@theurbanphysio.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Form subjects (one per line)
                    </label>
                    <textarea
                      className="input-field font-mono text-sm"
                      rows={6}
                      value={subjectsText}
                      onChange={(e) => setSubjectsText(e.target.value)}
                    />
                  </div>
                </section>

                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save contact settings'}
                  </button>
                  <button type="button" className="btn-outline" onClick={loadSettings} disabled={loadingSettings}>
                    Refresh
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {tab === 'messages' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">{messages.length} message(s)</p>
              <button type="button" className="btn-outline text-sm" onClick={loadMessages}>
                Refresh
              </button>
            </div>
            {loadingMessages ? (
              <div className="glass-card h-40 animate-pulse" />
            ) : messages.length === 0 ? (
              <div className="glass-card text-center py-12 text-slate-600">No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  id={`contact-msg-${m.id}`}
                  className={`glass-card !p-5 ${m.is_read ? '' : 'ring-2 ring-primary-200/70'} ${
                    expandedId === m.id ? 'ring-2 ring-primary-400' : ''
                  }`}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-600">
                        <a href={`mailto:${m.email}`} className="text-primary-700 hover:underline">
                          {m.email}
                        </a>
                        {m.phone ? ` · ${m.phone}` : ''}
                      </p>
                      <p className="text-xs text-primary-700 font-medium mt-1">{m.subject}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">{formatDt(m.created_at)}</div>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-primary-600 font-medium mt-2"
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  >
                    {expandedId === m.id ? 'Hide message' : 'View message'}
                  </button>
                  {expandedId === m.id && (
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100 pt-3">
                      {m.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {!m.is_read && (
                      <button type="button" className="btn-outline text-xs" onClick={() => markRead(m.id)}>
                        Mark read
                      </button>
                    )}
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                      className="btn-outline text-xs inline-flex items-center"
                    >
                      Reply by email
                    </a>
                    <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeMessage(m.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
