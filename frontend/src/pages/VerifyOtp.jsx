import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { navigateAfterAuth } from '../utils/authRedirect';

const RESEND_COOLDOWN = 60;

export default function VerifyOtp() {
  const location = useLocation();
  const email = location.state?.email || '';
  const redirectTo = location.state?.from;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN);
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const portalId = location.state?.portalId;
  const registerBack = portalId === 'doctor' ? '/doctor/register' : '/patient/register';

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const otpValue = otp.join('');

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setOtp(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtp(email, otpValue);
      toast.success('Email verified!');
      navigateAfterAuth(navigate, user, redirectTo);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await resendOtp(email);
      toast.success('New code sent to your email');
      setResendIn(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 relative">
        <div className="glass-strong rounded-3xl p-8 animate-slide-up shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Verify your email</h1>
          <p className="text-sm text-slate-600 mb-6">
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-11 h-12 text-center text-lg font-semibold input-field !px-0"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otpValue.length !== 6} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Didn&apos;t get the code?{' '}
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button type="button" onClick={handleResend} className="text-primary-600 font-medium">
                Resend code
              </button>
            )}
          </p>
          <p className="mt-3 text-center text-sm">
            <Link to="/login" className="text-primary-600">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
