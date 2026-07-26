import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import FaIcon from '../components/FaIcon';
import DocumentsManager from '../components/documents/DocumentsManager';
import ClinicPortalShell from '../components/clinic/ClinicPortalShell';
import { useAuth } from '../contexts/AuthContext';
import { PATIENT_NAV } from '../constants/patientNav';
import { DOCTOR_NAV } from '../constants/doctorNav';
import { ADMIN_NAV } from '../constants/adminNav';

function navFor(role) {
  if (role === 'doctor') return { links: DOCTOR_NAV, variant: 'doctor' };
  if (role === 'admin' || role === 'super_admin') return { links: ADMIN_NAV, variant: 'admin' };
  return { links: PATIENT_NAV, variant: 'patient' };
}

const COPY = {
  patient: 'Store and share X-rays, reports, prescriptions, bills and more with your care team.',
  doctor: 'Manage assessments, reports, treatment plans and patient documents in one secure place.',
  clinic: 'Upload clinic documents, share with patients and doctors, and keep medical records organised.',
  admin: 'Full oversight of every document across patients, doctors and clinics.',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const role = user?.role_slug || 'patient';
  const isClinic = role === 'clinic' || role === 'clinic_staff';
  const { links, variant } = navFor(role);
  const [searchParams] = useSearchParams();

  const initialFilters = {};
  const appointmentId = searchParams.get('appointment_id');
  const patientId = searchParams.get('patient_id');
  const category = searchParams.get('category');
  if (appointmentId) initialFilters.appointment_id = appointmentId;
  if (patientId) initialFilters.patient_id = patientId;
  if (category) initialFilters.category = category;

  const body = (
    <>
      {!isClinic && (
        <div className="mb-5 md:mb-6 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            <FaIcon icon="fa-folder-tree" className="text-lg" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">{COPY[variant] || COPY.patient}</p>
          </div>
        </div>
      )}
      <DocumentsManager initialFilters={initialFilters} />
    </>
  );

  if (isClinic) {
    return (
      <ClinicPortalShell title="Documents" subtitle={COPY.clinic}>
        {body}
      </ClinicPortalShell>
    );
  }

  return (
    <DashboardLayout links={links} variant={variant}>
      {body}
    </DashboardLayout>
  );
}
