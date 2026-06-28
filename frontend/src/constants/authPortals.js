/** Separate authentication portals — patient and doctor only. */

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
    registerSubtitle: 'For people booking physiotherapy — not for doctors',
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
      { portalId: 'doctor', label: 'Physiotherapist?', linkLabel: 'Doctor sign in' },
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
    loginTitle: 'Doctor sign in',
    loginSubtitle: 'Manage your practice, appointments, patients & earnings',
    registerTitle: 'Doctor registration',
    registerSubtitle: 'For licensed physiotherapists joining as independent practitioners',
    registerCta: 'Register as doctor',
    loginCta: 'Sign in as doctor',
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
    ],
  },
};

export function getAuthPortal(portalId) {
  return AUTH_PORTALS[portalId] || null;
}

export const AUTH_PORTAL_LIST = ['patient', 'doctor'];

export const AUTH_LOGIN_PORTAL_LIST = AUTH_PORTAL_LIST;
