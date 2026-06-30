import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { hapticTap } from '../../utils/haptics';

/**
 * Homepage promo banner carousel — separate desktop & mobile image per slide.
 * @param {{ slides: Array<{desktop_image: string, mobile_image: string, alt_text?: string, link_url?: string}>, className?: string, intervalMs?: number }} props
 */
export default function HomePromoBanner({ slides = [], className = '', intervalMs = 5000 }) {
  const prepared = useMemo(() => {
    return slides
      .map((s) => ({
        desktop: resolveMediaUrl(s.desktop_image) || s.desktop_image,
        mobile: resolveMediaUrl(s.mobile_image) || s.mobile_image,
        alt: s.alt_text || 'Promotional banner',
        link: (s.link_url || '').trim(),
      }))
      .filter((s) => s.desktop && s.mobile);
  }, [slides]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [prepared.length]);

  useEffect(() => {
    if (prepared.length <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % prepared.length), intervalMs);
    return () => clearInterval(t);
  }, [prepared.length, intervalMs]);

  if (prepared.length < 1) return null;

  return (
    <section className={`home-promo-banner-section w-full ${className}`} aria-label="Homepage banners">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8">
        <div className="home-promo-banner-shell relative overflow-hidden bg-slate-200 shadow-md sm:rounded-2xl">
          <div className="home-promo-banner-track relative w-full">
            {prepared.map((s, i) => (
              <div
                key={`${s.desktop}-${i}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {s.link ? (
                  s.link.startsWith('/') ? (
                    <Link to={s.link} className="block w-full h-full" aria-label={s.alt}>
                      <picture className="block w-full h-full">
                        <source media="(max-width: 767px)" srcSet={s.mobile} />
                        <img src={s.desktop} alt={s.alt} className="w-full h-full object-cover" loading="lazy" />
                      </picture>
                    </Link>
                  ) : (
                    <a
                      href={s.link.startsWith('http') ? s.link : `https://${s.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                      aria-label={s.alt}
                    >
                      <picture className="block w-full h-full">
                        <source media="(max-width: 767px)" srcSet={s.mobile} />
                        <img src={s.desktop} alt={s.alt} className="w-full h-full object-cover" loading="lazy" />
                      </picture>
                    </a>
                  )
                ) : (
                  <picture className="block w-full h-full">
                    <source media="(max-width: 767px)" srcSet={s.mobile} />
                    <img src={s.desktop} alt={s.alt} className="w-full h-full object-cover" loading="lazy" />
                  </picture>
                )}
              </div>
            ))}
          </div>

          {prepared.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-[3] flex justify-center gap-1.5 px-4">
              {prepared.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Banner ${i + 1}`}
                  aria-current={i === idx}
                  onClick={() => {
                    hapticTap();
                    setIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? 'w-7 bg-orange-500 shadow-sm' : 'w-1.5 bg-white/90 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
