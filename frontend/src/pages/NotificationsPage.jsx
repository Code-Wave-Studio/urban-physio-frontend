import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import FaIcon from '../components/FaIcon';
import { notifications } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_NAV } from '../constants/adminNav';
import { DOCTOR_NAV } from '../constants/doctorNav';
import { PATIENT_NAV } from '../constants/patientNav';
import { CLINIC_NAV } from '../constants/clinicNav';
import ClinicPortalShell from '../components/clinic/ClinicPortalShell';
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
  appointment_reminder: 'Reminder',
  session_today: 'Session today',
  appointment_missed: 'Missed',
  payment_online: 'Payment',
  payment_confirmed: 'Payment',
  payment_refund: 'Refund',
  payment_reminder: 'Payment due',
  clinic_pending: 'Clinic',
  clinic_approved: 'Clinic',
  clinic_rejected: 'Clinic',
  clinic_join_request: 'Join request',
  clinic_invite: 'Invite',
  doctor_service_pending: 'Services',
  doctor_service_approved: 'Services',
  doctor_service_rejected: 'Services',
  doctor_verified: 'Verification',
  patient_report_uploaded: 'Report',
  document_uploaded: 'Document',
  document_shared: 'Document',
  career_application: 'Careers',
  user_registered: 'User',
  review_submitted: 'Review',
  contact_message: 'Contact',
  appointment_request: 'Request',
  emergency_requested: 'Emergency',
  emergency_confirmed: 'Emergency',
  emergency_assigned: 'Emergency',
  emergency_status: 'Emergency',
  exercise_reminder: 'Exercise',
  weekly_summary: 'Weekly summary',
  package_expiry: 'Package',
  sessions_remaining: 'Sessions',
  followup_reminder: 'Follow-up',
};

const PREF_CHANNELS = [
  { key: 'email', label: 'Email', icon: 'fa-envelope', hint: 'Booking updates, reminders and summaries by email' },
  { key: 'sms', label: 'SMS', icon: 'fa-comment-sms', hint: 'Text alerts for confirmations and reminders' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', hint: 'WhatsApp messages for key updates' },
  { key: 'push', label: 'Push', icon: 'fa-bell', hint: 'App push notifications (coming soon)' },
];

function resolveRole(hasRole) {
  if (hasRole('super_admin', 'admin')) return 'admin';
  if (hasRole('clinic', 'clinic_staff')) return 'clinic';
  if (hasRole('doctor')) return 'doctor';
  return 'patient';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [list, setList] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);

  const [filters, setFilters] = useState({ type: '', is_read: '', date_from: '', date_to: '' });

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

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
    if (hasRole('clinic', 'clinic_staff')) {
      return {
        links: CLINIC_NAV,
        variant: 'clinic',
        subtitle: 'Clinic bookings, doctor joins, payments, and portal alerts.',
      };
    }
    return {
      links: PATIENT_NAV,
      variant: 'patient',
      subtitle: 'Your bookings, payments, reminders, and report updates.',
    };
  }, [user, hasRole]);

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 100 };
    if (filters.type) params.type = filters.type;
    if (filters.is_read !== '') params.is_read = filters.is_read;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    notifications
      .list(params)
      .then((res) => {
        setList(res.data?.items ?? res.data ?? []);
        if (res.data?.types) setTypes(res.data.types);
      })
      .catch((e) => toast.error(e.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!prefsOpen || prefs) return;
    notifications
      .prefs()
      .then((res) => setPrefs(res.data || {}))
      .catch(() => setPrefs({ email: true, sms: true, whatsapp: true, push: true }));
  }, [prefsOpen, prefs]);

  const unread = useMemo(() => list.filter((n) => !n.is_read), [list]);
  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const hasFilters = Object.values(filters).some(Boolean);

  const notifyUpdated = () => window.dispatchEvent(new Event('notifications-updated'));

  const markAll = async () => {
    try {
      await notifications.markAllRead();
      toast.success('All marked read');
      load();
      notifyUpdated();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const clearRead = async () => {
    if (!window.confirm('Delete all read notifications? This cannot be undone.')) return;
    try {
      await notifications.clearRead();
      toast.success('Read notifications cleared');
      load();
      notifyUpdated();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const toggleRead = async (n) => {
    try {
      if (n.is_read) {
        await notifications.markUnread([n.id]);
      } else {
        await notifications.markRead([n.id]);
      }
      setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: n.is_read ? 0 : 1 } : item)));
      notifyUpdated();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const deleteOne = async (n) => {
    try {
      await notifications.remove(n.id);
      setList((prev) => prev.filter((item) => item.id !== n.id));
      notifyUpdated();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const savePref = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsSaving(true);
    try {
      await notifications.updatePrefs(next);
    } catch (e) {
      toast.error(e.message || 'Could not save preference');
      setPrefs(prefs);
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleOpen = async (n) => {
    const path = getNotificationPath(n, roleSlug);
    if (!path) return;

    setOpeningId(n.id);
    try {
      if (!n.is_read) {
        await notifications.markRead([n.id]);
        setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item)));
        notifyUpdated();
      }
      navigate(path);
    } catch (e) {
      toast.error(e.message || 'Could not open notification');
    } finally {
      setOpeningId(null);
    }
  };

  const Layout = variant === 'clinic' ? ClinicPortalShell : DashboardLayout;
  const layoutProps =
    variant === 'clinic'
      ? {
          title: 'Notifications',
          subtitle,
          actions: (
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" className="btn-outline text-sm !py-2" onClick={() => setPrefsOpen((v) => !v)}>
                <FaIcon icon="fa-sliders" className="mr-1.5" /> Preferences
              </button>
              <button type="button" className="btn-outline text-sm !py-2" onClick={clearRead}>
                <FaIcon icon="fa-broom" className="mr-1.5" /> Clear read
              </button>
              <button type="button" className="btn-primary text-sm !py-2" onClick={markAll} disabled={!unread.length}>
                Mark all read
              </button>
            </div>
          ),
        }
      : { links, variant };

  return (
    <Layout {...layoutProps}>
      {variant !== 'clinic' && (
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn-outline text-sm !py-2"
            onClick={() => setPrefsOpen((v) => !v)}
          >
            <FaIcon icon="fa-sliders" className="mr-1.5" /> Preferences
          </button>
          <button type="button" className="btn-outline text-sm !py-2" onClick={clearRead}>
            <FaIcon icon="fa-broom" className="mr-1.5" /> Clear read
          </button>
          <button type="button" className="btn-primary text-sm !py-2" onClick={markAll} disabled={!unread.length}>
            Mark all read
          </button>
        </div>
      </div>
      )}

      {prefsOpen && (
        <div className="glass-card !p-4 md:!p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-900">
              <FaIcon icon="fa-sliders" className="mr-2 text-primary-600" />
              Notification preferences
            </p>
            {prefsSaving && <span className="text-xs text-slate-400">Saving…</span>}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            In-app notifications are always on. Choose how else you want to be notified.
          </p>
          {!prefs ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREF_CHANNELS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 cursor-pointer"
                >
                  <FaIcon icon={c.icon} className="text-primary-600 w-5 text-center" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{c.label}</span>
                    <span className="block text-[11px] text-slate-400">{c.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-teal-600"
                    checked={!!prefs[c.key]}
                    onChange={(e) => savePref(c.key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          className="input-field !w-auto !py-1.5 text-sm"
          value={filters.type}
          onChange={(e) => setF('type', e.target.value)}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
        <select
          className="input-field !w-auto !py-1.5 text-sm"
          value={filters.is_read}
          onChange={(e) => setF('is_read', e.target.value)}
        >
          <option value="">Read &amp; unread</option>
          <option value="0">Unread only</option>
          <option value="1">Read only</option>
        </select>
        <input
          type="date"
          className="input-field !w-auto !py-1.5 text-sm"
          value={filters.date_from}
          onChange={(e) => setF('date_from', e.target.value)}
          aria-label="From date"
        />
        <span className="text-slate-400 text-sm">to</span>
        <input
          type="date"
          className="input-field !w-auto !py-1.5 text-sm"
          value={filters.date_to}
          onChange={(e) => setF('date_to', e.target.value)}
          aria-label="To date"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters({ type: '', is_read: '', date_from: '', date_to: '' })}
            className="text-sm text-slate-500 hover:text-primary-600"
          >
            <FaIcon icon="fa-xmark" className="mr-1" /> Clear
          </button>
        )}
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
          <p className="text-slate-700 font-semibold">No notifications{hasFilters ? ' match your filters' : ' yet'}</p>
          <p className="text-sm text-slate-500 mt-1">
            {hasFilters ? 'Try clearing the filters above.' : 'You will be alerted when something important happens.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n) => {
            const path = getNotificationPath(n, roleSlug);
            const clickable = Boolean(path);
            return (
              <div
                key={n.id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => handleOpen(n) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === 'Enter') handleOpen(n); } : undefined}
                className={`glass-card !p-4 md:!p-5 transition-all duration-200 ${
                  n.is_read ? '' : 'ring-2 ring-primary-200/60 bg-primary-50/30'
                } ${clickable ? 'cursor-pointer hover:shadow-md hover:border-primary-200/80' : ''}`}
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
                      {!n.is_read && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDateTime(n.created_at)}
                      {clickable && (
                        <span className="text-primary-600 font-medium ml-3">
                          <FaIcon icon="fa-arrow-right" className="text-[10px] mr-1" />
                          {openingId === n.id ? 'Opening…' : 'Tap to open'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRead(n); }}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition"
                      title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <FaIcon icon={n.is_read ? 'fa-envelope' : 'fa-envelope-open'} className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteOne(n); }}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <FaIcon icon="fa-trash" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
