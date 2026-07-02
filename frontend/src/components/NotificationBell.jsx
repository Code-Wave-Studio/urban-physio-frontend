import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import GlassModal, { GlassModalBody, GlassModalHeader } from './GlassModal';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '../services/api';
import { getNotificationPath } from '../utils/notificationRoutes';

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

function timeAgo(d) {
  if (!d) return '';
  const then = new Date(d).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState(null);

  const roleSlug = useMemo(() => (user ? resolveRole(hasRole) : 'patient'), [user, hasRole]);

  const refreshCount = useCallback(() => {
    if (!user) return;
    notifications
      .unreadCount()
      .then((res) => setUnread(Number(res.data?.unread_count ?? res.unread_count ?? 0)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setList([]);
      return undefined;
    }
    refreshCount();
    const onUpdate = () => refreshCount();
    window.addEventListener('notifications-updated', onUpdate);
    const poll = setInterval(refreshCount, 60000);
    return () => {
      window.removeEventListener('notifications-updated', onUpdate);
      clearInterval(poll);
    };
  }, [user, refreshCount]);

  const loadList = useCallback(() => {
    setLoading(true);
    notifications
      .list({ limit: 30 })
      .then((res) => {
        const data = res.data ?? res;
        setList(data?.items ?? data ?? []);
        if (data?.unread_count != null) setUnread(Number(data.unread_count));
      })
      .catch((e) => toast.error(e.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const openPanel = () => {
    setOpen(true);
    loadList();
  };

  const markAll = async () => {
    try {
      await notifications.markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      toast.error(e.message || 'Failed to mark read');
    }
  };

  const handleOpen = async (n) => {
    const path = getNotificationPath(n, roleSlug);
    setOpeningId(n.id);
    try {
      if (!n.is_read) {
        await notifications.markRead([n.id]);
        setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item)));
        setUnread((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event('notifications-updated'));
      }
      if (path) {
        setOpen(false);
        navigate(path);
      }
    } catch (e) {
      toast.error(e.message || 'Could not open notification');
    } finally {
      setOpeningId(null);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white/80 text-slate-700 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/50 transition shrink-0"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        title="Notifications"
      >
        <FaIcon icon="fa-bell" className="text-sm sm:text-base" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <GlassModal open={open} onClose={() => setOpen(false)} size="sm" titleId="notif-popup">
        <GlassModalHeader
          titleId="notif-popup"
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'You are all caught up'}
          icon="fa-bell"
          accent="primary"
          onClose={() => setOpen(false)}
        >
          {list.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={markAll}
              className="mt-3 text-xs font-semibold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1.5"
            >
              <FaIcon icon="fa-check-double" className="text-[11px]" />
              Mark all read
            </button>
          )}
        </GlassModalHeader>

        <GlassModalBody className="!p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FaIcon icon="fa-bell-slash" className="text-3xl text-slate-300 mb-3" />
              <p className="text-slate-700 font-semibold">No notifications yet</p>
              <p className="text-sm text-slate-500 mt-1">We&apos;ll alert you when something happens.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((n) => {
                const path = getNotificationPath(n, roleSlug);
                const clickable = Boolean(path);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      disabled={openingId === n.id}
                      onClick={() => handleOpen(n)}
                      className={`w-full text-left px-4 py-3.5 flex gap-3 transition ${
                        n.is_read ? 'hover:bg-slate-50' : 'bg-primary-50/40 hover:bg-primary-50/70'
                      } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          n.is_read ? 'bg-transparent' : 'bg-primary-500'
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm truncate">{n.title}</span>
                          {n.type && (
                            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {TYPE_LABELS[n.type] || n.type}
                            </span>
                          )}
                        </span>
                        <span className="block text-sm text-slate-600 mt-0.5 line-clamp-2">{n.message}</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {timeAgo(n.created_at)}
                          {clickable && (
                            <span className="text-primary-600 font-medium ml-2">
                              {openingId === n.id ? 'Opening…' : 'Tap to open →'}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassModalBody>
      </GlassModal>
    </>
  );
}
