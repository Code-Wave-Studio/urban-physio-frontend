import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import { breadcrumbSchema, medicalWebPageSchema } from '../components/seo/PageMeta';
import SaveExerciseButton from '../components/exercise/SaveExerciseButton';
import { exercises } from '../services/api';
import { bookExerciseUrl } from '../utils/bookUrl';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const AREA_GRADIENT = {
  back: 'from-violet-500/20 to-purple-500/10',
  neck: 'from-sky-500/20 to-blue-500/10',
  knee: 'from-orange-500/20 to-amber-500/10',
  shoulder: 'from-rose-500/20 to-pink-500/10',
  general: 'from-teal-500/20 to-emerald-500/10',
};

export default function ExerciseDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    exercises
      .get(slug)
      .then((res) => setItem(res.data || res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center flex-1">
          <h1 className="text-2xl font-bold">Exercise not found</h1>
          <Link to="/exercises" className="btn-primary inline-block mt-6">
            View exercise library
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const fallbackTitle = `${item.name} — Physiotherapy Exercise | The Urban Physio`;
  const fallbackDescription =
    (item.instructions ? String(item.instructions).slice(0, 155) : '') ||
    `Learn how to perform ${item.name}, a physiotherapy exercise for ${item.body_area || 'recovery'}.`;
  const canonical = `/exercises/${item.slug}`;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Exercises', href: '/exercises' },
    { label: item.name },
  ];
  const jsonLd = [
    medicalWebPageSchema({
      name: item.name,
      description: fallbackDescription,
      canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical,
      about: item.name,
    }),
    breadcrumbSchema(crumbs),
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ManagedPageSeo
        pathOverride={canonical}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
        jsonLd={jsonLd}
        canonical={canonical}
      />

      <section
        className={`bg-gradient-to-br ${AREA_GRADIENT[item.body_area] || AREA_GRADIENT.general} border-b border-white/60 py-8 md:py-12`}
      >
        <div className="max-w-4xl mx-auto px-4">
          <SeoBreadcrumbs tone="onLight" items={crumbs} />
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 capitalize">
              {item.body_area}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${
                DIFFICULTY_STYLES[item.difficulty] || DIFFICULTY_STYLES.beginner
              }`}
            >
              {item.difficulty || 'beginner'}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800">{item.name}</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 w-full space-y-6">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={`${item.name} physiotherapy exercise`}
            className="w-full max-h-96 object-cover rounded-2xl"
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xl font-bold text-slate-800">{item.default_sets ?? '—'}</p>
            <p className="text-[10px] uppercase text-slate-500 font-semibold">Sets</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xl font-bold text-slate-800">{item.default_reps ?? '—'}</p>
            <p className="text-[10px] uppercase text-slate-500 font-semibold">Reps</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xl font-bold text-slate-800">{item.default_hold_seconds || '—'}</p>
            <p className="text-[10px] uppercase text-slate-500 font-semibold">Hold (s)</p>
          </div>
        </div>

        {item.equipment && (
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <FaIcon icon="fa-toolbox" className="text-teal-600" />
            Equipment: <span className="font-semibold text-slate-800">{item.equipment}</span>
          </p>
        )}

        <div className="glass-card">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-teal-700">
            <FaIcon icon="fa-list-ol" />
            Instructions
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
            {item.instructions || 'Open the exercise library for full instructions.'}
          </p>
        </div>

        {item.video_url && (
          <div className="glass-card">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-teal-700">
              <FaIcon icon="fa-circle-play" />
              Video
            </h2>
            <a
              href={item.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all"
            >
              Watch demonstration
            </a>
          </div>
        )}

        <div className="glass-strong rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Need personalised guidance?</h3>
            <p className="text-slate-600 text-sm mt-1">
              Book a verified physiotherapist for a tailored exercise program.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              to={bookExerciseUrl(item)}
              className="btn-primary text-center inline-flex items-center justify-center gap-2"
            >
              <FaIcon icon="fa-calendar-check" />
              Book Appointment
            </Link>
            <SaveExerciseButton exercise={item} compact={false} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
