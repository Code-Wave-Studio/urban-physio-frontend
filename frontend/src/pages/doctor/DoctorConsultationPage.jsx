import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ConsultationRoom from '../../components/consultation/ConsultationRoom';
import { DOCTOR_NAV } from '../../constants/doctorNav';

function DoctorConsultLayout({ children }) {
  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      {children}
    </DashboardLayout>
  );
}

export default function DoctorConsultationPage() {
  const { appointmentId } = useParams();
  return (
    <ConsultationRoom
      appointmentId={appointmentId}
      backTo="/doctor/appointments"
      layout={DoctorConsultLayout}
    />
  );
}
