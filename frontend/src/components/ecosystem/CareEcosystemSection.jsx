import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';
import {
  HOME_ECOSYSTEM_DEFAULTS,
  TELE_ECOSYSTEM_DEFAULTS,
  ecosystemImageAlt,
  visibleEcosystemItems,
} from '../../constants/careEcosystemDefaults';

const THEMES = {
  home: {
    defaults: HOME_ECOSYSTEM_DEFAULTS,
    section: 'eco-theme-home',
  },
  tele: {
    defaults: TELE_ECOSYSTEM_DEFAULTS,
    section: 'eco-theme-tele',
  },
};

const MOBILE_MQ = '(max-width: 767px)';

function useIsEcoMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobile;
}

function Heading({ heading, highlight }) {
  if (!heading) return null;
  if (highlight && heading.includes(highlight)) {
    const [before, ...rest] = heading.split(highlight);
    return (
      <>
        {before}
        <span className="eco-heading-accent">{highlight}</span>
        {rest.join(highlight)}
      </>
    );
  }
  return heading;
}

function FeatureVisual({ item, index, allowLoad, slideRef }) {
  const src = sanitizeCmsImageUrl(item?.image);
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef('');

  if (allowLoad) loadedRef.current = src;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const displaySrc = loadedRef.current;
  const showImage = Boolean(displaySrc) && !failed;

  return (
    <div ref={slideRef} className="eco-visual-slide" aria-hidden="true">
      {showImage ? (
        <img
          src={displaySrc}
          alt=""
          className="eco-visual-img"
          loading="lazy"
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

function CarouselSlide({ item, index, offset, allowLoad, reduceMotion }) {
  const src = sanitizeCmsImageUrl(item?.image);
  const [failed, setFailed] = useState(false);
  const abs = Math.abs(offset);
  const isActive = offset === 0;
  const hidden = abs > 1;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed && allowLoad;

  return (
    <div
      className={`eco-carousel-slide${isActive ? ' is-active' : ''}${hidden ? ' is-hidden' : ''}`}
      style={{
        transform: reduceMotion
          ? `translate3d(${offset * 100}%, 0, 0)`
          : `translate3d(${offset * 42}%, 0, 0) scale(${isActive ? 1 : 0.86})`,
        zIndex: isActive ? 3 : 2 - abs,
        opacity: hidden ? 0 : isActive ? 1 : 0.72,
      }}
      aria-hidden={!isActive}
    >
      <div className="eco-carousel-card">
        {showImage ? (
          <img
            src={src}
            alt=""
            className="eco-carousel-img"
            loading={abs <= 1 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="eco-carousel-placeholder" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }) {
  const isPrev = dir === 'prev';
  return (
    <svg viewBox="0 0 24 24" className="eco-carousel-chevron" aria-hidden="true">
      <path
        d={isPrev ? 'M14.5 6.5 L9 12 l5.5 5.5' : 'M9.5 6.5 L15 12 l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CareEcosystemSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const items = useMemo(() => visibleEcosystemItems(copy.ecosystem_items), [copy.ecosystem_items]);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsEcoMobile();
  const trackRef = useRef(null);
  const slidesRef = useRef([]);
  const progressRef = useRef(0);
  const touchRef = useRef({ x: 0, y: 0, active: false });
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  const count = items.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;
  const maxProgress = Math.max(count - 1, 0);

  const applyProgress = useCallback(
    (progress) => {
      progressRef.current = progress;
      const snaps = reduceMotion ? Math.round(progress) : progress;
      slidesRef.current.forEach((el, i) => {
        if (!el) return;
        const y = (i - snaps) * 100;
        el.style.transform = `translate3d(0, ${y}%, 0)`;
      });
    },
    [reduceMotion]
  );

  const readProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el || count < 1) return 0;
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
    return (scrolled / total) * maxProgress;
  }, [count, maxProgress]);

  const syncFromScroll = useCallback(() => {
    if (isMobile || count < 1) return;
    const progress = readProgress();
    applyProgress(progress);
    const next = Math.min(count - 1, Math.max(0, Math.round(progress)));
    setActive((prev) => (prev === next ? prev : next));
  }, [applyProgress, count, isMobile, readProgress]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: '240px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (isMobile) return undefined;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncFromScroll();
      });
    };
    syncFromScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isMobile, syncFromScroll]);

  useLayoutEffect(() => {
    if (isMobile) return;
    slidesRef.current = slidesRef.current.slice(0, count);
    applyProgress(readProgress());
  }, [applyProgress, count, isMobile, readProgress]);

  useEffect(() => {
    setActive((prev) => {
      if (!count) return 0;
      return Math.min(prev, count - 1);
    });
  }, [count]);

  const goToIndex = useCallback(
    (index) => {
      if (!count) return;
      const next = Math.min(Math.max(index, 0), count - 1);
      setActive(next);
    },
    [count]
  );

  const scrollToIndex = useCallback(
    (index) => {
      if (isMobile) {
        goToIndex(index);
        return;
      }
      const el = trackRef.current;
      if (!el || count < 1) return;
      const total = Math.max(el.offsetHeight - window.innerHeight, 0);
      const ratio = maxProgress <= 0 ? 0 : index / maxProgress;
      const top = el.getBoundingClientRect().top + window.scrollY + ratio * total;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      applyProgress(index);
      setActive(index);
    },
    [applyProgress, count, goToIndex, isMobile, maxProgress, reduceMotion]
  );

  const goPrev = useCallback(() => {
    goToIndex(safeIndex - 1);
  }, [goToIndex, safeIndex]);

  const goNext = useCallback(() => {
    goToIndex(safeIndex + 1);
  }, [goToIndex, safeIndex]);

  const onTouchStart = useCallback((event) => {
    const touch = event.changedTouches?.[0] || event.touches?.[0];
    if (!touch) return;
    touchRef.current = { x: touch.clientX, y: touch.clientY, active: true };
  }, []);

  const onTouchEnd = useCallback(
    (event) => {
      if (!touchRef.current.active) return;
      const touch = event.changedTouches?.[0];
      touchRef.current.active = false;
      if (!touch) return;
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  if (!count) return null;

  const headingId = theme === 'tele' ? 'tele-ecosystem-heading' : 'hp-ecosystem-heading';
  const navId = `${headingId}-nav`;
  const activeItem = items[safeIndex];
  const visualAlt = activeItem ? ecosystemImageAlt(activeItem) : 'Care ecosystem visual';
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < count - 1;

  return (
    <section
      ref={trackRef}
      className={`eco-section ${tokens.section}${inView ? ' is-entered' : ''}${isMobile ? ' is-mobile-carousel' : ''}`}
      id={theme === 'tele' ? 'telerehab-care-ecosystem' : 'physioathome-care-ecosystem'}
      style={{ '--eco-items': String(count) }}
      aria-labelledby={headingId}
    >
      <div className="eco-pin">
        <div className="eco-inner">
          <div className="eco-copy">
            {copy.ecosystem_label ? <p className="eco-label">{copy.ecosystem_label}</p> : null}

            <header className="eco-intro">
              <h2 id={headingId} className="eco-heading">
                <Heading heading={copy.ecosystem_heading} highlight={copy.ecosystem_highlight} />
              </h2>
              {copy.ecosystem_intro ? <p className="eco-lede">{copy.ecosystem_intro}</p> : null}
            </header>

            <nav className="eco-nav" aria-label="Care ecosystem features" id={navId}>
              <ol className="eco-list">
                {items.map((item, i) => {
                  const isActive = i === safeIndex;
                  const itemId = item.id || `eco-item-${i}`;
                  return (
                    <li key={itemId} className={`eco-item${isActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        className="eco-item-btn"
                        aria-current={isActive ? 'true' : undefined}
                        aria-controls={`${headingId}-visual`}
                        onClick={() => scrollToIndex(i)}
                      >
                        <span className="eco-item-title">{item.title}</span>
                        {item.description ? (
                          <span className="eco-item-copy" id={`${itemId}-desc`}>
                            {item.description}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className="eco-visual eco-visual--desktop" id={`${headingId}-visual`}>
            <div className="eco-visual-frame" aria-live="polite">
              <span className="sr-only">{visualAlt}</span>
              {items.map((item, i) => (
                <FeatureVisual
                  key={item.id || `visual-${i}`}
                  item={item}
                  index={i}
                  allowLoad={!isMobile && inView && Math.abs(i - safeIndex) <= 1}
                  slideRef={(el) => {
                    slidesRef.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="eco-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Care ecosystem visuals"
          >
            <div className="eco-carousel-stage">
              <button
                type="button"
                className="eco-carousel-nav eco-carousel-nav--prev"
                onClick={goPrev}
                disabled={!canPrev}
                aria-label="Previous feature"
              >
                <Chevron dir="prev" />
              </button>

              <div
                className="eco-carousel-window"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <span className="sr-only" aria-live="polite">
                  {visualAlt}
                </span>
                {items.map((item, i) => (
                  <CarouselSlide
                    key={item.id || `carousel-${i}`}
                    item={item}
                    index={i}
                    offset={i - safeIndex}
                    allowLoad={inView && Math.abs(i - safeIndex) <= 1}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>

              <button
                type="button"
                className="eco-carousel-nav eco-carousel-nav--next"
                onClick={goNext}
                disabled={!canNext}
                aria-label="Next feature"
              >
                <Chevron dir="next" />
              </button>
            </div>

            {activeItem?.title ? (
              <p className="eco-carousel-caption">{activeItem.title}</p>
            ) : null}

            <div className="eco-carousel-dots" role="tablist" aria-label="Feature slides">
              {items.map((item, i) => {
                const selected = i === safeIndex;
                return (
                  <button
                    key={item.id || `dot-${i}`}
                    type="button"
                    role="tab"
                    className={`eco-carousel-dot${selected ? ' is-active' : ''}`}
                    aria-label={`Show ${item.title || `feature ${i + 1}`}`}
                    aria-selected={selected}
                    onClick={() => goToIndex(i)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
