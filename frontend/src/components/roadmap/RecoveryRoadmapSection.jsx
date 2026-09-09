import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const DESKTOP_MQ = '(min-width: 1024px)';

function specsGridClass(count) {
  if (count >= 3) return 'roadmap-specs-grid roadmap-specs-grid--3';
  if (count === 2) return 'roadmap-specs-grid roadmap-specs-grid--2';
  return 'roadmap-specs-grid roadmap-specs-grid--1';
}

function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}

function useViewportHeight() {
  const [vh, setVh] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const sync = () => setVh(window.visualViewport?.height || window.innerHeight);
    sync();
    window.addEventListener('resize', sync, { passive: true });
    window.visualViewport?.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
    };
  }, []);

  return vh;
}

function RoadmapPhaseImage({ themeKey, phase, phaseIndex, eager = false, className = '' }) {
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
    <img
      src={displaySrc}
      alt={phase.image_alt || phase.title || 'Recovery phase'}
      className={`roadmap-visual-img ${className}`.trim()}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
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

function RoadmapIntro({ copy, headingId, tokens }) {
  return (
    <div className="roadmap-intro">
      <p className={`roadmap-label ${tokens.label}`}>{copy.roadmap_label}</p>
      <h2 id={headingId} className="roadmap-heading">
        {copy.roadmap_heading}
      </h2>
      {copy.roadmap_intro ? (
        <p className={`roadmap-lede ${tokens.intro}`}>{copy.roadmap_intro}</p>
      ) : null}
    </div>
  );
}

function PhaseCopy({ phase, index, tokens }) {
  if (!phase) return null;
  return (
    <div className="roadmap-phase">
      <div className="roadmap-phase-stack">
        <div className="roadmap-phase-meta">
          <p className="roadmap-phase-number">{String(index + 1).padStart(2, '0')}</p>
          {phase.subtitle || phase.number ? (
            <p className={`roadmap-phase-kicker ${tokens.live}`}>
              {phase.subtitle || phase.number}
            </p>
          ) : null}
        </div>
        <h3 className={`roadmap-phase-title ${tokens.phaseTitle}`}>{phase.title}</h3>
        {phase.description ? <p className="roadmap-phase-copy">{phase.description}</p> : null}
      </div>
    </div>
  );
}

function SpecList({ specs, tokens }) {
  if (!specs.length) return null;
  return (
    <div className="roadmap-specs">
      <ul className={specsGridClass(specs.length)}>
        {specs.map((item, i) => (
          <li key={`${item.title}-${i}`} className="roadmap-spec">
            <span className={`roadmap-spec-icon ${tokens.specIcon}`}>
              <FaIcon icon={item.icon || 'fa-circle-check'} className="text-sm" />
            </span>
            <p className="roadmap-spec-title">{item.title}</p>
            {item.description ? (
              <p className={`roadmap-spec-copy ${tokens.specMuted}`}>{item.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseVisual({ themeKey, phase, phaseIndex, eager }) {
  return (
    <div className="roadmap-visual has-image">
      <div className="roadmap-visual-glow" aria-hidden="true" />
      <RoadmapPhaseImage
        themeKey={themeKey}
        phase={phase}
        phaseIndex={phaseIndex}
        eager={eager}
      />
    </div>
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
  const isDesktop = useIsDesktopLayout();
  const trackRef = useRef(null);
  const activeRef = useRef(0);
  const vh = useViewportHeight();
  const [active, setActive] = useState(0);

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
      next = raw >= ideal + 0.12 ? ideal : prev;
    } else {
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
    window.visualViewport?.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.visualViewport?.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [syncFromScroll]);

  useEffect(() => {
    if (!count) return undefined;
    preloadPhaseImages(themeKey, phases);
    return undefined;
  }, [count, phases, themeKey]);

  useEffect(() => {
    setActive((prev) => {
      const next = count ? Math.min(prev, count - 1) : 0;
      activeRef.current = next;
      return next;
    });
  }, [count]);

  if (!phase) return null;

  const headingId = theme === 'tele' ? 'tele-roadmap-heading' : 'hp-roadmap-heading';
  const phaseKey = phase.id || phase.number || safeIndex;

  return (
    <section
      ref={trackRef}
      className={`roadmap-section ${tokens.section} is-pinned${isDesktop ? '' : ' is-stepped'}`}
      id={theme === 'tele' ? 'telerehab-recovery-roadmap' : 'physioathome-recovery-roadmap'}
      style={{ '--roadmap-phases': String(count) }}
      aria-labelledby={headingId}
      data-active-phase={safeIndex}
    >
      <div className={`roadmap-pin ${tokens.pin} text-white`}>
        <div className="absolute inset-0 roadmap-pin-grid pointer-events-none" aria-hidden />
        <div className="roadmap-pin-inner relative z-[1] max-w-7xl mx-auto">
          {isDesktop ? (
            <div className="roadmap-layout">
              <div className="roadmap-copy">
                <RoadmapIntro copy={copy} headingId={headingId} tokens={tokens} />
                <div className="roadmap-phase-slot" aria-live="polite">
                  <PhaseCopy key={phaseKey} phase={phase} index={safeIndex} tokens={tokens} />
                </div>
              </div>

              <PhaseVisual
                themeKey={themeKey}
                phase={phase}
                phaseIndex={safeIndex}
                eager
              />

              <SpecList specs={specs} tokens={tokens} />
            </div>
          ) : (
            <div className="roadmap-step">
              <RoadmapIntro copy={copy} headingId={headingId} tokens={tokens} />
              <div className="roadmap-phase-slot" aria-live="polite">
                <PhaseCopy key={phaseKey} phase={phase} index={safeIndex} tokens={tokens} />
              </div>
              <PhaseVisual
                themeKey={themeKey}
                phase={phase}
                phaseIndex={safeIndex}
                eager
              />
              <SpecList specs={specs} tokens={tokens} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
