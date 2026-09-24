import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import { breadcrumbSchema, medicalWebPageSchema } from '../components/seo/PageMeta';
import SaveExerciseButton from '../components/exercise/SaveExerciseButton';
import ExerciseMediaDisplay from '../components/exercise/ExerciseMediaDisplay';
import ExerciseInstructions from '../components/exercise/ExerciseInstructions';
import { exercises } from '../services/api';
import { bookExerciseUrl } from '../utils/bookUrl';
import { exerciseDetailPath, normalizeExerciseDetailPayload } from '../utils/exerciseDetail';
import { hasExerciseMedia, parseMediaSource } from '../utils/mediaParser';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  intermediate: 'bg-amber-50 text-amber-800 border-amber-100',
  advanced: 'bg-rose-50 text-rose-800 border-rose-100',
};

function MetricCard({ label, value, suffix = '' }) {
  if (value == null || value === '' || value === '—') return null;
  return (
    <div className="text-center px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
      <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums leading-none">
        {value}
        {suffix ? <span className="text-xs font-semibold text-slate-500 ml-0.5">{suffix}</span> : null}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mt-1.5">{label}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 w-full animate-pulse">
      <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="aspect-[4/5] rounded-2xl bg-slate-200" />
        </div>
        <div className="lg:col-span-7 space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="h-32 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function ExerciseDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = slug ? decodeURIComponent(slug) : '';
    setLoading(true);
    setError(false);
    setItem(null);

    if (!key) {
      setError(true);
      setLoading(false);
      return undefined;
    }

    exercises
      .get(key)
      .then((res) => {
        if (cancelled) return;
        const exercise = normalizeExerciseDetailPayload(res, key);
        if (!exercise) {
          setError(true);
          setItem(null);
          return;
        }
        setItem(exercise);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setItem(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const media = useMemo(() => (item ? parseMediaSource(item) : null), [item]);
  const hasMedia = item ? hasExerciseMedia(item) : false;
  const aiReady = Boolean(item?.kinestex?.ai_supported && item?.kinestex?.mapped);
  const difficulty = item?.difficulty || null;
  const bodyArea = item?.body_area || item?.category || null;

  const metrics = useMemo(() => {
    if (!item) return [];
    const list = [];
    if (item.default_sets != null && item.default_sets !== '') {
      list.push({ label: 'Sets', value: item.default_sets });
    }
    if (item.default_reps != null && String(item.default_reps).trim() !== '') {
      list.push({ label: 'Reps', value: item.default_reps });
    }
    if (item.default_hold_seconds != null && item.default_hold_seconds !== '' && Number(item.default_hold_seconds) > 0) {
      list.push({ label: 'Hold', value: item.default_hold_seconds, suffix: 's' });
    }
    return list;
  }, [item]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/80">
        <Navbar />
        <DetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/80">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center flex-1">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FaIcon icon="fa-dumbbell" className="text-xl" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Exercise not found</h1>
          <p className="text-sm text-slate-600 mt-2">
            This exercise may have been removed or the link is invalid.
          </p>
          <Link to="/exercises" className="btn-primary inline-flex items-center gap-2 mt-6 min-h-11">
            <FaIcon icon="fa-arrow-left" aria-hidden="true" />
            Back to Exercise Library
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const name = item.name || 'Exercise';
  const fallbackTitle = `${name} — Physiotherapy Exercise | The Urban Physio`;
  const fallbackDescription =
    (item.instructions ? String(item.instructions).slice(0, 155) : '') ||
    `Learn how to perform ${name}, a physiotherapy exercise for ${bodyArea || 'recovery'}.`;
  const detailPath = exerciseDetailPath(item);
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Exercises', href: '/exercises' },
    { label: name },
  ];
  const jsonLd = [
    medicalWebPageSchema({
      name,
      description: fallbackDescription,
      canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}${detailPath}` : detailPath,
      about: name,
    }),
    breadcrumbSchema(crumbs),
  ].filter(Boolean);

  const mediaLayout = media?.type === 'youtube' || media?.type === 'video' ? 'portrait' : 'portrait';

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-teal-50/20">
      <Navbar />
      <ManagedPageSeo
        pathOverride={detailPath}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
        jsonLd={jsonLd}
        canonical={detailPath}
      />

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-8 pb-10 md:pb-14">
          <SeoBreadcrumbs tone="onLight" items={crumbs} />

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start mt-2">
            {/* LEFT — demonstration */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-3 lg:sticky lg:top-24">
              {hasMedia ? (
                <ExerciseMediaDisplay
                  exercise={item}
                  title={name}
                  variant="player"
                  layout={mediaLayout}
                />
              ) : item.image_url ? (
                <img
                  src={item.image_url}
                  alt={`${name} physiotherapy exercise`}
                  className="w-full aspect-[4/5] max-h-[min(70vh,560px)] object-contain rounded-2xl bg-slate-900 border border-slate-200"
                />
              ) : (
                <div
                  className="w-full aspect-[4/5] max-h-[min(70vh,560px)] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2 px-6 text-center"
                  role="img"
                  aria-label="No demonstration available"
                >
                  <FaIcon icon="fa-image" className="text-3xl opacity-70" aria-hidden="true" />
                  <p className="text-sm font-medium">No demonstration available</p>
                </div>
              )}

              {Array.isArray(item.gallery_images) && item.gallery_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Exercise gallery">
                  {item.gallery_images.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover shrink-0 border border-slate-200"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — info */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5 min-w-0">
              <header>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {bodyArea && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 capitalize">
                      {bodyArea}
                    </span>
                  )}
                  {difficulty && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.beginner
                      }`}
                    >
                      {difficulty}
                    </span>
                  )}
                  {aiReady && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800">
                      AI-Guided when prescribed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                  {name}
                </h1>
                {item.instructions && (
                  <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
                    {String(item.instructions).split(/\r?\n/).filter(Boolean)[0]}
                  </p>
                )}
              </header>

              {metrics.length > 0 && (
                <div className={`grid gap-2.5 ${metrics.length === 1 ? 'grid-cols-1 max-w-[140px]' : metrics.length === 2 ? 'grid-cols-2 max-w-xs' : 'grid-cols-3'}`}>
                  {metrics.map((m) => (
                    <MetricCard key={m.label} label={m.label} value={m.value} suffix={m.suffix} />
                  ))}
                </div>
              )}

              {item.equipment && String(item.equipment).trim() && String(item.equipment).toLowerCase() !== 'none' && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <FaIcon icon="fa-toolbox" className="text-teal-600" aria-hidden="true" />
                  <span>
                    Equipment: <span className="font-semibold text-slate-800">{item.equipment}</span>
                  </span>
                </p>
              )}

              {aiReady && (
                <div className="rounded-xl bg-teal-50/90 border border-teal-100 px-4 py-3 text-sm text-teal-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <FaIcon icon="fa-person-walking" aria-hidden="true" />
                    AI monitoring available when prescribed
                  </p>
                  <p className="mt-1 text-teal-800/90 text-xs leading-relaxed">
                    When your physiotherapist assigns this exercise with AI monitoring, you can start guided sessions from My Rehab Plan.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Link
                  to={bookExerciseUrl(item)}
                  className="btn-primary inline-flex items-center justify-center gap-2 min-h-11"
                >
                  <FaIcon icon="fa-calendar-check" aria-hidden="true" />
                  Book Appointment
                </Link>
                <SaveExerciseButton exercise={item} compact={false} />
              </div>
            </div>
          </div>

          {/* How to Perform — full width */}
          <section className="mt-8 md:mt-10 rounded-2xl border border-slate-200/90 bg-white p-5 md:p-7 shadow-sm">
            <ExerciseInstructions
              steps={item.steps}
              instructions={item.instructions}
              exercise_instructions={item.exercise_instructions}
            />
          </section>

          {item.precautions && (
            <section className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3.5 text-sm text-amber-950">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <FaIcon icon="fa-triangle-exclamation" aria-hidden="true" />
                Precautions
              </p>
              <p className="leading-relaxed whitespace-pre-wrap">{item.precautions}</p>
            </section>
          )}

          {item.pdf_url && (
            <a
              href={item.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2 mt-4 min-h-10 text-sm"
            >
              <FaIcon icon="fa-file-pdf" aria-hidden="true" />
              Download PDF instructions
            </a>
          )}

          {/* Compact secondary CTA */}
          <aside className="mt-8 md:mt-10 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-4 md:px-5 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm md:text-base">Need personalised guidance?</p>
              <p className="text-slate-600 text-xs md:text-sm mt-0.5">
                Book a verified physiotherapist for a tailored exercise program.
              </p>
            </div>
            <Link
              to={bookExerciseUrl(item)}
              className="btn-outline shrink-0 inline-flex items-center justify-center gap-2 min-h-10 text-sm border-teal-300 text-teal-800 hover:bg-teal-50"
            >
              Book Appointment
            </Link>
          </aside>

          <Link
            to="/exercises"
            className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-teal-700 hover:text-teal-800 min-h-10"
          >
            <FaIcon icon="fa-arrow-left" aria-hidden="true" />
            Back to Exercise Library
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
