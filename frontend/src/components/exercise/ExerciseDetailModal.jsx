import { Link } from 'react-router-dom';
import GlassModal, { GlassModalBody } from '../GlassModal';
import FaIcon from '../FaIcon';
import { bookExerciseUrl } from '../../utils/bookUrl';

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

export default function ExerciseDetailModal({ exercise, onClose }) {
  return (
    <GlassModal open={!!exercise} onClose={onClose} size="md" titleId="exercise-detail">
      {exercise && (
        <>
          <div className={`shrink-0 p-5 md:p-6 bg-gradient-to-br ${AREA_GRADIENT[exercise.body_area] || AREA_GRADIENT.general}`}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 capitalize">{exercise.body_area}</span>
                <h2 id="exercise-detail" className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{exercise.name}</h2>
              </div>
              <button type="button" onClick={onClose} className="glass-modal-close shrink-0" aria-label="Close">
                <FaIcon icon="fa-xmark" />
              </button>
            </div>
            <span className={`inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${DIFFICULTY_STYLES[exercise.difficulty] || DIFFICULTY_STYLES.beginner}`}>
              {exercise.difficulty || 'beginner'}
            </span>
          </div>
          <GlassModalBody className="space-y-4">
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
          </GlassModalBody>
        </>
      )}
    </GlassModal>
  );
}
