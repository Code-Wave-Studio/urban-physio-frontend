import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';

const empty = () => ({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  notes: '',
  send_invite: true,
});

/**
 * Walk-in / offline patient registration form.
 * Only collects basic patient details — no package assignment.
 * Packages and appointments can be added from the Patient Profile after creation.
 *
 * Props:
 *   clinicId  {string|number}
 *   onCreated {function} – called with response data after successful creation
 *   onClose   {function} – optional; if provided renders a modal-style close button in header
 */
export default function ClinicOfflinePatientForm({ clinicId, onCreated, onClose }) {
  const [form, setForm]   = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.first_name.trim() || !form.phone.trim()) {
      toast.error('First name and mobile number are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name:   form.first_name.trim(),
        last_name:    form.last_name.trim(),
        phone:        form.phone.trim(),
        email:        form.email.trim() || undefined,
        notes:        form.notes.trim() || undefined,
        send_invite:  !!form.send_invite,
        // No package — assign from Patient Profile after creation
      };
      const res  = await clinicPortal.createOfflinePatient(clinicId, payload);
      const data = res?.data ?? res ?? {};
      const n    = data.notify || {};
      const channels = [
        n.email_sent    && 'email',
        n.sms_sent      && 'SMS',
        n.whatsapp_sent && 'WhatsApp',
      ].filter(Boolean);
      toast.success(
        channels.length
          ? `Patient added — invite sent via ${channels.join(', ')}`
          : 'Patient added (invite queued — check messaging settings if nothing was delivered)'
      );
      setForm(empty());
      onCreated?.(data);
    } catch (err) {
      toast.error(err.message || 'Could not add patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Header — only shown when used inside a modal (onClose provided) */}
      {onClose && (
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-user-plus" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">New Patient</h2>
              <p className="text-xs text-slate-500">Add walk-in patient — invite sent via SMS, WhatsApp & Email</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"
            aria-label="Close"
          >
            <FaIcon icon="fa-xmark" />
          </button>
        </div>
      )}

      <p className="text-sm text-slate-600">
        After the patient is added, send an invite and they&apos;ll create their{' '}
        <strong>The Urban Physio Account</strong>. You can assign packages and book appointments
        from their profile.
      </p>

      {/* Basic details */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            First name <span className="text-rose-500">*</span>
          </label>
          <input
            className="input-field"
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            required
            autoFocus={!!onClose}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
          <input
            className="input-field"
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobile <span className="text-rose-500">*</span>
          </label>
          <input
            className="input-field"
            placeholder="10-digit mobile"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="For email invite"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal notes</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Optional receptionist notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      {/* Invite toggle */}
      <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-4 h-4 rounded"
          checked={form.send_invite}
          onChange={(e) => set('send_invite', e.target.checked)}
        />
        Send &ldquo;Create your The Urban Physio Account&rdquo; via SMS, WhatsApp &amp; Email
      </label>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
        {onClose && (
          <button type="button" className="btn-outline w-full sm:w-auto" onClick={onClose}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary w-full sm:w-auto"
          disabled={saving || !clinicId}
        >
          {saving
            ? <><FaIcon icon="fa-spinner" className="fa-spin mr-1.5" />Saving…</>
            : <><FaIcon icon="fa-user-plus" className="mr-1.5" />Add patient &amp; send invite</>
          }
        </button>
      </div>
    </form>
  );
}
