import { Navigate, useSearchParams } from 'react-router-dom';
import AuthPortalPicker from './auth/AuthPortalPicker';

/** Legacy /login — redirects role query params or shows account-type picker */
export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const redirect = searchParams.get('redirect');
  const redirectState = redirect ? { from: decodeURIComponent(redirect) } : undefined;

  if (role === 'patient') {
    return <Navigate to="/patient/login" replace state={redirectState} />;
  }
  if (role === 'doctor') {
    return <Navigate to="/doctor/login" replace state={redirectState} />;
  }
  if (role === 'provider') {
    return <Navigate to="/doctor/login" replace state={redirectState} />;
  }

  return <AuthPortalPicker mode="login" />;
}
