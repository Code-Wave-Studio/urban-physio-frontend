/** Build query string to deep-link an appointment list. */
export function appointmentQuery(data = {}) {
  const params = new URLSearchParams();
  if (data.appointment_id) params.set('appt', String(data.appointment_id));
  else if (data.booking_id) params.set('booking', String(data.booking_id));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

const APPOINTMENT_TYPES = new Set([
  'appointment_booked',
  'appointment_confirmed',
  'appointment_status',
  'appointment_completed',
  'appointment_cancelled',
  'appointment_reminder',
  'session_today',
  'appointment_missed',
  'payment_reminder',
  'followup_reminder',
  'payment_online',
  'payment_confirmed',
  'payment_refund',
  'emergency_requested',
  'emergency_confirmed',
  'emergency_assigned',
  'emergency_status',
]);

/**
 * Resolve portal-relative path for a notification click.
 * @param {{ type?: string, data?: object }} notification
 * @param {'patient'|'doctor'|'admin'|'super_admin'} roleSlug
 * @returns {string|null}
 */
export function getNotificationPath(notification, roleSlug) {
  const type = notification?.type || '';
  const data = notification?.data || {};
  let role = roleSlug === 'super_admin' ? 'admin' : roleSlug;
  if (role === 'clinic_staff') role = 'clinic';

  if (APPOINTMENT_TYPES.has(type)) {
    const q = appointmentQuery(data);
    if (type.startsWith('emergency_')) {
      if (role === 'patient') return `/patient/appointments${q}`;
      if (role === 'doctor') return `/doctor/emergency${q}`;
      return `/admin/emergency${q}`;
    }
    if (role === 'patient') return `/patient/appointments${q}`;
    if (role === 'doctor') return `/doctor/appointments${q}`;
    if (role === 'clinic') return `/clinic-portal/appointments${q}`;
    return `/admin/appointments${q}`;
  }

  if (type === 'appointment_request') {
    if (role === 'patient') {
      return `/patient/appointments${appointmentQuery(data)}`;
    }
    if (role === 'doctor') {
      if (data.request_type === 'doctor_change') {
        return `/doctor/appointments${appointmentQuery(data)}`;
      }
      return '/doctor/requests?status=pending';
    }
    if (data.request_type === 'doctor_change') {
      return '/admin/appointment-requests?status=pending';
    }
    return `/admin/appointments${appointmentQuery(data)}`;
  }

  if (type === 'clinic_pending' || type === 'clinic_approved' || type === 'clinic_rejected') {
    if (role === 'clinic') return '/clinic-portal/profile';
    if (role === 'doctor') return '/doctor/clinics';
    return '/admin/clinics';
  }

  if (type === 'clinic_join_request' || type === 'clinic_invite') {
    if (role === 'clinic') return '/clinic-portal/team';
    if (role === 'doctor') return '/doctor/clinics';
    return '/admin/clinics';
  }

  if (
    type === 'doctor_service_pending' ||
    type === 'doctor_service_approved' ||
    type === 'doctor_service_rejected'
  ) {
    if (role === 'doctor') return '/doctor/treatment-services';
    return '/admin/users';
  }

  if (type === 'doctor_verified') {
    if (role === 'doctor') return '/doctor/profile';
    return '/admin/users';
  }

  if (type === 'patient_report_uploaded') {
    if (role === 'patient') return '/patient/reports';
    if (role === 'doctor') return '/doctor/patients';
    return '/admin/users';
  }

  if (type === 'document_uploaded' || type === 'document_shared') {
    if (role === 'patient') return '/patient/documents';
    if (role === 'doctor') return '/doctor/documents';
    if (role === 'clinic') return '/clinic-portal/documents';
    return '/admin/documents';
  }

  if (type === 'consultation_chat' && data.appointment_id) {
    if (role === 'patient') return `/patient/consultation/${data.appointment_id}`;
    if (role === 'doctor') return `/doctor/consultation/${data.appointment_id}`;
    return `/doctor/consultation/${data.appointment_id}`;
  }

  if (type === 'user_registered') return '/admin/users';

  if (type === 'exercise_reminder' || type === 'exercise_assigned' || type === 'exercise_plan_updated' || type === 'exercise_missed') {
    if (role === 'patient') return '/patient/exercises';
    if (role === 'doctor') return '/doctor/prescriptions';
    if (role === 'clinic') return '/clinic-portal/exercises';
    return null;
  }

  if (type === 'package_expiry' || type === 'sessions_remaining' || type === 'weekly_summary') {
    if (role === 'patient') return '/patient/packages';
    if (role === 'clinic') return '/clinic-portal/packages';
    return '/admin/users';
  }

  if (type === 'review_submitted') {
    if (role === 'doctor') return '/doctor';
    return '/admin/reviews';
  }

  if (type === 'contact_message') {
    const id = data.contact_message_id;
    return id ? `/admin/contact?tab=messages&msg=${id}` : '/admin/contact?tab=messages';
  }

  if (type === 'career_application') {
    return '/admin/careers';
  }

  return null;

}

export function findAppointmentInList(list, { apptId, bookingId }) {
  if (!list?.length) return null;
  if (apptId) {
    return list.find((a) => String(a.id) === String(apptId)) || null;
  }
  if (bookingId) {
    return list.find((a) => a.booking_id === bookingId) || null;
  }
  return null;
}

export function scrollToAppointmentElement(apptId) {
  if (!apptId) return;
  requestAnimationFrame(() => {
    document.getElementById(`appt-${apptId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
