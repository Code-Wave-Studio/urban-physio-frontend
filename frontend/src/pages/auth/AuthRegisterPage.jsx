import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import AuthPortalLayout from '../../components/auth/AuthPortalLayout';
import RegistrationTermsAcceptance, { registrationTermsValid } from '../../components/auth/RegistrationTermsAcceptance';
import GoogleSignInButton, { hasGoogleAuth } from '../../components/GoogleSignInButton';
import PasswordInput from '../../components/PasswordInput';
import FaIcon from '../../components/FaIcon';
import { getAuthPortal } from '../../constants/authPortals';
import { navigateAfterAuth } from '../../utils/authRedirect';

/**
 * @param {{ portalId: 'patient' | 'doctor' }} props
 */
export default function AuthRegisterPage({ portalId }) {
  const portal = getAuthPortal(portalId);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMedicoLegal, setAcceptedMedicoLegal] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from;

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    clinic_name: '',
  });

  if (!portal) return null;

  const termsOk = registrationTermsValid(portal, acceptedTerms, acceptedMedicoLegal);

  const buildPayload = () => ({
    ...form,
    role: portal.role,
    accepted_terms: true,
    registration_intent: portal.registrationIntent || portal.id,
    clinic_name: portal.showClinicName ? form.clinic_name.trim() : undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsOk) {
      toast.error('Please accept all required terms before registering');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await register(buildPayload());
      toast.success('Check your email for the verification code');
      navigate('/verify-otp', {
        state: { email: result.email || form.email, from: redirectTo, portalId },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    if (!termsOk) {
      toast.error('Please accept all required terms before continuing with Google');
      return;
    }
    setGoogleLoading(true);
    try {
      const user = await googleLogin(credential, portal.role);
      toast.success('Account created! Check your email for your sign-in password.');
      navigateAfterAuth(navigate, user, redirectTo);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthPortalLayout portal={portal}>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{portal.registerTitle}</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">{portal.registerSubtitle}</p>
      </div>

      {portal.id === 'patient' && (
        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 flex gap-2 items-start">
          <FaIcon icon="fa-circle-info" className="mt-0.5 shrink-0 text-sky-600" />
          <span>
            <strong>Patients only.</strong> Doctors must use the{' '}
            <Link to="/doctor/register" className="font-semibold underline">doctor registration</Link> page.
          </span>
        </div>
      )}

      {portal.id === 'doctor' && (
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 flex gap-2 items-start">
          <FaIcon icon="fa-user-doctor" className="mt-0.5 shrink-0 text-violet-600" />
          <span>
            <strong>Healthcare professionals only.</strong> This is not a patient account. Patients should{' '}
            <Link to="/patient/register" className="font-semibold underline">register here</Link>.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
        <RegistrationTermsAcceptance
          portal={portal}
          accepted={acceptedTerms}
          onChange={setAcceptedTerms}
          medicoAccepted={acceptedMedicoLegal}
          onMedicoChange={portal.requireMedicoLegal ? setAcceptedMedicoLegal : undefined}
        />

        {hasGoogleAuth() && (
          <div className={`mt-5 ${!termsOk ? 'opacity-50 pointer-events-none' : ''}`}>
            <GoogleSignInButton
              onSuccess={handleGoogle}
              onError={(err) => toast.error(err.message)}
              text="signup_with"
            />
            {googleLoading && (
              <p className="text-center text-sm text-slate-500 mt-2">Creating account with Google...</p>
            )}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or register with email</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input-field"
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
            <input
              className="input-field"
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />
          </div>
          <input
            type="email"
            className="input-field"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input-field"
            placeholder="Mobile number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          {portal.showSpecialization && (
            <input
              className="input-field"
              placeholder="Specialization (e.g. Sports Physiotherapy)"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          )}
          {portal.showClinicName && (
            <input
              className="input-field"
              placeholder="Clinic name"
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              required
            />
          )}
          <PasswordInput
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button type="submit" disabled={loading || !termsOk} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating account…' : portal.registerCta}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to={portal.loginPath} state={{ from: redirectTo }} className="font-semibold text-primary-600 hover:underline">
            {portal.loginCta}
          </Link>
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {portal.alternatePortals.map((alt) => {
          const altPortal = getAuthPortal(alt.portalId);
          if (!altPortal) return null;
          const isRegisterLink = alt.linkLabel.toLowerCase().includes('registration');
          return (
            <p key={alt.portalId} className="text-center text-sm text-slate-500">
              {alt.label}{' '}
              <Link
                to={isRegisterLink ? altPortal.registerPath : altPortal.loginPath}
                state={{ from: redirectTo }}
                className="font-semibold text-slate-700 hover:text-primary-600"
              >
                {alt.linkLabel}
              </Link>
            </p>
          );
        })}
      </div>
    </AuthPortalLayout>
  );
}
