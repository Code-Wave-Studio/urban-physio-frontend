import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../utils/mediaUrl';

/**
 * @param {{ patient: { avatar?: string, user_avatar?: string, profile_photo?: string, photo_url?: string, first_name?: string, last_name?: string, patient_name?: string, name?: string }, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl', className?: string }} props
 */
export default function PatientAvatar({ patient, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const rawUrl =
    patient?.avatar ||
    patient?.user_avatar ||
    patient?.profile_photo ||
    patient?.photo_url ||
    '';

  const src = resolveMediaUrl(rawUrl);

  useEffect(() => {
    setImgError(false);
  }, [rawUrl]);

  const sizes = {
    xs: 'w-8 h-8 text-xs rounded-lg',
    sm: 'w-10 h-10 text-sm rounded-xl',
    md: 'w-12 h-12 text-base rounded-2xl',
    lg: 'w-16 h-16 text-lg rounded-2xl',
    xl: 'w-24 h-24 text-2xl rounded-3xl',
  };
  const sizeClass = sizes[size] || sizes.md;

  const displayName =
    patient?.patient_name ||
    patient?.name ||
    `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();

  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={displayName || 'Patient'}
        className={`${sizeClass} object-cover shrink-0 ring-2 ring-white/80 shadow-sm bg-slate-100 ${className}`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-800 font-bold flex items-center justify-center shrink-0 ring-2 ring-white/80 shadow-xs ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
