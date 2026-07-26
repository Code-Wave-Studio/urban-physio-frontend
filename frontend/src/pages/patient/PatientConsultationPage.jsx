import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ConsultationRoom from '../../components/consultation/ConsultationRoom';
import { PATIENT_NAV } from '../../constants/patientNav';

function PatientConsultLayout({ children }) {
  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      {children}
    </DashboardLayout>
  );
}

export default function PatientConsultationPage() {
  const { appointmentId } = useParams();
  return (
    <ConsultationRoom
      appointmentId={appointmentId}
      backTo="/patient/video-consultations"
      layout={PatientConsultLayout}
    />
  );
}
