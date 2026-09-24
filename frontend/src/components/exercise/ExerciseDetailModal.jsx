import { Link } from 'react-router-dom';
import ExerciseBottomSheet from './ExerciseBottomSheet';
import ExerciseInstructions from './ExerciseInstructions';
import ExerciseMediaDisplay from './ExerciseMediaDisplay';
import FaIcon from '../FaIcon';
import { bookExerciseUrl } from '../../utils/bookUrl';
import { hasExerciseMedia } from '../../utils/mediaParser';

const AREA_GRADIENT = {
  back: 'bg-gradient-to-br from-violet-500/20 to-purple-500/10',
  neck: 'bg-gradient-to-br from-sky-500/20 to-blue-500/10',
  knee: 'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
  shoulder: 'bg-gradient-to-br from-rose-500/20 to-pink-500/10',
  general: 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10',
};

/**
 * Exercise opening sheet — demonstration → name/meta → how to perform → details → action.
 */
export default function ExerciseDetailModal({ exercise, onClose }) {
  const hasMedia = exercise ? hasExerciseMedia(exercise) : false;
  const aiReady = Boolean(exercise?.kinestex?.ai_supported && exercise?.kinestex?.mapped);

  return (
    <ExerciseBottomSheet
      open={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      subtitle={exercise ? `${exercise.body_area || 'exercise'} · ${exercise.difficulty || 'beginner'}` : ''}
      headerGradient={exercise ? AREA_GRADIENT[exercise.body_area] || AREA_GRADIENT.general : ''}
      icon="fa-dumbbell"
      maxHeight="max-h-[92dvh]"
      footer={
        exercise ? (
          <>
            {exercise.slug ? (
              <Link
                to={`/exercises/${exercise.slug}`}
                className="btn-outline text-xs sm:text-sm min-h-10"
                onClick={onClose}
              >
                Full page
              </Link>
            ) : null}
            <Link
              to={bookExerciseUrl(exercise)}
              className="btn-primary text-xs sm:text-sm min-h-10 flex-1 text-center"
              onClick={onClose}
            >
              Book a physiotherapist
            </Link>
          </>
        ) : null
      }
    >
      {exercise && (
        <div className="space-y-5">
          {hasMedia && (
            <div key={`media-${exercise.id || exercise.slug || exercise.name}`} className="w-full shrink-0 exercise-detail-media">
              <ExerciseMediaDisplay
                exercise={exercise}
                title={exercise.name}
                variant="player"
                layout="portrait"
              />
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{exercise.name}</h2>
            <p className="text-sm text-slate-500 mt-1 capitalize">
              {[exercise.body_area, exercise.difficulty].filter(Boolean).join(' · ')}
            </p>
            {aiReady && (
              <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-100">
                AI-Guided when prescribed
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-lg font-bold text-slate-800">{exercise.default_sets ?? '—'}</p>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Sets</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-lg font-bold text-slate-800">{exercise.default_reps ?? '—'}</p>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Reps</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-lg font-bold text-slate-800">{exercise.default_hold_seconds || '—'}</p>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Hold (s)</p>
            </div>
          </div>

          {exercise.equipment && (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <FaIcon icon="fa-toolbox" className="text-teal-600" aria-hidden="true" />
              Equipment: <span className="font-semibold text-slate-800">{exercise.equipment}</span>
            </p>
          )}

          <ExerciseInstructions
            steps={exercise.steps}
            instructions={exercise.instructions}
            compact
          />
        </div>
      )}
    </ExerciseBottomSheet>
  );
}
