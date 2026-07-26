import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasStoredToken, readStoredUser } from '../utils/authSession';
import { dashboardPath } from '../utils/authRedirect';

function loginPathForRoles(roles) {
  if (!roles || roles.length === 0) return '/login';
  if (roles.length === 1) {
    if (roles[0] === 'clinic' || roles[0] === 'clinic_staff') return '/clinic/login';
    if (roles[0] === 'doctor') return '/doctor/login';
    if (roles[0] === 'patient') return '/patient/login';
  }
  if (roles.every((r) => r === 'admin' || r === 'super_admin')) return '/login';
  return '/login';
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const sessionUser = user ?? readStoredUser();
  const authed = Boolean(hasStoredToken() && sessionUser);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authed) {
    return (
      <Navigate
        to={loginPathForRoles(roles)}
        replace
        state={{ from: location.pathname + location.search, reason: 'login_required' }}
      />
    );
  }
  if (roles && !roles.includes(sessionUser.role_slug)) {
    return <Navigate to={dashboardPath(sessionUser.role_slug)} replace />;
  }

  return children;
}
