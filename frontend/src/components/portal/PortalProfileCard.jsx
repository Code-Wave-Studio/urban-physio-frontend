import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { doctors as doctorsApi, clinicPortal, uploadAvatar } from '../../services/api';

/**
 * Compact portal profile strip with optional presence toggle + avatar change overlay.
 */
export default function PortalProfileCard({
  name,
  roleLabel,
  avatarUrl,
  accent = 'primary',
  showPresence = false,
  presenceOnline = true,
  onPresenceChange,
  allowAvatarUpload = false,
  onAvatarUpdated,
  clinicId,
}) {
  const fileRef = useRef(null);
  const [online, setOnline] = useState(presenceOnline);
  const [uploading, setUploading] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setOnline(presenceOnline);
  }, [presenceOnline]);

  const tone =
    accent === 'teal'
      ? 'from-teal-500/15 to-emerald-500/10 border-teal-200/60'
      : accent === 'emerald'
        ? 'from-emerald-500/15 to-teal-500/10 border-emerald-200/60'
        : 'from-primary-500/15 to-orange-500/10 border-primary-200/60';

  const toggleTone = online
    ? 'bg-emerald-500'
    : 'bg-slate-300';

  const src = resolveMediaUrl(avatarUrl) || avatarUrl;

  const togglePresence = async () => {
    if (!showPresence || toggling) return;
    const next = !online;
    setToggling(true);
    try {
      if (onPresenceChange) {
        await onPresenceChange(next);
      } else if (clinicId) {
        await clinicPortal.setClinicClosure(clinicId, {
          is_closed: next ? 0 : 1,
          closure_reason: next ? '' : 'Temporarily offline',
        });
      } else {
        await doctorsApi.updateProfile({ profile_public: next ? 1 : 0 });
      }
      setOnline(next);
      toast.success(next ? 'You are Online' : 'You are Offline');
    } catch (e) {
      toast.error(e.message || 'Could not update status');
    } finally {
      setToggling(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !allowAvatarUpload) return;
    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      const url = res?.data?.avatar || res?.data?.avatar_url || res?.avatar;
      onAvatarUpdated?.(url);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`portal-profile-card rounded-xl border bg-gradient-to-br ${tone} p-2.5 sm:p-3 w-full max-w-full overflow-hidden`}>
      <div className="flex items-center justify-between gap-2.5 min-w-0 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            className="portal-avatar-btn relative group shrink-0"
            onClick={() => allowAvatarUpload && fileRef.current?.click()}
            aria-label={allowAvatarUpload ? 'Change profile photo' : 'Profile photo'}
            disabled={!allowAvatarUpload || uploading}
          >
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
              {src ? (
                <img src={src} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                (name || '?').slice(0, 1).toUpperCase()
              )}
            </span>
            {allowAvatarUpload && (
              <span className="absolute inset-0 rounded-xl bg-slate-900/55 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 flex items-center justify-center text-[10px] font-semibold">
                {uploading ? '…' : <FaIcon icon="fa-camera" />}
              </span>
            )}
          </button>
          {allowAvatarUpload && (
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
          )}

          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight">{name || 'Account'}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate mt-0.5">{roleLabel}</p>
          </div>
        </div>

        {showPresence && (
          <button
            type="button"
            onClick={togglePresence}
            disabled={toggling}
            className="portal-presence-toggle shrink-0 flex flex-col items-end gap-0.5 active:scale-95 transition-transform duration-200"
            aria-pressed={online}
            title={online ? 'Online — tap to go offline' : 'Offline — tap to go online'}
          >
            <span className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors duration-200 ease-in-out ${toggleTone}`}>
              <span
                className={`absolute top-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white shadow-xs transition-all duration-200 ease-in-out ${
                  online ? 'left-5 sm:left-5' : 'left-0.5'
                }`}
              />
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${online ? 'text-emerald-700' : 'text-slate-500'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
