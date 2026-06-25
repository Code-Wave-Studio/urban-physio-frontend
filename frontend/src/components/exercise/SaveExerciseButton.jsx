import { useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth } from '../../utils/requireAuth';
import { patients } from '../../services/api';
import { isExerciseSaved, toggleSavedExercise } from '../../utils/savedExercises';
import toast from 'react-hot-toast';

export default function SaveExerciseButton({ exercise, className = '', compact = true, stopPropagation = false }) {
  const { user, hasRole } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [saved, setSaved] = useState(() => isExerciseSaved(exercise?.id));

  useEffect(() => {
    const sync = () => setSaved(isExerciseSaved(exercise?.id));
    sync();
    window.addEventListener('saved-exercises-changed', sync);
    return () => window.removeEventListener('saved-exercises-changed', sync);
  }, [exercise?.id]);

  const toggle = async (e) => {
    if (stopPropagation) e.stopPropagation();
    if (!exercise?.id) return;
    if (!requireAuth('Log in to save exercises')) return;
    const { saved: next } = toggleSavedExercise(exercise);
    setSaved(next);

    if (user && hasRole('patient')) {
      try {
        if (next) await patients.addSavedExercise(exercise.id);
        else await patients.removeSavedExercise(exercise.id);
      } catch {
        /* local save still works */
      }
    }

    toast.success(next ? 'Exercise saved' : 'Removed from saved exercises', { duration: 2000 });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold border transition ${
        compact ? 'text-xs !px-2.5 !py-1.5 rounded-lg' : 'text-sm !px-4 !py-2.5 rounded-xl'
      } ${
        saved
          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${className}`}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save exercise'}
    >
      <FaIcon icon="fa-heart" className={saved ? 'text-rose-500' : 'text-slate-400'} />
      {compact ? (saved ? 'Saved' : 'Save') : saved ? 'Saved' : 'Save exercise'}
    </button>
  );
}
