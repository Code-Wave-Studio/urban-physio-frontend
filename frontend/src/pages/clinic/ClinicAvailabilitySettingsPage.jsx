import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import CapacitySettingsPanel from '../../components/calendar/CapacitySettingsPanel';
import useClinicPortal from '../../hooks/useClinicPortal';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Availability Settings page.
 * Contains: Working Hours, Slot Capacity Management (Feature 8, 13).
 */
export default function ClinicAvailabilitySettingsPage() {
  const { clinicId, can, isAdminMode, loading } = useClinicPortal();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdminMode && !can('availability.manage') && !can('settings.manage')) {
      navigate('/clinic-portal', { replace: true });
    }
  }, [loading, can, isAdminMode, navigate]);

  return (
    <ClinicPortalShell
      title="Availability Settings"
      subtitle="Configure working hours, slot duration, and appointment capacity"
    >
      <div className="max-w-2xl space-y-6">
        {/* Slot Capacity Management */}
        {clinicId && (
          <CapacitySettingsPanel clinicId={clinicId} />
        )}

        {/* Link to calendar for schedule management */}
        <div className="glass-card flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12z" />
              <path fillRule="evenodd" d="M3 4.75A.75.75 0 013.75 4h12.5a.75.75 0 01.75.75V7.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 7.5V4.75zM4.5 5.5v1.5h11V5.5h-11z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.75 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 016.75 1zm6.5 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM3 7.25a.75.75 0 01.75-.75h12.5a.75.75 0 01.75.75v9a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-9z" clipRule="evenodd" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">Doctor Schedule & Working Hours</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage doctor availability slots, working days, break times, holidays and leave from the Calendar.
            </p>
            <a
              href="/clinic-portal/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline mt-2"
            >
              Open Calendar
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </ClinicPortalShell>
  );
}
