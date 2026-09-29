import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientMustSetPassword } from '../utils/authRedirect';

/** Patients with an emailed temporary password must replace it before continuing. */
export default function ForceTempPasswordChange() {
  const { user } = useAuth();
  const location = useLocation();

  if (!patientMustSetPassword(user)) return null;

  const params = new URLSearchParams(location.search);
  const onSecurity =
    location.pathname === '/patient/profile' && params.get('tab') === 'security';
  if (onSecurity) return null;

  const next = `${location.pathname}${location.search}${location.hash}` || '/patient';
  return (
    <Navigate
      to="/patient/profile?tab=security&required=1"
      replace
      state={{ next }}
    />
  );
}
