import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import AdminUserDetailPanel from './AdminUserDetailPanel';
import { ROLE_STYLES, ROLE_ICONS, formatDate, userLabel } from '../../utils/adminUserUtils';

export default function AdminUserListRow({
  user,
  expanded,
  onToggle,
  detail,
  detailLoading,
  onVerify,
  onRevokeVerify,
  onToggleActive,
  onOpenLocation,
  onApproveServices,
  onRejectServices,
  onDelete,
  actionLoading,
}) {
  const name = userLabel(user);
  const roleStyle = ROLE_STYLES[user.role_slug] || ROLE_STYLES.patient;
  const roleIcon = ROLE_ICONS[user.role_slug] || 'fa-user';
  const isDoctor = user.role_slug === 'doctor';
  const isUnverifiedDoctor = isDoctor && user.doctor_id && !Number(user.is_verified);
  const apptCount = user.appointment_count ?? 0;

  const avatarSrc = resolveMediaUrl(user.avatar);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-shadow ${
        isUnverifiedDoctor
          ? 'border-amber-300/80 bg-amber-50/20'
          : 'border-white/80 bg-white/50'
      } ${expanded ? 'ring-2 ring-primary-200/60 shadow-lg' : 'hover:shadow-md'}`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left p-4 md:p-5 min-w-0 hover:bg-white/60 transition"
        >
          <div className="flex flex-wrap items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                isDoctor ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'
              }`}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <FaIcon icon={roleIcon} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${roleStyle}`}>
                  {user.role_slug?.replace('_', ' ')}
                </span>
                {!user.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                    Inactive
                  </span>
                )}
                {isUnverifiedDoctor && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Unverified
                  </span>
                )}
                {isDoctor && Number(user.is_verified) === 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate mt-0.5">{user.email}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                {user.phone && (
                  <span>
                    <FaIcon icon="fa-phone" className="mr-1 text-slate-400" />
                    {user.phone}
                  </span>
                )}
                {user.city_name && (
                  <span>
                    <FaIcon icon="fa-location-dot" className="mr-1 text-slate-400" />
                    {user.city_name}
                    {user.state_name ? `, ${user.state_name}` : ''}
                  </span>
                )}
                {isDoctor && user.specialization && (
                  <span className="text-violet-700 font-medium">{user.specialization}</span>
                )}
                {apptCount > 0 && (
                  <span>
                    <FaIcon icon="fa-calendar-check" className="mr-1 text-slate-400" />
                    {apptCount} appointments
                    {user.doctor_pending_count > 0 && (
                      <span className="text-amber-700 font-medium"> · {user.doctor_pending_count} pending</span>
                    )}
                  </span>
                )}
                {isDoctor && Number(user.rating_avg) > 0 && (
                  <span>
                    <FaIcon icon="fa-star" className="mr-1 text-amber-500" />
                    {Number(user.rating_avg).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-slate-500">Joined</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(user.created_at)}</p>
              {isDoctor && (
                <p className="text-xs text-slate-600 mt-1">
                  Clinic {user.consultation_fee != null ? `₹${user.consultation_fee}` : '—'}
                </p>
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-col justify-center gap-1 p-2 border-l border-slate-100/80 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <FaIcon icon={expanded ? 'fa-chevron-up' : 'fa-chevron-down'} />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="px-4 md:px-5 pb-3 flex flex-wrap gap-2 border-t border-slate-100 bg-white/40">
            {isDoctor && user.doctor_id && (
              <>
                {Number(user.is_verified) ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onRevokeVerify(user)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 font-medium"
                  >
                    Revoke verification
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onVerify(user)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                  >
                    Verify doctor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenLocation(user)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 font-medium"
                >
                  <FaIcon icon="fa-map-location-dot" className="mr-1" />
                  Set location
                </button>
              </>
            )}
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onToggleActive(user)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                user.is_active
                  ? 'border-red-200 text-red-700 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {user.is_active ? 'Deactivate account' : 'Activate account'}
            </button>
            {/* Delete button — only for doctor / patient roles */}
            {(user.role_slug === 'doctor' || user.role_slug === 'patient') && onDelete && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onDelete(user)}
                className="text-xs px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium ml-auto flex items-center gap-1.5 transition"
              >
                <FaIcon icon="fa-trash-can" />
                Delete account
              </button>
            )}
          </div>
          <AdminUserDetailPanel
            detail={detail}
            loading={detailLoading}
            onApproveServices={onApproveServices}
            onRejectServices={onRejectServices}
            actionLoading={actionLoading}
          />
        </>
      )}
    </div>
  );
}
