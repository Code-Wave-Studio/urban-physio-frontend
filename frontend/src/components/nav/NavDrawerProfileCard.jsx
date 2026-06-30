import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import DoctorAvatar from '../DoctorAvatar';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function MiniStat({ label, value, badge }) {
  return (
    <div className="rounded-xl bg-white/70 border border-white/80 px-2.5 py-2 text-center min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate">{label}</p>
      <p className="text-base font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
        {value}
        {badge > 0 && (
          <span className="inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </p>
    </div>
  );
}

function PatientAvatar({ user, className = '' }) {
  const src = resolveMediaUrl(user?.avatar);
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-md shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-orange-500 text-white font-bold text-lg flex items-center justify-center ring-2 ring-white shadow-md shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

function GuestLoginCard({ onNavigate }) {
  return (
    <div className="nav-drawer-profile-card relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-primary-500/10 via-white to-orange-500/10 p-4 shadow-[0_8px_32px_-12px_rgba(249,115,22,0.35)]">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary-200/30 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/80 border border-white flex items-center justify-center text-primary-600 shadow-sm shrink-0">
          <FaIcon icon="fa-user" className="text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-lg leading-tight">Welcome to The Urban Physio</p>
          <p className="text-sm text-slate-600 mt-1">Sign in to book faster and manage your care.</p>
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-2 mt-4">
        <Link
          to="/patient/login"
          onClick={onNavigate}
          className="btn-primary text-center text-sm !py-2.5 !px-3"
        >
          Patient login
        </Link>
        <Link
          to="/doctor/login"
          onClick={onNavigate}
          className="btn-outline text-center text-sm !py-2.5 !px-3"
        >
          Doctor login
        </Link>
      </div>
    </div>
  );
}

function PatientProfileCard({ user, summary, loading, onNavigate }) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Patient';
  const notifPath = '/patient/notifications';

  return (
    <div className="nav-drawer-profile-card relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-primary-500/10 via-white to-orange-500/10 p-4 shadow-[0_8px_32px_-12px_rgba(249,115,22,0.35)]">
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary-200/25 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <PatientAvatar user={user} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-lg leading-tight truncate">{name}</p>
          <Link
            to="/patient/profile"
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mt-0.5 hover:text-primary-800"
          >
            Edit profile
            <FaIcon icon="fa-chevron-right" className="text-[10px]" />
          </Link>
          {summary.hasMembership && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
              <FaIcon icon="fa-crown" className="text-[9px]" />
              Active package
            </span>
          )}
        </div>
        <Link
          to={notifPath}
          onClick={onNavigate}
          className="relative shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-white flex items-center justify-center text-slate-600 shadow-sm"
          aria-label={
            summary.unreadNotifications > 0
              ? `${summary.unreadNotifications} unread notifications`
              : 'Notifications'
          }
        >
          <FaIcon icon="fa-bell" />
          {summary.unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
              {summary.unreadNotifications > 99 ? '99+' : summary.unreadNotifications}
            </span>
          )}
        </Link>
      </div>
      <div className="relative flex gap-2 mt-3">
        <MiniStat label="Upcoming" value={loading ? '—' : summary.upcomingAppointments} />
        <MiniStat label="Sessions left" value={loading ? '—' : summary.pendingSessions} />
      </div>
      <Link
        to="/book"
        onClick={onNavigate}
        className="relative mt-3 btn-primary w-full text-center text-sm !py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
      >
        <FaIcon icon="fa-calendar-plus" />
        Book Appointment
      </Link>
    </div>
  );
}

function DoctorProfileCard({ user, summary, loading, onNavigate }) {
  const profile = summary.doctorProfile || {};
  const name =
    [profile.first_name || user.first_name, profile.last_name || user.last_name].filter(Boolean).join(' ') ||
    'Doctor';
  const qualification = profile.specialization || profile.qualification || 'Physiotherapist';
  const rating = profile.rating_avg ? Number(profile.rating_avg).toFixed(1) : '—';
  const experience = profile.experience_years ? `${profile.experience_years}+ yrs` : '—';
  const verified = Number(profile.is_verified) === 1;

  return (
    <div className="nav-drawer-profile-card relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-violet-500/10 via-white to-primary-500/10 p-4 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.3)]">
      <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-violet-200/30 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <DoctorAvatar doctor={{ ...profile, first_name: profile.first_name || user.first_name, last_name: profile.last_name || user.last_name, avatar: profile.avatar || user.avatar }} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 text-lg leading-tight truncate">{name}</p>
            {verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                <FaIcon icon="fa-circle-check" className="text-[9px]" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5 truncate">{qualification}</p>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1">
              <FaIcon icon="fa-star" className="text-amber-500 text-[10px]" />
              {rating}
            </span>
            <span>{experience}</span>
          </p>
        </div>
      </div>
      <div className="relative flex gap-2 mt-3">
        <MiniStat label="Today" value={loading ? '—' : summary.todayAppointments} />
        <MiniStat label="Pending" value={loading ? '—' : summary.pendingRequests} />
        <MiniStat
          label="Alerts"
          value={loading ? '—' : summary.unreadNotifications}
          badge={summary.unreadNotifications}
        />
      </div>
      <Link
        to="/doctor/appointments"
        onClick={onNavigate}
        className="relative mt-3 btn-primary w-full text-center text-sm !py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
      >
        <FaIcon icon="fa-calendar-check" />
        Manage Appointments
      </Link>
    </div>
  );
}

function AdminProfileCard({ user, summary, loading, onNavigate }) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Admin';

  return (
    <div className="nav-drawer-profile-card relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-slate-800/5 via-white to-primary-500/10 p-4 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.2)]">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-300/30 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-lg flex items-center justify-center ring-2 ring-white shadow-md shrink-0">
          {(user.first_name?.[0] || 'A').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-lg leading-tight truncate">{name}</p>
          <p className="text-sm text-slate-500 mt-0.5">Platform administrator</p>
        </div>
        {summary.unreadNotifications > 0 && (
          <Link
            to="/admin/notifications"
            onClick={onNavigate}
            className="relative shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-white flex items-center justify-center text-slate-600 shadow-sm"
          >
            <FaIcon icon="fa-bell" />
            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
              {summary.unreadNotifications > 99 ? '99+' : summary.unreadNotifications}
            </span>
          </Link>
        )}
      </div>
      <div className="relative grid grid-cols-2 gap-2 mt-3">
        <MiniStat label="Users" value={loading ? '—' : summary.totalUsers} />
        <MiniStat label="Clinics" value={loading ? '—' : summary.clinics} />
        <MiniStat label="Doctors" value={loading ? '—' : summary.totalDoctors} />
        <MiniStat label="Pending" value={loading ? '—' : summary.adminPendingRequests} />
      </div>
      <Link
        to="/admin"
        onClick={onNavigate}
        className="relative mt-3 btn-primary w-full text-center text-sm !py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
      >
        <FaIcon icon="fa-gauge-high" />
        Open Dashboard
      </Link>
    </div>
  );
}

export default function NavDrawerProfileCard({ user, hasRole, summary, loading, onNavigate }) {
  if (!user) return <GuestLoginCard onNavigate={onNavigate} />;
  if (hasRole('super_admin', 'admin')) {
    return <AdminProfileCard user={user} summary={summary} loading={loading} onNavigate={onNavigate} />;
  }
  if (hasRole('doctor')) {
    return <DoctorProfileCard user={user} summary={summary} loading={loading} onNavigate={onNavigate} />;
  }
  if (hasRole('patient')) {
    return <PatientProfileCard user={user} summary={summary} loading={loading} onNavigate={onNavigate} />;
  }
  return <GuestLoginCard onNavigate={onNavigate} />;
}
