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

export function navigateAfterAuth(navigate, user, redirectTo) {
  const canUseRedirect =
    redirectTo &&
    ['patient', 'doctor', 'clinic', 'clinic_staff', 'admin', 'super_admin'].includes(user.role_slug);
  if (canUseRedirect) {
    navigate(redirectTo, { replace: true });
  } else {
    navigate(dashboardPath(user.role_slug), { replace: true });
  }
}
