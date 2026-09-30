import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import lazyWithRetry from './utils/lazyWithRetry';
import AppErrorBoundary from './components/AppErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ForceTempPasswordChange from './components/ForceTempPasswordChange';
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
const PatientDashboard = lazyWithRetry(() => import('./pages/patient/PatientDashboard'));
const PatientAppointments = lazyWithRetry(() => import('./pages/patient/PatientAppointments'));
const PatientReports = lazyWithRetry(() => import('./pages/patient/PatientReports'));
import DocumentsPage from './pages/DocumentsPage';
const ClinicDashboardPage = lazyWithRetry(() => import('./pages/clinic/ClinicDashboardPage'));
const ClinicPortalHome = lazyWithRetry(() => import('./pages/clinic/ClinicPortalHome'));
const ClinicAdminHome = lazyWithRetry(() => import('./pages/clinic/ClinicAdminHome'));
const ClinicStaffPage = lazyWithRetry(() => import('./pages/clinic/ClinicStaffPage'));
const ClinicPortalDoctors = lazyWithRetry(() => import('./pages/clinic/ClinicPortalDoctors'));
const ClinicPortalProfile = lazyWithRetry(() => import('./pages/clinic/ClinicPortalProfile'));
const ClinicPortalAppointments = lazyWithRetry(() => import('./pages/clinic/ClinicPortalAppointments'));
const ClinicPortalPatients = lazyWithRetry(() => import('./pages/clinic/ClinicPortalPatients'));
const ClinicPortalEarnings = lazyWithRetry(() => import('./pages/clinic/ClinicPortalEarnings'));
const ClinicBillingPage = lazyWithRetry(() => import('./pages/clinic/ClinicBillingPage'));
const ClinicAdvancedSearchPage = lazyWithRetry(() => import('./pages/clinic/ClinicAdvancedSearchPage'));
const DoctorAdvancedSearchPage = lazyWithRetry(() => import('./pages/doctor/DoctorAdvancedSearchPage'));
const AdminAdvancedSearchPage = lazyWithRetry(() => import('./pages/admin/AdminAdvancedSearchPage'));
const DoctorCalendarPage = lazyWithRetry(() => import('./pages/doctor/DoctorCalendarPage'));
const AdminCalendarPage = lazyWithRetry(() => import('./pages/admin/AdminCalendarPage'));
const ClinicCalendarPage = lazyWithRetry(() => import('./pages/clinic/ClinicCalendarPage'));
const ClinicPackagesPage = lazyWithRetry(() => import('./pages/clinic/ClinicPackagesPage'));
const ClinicReportsPage = lazyWithRetry(() => import('./pages/clinic/ClinicReportsPage'));
const ClinicTeamPage = lazyWithRetry(() => import('./pages/clinic/ClinicTeamPage'));
const ClinicBrandingPage = lazyWithRetry(() => import('./pages/clinic/ClinicBrandingPage'));
const ClinicCreatePackagePage = lazyWithRetry(() => import('./pages/clinic/ClinicCreatePackagePage'));
const ClinicClinicalLibraryPage = lazyWithRetry(() => import('./pages/clinic/ClinicClinicalLibraryPage'));
const ClinicAvailabilityPage = lazyWithRetry(() => import('./pages/clinic/ClinicAvailabilityPage'));
const ClinicAvailabilitySettingsPage = lazyWithRetry(() => import('./pages/clinic/ClinicAvailabilitySettingsPage'));
const ClinicQrPage = lazyWithRetry(() => import('./pages/clinic/ClinicQrPage'));
const ClinicFormsPage = lazyWithRetry(() => import('./pages/clinic/ClinicFormsPage'));
const ClinicPatientDetailPage = lazyWithRetry(() => import('./pages/clinic/ClinicPatientDetailPage'));
const ClinicAssessmentBuilderPage = lazyWithRetry(() => import('./pages/clinic/ClinicAssessmentBuilderPage'));
const PrescriptionDocumentViewPage = lazyWithRetry(() => import('./pages/clinic/PrescriptionDocumentViewPage'));
const ClinicProtocolBuilderPage = lazyWithRetry(() => import('./pages/clinic/ClinicProtocolBuilderPage'));
const ClinicSuggestionChipsPage = lazyWithRetry(() => import('./pages/clinic/ClinicSuggestionChipsPage'));
const ClinicNotificationsManagePage = lazyWithRetry(() => import('./pages/clinic/ClinicNotificationsManagePage'));
const ClinicCommunicationPage = lazyWithRetry(() => import('./pages/clinic/ClinicCommunicationPage'));
const ClinicExerciseRehabPage = lazyWithRetry(() => import('./pages/clinic/ClinicExerciseRehabPage'));
const ClinicBackOfficePage = lazyWithRetry(() => import('./pages/clinic/ClinicBackOfficePage'));
const ClinicAiAnalyticsPage = lazyWithRetry(() => import('./pages/clinic/ClinicAiAnalyticsPage'));
const ClinicNotesPage = lazyWithRetry(() => import('./pages/clinic/ClinicNotesPage'));
const ClinicSupportCenterPage = lazyWithRetry(() => import('./pages/clinic/ClinicSupportCenterPage'));
const AdminSupportCenterPage = lazyWithRetry(() => import('./pages/admin/AdminSupportCenterPage'));
const ClinicInvoiceGeneratorPage = lazyWithRetry(() => import('./pages/clinic/ClinicInvoiceGeneratorPage'));
import ClinicQrIntakePage from './pages/public/ClinicQrIntakePage';
import ClinicProgressPublicPage from './pages/public/ClinicProgressPublicPage';
import PayInvoicePage from './pages/public/PayInvoicePage';
const PatientProfile = lazyWithRetry(() => import('./pages/patient/PatientProfile'));
const AdminInvoiceSettings = lazyWithRetry(() => import('./pages/admin/AdminInvoiceSettings'));
const AdminBillingPage = lazyWithRetry(() => import('./pages/admin/AdminBillingPage'));
const AdminZoomMeetings = lazyWithRetry(() => import('./pages/admin/AdminZoomMeetings'));
const AdminWallet = lazyWithRetry(() => import('./pages/admin/AdminWallet'));
const AdminNotificationSettings = lazyWithRetry(() => import('./pages/admin/AdminNotificationSettings'));
const AdminSeo = lazyWithRetry(() => import('./pages/admin/AdminSeo'));
import NotFoundPage from './pages/NotFoundPage';
const AdminPainSelection = lazyWithRetry(() => import('./pages/admin/AdminPainSelection'));
const AdminBookingSettings = lazyWithRetry(() => import('./pages/admin/booking/AdminBookingSettings'));
const AdminContact = lazyWithRetry(() => import('./pages/admin/AdminContact'));
const DoctorDashboard = lazyWithRetry(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazyWithRetry(() => import('./pages/doctor/DoctorAppointments'));
const DoctorEarnings = lazyWithRetry(() => import('./pages/doctor/DoctorEarnings'));
const DoctorPatients = lazyWithRetry(() => import('./pages/doctor/DoctorPatients'));
const DoctorProfile = lazyWithRetry(() => import('./pages/doctor/DoctorProfile'));
const DoctorClinics = lazyWithRetry(() => import('./pages/doctor/DoctorClinics'));
const DoctorAddClinic = lazyWithRetry(() => import('./pages/doctor/DoctorAddClinic'));
const DoctorClinicAvailability = lazyWithRetry(() => import('./pages/doctor/DoctorClinicAvailability'));
const DoctorBookingFilters = lazyWithRetry(() => import('./pages/doctor/DoctorBookingFilters'));
import NotificationsPage from './pages/NotificationsPage';
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'));
const AdminAppointments = lazyWithRetry(() => import('./pages/admin/AdminAppointments'));
const AdminLogs = lazyWithRetry(() => import('./pages/admin/AdminLogs'));
const AdminCmsPublishing = lazyWithRetry(() => import('./pages/admin/AdminCmsPublishing'));
const AdminLeads = lazyWithRetry(() => import('./pages/admin/AdminLeads'));
const AdminProfile = lazyWithRetry(() => import('./pages/admin/AdminProfile'));
const AdminConditions = lazyWithRetry(() => import('./pages/admin/AdminConditions'));
const AdminTreatments = lazyWithRetry(() => import('./pages/admin/AdminTreatments'));
const AdminClinics = lazyWithRetry(() => import('./pages/admin/AdminClinics'));
const AdminLocations = lazyWithRetry(() => import('./pages/admin/AdminLocations'));
import PolicyPage from './pages/legal/PolicyPage';
import FaqPage from './pages/FaqPage';
import CareersPage from './pages/CareersPage';
import AboutPage from './pages/AboutPage';
import HomePhysiotherapyPage from './pages/HomePhysiotherapyPage';
import TelePhysioPage from './pages/TelePhysioPage';
import OffersPage from './pages/OffersPage';
import ContactPage from './pages/ContactPage';
import CancellationHelpPage from './pages/CancellationHelpPage';
import LicensePage from './pages/LicensePage';
import HtmlSitemapPage from './pages/HtmlSitemapPage';
import EmergencyBookingWizard from './pages/EmergencyBookingWizard';
const DoctorEmergency = lazyWithRetry(() => import('./pages/doctor/DoctorEmergency'));
const AdminEmergency = lazyWithRetry(() => import('./pages/admin/AdminEmergency'));
import SearchResultsPage from './pages/SearchResultsPage';
const DoctorCustomSlots = lazyWithRetry(() => import('./pages/doctor/DoctorCustomSlots'));
import AppointmentRequestsPage from './pages/AppointmentRequestsPage';
import TreatmentPackages from './pages/TreatmentPackages';
import PackageBookingWizard from './pages/PackageBookingWizard';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
const AdminTreatmentPackages = lazyWithRetry(() => import('./pages/admin/AdminTreatmentPackages'));
const AdminDoctorPackages = lazyWithRetry(() => import('./pages/admin/AdminDoctorPackages'));
const AdminExercises = lazyWithRetry(() => import('./pages/admin/AdminExercises'));
const PatientPackages = lazyWithRetry(() => import('./pages/patient/PatientPackages'));
const PatientSaved = lazyWithRetry(() => import('./pages/patient/PatientSaved'));
const PatientTreatmentJourney = lazyWithRetry(() => import('./pages/patient/PatientTreatmentJourney'));
const DoctorTreatmentJourney = lazyWithRetry(() => import('./pages/doctor/DoctorTreatmentJourney'));
const DoctorPackages = lazyWithRetry(() => import('./pages/doctor/DoctorPackages'));
const DoctorTreatmentServices = lazyWithRetry(() => import('./pages/doctor/DoctorTreatmentServices'));
const DoctorServicePackages = lazyWithRetry(() => import('./pages/doctor/DoctorServicePackages'));
const DoctorAdminPackagePrices = lazyWithRetry(() => import('./pages/doctor/DoctorAdminPackagePrices'));
const DoctorPrescriptions = lazyWithRetry(() => import('./pages/doctor/DoctorPrescriptions'));
const PatientExercises = lazyWithRetry(() => import('./pages/patient/PatientExercises'));
const PatientBills = lazyWithRetry(() => import('./pages/patient/PatientBills'));
const PatientWallet = lazyWithRetry(() => import('./pages/patient/PatientWallet'));
const PatientProgress = lazyWithRetry(() => import('./pages/patient/PatientProgress'));
const PatientVideoConsultations = lazyWithRetry(() => import('./pages/patient/PatientVideoConsultations'));
const PatientPrescriptions = lazyWithRetry(() => import('./pages/patient/PatientPrescriptions'));
const PatientConsultationPage = lazyWithRetry(() => import('./pages/patient/PatientConsultationPage'));
const DoctorConsultationPage = lazyWithRetry(() => import('./pages/doctor/DoctorConsultationPage'));
const DoctorConsultationRoomsPage = lazyWithRetry(() => import('./pages/doctor/DoctorConsultationRoomsPage'));
const ClinicConsultationPage = lazyWithRetry(() => import('./pages/clinic/ClinicConsultationPage'));
const ClinicConsultationRoomsPage = lazyWithRetry(() => import('./pages/clinic/ClinicConsultationRoomsPage'));
import PhysioFeed from './pages/PhysioFeed';
import PhysioFeedDetail from './pages/PhysioFeedDetail';
const AdminPhysioFeed = lazyWithRetry(() => import('./pages/admin/AdminPhysioFeed'));
const AdminAbout = lazyWithRetry(() => import('./pages/admin/AdminAbout'));
const AdminHomePhysio = lazyWithRetry(() => import('./pages/admin/AdminHomePhysio'));
const AdminTelePhysio = lazyWithRetry(() => import('./pages/admin/AdminTelePhysio'));
const AdminKinesteX = lazyWithRetry(() => import('./pages/admin/AdminKinesteX'));
const AdminOffers = lazyWithRetry(() => import('./pages/admin/AdminOffers'));
const AdminOffersSubmissionReview = lazyWithRetry(() => import('./pages/admin/AdminOffersSubmissionReview'));
const AdminHomeHero = lazyWithRetry(() => import('./pages/admin/AdminHomeHero'));
const AdminHomeImages = lazyWithRetry(() => import('./pages/admin/AdminHomeImages'));
const AdminHomeBanners = lazyWithRetry(() => import('./pages/admin/AdminHomeBanners'));
const AdminTestimonials = lazyWithRetry(() => import('./pages/admin/AdminTestimonials'));
const AdminPhysioTeam = lazyWithRetry(() => import('./pages/admin/AdminPhysioTeam'));
const AdminOrgLogos = lazyWithRetry(() => import('./pages/admin/AdminOrgLogos'));
const AdminBadges = lazyWithRetry(() => import('./pages/admin/AdminBadges'));
const AdminCoupons = lazyWithRetry(() => import('./pages/admin/AdminCoupons'));
const AdminReviews = lazyWithRetry(() => import('./pages/admin/AdminReviews'));
const AdminAnalytics = lazyWithRetry(() => import('./pages/admin/AdminAnalytics'));
const AdminCareers = lazyWithRetry(() => import('./pages/admin/AdminCareers'));
import { ADMIN_NAV } from './constants/adminNav';

import { DOCTOR_NAV } from './constants/doctorNav';
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
      <ForceTempPasswordChange />
      <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
            <span className="sr-only">Loading…</span>
            <div className="h-10 w-10 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          </div>
        }
      >
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
      <Route path="/pay/invoice/:token" element={<PayInvoicePage />} />
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
      <Route path="/home-physiotherapy" element={<HomePhysiotherapyPage />} />
      <Route path="/telephysio" element={<TelePhysioPage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cancellation-help" element={<CancellationHelpPage />} />
      <Route path="/license" element={<LicensePage />} />
      <Route path="/sitemap" element={<HtmlSitemapPage />} />

      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><PatientAppointments /></ProtectedRoute>} />
      <Route path="/patient/packages" element={<ProtectedRoute roles={['patient']}><PatientPackages /></ProtectedRoute>} />
      <Route path="/patient/saved" element={<ProtectedRoute roles={['patient']}><PatientSaved /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><PatientReports /></ProtectedRoute>} />
      <Route path="/patient/bills" element={<ProtectedRoute roles={['patient']}><PatientBills /></ProtectedRoute>} />
      <Route path="/patient/wallet" element={<ProtectedRoute roles={['patient']}><PatientWallet /></ProtectedRoute>} />
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
      <Route path="/doctor/consultation-rooms" element={<ProtectedRoute roles={['doctor']}><DoctorConsultationRoomsPage /></ProtectedRoute>} />
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
      <Route path="/clinic-portal/consultation-rooms" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicConsultationRoomsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/consultation/:appointmentId" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicConsultationPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/patients" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalPatients /></ProtectedRoute>} />
      <Route path="/clinic-portal/patients/:patientKey" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPatientDetailPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/prescriptions/preview" element={<PrescriptionDocumentViewPage />} />
      <Route path="/clinic-portal/earnings" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalEarnings /></ProtectedRoute>} />
      <Route path="/clinic-portal/billing" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicBillingPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/invoices" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicInvoiceGeneratorPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/notes" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicNotesPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/support" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicSupportCenterPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/search" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAdvancedSearchPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/calendar" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicCalendarPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/availability" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAvailabilityPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/availability" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAvailabilitySettingsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/packages" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPackagesPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/reports" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicReportsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/team" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicTeamPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/branding" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicBrandingPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/create-package" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicCreatePackagePage /></ProtectedRoute>} />
      <Route path="/clinic-portal/clinical-library" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicClinicalLibraryPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/qr" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicQrPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/forms" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicFormsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/assessments" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAssessmentBuilderPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/assessments/:templateId" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAssessmentBuilderPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/protocols" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicProtocolBuilderPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/protocols/:templateId" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicProtocolBuilderPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/settings/suggestion-chips" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicSuggestionChipsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/profile" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicPortalProfile /></ProtectedRoute>} />
      <Route path="/clinic-portal/notifications" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/notifications/manage" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicNotificationsManagePage /></ProtectedRoute>} />
      <Route path="/clinic-portal/communication" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicCommunicationPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/rehab" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicExerciseRehabPage /></ProtectedRoute>} />
      <Route path="/clinic-portal/back-office" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicBackOfficePage /></ProtectedRoute>} />
      <Route path="/clinic-portal/analytics-center" element={<ProtectedRoute roles={['clinic', 'clinic_staff']}><ClinicAiAnalyticsPage /></ProtectedRoute>} />
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
      <Route path="/admin/home-physio" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminHomePhysio /></ProtectedRoute>} />
      <Route path="/admin/telephysio" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTelePhysio /></ProtectedRoute>} />
      <Route path="/admin/kinestex" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminKinesteX /></ProtectedRoute>} />
      <Route path="/admin/physiotherapists" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminPhysioTeam /></ProtectedRoute>} />
      <Route path="/admin/org-logos" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminOrgLogos /></ProtectedRoute>} />
      <Route path="/admin/offers" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminOffers /></ProtectedRoute>} />
      <Route path="/admin/offers/submissions/:id" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminOffersSubmissionReview /></ProtectedRoute>} />
      <Route path="/admin/offers/review/:id" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminOffersSubmissionReview /></ProtectedRoute>} />
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
      <Route path="/admin/support" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminSupportCenterPage /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/appointment-requests" element={<ProtectedRoute roles={['admin', 'super_admin']}><AppointmentRequestsPage navItems={ADMIN_NAV} title="Doctor change requests" scope="admin" /></ProtectedRoute>} />
      <Route path="/admin/contact" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminContact /></ProtectedRoute>} />
      <Route path="/admin/careers" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCareers /></ProtectedRoute>} />

      <Route path="/admin/invoice-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminInvoiceSettings /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBillingPage /></ProtectedRoute>} />
      <Route path="/admin/zoom" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminZoomMeetings /></ProtectedRoute>} />
      <Route path="/admin/wallet" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminWallet /></ProtectedRoute>} />
      <Route path="/admin/search" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAdvancedSearchPage /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCalendarPage /></ProtectedRoute>} />
      <Route path="/admin/seo" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminSeo /></ProtectedRoute>} />
      <Route path="/admin/booking-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBookingSettings /></ProtectedRoute>} />
      <Route path="/admin/documents" element={<ProtectedRoute roles={['admin', 'super_admin']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLogs /></ProtectedRoute>} />
      <Route path="/admin/publishing" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCmsPublishing /></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLeads /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin', 'super_admin']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/admin/notification-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminNotificationSettings /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      </Suspense>
      </AppErrorBoundary>
    </SeoProvider>
  );
}
