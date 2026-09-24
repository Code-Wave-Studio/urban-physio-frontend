import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import SaveExerciseButton from './SaveExerciseButton';
import ExerciseMediaDisplay from './ExerciseMediaDisplay';
import { hasExerciseMedia } from '../../utils/mediaParser';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const BAR_GRADIENT = {
  back: 'from-violet-500 to-purple-500',
  neck: 'from-sky-500 to-blue-500',
  knee: 'from-orange-500 to-amber-500',
  shoulder: 'from-rose-500 to-pink-500',
  general: 'from-teal-500 to-emerald-500',
};

/**
 * Visual-first gallery card for the public Exercise Library.
 * Portrait media container; thumbnails lazy-load; no autoplay.
 */
export default function ExerciseGalleryCard({
  exercise,
  index = 0,
  onOpen,
  showSave = true,
}) {
  const hasMedia = hasExerciseMedia(exercise);
  const aiReady = Boolean(exercise?.kinestex?.ai_supported && exercise?.kinestex?.mapped);
  const name = exercise?.name || 'Exercise';
  const difficulty = exercise?.difficulty || 'beginner';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.(exercise);
    }
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      aria-label={`View ${name}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="exercise-gallery-card group glass-card !p-0 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/70 flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      onClick={() => onOpen?.(exercise)}
      onKeyDown={handleKeyDown}
    >
      <div className="exercise-gallery-media relative w-full shrink-0 overflow-hidden bg-slate-950">
        {hasMedia ? (
          <>
            <ExerciseMediaDisplay
              exercise={exercise}
              title={name}
              variant="thumbnail"
              layout="portrait"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
            <span
              className="absolute bottom-3 left-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-teal-700 shadow-md border border-white/80"
              aria-hidden="true"
            >
              <FaIcon icon="fa-play" className="text-sm ml-0.5" />
            </span>
          </>
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${BAR_GRADIENT[exercise?.body_area] || BAR_GRADIENT.general} opacity-90`}
          >
            <FaIcon icon="fa-dumbbell" className="text-4xl text-white/90" />
          </div>
        )}

        {aiReady && (
          <span className="absolute top-2.5 left-2.5 z-[1] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-teal-600 text-white shadow-sm">
            AI-Guided
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 capitalize truncate">
            {exercise?.body_area || 'general'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {showSave && <SaveExerciseButton exercise={exercise} stopPropagation />}
            <span
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize min-h-[22px] ${
                DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.beginner
              }`}
            >
              {difficulty}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-base sm:text-lg text-slate-800 mt-2 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
          {name}
        </h3>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800">
            {exercise?.default_sets ?? '—'} × {exercise?.default_reps ?? '—'}
          </span>
          {exercise?.equipment ? (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 line-clamp-1 max-w-full">
              {exercise.equipment}
            </span>
          ) : null}
        </div>

        <p className="mt-auto pt-4 text-sm font-semibold text-teal-600 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
          Open exercise
          <FaIcon icon="fa-arrow-right" className="text-xs" aria-hidden="true" />
        </p>
      </div>
    </motion.article>
  );
}
