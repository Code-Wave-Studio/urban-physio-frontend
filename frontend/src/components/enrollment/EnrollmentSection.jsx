import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';
import { isFlagOn } from '../../constants/communityPreview';
import {
  HOME_ENROL_DEFAULTS,
  TELE_ENROL_DEFAULTS,
  defaultEnrolIndex,
  enrolImageAlt,
  visibleEnrolSteps,
} from '../../constants/enrollmentDefaults';
import EnrolStepVisual from './EnrolStepVisual';

const THEMES = {
  home: { defaults: HOME_ENROL_DEFAULTS, section: 'enrol-theme-home' },
  tele: { defaults: TELE_ENROL_DEFAULTS, section: 'enrol-theme-tele' },
};

function Heading({ heading, highlight }) {
  if (!heading) return null;
  if (highlight && heading.includes(highlight)) {
    const [before, ...rest] = heading.split(highlight);
    return (
      <>
        {before}
        <span className="enrol-heading-accent">{highlight}</span>
        {rest.join(highlight)}
      </>
    );
  }
  return heading;
}

function loopOffset(index, total, radius) {
  const n = Math.max(total, 1);
  const theta = Math.PI + (index * 2 * Math.PI) / n;
  return { x: Math.cos(theta) * radius, y: Math.sin(theta) * radius };
}

function HexButton({ step, index, state, onSelect, hexRef }) {
  const label = String(step.label || step.title || `Step ${index + 1}`).trim();
  return (
    <div className={`enrol-hex-wrap is-${state}`} ref={hexRef}>
      <button
        type="button"
        className="enrol-hex"
        onClick={() => onSelect(index)}
        aria-current={state === 'active' ? 'step' : undefined}
        aria-label={`${label}${state === 'active' ? ', current step' : state === 'done' ? ', completed' : ', upcoming'}`}
      >
        <span className="enrol-hex-label">{label}</span>
      </button>
    </div>
  );
}

function DetailVisual({ step, loaded }) {
  const src = sanitizeCmsImageUrl(step?.image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed && loaded) {
    return (
      <img
        src={src}
        alt=""
        className="enrol-detail-img"
        onError={() => setFailed(true)}
      />
    );
  }

  return <EnrolStepVisual visual={step?.visual || 'consult'} />;
}

export default function EnrollmentSection({ theme = 'home', sections = {} }) {
  const tokens = THEMES[theme] || THEMES.home;
  const copy = { ...tokens.defaults, ...sections };
  const steps = useMemo(() => visibleEnrolSteps(copy.enrol_steps), [copy.enrol_steps]);
  const reduceMotion = useReducedMotion();
  const initial = defaultEnrolIndex(steps, copy.enrol_default_step);
  const [active, setActive] = useState(initial);
  const [pathD, setPathD] = useState('');
  const [loopCircle, setLoopCircle] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const [viewport, setViewport] = useState(1280);
  const stageRef = useRef(null);
  const hexRefs = useRef([]);
  const loopRef = useRef(null);

  const count = steps.length;
  const safeIndex = count ? Math.min(active, count - 1) : 0;

  useEffect(() => {
    setActive(defaultEnrolIndex(steps, copy.enrol_default_step));
  }, [copy.enrol_default_step, steps]);

  const groups = useMemo(() => {
    const linear = [];
    const loop = [];
    steps.forEach((step, index) => {
      const row = { step, index };
      if (isFlagOn(step.in_loop)) loop.push(row);
      else linear.push(row);
    });
    return { linear, loop };
  }, [steps]);

  const loopRadius = useMemo(() => {
    if (viewport < 480) return groups.loop.length > 4 ? 92 : 82;
    if (viewport < 900) return groups.loop.length > 4 ? 102 : 92;
    if (viewport < 1100) return groups.loop.length > 4 ? 98 : 90;
    return groups.loop.length > 4 ? 118 : 108;
  }, [groups.loop.length, viewport]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageBox = stage.getBoundingClientRect();
    const centerOf = (el) => {
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2 - stageBox.left,
        y: box.top + box.height / 2 - stageBox.top,
      };
    };
    const pts = [];
    groups.linear.forEach(({ index }) => {
      const el = hexRefs.current[index];
      if (el) pts.push(centerOf(el));
    });
    if (groups.loop[0]) {
      const el = hexRefs.current[groups.loop[0].index];
      if (el) pts.push(centerOf(el));
    }

    if (pts.length >= 2) {
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      setPathD(d);
    } else {
      setPathD('');
    }

    const loopEl = loopRef.current;
    if (loopEl && groups.loop.length) {
      const box = loopEl.getBoundingClientRect();
      setLoopCircle({
        cx: box.left + box.width / 2 - stageBox.left,
        cy: box.top + box.height / 2 - stageBox.top,
        r: Math.min(box.width, box.height) * 0.31,
      });
    } else {
      setLoopCircle(null);
    }
  }, [groups.linear, groups.loop]);

  useEffect(() => {
    const sync = () => setViewport(window.innerWidth);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useLayoutEffect(() => {
    hexRefs.current = hexRefs.current.slice(0, count);
    measure();
    const frame = window.requestAnimationFrame(measure);
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(frame);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(stage);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [count, groups.linear.length, groups.loop.length, loopRadius, measure, safeIndex]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDrawn(true);
      },
      { threshold: 0.25 }
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  const selectStep = useCallback((index) => {
    setActive(index);
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (!count) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((prev) => Math.min(count - 1, prev + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((prev) => Math.max(0, prev - 1));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActive(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActive(count - 1);
      }
    },
    [count]
  );

  if (!count || !isFlagOn(copy.enrol_enabled ?? '1')) return null;

  const current = steps[safeIndex];
  const headingId = theme === 'tele' ? 'tele-enrol-heading' : 'hp-enrol-heading';
  const hexState = (index) => {
    if (index === safeIndex) return 'active';
    if (index < safeIndex) return 'done';
    return 'upcoming';
  };

  const linearPos = groups.linear.findIndex((row) => row.index === safeIndex);
  const lineStops = Math.max(groups.linear.length - 1 + (groups.loop.length ? 1 : 0), 1);
  const progressPct =
    count <= 1
      ? 100
      : linearPos >= 0
        ? (linearPos / lineStops) * 100
        : 100;

  return (
    <section
      className={`enrol-section ${tokens.section}`}
      id={theme === 'tele' ? 'telephysio-how-to-enrol' : 'physioathome-how-to-enrol'}
      aria-labelledby={headingId}
    >
      <div className="enrol-inner">
        <header className="enrol-header">
          {copy.enrol_label ? <p className="enrol-label">{copy.enrol_label}</p> : null}
          <h2 id={headingId} className="enrol-heading">
            <Heading heading={copy.enrol_heading} highlight={copy.enrol_highlight} />
          </h2>
          {copy.enrol_intro ? <p className="enrol-intro">{copy.enrol_intro}</p> : null}
        </header>

        <div
          className={`enrol-stage${groups.loop.length ? ' has-loop' : ''}${drawn ? ' is-drawn' : ''}`}
          ref={stageRef}
          role="navigation"
          aria-label="Enrollment steps"
          onKeyDown={onKeyDown}
        >
          <svg className="enrol-path" aria-hidden="true">
            {loopCircle ? (
              <circle
                className="enrol-path-loop"
                cx={loopCircle.cx}
                cy={loopCircle.cy}
                r={loopCircle.r}
              />
            ) : null}
            {pathD ? (
              <>
                <path className="enrol-path-track" d={pathD} pathLength="100" />
                <path
                  className="enrol-path-progress"
                  d={pathD}
                  pathLength="100"
                  style={{
                    strokeDasharray: `${progressPct} 100`,
                    transitionDuration: reduceMotion ? '0.01ms' : '0.45s',
                  }}
                />
              </>
            ) : null}
          </svg>

          {groups.linear.length > 0 ? (
            <ol className="enrol-linear" aria-label="Enrollment pathway">
              {groups.linear.map(({ step, index }) => (
                <li key={step.id || `linear-${index}`} className="enrol-linear-item">
                  <HexButton
                    step={step}
                    index={index}
                    state={hexState(index)}
                    onSelect={selectStep}
                    hexRef={(el) => {
                      hexRefs.current[index] = el;
                    }}
                  />
                </li>
              ))}
            </ol>
          ) : null}

          {groups.loop.length > 0 ? (
            <div className="enrol-loop" ref={loopRef} aria-label="Ongoing care loop">
              <span className="enrol-loop-disk" aria-hidden="true" />
              {groups.loop.map(({ step, index }, loopIndex) => {
                const pos = loopOffset(loopIndex, groups.loop.length, loopRadius);
                return (
                  <div
                    key={step.id || `loop-${index}`}
                    className="enrol-loop-item"
                    style={{
                      transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                    }}
                  >
                    <HexButton
                      step={step}
                      index={index}
                      state={hexState(index)}
                      onSelect={selectStep}
                      hexRef={(el) => {
                        hexRefs.current[index] = el;
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="enrol-detail" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id || safeIndex}
              className="enrol-detail-grid"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="enrol-detail-copy">
                <h3 className="enrol-detail-title">{current.title || current.label}</h3>
                {current.description ? <p className="enrol-detail-body">{current.description}</p> : null}
              </div>
              <div className="enrol-detail-visual" aria-hidden={!enrolImageAlt(current)}>
                <span className="sr-only">{enrolImageAlt(current)}</span>
                <DetailVisual step={current} loaded />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
