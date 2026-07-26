import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from './PasswordInput';
import { navigateAfterAuth } from '../utils/authRedirect';

const WRONG_PORTAL_PATHS = {
  patient: '/patient/login',
  doctor: '/doctor/login',
  clinic: '/clinic/login',
};

/** Email & password sign-in when mobile OTP is not available. */
export default function AuthFallbackLogin({ redirectTo, forgotPasswordRole, forgotPasswordLoginPath, portal = null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, portal);
      toast.success('Welcome back!');
      navigateAfterAuth(navigate, user, redirectTo);
    } catch (err) {
      if (err.errors?.wrong_portal) {
        const target = WRONG_PORTAL_PATHS[err.errors.account_portal];
        toast.error(err.message);
        if (target) navigate(target, { state: { from: redirectTo } });
        return;
      }
      if (err.needsVerification) {
        toast.error('Please verify your email first');
        navigate('/verify-otp', {
          state: { email: err.email || email, from: redirectTo },
        });
        return;
      }
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full text-center text-sm text-slate-500 hover:text-primary-600 transition"
      >
        Sign in with email &amp; password instead
      </button>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <p className="text-xs text-slate-500 text-center mb-4">
        Use this if your mobile is not registered on your account
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <PasswordInput
          label="Password"
          labelExtra={
            <Link
              to="/forgot-password"
              state={{ from: redirectTo, loginRole: forgotPasswordRole, loginPath: forgotPasswordLoginPath }}
              className="text-xs text-primary-600 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading} className="btn-outline w-full text-sm">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600"
      >
        Back to mobile OTP
      </button>
    </div>
  );
}
