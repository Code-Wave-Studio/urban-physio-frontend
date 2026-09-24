import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import SaveExerciseButton from './SaveExerciseButton';
import ExerciseMediaDisplay from './ExerciseMediaDisplay';
import { hasExerciseMedia } from '../../utils/mediaParser';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  advanced: 'bg-rose-50 text-rose-700 border-rose-100',
};

const AREA_FALLBACK = {
  back: 'from-teal-700 to-emerald-800',
  neck: 'from-slate-600 to-teal-800',
  knee: 'from-teal-600 to-slate-800',
  shoulder: 'from-emerald-700 to-teal-900',
  general: 'from-teal-700 to-emerald-900',
};

/**
 * Visual-first gallery card for the public Exercise Library.
 * Compact portrait media; thumbnails lazy-load; no autoplay.
 * Used by Exercise Library + home teaser — not patient HEP cards.
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
  const bodyArea = exercise?.body_area || 'general';

  const metaParts = [bodyArea].filter(Boolean);
  const dosing =
    exercise?.default_sets != null && exercise?.default_reps
      ? `${exercise.default_sets} × ${exercise.default_reps}`
      : null;
  const equipment =
    exercise?.equipment && String(exercise.equipment).toLowerCase() !== 'none'
      ? exercise.equipment
      : null;

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="exercise-gallery-card group flex flex-col overflow-hidden cursor-pointer bg-white border border-slate-200/90 rounded-xl shadow-sm hover:shadow-md hover:border-teal-200/80 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      onClick={() => onOpen?.(exercise)}
      onKeyDown={handleKeyDown}
    >
      <div className="exercise-gallery-media relative w-full shrink-0 overflow-hidden bg-slate-900 rounded-t-xl">
        {hasMedia ? (
          <>
            <ExerciseMediaDisplay
              exercise={exercise}
              title={name}
              variant="thumbnail"
              layout="portrait"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
            <span
              className="absolute bottom-2 left-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 text-teal-700 shadow-sm border border-white/90"
              aria-hidden="true"
            >
              <FaIcon icon="fa-play" className="text-[10px] ml-0.5" />
            </span>
          </>
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${AREA_FALLBACK[bodyArea] || AREA_FALLBACK.general}`}
          >
            <FaIcon icon="fa-dumbbell" className="text-2xl text-white/85" aria-hidden="true" />
          </div>
        )}

        {aiReady && (
          <span className="absolute top-2 left-2 z-[1] text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-teal-600/95 text-white leading-none">
            AI-Guided
          </span>
        )}
      </div>

      <div className="exercise-gallery-body px-3 pt-2.5 pb-2.5 flex flex-col flex-1 min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <h3 className="flex-1 min-w-0 font-semibold text-[0.9375rem] sm:text-base text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug tracking-tight">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {showSave && <SaveExerciseButton exercise={exercise} stopPropagation />}
            <span
              className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded border capitalize leading-none ${
                DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.beginner
              }`}
            >
              {difficulty}
            </span>
          </div>
        </div>

        <p className="mt-1 text-[11px] text-slate-500 capitalize leading-snug truncate">
          {[...metaParts, dosing, equipment].filter(Boolean).join(' · ')}
        </p>

        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:text-teal-800 min-h-8">
          Open Exercise
          <FaIcon icon="fa-arrow-right" className="text-[10px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </motion.article>
  );
}
