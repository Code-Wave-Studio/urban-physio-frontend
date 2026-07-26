import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import FaIcon from '../FaIcon';
import PasswordInput from '../PasswordInput';
import { clinicPortal } from '../../services/api';

const UNLOCK_FORM_ID = 'clinic-admin-unlock';
const RESET_FORM_ID = 'clinic-admin-reset';

/**
 * Secure switch between Receptionist ↔ Clinic Admin modes.
 * Elevating to admin requires the Clinic Admin password, which defaults to the
 * account login password until a separate one is set in Clinic Settings.
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
  const [view, setView] = useState('unlock');
  const [emailMasked, setEmailMasked] = useState('');
  const [reset, setReset] = useState({ otp: '', new_password: '', new_password_confirmation: '' });

  useEffect(() => {
    if (!open) return;
    setView('unlock');
    setPassword('');
    setReset({ otp: '', new_password: '', new_password_confirmation: '' });
  }, [open]);

  const setResetField = (key, value) => setReset((r) => ({ ...r, [key]: value }));

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

  const unlockAdmin = async (adminPassword) => {
    await clinicPortal.switchMode({ mode: 'clinic_admin', password: adminPassword });
    toast.success('Clinic Admin unlocked');
    setPassword('');
    onSwitched?.();
    onClose?.();
  };

  const switchToAdmin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Enter your Clinic Admin password');
      return;
    }
    setBusy(true);
    try {
      await unlockAdmin(password);
    } catch (err) {
      toast.error(err.message || 'Incorrect password');
    } finally {
      setBusy(false);
    }
  };

  const sendResetCode = async () => {
    setBusy(true);
    try {
      const res = await clinicPortal.sendAdminPasswordOtp();
      const data = res?.data ?? res ?? {};
      setEmailMasked(data.email_masked || '');
      setView('forgot');
      toast.success(res?.message || 'Verification code sent to your email');
    } catch (err) {
      toast.error(err.message || 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (reset.new_password !== reset.new_password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await clinicPortal.resetAdminPasswordWithOtp(reset);
      toast.success('Clinic Admin password reset');
      await unlockAdmin(reset.new_password);
    } catch (err) {
      toast.error(err.message || 'Could not reset the password');
    } finally {
      setBusy(false);
    }
  };

  const header = isAdmin
    ? { title: 'Switch to Receptionist', subtitle: 'Return to the front-desk Receptionist dashboard', icon: 'fa-desktop' }
    : view === 'forgot'
      ? { title: 'Reset Clinic Admin password', subtitle: 'Verify with the code sent to your registered email', icon: 'fa-key' }
      : { title: 'Unlock Clinic Admin', subtitle: 'Re-enter your password to access admin controls', icon: 'fa-user-shield' };

  return (
    <GlassModal open={open} onClose={onClose} size="sm">
      <GlassModalHeader title={header.title} subtitle={header.subtitle} icon={header.icon} onClose={onClose} />
      <GlassModalBody>
        {isAdmin ? (
          <p className="text-sm text-slate-600">
            You will keep the same account. Admin-only pages (Finance, Staff, Settings, Analytics) will be hidden until you unlock Admin again.
          </p>
        ) : !canSwitchAdmin ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Your staff account does not have Clinic Admin privileges. Ask the clinic owner to upgrade your role.
          </p>
        ) : view === 'forgot' ? (
          <form id={RESET_FORM_ID} onSubmit={submitReset} className="space-y-3">
            <p className="text-sm text-slate-600">
              We emailed a 6-digit code to <strong>{emailMasked || 'your registered email'}</strong>. Enter it below with your new Clinic Admin password.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Verification code</label>
              <input
                className="input-field w-full tracking-[0.3em] text-center font-semibold"
                value={reset.otp}
                onChange={(e) => setResetField('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>
            <PasswordInput
              label="New Clinic Admin password"
              value={reset.new_password}
              onChange={(e) => setResetField('new_password', e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <PasswordInput
              label="Confirm new password"
              value={reset.new_password_confirmation}
              onChange={(e) => setResetField('new_password_confirmation', e.target.value)}
              placeholder="Re-enter the password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setView('unlock')}
                disabled={busy}
              >
                Back to unlock
              </button>
              <button
                type="button"
                className="text-xs font-medium text-primary-600 hover:underline"
                onClick={sendResetCode}
                disabled={busy}
              >
                Resend code
              </button>
            </div>
          </form>
        ) : (
          <form id={UNLOCK_FORM_ID} onSubmit={switchToAdmin} className="space-y-3">
            <p className="text-sm text-slate-600">
              Clinic Admin can manage staff, finance, doctors, settings and full analytics.
            </p>
            <PasswordInput
              label="Clinic Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:underline disabled:opacity-60"
              onClick={sendResetCode}
              disabled={busy}
            >
              Forgot Clinic Admin password?
            </button>
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
          <button
            type="submit"
            form={view === 'forgot' ? RESET_FORM_ID : UNLOCK_FORM_ID}
            className="btn-primary"
            disabled={busy}
          >
            {busy ? (
              <FaIcon icon="fa-spinner" className="fa-spin mr-1.5" />
            ) : (
              <FaIcon icon={view === 'forgot' ? 'fa-key' : 'fa-lock-open'} className="mr-1.5" />
            )}
            {view === 'forgot' ? 'Reset & unlock' : 'Unlock Admin'}
          </button>
        ) : null}
      </GlassModalFooter>
    </GlassModal>
  );
}
