import { useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';

/**
 * Secure switch between Receptionist ↔ Clinic Admin modes.
 * Elevating to admin requires password re-entry.
 */
export default function ClinicRoleSwitch({
  open,
  onClose,
  portalRole,
  canSwitchAdmin,
  onSwitched,
}) {
  const isAdmin = portalRole === 'clinic_admin';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const switchToReceptionist = async () => {
    setBusy(true);
    try {
      await clinicPortal.switchMode({ mode: 'receptionist' });
      toast.success('Switched to Receptionist (Front Desk)');
      onSwitched?.();
      onClose?.();
    } catch (e) {
      toast.error(e.message || 'Could not switch');
    } finally {
      setBusy(false);
    }
  };

  const switchToAdmin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Enter your password to unlock Clinic Admin');
      return;
    }
    setBusy(true);
    try {
      await clinicPortal.switchMode({ mode: 'clinic_admin', password });
      toast.success('Clinic Admin unlocked');
      setPassword('');
      onSwitched?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Incorrect password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} size="sm">
      <GlassModalHeader
        title={isAdmin ? 'Switch to Receptionist' : 'Unlock Clinic Admin'}
        subtitle={
          isAdmin
            ? 'Return to the front-desk Receptionist dashboard'
            : 'Re-enter your password to access admin controls'
        }
        icon={isAdmin ? 'fa-desktop' : 'fa-user-shield'}
        onClose={onClose}
      />
      <GlassModalBody>
        {isAdmin ? (
          <p className="text-sm text-slate-600">
            You will keep the same account. Admin-only pages (Finance, Staff, Settings, Analytics) will be hidden until you unlock Admin again.
          </p>
        ) : !canSwitchAdmin ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Your staff account does not have Clinic Admin privileges. Ask the clinic owner to upgrade your role.
          </p>
        ) : (
          <form id="clinic-admin-unlock" onSubmit={switchToAdmin} className="space-y-3">
            <p className="text-sm text-slate-600">
              Clinic Admin can manage staff, finance, doctors, settings and full analytics.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Account password</label>
              <input
                type="password"
                className="input-field w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </form>
        )}
      </GlassModalBody>
      <GlassModalFooter>
        <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        {isAdmin ? (
          <button type="button" className="btn-primary" onClick={switchToReceptionist} disabled={busy}>
            {busy ? 'Switching…' : 'Go to Receptionist'}
          </button>
        ) : canSwitchAdmin ? (
          <button type="submit" form="clinic-admin-unlock" className="btn-primary" disabled={busy}>
            {busy ? (
              <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" />
            ) : (
              <FaIcon icon="fa-lock-open" className="mr-1.5" />
            )}
            Unlock Admin
          </button>
        ) : null}
      </GlassModalFooter>
    </GlassModal>
  );
}
