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
    circle: 'bg-teal-400/20',
    imageRing: 'ring-white/15 shadow-[0_24px_48px_-18px_rgb(15_23_42_/_0.55)]',
    live: 'text-teal-100',
  },
};

function specsGridClass(count) {
  if (count >= 3) return 'roadmap-specs-grid roadmap-specs-grid--3';
  if (count === 2) return 'roadmap-specs-grid roadmap-specs-grid--2';
  return 'roadmap-specs-grid roadmap-specs-grid--1';
}

function RoadmapPhaseImage({ themeKey, phase, phaseIndex, reduceMotion, duration }) {
  const fallbackSrc = roadmapFallbackImage(themeKey, phaseIndex);
  const customSrc = sanitizeCmsImageUrl(phase?.image);
  const [failedCustom, setFailedCustom] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  useEffect(() => {
    setFailedCustom(false);
    setFailedFallback(false);
  }, [customSrc, fallbackSrc]);

  if (!customSrc) return null;

  const usingFallback = failedCustom;
  const displaySrc = usingFallback ? fallbackSrc : customSrc;
  if (!displaySrc || (usingFallback && failedFallback)) return null;

  return (
    <motion.img
      src={displaySrc}
      alt={phase.image_alt || phase.title || 'Recovery phase'}
      className="roadmap-visual-img"
      loading={phaseIndex === 0 ? 'eager' : 'lazy'}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
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

export default function RecoveryRoadmapSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const phases = useMemo(() => visibleRoadmapPhases(copy.roadmap_phases), [copy.roadmap_phases]);
  const reduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const count = phases.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;
  const phase = phases[safeIndex] || null;
  const specs = visibleRoadmapSpecs(phase?.specs);

  const syncFromScroll = useCallback(() => {
    if (count < 1) return;
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

  if (!phase) return null;

  const headingId = theme === 'tele' ? 'tele-roadmap-heading' : 'hp-roadmap-heading';
  const themeKey = theme === 'tele' ? 'tele' : 'home';
  const hasConfiguredImage = Boolean(sanitizeCmsImageUrl(phase?.image));
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
      style={{ '--roadmap-phases': String(count) }}
      aria-labelledby={headingId}
    >
      <div className={`roadmap-pin ${tokens.pin} text-white`}>
        <div className="absolute inset-0 roadmap-pin-grid pointer-events-none" aria-hidden />
        <div className="roadmap-pin-inner relative z-[1] max-w-7xl mx-auto">
          <div className={`roadmap-layout ${hasConfiguredImage ? '' : 'is-empty-visual'}`.trim()}>
            <div className="roadmap-copy">
              <div className="roadmap-intro">
                <p className={`roadmap-label ${tokens.label}`}>
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
                  <motion.div key={phaseKey} className="roadmap-phase-stack" {...fade}>
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
              className={`roadmap-visual ${hasConfiguredImage ? 'has-image' : 'is-empty'}`}
              aria-hidden={!hasConfiguredImage}
            >
              <AnimatePresence mode="wait">
                {hasConfiguredImage ? (
                  <RoadmapPhaseImage
                    key={phase.id || `${themeKey}-${safeIndex}`}
                    themeKey={themeKey}
                    phase={phase}
                    phaseIndex={safeIndex}
                    reduceMotion={reduceMotion}
                    duration={duration}
                  />
                ) : null}
              </AnimatePresence>
            </div>

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
