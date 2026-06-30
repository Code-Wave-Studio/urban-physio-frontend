import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../utils/mediaUrl';

/**
 * Single homepage promo banner (replaces emergency section when enabled).
 * @param {{ slides: Array<{desktop_image: string, mobile_image: string, alt_text?: string, link_url?: string}>, className?: string }} props
 */
export default function HomePromoBanner({ slides = [], className = '' }) {
  const banner = useMemo(() => {
    const slide = slides.find((s) => s.desktop_image?.trim() && s.mobile_image?.trim());
    if (!slide) return null;
    return {
      desktop: resolveMediaUrl(slide.desktop_image) || slide.desktop_image,
      mobile: resolveMediaUrl(slide.mobile_image) || slide.mobile_image,
      alt: slide.alt_text || 'Promotional banner',
      link: (slide.link_url || '').trim(),
    };
  }, [slides]);

  if (!banner) return null;

  const picture = (
    <picture className="block w-full h-full">
      <source media="(max-width: 767px)" srcSet={banner.mobile} />
      <img src={banner.desktop} alt={banner.alt} className="w-full h-full object-cover" loading="lazy" />
    </picture>
  );

  return (
    <section className={`home-promo-banner-section w-full ${className}`} aria-label="Homepage banner">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8">
        <div className="home-promo-banner-shell relative overflow-hidden bg-slate-200 shadow-md sm:rounded-2xl">
          {banner.link ? (
            banner.link.startsWith('/') ? (
              <Link to={banner.link} className="block w-full" aria-label={banner.alt}>
                {picture}
              </Link>
            ) : (
              <a
                href={banner.link.startsWith('http') ? banner.link : `https://${banner.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
                aria-label={banner.alt}
              >
                {picture}
              </a>
            )
          ) : (
            picture
          )}
        </div>
      </div>
    </section>
  );
}
