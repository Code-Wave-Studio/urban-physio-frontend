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
  const role = roleSlug === 'super_admin' ? 'admin' : roleSlug;

  if (APPOINTMENT_TYPES.has(type)) {
    const q = appointmentQuery(data);
    if (type.startsWith('emergency_')) {
      if (role === 'patient') return `/patient/appointments${q}`;
      if (role === 'doctor') return `/doctor/emergency${q}`;
      return `/admin/emergency${q}`;
    }
    if (role === 'patient') return `/patient/appointments${q}`;
    if (role === 'doctor') return `/doctor/appointments${q}`;
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

  if (type === 'user_registered') return '/admin/users';

  if (type === 'review_submitted') {
    if (role === 'doctor') return '/doctor';
    return '/admin/reviews';
  }

  if (type === 'contact_message') {
    const id = data.contact_message_id;
    return id ? `/admin/contact?tab=messages&msg=${id}` : '/admin/contact?tab=messages';
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
