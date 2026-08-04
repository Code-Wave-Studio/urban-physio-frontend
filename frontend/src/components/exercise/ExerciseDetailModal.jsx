import { Link } from 'react-router-dom';
import ExerciseBottomSheet from './ExerciseBottomSheet';
import FaIcon from '../FaIcon';
import { bookExerciseUrl } from '../../utils/bookUrl';
import ExerciseMediaDisplay from './ExerciseMediaDisplay';
import { hasExerciseMedia } from '../../utils/mediaParser';

const AREA_GRADIENT = {
  back: 'bg-gradient-to-br from-violet-500/20 to-purple-500/10',
  neck: 'bg-gradient-to-br from-sky-500/20 to-blue-500/10',
  knee: 'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
  shoulder: 'bg-gradient-to-br from-rose-500/20 to-pink-500/10',
  general: 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10',
};

export default function ExerciseDetailModal({ exercise, onClose }) {
  const hasMedia = exercise ? hasExerciseMedia(exercise) : false;

  return (
    <ExerciseBottomSheet
      open={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      subtitle={exercise ? `${exercise.body_area || 'exercise'} · ${exercise.difficulty || 'beginner'}` : ''}
      headerGradient={exercise ? AREA_GRADIENT[exercise.body_area] || AREA_GRADIENT.general : ''}
      icon="fa-dumbbell"
    >
      {exercise && (
        <>
          {hasMedia && (
            <div key={`media-${exercise.id || exercise.slug || exercise.name}`} className="w-full shrink-0">
              <ExerciseMediaDisplay
                exercise={exercise}
                title={exercise.name}
                variant="player"
              />
            </div>
          )}

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
              <FaIcon icon="fa-toolbox" className="text-teal-600" />
              Equipment: <span className="font-semibold text-slate-800">{exercise.equipment}</span>
            </p>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FaIcon icon="fa-list-ol" className="text-teal-600" />
              Instructions
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {exercise.instructions || 'Open the exercise library for full instructions.'}
            </p>
          </div>

          <Link to={bookExerciseUrl(exercise)} className="btn-primary w-full block text-center" onClick={onClose}>
            Book a physiotherapist
          </Link>
        </>
      )}
    </ExerciseBottomSheet>
  );
}
