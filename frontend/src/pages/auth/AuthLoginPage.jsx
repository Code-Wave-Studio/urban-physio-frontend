import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthPortalLayout from '../../components/auth/AuthPortalLayout';
import PhoneOtpLogin from '../../components/PhoneOtpLogin';
import AuthFallbackLogin from '../../components/AuthFallbackLogin';
import FaIcon from '../../components/FaIcon';
import { getAuthPortal } from '../../constants/authPortals';

/**
 * @param {{ portalId: 'patient' | 'doctor' | 'provider' }} props
 */
export default function AuthLoginPage({ portalId }) {
  const portal = getAuthPortal(portalId);
  const location = useLocation();
  const redirectTo = location.state?.from;
  const loginRequiredForBooking = redirectTo?.includes('/book');
  const { user, hasRole } = useAuth();

  if (!portal) return null;

  const dashboardTo =
    user && hasRole('doctor') ? '/doctor' : user && hasRole('admin', 'super_admin') ? '/admin' : portal.loginPath;

  return (
    <AuthPortalLayout portal={portal}>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{portal.loginTitle}</h1>
        <p className="text-sm text-slate-500 mt-2">{portal.loginSubtitle}</p>
      </div>

      {loginRequiredForBooking && (
        <div className="mb-6 rounded-xl bg-primary-50 border border-primary-200 px-4 py-3 text-sm text-primary-800 flex gap-2 items-start">
          <FaIcon icon="fa-calendar-check" className="mt-0.5 shrink-0 text-primary-600" />
          <span>Sign in to continue booking. You&apos;ll return to your appointment after login.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <PhoneOtpLogin fixedRole={portal.role} redirectTo={redirectTo} />

          <AuthFallbackLogin
            redirectTo={redirectTo}
            forgotPasswordRole={portal.forgotPasswordRole}
            forgotPasswordLoginPath={portal.loginPath}
          />

          <p className="mt-6 text-center text-sm text-slate-600">
            New {portal.pickerTitle.toLowerCase()}?{' '}
            <Link
              to={portal.registerPath}
              state={{ from: redirectTo }}
              className="font-semibold text-primary-600 hover:underline"
            >
              {portal.registerCta}
            </Link>
          </p>

          {portal.role === 'doctor' && user && hasRole('doctor', 'admin', 'super_admin') && (
            <p className="mt-3 text-center">
              <Link to={dashboardTo} className="text-sm font-medium text-slate-600 hover:text-primary-600 inline-flex items-center gap-1.5">
                <FaIcon icon="fa-gauge-high" className="text-xs" />
                Go to dashboard
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {portal.alternatePortals.map((alt) => {
          const altPortal = getAuthPortal(alt.portalId);
          if (!altPortal) return null;
          const isRegister = alt.linkMode === 'register';
          const linkTo = isRegister ? altPortal.registerPath : altPortal.loginPath;
          return (
            <p key={alt.portalId} className="text-center text-sm text-slate-500">
              {alt.label}{' '}
              <Link to={linkTo} state={{ from: redirectTo }} className="font-semibold text-slate-700 hover:text-primary-600">
                {alt.linkLabel}
              </Link>
            </p>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        OTP is sent via SMS or WhatsApp to your registered mobile only
      </p>
    </AuthPortalLayout>
  );
}
