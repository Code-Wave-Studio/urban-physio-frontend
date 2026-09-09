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
    const sync = () => setVh(window.innerHeight);
    sync();
    window.addEventListener('resize', sync, { passive: true });
    return () => window.removeEventListener('resize', sync);
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

const STEP_COOLDOWN_MS = 520;
const WHEEL_STEP_PX = 40;
const SWIPE_STEP_PX = 42;
const IN_VIEW_RATIO = 0.55;
const LEFT_VIEW_RATIO = 0.22;

function wheelDeltaY(event) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * (window.innerHeight || 1);
  return event.deltaY;
}

function syncSteppedFrameHeight(section) {
  if (!section) return;
  const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
  if (h > 0) section.style.setProperty('--roadmap-vvh', `${h}px`);
}

function measureSection(section) {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  return { rect, vh, top: rect.top, ratio: Math.max(0, visible) / vh };
}

function holdScroll(event) {
  if (event.cancelable) event.preventDefault();
}

/** Mobile/tablet: one swipe or wheel tick = one phase. Desktop scroll is unchanged. */
function useSteppedPhaseScroll({ enabled, count, sectionRef, activeRef, setActive }) {
  useEffect(() => {
    if (!enabled || count < 2) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;

    let locked = false;
    let exitDir = 0;
    let lastStepAt = 0;
    let eatUntil = 0;
    let wheelAcc = 0;
    let touchStartY = 0;
    let touchConsumed = false;
    let near = false;
    let frame = 0;

    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const index = () => activeRef.current;
    const canGo = (dir) => {
      if (dir > 0) return index() < count - 1;
      if (dir < 0) return index() > 0;
      return false;
    };

    const goTo = (next) => {
      const clamped = Math.min(count - 1, Math.max(0, next));
      if (clamped === index()) return false;
      activeRef.current = clamped;
      setActive(clamped);
      return true;
    };

    const step = (dir) => {
      if (!canGo(dir)) return false;
      if (!goTo(index() + dir)) return false;
      const t = now();
      lastStepAt = t;
      eatUntil = t + STEP_COOLDOWN_MS;
      wheelAcc = 0;
      locked = true;
      exitDir = 0;
      return true;
    };

    const release = (dir) => {
      locked = false;
      exitDir = dir;
      wheelAcc = 0;
      eatUntil = 0;
      const { ratio } = measureSection(section);
      if (ratio > 0.8) {
        const nudge = Math.round((window.innerHeight || 640) * 0.22);
        window.scrollBy(0, dir * nudge);
      }
    };

    const capture = (side) => {
      locked = true;
      exitDir = 0;
      wheelAcc = 0;
      eatUntil = now() + 280;
      if (side === 'below') goTo(count - 1);
      else if (side === 'above') goTo(0);
    };

    const syncLockFromView = (dirHint = 0) => {
      syncSteppedFrameHeight(section);
      const { ratio, top } = measureSection(section);

      if (exitDir) {
        if (ratio < LEFT_VIEW_RATIO) {
          exitDir = 0;
          locked = false;
          return;
        }
        if (dirHint && dirHint === -exitDir && ratio >= IN_VIEW_RATIO) {
          capture(exitDir > 0 ? 'below' : 'above');
        }
        return;
      }

      if (locked) {
        if (ratio < LEFT_VIEW_RATIO) locked = false;
        return;
      }

      if (ratio < IN_VIEW_RATIO) return;
      if (dirHint > 0) capture('above');
      else if (dirHint < 0) capture('below');
      else if (top >= -12 && top <= 32) capture(top < -64 ? 'below' : 'above');
    };

    const onScrollOrResize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncLockFromView(0);
      });
    };

    const consumePhaseGesture = (event, dir, dyAbs, t) => {
      if (!canGo(dir)) {
        const sameGesture = event.type === 'wheel' ? t < eatUntil : touchConsumed;
        if (sameGesture) {
          holdScroll(event);
          return false;
        }
        release(dir);
        return false;
      }

      if (t < eatUntil) {
        holdScroll(event);
        return false;
      }

      holdScroll(event);

      if (event.type === 'wheel') {
        wheelAcc += dyAbs * dir;
        if (Math.abs(wheelAcc) < WHEEL_STEP_PX) return false;
        if (t - lastStepAt < STEP_COOLDOWN_MS) {
          wheelAcc = 0;
          return false;
        }
        return step(dir);
      }

      if (touchConsumed || dyAbs < SWIPE_STEP_PX) return false;
      if (t - lastStepAt < STEP_COOLDOWN_MS) return false;
      touchConsumed = true;
      return step(dir);
    };

    const onWheel = (event) => {
      if (!near || event.ctrlKey) return;
      const dy = wheelDeltaY(event);
      if (dy === 0) return;
      const dir = dy > 0 ? 1 : -1;
      const t = now();

      if (exitDir === dir) return;
      if (exitDir && dir === -exitDir) {
        syncLockFromView(dir);
      } else if (!locked) {
        syncLockFromView(dir);
      }

      if (exitDir === dir || !locked) return;
      consumePhaseGesture(event, dir, Math.abs(dy), t);
    };

    const onTouchStart = (event) => {
      if (!event.touches[0] || !section.contains(event.target)) return;
      touchStartY = event.touches[0].clientY;
      touchConsumed = false;
    };

    const onTouchMove = (event) => {
      if (!near || !event.touches[0] || !section.contains(event.target)) return;
      const dy = touchStartY - event.touches[0].clientY;
      const dir = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      if (!dir) return;
      const t = now();

      if (exitDir === dir) return;
      if (exitDir && dir === -exitDir) {
        syncLockFromView(dir);
      } else if (!locked) {
        syncLockFromView(dir);
      }

      if (exitDir === dir || !locked) return;
      consumePhaseGesture(event, dir, Math.abs(dy), t);
    };

    const onTouchEnd = () => {
      touchConsumed = false;
      if (locked && (!canGo(1) || !canGo(-1))) eatUntil = 0;
    };

    const attach = () => {
      if (near) return;
      near = true;
      syncSteppedFrameHeight(section);
      window.addEventListener('wheel', onWheel, { passive: false, capture: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
      syncLockFromView(0);
    };

    const detach = () => {
      if (!near) return;
      near = false;
      locked = false;
      exitDir = 0;
      wheelAcc = 0;
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) attach();
        else detach();
      },
      { rootMargin: '20% 0px', threshold: 0 }
    );

    syncSteppedFrameHeight(section);
    io.observe(section);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onScrollOrResize);

    return () => {
      detach();
      io.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.visualViewport?.removeEventListener('resize', onScrollOrResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [activeRef, count, enabled, sectionRef, setActive]);
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

  useSteppedPhaseScroll({
    enabled: !isDesktop,
    count,
    sectionRef: trackRef,
    activeRef,
    setActive,
  });

  const syncFromScroll = useCallback(() => {
    if (!isDesktop || count < 1) return;
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
  }, [count, vh, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return undefined;
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
  }, [syncFromScroll, isDesktop]);

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
      className={`roadmap-section ${tokens.section}${isDesktop ? ' is-pinned' : ' is-stepped'}`}
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
                key={`visual-${phaseKey}`}
                themeKey={themeKey}
                phase={phase}
                phaseIndex={safeIndex}
                eager
              />
              <SpecList key={`specs-${phaseKey}`} specs={specs} tokens={tokens} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
