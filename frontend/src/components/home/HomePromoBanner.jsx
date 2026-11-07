import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { hapticTap } from '../../utils/haptics';

const RESUME_AFTER_MS = 4000;

function SlideLink({ link, alt, tabIndex, children }) {
  if (!link) return <div className="home-promo-slide-inner">{children}</div>;
  if (link.startsWith('/')) {
    return (
      <Link to={link} className="home-promo-slide-inner" aria-label={alt} tabIndex={tabIndex}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={link.startsWith('http') ? link : `https://${link}`}
      target="_blank"
      rel="noopener noreferrer"
      className="home-promo-slide-inner"
      aria-label={alt}
      tabIndex={tabIndex}
    >
      {children}
    </a>
  );
}

/**
 * Homepage promo banners: separate desktop & mobile image per slide.
 * Swipe on touch, arrows on desktop, dots below; autoplay loops forward and
 * pauses while the visitor is interacting.
 * @param {{ slides: Array<{desktop_image: string, mobile_image: string, alt_text?: string, link_url?: string}>, className?: string, intervalMs?: number }} props
 */
export default function HomePromoBanner({ slides = [], className = '', intervalMs = 5000 }) {
  const prepared = useMemo(
    () =>
      slides
        .map((s) => ({
          desktop: resolveMediaUrl(s.desktop_image) || s.desktop_image,
          mobile: resolveMediaUrl(s.mobile_image) || s.mobile_image,
          alt: s.alt_text || 'Promotional banner',
          link: (s.link_url || '').trim(),
        }))
        .filter((s) => s.desktop && s.mobile),
    [slides]
  );

  const trackRef = useRef(null);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const [idx, setIdx] = useState(0);
  const count = prepared.length;
  const loop = count > 1;
  // A copy of the first slide at the end lets the last → first step keep moving forward.
  const items = loop ? [...prepared, prepared[0]] : prepared;

  const goTo = useCallback((i, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const hold = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER_MS;
  };

  // Track the visible slide; jump from the trailing copy back to the real first slide.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return undefined;
    let t;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i >= count) {
          el.style.scrollSnapType = 'none';
          el.scrollLeft = 0;
          el.style.scrollSnapType = '';
          setIdx(0);
        } else {
          setIdx(i);
        }
      }, 90);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      el.removeEventListener('scroll', onScroll);
    };
  }, [count, loop]);

  // Autoplay.
  useEffect(() => {
    if (!loop) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || document.hidden || hovering.current || Date.now() < pausedUntil.current) return;
      if (el.contains(document.activeElement)) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      goTo(Math.min(i + 1, count));
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, goTo, intervalMs, loop]);

  // Keep the current slide aligned when the viewport resizes.
  useEffect(() => {
    const onResize = () => goTo(idx, false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [idx, goTo]);

  if (count < 1) return null;

  const step = (dir) => {
    hapticTap();
    hold();
    const el = trackRef.current;
    if (!el) return;
    const cur = Math.round(el.scrollLeft / el.clientWidth);
    if (dir < 0 && cur === 0) {
      // Going back from the first slide: hop to the copy at the end, then slide left.
      el.style.scrollSnapType = 'none';
      el.scrollLeft = count * el.clientWidth;
      el.style.scrollSnapType = '';
      goTo(count - 1);
    } else {
      goTo(Math.min(cur + dir, count));
    }
  };

  return (
    <section
      className={`home-promo-banner-section w-full ${className}`}
      aria-label="Homepage banners"
      aria-roledescription="carousel"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="home-promo-banner-shell group relative"
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') hovering.current = true;
          }}
          onPointerLeave={() => {
            hovering.current = false;
          }}
          onTouchStart={hold}
          onTouchEnd={hold}
        >
          <div ref={trackRef} className="home-promo-banner-track">
            {items.map((s, i) => {
              const isCopy = loop && i === count;
              return (
                <div
                  key={`${s.desktop}-${i}`}
                  className="home-promo-slide"
                  aria-roledescription="slide"
                  aria-label={`${(i % count) + 1} of ${count}`}
                  aria-hidden={isCopy || undefined}
                >
                  <SlideLink link={s.link} alt={s.alt} tabIndex={isCopy ? -1 : undefined}>
                    <picture className="block w-full h-full">
                      <source media="(max-width: 767px)" srcSet={s.mobile} />
                      <img
                        src={s.desktop}
                        alt={s.alt}
                        className="home-promo-img"
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable="false"
                      />
                    </picture>
                  </SlideLink>
                </div>
              );
            })}
          </div>

          {loop && (
            <>
              <button
                type="button"
                className="home-promo-arrow home-promo-arrow--prev"
                aria-label="Previous banner"
                onClick={() => step(-1)}
              >
                <FaIcon icon="fa-chevron-left" />
              </button>
              <button
                type="button"
                className="home-promo-arrow home-promo-arrow--next"
                aria-label="Next banner"
                onClick={() => step(1)}
              >
                <FaIcon icon="fa-chevron-right" />
              </button>
            </>
          )}
        </div>

        {loop && (
          <div className="home-promo-dots" role="tablist" aria-label="Choose banner">
            {prepared.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-label={`Banner ${i + 1}`}
                aria-selected={i === idx}
                onClick={() => {
                  hapticTap();
                  hold();
                  goTo(i);
                }}
                className={i === idx ? 'is-active' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
