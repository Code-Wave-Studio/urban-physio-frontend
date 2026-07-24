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
 * @param {{ portalId: 'patient' | 'doctor' | 'clinic' }} props
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
    owner_name: '',
    manager_name: '',
    address: '',
    pincode: '',
    gstin: '',
    pan: '',
    registration_number: '',
    clinic_type: 'Physiotherapy Clinic',
    website: '',
    emergency_contact: '',
  });

  if (!portal) return null;

  const termsOk = registrationTermsValid(portal, acceptedTerms, acceptedMedicoLegal);

  const buildPayload = () => ({
    ...form,
    role: portal.role,
    accepted_terms: true,
    registration_intent: portal.registrationIntent || portal.id,
    clinic_name: portal.showClinicName ? form.clinic_name.trim() : undefined,
    owner_name: portal.showClinicOrgFields
      ? form.owner_name.trim() || `${form.first_name} ${form.last_name}`.trim()
      : undefined,
    manager_name: portal.showClinicOrgFields ? form.manager_name.trim() || undefined : undefined,
    address: portal.showClinicOrgFields ? form.address.trim() || undefined : undefined,
    pincode: portal.showClinicOrgFields ? form.pincode.trim() || undefined : undefined,
    gstin: portal.showClinicOrgFields ? form.gstin.trim() || undefined : undefined,
    pan: portal.showClinicOrgFields ? form.pan.trim() || undefined : undefined,
    registration_number: portal.showClinicOrgFields
      ? form.registration_number.trim() || undefined
      : undefined,
    clinic_type: portal.showClinicOrgFields ? form.clinic_type.trim() || undefined : undefined,
    website: portal.showClinicOrgFields ? form.website.trim() || undefined : undefined,
    emergency_contact: portal.showClinicOrgFields
      ? form.emergency_contact.trim() || form.phone
      : undefined,
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
    if (portal.showClinicName && !form.clinic_name.trim()) {
      toast.error('Please enter your clinic name before continuing with Google');
      return;
    }
    if (portal.id === 'doctor' && !form.phone.trim()) {
      // phone optional for Google but helpful — don't block
    }
    setGoogleLoading(true);
    try {
      const extra = {
        accepted_terms: true,
        specialization: form.specialization.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      if (portal.showClinicName || portal.showClinicOrgFields) {
        Object.assign(extra, {
          clinic_name: form.clinic_name.trim() || undefined,
          owner_name:
            form.owner_name.trim() ||
            `${form.first_name} ${form.last_name}`.trim() ||
            undefined,
          manager_name: form.manager_name.trim() || undefined,
          address: form.address.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
          gstin: form.gstin.trim() || undefined,
          pan: form.pan.trim() || undefined,
          registration_number: form.registration_number.trim() || undefined,
          clinic_type: form.clinic_type.trim() || undefined,
          website: form.website.trim() || undefined,
          emergency_contact: form.emergency_contact.trim() || form.phone.trim() || undefined,
        });
      }
      const user = await googleLogin(credential, portal.role, extra);
      toast.success('Signed in with Google');
      navigateAfterAuth(navigate, user, redirectTo);
    } catch (err) {
      const hint = err?.errors?.login_hint || err?.errors?.role_slug;
      if (hint && typeof hint === 'string') {
        const portalPath =
          hint === 'doctor' ? '/doctor/login' : hint === 'clinic' ? '/clinic/login' : '/patient/login';
        toast.error(err.message || 'Account already exists');
        navigate(portalPath, { state: { from: redirectTo } });
      } else {
        toast.error(err.message || 'Google registration failed');
      }
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

      {portal.id === 'clinic' && (
        <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 flex gap-2 items-start">
          <FaIcon icon="fa-hospital" className="mt-0.5 shrink-0 text-teal-600" />
          <span>
            <strong>Clinic / centre accounts only.</strong> After registration, admin approval is required
            before your clinic goes live. Individual physiotherapists should{' '}
            <Link to="/doctor/register" className="font-semibold underline">
              register as doctors
            </Link>
            .
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

        {portal.showClinicName && (
          <div className="mt-4">
            <input
              className="input-field"
              placeholder="Clinic name *"
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Required for Google and email registration.
            </p>
          </div>
        )}

        {hasGoogleAuth() && (
          <div className="mt-5">
            {!termsOk && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Accept the legal agreement above to enable Google registration.
              </p>
            )}
            <div className={!termsOk ? 'opacity-50' : ''}>
              <GoogleSignInButton
                onSuccess={(credential) => {
                  if (!termsOk) {
                    toast.error('Please accept all required terms before continuing with Google');
                    return;
                  }
                  handleGoogle(credential);
                }}
                onError={(err) => toast.error(err?.message || 'Google sign-in failed')}
                text="signup_with"
              />
            </div>
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
              placeholder={
                portal.id === 'clinic'
                  ? 'Clinic focus (e.g. Sports rehab, Orthopedic physio)'
                  : 'Specialization (e.g. Sports Physiotherapy)'
              }
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          )}
          {portal.showClinicName && !hasGoogleAuth() && (
            <input
              className="input-field"
              placeholder="Clinic name *"
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              required
            />
          )}
          {portal.showClinicName && hasGoogleAuth() && (
            <input type="hidden" value={form.clinic_name} readOnly />
          )}
          {portal.showClinicOrgFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="Owner name"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Manager name"
                  value={form.manager_name}
                  onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                />
              </div>
              <input
                className="input-field"
                placeholder="Clinic address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="PIN code"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Clinic type"
                  value={form.clinic_type}
                  onChange={(e) => setForm({ ...form, clinic_type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="GSTIN (optional)"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="PAN (optional)"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value })}
                />
              </div>
              <input
                className="input-field"
                placeholder="Registration / license number"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="Website (optional)"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Emergency contact"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                />
              </div>
            </>
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
