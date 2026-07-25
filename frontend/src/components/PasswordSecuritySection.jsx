import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import PasswordInput from './PasswordInput';
import toast from 'react-hot-toast';

export default function PasswordSecuritySection({
  passwordCustomized,
  onUpdated,
  forgotLoginPath = '/login',
  forgotLoginRole,
}) {
  const needsSet = !passwordCustomized;
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (needsSet && form.new_password !== form.new_password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (needsSet) {
        res = await auth.setPassword({
          new_password: form.new_password,
          new_password_confirmation: form.new_password_confirmation,
        });
        toast.success('Password set. You can use it to sign in next time.');
      } else {
        res = await auth.changePassword({
          current_password: form.current_password,
          new_password: form.new_password,
        });
        toast.success('Password changed successfully');
      }
      const user = res?.data ?? res;
      onUpdated?.(user);
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      toast.error(err.message || 'Could not update password');
      if (err.errors) {
        Object.values(err.errors).forEach((m) => toast.error(String(m)));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {needsSet ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Please set a personal password so you can sign in with email and password.
          If you received a temporary password by email, replace it below.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Change your password anytime. You can also use{' '}
          <Link
            to="/forgot-password"
            state={{ loginPath: forgotLoginPath, loginRole: forgotLoginRole }}
            className="text-primary-600 font-medium"
          >
            forgot password
          </Link>{' '}
          on the sign-in page if you are logged out.
        </p>
      )}

      <form onSubmit={submit} className="space-y-3 max-w-md">
        {!needsSet && (
          <PasswordInput
            label="Current password"
            value={form.current_password}
            onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            required
            autoComplete="current-password"
          />
        )}
        <PasswordInput
          label="New password"
          value={form.new_password}
          onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {needsSet ? (
          <PasswordInput
            label="Confirm new password"
            value={form.new_password_confirmation}
            onChange={(e) => setForm((f) => ({ ...f, new_password_confirmation: e.target.value }))}
            required
            minLength={8}
            autoComplete="new-password"
          />
        ) : null}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : needsSet ? 'Set password' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
