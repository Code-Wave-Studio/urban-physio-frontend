import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import CalendarBoard from '../../components/calendar/CalendarBoard';
import useClinicPortal from '../../hooks/useClinicPortal';

export default function ClinicCalendarPage() {
  const { can, isAdminMode, loading } = useClinicPortal();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!can('calendar.view')) {
      navigate('/clinic-portal', { replace: true });
    }
  }, [loading, can, navigate]);

  return (
    <ClinicPortalShell
      title="Doctor Calendar"
      subtitle="Schedules, appointments, room bookings, holidays and leave for doctors at your clinic."
    >
      <CalendarBoard
        canManage={isAdminMode || can('calendar.manage') || can('appointments.manage')}
        canManageRooms={isAdminMode || can('calendar.manage') || can('settings.manage')}
        showDoctorFilter
        roleLabel={isAdminMode ? 'Clinic Admin' : 'Reception'}
      />
    </ClinicPortalShell>
  );
}
