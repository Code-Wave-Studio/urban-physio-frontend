import DashboardLayout from '../../layouts/DashboardLayout';
import CalendarBoard from '../../components/calendar/CalendarBoard';
import { DOCTOR_NAV } from '../../constants/doctorNav';

export default function DoctorCalendarPage() {
  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your schedule, appointments, room bookings, holidays and leave — weekly &amp; monthly planner.
        </p>
      </div>
      <CalendarBoard canManage canManageRooms={false} showDoctorFilter={false} roleLabel="Doctor" />
    </DashboardLayout>
  );
}
