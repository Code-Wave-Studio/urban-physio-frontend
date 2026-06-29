import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminDashboardLayout from '../layouts/AdminDashboardLayout';
import { appointmentRequests } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TYPE_LABEL = {
  reschedule: 'Reschedule',
  cancel: 'Cancellation',
  doctor_change: 'Doctor change',
};

export default function AppointmentRequestsPage({ navItems, title = 'Appointment Requests', scope }) {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = scope === 'admin' || (!scope && hasRole('admin', 'super_admin'));
  const isDoctor = scope === 'doctor' || (!scope && hasRole('doctor') && !isAdmin);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => searchParams.get('status') || 'pending');
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await appointmentRequests.list(params);
      const payload = res?.data ?? res;
      setRequests(Array.isArray(payload) ? payload : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id, status, extra = {}) => {
    setReviewing(id);
    try {
      await appointmentRequests.review(id, { status, ...extra });
      toast.success(status === 'approved' ? 'Request approved' : 'Request rejected');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewing(null);
    }
  };

  const Layout = isAdmin ? AdminDashboardLayout : DashboardLayout;
  const layoutProps = isAdmin ? {} : { links: navItems, variant: 'doctor' };

  return (
    <Layout {...layoutProps}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {isAdmin && (
            <p className="text-sm text-slate-600 mt-1">
              Reschedule and cancellation requests are reviewed by the assigned doctor.
            </p>
          )}
          {isDoctor && (
            <p className="text-sm text-slate-600 mt-1">
              Approve or reject patient reschedule and cancellation requests for your appointments.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-500">
            {isAdmin ? 'No doctor change requests found.' : 'No reschedule or cancellation requests found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <article key={r.id} className="glass-card p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{TYPE_LABEL[r.request_type] || r.request_type}</p>
                    <p className="text-sm text-slate-600">
                      Booking {r.booking_id} · {r.patient_first_name} {r.patient_last_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Dr. {r.doctor_first_name} {r.doctor_last_name} · {r.appointment_date}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{r.reason}</p>
                {r.request_type === 'reschedule' && r.requested_date && (
                  <p className="text-sm text-primary-700">
                    Requested: {r.requested_date} at {String(r.requested_start_time || '').slice(0, 5)}
                  </p>
                )}
                {r.request_type === 'doctor_change' && r.requested_doctor_first_name && (
                  <p className="text-sm text-primary-700">
                    Requested doctor: Dr. {r.requested_doctor_first_name} {r.requested_doctor_last_name}
                  </p>
                )}
                {r.status === 'pending' &&
                  ((isAdmin && r.request_type === 'doctor_change') ||
                    (isDoctor && r.request_type !== 'doctor_change')) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={reviewing === r.id}
                      className="btn-primary text-sm !py-2"
                      onClick={() =>
                        review(r.id, 'approved', {
                          requested_date: r.requested_date,
                          requested_start_time: r.requested_start_time,
                          assigned_doctor_id: r.requested_doctor_id,
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={reviewing === r.id}
                      className="btn-outline text-sm !py-2 text-red-700 border-red-200"
                      onClick={() => review(r.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {r.status === 'pending' && r.request_type === 'doctor_change' && isDoctor && (
                  <p className="text-xs text-amber-700">Doctor change requests are reviewed by admin.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
