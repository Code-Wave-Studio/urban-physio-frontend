import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  HOME_ROADMAP_DEFAULTS,
  TELE_ROADMAP_DEFAULTS,
  roadmapFallbackImage,
  visibleRoadmapPhases,
  visibleRoadmapSpecs,
} from '../../constants/recoveryRoadmapDefaults';

const THEMES = {
  home: {
    defaults: HOME_ROADMAP_DEFAULTS,
    section: 'roadmap-theme-home',
    pin: 'bg-gradient-to-br from-orange-600 via-primary-800 to-primary-950',
    label: 'text-orange-100/85',
    intro: 'text-orange-50/90',
    phaseTitle: 'text-amber-200',
    specIcon: 'border-white/30 bg-white/10 text-white',
    specMuted: 'text-orange-50/80',
    progressActive: 'bg-white text-primary-800 shadow-md',
    progressIdle: 'text-white/55 hover:text-white',
    progressLine: 'bg-white/25',
    progressFill: 'bg-amber-200',
    circle: 'bg-orange-400/20',
    imageRing: 'ring-white/20 shadow-[0_24px_48px_-18px_rgb(67_20_7_/_0.55)]',
    live: 'text-amber-100',
  },
  tele: {
    defaults: TELE_ROADMAP_DEFAULTS,
    section: 'roadmap-theme-tele',
    pin: 'bg-gradient-to-br from-teal-700 via-teal-900 to-slate-950',
    label: 'text-teal-100/85',
    intro: 'text-teal-50/90',
    phaseTitle: 'text-teal-200',
    specIcon: 'border-white/30 bg-white/10 text-white',
    specMuted: 'text-teal-50/80',
    progressActive: 'bg-white text-teal-900 shadow-md',
    progressIdle: 'text-white/55 hover:text-white',
    progressLine: 'bg-white/25',
    progressFill: 'bg-teal-200',
    circle: 'bg-teal-400/20',
    imageRing: 'ring-white/15 shadow-[0_24px_48px_-18px_rgb(15_23_42_/_0.55)]',
    live: 'text-teal-100',
  },
};

const DESKTOP_MQ = '(min-width: 1024px)';

function useDesktopSticky() {
  const [sticky, setSticky] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setSticky(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return sticky;
}

function phaseImageSrc(phase, theme, index) {
  return resolveMediaUrl(phase?.image) || phase?.image || roadmapFallbackImage(theme, index);
}

function specsGridClass(count) {
  if (count >= 3) return 'roadmap-specs-grid roadmap-specs-grid--3';
  if (count === 2) return 'roadmap-specs-grid roadmap-specs-grid--2';
  return 'roadmap-specs-grid roadmap-specs-grid--1';
}

export default function RecoveryRoadmapSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const phases = useMemo(() => visibleRoadmapPhases(copy.roadmap_phases), [copy.roadmap_phases]);
  const reduceMotion = useReducedMotion();
  const stickyMode = useDesktopSticky();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});
  const touchStartX = useRef(null);

  const count = phases.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;
  const phase = phases[safeIndex] || null;
  const specs = visibleRoadmapSpecs(phase?.specs);

  const syncFromScroll = useCallback(() => {
    if (!stickyMode || count < 1) return;
    const el = trackRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) {
      setActive(0);
      return;
    }
    const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
    const ratio = scrolled / total;
    const next = Math.min(count - 1, Math.floor(ratio * count + 1e-4));
    setActive(next);
  }, [stickyMode, count]);

  useEffect(() => {
    if (!stickyMode) return undefined;
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
  }, [stickyMode, syncFromScroll]);

  useEffect(() => {
    setActive(0);
  }, [count]);

  const goToPhase = useCallback(
    (index) => {
      const next = Math.max(0, Math.min(count - 1, index));
      if (!stickyMode) {
        setActive(next);
        return;
      }
      const el = trackRef.current;
      if (!el || count < 1) return;
      const total = Math.max(el.offsetHeight - window.innerHeight, 0);
      const target = el.getBoundingClientRect().top + window.scrollY + (next / count) * total + 8;
      window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [count, stickyMode, reduceMotion]
  );

  const onTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    if (stickyMode || touchStartX.current == null) return;
    const dx = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    goToPhase(dx < 0 ? safeIndex + 1 : safeIndex - 1);
  };

  if (!phase) return null;

  const headingId = theme === 'tele' ? 'tele-roadmap-heading' : 'hp-roadmap-heading';
  const imageSrc = brokenImages[safeIndex] ? null : phaseImageSrc(phase, theme, safeIndex);
  const duration = reduceMotion ? 0 : 0.34;
  const fade = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 },
    transition: { duration, ease: [0.22, 1, 0.36, 1] },
  };
  const phaseKey = phase.id || phase.number || safeIndex;

  return (
    <section
      ref={trackRef}
      className={`roadmap-section ${tokens.section}`}
      id={theme === 'tele' ? 'telerehab-recovery-roadmap' : 'physioathome-recovery-roadmap'}
      style={stickyMode ? { '--roadmap-phases': String(count) } : undefined}
      aria-labelledby={headingId}
    >
      <div className={`roadmap-pin ${tokens.pin} text-white`}>
        <div className="absolute inset-0 roadmap-pin-grid pointer-events-none" aria-hidden />
        <div className="roadmap-pin-inner relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="roadmap-layout">
            <div className="roadmap-copy">
              <div className="roadmap-intro">
                <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] ${tokens.label}`}>
                  {copy.roadmap_label}
                </p>
                <h2 id={headingId} className="roadmap-heading">
                  {copy.roadmap_heading}
                </h2>
                {copy.roadmap_intro ? (
                  <p className={`roadmap-lede ${tokens.intro}`}>{copy.roadmap_intro}</p>
                ) : null}
              </div>

              <div className="roadmap-phase" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div key={phaseKey} {...fade}>
                    <p className="roadmap-phase-number">{String(safeIndex + 1).padStart(2, '0')}</p>
                    {phase.subtitle || phase.number ? (
                      <p className={`roadmap-phase-kicker ${tokens.live}`}>
                        {phase.subtitle || phase.number}
                      </p>
                    ) : null}
                    <h3 className={`roadmap-phase-title ${tokens.phaseTitle}`}>{phase.title}</h3>
                    {phase.description ? (
                      <p className="roadmap-phase-copy">{phase.description}</p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div
              className="roadmap-visual"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className={`roadmap-orb ${tokens.circle}`} aria-hidden />
              <div className={`roadmap-visual-frame ring-1 ${tokens.imageRing}`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase.id || `${theme}-${safeIndex}`}
                    className="roadmap-visual-layer"
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
                    transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={phase.image_alt || phase.title || 'Recovery phase'}
                        className="roadmap-visual-img"
                        loading={safeIndex === 0 ? 'eager' : 'lazy'}
                        onError={() => setBrokenImages((prev) => ({ ...prev, [safeIndex]: true }))}
                      />
                    ) : (
                      <div className="roadmap-visual-fallback">
                        <FaIcon icon="fa-user-nurse" className="text-5xl text-white/50" />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <PhaseProgress
              phases={phases}
              active={safeIndex}
              tokens={tokens}
              onSelect={goToPhase}
            />

            <div className="roadmap-specs">
              <AnimatePresence mode="wait">
                <motion.ul
                  key={`specs-${phaseKey}`}
                  className={specsGridClass(specs.length)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: reduceMotion ? 0 : 0.06 },
                    },
                  }}
                >
                  {specs.map((item, i) => (
                    <motion.li
                      key={`${item.title}-${i}`}
                      className="roadmap-spec"
                      variants={{
                        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0, transition: { duration } },
                      }}
                    >
                      <span className={`roadmap-spec-icon ${tokens.specIcon}`}>
                        <FaIcon icon={item.icon || 'fa-circle-check'} className="text-sm" />
                      </span>
                      <div className="min-w-0">
                        <p className="roadmap-spec-title">{item.title}</p>
                        {item.description ? (
                          <p className={`roadmap-spec-copy ${tokens.specMuted}`}>{item.description}</p>
                        ) : null}
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>

            {!stickyMode && count > 1 ? (
              <div className="roadmap-mobile-nav">
                <button
                  type="button"
                  className="roadmap-nav-btn"
                  onClick={() => goToPhase(safeIndex - 1)}
                  disabled={safeIndex === 0}
                  aria-label="Previous phase"
                >
                  <FaIcon icon="fa-arrow-left" />
                </button>
                <p className="text-xs font-semibold text-white/70">
                  {String(safeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                </p>
                <button
                  type="button"
                  className="roadmap-nav-btn"
                  onClick={() => goToPhase(safeIndex + 1)}
                  disabled={safeIndex === count - 1}
                  aria-label="Next phase"
                >
                  <FaIcon icon="fa-arrow-right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseProgress({ phases, active, tokens, onSelect }) {
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      onSelect(Math.min(phases.length - 1, active + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      onSelect(Math.max(0, active - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      onSelect(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      onSelect(phases.length - 1);
    }
  };

  return (
    <nav className="roadmap-progress" aria-label="Recovery phases" onKeyDown={onKeyDown}>
      <ol className="roadmap-progress-list">
        {phases.map((item, i) => {
          const current = i === active;
          const done = i < active;
          return (
            <li key={item.id || item.number || i} className="roadmap-progress-item">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={current ? 'step' : undefined}
                aria-label={`${item.number || `Phase ${i + 1}`}${item.title ? `: ${item.title}` : ''}`}
                className={`roadmap-step-btn ${current ? tokens.progressActive : tokens.progressIdle} ${
                  current ? 'font-bold' : 'font-semibold'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
              {i < phases.length - 1 ? (
                <span className={`roadmap-step-line ${tokens.progressLine}`} aria-hidden>
                  <span
                    className={`roadmap-step-line-fill ${tokens.progressFill}`}
                    style={{ transform: `scaleX(${done ? 1 : 0})` }}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
