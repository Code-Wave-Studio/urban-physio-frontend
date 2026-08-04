import AppointmentsManager from '../../components/appointments/AppointmentsManager';
import { CLINIC_ADMIN_NAV } from '../../constants/clinicNav';

export default function ClinicConsultationRoomsPage() {
  return (
    <AppointmentsManager
      view="clinic"
      title="Consultation Rooms"
      subtitle="Reopen active & past consultation rooms to view chat, documents, and edit prescriptions"
      links={CLINIC_ADMIN_NAV}
      defaultSort="newest"
    />
  );
}
