import { resolveMediaUrl } from '../utils/mediaUrl';

/**
 * @param {{ clinic?: { logo?: string, name?: string }, logo?: string, name?: string, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }} props
 */
export default function ClinicLogo({ clinic, logo, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm rounded-lg',
    md: 'w-12 h-12 text-base rounded-xl',
    lg: 'w-16 h-16 text-lg rounded-2xl',
    xl: 'w-24 h-24 text-2xl rounded-2xl',
  };
  const sizeClass = sizes[size] || sizes.md;
  const src = resolveMediaUrl(logo ?? clinic?.logo);
  const displayName = name ?? clinic?.name ?? 'Clinic';
  const initial = displayName.trim()[0]?.toUpperCase() || 'C';

  if (src) {
    return (
      <img
        src={src}
        alt={`${displayName} logo`}
        className={`${sizeClass} object-contain p-0.5 shrink-0 ring-2 ring-white/80 shadow-sm bg-white ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-sky-400/40 to-primary-600/50 text-primary-900 font-bold flex items-center justify-center shrink-0 ring-2 ring-white/80 ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
