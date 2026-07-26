import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import CalendarBoard from '../../components/calendar/CalendarBoard';

export default function AdminCalendarPage() {
  return (
    <AdminDashboardLayout>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Doctor Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide view of doctor schedules, appointments, room bookings, holidays and leave.
        </p>
      </div>
      <CalendarBoard canManage canManageRooms showDoctorFilter roleLabel="Main Admin" />
    </AdminDashboardLayout>
  );
}
