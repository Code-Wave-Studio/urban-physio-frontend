import { useEffect, useState } from 'react';
import { appointments, patients, doctors, admin, notifications } from '../services/api';
import { hasStoredToken } from '../utils/authSession';

const EMPTY = {
  upcomingAppointments: 0,
  pendingSessions: 0,
  unreadNotifications: 0,
  hasMembership: false,
  todayAppointments: 0,
  pendingRequests: 0,
  doctorProfile: null,
  totalUsers: 0,
  clinics: 0,
  totalDoctors: 0,
  adminPendingRequests: 0,
};

export function useNavDrawerSummary(open, user) {
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user || !hasStoredToken()) {
      setSummary(EMPTY);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const role = user.role_slug;

    const load = async () => {
      try {
        if (role === 'patient') {
          const [apptRes, creditsRes, notifRes] = await Promise.all([
            appointments.list(),
            patients.visitCredits().catch(() => ({ data: [] })),
            notifications.unreadCount().catch(() => ({ data: { unread_count: 0 } })),
          ]);
          if (cancelled) return;
          const list = apptRes.data || [];
          const today = new Date().toISOString().slice(0, 10);
          const upcoming = list.filter(
            (a) => ['pending', 'confirmed'].includes(a.status) && String(a.appointment_date).slice(0, 10) >= today
          ).length;
          const credits = creditsRes.data || [];
          const pendingSessions = credits.reduce((sum, c) => sum + Math.max(0, Number(c.remaining_visits) || 0), 0);
          setSummary({
            ...EMPTY,
            upcomingAppointments: upcoming,
            pendingSessions,
            unreadNotifications: notifRes.data?.unread_count ?? 0,
            hasMembership: credits.length > 0,
          });
          return;
        }

        if (role === 'doctor') {
          const [dashRes, notifRes] = await Promise.all([
            doctors.dashboard(),
            notifications.unreadCount().catch(() => ({ data: { unread_count: 0 } })),
          ]);
          if (cancelled) return;
          const payload = dashRes?.data ?? dashRes;
          const profile = payload?.profile || {};
          const stats = payload?.stats || {};
          setSummary({
            ...EMPTY,
            todayAppointments: Number(stats.today_count) || 0,
            pendingRequests: Number(stats.pending_count) || 0,
            unreadNotifications: notifRes.data?.unread_count ?? 0,
            doctorProfile: profile,
          });
          return;
        }

        if (role === 'admin' || role === 'super_admin') {
          const [dashRes, notifRes] = await Promise.all([
            admin.dashboard(),
            notifications.unreadCount().catch(() => ({ data: { unread_count: 0 } })),
          ]);
          if (cancelled) return;
          const s = dashRes?.data?.stats ?? dashRes?.stats ?? {};
          setSummary({
            ...EMPTY,
            totalUsers: Number(s.users) || 0,
            clinics: Number(s.clinics) || 0,
            totalDoctors: Number(s.doctors) || 0,
            adminPendingRequests:
              (Number(s.pending_appointments) || 0) + (Number(s.pending_doctors) || 0),
            unreadNotifications: notifRes.data?.unread_count ?? 0,
          });
        }
      } catch {
        if (!cancelled) setSummary(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id, user?.role_slug]);

  return { summary, loading };
}
