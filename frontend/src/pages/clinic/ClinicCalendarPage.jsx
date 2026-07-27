import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import CalendarBoard from '../../components/calendar/CalendarBoard';
import useClinicPortal from '../../hooks/useClinicPortal';
import { calendar } from '../../services/api';

export default function ClinicCalendarPage() {
  const { clinicId, can, isAdminMode, loading, me } = useClinicPortal();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const canManage = isAdminMode || can('calendar.manage') || can('appointments.manage') || can('availability.manage');
  const canManageRooms = isAdminMode || can('calendar.manage') || can('settings.manage');

  useEffect(() => {
    if (loading) return;
    if (!can('calendar.view')) {
      navigate('/clinic-portal', { replace: true });
    }
  }, [loading, can, navigate]);

  useEffect(() => {
    if (!clinicId) return;
    setRoomsLoading(true);
    calendar
      .rooms(clinicId)
      .then((r) => setRooms(r.data || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [clinicId]);

  const clinicName = me?.clinic?.name || 'Your clinic';

  return (
    <ClinicPortalShell
      title="Availability"
      subtitle="Working hours, doctor schedules, rooms/beds, holidays and leave for your clinic."
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="glass-card !p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-hospital" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Clinic</p>
              <p className="font-semibold text-slate-900 truncate">{clinicName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Calendar is locked to this clinic</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-door-open" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Rooms / beds</p>
              <p className="font-semibold text-slate-900">
                {roomsLoading ? '…' : `${rooms.length} room${rooms.length === 1 ? '' : 's'}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {canManageRooms ? 'Use + Add → New room to create one' : 'Managed by Clinic Admin'}
              </p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <FaIcon icon="fa-calendar-plus" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Quick actions</p>
              <p className="font-semibold text-slate-900">{canManage ? 'Leave · Holiday · Rooms' : 'View only'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {canManage ? 'Use the Add button on the calendar toolbar' : 'Switch to Clinic Admin to edit'}
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
            lockedClinicId={clinicId}
            hideClinicFilter
            canManage={canManage}
            canManageRooms={canManageRooms}
            showDoctorFilter
            roleLabel={isAdminMode ? 'Clinic Admin' : 'Reception'}
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
    </ClinicPortalShell>
  );
}
