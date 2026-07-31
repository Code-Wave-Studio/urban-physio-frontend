import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { consultation } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const POLL_MS = 2500;
const ACCEPTED =
  'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.mp4,.mov,application/pdf';

function fmtTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function fmtDay(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function StatusTicks({ status }) {
  if (status === 'read') {
    return <FaIcon icon="fa-check-double" className="text-[10px] text-sky-300" title="Read" />;
  }
  if (status === 'delivered') {
    return <FaIcon icon="fa-check-double" className="text-[10px] text-white/70" title="Delivered" />;
  }
  return <FaIcon icon="fa-check" className="text-[10px] text-white/60" title="Sent" />;
}

/**
 * Appointment-linked consultation chat (doctor ↔ patient).
 * @param {{ room: object, active?: boolean }} props
 */
export default function ConsultationChatPanel({ room, active = true }) {
  const { user } = useAuth();
  const appointmentId = room?.appointment?.id;
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState({ online: false, typing: false });
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const lastIdRef = useRef(0);
  const stickBottomRef = useRef(true);
  const typingTimer = useRef(null);
  const typingSent = useRef(false);

  const peerLabel = useMemo(() => {
    if (room?.viewer === 'doctor') {
      return `${room.patient?.first_name || ''} ${room.patient?.last_name || ''}`.trim() || 'Patient';
    }
    return `Dr. ${room?.doctor?.first_name || ''} ${room?.doctor?.last_name || ''}`.trim() || 'Doctor';
  }, [room]);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    });
  }, []);

  const mergeMessages = useCallback((incoming, replace = false) => {
    setMessages((prev) => {
      const map = new Map();
      const base = replace ? [] : prev;
      base.forEach((m) => map.set(m.id, m));
      incoming.forEach((m) => map.set(m.id, m));
      const next = Array.from(map.values()).sort((a, b) => a.id - b.id);
      if (next.length) lastIdRef.current = next[next.length - 1].id;
      return next;
    });
  }, []);

  const poll = useCallback(
    async (opts = {}) => {
      if (!appointmentId) return;
      try {
        const after = opts.full ? 0 : lastIdRef.current;
        const res = await consultation.chatPoll(appointmentId, {
          after_id: after || undefined,
          limit: opts.full ? 100 : 50,
        });
        const data = res.data || res || {};
        const list = data.messages || [];
        if (opts.full || after <= 0) {
          mergeMessages(list, true);
        } else if (list.length) {
          mergeMessages(list, false);
          if (stickBottomRef.current) scrollToBottom(true);
        } else if (data.peer?.last_read_message_id) {
          // refresh read receipts on existing bubbles
          setMessages((prev) =>
            prev.map((m) => {
              if (!m.mine || m.deleted) return m;
              const status = m.id <= data.peer.last_read_message_id ? 'read' : 'delivered';
              return status === m.status ? m : { ...m, status };
            })
          );
        }
        setPeer(data.peer || { online: false, typing: false });
        if (opts.markRead !== false && list.length) {
          const last = list[list.length - 1] || (lastIdRef.current ? { id: lastIdRef.current } : null);
          if (last?.id) {
            consultation.chatRead(appointmentId, last.id).catch(() => {});
          }
        }
      } catch (e) {
        if (opts.full) toast.error(e.message || 'Could not load chat');
      } finally {
        if (opts.full) setLoading(false);
      }
    },
    [appointmentId, mergeMessages, scrollToBottom]
  );

  useEffect(() => {
    if (!appointmentId) return undefined;
    setLoading(true);
    lastIdRef.current = 0;
    setMessages([]);
    poll({ full: true }).then(() => scrollToBottom(false));
  }, [appointmentId, poll, scrollToBottom]);

  useEffect(() => {
    if (!appointmentId || !active) return undefined;
    const t = setInterval(() => poll({ full: false }), POLL_MS);
    return () => clearInterval(t);
  }, [appointmentId, active, poll]);

  useEffect(() => {
    if (!loading && stickBottomRef.current) scrollToBottom(false);
  }, [loading, messages.length, scrollToBottom]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickBottomRef.current = nearBottom;
  };

  const notifyTyping = (on) => {
    if (!appointmentId) return;
    if (on && typingSent.current) return;
    if (!on && !typingSent.current) return;
    typingSent.current = on;
    consultation.chatTyping(appointmentId, on).catch(() => {});
  };

  const onDraftChange = (value) => {
    setDraft(value);
    notifyTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => notifyTyping(false), 1800);
  };

  const sendText = async () => {
    const text = draft.trim();
    if (!text || !appointmentId || sending) return;
    setSending(true);
    notifyTyping(false);
    try {
      const res = await consultation.chatSend(appointmentId, {
        body: text,
        reply_to_id: replyTo?.id || undefined,
      });
      const msg = res.data || res;
      if (msg?.id) mergeMessages([msg]);
      setDraft('');
      setReplyTo(null);
      setEmojiOpen(false);
      stickBottomRef.current = true;
      scrollToBottom(true);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      toast.error(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file) => {
    if (!file || !appointmentId || sending) return;
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File must be under 12 MB');
      return;
    }
    setSending(true);
    notifyTyping(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (draft.trim()) fd.append('body', draft.trim());
      if (replyTo?.id) fd.append('reply_to_id', String(replyTo.id));
      const res = await consultation.chatSendFile(appointmentId, fd);
      const msg = res.data || res;
      if (msg?.id) mergeMessages([msg]);
      setDraft('');
      setReplyTo(null);
      stickBottomRef.current = true;
      scrollToBottom(true);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteMsg = async (msg) => {
    if (!msg?.mine && user?.role_slug !== 'admin' && user?.role_slug !== 'super_admin') return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await consultation.chatDelete(appointmentId, msg.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, deleted: true, body: null, attachment_url: null, message_type: 'system' }
            : m
        )
      );
    } catch (e) {
      toast.error(e.message || 'Could not delete');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) sendFile(file);
  };

  const EMOJIS = ['🙂', '😊', '👍', '🙏', '💪', '✅', '❤️', '😢', '😮', '🔥'];

  const dayGroups = useMemo(() => {
    const groups = [];
    let lastDay = '';
    messages.forEach((m) => {
      const day = fmtDay(m.created_at);
      if (day !== lastDay) {
        groups.push({ type: 'day', day, key: `d-${day}-${m.id}` });
        lastDay = day;
      }
      groups.push({ type: 'msg', msg: m, key: `m-${m.id}` });
    });
    return groups;
  }, [messages]);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border overflow-hidden bg-gradient-to-b from-slate-50 to-teal-50/40 ${
        dragOver ? 'border-teal-400 ring-2 ring-teal-200' : 'border-slate-200'
      }`}
      style={{ minHeight: 'min(68vh, 620px)', height: 'min(68vh, 620px)' }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
            {(peerLabel[0] || 'U').toUpperCase()}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              peer.online ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title={peer.online ? 'Online' : 'Offline'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{peerLabel}</p>
          <p className="text-[11px] text-slate-500">
            {peer.typing ? (
              <span className="text-teal-600 font-medium">typing…</span>
            ) : peer.online ? (
              'Online'
            ) : (
              'Offline · chat stays available after the call'
            )}
          </p>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-teal-700 text-sm p-2"
          title="Refresh"
          onClick={() => poll({ full: true })}
        >
          <FaIcon icon="fa-rotate" />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin" /> Loading chat…
          </div>
        ) : !messages.length ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <FaIcon icon="fa-comments" className="text-teal-600 text-xl" />
            </div>
            <p className="font-semibold text-slate-700">Start the conversation</p>
            <p className="text-xs mt-1 max-w-xs">
              Message before, during, or after the video consult. Files and images are welcome.
            </p>
          </div>
        ) : (
          dayGroups.map((item) => {
            if (item.type === 'day') {
              return (
                <div key={item.key} className="flex justify-center my-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/80 text-slate-500 border border-slate-200">
                    {item.day}
                  </span>
                </div>
              );
            }
            const m = item.msg;
            if (m.deleted) {
              return (
                <div key={item.key} className="flex justify-center my-1">
                  <span className="text-[11px] italic text-slate-400">Message deleted</span>
                </div>
              );
            }
            const mine = m.mine;
            return (
              <div key={item.key} className={`flex ${mine ? 'justify-end' : 'justify-start'} group py-0.5`}>
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                    mine
                      ? 'bg-teal-700 text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                  }`}
                >
                  {m.reply_to && (
                    <div
                      className={`mb-1.5 pl-2 border-l-2 text-[11px] rounded ${
                        mine ? 'border-teal-300/80 bg-black/10' : 'border-teal-500 bg-slate-50'
                      } px-2 py-1`}
                    >
                      <p className={`font-semibold ${mine ? 'text-teal-100' : 'text-teal-700'}`}>
                        {m.reply_to.sender_name || 'Reply'}
                      </p>
                      <p className={`truncate ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                        {m.reply_to.deleted
                          ? 'Original message deleted'
                          : m.reply_to.body || m.reply_to.attachment_name || 'Attachment'}
                      </p>
                    </div>
                  )}

                  {m.message_type === 'image' && m.attachment_url && (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                      <img
                        src={m.attachment_url}
                        alt={m.attachment_name || 'Image'}
                        className="rounded-lg max-h-52 object-cover"
                      />
                    </a>
                  )}
                  {m.message_type === 'file' && m.attachment_url && (
                    <a
                      href={m.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm mb-1 underline-offset-2 hover:underline ${
                        mine ? 'text-teal-50' : 'text-teal-700'
                      }`}
                    >
                      <FaIcon icon="fa-paperclip" />
                      <span className="truncate max-w-[200px]">{m.attachment_name || 'Document'}</span>
                    </a>
                  )}
                  {m.body && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}

                  <div className={`flex items-center justify-end gap-1.5 mt-1 ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                    <span className="text-[10px]">{fmtTime(m.created_at)}</span>
                    {mine && <StatusTicks status={m.status} />}
                  </div>

                  <div
                    className={`absolute -top-2 ${mine ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition flex gap-1`}
                  >
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow text-slate-600 text-[10px] flex items-center justify-center"
                      title="Reply"
                      onClick={() => setReplyTo(m)}
                    >
                      <FaIcon icon="fa-reply" />
                    </button>
                    {(mine || user?.role_slug === 'admin' || user?.role_slug === 'super_admin') && (
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow text-rose-600 text-[10px] flex items-center justify-center"
                        title="Delete"
                        onClick={() => deleteMsg(m)}
                      >
                        <FaIcon icon="fa-trash" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {peer.typing && (
          <div className="flex justify-start pl-1 pt-1">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '240ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-2.5 space-y-2">
        {replyTo && (
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
            <div className="min-w-0 flex-1 border-l-2 border-teal-500 pl-2">
              <p className="font-semibold text-teal-700">Replying to {replyTo.sender_name}</p>
              <p className="text-slate-500 truncate">{replyTo.body || replyTo.attachment_name || 'Attachment'}</p>
            </div>
            <button type="button" className="text-slate-400 hover:text-slate-700" onClick={() => setReplyTo(null)}>
              <FaIcon icon="fa-xmark" />
            </button>
          </div>
        )}
        {emojiOpen && (
          <div className="flex flex-wrap gap-1 px-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="text-lg hover:scale-110 transition p-1"
                onClick={() => onDraftChange(draft + e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="btn-outline !p-2.5 text-slate-600"
            title="Emoji"
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <FaIcon icon="fa-face-smile" />
          </button>
          <button
            type="button"
            className="btn-outline !p-2.5 text-slate-600"
            title="Attach file"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
          >
            <FaIcon icon="fa-paperclip" />
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={ACCEPTED}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) sendFile(f);
            }}
          />
          <textarea
            className="input-field !py-2.5 min-h-[44px] max-h-28 resize-none flex-1 text-sm"
            rows={1}
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            disabled={sending}
          />
          <button
            type="button"
            className="btn-primary !px-3.5 !py-2.5 shrink-0"
            onClick={sendText}
            disabled={sending || !draft.trim()}
            title="Send"
          >
            {sending ? <FaIcon icon="fa-spinner" className="fa-spin" /> : <FaIcon icon="fa-paper-plane" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 px-1">
          Drag & drop files here · Enter to send · Shift+Enter for new line
        </p>
      </div>

      {dragOver && (
        <div className="absolute inset-0 bg-teal-600/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
          <div className="rounded-2xl bg-white border-2 border-dashed border-teal-500 px-6 py-4 text-teal-800 font-semibold shadow-lg">
            Drop file to send
          </div>
        </div>
      )}
    </div>
  );
}
