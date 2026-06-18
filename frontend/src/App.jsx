import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import BookAppointmentWizard from './pages/BookAppointmentWizard';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import Conditions from './pages/Conditions';
import ConditionDetail from './pages/ConditionDetail';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientReports from './pages/patient/PatientReports';
import PatientProfile from './pages/patient/PatientProfile';
import AdminInvoiceSettings from './pages/admin/AdminInvoiceSettings';
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
import ContactPage from './pages/ContactPage';
import CancellationHelpPage from './pages/CancellationHelpPage';
import EmergencyBookingWizard from './pages/EmergencyBookingWizard';
import DoctorEmergency from './pages/doctor/DoctorEmergency';
import AdminEmergency from './pages/admin/AdminEmergency';
import SearchResultsPage from './pages/SearchResultsPage';
import DoctorCustomSlots from './pages/doctor/DoctorCustomSlots';
import AppointmentRequestsPage from './pages/AppointmentRequestsPage';
import TreatmentPackages from './pages/TreatmentPackages';
import ExerciseLibrary from './pages/ExerciseLibrary';
import AdminTreatmentPackages from './pages/admin/AdminTreatmentPackages';
import AdminExercises from './pages/admin/AdminExercises';
import PatientPackages from './pages/patient/PatientPackages';
import PatientRehab from './pages/patient/PatientRehab';
import DoctorPackages from './pages/doctor/DoctorPackages';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import { ADMIN_NAV } from './constants/adminNav';
import { DOCTOR_NAV } from './constants/doctorNav';
import { PATIENT_NAV } from './constants/patientNav';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/doctors" element={<Doctors />} />
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
      <Route path="/treatments" element={<Treatments />} />
      <Route path="/treatments/:slug" element={<TreatmentDetail />} />
      <Route path="/conditions" element={<Conditions />} />
      <Route path="/conditions/:slug" element={<ConditionDetail />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/packages" element={<TreatmentPackages />} />
      <Route path="/exercises" element={<ExerciseLibrary />} />

      <Route path="/privacy-policy" element={<PolicyPage />} />
      <Route path="/terms-and-conditions" element={<PolicyPage />} />
      <Route path="/refund-policy" element={<PolicyPage />} />
      <Route path="/medical-disclaimer" element={<PolicyPage />} />
      <Route path="/data-security" element={<PolicyPage />} />
      <Route path="/service-policy" element={<PolicyPage />} />
      <Route path="/cookie-policy" element={<PolicyPage />} />

      <Route path="/faq" element={<FaqPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cancellation-help" element={<CancellationHelpPage />} />

      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><PatientAppointments /></ProtectedRoute>} />
      <Route path="/patient/packages" element={<ProtectedRoute roles={['patient']}><PatientPackages /></ProtectedRoute>} />
      <Route path="/patient/rehab" element={<ProtectedRoute roles={['patient']}><PatientRehab /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><PatientReports /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute roles={['patient']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute roles={['patient']}><NotificationsPage /></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute roles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute roles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/availability" element={<ProtectedRoute roles={['doctor']}><Navigate to="/doctor/clinic-availability" replace /></ProtectedRoute>} />
      <Route path="/doctor/earnings" element={<ProtectedRoute roles={['doctor']}><DoctorEarnings /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute roles={['doctor']}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/clinics" element={<ProtectedRoute roles={['doctor']}><DoctorClinics /></ProtectedRoute>} />
      <Route path="/doctor/clinics/new" element={<ProtectedRoute roles={['doctor']}><DoctorAddClinic /></ProtectedRoute>} />
      <Route path="/doctor/clinic-availability" element={<ProtectedRoute roles={['doctor']}><DoctorClinicAvailability /></ProtectedRoute>} />
      <Route path="/doctor/custom-slots" element={<ProtectedRoute roles={['doctor']}><DoctorCustomSlots /></ProtectedRoute>} />
      <Route path="/doctor/packages" element={<ProtectedRoute roles={['doctor']}><DoctorPackages /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute roles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/doctor/requests" element={<ProtectedRoute roles={['doctor']}><AppointmentRequestsPage navItems={DOCTOR_NAV} title="Appointment Requests" /></ProtectedRoute>} />
      <Route path="/doctor/emergency" element={<ProtectedRoute roles={['doctor']}><DoctorEmergency /></ProtectedRoute>} />
      <Route path="/doctor/notifications" element={<ProtectedRoute roles={['doctor']}><NotificationsPage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/locations" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLocations /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/clinics" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminClinics /></ProtectedRoute>} />
      <Route path="/admin/conditions" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminConditions /></ProtectedRoute>} />
      <Route path="/admin/treatments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTreatments /></ProtectedRoute>} />
      <Route path="/admin/treatment-packages" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTreatmentPackages /></ProtectedRoute>} />
      <Route path="/admin/exercises" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminExercises /></ProtectedRoute>} />
      <Route path="/admin/pain-selection" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminPainSelection /></ProtectedRoute>} />
      <Route path="/admin/emergency" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminEmergency /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/appointment-requests" element={<ProtectedRoute roles={['admin', 'super_admin']}><AppointmentRequestsPage navItems={ADMIN_NAV} title="Appointment Requests" /></ProtectedRoute>} />
      <Route path="/admin/contact" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminContact /></ProtectedRoute>} />
      <Route path="/admin/invoice-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminInvoiceSettings /></ProtectedRoute>} />
      <Route path="/admin/booking-settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBookingSettings /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLogs /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin', 'super_admin']}><NotificationsPage /></ProtectedRoute>} />
    </Routes>
  );
}
