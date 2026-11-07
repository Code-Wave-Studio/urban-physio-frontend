import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const INTERVAL_MS = 4500;
const RESUME_AFTER_MS = 3500;

/*
 * Homepage hero slider: swipeable, loops forward forever, every slide is a link.
 * A copy of the first slide sits at the end so 4 → 1 keeps moving forward;
 * once it lands there we jump back to the real first slide without animation.
 * Autoplay pauses on hover, touch, keyboard focus, hidden tab and reduced motion.
 */
export default function HeroSlider({ slides = [] }) {
  const trackRef = useRef(null);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const [active, setActive] = useState(0);
  const count = slides.length;
  const loop = count > 1;
  const items = loop ? [...slides, slides[0]] : slides;

  const goTo = useCallback((i, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Track the visible slide; wrap the trailing copy back to the first slide.
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
          setActive(0);
        } else {
          setActive(i);
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
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || document.hidden || hovering.current) return;
      if (Date.now() < pausedUntil.current) return;
      if (el.contains(document.activeElement)) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      goTo(Math.min(i + 1, count));
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, goTo, loop]);

  // Keep the current slide aligned when the viewport resizes.
  useEffect(() => {
    const onResize = () => goTo(active, false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, goTo]);

  if (!count) return null;

  const hold = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER_MS;
  };

  return (
    <div
      className="tup-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Our services"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      onTouchStart={hold}
      onTouchEnd={hold}
    >
      <div ref={trackRef} className="tup-slider-track">
        {items.map((s, i) => {
          const isCopy = loop && i === count;
          const on = i === active || (isCopy && active === 0);
          const TitleTag = i === 0 ? 'h1' : 'p';
          return (
            <Link
              key={`${i}-${s.link}`}
              to={s.link || '/'}
              className={`tup-slide-card${on ? ' is-active' : ''}`}
              aria-label={s.title || undefined}
              aria-hidden={isCopy || undefined}
              tabIndex={isCopy ? -1 : undefined}
              aria-roledescription="slide"
            >
              <img
                src={resolveMediaUrl(s.image) || s.image}
                alt=""
                className="tup-slide-img"
                fetchpriority={i === 0 ? 'high' : undefined}
                decoding="async"
                draggable="false"
              />
              <span className="tup-slide-shade" aria-hidden="true" />
              {s.title && <TitleTag className="tup-slide-title">{s.title}</TitleTag>}
              <span className="tup-slide-go" aria-hidden="true">
                <FaIcon icon="fa-arrow-right" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
