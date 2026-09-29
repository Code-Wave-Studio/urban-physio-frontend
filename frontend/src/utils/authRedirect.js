export function dashboardPath(roleSlug) {
  const paths = {
    super_admin: '/admin',
    admin: '/admin',
    doctor: '/doctor',
    clinic: '/clinic-portal',
    clinic_staff: '/clinic-portal',
    patient: '/patient',
  };
  return paths[roleSlug] || '/';
}

export function patientMustSetPassword(user) {
  if (!user || user.role_slug !== 'patient') return false;
  if (user.auth_provider === 'google') return false;
  return Number(user.password_customized) === 0;
}

export function navigateAfterAuth(navigate, user, redirectTo) {
  const canUseRedirect =
    redirectTo &&
    ['patient', 'doctor', 'clinic', 'clinic_staff', 'admin', 'super_admin'].includes(user.role_slug);
  const next = canUseRedirect ? redirectTo : dashboardPath(user.role_slug);
  if (patientMustSetPassword(user)) {
    navigate('/patient/profile?tab=security&required=1', { replace: true, state: { next } });
    return;
  }
  navigate(next, { replace: true });
}
