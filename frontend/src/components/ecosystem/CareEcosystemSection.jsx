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

export default function CareEcosystemSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const items = useMemo(() => visibleEcosystemItems(copy.ecosystem_items), [copy.ecosystem_items]);
  const reduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const slidesRef = useRef([]);
  const progressRef = useRef(0);
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
    if (count < 1) return;
    const progress = readProgress();
    applyProgress(progress);
    const next = Math.min(count - 1, Math.max(0, Math.round(progress)));
    setActive((prev) => (prev === next ? prev : next));
  }, [applyProgress, count, readProgress]);

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
  }, [syncFromScroll]);

  useLayoutEffect(() => {
    slidesRef.current = slidesRef.current.slice(0, count);
    applyProgress(readProgress());
  }, [applyProgress, count, readProgress]);

  const scrollToIndex = useCallback(
    (index) => {
      const el = trackRef.current;
      if (!el || count < 1) return;
      const total = Math.max(el.offsetHeight - window.innerHeight, 0);
      const ratio = maxProgress <= 0 ? 0 : index / maxProgress;
      const top = el.getBoundingClientRect().top + window.scrollY + ratio * total;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      applyProgress(index);
      setActive(index);
    },
    [applyProgress, count, maxProgress, reduceMotion]
  );

  if (!count) return null;

  const headingId = theme === 'tele' ? 'tele-ecosystem-heading' : 'hp-ecosystem-heading';
  const navId = `${headingId}-nav`;
  const activeItem = items[safeIndex];
  const visualAlt = activeItem ? ecosystemImageAlt(activeItem) : 'Care ecosystem visual';

  return (
    <section
      ref={trackRef}
      className={`eco-section ${tokens.section}`}
      id={theme === 'tele' ? 'telerehab-care-ecosystem' : 'physioathome-care-ecosystem'}
      style={{ '--eco-items': String(count) }}
      aria-labelledby={headingId}
    >
      <div className="eco-pin">
        <div className="eco-inner">
          <div className="eco-copy">
            {copy.ecosystem_label ? <p className="eco-label">{copy.ecosystem_label}</p> : null}

            <header className="eco-intro eco-box">
              <h2 id={headingId} className="eco-heading">
                <Heading heading={copy.ecosystem_heading} highlight={copy.ecosystem_highlight} />
              </h2>
              {copy.ecosystem_intro ? <p className="eco-lede">{copy.ecosystem_intro}</p> : null}
            </header>

            <nav className="eco-nav eco-box" aria-label="Care ecosystem features" id={navId}>
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

          <div className="eco-visual" id={`${headingId}-visual`}>
            <div className="eco-visual-frame" aria-live="polite">
              <span className="sr-only">{visualAlt}</span>
              {items.map((item, i) => (
                <FeatureVisual
                  key={item.id || `visual-${i}`}
                  item={item}
                  index={i}
                  allowLoad={inView && Math.abs(i - safeIndex) <= 1}
                  slideRef={(el) => {
                    slidesRef.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
