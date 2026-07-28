import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import GoogleSignInButton, { hasGoogleAuth } from '../../components/GoogleSignInButton';
import IntakePublicField from '../../components/clinic/IntakePublicField';
import { auth, clinicQr } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { isFieldVisible } from '../../utils/intakeFields';

function parse(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return fallback;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function AssessmentField({ field, value, onChange }) {
  const type = field.type || field.field_type || 'text';
  const options = parse(field.options || field.options_json);
  const common = {
    id: `assess-${field.key || field.label}`,
    className: 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500',
    required: Boolean(field.required),
    value: value ?? '',
    onChange: (event) => onChange(event.target.value),
  };
  if (type === 'textarea') return <textarea {...common} rows={3} />;
  if (['dropdown', 'select', 'yesno'].includes(type)) {
    const choices = type === 'yesno' ? ['Yes', 'No'] : options;
    return (
      <select {...common}>
        <option value="">Select…</option>
        {choices.map((option) => <option key={String(option)} value={option}>{option}</option>)}
      </select>
    );
  }
  if (type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <select
        {...common}
        multiple
        value={selected}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
      >
        {options.map((option) => <option key={String(option)} value={option}>{option}</option>)}
      </select>
    );
  }
  return <input {...common} type={type === 'number' ? 'number' : 'text'} />;
}

export default function ClinicQrIntakePage() {
  const { token: pathToken } = useParams();
  const [search] = useSearchParams();
  const token = pathToken || search.get('token') || '';
  const { phoneVerifyOtp } = useAuth();
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [values, setValues] = useState({});
  const [assessment, setAssessment] = useState({});
  const [mode, setMode] = useState('new'); // new | returning
  const [otpStep, setOtpStep] = useState('phone'); // phone | otp
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMeta, setOtpMeta] = useState(null);
  const [googleMobileNeeded, setGoogleMobileNeeded] = useState(null);

  useEffect(() => {
    let active = true;
    clinicQr.resolve(token)
      .then((res) => {
        if (active) setResolved(res.data || res);
      })
      .catch((err) => {
        if (active) setError(err.message || 'This QR code is invalid or expired.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const qr = resolved?.qr || resolved || {};
  const fields = resolved?.registration_fields || resolved?.fields || [];
  const template = resolved?.assessment_template || resolved?.assessment || null;
  const assessmentFields = useMemo(() => parse(template?.fields || template?.fields_json), [template]);
  const clinicName = qr.clinic_name || qr.name || resolved?.clinic?.name || 'The Urban Physio Clinic';

  const visibleFields = useMemo(
    () => fields.filter((field) => isFieldVisible(field, values)),
    [fields, values],
  );

  const finishAuth = (next) => {
    const data = next && typeof next === 'object' ? next : {};
    setResult(data);
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('storage'));
    }
    toast.success(data.existing ? 'Welcome back' : 'Registration complete');
  };

  const assessmentPayload = () => {
    if (!(template?.id && assessmentFields.length)) return {};
    return { template_id: template.id, assessment_responses: assessment };
  };

  const submit = async (event) => {
    event.preventDefault();
    // Only submit visible field values (hidden conditionals dropped)
    const visibleKeys = new Set(visibleFields.map((f) => f.field_key || `custom_${f.id}`));
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([key]) => visibleKeys.has(key) || ['name', 'mobile', 'email', 'phone'].includes(key)),
    );
    setSubmitting(true);
    try {
      const payload = { token, ...filtered, ...assessmentPayload() };
      const res = await clinicQr.register(payload);
      finishAuth(res.data || res);
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential) => {
    setSubmitting(true);
    try {
      const payload = {
        token,
        id_token: credential,
        mobile: values.mobile || googleMobileNeeded?.mobile || '',
        ...assessmentPayload(),
      };
      const res = await clinicQr.google(payload);
      finishAuth(res.data || res);
      setGoogleMobileNeeded(null);
    } catch (err) {
      if (err?.errors?.mobile === 'required' || /mobile/i.test(err.message || '')) {
        const prefill = err.errors?.google_prefill || {};
        setGoogleMobileNeeded({ credential, ...prefill, mobile: values.mobile || '' });
        setValues((v) => ({
          ...v,
          name: v.name || prefill.name || '',
          email: v.email || prefill.email || '',
        }));
        toast.error('Enter your 10-digit mobile to finish Google intake');
      } else {
        toast.error(err.message || 'Google sign-in failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const completeGoogleWithMobile = async (e) => {
    e.preventDefault();
    if (!googleMobileNeeded?.credential) return;
    setSubmitting(true);
    try {
      const res = await clinicQr.google({
        token,
        id_token: googleMobileNeeded.credential,
        mobile: values.mobile || googleMobileNeeded.mobile,
        name: values.name || googleMobileNeeded.name,
        email: values.email || googleMobileNeeded.email,
        ...assessmentPayload(),
      });
      finishAuth(res.data || res);
      setGoogleMobileNeeded(null);
    } catch (err) {
      toast.error(err.message || 'Could not complete Google intake');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReturningOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await auth.phoneSendOtp({ phone: otpPhone, role: 'patient' });
      setOtpMeta(res.data || res);
      setOtpStep('otp');
      toast.success(res.message || 'OTP sent');
    } catch (err) {
      toast.error(err.message || 'Could not send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyReturningOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await phoneVerifyOtp(otpPhone, otpCode, 'patient');
      const res = await clinicQr.bind({ token, mobile: otpPhone, ...assessmentPayload() });
      finishAuth({ ...(res.data || res), existing: true });
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md h-64 rounded-3xl bg-white animate-pulse" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md">
          <span className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 inline-flex items-center justify-center text-xl">
            <FaIcon icon="fa-triangle-exclamation" />
          </span>
          <h1 className="text-xl font-bold mt-4">Unable to open intake</h1>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  if (qr.purpose && qr.purpose !== 'intake') {
    const target = qr.purpose === 'report' ? '/patient/progress' : '/book';
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md">
          <h1 className="text-xl font-bold">{clinicName}</h1>
          <p className="text-slate-500 mt-2">Continue to {qr.purpose}.</p>
          <Link className="btn-primary inline-flex mt-5" to={target}>Continue</Link>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-teal-100 p-7 text-center">
          <span className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-2xl">
            <FaIcon icon="fa-check" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">
            {result.existing ? 'Welcome back' : 'You’re registered'}
          </h1>
          <p className="text-slate-500 mt-2">
            {result.existing
              ? 'You’re signed in and linked to this clinic.'
              : `${clinicName} now has your intake details.`}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Link to="/book" className="btn-primary inline-flex justify-center items-center gap-2">
              <FaIcon icon="fa-calendar-plus" /> Book appointment
            </Link>
            <Link to={`/clinic-report/${token}`} className="btn-outline inline-flex justify-center items-center gap-2">
              <FaIcon icon="fa-chart-line" /> View report
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-white px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <header className="bg-teal-700 text-white p-6">
          <p className="text-xs uppercase tracking-widest text-teal-100">Patient intake</p>
          <h1 className="text-2xl font-bold mt-1">{clinicName}</h1>
          <p className="text-sm text-teal-50 mt-2">
            New patients register once. Returning patients sign in with OTP — no password needed.
          </p>
        </header>

        <div className="p-5 sm:p-7 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
            {[
              { id: 'new', label: 'New patient', icon: 'fa-user-plus' },
              { id: 'returning', label: 'Returning', icon: 'fa-right-to-bracket' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`rounded-lg py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
                  mode === tab.id ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                <FaIcon icon={tab.icon} /> {tab.label}
              </button>
            ))}
          </div>

          {mode === 'returning' ? (
            otpStep === 'phone' ? (
              <form onSubmit={sendReturningOtp} className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-1.5">Registered mobile</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </label>
                <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={submitting || otpPhone.length !== 10}>
                  {submitting ? 'Sending…' : 'Send login OTP'}
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  We’ll text / WhatsApp / email a 6-digit code — passwordless.
                </p>
              </form>
            ) : (
              <form onSubmit={verifyReturningOtp} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Code sent{otpMeta?.phone_masked ? ` to ${otpMeta.phone_masked}` : ''}.
                  {otpMeta?.email_masked ? ` (also ${otpMeta.email_masked})` : ''}
                </p>
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-1.5">Enter OTP</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 tracking-[0.4em] text-center text-lg font-mono"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </label>
                <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={submitting || otpCode.length !== 6}>
                  {submitting ? 'Verifying…' : 'Verify & continue'}
                </button>
                <button type="button" className="text-sm text-teal-700 font-semibold w-full" onClick={() => setOtpStep('phone')}>
                  Change mobile
                </button>
              </form>
            )
          ) : (
            <>
              {hasGoogleAuth() && !googleMobileNeeded && (
                <div className="space-y-3">
                  <GoogleSignInButton
                    text="signup_with"
                    onSuccess={handleGoogle}
                    onError={(err) => toast.error(err?.message || 'Google sign-in failed')}
                  />
                  <div className="relative text-center">
                    <span className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
                    <span className="relative bg-white px-3 text-xs text-slate-400">or register with details</span>
                  </div>
                </div>
              )}

              {googleMobileNeeded ? (
                <form onSubmit={completeGoogleWithMobile} className="space-y-4">
                  <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    Google account linked. Add your mobile to finish clinic intake.
                  </p>
                  <label className="block">
                    <span className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile *</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                      type="tel"
                      required
                      maxLength={10}
                      value={values.mobile || ''}
                      onChange={(e) => setValues((v) => ({ ...v, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    />
                  </label>
                  <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={submitting}>
                    {submitting ? 'Finishing…' : 'Complete with Google'}
                  </button>
                </form>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  {visibleFields.map((field) => {
                    const key = field.field_key || `custom_${field.id}`;
                    return (
                      <label key={field.id || key} htmlFor={`field-${field.id || key}`} className="block">
                        <span className="block text-sm font-semibold text-slate-700 mb-1.5">
                          {field.label}{' '}
                          {Boolean(Number(field.is_required ?? field.required)) && <span className="text-rose-500">*</span>}
                        </span>
                        <IntakePublicField
                          field={field}
                          value={values[key]}
                          onChange={(value) => setValues((old) => ({ ...old, [key]: value }))}
                        />
                      </label>
                    );
                  })}
                  {!fields.length && (
                    <>
                      {[['name', 'Full name', 'text'], ['mobile', 'Mobile number', 'tel'], ['email', 'Email (optional)', 'email']].map(([key, label, type]) => (
                        <label key={key} className="block">
                          <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
                          <input
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                            type={type}
                            required={key !== 'email'}
                            value={values[key] || ''}
                            onChange={(e) => setValues((old) => ({ ...old, [key]: e.target.value }))}
                          />
                        </label>
                      ))}
                    </>
                  )}
                  {assessmentFields.length > 0 && (
                    <section className="border-t border-slate-100 pt-5 space-y-4">
                      <div>
                        <h2 className="font-bold text-slate-900">{template.name || 'Quick assessment'}</h2>
                        <p className="text-xs text-slate-500">Help your physiotherapist prepare.</p>
                      </div>
                      {assessmentFields.map((field, index) => {
                        const key = field.key || `question_${index}`;
                        return (
                          <label key={key} className="block">
                            <span className="block text-sm font-medium text-slate-700 mb-1">
                              {field.label || field.question}
                            </span>
                            <AssessmentField
                              field={field}
                              value={assessment[key]}
                              onChange={(value) => setAssessment((old) => ({ ...old, [key]: value }))}
                            />
                          </label>
                        );
                      })}
                    </section>
                  )}
                  <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Complete registration'}
                  </button>
                </form>
              )}
            </>
          )}
          <p className="text-[11px] text-center text-slate-400">
            Your details are shared securely with {clinicName} for care delivery.
          </p>
        </div>
      </div>
    </main>
  );
}
