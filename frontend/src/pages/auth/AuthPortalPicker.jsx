import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import FaIcon from '../../components/FaIcon';
import { AUTH_LOGIN_PORTAL_LIST, AUTH_PORTAL_LIST, AUTH_PORTALS } from '../../constants/authPortals';

/**
 * @param {{ mode: 'login' | 'register' }} props
 */
export default function AuthPortalPicker({ mode }) {
  const location = useLocation();
  const redirectTo = location.state?.from;
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25 mb-4">
            <FaIcon icon={isLogin ? 'fa-right-to-bracket' : 'fa-user-plus'} className="text-xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Choose how to sign in' : 'Create the right account'}
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            {isLogin
              ? 'Patients and doctors/clinic partners use separate sign-in pages.'
              : 'Doctors and clinics must not register as patients. Pick the account that matches you.'}
          </p>
        </div>

        <div className={`grid gap-4 md:gap-5 ${isLogin ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
          {(isLogin ? AUTH_LOGIN_PORTAL_LIST : AUTH_PORTAL_LIST).map((portalId) => {
            const portal = AUTH_PORTALS[portalId];
            const target = isLogin ? portal.loginPath : portal.registerPath;
            return (
              <Link
                key={portalId}
                to={target}
                state={{ from: redirectTo }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all text-left flex flex-col h-full"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.accent} text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform`}
                >
                  <FaIcon icon={portal.icon} />
                </div>
                <h2 className="font-bold text-lg text-slate-900 group-hover:text-primary-800 transition-colors">
                  {isLogin && portalId === 'doctor' ? 'Doctor & clinic' : portal.pickerTitle}
                </h2>
                <p className="text-sm text-slate-600 mt-2 flex-1 leading-relaxed">
                  {isLogin && portalId === 'doctor'
                    ? 'Sign in as a physiotherapist or clinic partner with one account.'
                    : portal.pickerDescription}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all">
                  {isLogin ? portal.loginCta : portal.registerCta}
                  <FaIcon icon="fa-arrow-right" className="text-xs" />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? (
            <>
              New to Urban Physio?{' '}
              <Link to="/register" state={{ from: redirectTo }} className="font-semibold text-primary-600 hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" state={{ from: redirectTo }} className="font-semibold text-primary-600 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
