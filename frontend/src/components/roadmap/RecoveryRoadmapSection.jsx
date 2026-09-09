import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';
import {
  HOME_ROADMAP_DEFAULTS,
  TELE_ROADMAP_DEFAULTS,
  visibleRoadmapPhases,
  visibleRoadmapSpecs,
  roadmapFallbackImage,
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
    live: 'text-teal-100',
  },
};

const EASE = [0.22, 1, 0.36, 1];

function specsGridClass(count) {
  if (count >= 3) return 'roadmap-specs-grid roadmap-specs-grid--3';
  if (count === 2) return 'roadmap-specs-grid roadmap-specs-grid--2';
  return 'roadmap-specs-grid roadmap-specs-grid--1';
}

function useViewportHeight() {
  const [vh, setVh] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const sync = () => setVh(window.innerHeight);
    sync();
    window.addEventListener('resize', sync, { passive: true });
    return () => window.removeEventListener('resize', sync);
  }, []);

  return vh;
}

function RoadmapPhaseImage({ themeKey, phase, phaseIndex, reduceMotion, duration, className = '' }) {
  const fallbackSrc = roadmapFallbackImage(themeKey, phaseIndex);
  const customSrc = sanitizeCmsImageUrl(phase?.image);
  const [failedCustom, setFailedCustom] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  useEffect(() => {
    setFailedCustom(false);
    setFailedFallback(false);
  }, [customSrc, fallbackSrc]);

  const usingFallback = !customSrc || failedCustom;
  const displaySrc = usingFallback ? fallbackSrc : customSrc;
  if (!displaySrc || (usingFallback && failedFallback)) return null;

  return (
    <motion.img
      src={displaySrc}
      alt={phase.image_alt || phase.title || 'Recovery phase'}
      className={`roadmap-visual-img ${className}`.trim()}
      loading={phaseIndex === 0 ? 'eager' : 'lazy'}
      decoding="async"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99, y: -8 }}
      transition={{ duration, ease: EASE }}
      onError={() => {
        if (!usingFallback) {
          setFailedCustom(true);
          return;
        }
        setFailedFallback(true);
      }}
    />
  );
}

function preloadPhaseImages(themeKey, phases) {
  (phases || []).forEach((phase, index) => {
    const custom = sanitizeCmsImageUrl(phase?.image);
    const src = custom || roadmapFallbackImage(themeKey, index);
    if (!src) return;
    const img = new Image();
    img.src = src;
  });
}

export default function RecoveryRoadmapSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const phases = useMemo(() => visibleRoadmapPhases(copy.roadmap_phases), [copy.roadmap_phases]);
  const reduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const activeRef = useRef(0);
  const vh = useViewportHeight();
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);

  const count = phases.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;
  const phase = phases[safeIndex] || null;
  const specs = visibleRoadmapSpecs(phase?.specs);
  const themeKey = theme === 'tele' ? 'tele' : 'home';

  const syncFromScroll = useCallback(() => {
    if (count < 1) return;
    const el = trackRef.current;
    if (!el) return;

    const total = Math.max(el.offsetHeight - vh, 1);
    const top = el.getBoundingClientRect().top;
    const scrolled = Math.min(Math.max(-top, 0), total);
    const progress = scrolled / total;
    const raw = progress * count;
    const ideal = Math.min(count - 1, Math.max(0, Math.floor(raw + 1e-6)));
    const prev = activeRef.current;

    let next = prev;
    if (ideal === prev) {
      next = prev;
    } else if (ideal > prev) {
      // Enter the next phase only after a small buffer past the boundary.
      next = raw >= ideal + 0.12 ? ideal : prev;
    } else {
      // Leave the current phase only after scrolling back past a buffer.
      next = raw <= ideal + 0.88 ? ideal : prev;
    }

    if (next !== prev) {
      activeRef.current = next;
      setActive(next);
    }
  }, [count, vh]);

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
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [syncFromScroll]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setEntered(true);
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!entered || !count) return undefined;
    preloadPhaseImages(themeKey, phases);
    return undefined;
  }, [entered, count, phases, themeKey]);

  useEffect(() => {
    setActive((prev) => {
      const next = count ? Math.min(prev, count - 1) : 0;
      activeRef.current = next;
      return next;
    });
  }, [count]);

  const goToPhase = useCallback(
    (index) => {
      const el = trackRef.current;
      if (!el || count < 1) return;
      const next = Math.min(Math.max(index, 0), count - 1);
      const total = Math.max(el.offsetHeight - window.innerHeight, 0);
      const ratio = count <= 1 ? 0 : (next + 0.35) / count;
      const top = el.getBoundingClientRect().top + window.scrollY + ratio * total;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      activeRef.current = next;
      setActive(next);
    },
    [count, reduceMotion]
  );

  if (!phase) return null;

  const headingId = theme === 'tele' ? 'tele-roadmap-heading' : 'hp-roadmap-heading';
  const duration = reduceMotion ? 0 : 0.32;
  const phaseKey = phase.id || phase.number || safeIndex;
  const progressPct = count <= 1 ? 100 : ((safeIndex + 1) / count) * 100;

  const contentFade = {
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, y: -10 },
    transition: { duration, ease: EASE },
  };

  return (
    <section
      ref={trackRef}
      className={`roadmap-section ${tokens.section}${entered ? ' is-entered' : ''}`}
      id={theme === 'tele' ? 'telerehab-recovery-roadmap' : 'physioathome-recovery-roadmap'}
      style={{ '--roadmap-phases': String(count) }}
      aria-labelledby={headingId}
    >
      <div className={`roadmap-pin ${tokens.pin} text-white`}>
        <div className="absolute inset-0 roadmap-pin-grid pointer-events-none" aria-hidden />
        <div className="roadmap-pin-inner relative z-[1] max-w-7xl mx-auto">
          <div className="roadmap-layout">
            <div className="roadmap-copy">
              <div className="roadmap-intro">
                <p className={`roadmap-label ${tokens.label}`}>{copy.roadmap_label}</p>
                <h2 id={headingId} className="roadmap-heading">
                  {copy.roadmap_heading}
                </h2>
                {copy.roadmap_intro ? (
                  <p className={`roadmap-lede ${tokens.intro}`}>{copy.roadmap_intro}</p>
                ) : null}

                {count > 1 ? (
                  <div className="roadmap-progress" aria-hidden="true">
                    <div className="roadmap-progress-track">
                      <span
                        className="roadmap-progress-fill"
                        style={{
                          width: `${progressPct}%`,
                          transitionDuration: reduceMotion ? '0.01ms' : '0.35s',
                        }}
                      />
                    </div>
                    <ol className="roadmap-progress-steps">
                      {phases.map((item, i) => (
                        <li key={item.id || `step-${i}`}>
                          <button
                            type="button"
                            className={`roadmap-progress-dot${i === safeIndex ? ' is-active' : ''}${i < safeIndex ? ' is-done' : ''}`}
                            onClick={() => goToPhase(i)}
                            aria-label={`Go to phase ${i + 1}: ${item.title || item.number || ''}`}
                            aria-current={i === safeIndex ? 'step' : undefined}
                          >
                            <span>{String(i + 1).padStart(2, '0')}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>

              <div className="roadmap-phase" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div key={phaseKey} className="roadmap-phase-stack" {...contentFade}>
                    <div className="roadmap-phase-meta">
                      <p className="roadmap-phase-number">{String(safeIndex + 1).padStart(2, '0')}</p>
                      {phase.subtitle || phase.number ? (
                        <p className={`roadmap-phase-kicker ${tokens.live}`}>
                          {phase.subtitle || phase.number}
                        </p>
                      ) : null}
                    </div>
                    <h3 className={`roadmap-phase-title ${tokens.phaseTitle}`}>{phase.title}</h3>
                    {phase.description ? (
                      <p className="roadmap-phase-copy">{phase.description}</p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="roadmap-visual has-image">
              <div className="roadmap-visual-glow" aria-hidden="true" />
              <AnimatePresence mode="popLayout" initial={false}>
                <RoadmapPhaseImage
                  key={phase.id || `${themeKey}-${safeIndex}`}
                  themeKey={themeKey}
                  phase={phase}
                  phaseIndex={safeIndex}
                  reduceMotion={reduceMotion}
                  duration={duration}
                />
              </AnimatePresence>
            </div>

            <div className="roadmap-specs">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.ul
                  key={`specs-${phaseKey}`}
                  className={specsGridClass(specs.length)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: reduceMotion ? 0 : 0.05 },
                    },
                  }}
                >
                  {specs.map((item, i) => (
                    <motion.li
                      key={`${item.title}-${i}`}
                      className="roadmap-spec"
                      variants={{
                        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: { duration, ease: EASE },
                        },
                      }}
                    >
                      <span className={`roadmap-spec-icon ${tokens.specIcon}`}>
                        <FaIcon icon={item.icon || 'fa-circle-check'} className="text-sm" />
                      </span>
                      <p className="roadmap-spec-title">{item.title}</p>
                      {item.description ? (
                        <p className={`roadmap-spec-copy ${tokens.specMuted}`}>{item.description}</p>
                      ) : null}
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
