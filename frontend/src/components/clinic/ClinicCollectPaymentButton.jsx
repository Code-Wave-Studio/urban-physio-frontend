import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { clinicPortal } from '../../services/api';

const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'other', label: 'Other' },
];

/**
 * Front-desk collect payment with method selector (fixes hardcoded cash).
 */
export default function ClinicCollectPaymentButton({
  clinicId,
  appointment,
  disabled,
  className = 'text-[11px] font-semibold text-violet-700 hover:underline',
  label,
  onDone,
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);

  if (!appointment?.id || !clinicId) return null;

  const amount = Number(appointment.amount || 0);
  const buttonLabel = label || `Collect ₹${amount.toLocaleString('en-IN')}`;

  const submit = async () => {
    setBusy(true);
    try {
      await clinicPortal.collectPayment(clinicId, appointment.id, { method });
      toast.success(`Payment collected (${method.toUpperCase()})`);
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" disabled={disabled || busy} onClick={() => setOpen(true)} className={className}>
        {buttonLabel}
      </button>

      <GlassModal open={open} onClose={() => !busy && setOpen(false)} size="sm">
        <GlassModalHeader
          title="Collect payment"
          subtitle={appointment.patient_name || appointment.booking_id || 'Appointment'}
          icon="fa-money-bill-wave"
          onClose={() => !busy && setOpen(false)}
        />
        <GlassModalBody>
          <p className="text-sm text-slate-600 mb-3">
            Amount: <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment method</label>
          <select className="input-field" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-2" disabled={busy} onClick={submit}>
            <FaIcon icon="fa-check" />
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </GlassModalFooter>
      </GlassModal>
    </>
  );
}
