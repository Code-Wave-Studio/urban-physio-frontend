import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';
import {
  formatDate,
  initials,
  mailLink,
  maskEmail,
  maskName,
  maskPhone,
  money,
  patientDetailPath,
  smsLink,
  statusMeta,
  telLink,
  waLink,
} from './patientDirectoryUtils';

function CommBtn({ href, icon, label, disabled, className = '' }) {
  if (disabled || !href) {
    return (
      <span
        className={`inline-flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-slate-300 ${className}`}
        title="Unavailable"
      >
        <FaIcon icon={icon} className="text-sm" />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={`inline-flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-teal-800 ${className}`}
    >
      <FaIcon icon={icon} className="text-sm" />
      {label}
    </a>
  );
}

/**
 * Desktop: floating glance card. Mobile: drag-dismiss bottom sheet.
 */
export default function PatientGlanceSheet({
  patient,
  open,
  onClose,
  privacy = false,
  clinicId,
  onResend,
  resendingId,
  onReminderCreated,
}) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 240], [1, 0.35]);
  const sheetRef = useRef(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [title, setTitle] = useState('Follow-up call');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      y.set(0);
      setRemindOpen(false);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      setDueAt(d.toISOString().slice(0, 16));
      setTitle('Follow-up call');
    }
  }, [open, patient, y]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!patient) return null;

  const meta = statusMeta(patient.portal_status);
  const phone = patient.phone;
  const email = patient.email;
  const path = patientDetailPath(patient);

  const saveReminder = async () => {
    if (!clinicId) return;
    setSaving(true);
    try {
      await clinicPortal.createPatientReminder(clinicId, {
        clinic_patient_id: patient.clinic_patient_id || undefined,
        patient_id: patient.patient_id || undefined,
        title: title.trim() || 'Follow-up',
        due_at: dueAt,
        channel: 'call',
      });
      toast.success('Reminder scheduled');
      setRemindOpen(false);
      onReminderCreated?.();
    } catch (e) {
      toast.error(e.message || 'Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-400/10 text-sm font-bold text-teal-800">
          {initials(patient.patient_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {maskName(patient.patient_name, privacy)}
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}>
              {meta.label}
            </span>
            {patient.reminder_due ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
                Reminder due
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {patient.patient_key || path.split('/').pop()}
            {patient.last_visit ? ` · Last visit ${formatDate(patient.last_visit)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          aria-label="Close"
        >
          <FaIcon icon="fa-xmark" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Visits', value: patient.visit_count || 0 },
          { label: 'Spent', value: money(patient.total_spent) },
          {
            label: 'Package',
            value: patient.package_name
              ? `${Number(patient.package_completed || 0)}/${Number(patient.package_sessions || 0)}`
              : '—',
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-slate-50 px-2.5 py-2 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-slate-600">
        <p>
          <FaIcon icon="fa-phone" className="mr-2 w-4 text-slate-400" />
          {maskPhone(phone, privacy)}
        </p>
        {email ? (
          <p className="truncate">
            <FaIcon icon="fa-envelope" className="mr-2 w-4 text-slate-400" />
            {maskEmail(email, privacy)}
          </p>
        ) : null}
        {patient.package_name ? (
          <p className="truncate">
            <FaIcon icon="fa-box" className="mr-2 w-4 text-slate-400" />
            {patient.package_name}
          </p>
        ) : null}
      </div>

      {(patient.tags || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.tags.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between rounded-2xl border border-slate-100 bg-white/80 p-1">
        <CommBtn href={telLink(phone)} icon="fa-phone" label="Call" disabled={privacy || !phone} />
        <CommBtn href={waLink(phone)} icon="fa-brands fa-whatsapp" label="WhatsApp" disabled={privacy || !phone} />
        <CommBtn href={smsLink(phone)} icon="fa-comment-sms" label="SMS" disabled={privacy || !phone} />
        <CommBtn href={mailLink(email)} icon="fa-envelope" label="Email" disabled={privacy || !email} />
      </div>

      {remindOpen ? (
        <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <input
            className="input-field w-full text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
          />
          <input
            type="datetime-local"
            className="input-field w-full text-sm"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="btn-outline flex-1 text-xs" onClick={() => setRemindOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-1 text-xs" disabled={saving} onClick={saveReminder}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={path} className="btn-primary text-xs" onClick={onClose}>
          Open chart
        </Link>
        <button type="button" className="btn-outline text-xs" onClick={() => setRemindOpen((v) => !v)}>
          <FaIcon icon="fa-bell" className="mr-1" />
          Reminder
        </button>
        {patient.clinic_patient_id && patient.portal_status !== 'online' ? (
          <button
            type="button"
            className="btn-outline text-xs"
            disabled={resendingId === patient.clinic_patient_id}
            onClick={() => onResend?.(patient.clinic_patient_id)}
          >
            {resendingId === patient.clinic_patient_id ? 'Sending…' : 'Resend invite'}
          </button>
        ) : null}
      </div>
    </>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9980] flex items-end justify-center md:items-center md:p-6">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/40"
            style={isMobile ? { opacity: backdropOpacity } : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {isMobile ? (
            <motion.div
              ref={sheetRef}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.55 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) onClose();
              }}
              style={{ y }}
              className="relative z-10 w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-white/60 bg-white px-5 pb-8 pt-3 shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div
                className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200"
                onPointerDown={(e) => dragControls.start(e)}
              />
              {body}
            </motion.div>
          ) : (
            <motion.div
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              {body}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
