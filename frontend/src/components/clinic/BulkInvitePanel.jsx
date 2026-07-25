import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';

/**
 * Parse paste lines into contacts.
 * Accepted formats (one per line):
 *   email
 *   email, phone
 *   email, phone, first name
 *   email, phone, first name, last name
 *   email | phone | first | last
 * Also accepts tab-separated.
 */
export function parseBulkContacts(raw) {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const contacts = [];
  const seen = new Set();

  for (const line of lines) {
    const parts = line.split(/[,|\t]+/).map((p) => p.trim()).filter(Boolean);
    const email = (parts[0] || '').toLowerCase();
    if (!email || !email.includes('@')) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    const phone = parts[1] || '';
    const first_name = parts[2] || '';
    const last_name = parts[3] || '';
    contacts.push({
      email,
      phone: phone || undefined,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
    });
  }

  return contacts.slice(0, 50);
}

/**
 * Shared bulk invite UI for Clinic Portal patients / doctors.
 * @param {{
 *   title: string,
 *   description: string,
 *   roleLabel: string,
 *   disabled?: boolean,
 *   onSubmit: (contacts: object[]) => Promise<{ results?: object[], summary?: object } | object>,
 * }} props
 */
export default function BulkInvitePanel({ title, description, roleLabel, disabled, onSubmit }) {
  const [raw, setRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const preview = parseBulkContacts(raw);

  const submit = async (e) => {
    e.preventDefault();
    const contacts = parseBulkContacts(raw);
    if (!contacts.length) {
      toast.error('Paste at least one valid email (one per line)');
      return;
    }
    setSending(true);
    setResults(null);
    try {
      const res = await onSubmit(contacts);
      const data = res?.data ?? res ?? {};
      const list = data.results || [];
      setResults(list);
      const ok = list.filter((r) => r.ok).length;
      const fail = list.length - ok;
      if (fail && ok) {
        toast.success(`Invited ${ok}; ${fail} failed`);
      } else if (fail && !ok) {
        toast.error(`All ${fail} invites failed`);
      } else {
        toast.success(`Sent ${ok || contacts.length} invite(s) via email/SMS`);
      }
      if (ok) setRaw('');
    } catch (err) {
      toast.error(err.message || 'Bulk invite failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-card !p-5 space-y-3">
      <div>
        <h2 className="font-bold flex items-center gap-2">
          <FaIcon icon="fa-user-plus" className="text-teal-600" />
          {title}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <textarea
        className="input-field font-mono text-xs min-h-[120px]"
        placeholder={`One ${roleLabel} per line:\nemail@example.com, 9876543210, First, Last\nemail2@example.com`}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        disabled={disabled || sending}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {preview.length} valid contact{preview.length === 1 ? '' : 's'} ready
          {preview.length >= 50 ? ' (max 50)' : ''} · email required · phone enables SMS
        </p>
        <button type="submit" className="btn-primary text-sm" disabled={disabled || sending || !preview.length}>
          {sending ? 'Sending…' : `Invite ${preview.length || ''} ${roleLabel}${preview.length === 1 ? '' : 's'}`.trim()}
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Results
          </div>
          <ul className="max-h-48 overflow-y-auto text-sm divide-y divide-slate-100">
            {results.map((r, i) => (
              <li key={`${r.email}-${i}`} className="px-3 py-2 flex flex-wrap gap-x-3 gap-y-1 justify-between">
                <span className="font-medium text-slate-800 truncate">{r.email || '—'}</span>
                <span className="text-xs text-slate-500">
                  {r.ok ? (
                    <>
                      {r.created ? 'Account created' : r.existing ? 'Existing user notified' : 'OK'}
                      {r.email_sent ? ' · email' : ' · no email'}
                      {r.sms_sent ? ' · SMS' : ''}
                    </>
                  ) : (
                    <span className="text-rose-600">{r.error || 'Failed'}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
