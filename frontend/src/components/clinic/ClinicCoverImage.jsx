import { resolveMediaUrl } from '../../utils/mediaUrl';

const VARIANT_CLASS = {
  card: 'object-cover object-center',
  sheet: 'object-cover object-center',
  profile: 'object-cover object-center',
  hero: 'object-cover object-center',
  logo: 'object-contain object-center',
};

/**
 * Responsive clinic cover/logo image — consistent cropping across devices.
 */
export default function ClinicCoverImage({ src, alt = '', variant = 'card', className = '', eager = false }) {
  const resolved = resolveMediaUrl(src) || src;
  if (!resolved) return null;

  return (
    <img
      src={resolved}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 720px"
          className={`w-full h-full ${VARIANT_CLASS[variant] || VARIANT_CLASS.card} ${className}`}
    />
  );
}
