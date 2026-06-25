const STORAGE_KEY = 'tup_saved_exercises';

export function getSavedExercises() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isExerciseSaved(exerciseId) {
  const id = Number(exerciseId);
  return getSavedExercises().some((e) => Number(e.id) === id);
}

export function toggleSavedExercise(exercise) {
  const id = Number(exercise?.id);
  if (!id) return { saved: false, list: getSavedExercises() };

  const list = getSavedExercises();
  const idx = list.findIndex((e) => Number(e.id) === id);
  let saved;

  if (idx >= 0) {
    list.splice(idx, 1);
    saved = false;
  } else {
    list.unshift({
      id,
      slug: exercise.slug || '',
      name: exercise.name || 'Exercise',
      body_area: exercise.body_area || 'general',
      difficulty: exercise.difficulty || 'beginner',
      saved_at: Date.now(),
    });
    saved = true;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
  window.dispatchEvent(new CustomEvent('saved-exercises-changed'));
  return { saved, list: getSavedExercises() };
}
