import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Doctors from './pages/Doctors';
import Clinics from './pages/Clinics';
import DoctorDetail from './pages/DoctorDetail';
import DoctorProfilePage from './pages/DoctorProfilePage';
import ClinicProfilePage from './pages/ClinicProfilePage';
import BookAppointmentWizard from './pages/BookAppointmentWizard';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import Conditions from './pages/Conditions';
import ConditionDetail from './pages/ConditionDetail';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientReports from './pages/patient/PatientReports';
import DocumentsPage from './pages/DocumentsPage';
import ClinicDashboardPage from './pages/clinic/ClinicDashboardPage';
import ClinicPortalHome from './pages/clinic/ClinicPortalHome';
import ClinicAdminHome from './pages/clinic/ClinicAdminHome';
import ClinicStaffPage from './pages/clinic/ClinicStaffPage';
import ClinicPortalDoctors from './pages/clinic/ClinicPortalDoctors';
import ClinicPortalProfile from './pages/clinic/ClinicPortalProfile';
import ClinicPortalAppointments from './pages/clinic/ClinicPortalAppointments';
import ClinicPortalPatients from './pages/clinic/ClinicPortalPatients';
import ClinicPortalEarnings from './pages/clinic/ClinicPortalEarnings';
import ClinicBillingPage from './pages/clinic/ClinicBillingPage';
import ClinicAdvancedSearchPage from './pages/clinic/ClinicAdvancedSearchPage';
import DoctorAdvancedSearchPage from './pages/doctor/DoctorAdvancedSearchPage';
import AdminAdvancedSearchPage from './pages/admin/AdminAdvancedSearchPage';
import DoctorCalendarPage from './pages/doctor/DoctorCalendarPage';
import AdminCalendarPage from './pages/admin/AdminCalendarPage';
import ClinicCalendarPage from './pages/clinic/ClinicCalendarPage';
import ClinicPackagesPage from './pages/clinic/ClinicPackagesPage';
import ClinicReportsPage from './pages/clinic/ClinicReportsPage';
import ClinicTeamPage from './pages/clinic/ClinicTeamPage';
import ClinicBrandingPage from './pages/clinic/ClinicBrandingPage';
import ClinicCreatePackagePage from './pages/clinic/ClinicCreatePackagePage';
import ClinicClinicalLibraryPage from './pages/clinic/ClinicClinicalLibraryPage';
import ClinicAvailabilityPage from './pages/clinic/ClinicAvailabilityPage';
import ClinicQrPage from './pages/clinic/ClinicQrPage';
import ClinicFormsPage from './pages/clinic/ClinicFormsPage';
import ClinicPatientDetailPage from './pages/clinic/ClinicPatientDetailPage';
import ClinicNotificationsManagePage from './pages/clinic/ClinicNotificationsManagePage';
import ClinicQrIntakePage from './pages/public/ClinicQrIntakePage';
import ClinicProgressPublicPage from './pages/public/ClinicProgressPublicPage';
import PatientProfile from './pages/patient/PatientProfile';
import AdminInvoiceSettings from './pages/admin/AdminInvoiceSettings';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminNotificationSettings from './pages/admin/AdminNotificationSettings';
import AdminSeo from './pages/admin/AdminSeo';
import NotFoundPage from './pages/NotFoundPage';
import AdminPainSelection from './pages/admin/AdminPainSelection';
import AdminBookingSettings from './pages/admin/booking/AdminBookingSettings';
import AdminContact from './pages/admin/AdminContact';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorEarnings from './pages/doctor/DoctorEarnings';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorClinics from './pages/doctor/DoctorClinics';
import DoctorAddClinic from './pages/doctor/DoctorAddClinic';
import DoctorClinicAvailability from './pages/doctor/DoctorClinicAvailability';
import DoctorBookingFilters from './pages/doctor/DoctorBookingFilters';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminLogs from './pages/admin/AdminLogs';
import AdminProfile from './pages/admin/AdminProfile';
import AdminConditions from './pages/admin/AdminConditions';
import AdminTreatments from './pages/admin/AdminTreatments';
import AdminClinics from './pages/admin/AdminClinics';
import AdminLocations from './pages/admin/AdminLocations';
import PolicyPage from './pages/legal/PolicyPage';
import FaqPage from './pages/FaqPage';
import CareersPage from './pages/CareersPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CancellationHelpPage from './pages/CancellationHelpPage';
import LicensePage from './pages/LicensePage';
import EmergencyBookingWizard from './pages/EmergencyBookingWizard';
import DoctorEmergency from './pages/doctor/DoctorEmergency';
import AdminEmergency from './pages/admin/AdminEmergency';
import SearchResultsPage from './pages/SearchResultsPage';
import DoctorCustomSlots from './pages/doctor/DoctorCustomSlots';
import AppointmentRequestsPage from './pages/AppointmentRequestsPage';
import TreatmentPackages from './pages/TreatmentPackages';
import PackageBookingWizard from './pages/PackageBookingWizard';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
import AdminTreatmentPackages from './pages/admin/AdminTreatmentPackages';
import AdminDoctorPackages from './pages/admin/AdminDoctorPackages';
import AdminExercises from './pages/admin/AdminExercises';
import PatientPackages from './pages/patient/PatientPackages';
import PatientSaved from './pages/patient/PatientSaved';
import PatientTreatmentJourney from './pages/patient/PatientTreatmentJourney';
import DoctorTreatmentJourney from './pages/doctor/DoctorTreatmentJourney';
import DoctorPackages from './pages/doctor/DoctorPackages';
import DoctorTreatmentServices from './pages/doctor/DoctorTreatmentServices';
import DoctorServicePackages from './pages/doctor/DoctorServicePackages';
import DoctorAdminPackagePrices from './pages/doctor/DoctorAdminPackagePrices';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import PatientExercises from './pages/patient/PatientExercises';
import PatientBills from './pages/patient/PatientBills';
import PatientProgress from './pages/patient/PatientProgress';
import PatientVideoConsultations from './pages/patient/PatientVideoConsultations';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientConsultationPage from './pages/patient/PatientConsultationPage';
import DoctorConsultationPage from './pages/doctor/DoctorConsultationPage';
import PhysioFeed from './pages/PhysioFeed';
import PhysioFeedDetail from './pages/PhysioFeedDetail';
import AdminPhysioFeed from './pages/admin/AdminPhysioFeed';
import AdminAbout from './pages/admin/AdminAbout';
import AdminHomeHero from './pages/admin/AdminHomeHero';
import AdminHomeImages from './pages/admin/AdminHomeImages';
import AdminHomeBanners from './pages/admin/AdminHomeBanners';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminBadges from './pages/admin/AdminBadges';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import { ADMIN_NAV } from './constants/adminNav';
import { DOCTOR_NAV } from './constants/doctorNav';
import { PATIENT_NAV } from './constants/patientNav';
import CitySeoListingPage from './pages/CitySeoListingPage';
import AuthLoginPage from './pages/auth/AuthLoginPage';
import AuthRegisterPage from './pages/auth/AuthRegisterPage';
import ScrollToTop from './components/ScrollToTop';
import { SeoProvider } from './contexts/SeoContext';

/* CodeWave Studio license guard — redundant, self-healing copy (do NOT remove). */
function cwAppLicenseGuard() {
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
      new MutationObserver(cwAppLicenseGuard).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.setInterval(cwAppLicenseGuard, 3000);
    }
  } catch {
    /* noop */
  }
}
cwAppLicenseGuard();

export default function App() {
  cwAppLicenseGuard();
  return (
    <SeoProvider>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient/login" element={<AuthLoginPage portalId="patient" />} />
      <Route path="/patient/register" element={<AuthRegisterPage portalId="patient" />} />
      <Route path="/doctor/login" element={<AuthLoginPage portalId="doctor" />} />
      <Route path="/doctor/register" element={<AuthRegisterPage portalId="doctor" />} />
      <Route path="/clinic/login" element={<AuthLoginPage portalId="clinic" />} />
      <Route path="/clinic/register" element={<AuthRegisterPage portalId="clinic" />} />
      <Route path="/provider/login" element={<Navigate to="/doctor/login" replace />} />
      <Route path="/provider/register" element={<Navigate to="/doctor/register" replace />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/c/:token" element={<ClinicQrIntakePage />} />
      <Route path="/clinic-intake/:token" element={<ClinicQrIntakePage />} />
      <Route path="/clinic-report/:token" element={<ClinicProgressPublicPage />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/clinics" element={<Clinics />} />
      <Route path="/best-physiotherapy-clinic-in/:citySlug" element={<CitySeoListingPage type="clinics" legacy />} />
      <Route path="/best-physiotherapist-in/:citySlug" element={<CitySeoListingPage type="doctors" legacy />} />
      <Route path="/:citySlug/physiotherapy-clinics" element={<CitySeoListingPage type="clinics" />} />
      <Route path="/:citySlug/physiotherapists" element={<CitySeoListingPage type="doctors" />} />
      <Route
        path="/book"
        element={
          <ProtectedRoute roles={['patient', 'admin', 'super_admin']}>
            <BookAppointmentWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency/book"
        element={
          <ProtectedRoute roles={['patient', 'admin', 'super_admin']}>
            <EmergencyBookingWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors/:id/book"
        element={
          <ProtectedRoute roles={['patient', 'admin', 'super_admin']}>
            <BookAppointmentWizard />
          </ProtectedRoute>
        }
      />
      <Route path="/doctors/:id" element={<DoctorDetail />} />
      <Route path="/doctor/:slug" element={<DoctorProfilePage legacy />} />
      <Route path="/clinic/:slug" element={<ClinicProfilePage legacy />} />
      <Route path="/clinic/id/:id" element={<ClinicProfilePage />} />
      <Route path="/:citySlug/:locality/physiotherapists/:slug" element={<DoctorProfilePage />} />
      <Route path="/:citySlug/:locality/physiotherapy-clinic/:slug" element={<ClinicProfilePage />} />
      <Route path="/treatments" element={<Treatments />} />
      <Route path="/treatments/:slug" element={<TreatmentDetail />} />
      <Route path="/conditions" element={<Conditions />} />
      <Route path="/conditions/:slug" element={<ConditionDetail />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/packages" element={<TreatmentPackages />} />
      <Route
        path="/packages/book/:slug"
        element={
          <ProtectedRoute roles={['patient', 'admin', 'super_admin']}>
            <PackageBookingWizard />
          </ProtectedRoute>
        }
      />
      <Route path="/exercises" element={<ExerciseLibrary />} />
      <Route path="/exercises/:slug" element={<ExerciseDetail />} />
      <Route path="/physiofeed" element={<PhysioFeed legacy />} />
      <Route path="/physiofeed/:slug" element={<PhysioFeedDetail legacy />} />
      <Route path="/blog" element={<PhysioFeed mode="blog" />} />
      <Route path="/blog/category/:categorySlug" element={<PhysioFeed mode="blog-category" />} />
      <Route path="/blog/:slug" element={<PhysioFeedDetail mode="blog" />} />
      <Route path="/podcast" element={<PhysioFeed mode="podcast" />} />
      <Route path="/podcast/:slug" element={<PhysioFeedDetail mode="podcast" />} />

      <Route path="/privacy-policy" element={<PolicyPage />} />
      <Route path="/terms-and-conditions" element={<PolicyPage />} />
      <Route path="/medico-legal-terms" element={<PolicyPage />} />
      <Route path="/patient-registration-terms" element={<PolicyPage />} />
      <Route path="/doctor-registration-terms" element={<PolicyPage />} />
      <Route path="/clinic-registration-terms" element={<PolicyPage />} />
      <Route path="/refund-policy" element={<PolicyPage />} />
      <Route path="/medical-disclaimer" element={<PolicyPage />} />
      <Route path="/data-security" element={<PolicyPage />} />
      <Route path="/service-policy" element={<PolicyPage />} />
      <Route path="/cookie-policy" element={<PolicyPage />} />

      <Route path="/faq" element={<FaqPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cancellation-help" element={<CancellationHelpPage />} />
      <Route path="/license" element={<LicensePage />} />

      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><PatientAppointments /></ProtectedRoute>} />
      <Route path="/patient/packages" element={<ProtectedRoute roles={['patient']}><PatientPackages /></ProtectedRoute>} />
      <Route path="/patient/saved" element={<ProtectedRoute roles={['patient']}><PatientSaved /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><PatientReports /></ProtectedRoute>} />
      <Route path="/patient/bills" element={<ProtectedRoute roles={['patient']}><PatientBills /></ProtectedRoute>} />
      <Route path="/patient/progress" element={<ProtectedRoute roles={['patient']}><PatientProgress /></ProtectedRoute>} />
      <Route path="/patient/video-consultations" element={<ProtectedRoute roles={['patient']}><PatientVideoConsultations /></ProtectedRoute>} />
      <Route path="/patient/consultation/:appointmentId" element={<ProtectedRoute roles={['patient']}><PatientConsultationPage /></ProtectedRoute>} />
      <Route path="/patient/prescriptions" element={<ProtectedRoute roles={['patient']}><PatientPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/treatment-journey" element={<ProtectedRoute roles={['patient']}><PatientTreatmentJourney /></ProtectedRoute>} />
      <Route path="/patient/documents" element={<ProtectedRoute roles={['patient']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute roles={['patient']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute roles={['patient']}><NotificationsPage /></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute roles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/consultation/:appointmentId" element={<ProtectedRoute roles={['doctor']}><DoctorConsultationPage /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute roles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/availability" element={<ProtectedRoute roles={['doctor']}><Navigate to="/doctor/clinic-availability" replace /></ProtectedRoute>} />
      <Route path="/doctor/earnings" element={<ProtectedRoute roles={['doctor']}><DoctorEarnings /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute roles={['doctor']}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/search" element={<ProtectedRoute roles={['doctor']}><DoctorAdvancedSearchPage /></ProtectedRoute>} />
      <Route path="/doctor/calendar" element={<ProtectedRoute roles={['doctor']}><DoctorCalendarPage /></ProtectedRoute>} />
      <Route path="/doctor/treatment-journey" element={<ProtectedRoute roles={['doctor']}><DoctorTreatmentJourney /></ProtectedRoute>} />
      <Route path="/doctor/documents" element={<ProtectedRoute roles={['doctor']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalHome /></ProtectedRoute>} />
      <Route path="/clinic-portal/admin" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAdminHome /></ProtectedRoute>} />
      <Route path="/clinic-portal/staff" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicStaffPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/doctors" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalDoctors /></ProtectedRoute>} />
      <Route path="/clinic-portal/documents" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/appointments" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalAppointments /></ProtectedRoute>} />
      <Route path="/clinic-portal/patients" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalPatients /></ProtectedRoute>} />
      <Route path="/clinic-portal/patients/:patientKey" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPatientDetailPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/earnings" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalEarnings /></ProtectedRoute>} />
      <Route path="/clinic-portal/billing" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicBillingPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/search" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAdvancedSearchPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/calendar" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicCalendarPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/availability" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAvailabilityPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/packages" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPackagesPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/reports" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicReportsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/team" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicTeamPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/branding" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicBrandingPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/create-package" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicCreatePackagePage /></ProtectedRoute>} />
      <Route path="/clinic-portal/clinical-library" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicClinicalLibraryPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/qr" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicQrPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/forms" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicFormsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/profile" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalProfile /></ProtectedRoute>} />
      <Route path="/clinic-portal/notifications" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/notifications/manage" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicNotificationsManagePage /></ProtectedRoute>} />
      {/* Doctor/admin clinic analytics (does not collide with public /clinic/:slug profiles) */}
      <Route path="/clinic-manage" element={<ProtectedRoute roles={['doctor', 'admin', 'super_admin']}><ClinicDashboardPage /></ProtectedRoute>} />
      <Route path="/clinic-manage/:clinicId" element={<ProtectedRoute roles={['doctor', 'admin', 'super_admin']}><ClinicDashboardPage /></ProtectedRoute>} />
      <Route path="/doctor/clinics" element={<ProtectedRoute roles={['doctor']}><DoctorClinics /></ProtectedRoute>} />
      <Route path="/doctor/clinics/new" element={<ProtectedRoute roles={['doctor']}><DoctorAddClinic /></ProtectedRoute>} />
      <Route path="/doctor/clinic-availability" element={<ProtectedRoute roles={['doctor']}><DoctorClinicAvailability /></ProtectedRoute>} />
      <Route path="/doctor/booking-filters" element={<ProtectedRoute roles={['doctor']}><DoctorBookingFilters /></ProtectedRoute>} />
      <Route path="/doctor/custom-slots" element={<ProtectedRoute roles={['doctor']}><DoctorCustomSlots /></ProtectedRoute>} />
      <Route path="/doctor/packages" element={<ProtectedRoute roles={['doctor']}><DoctorPackages /></ProtectedRoute>} />
      <Route path="/doctor/treatment-services" element={<ProtectedRoute roles={['doctor']}><DoctorTreatmentServices /></ProtectedRoute>} />
      <Route path="/doctor/service-packages" element={<ProtectedRoute roles={['doctor']}><DoctorServicePackages /></ProtectedRoute>} />
      <Route path="/doctor/admin-package-prices" element={<ProtectedRoute roles={['doctor']}><DoctorAdminPackagePrices /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute roles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/exercises" element={<ProtectedRoute roles={['patient']}><PatientExercises /></ProtectedRoute>} />
      <Route path="/clinic-portal/exercises" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/doctor/requests" element={<ProtectedRoute roles={['doctor']}><AppointmentRequestsPage navItems={DOCTOR_NAV} title="Reschedule & cancellation" scope="doctor" /></ProtectedRoute>} />
      <Route path="/doctor/emergency" element={<ProtectedRoute roles={['doctor']}><DoctorEmergency /></ProtectedRoute>} />
      <Route path="/doctor/notifications" element={<ProtectedRoute roles={['doctor']}><NotificationsPage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/locations" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLocations /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/clinics" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminClinics /></ProtectedRoute>} />
      <Route path="/admin/conditions" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminConditions /></ProtectedRoute>} />
      <Route path="/admin/treatments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTreatments /></ProtectedRoute>} />
      <Route path="/admin/treatment-packages" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTreatmentPackages /></ProtectedRoute>} />
      <Route path="/admin/doctor-packages" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDoctorPackages /></ProtectedRoute>} />
      <Route path="/admin/exercises" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminExercises /></ProtectedRoute>} />
      <Route path="/admin/physiofeed" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminPhysioFeed /></ProtectedRoute>} />
      <Route path="/admin/about" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAbout /></ProtectedRoute>} />
      <Route path="/admin/home-hero" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminHomeHero /></ProtectedRoute>} />
      <Route path="/admin/home-images" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminHomeImages /></ProtectedRoute>} />
      <Route path="/admin/home-banners" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminHomeBanners /></ProtectedRoute>} />
      <Route path="/admin/testimonials" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTestimonials /></ProtectedRoute>} />
      <Route path="/admin/badges" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBadges /></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCoupons /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/pain-selection" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminPainSelection /></ProtectedRoute>} />
      <Route path="/admin/emergency" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminEmergency /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/appointment-requests" element={<ProtectedRoute roles={['admin', 'super_admin']}><AppointmentRequestsPage navItems={ADMIN_NAV} title="Doctor change requests" scope="admin" /></ProtectedRoute>} />
      <Route path="/admin/contact" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminContact /></ProtectedRoute>} />
      <Route path="/admin/invoice-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminInvoiceSettings /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBillingPage /></ProtectedRoute>} />
      <Route path="/admin/search" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAdvancedSearchPage /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCalendarPage /></ProtectedRoute>} />
      <Route path="/admin/seo" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminSeo /></ProtectedRoute>} />
      <Route path="/admin/booking-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBookingSettings /></ProtectedRoute>} />
      <Route path="/admin/documents" element={<ProtectedRoute roles={['admin', 'super_admin']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLogs /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin', 'super_admin']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/admin/notification-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminNotificationSettings /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </SeoProvider>
  );
}
