import { Navigate, useSearchParams } from 'react-router-dom';
import AuthPortalPicker from './auth/AuthPortalPicker';

/** Legacy /register — redirects role query params or shows account-type picker */
export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'patient') {
    return <Navigate to="/patient/register" replace />;
  }
  if (role === 'doctor') {
    return <Navigate to="/doctor/register" replace />;
  }
  if (role === 'provider') {
    return <Navigate to="/doctor/register" replace />;
  }

  return <AuthPortalPicker mode="register" />;
}
