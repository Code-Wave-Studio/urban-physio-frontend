import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import CalendarBoard from '../../components/calendar/CalendarBoard';
import useClinicPortal from '../../hooks/useClinicPortal';
import { calendar } from '../../services/api';

export default function ClinicCalendarPage() {
  const { clinicId, can, isAdminMode, loading } = useClinicPortal();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSeed, setBookingSeed] = useState({});
  const [boardKey, setBoardKey] = useState(0);

  const canManage =
    isAdminMode || can('calendar.manage') || can('appointments.manage') || can('availability.manage');
  const canManageRooms = isAdminMode || can('calendar.manage') || can('settings.manage');
  const canBook = can('appointments.manage');
  // rooms state kept for backward-compat CalendarBoard internal usage

  useEffect(() => {
    if (loading) return;
    if (!can('calendar.view')) {
      navigate('/clinic-portal', { replace: true });
    }
  }, [loading, can, navigate]);

  const loadRooms = useCallback(() => {
    if (!clinicId) return;
    setRoomsLoading(true);
    calendar
      .rooms(clinicId)
      .then((r) => setRooms(r.data || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [clinicId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openBooking = (seed = {}) => {
    setBookingSeed(seed || {});
    setBookingOpen(true);
  };

  return (
    <ClinicPortalShell
      title="Calendar"
      subtitle="Day · Week · Month · Agenda"
      actions={
        canBook ? (
          <button type="button" className="btn-primary text-sm" onClick={() => openBooking()}>
            <FaIcon icon="fa-calendar-plus" className="mr-1.5" />
            Book
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        {!clinicId && !loading ? (
          <div className="glass-card text-center py-10 text-slate-500">
            <FaIcon icon="fa-triangle-exclamation" className="text-3xl text-amber-400 mb-2" />
            <p>Clinic context is missing. Refresh or re-login to the portal.</p>
            <button type="button" className="btn-outline mt-4" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        ) : (
          <CalendarBoard
            key={boardKey}
            lockedClinicId={clinicId}
            hideClinicFilter
            canManage={canManage}
            canManageRooms={canManageRooms}
            showDoctorFilter
            roleLabel={isAdminMode ? 'Clinic Admin' : 'Reception'}
            canBook={canBook}
            onBookAppointment={openBooking}
          />
        )}

        {/* Slot capacity summary injected by CalendarBoard */}
      </div>

      <ClinicBookingModal
        clinicId={clinicId}
        open={bookingOpen}
        initialDate={bookingSeed.date}
        initialDoctorId={bookingSeed.doctor_id}
        initialStartTime={bookingSeed.start_time}
        initialEndTime={bookingSeed.end_time}
        onClose={() => setBookingOpen(false)}
        onBooked={() => {
          setBoardKey((k) => k + 1);
          loadRooms();
        }}
      />
    </ClinicPortalShell>
  );
}
