import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import FaIcon from '../components/FaIcon';
import { notifications } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_NAV } from '../constants/adminNav';
import { DOCTOR_NAV } from '../constants/doctorNav';
import { PATIENT_NAV } from '../constants/patientNav';
import { getNotificationPath } from '../utils/notificationRoutes';
import toast from 'react-hot-toast';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TYPE_LABELS = {
  appointment_booked: 'Booking',
  appointment_confirmed: 'Confirmed',
  appointment_status: 'Appointment',
  appointment_completed: 'Completed',
  appointment_cancelled: 'Cancelled',
  payment_online: 'Payment',
  payment_confirmed: 'Payment',
  payment_refund: 'Refund',
  clinic_pending: 'Clinic',
  clinic_approved: 'Clinic',
  clinic_rejected: 'Clinic',
  doctor_service_pending: 'Services',
  doctor_service_approved: 'Services',
  doctor_service_rejected: 'Services',
  doctor_verified: 'Verification',
  patient_report_uploaded: 'Report',
  user_registered: 'User',
  review_submitted: 'Review',
  contact_message: 'Contact',
  appointment_request: 'Request',
  emergency_requested: 'Emergency',
  emergency_confirmed: 'Emergency',
  emergency_assigned: 'Emergency',
  emergency_status: 'Emergency',
};

function resolveRole(hasRole) {
  if (hasRole('super_admin', 'admin')) return 'admin';
  if (hasRole('doctor')) return 'doctor';
  return 'patient';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);

  const roleSlug = useMemo(() => resolveRole(hasRole), [hasRole]);

  const { links, variant, subtitle } = useMemo(() => {
    if (hasRole('super_admin', 'admin')) {
      return {
        links: ADMIN_NAV,
        variant: 'admin',
        subtitle: 'Bookings, clinics, payments, registrations, and platform alerts.',
      };
    }
    if (hasRole('doctor')) {
      return {
        links: DOCTOR_NAV,
        variant: 'doctor',
        subtitle: 'Appointments, clinics, payments, reviews, and patient reports.',
      };
    }
    return {
      links: PATIENT_NAV,
      variant: 'patient',
      subtitle: 'Your bookings, payments, and report updates.',
    };
  }, [user, hasRole]);

  const load = () => {
    setLoading(true);
    notifications
      .list({ limit: 100 })
      .then((res) => setList(res.data?.items ?? res.data ?? []))
      .catch((e) => toast.error(e.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const unread = useMemo(() => list.filter((n) => !n.is_read), [list]);

  const markAll = async () => {
    try {
      await notifications.markAllRead();
      toast.success('All marked read');
      load();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleOpen = async (n) => {
    const path = getNotificationPath(n, roleSlug);
    if (!path) {
      toast.error('No linked page for this notification');
      return;
    }

    setOpeningId(n.id);
    try {
      if (!n.is_read) {
        await notifications.markRead([n.id]);
        setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item)));
        window.dispatchEvent(new Event('notifications-updated'));
      }
      navigate(path);
    } catch (e) {
      toast.error(e.message || 'Could not open notification');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <DashboardLayout links={links} variant={variant}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
        </div>
        <button type="button" className="btn-outline text-sm shrink-0 self-start sm:self-auto" onClick={markAll} disabled={!unread.length}>
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-20 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="glass-card text-center py-12 md:py-16 px-6">
          <FaIcon icon="fa-bell" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold">No notifications yet</p>
          <p className="text-sm text-slate-500 mt-1">You will be alerted when something important happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n) => {
            const path = getNotificationPath(n, roleSlug);
            const clickable = Boolean(path);
            return (
              <button
                key={n.id}
                type="button"
                disabled={!clickable || openingId === n.id}
                onClick={() => handleOpen(n)}
                className={`w-full text-left glass-card !p-4 md:!p-5 transition-all duration-200 ${
                  n.is_read ? '' : 'ring-2 ring-primary-200/60 bg-primary-50/30'
                } ${
                  clickable
                    ? 'cursor-pointer hover:shadow-md hover:border-primary-200/80 active:scale-[0.995]'
                    : 'cursor-default opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      {n.type && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {TYPE_LABELS[n.type] || n.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.created_at)}</p>
                    {clickable && (
                      <p className="text-xs text-primary-600 font-medium mt-2 inline-flex items-center gap-1">
                        <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                        {openingId === n.id ? 'Opening…' : 'Tap to open'}
                      </p>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200 shrink-0">
                      New
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
