import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';

const empty = () => ({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  notes: '',
  doctor_id: '',
  template_id: '',
  package_name: '',
  total_sessions: '10',
  duration_days: '30',
  price: '',
  start_date: new Date().toISOString().slice(0, 10),
  send_invite: true,
});

/**
 * Walk-in / offline patient → package → SMS + WhatsApp + Email invite.
 */
export default function ClinicOfflinePatientForm({ clinicId, onCreated }) {
  const [form, setForm] = useState(empty);
  const [doctors, setDoctors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    clinicPortal
      .doctors(clinicId)
      .then((res) => setDoctors(res.data || res || []))
      .catch(() => setDoctors([]));
    clinicPortal
      .packageTemplates(clinicId)
      .then((res) => {
        const rows = res.data || res || [];
        setTemplates(rows.filter((t) => Number(t.is_active) !== 0));
      })
      .catch(() => setTemplates([]));
  }, [clinicId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyTemplate = (templateId) => {
    set('template_id', templateId);
    if (!templateId) return;
    const t = templates.find((x) => String(x.id) === String(templateId));
    if (!t) return;
    setForm((f) => ({
      ...f,
      template_id: String(t.id),
      package_name: t.name || '',
      total_sessions: String(t.total_sessions || 10),
      duration_days: String(t.duration_days || 30),
      price: String(t.price ?? ''),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.first_name.trim() || !form.phone.trim()) {
      toast.error('First name and mobile number are required');
      return;
    }
    const sessions = parseInt(form.total_sessions, 10) || 0;
    if (sessions < 1) {
      toast.error('Enter how many sessions are in the package');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        send_invite: !!form.send_invite,
        package: {
          name: form.package_name.trim() || `${sessions}-Session Package`,
          total_sessions: sessions,
          duration_days: parseInt(form.duration_days, 10) || sessions,
          price: parseFloat(form.price) || 0,
          start_date: form.start_date || undefined,
          doctor_id: form.doctor_id ? Number(form.doctor_id) : undefined,
        },
      };
      const res = await clinicPortal.createOfflinePatient(clinicId, payload);
      const data = res?.data ?? res ?? {};
      const n = data.notify || {};
      const channels = [
        n.email_sent && 'email',
        n.sms_sent && 'SMS',
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
    <div className="glass-card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-teal-50/80 border-b border-teal-100"
      >
        <span className="font-bold text-slate-900 inline-flex items-center gap-2">
          <FaIcon icon="fa-user-plus" className="text-teal-600" />
          Add walk-in patient (Offline → Online)
        </span>
        <FaIcon icon={open ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 text-xs" />
      </button>

      {open && (
        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Receptionist adds a walk-in patient, assigns a session package, then the patient gets a message to{' '}
            <strong>Create your The Urban Physio Account</strong> (SMS + WhatsApp + Email). After they register,
            they connect to your clinic automatically.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name *</label>
              <input
                className="input-field"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                className="input-field"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 inline-flex items-center gap-2">
              <FaIcon icon="fa-box-open" className="text-teal-600" />
              Session package
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">From package catalog</label>
                  <select
                    className="input-field"
                    value={form.template_id}
                    onChange={(e) => applyTemplate(e.target.value)}
                  >
                    <option value="">Custom package (enter below)</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.total_sessions} sess · ₹{Number(t.price || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Package name</label>
                <input
                  className="input-field"
                  placeholder="e.g. 10-Session Rehab Pack"
                  value={form.package_name}
                  onChange={(e) => {
                    set('package_name', e.target.value);
                    set('template_id', '');
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sessions *</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  className="input-field"
                  value={form.total_sessions}
                  onChange={(e) => set('total_sessions', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  className="input-field"
                  value={form.duration_days}
                  onChange={(e) => set('duration_days', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign doctor</label>
                <select
                  className="input-field"
                  value={form.doctor_id}
                  onChange={(e) => set('doctor_id', e.target.value)}
                >
                  <option value="">Clinic default / first linked doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      Dr. {d.first_name} {d.last_name}
                      {d.specialization ? ` · ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Internal notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional receptionist notes"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.send_invite}
              onChange={(e) => set('send_invite', e.target.checked)}
            />
            Send “Create your The Urban Physio Account” via SMS, WhatsApp & Email
          </label>

          <button type="submit" className="btn-primary" disabled={saving || !clinicId}>
            {saving ? 'Saving…' : 'Add patient & send invite'}
          </button>
        </form>
      )}
    </div>
  );
}
