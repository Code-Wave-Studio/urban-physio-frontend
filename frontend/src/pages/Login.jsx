import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import PasswordInput from '../components/PasswordInput';
import PhoneOtpLogin from '../components/PhoneOtpLogin';
import { navigateAfterAuth } from '../utils/authRedirect';

export default function Login() {
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from;
  const loginRequiredForBooking = redirectTo?.includes('/book');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      navigateAfterAuth(navigate, user, redirectTo);
    } catch (err) {
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

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 relative">
        <div className="glass-strong rounded-3xl p-8 animate-scale-in shadow-xl hover-glow">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Sign In</h1>
          <p className="text-sm text-slate-500 mb-6">Patients & doctors — email password or + email OTP</p>

          {loginRequiredForBooking && (
            <p className="text-sm text-primary-800 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4">
              Please sign in to book an appointment. You will return to booking after login.
            </p>
          )}

          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'email' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'phone' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Email OTP
            </button>
          </div>

          {mode === 'phone' ? (
            <PhoneOtpLogin redirectTo={redirectTo} />
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
              <PasswordInput
                label="Password"
                labelExtra={
                  <Link to="/forgot-password" className="text-xs text-primary-600 font-medium">
                    Forgot password?
                  </Link>
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" state={{ from: redirectTo }} className="text-primary-600 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
