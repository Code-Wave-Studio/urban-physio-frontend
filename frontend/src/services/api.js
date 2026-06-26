import axios from 'axios';

/** Fallback when VITE_API_URL is missing from the production build */
const LIVE_API_FALLBACK = 'https://mediumorchid-monkey-387815.hostingersite.com/backend/api';

function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/$/, '');
  }
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'theurbanphysio.com' || host === 'www.theurbanphysio.com' || host.endsWith('.pages.dev')) {
      return LIVE_API_FALLBACK;
    }
  }
  const path =
    envUrl ||
    `${import.meta.env.BASE_URL || '/'}backend/api`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${apiPath}`;
  }
  return `http://localhost${apiPath}`;
}

export const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')?.trim();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong';
    const status = err.response?.status;
    // Do NOT clear the session here — one failing endpoint (notifications, etc.) was logging users out after login.
    return Promise.reject({
      message,
      errors: err.response?.data?.errors,
      status,
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
      params: { state_id: stateId, ...(servedOnly ? { served: '1' } : {}) },
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
};

export const doctors = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${id}`),
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
  createOrder: (appointmentId) => api.post('/payments/order', { appointment_id: appointmentId }),
  verify: (data) => api.post('/payments/verify', data),
  invoice: (appointmentId) => api.get(`/payments/${appointmentId}`),
};

export const patients = {
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  favouriteDoctors: () => api.get('/patients/favourite-doctors'),
  addFavouriteDoctor: (doctorId) => api.post(`/patients/favourite-doctors/${doctorId}`),
  removeFavouriteDoctor: (doctorId) => api.delete(`/patients/favourite-doctors/${doctorId}`),
  favouriteClinics: () => api.get('/patients/favourite-clinics'),
  addFavouriteClinic: (clinicId) => api.post(`/patients/favourite-clinics/${clinicId}`),
  removeFavouriteClinic: (clinicId) => api.delete(`/patients/favourite-clinics/${clinicId}`),
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
  contactSettings: () => api.get('/admin/contact-settings'),
  updateContactSettings: (data) => api.put('/admin/contact-settings', data),
  aboutSettings: () => api.get('/admin/about-settings'),
  updateAboutSettings: (data) => api.put('/admin/about-settings', data),
  heroSettings: () => api.get('/admin/hero-settings'),
  updateHeroSettings: (data) => api.put('/admin/hero-settings', data),
  homeBannerSettings: () => api.get('/admin/home-banner-settings'),
  updateHomeBannerSettings: (data) => api.put('/admin/home-banner-settings', data),
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

export const about = {
  settings: () => api.get('/about/settings'),
};

export const home = {
  heroSettings: () => api.get('/home/hero-settings'),
  bannerSettings: () => api.get('/home/banner-settings'),
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

export const search = {
  universal: (params) => api.get('/search', { params }),
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

export const exercisePrescriptions = {
  list: (params) => api.get('/exercise-prescriptions', { params }),
  get: (id) => api.get(`/exercise-prescriptions/${id}`),
  create: (data) => api.post('/exercise-prescriptions', data),
  update: (id, data) => api.put(`/exercise-prescriptions/${id}`, data),
  cancel: (id) => api.delete(`/exercise-prescriptions/${id}`),
};
