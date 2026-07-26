import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import PasswordInput from '../PasswordInput';
import { clinicPortal } from '../../services/api';

const emptyChange = () => ({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
});

const emptyReset = () => ({
  otp: '',
  new_password: '',
  new_password_confirmation: '',
});

/**
 * Manages the password that unlocks Clinic Admin mode.
 * Until a separate one is set it stays the same as the clinic login password.
 */
export default function ClinicAdminPasswordCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null);
  const [change, setChange] = useState(emptyChange);
  const [reset, setReset] = useState(emptyReset);
  const [accountPassword, setAccountPassword] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    clinicPortal
      .adminPasswordStatus()
      .then((res) => setStatus(res?.data ?? res ?? null))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const closeForms = () => {
    setMode(null);
    setChange(emptyChange());
    setReset(emptyReset());
    setAccountPassword('');
  };

  const applyStatus = (res) => {
    setStatus((s) => ({ ...(s || {}), ...(res?.data ?? res ?? {}) }));
  };

  const submitChange = async (e) => {
    e.preventDefault();
    if (change.new_password !== change.new_password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const res = await clinicPortal.updateAdminPassword(change);
      toast.success(res?.message || 'Clinic Admin password updated');
      applyStatus(res);
      closeForms();
    } catch (err) {
      toast.error(err.message || 'Could not update the password');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    setBusy(true);
    try {
      const res = await clinicPortal.sendAdminPasswordOtp();
      const data = res?.data ?? res ?? {};
      setStatus((s) => ({ ...(s || {}), email_masked: data.email_masked || s?.email_masked }));
      setMode('forgot');
      toast.success(res?.message || 'Verification code sent');
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
      const res = await clinicPortal.resetAdminPasswordWithOtp(reset);
      toast.success(res?.message || 'Clinic Admin password reset');
      applyStatus(res);
      closeForms();
    } catch (err) {
      toast.error(err.message || 'Could not reset the password');
    } finally {
      setBusy(false);
    }
  };

  const submitUseAccount = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await clinicPortal.resetAdminPasswordToAccount({ account_password: accountPassword });
      toast.success(res?.message || 'Clinic Admin now uses your login password');
      applyStatus(res);
      closeForms();
    } catch (err) {
      toast.error(err.message || 'Could not switch back');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="glass-card !p-6 h-40 animate-pulse" />;
  }

  if (!status) {
    return null;
  }

  const isCustom = !!status.is_custom;

  return (
    <div className="glass-card !p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800 inline-flex items-center gap-2">
            <FaIcon icon="fa-user-shield" className="text-teal-600" />
            Clinic Admin password
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            This password unlocks Clinic Admin mode (Finance, Staff, Doctors, Settings, Analytics).
            {isCustom
              ? ' A separate password is set — your clinic login password will no longer unlock Admin.'
              : ' It is currently the same as your clinic login password.'}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
            isCustom
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {isCustom ? 'Separate password' : 'Same as login'}
        </span>
      </div>

      {mode === null && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => setMode('change')}>
            <FaIcon icon="fa-key" className="mr-1.5" />
            {isCustom ? 'Change admin password' : 'Set a separate admin password'}
          </button>
          <button type="button" className="btn-outline" onClick={sendCode} disabled={busy}>
            Forgot admin password?
          </button>
          {isCustom && (
            <button type="button" className="btn-outline" onClick={() => setMode('use-account')}>
              Use login password again
            </button>
          )}
        </div>
      )}

      {mode === 'change' && (
        <form onSubmit={submitChange} className="space-y-3 max-w-md pt-1">
          <PasswordInput
            label={isCustom ? 'Current admin password' : 'Current login password'}
            value={change.current_password}
            onChange={(e) => setChange((c) => ({ ...c, current_password: e.target.value }))}
            autoComplete="current-password"
            required
          />
          <PasswordInput
            label="New Clinic Admin password"
            value={change.new_password}
            onChange={(e) => setChange((c) => ({ ...c, new_password: e.target.value }))}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <PasswordInput
            label="Confirm new password"
            value={change.new_password_confirmation}
            onChange={(e) => setChange((c) => ({ ...c, new_password_confirmation: e.target.value }))}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save admin password'}
            </button>
            <button type="button" className="btn-outline" onClick={closeForms} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={submitReset} className="space-y-3 max-w-md pt-1">
          <p className="text-sm text-slate-600">
            Enter the 6-digit code sent to <strong>{status.email_masked || 'your registered email'}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
            <input
              className="input-field tracking-[0.3em] text-center font-semibold"
              value={reset.otp}
              onChange={(e) => setReset((r) => ({ ...r, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>
          <PasswordInput
            label="New Clinic Admin password"
            value={reset.new_password}
            onChange={(e) => setReset((r) => ({ ...r, new_password: e.target.value }))}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <PasswordInput
            label="Confirm new password"
            value={reset.new_password_confirmation}
            onChange={(e) => setReset((r) => ({ ...r, new_password_confirmation: e.target.value }))}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Reset admin password'}
            </button>
            <button type="button" className="btn-outline" onClick={sendCode} disabled={busy}>
              Resend code
            </button>
            <button type="button" className="btn-outline" onClick={closeForms} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'use-account' && (
        <form onSubmit={submitUseAccount} className="space-y-3 max-w-md pt-1">
          <p className="text-sm text-slate-600">
            Confirm your clinic login password to remove the separate admin password.
          </p>
          <PasswordInput
            label="Clinic login password"
            value={accountPassword}
            onChange={(e) => setAccountPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Use login password'}
            </button>
            <button type="button" className="btn-outline" onClick={closeForms} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
