import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import { auth } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { navigateAfterAuth } from '../utils/authRedirect';

const RESEND_COOLDOWN = 60;

export default function PhoneOtpLogin({ redirectTo, defaultRole = 'patient', fixedRole = null }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(fixedRole || defaultRole);
  const [phoneMasked, setPhoneMasked] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState('sms');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const { phoneVerifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (fixedRole) setRole(fixedRole);
  }, [fixedRole]);

  useEffect(() => {
    setStep('phone');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
    setCooldown(0);
  }, [role]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const applyDeliveryMeta = (res) => {
    const data = res?.data ?? res ?? {};
    setDeliveryChannel(data.delivery_channel || 'sms');
    if (data.phone_masked) setPhoneMasked(data.phone_masked);
    if (data.email_masked) setEmailMasked(data.email_masked);
  };

  const sendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await auth.phoneSendOtp({ phone, role });
      applyDeliveryMeta(res);
      toast.success(res?.message || 'OTP sent to your mobile');
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      if (err.status === 429) {
        toast.error('Too many OTP requests. Wait 15 minutes or use email sign-in below.');
      } else {
        toast.error(err.message || 'Could not send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const user = await phoneVerifyOtp(phone, code, role);
      toast.success('Welcome back!');
      navigateAfterAuth(navigate, user, redirectTo || location.state?.from);
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const res = await auth.phoneResendOtp({ phone, role });
      applyDeliveryMeta(res);
      toast.success(res?.message || 'OTP resent');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpDestination =
    deliveryChannel === 'email'
      ? emailMasked || 'your registered email'
      : phoneMasked || `+91 ${phone.replace(/\D/g, '').slice(-10)}`;
  const channelLabel =
    deliveryChannel === 'email' ? 'Email' : deliveryChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';

  if (step === 'otp') {
    return (
      <form onSubmit={verifyOtp} className="space-y-5">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-3">
            <FaIcon
              icon={deliveryChannel === 'email' ? 'fa-envelope' : deliveryChannel === 'whatsapp' ? 'fa-whatsapp' : 'fa-comment-sms'}
              brand={deliveryChannel === 'whatsapp'}
            />
          </div>
          <p className="text-sm text-slate-600">
            Enter the 6-digit code sent to
            <br />
            <strong className="text-slate-900">{otpDestination}</strong>
            <span className="block text-xs text-slate-400 mt-1">via {channelLabel}</span>
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-primary-600 font-medium hover:underline"
            onClick={() => {
              setStep('phone');
              setOtp(['', '', '', '', '', '']);
            }}
          >
            Change number
          </button>
        </div>

        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
              value={d}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
              }}
            />
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Verify & sign in'}
        </button>

        <p className="text-center text-sm text-slate-500">
          {cooldown > 0 ? (
            <span>Resend OTP in {cooldown}s</span>
          ) : (
            <button type="button" className="text-primary-600 font-medium hover:underline" onClick={resend} disabled={loading}>
              Resend OTP
            </button>
          )}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile number</label>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition">
          <span className="inline-flex items-center px-3.5 bg-slate-50 text-slate-600 text-sm font-medium border-r border-slate-200">
            +91
          </span>
          <input
            type="tel"
            className="flex-1 px-3 py-3 text-base outline-none bg-white placeholder:text-slate-400"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
            maxLength={10}
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || phone.replace(/\D/g, '').length !== 10}
        className="btn-primary w-full py-3 text-base"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending OTP…
          </span>
        ) : (
          <>
            <FaIcon icon="fa-paper-plane" className="mr-2" />
            Send OTP
          </>
        )}
      </button>
    </form>
  );
}
