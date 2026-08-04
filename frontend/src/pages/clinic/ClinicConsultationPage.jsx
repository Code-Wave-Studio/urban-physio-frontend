import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ConsultationRoom from '../../components/consultation/ConsultationRoom';
import { CLINIC_ADMIN_NAV } from '../../constants/clinicNav';

function ClinicConsultLayout({ children }) {
  return (
    <DashboardLayout links={CLINIC_ADMIN_NAV}>
      {children}
    </DashboardLayout>
  );
}

export default function ClinicConsultationPage() {
  const { appointmentId } = useParams();
  return (
    <ConsultationRoom
      appointmentId={appointmentId}
      backTo="/clinic-portal/consultation-rooms"
      layout={ClinicConsultLayout}
    />
  );
}
