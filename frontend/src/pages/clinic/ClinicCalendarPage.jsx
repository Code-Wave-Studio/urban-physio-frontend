import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import CalendarBoard from '../../components/calendar/CalendarBoard';
import useClinicPortal from '../../hooks/useClinicPortal';
import { calendar } from '../../services/api';

export default function ClinicCalendarPage() {
  const { clinicId, can, isAdminMode, loading, me } = useClinicPortal();
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

  const clinicName = me?.clinic?.name || 'Your clinic';

  return (
    <ClinicPortalShell
      title="Calendar"
      subtitle="Day · Week · Month · Agenda — appointments, team schedule, leave, holidays and rooms"
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
        <div className="portal-kpi-grid md:!grid-cols-3">
          <div className="glass-card !p-3 sm:!p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-hospital" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Clinic</p>
              <p className="font-semibold text-slate-900 truncate">{clinicName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Appointments + availability in one board</p>
            </div>
          </div>
          <div className="glass-card !p-3 sm:!p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-door-open" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Rooms / beds</p>
              <p className="font-semibold text-slate-900">
                {roomsLoading ? '…' : `${rooms.length} room${rooms.length === 1 ? '' : 's'}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {canManageRooms ? 'Add → New room on the toolbar' : 'Managed by Clinic Admin'}
              </p>
            </div>
          </div>
          <div className="glass-card !p-3 sm:!p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-layer-group" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Views</p>
              <p className="font-semibold text-slate-900">Day · Week · Month · Agenda</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter appointments, leave, holidays, rooms & availability
              </p>
            </div>
          </div>
        </div>

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

        {canManageRooms && rooms.length === 0 && clinicId && !roomsLoading && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <span>No rooms yet — add treatment rooms or beds so you can book them on the calendar.</span>
            <button
              type="button"
              className="btn-outline text-xs !py-2 shrink-0"
              onClick={() => toast('Open + Add → New room on the calendar toolbar')}
            >
              <FaIcon icon="fa-plus" className="mr-1" /> How to add
            </button>
          </div>
        )}
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
