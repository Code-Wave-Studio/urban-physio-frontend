import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function ForgotPassword() {
  const location = useLocation();
  const loginRole = location.state?.loginRole;
  const loginPath = location.state?.loginPath;
  const loginBack =
    loginPath ||
    (loginRole === 'clinic'
      ? '/clinic/login'
      : loginRole === 'doctor'
        ? '/doctor/login'
        : loginRole === 'patient'
          ? '/patient/login'
          : loginRole
            ? `/login?role=${loginRole}`
            : '/login');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Check your inbox for reset instructions');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 relative">
        <div className="glass-strong rounded-3xl p-8 animate-slide-up shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Forgot password</h1>
          <p className="text-sm text-slate-600 mb-6">
            Enter your email and we&apos;ll send a link to reset your password (valid for 1 hour).
          </p>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-slate-700">
                If an account exists for <strong>{email}</strong>, you will receive an email shortly.
              </p>
              <Link to={loginBack} className="btn-primary inline-block w-full text-center">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm">
            <Link to={loginBack} className="text-primary-600">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
