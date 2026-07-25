import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import PasswordInput from '../components/PasswordInput';
import FaIcon from '../components/FaIcon';

function loginPathForRole(role) {
  switch (role) {
    case 'clinic':
      return '/clinic/login';
    case 'doctor':
      return '/doctor/login';
    case 'admin':
    case 'super_admin':
      return '/login';
    case 'patient':
      return '/patient/login';
    default:
      return '/login';
  }
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const role = (searchParams.get('role') || '').toLowerCase();
  const loginBack = loginPathForRole(role);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    auth
      .validateResetToken(token)
      .then(() => {
        if (!cancelled) setTokenValid(true);
      })
      .catch(() => {
        if (!cancelled) setTokenValid(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !tokenValid) {
      toast.error('Invalid reset link');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Password updated — you can sign in now');
      navigate(loginBack, { replace: true, state: { passwordReset: true } });
    } catch (err) {
      toast.error(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || (!checking && !tokenValid)) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <FaIcon icon="fa-link-slash" className="text-3xl text-slate-400 mb-3" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Link invalid or expired</h1>
            <p className="text-slate-600 text-sm mb-5">
              This password reset link is no longer valid. Request a new one to continue.
            </p>
            <Link
              to="/forgot-password"
              state={role ? { loginRole: role, loginPath: loginBack } : undefined}
              className="btn-primary inline-block"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <FaIcon icon="fa-spinner fa-spin" className="text-2xl text-primary-600 mb-3" />
            <p className="text-slate-600">Verifying your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 relative">
        <div className="glass-strong rounded-3xl p-8 animate-slide-up shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Create new password</h1>
          <p className="text-sm text-slate-600 mb-6">
            Choose a strong password with at least 8 characters.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to={loginBack} className="text-primary-600 font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
