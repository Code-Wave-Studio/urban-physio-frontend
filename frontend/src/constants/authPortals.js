/** Separate authentication portals — each has its own login/register URLs and terms. */

export const AUTH_PORTALS = {
  patient: {
    id: 'patient',
    role: 'patient',
    loginPath: '/patient/login',
    registerPath: '/patient/register',
    forgotPasswordRole: 'patient',
    icon: 'fa-user',
    accent: 'from-primary-600 to-orange-600',
    softAccent: 'bg-primary-50 text-primary-800 border-primary-200',
    loginTitle: 'Patient sign in',
    loginSubtitle: 'Book appointments, view reports, and manage your care',
    registerTitle: 'Create patient account',
    registerSubtitle: 'For people booking physiotherapy — not for doctors or clinics',
    registerCta: 'Register as patient',
    loginCta: 'Sign in as patient',
    pickerTitle: 'Patient',
    pickerDescription: 'Book online, clinic & home visits. Track appointments and health records.',
    showSpecialization: false,
    showClinicName: false,
    termsKey: 'patientRegistration',
    termsPath: '/patient-registration-terms',
    termsLabel: 'Patient Registration Terms',
    requireMedicoLegal: false,
    alternatePortals: [
      { portalId: 'doctor', label: 'Physiotherapist or clinic?', linkLabel: 'Doctor sign in' },
      { portalId: 'provider', label: 'Clinic owner?', linkLabel: 'Register your clinic', linkMode: 'register' },
    ],
  },
  doctor: {
    id: 'doctor',
    role: 'doctor',
    registrationIntent: 'physiotherapist',
    loginPath: '/doctor/login',
    registerPath: '/doctor/register',
    forgotPasswordRole: 'doctor',
    icon: 'fa-user-doctor',
    accent: 'from-violet-600 to-indigo-700',
    softAccent: 'bg-violet-50 text-violet-900 border-violet-200',
    loginTitle: 'Doctor & clinic sign in',
    loginSubtitle: 'For physiotherapists and clinic partners — manage practice, appointments & earnings',
    registerTitle: 'Doctor registration',
    registerSubtitle: 'For licensed physiotherapists joining as independent practitioners',
    registerCta: 'Register as doctor',
    loginCta: 'Sign in',
    pickerTitle: 'Physiotherapist',
    pickerDescription: 'Individual doctor account for verified physiotherapists on the platform.',
    showSpecialization: true,
    showClinicName: false,
    termsKey: 'doctorRegistration',
    termsPath: '/doctor-registration-terms',
    termsLabel: 'Doctor Registration Terms',
    requireMedicoLegal: true,
    alternatePortals: [
      { portalId: 'patient', label: 'Looking to book care?', linkLabel: 'Patient sign in' },
      { portalId: 'provider', label: 'Registering a clinic?', linkLabel: 'Clinic partner registration', linkMode: 'register' },
    ],
  },
  provider: {
    id: 'provider',
    role: 'doctor',
    registrationIntent: 'clinic',
    loginPath: '/doctor/login',
    registerPath: '/provider/register',
    forgotPasswordRole: 'doctor',
    icon: 'fa-hospital',
    accent: 'from-emerald-600 to-teal-700',
    softAccent: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    loginTitle: 'Clinic partner sign in',
    loginSubtitle: 'Manage your clinic profile, doctors, and patient appointments',
    registerTitle: 'Clinic registration',
    registerSubtitle: 'For clinic owners and managers listing a physiotherapy centre on Urban Physio',
    registerCta: 'Register clinic partner account',
    loginCta: 'Sign in as clinic partner',
    pickerTitle: 'Clinic partner',
    pickerDescription: 'List your physiotherapy clinic, manage staff, and accept online bookings.',
    showSpecialization: false,
    showClinicName: true,
    termsKey: 'clinicRegistration',
    termsPath: '/clinic-registration-terms',
    termsLabel: 'Clinic Registration Terms',
    requireMedicoLegal: true,
    alternatePortals: [
      { portalId: 'doctor', label: 'Individual physiotherapist?', linkLabel: 'Doctor registration' },
      { portalId: 'patient', label: 'Need treatment?', linkLabel: 'Patient sign in' },
    ],
  },
};

export function getAuthPortal(portalId) {
  return AUTH_PORTALS[portalId] || null;
}

export const AUTH_PORTAL_LIST = ['patient', 'doctor', 'provider'];

/** Login picker — clinic partners use doctor sign-in. */
export const AUTH_LOGIN_PORTAL_LIST = ['patient', 'doctor'];
