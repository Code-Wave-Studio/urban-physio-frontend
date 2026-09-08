import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function FeatureVisual({ item, active, reduceMotion, allowLoad }) {
  const src = sanitizeCmsImageUrl(item?.image);
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef('');

  if (allowLoad) loadedRef.current = src;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const alt = ecosystemImageAlt(item);
  const displaySrc = loadedRef.current;
  const showImage = Boolean(displaySrc) && !failed;

  return (
    <div
      className={`eco-visual-slide${active ? ' is-active' : ''}${reduceMotion ? ' is-static' : ''}`}
      aria-hidden={!active}
    >
      {showImage ? (
        <img
          src={displaySrc}
          alt={active ? alt : ''}
          className="eco-visual-img"
          loading="lazy"
          decoding="async"
          fetchPriority={active ? 'high' : 'low'}
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
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  const count = items.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;

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

  const syncFromScroll = useCallback(() => {
    if (count < 1) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) {
      setActive(0);
      return;
    }
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const ratio = scrolled / total;
    const next = Math.min(count - 1, Math.floor(ratio * count + 1e-4));
    setActive(next);
  }, [count]);

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

  useEffect(() => {
    setActive((prev) => (count ? Math.min(prev, count - 1) : 0));
  }, [count]);

  const scrollToIndex = useCallback(
    (index) => {
      const el = trackRef.current;
      if (!el || count < 1) return;
      const total = Math.max(el.offsetHeight - window.innerHeight, 0);
      const start = (index / count) * total;
      const mid = start + (count > 0 ? total / count / 2 : 0);
      const top = el.getBoundingClientRect().top + window.scrollY + mid;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      setActive(index);
    },
    [count, reduceMotion]
  );

  if (!count) return null;

  const headingId = theme === 'tele' ? 'tele-ecosystem-heading' : 'hp-ecosystem-heading';
  const navId = `${headingId}-nav`;

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
            <header className="eco-intro">
              {copy.ecosystem_label ? <p className="eco-label">{copy.ecosystem_label}</p> : null}
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

          <div className="eco-visual" id={`${headingId}-visual`} aria-live="polite">
            <div className="eco-visual-frame">
              {items.map((item, i) => (
                <FeatureVisual
                  key={item.id || `visual-${i}`}
                  item={item}
                  active={i === safeIndex}
                  allowLoad={inView && (i === 0 || Math.abs(i - safeIndex) <= 1)}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
