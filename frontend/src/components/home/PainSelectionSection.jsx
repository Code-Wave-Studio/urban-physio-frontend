import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { painSelection } from '../../services/api';
import {
  PAIN_POINTS,
  PAIN_SELECTION_DEFAULT_ID,
  getBodyHighlightSpots,
  getPainPointById,
  mapApiPainPoint,
  resolveTreatmentLink,
} from '../../constants/painSelectionData';
import { bookPainAreaUrl } from '../../utils/bookUrl';
import { useAuth } from '../../contexts/AuthContext';

const BOOK_ANCHOR_ID = 'book-care';

function publicAssetUrl(filename) {
  const raw = import.meta.env.BASE_URL ?? '/';
  const base = raw.endsWith('/') ? raw : `${raw}/`;
  return `${base}${String(filename).replace(/^\//, '')}`;
}

const PAIN_RUNNER_SOURCES = [publicAssetUrl('pain-runner.png'), publicAssetUrl('pain-runner.svg')];
/** Square frame at each breakpoint — proportional scale keeps % hotspots aligned */
const FIGURE_FRAME_CLASS =
  'relative mx-auto w-[268px] sm:w-[300px] md:w-[380px] lg:w-[500px] max-w-[calc(100vw-2rem)] aspect-square shrink-0';
const HOTSPOT_GLOW = 'h-3.5 w-3.5 sm:h-4 sm:w-4';

function ActiveBodyHighlight() {
  return (
    <span className={`pointer-events-none relative block shrink-0 rounded-full ${HOTSPOT_GLOW}`}>
      <motion.span
        className="absolute -inset-2 rounded-full bg-orange-400/40 blur-md"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.12, 0.92] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="absolute inset-0 rounded-full border-2 border-orange-500 bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.55)]" />
      <span className="absolute inset-[28%] rounded-full bg-white/80" />
    </span>
  );
}

function BodyPartHighlight({ activeId, spots }) {
  if (!spots.length) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeId}
        className="pointer-events-none absolute inset-0 z-[2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      >
        {spots.map((spot, index) => (
          <motion.div
            key={`${activeId}-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: spot.left, top: spot.top }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ActiveBodyHighlight />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

function PainRunnerVisual({ activeId, activeLabel, painPoints }) {
  const [srcIndex, setSrcIndex] = useState(0);
  const [imgBroken, setImgBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const active = useMemo(() => getPainPointById(activeId, painPoints), [activeId, painPoints]);
  const highlightSpots = useMemo(() => getBodyHighlightSpots(active), [active]);
  const label = activeLabel || active?.label || 'Body';
  const imgSrc = PAIN_RUNNER_SOURCES[srcIndex] || PAIN_RUNNER_SOURCES[0];

  const onImgError = () => {
    if (srcIndex < PAIN_RUNNER_SOURCES.length - 1) {
      setSrcIndex((i) => i + 1);
      setLoaded(false);
      return;
    }
    setImgBroken(true);
  };

  return (
    <div className={FIGURE_FRAME_CLASS}>
      <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/80 bg-gradient-to-br from-slate-50/90 via-white to-orange-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-2xl lg:rounded-3xl">
        {!imgBroken ? (
          <>
            <div className="relative h-full w-full">
              <img
                key={imgSrc}
                src={imgSrc}
                alt={`Anatomy figure highlighting ${label}`}
                className={`block h-full w-full select-none object-contain object-center transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'
                  }`}
                width={500}
                height={500}
                style={{ filter: 'drop-shadow(0 12px 28px rgba(15, 23, 42, 0.1))' }}
                draggable={false}
                decoding="async"
                fetchPriority="high"
                onLoad={() => setLoaded(true)}
                onError={onImgError}
              />
              {loaded && <BodyPartHighlight activeId={activeId} spots={highlightSpots} />}
            </div>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-9 w-9 animate-pulse rounded-full border-2 border-orange-200 border-t-orange-500" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-slate-500 sm:text-sm">
            <FaIcon icon="fa-person-running" className="text-3xl text-orange-300" />
            <p>Body map illustration</p>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing: {label}
      </p>
    </div>
  );
}

function PainTreatAccordion({ selectedId, onSelect, treatmentLink, painPoints, showInactiveList = true, className = '' }) {
  const selected = useMemo(() => getPainPointById(selectedId, painPoints), [selectedId, painPoints]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const inactiveItems = useMemo(
    () => painPoints.filter((p) => p.id !== selectedId),
    [painPoints, selectedId],
  );
  const description = selected.accordionDescription || selected.headline;

  return (
    <div className={`flex w-full flex-col ${showInactiveList ? 'h-full min-h-0' : ''} ${className}`}>
      <div
        className={`flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:rounded-2xl lg:h-full lg:min-h-0 lg:rounded-[1.25rem]`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5 lg:px-6"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">{selected.chipLabel}</h3>
              <Link
                to="/treatments"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="View all treatments"
              >
                <FaIcon icon="fa-xmark" className="text-sm" />
              </Link>
            </div>
            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600 sm:line-clamp-4 sm:text-sm lg:text-[15px]">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={treatmentLink}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.98] sm:px-5 sm:text-sm"
              >
                Know more
                <FaIcon icon="fa-arrow-right" className="text-[10px]" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const url = bookPainAreaUrl(selected.chipLabel, {
                    pain_description: selected.accordionDescription || selected.headline,
                  });
                  if (!user) {
                    navigate(`/login?redirect=${encodeURIComponent(url)}`);
                    return;
                  }
                  navigate(url);
                }}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full border-2 border-orange-500 bg-white px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 active:scale-[0.98] sm:px-5 sm:text-sm"
              >
                <FaIcon icon="fa-calendar-check" className="text-[10px]" />
                Book Appointment
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {showInactiveList && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-slate-50/50 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.5)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80">
          <p className="sticky top-0 z-[1] shrink-0 border-b border-slate-100 bg-slate-50/95 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-sm sm:px-5 sm:text-xs">
            Other body areas
          </p>
          {inactiveItems.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="group flex min-h-[46px] w-full shrink-0 items-center justify-between gap-3 border-b border-slate-100/90 px-4 py-3 text-left transition hover:bg-white active:bg-orange-50/50 sm:px-5 sm:py-3.5 lg:px-6 last:border-b-0"
            >
              <span className="text-sm font-semibold text-slate-800 transition group-hover:text-orange-600 sm:text-base">
                {p.chipLabel}
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition group-hover:border-orange-300 group-hover:bg-orange-500 group-hover:text-white">
                <FaIcon icon="fa-plus" className="text-[9px] sm:text-[10px]" />
              </span>
            </button>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

export default function PainSelectionSection() {
  const [painPoints, setPainPoints] = useState(PAIN_POINTS);
  const [selectedId, setSelectedId] = useState(PAIN_SELECTION_DEFAULT_ID);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    painSelection
      .list()
      .then((res) => {
        const items = (res.data?.items || []).map(mapApiPainPoint).filter(Boolean);
        if (items.length) {
          setPainPoints(items);
          const defaultId = res.data?.default_id;
          if (defaultId && items.some((p) => p.id === defaultId)) {
            setSelectedId(defaultId);
          } else {
            setSelectedId(items[0].id);
          }
        }
      })
      .catch(() => setPainPoints(PAIN_POINTS));
  }, []);

  useEffect(() => {
    if (!painPoints.some((p) => p.id === selectedId)) {
      setSelectedId(painPoints[0]?.id ?? PAIN_SELECTION_DEFAULT_ID);
    }
  }, [painPoints, selectedId]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const selected = useMemo(() => getPainPointById(selectedId, painPoints), [selectedId, painPoints]);
  const treatmentLink = useMemo(() => resolveTreatmentLink(selected), [selected]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <section
      className="relative mb-12 px-4 py-8 sm:mb-16 sm:px-6 sm:py-10 lg:mb-24 lg:flex lg:h-[80vh] lg:min-h-[520px] lg:max-h-[920px] lg:flex-col lg:overflow-hidden lg:px-12 lg:py-14"
      aria-labelledby="pain-selection-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-orange-50/25 to-white" />
      <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-orange-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:h-full lg:min-h-0">
        {/* Header — compact on mobile */}
        <div className="shrink-0 text-center lg:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
            What we treat
          </p>
          <h2 id="pain-selection-heading" className="mt-1 text-xl font-bold leading-snug text-slate-900 sm:mt-2 sm:text-2xl">
            Reclaim <span className="text-orange-500">Your Movement.</span>{' '}
            Restore <span className="text-orange-500">Your Life.</span>
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600 sm:text-sm">
            Tap a body area below — the figure highlights where we can help.
          </p>
        </div>

        {/* Mobile / tablet — scrollable body area pills */}
        <div className="relative mt-3 shrink-0 lg:hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-white via-white/80 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-white via-white/80 to-transparent"
            aria-hidden
          />
          <div className="flex gap-2 overflow-x-auto pb-1 pl-1 pr-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {painPoints.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                aria-pressed={p.id === selectedId}
                className={`shrink-0 snap-center rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all duration-200 sm:px-4 sm:py-2.5 sm:text-xs ${
                  p.id === selectedId
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-200'
                    : 'border border-slate-200/90 bg-white/95 text-slate-700 active:scale-95'
                }`}
              >
                {p.chipLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Main layout — natural flow on mobile, 3-col on desktop */}
        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:gap-5 lg:mt-0 lg:min-h-0 lg:flex-1 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-5 xl:gap-8">
          {/* Left copy — desktop only */}
          <div className="hidden min-h-0 flex-col justify-center lg:col-span-3 lg:flex">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">What we treat</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-tight text-slate-900 xl:text-[2.35rem]">
              Reclaim <span className="text-orange-500">Your Movement.</span>
              <br />
              Restore <span className="text-orange-500">Your Life.</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600 xl:text-base">
              Explore targeted physiotherapy solutions for every body region, guided by trusted specialists — select a body area to explore treatments.
            </p>
            <svg viewBox="0 0 120 80" className="mt-5 h-14 w-24 text-orange-400/70 xl:h-16 xl:w-28" aria-hidden>
              <path
                d="M8 40 C30 10, 55 70, 95 35"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              <path d="M92 35 L105 32 L98 45 Z" fill="currentColor" />
            </svg>
          </div>

          {/* Figure — square frame keeps hotspots aligned at every size */}
          <div className="flex shrink-0 flex-col items-center lg:col-span-5 lg:justify-center">
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={reduceMotion ? undefined : 'motion-safe:lg:animate-float'}>
                <PainRunnerVisual activeId={selectedId} activeLabel={selected.label} painPoints={painPoints} />
              </div>
            </motion.div>
            <p className="mt-2 text-center text-xs font-medium text-slate-500 lg:hidden">
              Highlighting{' '}
              <span className="font-bold text-orange-500">{selected.chipLabel}</span>
            </p>
          </div>

          {/* Accordion — compact card on mobile, full list on desktop */}
          <div className="w-full shrink-0 lg:col-span-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <motion.div
              className="lg:min-h-0 lg:flex-1"
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <PainTreatAccordion
                selectedId={selectedId}
                onSelect={handleSelect}
                treatmentLink={treatmentLink}
                painPoints={painPoints}
                showInactiveList={false}
                className="lg:hidden"
              />
              <PainTreatAccordion
                selectedId={selectedId}
                onSelect={handleSelect}
                treatmentLink={treatmentLink}
                painPoints={painPoints}
                showInactiveList
                className="hidden lg:flex h-full"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { BOOK_ANCHOR_ID };
