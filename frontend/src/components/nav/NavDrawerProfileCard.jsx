import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { doctors as doctorsApi, clinicPortal } from '../../services/api';
import FaIcon from '../FaIcon';
import DoctorAvatar from '../DoctorAvatar';
import PatientAvatar from '../PatientAvatar';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import useClinicPortal from '../../hooks/useClinicPortal';
import ClinicRoleSwitch from '../clinic/ClinicRoleSwitch';

function MiniStat({ label, value, badge }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 text-center min-w-0 flex-1">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1 tabular-nums">
        {value}
        {badge > 0 && (
          <span className="inline-flex min-w-[1rem] h-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </p>
    </div>
  );
}

function MasterAvailabilityToggle({ isOnline, onToggle, toggling, type = 'doctor' }) {
  return (
    <div className="relative mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white/90 p-2.5 shadow-2xs backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </span>
        <div className="min-w-0 select-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
            {type === 'clinic' ? 'Clinic Status' : 'Master Availability'}
          </p>
          <p className={`text-xs font-bold leading-tight mt-0.5 ${isOnline ? 'text-emerald-700' : 'text-slate-600'}`}>
            {isOnline ? 'Online · Active & Available' : 'Offline · Instant Override'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={toggling}
        aria-pressed={isOnline}
        title={isOnline ? 'Switch to Offline' : 'Switch to Online'}
        className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isOnline ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {toggling ? (
            <span className="flex h-full w-full items-center justify-center text-slate-400">
              <FaIcon icon="fa-spinner" className="fa-spin text-[9px]" />
            </span>
          ) : (
            <span className={`flex h-full w-full items-center justify-center text-[9px] ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
              <FaIcon icon={isOnline ? 'fa-check' : 'fa-xmark'} />
            </span>
          )}
        </span>
      </button>
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
    <div className="nav-drawer-profile-card rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <PatientAvatar patient={user} size="lg" className="!w-11 !h-11 ring-2 ring-slate-100 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-semibold text-slate-900 text-[15px] leading-tight truncate">{name}</p>
            {summary.hasMembership && (
              <span className="inline-flex items-center gap-0.5 shrink-0 text-[8px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5">
                <FaIcon icon="fa-crown" className="text-[7px]" />
                Active
              </span>
            )}
          </div>
          <Link
            to="/patient/profile"
            onClick={onNavigate}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-600 mt-0.5 hover:text-primary-800"
          >
            Edit profile
            <FaIcon icon="fa-chevron-right" className="text-[8px]" />
          </Link>
        </div>
        <Link
          to={notifPath}
          onClick={onNavigate}
          className="relative shrink-0 w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500"
          aria-label={
            summary.unreadNotifications > 0
              ? `${summary.unreadNotifications} unread notifications`
              : 'Notifications'
          }
        >
          <FaIcon icon="fa-bell" className="text-sm" />
          {summary.unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5">
              {summary.unreadNotifications > 99 ? '99+' : summary.unreadNotifications}
            </span>
          )}
        </Link>
      </div>
      <div className="flex gap-2 mt-2.5">
        <MiniStat label="Upcoming" value={loading ? '—' : summary.upcomingAppointments} />
        <MiniStat label="Sessions left" value={loading ? '—' : summary.pendingSessions} />
      </div>
      <Link
        to="/book"
        onClick={onNavigate}
        className="mt-2.5 btn-primary w-full text-center text-xs !py-2.5 inline-flex items-center justify-center gap-1.5"
      >
        <FaIcon icon="fa-calendar-plus" className="text-xs" />
        Book Appointment
      </Link>
    </div>
  );
}

function DoctorProfileCard({ user, summary, loading, onNavigate }) {
  const { setUser } = useAuth();
  const [toggling, setToggling] = useState(false);
  const profile = summary.doctorProfile || {};
  const name =
    [profile.first_name || user.first_name, profile.last_name || user.last_name].filter(Boolean).join(' ') ||
    'Doctor';
  const qualification = profile.specialization || profile.qualification || 'Physiotherapist';
  const rating = profile.rating_avg ? Number(profile.rating_avg).toFixed(1) : '—';
  const experience = profile.experience_years ? `${profile.experience_years}+ yrs` : '—';
  const verified = Number(profile.is_verified) === 1;

  const isOnline = Boolean(user?.profile_public ?? profile.profile_public ?? 1);

  const toggleDoctorStatus = async () => {
    if (toggling) return;
    const next = !isOnline;
    setToggling(true);
    try {
      await doctorsApi.updateProfile({ profile_public: next ? 1 : 0 });
      setUser((u) => (u ? { ...u, profile_public: next ? 1 : 0 } : u));
      toast.success(next ? 'Master status: Online - Available for all bookings' : 'Master status: Offline - Unavailable across all modes');
    } catch (err) {
      toast.error(err.message || 'Could not update availability status');
    } finally {
      setToggling(false);
    }
  };

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

      {/* Master Online/Offline Toggle */}
      <MasterAvailabilityToggle
        isOnline={isOnline}
        onToggle={toggleDoctorStatus}
        toggling={toggling}
        type="doctor"
      />

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

function ClinicProfileCard({ user, summary, loading, onNavigate }) {
  const [toggling, setToggling] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const { portalRole, canSwitchAdmin, isAdminMode, reload } = useClinicPortal();
  const [clinicClosed, setClinicClosed] = useState(Boolean(Number(summary.clinicProfile?.is_closed ?? user.is_closed ?? 0)));
  const name =
    user.clinic_name ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    'Clinic';
  const logo = resolveMediaUrl(user.avatar || user.logo || user.clinic_logo);
  const notifPath = '/clinic-portal/notifications';
  const clinicId = user.clinic_id || user.id;

  const isOnline = !clinicClosed;

  const toggleClinicStatus = async () => {
    if (toggling) return;
    const next = !isOnline;
    setToggling(true);
    try {
      if (clinicId) {
        await clinicPortal.setClinicClosure(clinicId, {
          is_closed: next ? 0 : 1,
          closure_reason: next ? '' : 'Temporarily offline',
        });
      }
      setClinicClosed(!next);
      toast.success(next ? 'Clinic status: Online - Open for appointments' : 'Clinic status: Offline - Marked as closed');
    } catch (err) {
      toast.error(err.message || 'Could not update clinic status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="nav-drawer-profile-card relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/10 p-3.5 sm:p-4 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.3)] w-full">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-200/30 blur-2xl" />
      <div className="relative flex items-start gap-3 min-w-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-xs shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-contain p-0.5" />
          ) : (
            <FaIcon icon="fa-hospital" className="text-xl text-emerald-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">{name}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{isAdminMode ? 'Clinic Admin Portal' : 'Front Desk Portal'}</p>
          <Link
            to="/clinic-portal/profile"
            onClick={onNavigate}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 mt-1 hover:text-emerald-800"
          >
            Clinic settings
            <FaIcon icon="fa-chevron-right" className="text-[8px]" />
          </Link>
        </div>
        {summary.unreadNotifications > 0 && (
          <Link
            to={notifPath}
            onClick={onNavigate}
            className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500"
          >
            <FaIcon icon="fa-bell" className="text-sm" />
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5">
              {summary.unreadNotifications > 99 ? '99+' : summary.unreadNotifications}
            </span>
          </Link>
        )}
      </div>

      {/* Master Online/Offline Toggle */}
      <MasterAvailabilityToggle
        isOnline={isOnline}
        onToggle={toggleClinicStatus}
        toggling={toggling}
        type="clinic"
      />

      {/* Mode Switch Option: Clinic Admin ↔ Front Desk */}
      <div className="relative mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white/90 p-2.5 shadow-2xs backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs shrink-0 ${isAdminMode ? 'bg-primary-100 text-primary-700' : 'bg-amber-100 text-amber-700'}`}>
            <FaIcon icon={isAdminMode ? 'fa-user-shield' : 'fa-desktop'} />
          </span>
          <div className="min-w-0 select-none">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Operating Mode</p>
            <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {isAdminMode ? 'Clinic Admin' : 'Front Desk'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSwitchOpen(true)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 ${
            isAdminMode
              ? 'bg-primary-50 text-primary-800 border-primary-200 hover:bg-primary-100'
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
          }`}
          title="Switch between Clinic Admin and Front Desk"
        >
          <span>Switch</span>
          <FaIcon icon="fa-right-left" className="text-[9px]" />
        </button>
      </div>

      <Link
        to={isAdminMode ? '/clinic-portal/admin' : '/clinic-portal'}
        onClick={onNavigate}
        className="relative mt-3 btn-primary w-full text-center text-sm !py-2.5 sm:!py-3 inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 shadow-lg shadow-emerald-600/20"
      >
        <FaIcon icon="fa-hospital-user" />
        Open {isAdminMode ? 'Admin Dashboard' : 'Front Desk'}
      </Link>

      <ClinicRoleSwitch
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        portalRole={portalRole}
        canSwitchAdmin={canSwitchAdmin}
        onSwitched={() => {
          reload();
          window.dispatchEvent(new Event('clinic-role-changed'));
        }}
      />
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
  if (hasRole('clinic', 'clinic_staff', 'clinic_admin')) {
    return <ClinicProfileCard user={user} summary={summary} loading={loading} onNavigate={onNavigate} />;
  }
  if (hasRole('patient')) {
    return <PatientProfileCard user={user} summary={summary} loading={loading} onNavigate={onNavigate} />;
  }
  return <GuestLoginCard onNavigate={onNavigate} />;
}
