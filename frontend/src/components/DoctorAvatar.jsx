import { resolveMediaUrl } from '../utils/mediaUrl';

/**
 * @param {{ doctor: { avatar?: string, first_name?: string, last_name?: string }, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }} props
 */
export default function DoctorAvatar({ doctor, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm rounded-lg',
    md: 'w-12 h-12 text-base rounded-xl',
    lg: 'w-16 h-16 text-lg rounded-2xl',
    xl: 'w-24 h-24 text-2xl rounded-2xl',
  };
  const sizeClass = sizes[size] || sizes.md;
  const src = resolveMediaUrl(doctor?.avatar);
  const initials = `${doctor?.first_name?.[0] || ''}${doctor?.last_name?.[0] || ''}`.toUpperCase() || '?';
  const altName = `Dr. ${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim() || 'Physiotherapist';

  if (src) {
    return (
      <img
        src={src}
        alt={altName}
        className={`${sizeClass} object-cover shrink-0 ring-2 ring-white/80 shadow-sm bg-slate-100 ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-primary-400/40 to-primary-600/50 text-primary-900 font-bold flex items-center justify-center shrink-0 ring-2 ring-white/80 ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
