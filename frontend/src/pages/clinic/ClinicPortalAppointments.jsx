import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';

export default function ClinicPortalAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await clinicPortal.me();
      const id = (meRes.data || meRes).clinic?.id;
      if (!id) return;
      const ov = await clinicPortal.overview(id);
      setRows((ov.data || ov).recent_appointments || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Recent clinic bookings. Full calendar, walk-ins, and reception tools ship in the next portal phase.
          </p>
        </div>
        <div className="glass-card !p-5 overflow-x-auto">
          {loading ? (
            <div className="h-32 animate-pulse bg-slate-100 rounded-xl" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 text-left">
                <tr>
                  <th className="py-2">Booking</th>
                  <th className="py-2">Patient</th>
                  <th className="py-2">Doctor</th>
                  <th className="py-2">When</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-2 font-mono text-xs">{a.booking_id || a.id}</td>
                    <td className="py-2">{a.patient_name || '—'}</td>
                    <td className="py-2">{a.doctor_name || '—'}</td>
                    <td className="py-2 text-slate-500">
                      {a.appointment_date} {a.start_time || ''}
                    </td>
                    <td className="py-2 capitalize">{a.consultation_type || '—'}</td>
                    <td className="py-2 capitalize">{a.status}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No appointments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
