import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FaIcon from './FaIcon';

export default function PasswordSetupAlert({ profilePath }) {
  const { user } = useAuth();
  if (!user || user.password_customized) {
    return null;
  }

  const securityUrl = `${profilePath}?tab=security`;

  return (
    <div
      className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-950 shadow-sm"
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1">
        <span className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0">
          <FaIcon icon="fa-shield-halved" className="text-amber-800" />
        </span>
        <div>
          <p className="font-semibold text-sm">Set your password</p>
          <p className="text-sm text-amber-900/90 mt-0.5">
            Please set a secure password in your account settings. If you received a temporary password by
            email, replace it now so you can always sign in with email and password.
          </p>
        </div>
      </div>
      <Link to={securityUrl} className="btn-primary !py-2 text-sm shrink-0 text-center">
        Set password now
      </Link>
    </div>
  );
}
