import axios from 'axios';
import { LIVE_API_BASE, resolveApiBase, rewriteLegacyApiUrl } from '../constants/apiOrigin';

/* CodeWave Studio license guard — redundant, self-healing copy (do NOT remove).
 * Runs on module load and on every successful API response, so the developer
 * attribution marker is continuously restored if tampered with. */
function cwApiLicenseGuard() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const M = 'codewave-license-root-v1';
  try {
    const host = document.body || document.documentElement;
    if (host && !document.querySelector(`[data-codewave-license="${M}"]`)) {
      const p = document.createElement('p');
      p.setAttribute('data-codewave-license', M);
      p.setAttribute('aria-hidden', 'true');
      p.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:.01;pointer-events:none;';
      p.innerHTML =
        'Designed &amp; Developed by <a href="https://codewavestudio.space/" rel="noopener">CodeWave Studio</a>';
      host.appendChild(p);
    }
    if (!window.__cwLicenseWatch) {
      window.__cwLicenseWatch = 1;
      new MutationObserver(cwApiLicenseGuard).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.setInterval(cwApiLicenseGuard, 3000);
    }
  } catch {
    /* noop */
  }
}
cwApiLicenseGuard();

export const API_BASE = resolveApiBase() || LIVE_API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Belt-and-suspenders: never let a request leave toward the retired Hostinger host
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')?.trim();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (config.baseURL) {
    config.baseURL = rewriteLegacyApiUrl(config.baseURL);
  }
  if (typeof config.url === 'string' && /mediumorchid|hostingersite\.com/i.test(config.url)) {
    config.url = rewriteLegacyApiUrl(config.url);
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    cwApiLicenseGuard();
    return res.data;
  },
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong';
    const status = err.response?.status;
    // Do NOT clear the session here — one failing endpoint (notifications, etc.) was logging users out after login.
    return Promise.reject({
      message,
      errors: err.response?.data?.errors,
      status,
      code: err.code,
      // Preserve raw body for blob/export error parsing
      responseData: err.response?.data,
    });
  }
);

export default api;

export const auth = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  validateResetToken: (token) => api.get('/auth/reset-password/validate', { params: { token } }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  setPassword: (data) => api.post('/auth/set-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  phoneSendOtp: (data) => api.post('/auth/phone/send-otp', data),
  phoneVerifyOtp: (data) => api.post('/auth/phone/verify-otp', data),
  phoneResendOtp: (data) => api.post('/auth/phone/resend-otp', data),
};

export const location = {
  states: () => api.get('/location/states'),
  servedStates: () => api.get('/location/served-states'),
  cities: (stateId, servedOnly = false) =>
    api.get('/location/cities', {
      params: {
        ...(stateId != null && stateId !== '' ? { state_id: stateId } : {}),
        ...(servedOnly ? { served: '1' } : {}),
      },
    }),
  cityProviders: (cityId, lat, lng) =>
    api.get('/location/city-providers', {
      params: {
        city_id: cityId,
        ...(lat != null && lng != null ? { lat, lng } : {}),
      },
    }),
  detect: (lat, lng) => api.get('/location/detect', { params: { lat, lng } }),
  nearbyDoctors: (lat, lng, radius, cityId) =>
    api.get('/location/doctors', {
      params: { lat, lng, radius, ...(cityId ? { city_id: cityId } : {}) },
    }),
  cityBySlug: (slug) => api.get(`/location/city-by-slug/${encodeURIComponent(slug)}`),
  seoCities: () => api.get('/location/seo-cities'),
};

export const doctors = {
  list: (params) => api.get('/doctors', { params }),
  get: (idOrSlug) => api.get(`/doctors/${encodeURIComponent(String(idOrSlug))}`),
  getProfile: () => api.get('/doctors/profile'),
  updateProfile: (data) => api.put('/doctors/profile', data),
  getAvailability: () => api.get('/doctors/availability'),
  setAvailability: (slots) => api.post('/doctors/availability', { slots }),
  getServices: () => api.get('/doctors/services'),
  updateServices: (services) => api.post('/doctors/services', { services }),
  dashboard: () => api.get('/doctors/dashboard'),
  earnings: () => api.get('/doctors/earnings'),
  patients: () => api.get('/doctors/patients'),
  patientDetail: (patientId) => api.get(`/doctors/patients/${patientId}`),
  clinics: () => api.get('/doctors/clinics'),
  getClinic: (id) => api.get(`/doctors/clinics/${id}`),
  createClinic: (data) => api.post('/doctors/clinics', data),
  updateClinic: (id, data) => api.put(`/doctors/clinics/${id}`, data),
  clinicAvailability: (clinicId) => api.get(`/doctors/clinics/${clinicId}/availability`),
  setClinicAvailability: (clinicId, slots) => api.post(`/doctors/clinics/${clinicId}/availability`, { slots }),
  clinicNetworkSearch: (params) => api.get('/doctors/clinic-network/search', { params }),
  clinicJoinRequests: () => api.get('/doctors/clinic-network/join-requests'),
  clinicRequestJoin: (data) => api.post('/doctors/clinic-network/join-requests', data),
  clinicCancelJoinRequest: (id) => api.post(`/doctors/clinic-network/join-requests/${id}/cancel`),
  clinicInvites: () => api.get('/doctors/clinic-network/invites'),
  clinicRespondInvite: (token, accept) =>
    api.post(`/doctors/clinic-network/invites/${encodeURIComponent(token)}/respond`, { accept }),
  clinicLeave: (clinicId) => api.post('/doctors/clinic-network/leave', { clinic_id: clinicId }),
  emergencyAvailability: () => api.get('/doctors/emergency/availability'),
  setEmergencyAvailability: (data) => api.put('/doctors/emergency/availability', data),
  emergencyQueue: () => api.get('/doctors/emergency/queue'),
  acceptEmergency: (id) => api.post(`/doctors/emergency/${id}/accept`),
  rejectEmergency: (id) => api.post(`/doctors/emergency/${id}/reject`),
  updateEmergencyStatus: (id, emergency_status) => api.put(`/doctors/emergency/${id}/status`, { emergency_status }),
  bookingFilters: () => api.get('/doctors/booking-filters'),
  updateBookingFilters: (filter_ids) => api.put('/doctors/booking-filters', { filter_ids }),
  publicPackages: (doctorId) => api.get(`/doctors/${doctorId}/packages`),
  servicePackages: {
    list: () => api.get('/doctors/service-packages'),
    create: (data) => api.post('/doctors/service-packages', data),
    update: (id, data) => api.put(`/doctors/service-packages/${id}`, data),
    delete: (id) => api.delete(`/doctors/service-packages/${id}`),
  },
  adminPackagePrices: {
    list: () => api.get('/doctors/treatment-package-prices'),
    update: (packageId, data) => api.put(`/doctors/treatment-package-prices/${packageId}`, data),
  },
};

export const license = {
  show: () => api.get('/license'),
  verify: () => api.get('/license/verify'),
};

export const appointments = {
  book: (data) => api.post('/appointments', data),
  list: (params) => api.get('/appointments', { params }),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
  markOfflinePayment: (id) => api.post(`/appointments/${id}/mark-offline-payment`),
  cancelAwaitingPayment: (id) => api.post(`/appointments/${id}/cancel-awaiting-payment`),
};

export const booking = {
  options: () => api.get('/booking/options'),
  availableDates: (params) => api.get('/booking/available-dates', { params }),
  searchProviders: (params) => api.get('/booking/search-providers', { params }),
  doctorPackages: (doctorId, params) => api.get('/booking/doctor-packages', { params: { doctor_id: doctorId, ...params } }),
  onlineStates: (params) => api.get('/booking/online-states', { params }),
  slots: (doctorId, date, clinicId = null) =>
    api.get('/booking/slots', {
      params: {
        ...(doctorId ? { doctor_id: doctorId } : {}),
        ...(clinicId ? { clinic_id: clinicId } : {}),
        date,
      },
    }),
  slotsForClinic: (doctorId, clinicId, date) =>
    api.get('/booking/slots', { params: { doctor_id: doctorId, clinic_id: clinicId, date } }),
  clinicDoctors: (clinicId) => api.get(`/booking/clinic-doctors/${clinicId}`),
  doctorClinics: (doctorId) => api.get(`/booking/doctor-clinics/${doctorId}`),
};

export const uploadReport = (file) => {
  const form = new FormData();
  form.append('report', file);
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/report`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
};

export const patientReports = {
  list: () => api.get('/patient-reports'),
  byPatient: (patientId) => api.get(`/patient-reports/by-patient/${patientId}`),
  upload: (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_BASE}/patient-reports`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then((res) => res.data);
  },
  remove: (id) => api.delete(`/patient-reports/${id}`),
};

/** Document Management System */
function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeAxiosError(err) {
  const message = err?.response?.data?.message || err?.message || 'Something went wrong';
  return Promise.reject({ message, status: err?.response?.status });
}

export const documents = {
  categories: () => api.get('/documents/categories'),
  list: (params = {}) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (formData, onUploadProgress) =>
    axios
      .post(`${API_BASE}/documents`, formData, {
        headers: authHeaders({ 'Content-Type': 'multipart/form-data' }),
        onUploadProgress,
      })
      .then((res) => res.data)
      .catch(normalizeAxiosError),
  update: (id, payload) => api.put(`/documents/${id}`, payload),
  replace: (id, formData, onUploadProgress) =>
    axios
      .post(`${API_BASE}/documents/${id}/replace`, formData, {
        headers: authHeaders({ 'Content-Type': 'multipart/form-data' }),
        onUploadProgress,
      })
      .then((res) => res.data)
      .catch(normalizeAxiosError),
  versions: (id) => api.get(`/documents/${id}/versions`),
  activity: (id) => api.get(`/documents/${id}/activity`),
  archive: (id) => api.post(`/documents/${id}/archive`),
  restore: (id) => api.post(`/documents/${id}/restore`),
  remove: (id) => api.delete(`/documents/${id}`),
  share: (id, data) => api.post(`/documents/${id}/share`, data),
  shares: (id) => api.get(`/documents/${id}/shares`),
  unshare: (id, shareId) => api.delete(`/documents/${id}/shares/${shareId}`),
  downloadBlob: (id) =>
    axios
      .get(`${API_BASE}/documents/${id}/download`, { headers: authHeaders(), responseType: 'blob' })
      .then((res) => res.data)
      .catch(normalizeAxiosError),
  bulkDownloadBlob: (ids) =>
    axios
      .post(`${API_BASE}/documents/bulk-download`, { ids }, { headers: authHeaders(), responseType: 'blob' })
      .then((res) => res.data)
      .catch(normalizeAxiosError),
};

export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/avatar`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
};

export const uploadClinicLogo = (file, clinicId) => {
  const form = new FormData();
  form.append('logo', file);
  if (clinicId) form.append('clinic_id', String(clinicId));
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/clinic-logo`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
};

export const uploadClinicCover = (file, clinicId) => {
  const form = new FormData();
  form.append('cover', file);
  if (clinicId) form.append('clinic_id', String(clinicId));
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/clinic-cover`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
};

export const uploadClinicGallery = (file, clinicId) => {
  const form = new FormData();
  form.append('image', file);
  form.append('clinic_id', String(clinicId));
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/clinic-gallery`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
};

function cmsUpload(field, file) {
  const form = new FormData();
  form.append(field, file);
  const token = localStorage.getItem('token');
  return axios.post(`${API_BASE}/upload/cms-${field}`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((res) => res.data);
}

export const uploadCmsImage = (file) => cmsUpload('image', file);
export const uploadCmsAudio = (file) => cmsUpload('audio', file);
export const uploadCmsVideo = (file) => cmsUpload('video', file);

export const payments = {
  createOrder: (appointmentId, opts = {}) =>
    api.post('/payments/order', { appointment_id: appointmentId, use_wallet: opts.use_wallet !== false }),
  verify: (data) => api.post('/payments/verify', data),
  invoice: (appointmentId) => api.get(`/payments/${appointmentId}`),
};

export const supportTickets = {
  create: (data) => api.post('/support/tickets', data),
  list: (params) => api.get('/support/tickets', { params }),
  get: (id) => api.get(`/support/tickets/${id}`),
  updateStatus: (id, data) => api.put(`/support/tickets/${id}/status`, data),
  addNote: (id, data) => api.post(`/support/tickets/${id}/notes`, data),
  analytics: (params) => api.get('/support/analytics', { params }),
};

export const wallet = {
  balance: () => api.get('/wallet'),
  history: (params) => api.get('/wallet/history', { params }),
  analytics: () => api.get('/wallet/analytics'),
  splitPreview: (amount, useWallet = true) =>
    api.post('/wallet/split-preview', { amount, use_wallet: useWallet }),
  recharge: (amount) => api.post('/wallet/recharge', { amount }),
  verifyRecharge: (data) => api.post('/wallet/recharge-verify', data),
};

export const patients = {
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  listAddresses: () =>
    api.get('/patients/profile').then((res) => {
      const profile = res?.data ?? res;
      return { ...res, data: profile?.addresses ?? [] };
    }),
  createAddress: (data) => api.put('/patients/profile', { address_op: 'create', address_data: data }),
  updateAddress: (id, data) =>
    api.put('/patients/profile', { address_op: 'update', address_id: id, address_data: data }),
  deleteAddress: (id) => api.put('/patients/profile', { address_op: 'delete', address_id: id }),
  setPrimaryAddress: (id) => api.put('/patients/profile', { address_op: 'set_primary', address_id: id }),
  favouriteDoctors: () => api.get('/patients/favourite-doctors'),
  addFavouriteDoctor: (doctorId) => api.post(`/patients/favourite-doctors/${doctorId}`),
  removeFavouriteDoctor: (doctorId) => api.delete(`/patients/favourite-doctors/${doctorId}`),
  favouriteClinics: () => api.get('/patients/favourite-clinics'),
  addFavouriteClinic: (clinicId) => api.post(`/patients/favourite-clinics/${clinicId}`),
  removeFavouriteClinic: (clinicId) => api.delete(`/patients/favourite-clinics/${clinicId}`),
  preferredClinic: () => api.get('/patients/preferred-clinic'),
  updatePreferredClinic: (data) => api.put('/patients/preferred-clinic', data),
  clearPreferredClinic: () => api.delete('/patients/preferred-clinic'),
  savedExercises: () => api.get('/patients/saved-exercises'),
  addSavedExercise: (exerciseId) => api.post(`/patients/saved-exercises/${exerciseId}`),
  removeSavedExercise: (exerciseId) => api.delete(`/patients/saved-exercises/${exerciseId}`),
  saved: () => api.get('/patients/saved'),
  visitCredits: () => api.get('/patients/visit-credits'),
};

export const notifications = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (ids) => api.post('/notifications/read', { ids }),
  markAllRead: () => api.post('/notifications/read', { all: true }),
  markUnread: (ids) => api.post('/notifications/unread', { ids }),
  remove: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.post('/notifications/clear-read'),
  prefs: () => api.get('/notifications/preferences'),
  updatePrefs: (data) => api.put('/notifications/preferences', data),
};

export const notificationSettings = {
  get: () => api.get('/notification-settings'),
  update: (events) => api.put('/notification-settings', { events }),
  queue: (params) => api.get('/notification-settings/queue', { params }),
  run: () => api.post('/notification-settings/run'),
  retryFailed: () => api.post('/notification-settings/retry-failed'),
};

export const profileServices = {
  listDoctor: () => api.get('/doctors/profile-services'),
  createDoctor: (data) => api.post('/doctors/profile-services', data),
  updateDoctor: (id, data) => api.put(`/doctors/profile-services/${id}`, data),
  deleteDoctor: (id) => api.delete(`/doctors/profile-services/${id}`),
  listClinic: (clinicId) => api.get(`/doctors/clinics/${clinicId}/profile-services`),
  createClinic: (clinicId, data) => api.post(`/doctors/clinics/${clinicId}/profile-services`, data),
  updateClinic: (clinicId, id, data) => api.put(`/doctors/clinics/${clinicId}/profile-services/${id}`, data),
  deleteClinic: (clinicId, id) => api.delete(`/doctors/clinics/${clinicId}/profile-services/${id}`),
};

export const clinics = {
  list: (params) => api.get('/clinics', { params }),
  get: (id) => api.get(`/clinics/${id}`),
};

export const treatments = {
  list: (params) => api.get('/treatments', { params }),
  get: (slug) => api.get(`/treatments/${slug}`),
};

export const conditions = {
  list: (params) => api.get('/conditions', { params }),
  get: (slug) => api.get(`/conditions/${slug}`),
};

export const painSelection = {
  list: () => api.get('/pain-selection'),
};

export const emergency = {
  settings: () => api.get('/emergency/settings'),
  matchDoctors: (params) => api.get('/emergency/match-doctors', { params }),
  openClinics: (params) => api.get('/emergency/open-clinics', { params }),
  book: (data) => api.post('/emergency/book', data),
  status: (id) => api.get(`/emergency/status/${id}`),
};

export const admin = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  userDetail: (id) => api.get(`/admin/users/${id}`),
  verifyDoctor: (id, isVerified) => api.put(`/admin/verify-doctor/${id}`, { is_verified: isVerified }),
  approveDoctorServices: (doctorId, data = {}) =>
    api.put(`/admin/doctors/${doctorId}/services/approve`, data),
  rejectDoctorServices: (doctorId, data = {}) =>
    api.put(`/admin/doctors/${doctorId}/services/reject`, data),
  updateDoctorLocation: (doctorId, data) => api.put(`/admin/doctor-location/${doctorId}`, data),
  refund: (data) => api.post('/admin/refund', data),
  logs: () => api.get('/admin/logs'),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}`, { is_active: isActive }),
  clinics: (params) => api.get('/admin/clinics', { params }),
  clinicGet: (id) => api.get(`/admin/clinics/${id}`),
  clinicCreate: (data) => api.post('/admin/clinics', data),
  clinicUpdate: (id, data) => api.put(`/admin/clinics/${id}`, data),
  clinicDelete: (id) => api.delete(`/admin/clinics/${id}`),
  clinicApprove: (id) => api.put(`/admin/clinics/${id}/approve`, {}),
  clinicReject: (id, reason) => api.put(`/admin/clinics/${id}/reject`, { reason }),
  clinicDoctors: (id) => api.get(`/admin/clinics/${id}/doctors`),
  clinicAttachDoctor: (id, doctorId, isPrimary = 0) => api.post(`/admin/clinics/${id}/doctors`, { doctor_id: doctorId, is_primary: isPrimary }),
  clinicSetManager: (id, doctorId) => api.post(`/admin/clinics/${id}/doctors/manager`, { doctor_id: doctorId }),
  clinicClearManager: (id) => api.post(`/admin/clinics/${id}/doctors/manager`, { doctor_id: 0 }),
  clinicDetachDoctor: (id, doctorId) => api.delete(`/admin/clinics/${id}/doctors/${doctorId}`),
  clinicAccount: (id) => api.get(`/admin/clinics/${id}/account`),
  clinicCreateAccount: (id, data) => api.post(`/admin/clinics/${id}/account`, data),
  clinicUnlinkAccount: (id) => api.delete(`/admin/clinics/${id}/account`),
  clinicProfileServices: (clinicId) => api.get(`/admin/clinics/${clinicId}/profile-services`),
  createClinicProfileService: (clinicId, data) => api.post(`/admin/clinics/${clinicId}/profile-services`, data),
  updateClinicProfileService: (clinicId, serviceId, data) =>
    api.put(`/admin/clinics/${clinicId}/profile-services/${serviceId}`, data),
  deleteClinicProfileService: (clinicId, serviceId) =>
    api.delete(`/admin/clinics/${clinicId}/profile-services/${serviceId}`),
  updateDoctorRating: (doctorId, data) => api.put(`/admin/doctors/${doctorId}/rating`, data),
  updateClinicRating: (clinicId, data) => api.put(`/admin/clinics/${clinicId}/rating`, data),
  locationsOverview: () => api.get('/admin/locations'),
  locationsCities: (stateId) => api.get(`/admin/locations/states/${stateId}/cities`),
  locationCityUsers: (cityId) => api.get(`/admin/locations/cities/${cityId}/users`),
  createState: (data) => api.post('/admin/locations/states', data),
  updateState: (id, data) => api.put(`/admin/locations/states/${id}`, data),
  deleteState: (id) => api.delete(`/admin/locations/states/${id}`),
  createCity: (data) => api.post('/admin/locations/cities', data),
  updateCity: (id, data) => api.put(`/admin/locations/cities/${id}`, data),
  deleteCity: (id) => api.delete(`/admin/locations/cities/${id}`),
  conditionsList: (params) => api.get('/admin/conditions', { params }),
  conditionGet: (id) => api.get(`/admin/conditions/${id}`),
  conditionCreate: (data) => api.post('/admin/conditions', data),
  conditionUpdate: (id, data) => api.put(`/admin/conditions/${id}`, data),
  conditionDelete: (id, permanent = false) =>
    api.delete(`/admin/conditions/${id}`, { params: permanent ? { hard: '1' } : {} }),
  treatmentsList: (params) => api.get('/admin/treatments', { params }),
  treatmentGet: (id) => api.get(`/admin/treatments/${id}`),
  treatmentCreate: (data) => api.post('/admin/treatments', data),
  treatmentUpdate: (id, data) => api.put(`/admin/treatments/${id}`, data),
  treatmentDelete: (id, permanent = false) =>
    api.delete(`/admin/treatments/${id}`, { params: permanent ? { hard: '1' } : {} }),
  invoiceSettings: () => api.get('/admin/invoice-settings'),
  repairHtmlEntities: () => api.post('/admin/maintenance/fix-html-entities', {}),
  updateInvoiceSettings: (data) => api.put('/admin/invoice-settings', data),
  billingOverview: () => api.get('/admin/billing'),
  updateBillingControls: (data) => api.put('/admin/billing/controls', data),
  updateClinicBilling: (clinicId, data) => api.put(`/admin/billing/clinics/${clinicId}`, data),
  zoomStatus: () => api.get('/admin/zoom/status'),
  zoomMeetings: (params) => api.get('/admin/zoom/meetings', { params }),
  zoomLogs: () => api.get('/admin/zoom/logs'),
  zoomRegenerate: (appointmentId) => api.post(`/admin/zoom/meetings/${appointmentId}/regenerate`, {}),
  zoomCancel: (appointmentId) => api.post(`/admin/zoom/meetings/${appointmentId}/cancel`, {}),
  walletOverview: () => api.get('/admin/wallet'),
  walletSettings: () => api.get('/admin/wallet/settings'),
  updateWalletSettings: (data) => api.put('/admin/wallet/settings', data),
  walletLedger: (params) => api.get('/admin/wallet/ledger', { params }),
  walletCredit: (data) => api.post('/admin/wallet/credit', data),
  walletDebit: (data) => api.post('/admin/wallet/debit', data),
  walletSetStatus: (data) => api.post('/admin/wallet/status', data),
  walletRefund: (data) => api.post('/admin/wallet/refund', data),
  walletUser: (userId) => api.get(`/admin/wallet/users/${userId}`),
  seoDashboard: () => api.get('/admin/seo/dashboard'),
  seoSettings: () => api.get('/admin/seo/settings'),
  updateSeoSettings: (data) => api.put('/admin/seo/settings', data),
  seoPages: () => api.get('/admin/seo/pages'),
  seoPageGet: (id) => api.get(`/admin/seo/pages/${id}`),
  seoPageCreate: (data) => api.post('/admin/seo/pages', data),
  seoPageUpdate: (id, data) => api.put(`/admin/seo/pages/${id}`, data),
  seoPageDelete: (id) => api.delete(`/admin/seo/pages/${id}`),
  seoPageAutoGenerate: (id) => api.post(`/admin/seo/pages/${id}/auto-generate`),
  seoEntities: (params) => api.get('/admin/seo/entities', { params }),
  seoEntityGet: (id) => api.get(`/admin/seo/entities/${id}`),
  seoEntityUpdate: (id, data) => api.put(`/admin/seo/entities/${id}`, data),
  seoEntitiesSync: () => api.post('/admin/seo/entities/sync'),
  seoRedirects: () => api.get('/admin/seo/redirects'),
  seoRedirectCreate: (data) => api.post('/admin/seo/redirects', data),
  seoRedirectUpdate: (id, data) => api.put(`/admin/seo/redirects/${id}`, data),
  seoRedirectDelete: (id) => api.delete(`/admin/seo/redirects/${id}`),
  seo404Logs: (params) => api.get('/admin/seo/404-logs', { params }),
  seoClear404: (data) => api.post('/admin/seo/404-logs', data || {}),
  seoBrokenLinks: (params) => api.get('/admin/seo/broken-links', { params }),
  seoScanBrokenLinks: () => api.post('/admin/seo/broken-links/scan'),
  seoResolveBrokenLink: (id) => api.post(`/admin/seo/broken-links/${id}/resolve`),
  seoChecklist: () => api.get('/admin/seo/checklist'),
  seoSitemapStatus: () => api.get('/admin/seo/sitemap-status'),
  contactSettings: () => api.get('/admin/contact-settings'),
  updateContactSettings: (data) => api.put('/admin/contact-settings', data),
  aboutSettings: () => api.get('/admin/about-settings'),
  updateAboutSettings: (data) => api.put('/admin/about-settings', data),
  heroSettings: () => api.get('/admin/hero-settings'),
  updateHeroSettings: (data) => api.put('/admin/hero-settings', data),
  homeBannerSettings: () => api.get('/admin/home-banner-settings'),
  updateHomeBannerSettings: (data) => api.put('/admin/home-banner-settings', data),
  testimonialsSettings: () => api.get('/admin/testimonials-settings'),
  updateTestimonialsSettings: (data) => api.put('/admin/testimonials-settings', data),
  contactMessages: (params) => api.get('/admin/contact-messages', { params }),
  markContactMessageRead: (id) => api.post(`/admin/contact-messages/${id}/read`),
  deleteContactMessage: (id) => api.delete(`/admin/contact-messages/${id}`),
  bookingPainTypes: () => api.get('/admin/booking/pain-types'),
  createBookingPainType: (data) => api.post('/admin/booking/pain-types', data),
  updateBookingPainType: (id, data) => api.put(`/admin/booking/pain-types/${id}`, data),
  deleteBookingPainType: (id) => api.delete(`/admin/booking/pain-types/${id}`),
  bookingHomeConditions: () => api.get('/admin/booking/home-conditions'),
  createBookingHomeCondition: (data) => api.post('/admin/booking/home-conditions', data),
  updateBookingHomeCondition: (id, data) => api.put(`/admin/booking/home-conditions/${id}`, data),
  deleteBookingHomeCondition: (id) => api.delete(`/admin/booking/home-conditions/${id}`),
  bookingSettings: () => api.get('/admin/booking/settings'),
  updateBookingSettings: (data) => api.put('/admin/booking/settings', data),
  bookingSortFilters: () => api.get('/admin/booking/sort-filters'),
  createBookingSortFilter: (data) => api.post('/admin/booking/sort-filters', data),
  updateBookingSortFilter: (id, data) => api.put(`/admin/booking/sort-filters/${id}`, data),
  deleteBookingSortFilter: (id) => api.delete(`/admin/booking/sort-filters/${id}`),
  bookingSpecFilters: () => api.get('/admin/booking/specialization-filters'),
  createBookingSpecFilter: (data) => api.post('/admin/booking/specialization-filters', data),
  updateBookingSpecFilter: (id, data) => api.put(`/admin/booking/specialization-filters/${id}`, data),
  deleteBookingSpecFilter: (id) => api.delete(`/admin/booking/specialization-filters/${id}`),
  sessionTypesList: () => api.get('/admin/session-types'),
  createSessionType: (data) => api.post('/admin/session-types', data),
  updateSessionType: (id, data) => api.put(`/admin/session-types/${id}`, data),
  deleteSessionType: (id) => api.delete(`/admin/session-types/${id}`),
  painSelectionList: () => api.get('/admin/pain-selection'),
  painSelectionGet: (id) => api.get(`/admin/pain-selection/${id}`),
  painSelectionCreate: (data) => api.post('/admin/pain-selection', data),
  painSelectionUpdate: (id, data) => api.put(`/admin/pain-selection/${id}`, data),
  painSelectionDelete: (id, permanent = false) =>
    api.delete(`/admin/pain-selection/${id}`, { params: permanent ? { hard: '1' } : {} }),
  emergencyDashboard: () => api.get('/admin/emergency/dashboard'),
  emergencyRequests: () => api.get('/admin/emergency/requests'),
  emergencyAssign: (id, doctor_id) => api.post(`/admin/emergency/${id}/assign`, { doctor_id }),
  emergencyCancel: (id) => api.post(`/admin/emergency/${id}/cancel`),
  updateEmergencySettings: (data) => api.put('/admin/emergency/settings', data),
  treatmentPackagesList: (params) => api.get('/admin/treatment-packages', { params }),
  doctorPackagesList: (params) => api.get('/admin/doctor-packages', { params }),
  approveDoctorPackage: (id) => api.put(`/admin/doctor-packages/${id}/approve`),
  rejectDoctorPackage: (id, reason) => api.put(`/admin/doctor-packages/${id}/reject`, { reason }),
  updateDoctorPackage: (id, data) => api.put(`/admin/doctor-packages/${id}`, data),
  deleteDoctorPackage: (id) => api.delete(`/admin/doctor-packages/${id}`),
  treatmentPackageGet: (id) => api.get(`/admin/treatment-packages/${id}`),
  treatmentPackageCreate: (data) => api.post('/admin/treatment-packages', data),
  treatmentPackageUpdate: (id, data) => api.put(`/admin/treatment-packages/${id}`, data),
  treatmentPackageDelete: (id) => api.delete(`/admin/treatment-packages/${id}`),
  exercisesList: (params) => api.get('/admin/exercises', { params }),
  exerciseGet: (id) => api.get(`/admin/exercises/${id}`),
  exerciseCreate: (data) => api.post('/admin/exercises', data),
  exerciseUpdate: (id, data) => api.put(`/admin/exercises/${id}`, data),
  exerciseDelete: (id) => api.delete(`/admin/exercises/${id}`),
  physioFeedList: (params) => api.get('/admin/physiofeed', { params }),
  physioFeedGet: (id) => api.get(`/admin/physiofeed/${id}`),
  physioFeedCreate: (data) => api.post('/admin/physiofeed', data),
  physioFeedUpdate: (id, data) => api.put(`/admin/physiofeed/${id}`, data),
  physioFeedDelete: (id) => api.delete(`/admin/physiofeed/${id}`),
  physioFeedPublishScheduled: () => api.post('/admin/physiofeed/publish-scheduled', {}),
  badgesList: () => api.get('/admin/badges'),
  badgeCreate: (data) => api.post('/admin/badges', data),
  badgeUpdate: (id, data) => api.put(`/admin/badges/${id}`, data),
  badgeDelete: (id) => api.delete(`/admin/badges/${id}`),
  badgeAssignDoctor: (data) => api.post('/admin/badges/assign-doctor', data),
  badgeRevokeDoctor: (data) => api.post('/admin/badges/revoke-doctor', data),
  badgeAssignClinic: (data) => api.post('/admin/badges/assign-clinic', data),
  badgeRevokeClinic: (data) => api.post('/admin/badges/revoke-clinic', data),
  couponsList: (params) => api.get('/admin/coupons', { params }),
  couponCreate: (data) => api.post('/admin/coupons', data),
  couponUpdate: (id, data) => api.put(`/admin/coupons/${id}`, data),
  couponDelete: (id) => api.delete(`/admin/coupons/${id}`),
  couponRedemptions: (id) => api.get(`/admin/coupons/${id}/redemptions`),
  analyticsOverview: () => api.get('/admin/analytics'),
  analyticsReports: (params) => api.get('/admin/analytics/reports', { params }),
  analyticsExportUrl: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `/admin/analytics/export${q ? `?${q}` : ''}`;
  },
  doctorReviewsList: (params) => api.get('/admin/reviews/doctors', { params }),
  clinicReviewsList: (params) => api.get('/admin/reviews/clinics', { params }),
  moderateDoctorReview: (id, data) => api.put(`/admin/reviews/doctor/${id}`, data),
  moderateClinicReview: (id, data) => api.put(`/admin/reviews/clinic/${id}`, data),
  deleteDoctorReview: (id) => api.delete(`/admin/reviews/doctor/${id}`),
  deleteClinicReview: (id) => api.delete(`/admin/reviews/clinic/${id}`),
};

export const contact = {
  settings: () => api.get('/contact/settings'),
  sendMessage: (data) => api.post('/contact/message', data),
};

export const seo = {
  config: () => api.get('/seo/config'),
  pageMeta: (path) => api.get('/seo/page-meta', { params: { path } }),
  resolveRedirect: (path) => api.get('/seo/resolve-redirect', { params: { path } }),
  log404: (data) => api.post('/seo/log-404', data),
};

export const careers = {
  apply: (data) => api.post('/careers/apply', data),
  applications: (params = {}) => api.get('/careers/applications', { params }),
  updateStatus: (id, status) => api.put(`/careers/applications/${id}/status`, { status }),
};


export const clinicPortal = {
  me: () => api.get('/clinic-portal/me'),
  switchMode: (data) => api.post('/clinic-portal/switch-mode', data),
  adminPasswordStatus: () => api.get('/clinic-portal/admin-password'),
  updateAdminPassword: (data) => api.put('/clinic-portal/admin-password', data),
  resetAdminPasswordToAccount: (data) => api.post('/clinic-portal/admin-password/use-account', data),
  sendAdminPasswordOtp: () => api.post('/clinic-portal/admin-password/send-otp'),
  resetAdminPasswordWithOtp: (data) => api.post('/clinic-portal/admin-password/reset', data),
  updateProfile: (data) => api.put('/clinic-portal/profile', data),
  myClinics: () => api.get('/clinic-portal/clinics'),
  overview: (clinicId) => api.get(`/clinic-portal/${clinicId}/overview`),
  adminAnalytics: (clinicId) => api.get(`/clinic-portal/${clinicId}/admin-analytics`),
  receptionDashboard: (clinicId) => api.get(`/clinic-portal/${clinicId}/reception-dashboard`),
  appointments: (clinicId, params) => api.get(`/clinic-portal/${clinicId}/appointments`, { params }),
  updateAppointment: (clinicId, apptId, data) =>
    api.patch(`/clinic-portal/${clinicId}/appointments/${apptId}`, data),
  collectPayment: (clinicId, apptId, data) =>
    api.post(`/clinic-portal/${clinicId}/appointments/${apptId}/collect-payment`, data),
  billingOverview: (clinicId) => api.get(`/clinic-portal/${clinicId}/billing/overview`),
  billingPayments: (clinicId, params) => api.get(`/clinic-portal/${clinicId}/billing/payments`, { params }),
  billingPending: (clinicId) => api.get(`/clinic-portal/${clinicId}/billing/pending`),
  billingPackages: (clinicId) => api.get(`/clinic-portal/${clinicId}/billing/packages`),
  billingInvoices: (clinicId, params) => api.get(`/clinic-portal/${clinicId}/billing/invoices`, { params }),
  billingSettings: (clinicId) => api.get(`/clinic-portal/${clinicId}/billing/settings`),
  updateBillingSettings: (clinicId, data) => api.put(`/clinic-portal/${clinicId}/billing/settings`, data),
  billingCollect: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/billing/collect`, data),
  billingRefund: (clinicId, paymentId, data) =>
    api.post(`/clinic-portal/${clinicId}/billing/payments/${paymentId}/refund`, data),
  billingReceipt: (clinicId, paymentId) =>
    api.get(`/clinic-portal/${clinicId}/billing/receipts/${paymentId}`),
  patients: (clinicId, params) => api.get(`/clinic-portal/${clinicId}/patients`, { params }),
  mergePatients: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/patients/merge`, data),
  patientReminders: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/patients/reminders`, { params }),
  createPatientReminder: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/patients/reminders`, data),
  updatePatientReminder: (clinicId, reminderId, data) =>
    api.patch(`/clinic-portal/${clinicId}/patients/reminders/${reminderId}`, data),
  earnings: (clinicId) => api.get(`/clinic-portal/${clinicId}/earnings`),
  doctors: (clinicId) => api.get(`/clinic-portal/${clinicId}/doctors`),
  inviteDoctor: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/invites`, data),
  removeDoctor: (clinicId, doctorId) => api.delete(`/clinic-portal/${clinicId}/doctors/${doctorId}`),
  joinRequests: (clinicId) => api.get(`/clinic-portal/${clinicId}/join-requests`),
  decideJoinRequest: (clinicId, requestId, data) =>
    api.post(`/clinic-portal/${clinicId}/join-requests/${requestId}/decide`, data),
  listStaff: (clinicId) => api.get(`/clinic-portal/${clinicId}/staff`),
  createStaff: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/staff`, data),
  updateStaff: (clinicId, staffId, data) => api.put(`/clinic-portal/${clinicId}/staff/${staffId}`, data),
  removeStaff: (clinicId, staffId) => api.delete(`/clinic-portal/${clinicId}/staff/${staffId}`),
  profileServices: (clinicId) => api.get(`/clinic-portal/${clinicId}/profile-services`),
  createProfileService: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/profile-services`, data),
  updateProfileService: (clinicId, serviceId, data) =>
    api.put(`/clinic-portal/${clinicId}/profile-services/${serviceId}`, data),
  deleteProfileService: (clinicId, serviceId) =>
    api.delete(`/clinic-portal/${clinicId}/profile-services/${serviceId}`),
  bulkInvitePatients: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/bulk-invite-patients`, data),
  bulkInviteDoctors: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/bulk-invite-doctors`, data),
  createOfflinePatient: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/offline-patients`, data),
  resendOfflinePatientInvite: (clinicId, clinicPatientId) =>
    api.post(`/clinic-portal/${clinicId}/offline-patients/${clinicPatientId}/resend-invite`),

  // —— Feature Request ops ——
  qrInfo: (clinicId) => api.get(`/clinic-portal/${clinicId}/qr`),
  qrRegenerate: (clinicId) => api.post(`/clinic-portal/${clinicId}/qr/regenerate`),
  registrationFields: (clinicId) => api.get(`/clinic-portal/${clinicId}/registration-fields`),
  saveRegistrationFields: (clinicId, data) => api.put(`/clinic-portal/${clinicId}/registration-fields`, data),
  createRegistrationField: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/registration-fields`, data),
  deleteRegistrationField: (clinicId, fieldId) =>
    api.delete(`/clinic-portal/${clinicId}/registration-fields/${fieldId}`),
  assessmentTemplates: (clinicId) => api.get(`/clinic-portal/${clinicId}/assessment-templates`),
  saveAssessmentTemplate: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/assessment-templates`, data),
  updateAssessmentTemplate: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/assessment-templates/${id}`, data),
  submitAssessment: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/assessments`, data),
  patientDetail: (clinicId, patientKey) =>
    api.get(`/clinic-portal/${clinicId}/patients/detail/${patientKey}`),
  patientAssessments: (clinicId, patientKey) =>
    api.get(`/clinic-portal/${clinicId}/patients/${patientKey}/assessments`),
  createBooking: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/bookings`, data),
  checkIn: (clinicId, apptId, data = {}) =>
    api.post(`/clinic-portal/${clinicId}/appointments/${apptId}/check-in`, data),
  changeSessionMode: (clinicId, apptId, data) =>
    api.post(`/clinic-portal/${clinicId}/appointments/${apptId}/change-mode`, data),
  cancelWithRollover: (clinicId, apptId, data = {}) =>
    api.post(`/clinic-portal/${clinicId}/appointments/${apptId}/cancel-rollover`, data),
  updateAttribution: (clinicId, apptId, data) =>
    api.patch(`/clinic-portal/${clinicId}/appointments/${apptId}/attribution`, data),
  generateMeeting: (clinicId, apptId, data) =>
    api.post(`/clinic-portal/${clinicId}/appointments/${apptId}/meeting`, data),
  getSoap: (clinicId, apptId) => api.get(`/clinic-portal/${clinicId}/appointments/${apptId}/soap`),
  saveSoap: (clinicId, apptId, data) =>
    api.put(`/clinic-portal/${clinicId}/appointments/${apptId}/soap`, data),
  queueToday: (clinicId) => api.get(`/clinic-portal/${clinicId}/queue`),
  packageTemplates: (clinicId) => api.get(`/clinic-portal/${clinicId}/package-templates`),
  createPackageTemplate: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/package-templates`, data),
  updatePackageTemplate: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/package-templates/${id}`, data),
  deletePackageTemplate: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/package-templates/${id}`),
  terminatePackage: (clinicId, packageId, data = {}) =>
    api.post(`/clinic-portal/${clinicId}/packages/${packageId}/terminate`, data),
  assignPackageTemplate: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/packages/assign`, data),
  // Advanced Package Management
  packagesList: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/packages/list`, { params }),
  packageDetail: (clinicId, pkgId) =>
    api.get(`/clinic-portal/${clinicId}/packages/${pkgId}/detail`),
  packagePatientSearch: (clinicId, q) =>
    api.get(`/clinic-portal/${clinicId}/packages/patient-search`, { params: { q } }),
  patientSearch: (clinicId, q) =>
    api.get(`/clinic-portal/${clinicId}/packages/patient-search`, { params: { q } }),
  createCustomBulk: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/packages/create-custom`, data),
  returnCredit: (clinicId, pkgId) =>
    api.post(`/clinic-portal/${clinicId}/packages/${pkgId}/return-credit`, {}),
  completeSession: (clinicId, pkgId, data = {}) =>
    api.post(`/clinic-portal/${clinicId}/packages/${pkgId}/complete-session`, data),
  serviceTypes: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/service-types`),
  // Booking Engine
  bookingBootstrap: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/booking-engine/bootstrap`),
  bookingCapacitySlots: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/booking-engine/slots`, { params }),
  bookingServices: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/booking-engine/services`),
  // Notes
  notesList: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/notes`, { params }),
  notesGet: (clinicId, id) =>
    api.get(`/clinic-portal/${clinicId}/notes/${id}`),
  notesCreate: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/notes`, data),
  notesUpdate: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/notes/${id}`, data),
  notesDelete: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/notes/${id}`),
  notesFolders: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/notes/folders`),
  notesCreateFolder: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/notes/folders`, data),
  notesUpdateFolder: (clinicId, folderId, data) =>
    api.put(`/clinic-portal/${clinicId}/notes/folders/${folderId}`, data),
  notesDeleteFolder: (clinicId, folderId) =>
    api.delete(`/clinic-portal/${clinicId}/notes/folders/${folderId}`),
  // Advanced Invoices
  invoicesList: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/invoices`, { params }),
  invoicesGet: (clinicId, id) =>
    api.get(`/clinic-portal/${clinicId}/invoices/${id}`),
  invoicesCreate: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/invoices`, data),
  invoicesFromSource: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/invoices/from-source`, { params }),
  invoicesSettings: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/invoices/settings`),
  invoicesSaveSettings: (clinicId, data) =>
    api.put(`/clinic-portal/${clinicId}/invoices/settings`, data),
  invoicesPay: (clinicId, id, data) =>
    api.post(`/clinic-portal/${clinicId}/invoices/${id}/pay`, data),
  invoicesFinalizeShare: (clinicId, id) =>
    api.post(`/clinic-portal/${clinicId}/invoices/${id}/finalize-share`),
  clinicalLibrary: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/clinical-library`, { params }),
  createLibraryEntry: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/clinical-library`, data),
  updateLibraryEntry: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/clinical-library/${id}`, data),
  deleteLibraryEntry: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/clinical-library/${id}`),
  notificationTemplates: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/notification-templates`, { params }),
  createNotificationTemplate: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/notification-templates`, data),
  saveNotificationTemplate: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/notification-templates/${id}`, data),
  duplicateNotificationTemplate: (clinicId, id) =>
    api.post(`/clinic-portal/${clinicId}/notification-templates/${id}/duplicate`),
  notificationTemplateVersions: (clinicId, id) =>
    api.get(`/clinic-portal/${clinicId}/notification-templates/${id}/versions`),
  notificationCampaigns: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/notification-campaigns`),
  listCampaigns: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/notification-campaigns`),
  createCampaign: (clinicId, data, config = {}) =>
    api.post(`/clinic-portal/${clinicId}/notification-campaigns`, data, config),
  sendCampaign: (clinicId, id, config = {}) =>
    api.post(`/clinic-portal/${clinicId}/notification-campaigns/${id}/send`, {}, config),
  // Smart Communication Engine
  commDashboard: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/communication/dashboard`),
  commAnalytics: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/communication/analytics`, { params }),
  commHistory: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/communication/history`, { params }),
  commAudiencePreview: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/communication/audience-preview`, { params }),
  commProviders: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/communication/providers`),
  commSaveProvider: (clinicId, data) =>
    api.put(`/clinic-portal/${clinicId}/communication/providers`, data),
  commSyncWhatsAppTemplates: (clinicId) =>
    api.post(`/clinic-portal/${clinicId}/communication/sync-whatsapp-templates`),
  patientCommunicationLog: (clinicId, patientKey, params) =>
    api.get(`/clinic-portal/${clinicId}/patients/${patientKey}/communication-log`, { params }),
  markPatientCommRead: (clinicId, patientKey) =>
    api.post(`/clinic-portal/${clinicId}/patients/${patientKey}/communication-log/read`),
  doctorAvailability: (clinicId) => api.get(`/clinic-portal/${clinicId}/doctor-availability`),
  setDoctorAvailability: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/doctor-availability`, data),
  setClinicClosure: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/closure`, data),
  payouts: (clinicId) => api.get(`/clinic-portal/${clinicId}/payouts`),
  savePayout: (clinicId, data) => api.put(`/clinic-portal/${clinicId}/payouts`, data),
  payoutReport: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/payout-report`, { params }),
  getBranding: (clinicId) => api.get(`/clinic-portal/${clinicId}/branding`),
  saveBranding: (clinicId, data) => api.put(`/clinic-portal/${clinicId}/branding`, data),
  getModePrices: (clinicId) => api.get(`/clinic-portal/${clinicId}/mode-prices`),
  saveModePrices: (clinicId, data) => api.put(`/clinic-portal/${clinicId}/mode-prices`, data),
  financeCredits: (clinicId) => api.get(`/clinic-portal/${clinicId}/finance/credits`),
  createFinanceCredit: (clinicId, data) => api.post(`/clinic-portal/${clinicId}/finance/credits`, data),
  exportReports: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/reports/export`, {
      params,
      responseType: 'blob',
    }),
  progressReports: (clinicId) => api.get(`/clinic-portal/${clinicId}/progress-reports`),
  createProgressReport: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/progress-reports`, data),
  liveEvents: (clinicId, params) => api.get(`/clinic-portal/${clinicId}/live/events`, { params }),
  // Exercise & Rehab (HEP)
  hepDashboard: (clinicId) => api.get(`/clinic-portal/${clinicId}/hep/dashboard`),
  hepAnalytics: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/hep/analytics`, { params }),
  hepLibrary: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/hep/library`, { params }),
  hepCreateExercise: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/hep/library`, data),
  hepUpdateExercise: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/hep/library/${id}`, data),
  hepArchiveExercise: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/hep/library/${id}`),
  hepMedia: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/hep/media`, { params }),
  hepRegisterMedia: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/hep/media`, data),
  // Back Office Management
  boDashboard: (clinicId) => api.get(`/clinic-portal/${clinicId}/back-office/dashboard`),
  boAnalytics: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/analytics`, { params }),
  boProfitLoss: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/profit-loss`, { params }),
  boInventory: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/inventory`, { params }),
  boCreateInventory: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/inventory`, data),
  boUpdateInventory: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/back-office/inventory/${id}`, data),
  boArchiveInventory: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/back-office/inventory/${id}`),
  boCategories: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/back-office/categories`),
  boCreateCategory: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/categories`, data),
  boSuppliers: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/back-office/suppliers`),
  boCreateSupplier: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/suppliers`, data),
  boPurchaseOrders: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/purchase-orders`, { params }),
  boGetPurchaseOrder: (clinicId, id) =>
    api.get(`/clinic-portal/${clinicId}/back-office/purchase-orders/${id}`),
  boCreatePurchaseOrder: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/purchase-orders`, data),
  boUpdatePurchaseOrderStatus: (clinicId, id, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/purchase-orders/${id}/status`, data),
  boExpenses: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/expenses`, { params }),
  boCreateExpense: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/expenses`, data),
  boUpdateExpense: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/back-office/expenses/${id}`, data),
  boEquipment: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/back-office/equipment`),
  boCreateEquipment: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/equipment`, data),
  boUpdateEquipment: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/back-office/equipment/${id}`, data),
  boTasks: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/back-office/tasks`),
  boCreateTask: (clinicId, data) =>
    api.post(`/clinic-portal/${clinicId}/back-office/tasks`, data),
  boUpdateTask: (clinicId, id, data) =>
    api.put(`/clinic-portal/${clinicId}/back-office/tasks/${id}`, data),
  boDeleteTask: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/back-office/tasks/${id}`),
  boExport: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/back-office/export`, { params }),
  // Reputation & Reviews
  reputationOverview: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/reputation/overview`),
  reputationReviews: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/reputation/reviews`, { params }),
  reputationReply: (clinicId, id, data) =>
    api.post(`/clinic-portal/${clinicId}/reputation/reviews/${id}/reply`, data),
  reputationDeleteReply: (clinicId, id) =>
    api.delete(`/clinic-portal/${clinicId}/reputation/reviews/${id}/reply`),
  reputationModerate: (clinicId, id, data) =>
    api.post(`/clinic-portal/${clinicId}/reputation/reviews/${id}/moderate`, data),
  reputationSuggestions: (clinicId, id) =>
    api.get(`/clinic-portal/${clinicId}/reputation/reviews/${id}/suggestions`),
  reputationSettings: (clinicId) =>
    api.get(`/clinic-portal/${clinicId}/reputation/settings`),
  reputationSaveSettings: (clinicId, data) =>
    api.put(`/clinic-portal/${clinicId}/reputation/settings`, data),
  // AI-Driven Analytics & Reports Center
  aiDash: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/dashboard`, { params }),
  aiInsights: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/insights`, { params }),
  aiFinancial: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/financial`, { params }),
  aiAppointments: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/appointments`, { params }),
  aiPatients: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/patients`, { params }),
  aiClinical: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/clinical`, { params }),
  aiCommunication: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/communication`, { params }),
  aiStaff: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/staff`, { params }),
  aiBranches: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/branches`, { params }),
  aiExport: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/export`, { params }),
  aiGetLayout: (clinicId, params) =>
    api.get(`/clinic-portal/${clinicId}/ai-analytics/layout`, { params }),
  aiSaveLayout: (clinicId, data) =>
    api.put(`/clinic-portal/${clinicId}/ai-analytics/layout`, data),
};

export const clinicQr = {
  resolve: (token) => api.get('/clinic-qr/resolve', { params: { token } }),
  sendOtp: (data) => api.post('/clinic-qr/send-otp', data),
  register: (data) => api.post('/clinic-qr/register', data),
  google: (data) => api.post('/clinic-qr/google', data),
  bind: (data) => api.post('/clinic-qr/bind', data),
  progress: (token) => api.get('/clinic-qr/progress', { params: { token } }),
};

export const about = {
  settings: () => api.get('/about/settings'),
};

export const home = {
  heroSettings: () => api.get('/home/hero-settings'),
  bannerSettings: () => api.get('/home/banner-settings'),
  testimonials: () => api.get('/home/testimonials'),
};

export const reviews = {
  list: (params) => api.get('/reviews', { params }),
  create: (data) => api.post('/reviews', data),
};

export const clinicReviews = {
  list: (params) => api.get('/clinic-reviews', { params }),
  create: (data) => api.post('/clinic-reviews', data),
};

export const coupons = {
  validate: (data) => api.post('/coupons/validate', data),
};

export const physioFeed = {
  list: (params) => api.get('/physiofeed', { params }),
  get: (slug) => api.get(`/physiofeed/${slug}`),
};

export const sessionTypes = () => api.get('/session-types');

const SEARCH_TIMEOUT_MS = 20000;

export const search = {
  universal: (params, config = {}) =>
    api.get('/search', { params, timeout: SEARCH_TIMEOUT_MS, ...config }),
  suggest: (params, config = {}) =>
    api.get('/search/suggest', { params, timeout: 15000, ...config }),
  trackClick: (data) => api.post('/search/track', data),
};

/** Advanced Patient Search — role-scoped (admin / doctor / clinic admin / receptionist) */
export const patientSearch = {
  run: (params, config = {}) =>
    api.get('/search/patients', { params, timeout: SEARCH_TIMEOUT_MS, ...config }),
  filters: () => api.get('/search/filters'),
  addTag: (data) => api.post('/search/tags', data),
  removeTag: (data) => api.delete('/search/tags', { data }),
};

/** Live Online Consultation Room */
export const consultation = {
  room: (appointmentId) => api.get(`/consultation/${appointmentId}`),
  exerciseDetail: (appointmentId, prescriptionId) =>
    api.get(`/consultation/${appointmentId}/exercise/${prescriptionId}`),
  completeSession: (appointmentId) =>
    api.post(`/consultation/${appointmentId}/complete-session`, {}),
  chatPoll: (appointmentId, params) =>
    api.get(`/consultation/${appointmentId}/chat`, { params }),
  chatSend: (appointmentId, data) =>
    api.post(`/consultation/${appointmentId}/chat`, data),
  chatSendFile: (appointmentId, formData) =>
    api.post(`/consultation/${appointmentId}/chat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  chatTyping: (appointmentId, typing) =>
    api.post(`/consultation/${appointmentId}/chat/typing`, { typing: Boolean(typing) }),
  chatRead: (appointmentId, messageId) =>
    api.post(`/consultation/${appointmentId}/chat/read`, { message_id: messageId || 0 }),
  chatDelete: (appointmentId, messageId) =>
    api.delete(`/consultation/${appointmentId}/chat/${messageId}`),
};

/** Public magic payment links for clinic invoices (no auth) */
export const publicInvoicePay = {
  info: (token) => api.get(`/public/invoice-pay/${token}`),
  order: (token) => api.post(`/public/invoice-pay/${token}/order`, {}),
};

/** Patient Portal — dashboard aggregates (bills, progress, prescriptions, video) */
export const patientPortal = {
  dashboard: () => api.get('/patient-portal/dashboard'),
  bills: () => api.get('/patient-portal/bills'),
  progress: () => api.get('/patient-portal/progress'),
  prescriptions: () => api.get('/patient-portal/prescriptions'),
  videoConsultations: () => api.get('/patient-portal/video-consultations'),
  changeSessionMode: (appointmentId, data) =>
    api.post(`/patient-portal/appointments/${appointmentId}/session-mode`, data),
  liveEvents: (params) => api.get('/patient-portal/live/events', { params }),
};

/** Doctor Calendar — schedule, appointments, rooms, holidays, leave */
export const calendar = {
  feed: (params) => api.get('/calendar/feed', { params }),
  doctors: () => api.get('/calendar/doctors'),
  clinics: () => api.get('/calendar/clinics'),
  createLeave: (data) => api.post('/calendar/leaves', data),
  deleteLeave: (id) => api.delete(`/calendar/leaves/${id}`),
  createHoliday: (data) => api.post('/calendar/holidays', data),
  deleteHoliday: (id) => api.delete(`/calendar/holidays/${id}`),
  rooms: (clinicId) => api.get('/calendar/rooms', { params: { clinic_id: clinicId } }),
  createRoom: (data) => api.post('/calendar/rooms', data),
  bookRoom: (data) => api.post('/calendar/room-bookings', data),
  cancelRoomBooking: (id) => api.delete(`/calendar/room-bookings/${id}`),
  // Slot Capacity APIs (Feature 4-14)
  capacityCheck: (params) => api.get('/calendar/capacity/check', { params }),
  capacityAvailability: (params) => api.get('/calendar/capacity/availability', { params }),
  capacitySettings: (params) => api.get('/calendar/capacity/settings', { params }),
  saveCapacitySettings: (data) => api.post('/calendar/capacity/settings', data),
  syncSlot: (data) => api.post('/calendar/capacity/sync', data),
};

export const customSlots = {
  list: (params) => api.get('/doctors/custom-slots', { params }),
  create: (data) => api.post('/doctors/custom-slots', data),
  update: (id, data) => api.put(`/doctors/custom-slots/${id}`, data),
  remove: (id) => api.delete(`/doctors/custom-slots/${id}`),
};

export const appointmentProgress = {
  get: (appointmentId) => api.get(`/appointments/${appointmentId}/progress`),
  updateSession: (appointmentId, sessionNumber, data) =>
    api.put(`/appointments/${appointmentId}/progress/${sessionNumber}`, data),
  scheduleSession: (appointmentId, sessionNumber, data) =>
    api.post(`/appointments/${appointmentId}/progress/${sessionNumber}/schedule`, data),
  completeSession: (appointmentId, sessionNumber, data) =>
    api.post(`/appointments/${appointmentId}/progress/${sessionNumber}/complete`, data),
};

export const appointmentRequests = {
  list: (params) => api.get('/appointment-requests', { params }),
  create: (data) => api.post('/appointment-requests', data),
  review: (id, data) => api.put(`/appointment-requests/${id}/review`, data),
};

export const treatmentPackages = {
  list: () => api.get('/treatment-packages'),
  get: (slug) => api.get(`/treatment-packages/${slug}`),
};

export const packageBookings = {
  createOrder: (data) => api.post('/package-bookings/create-order', data),
  verify: (data) => api.post('/package-bookings/verify', data),
};

export const treatmentJourney = {
  list: (params) => api.get('/treatment-journey', { params }),
  get: (id) => api.get(`/treatment-journey/${id}`),
  create: (data) => api.post('/treatment-journey', data),
  update: (id, data) => api.put(`/treatment-journey/${id}`, data),
  remove: (id) => api.delete(`/treatment-journey/${id}`),
};

export const patientPackages = {
  list: (params) => api.get('/patient-packages', { params }),
  get: (id) => api.get(`/patient-packages/${id}`),
  enroll: (data) => api.post('/patient-packages', data),
  completeSession: (packageId, sessionNumber, data) =>
    api.post(`/patient-packages/${packageId}/sessions/${sessionNumber}/complete`, data),
  updateSession: (packageId, sessionNumber, data) =>
    api.put(`/patient-packages/${packageId}/sessions/${sessionNumber}`, data),
};

export const exercises = {
  list: (params) => api.get('/exercises', { params }),
  get: (slug) => api.get(`/exercises/${slug}`),
};

// ─── ERP APIs ────────────────────────────────────────────────────────────────

export const erpPatient = {
  getOverview: (patientKey, params) => api.get(`/erp/patients/${patientKey}/overview`, { params }),
  updateOverview: (patientKey, data, params) => api.put(`/erp/patients/${patientKey}/overview`, data, { params }),
  getTimeline: (patientKey, params) => api.get(`/erp/patients/${patientKey}/timeline`, { params }),
  addTimelineEvent: (patientKey, data, params) => api.post(`/erp/patients/${patientKey}/timeline`, data, { params }),
  updateTimelineEvent: (patientKey, id, data, params) => api.put(`/erp/patients/${patientKey}/timeline/${id}`, data, { params }),
  deleteTimelineEvent: (patientKey, id, params) => api.delete(`/erp/patients/${patientKey}/timeline/${id}`, { params }),
};

export const erpAssessments = {
  listTemplates: (params) => api.get('/erp/assessments/templates', { params }),
  createTemplate: (data, params) => api.post('/erp/assessments/templates', data, { params }),
  getTemplate: (id, params) => api.get(`/erp/assessments/templates/${id}`, { params }),
  updateTemplate: (id, data, params) => api.put(`/erp/assessments/templates/${id}`, data, { params }),
  deleteTemplate: (id, params) => api.delete(`/erp/assessments/templates/${id}`, { params }),
  duplicateTemplate: (id, params) => api.post(`/erp/assessments/templates/${id}/duplicate`, {}, { params }),
  getVersionHistory: (id, params) => api.get(`/erp/assessments/templates/${id}/versions`, { params }),
  restoreVersion: (templateId, versionId, params) => api.post(`/erp/assessments/templates/${templateId}/versions/${versionId}/restore`, {}, { params }),
  listResponses: (params) => api.get('/erp/assessments/responses', { params }),
  createResponse: (data, params) => api.post('/erp/assessments/responses', data, { params }),
  getResponse: (id, params) => api.get(`/erp/assessments/responses/${id}`, { params }),
  updateResponse: (id, data, params) => api.put(`/erp/assessments/responses/${id}`, data, { params }),
  sendOtp: (id, data, params) => api.post(`/erp/assessments/responses/${id}/otp/send`, data, { params }),
  verifyOtp: (id, data, params) => api.post(`/erp/assessments/responses/${id}/otp/verify`, data, { params }),
  listChips: (params) => api.get('/erp/assessments/chips', { params }),
  createChip: (data, params) => api.post('/erp/assessments/chips', data, { params }),
  updateChip: (id, data, params) => api.put(`/erp/assessments/chips/${id}`, data, { params }),
  deleteChip: (id, params) => api.delete(`/erp/assessments/chips/${id}`, { params }),
};

export const erpProtocols = {
  listTemplates: (params) => api.get('/erp/protocols/templates', { params }),
  createTemplate: (data) => api.post('/erp/protocols/templates', data),
  getTemplate: (id) => api.get(`/erp/protocols/templates/${id}`),
  updateTemplate: (id, data) => api.put(`/erp/protocols/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/erp/protocols/templates/${id}`),
  duplicateTemplate: (id) => api.post(`/erp/protocols/templates/${id}/duplicate`),
  getVersionHistory: (id) => api.get(`/erp/protocols/templates/${id}/versions`),
  listPatientProtocols: (params) => api.get('/erp/protocols/patient', { params }),
  createPatientProtocol: (data) => api.post('/erp/protocols/patient', data),
  getPatientProtocol: (id) => api.get(`/erp/protocols/patient/${id}`),
  updatePatientProtocol: (id, data) => api.put(`/erp/protocols/patient/${id}`, data),
  shareProtocol: (id, data) => api.post(`/erp/protocols/patient/${id}/share`, data),
};

// ─────────────────────────────────────────────────────────────────────────────

export const exercisePrescriptions = {
  list: (params) => api.get('/exercise-prescriptions', { params }),
  get: (id) => api.get(`/exercise-prescriptions/${id}`),
  create: (data) => api.post('/exercise-prescriptions', data),
  update: (id, data) => api.put(`/exercise-prescriptions/${id}`, data),
  publish: (id, data = {}) => api.post(`/exercise-prescriptions/${id}/publish`, data),
  clone: (id, data = {}) => api.post(`/exercise-prescriptions/${id}/clone`, data),
  cancel: (id) => api.delete(`/exercise-prescriptions/${id}`),
  progress: (id) => api.get(`/exercise-prescriptions/${id}/progress`),
  log: (id, data) => api.post(`/exercise-prescriptions/${id}/log`, data),
  deleteLog: (id, logId) => api.delete(`/exercise-prescriptions/${id}/log/${logId}`),
};
