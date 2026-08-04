import AppointmentsManager from '../../components/appointments/AppointmentsManager';
import { DOCTOR_NAV } from '../../constants/doctorNav';

export default function DoctorConsultationRoomsPage() {
  return (
    <AppointmentsManager
      view="doctor"
      title="Consultation Rooms"
      subtitle="Reopen active & past consultation rooms to view chat, documents, and edit prescriptions"
      links={DOCTOR_NAV}
      defaultSort="newest"
    />
  );
}
