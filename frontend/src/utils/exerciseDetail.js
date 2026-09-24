/**
 * Build a stable public Exercise Detail path.
 * Many CMS rows use numeric-looking or empty slugs; prefer a usable key.
 */
export function exerciseDetailPath(exercise) {
  if (!exercise || typeof exercise !== 'object') return '/exercises';

  const slug = typeof exercise.slug === 'string' ? exercise.slug.trim() : '';
  if (slug) {
    return `/exercises/${encodeURIComponent(slug)}`;
  }

  const id = exercise.id ?? exercise.exercise_id;
  if (id != null && String(id).trim() !== '') {
    return `/exercises/${encodeURIComponent(String(id))}`;
  }

  return '/exercises';
}

/**
 * Normalize GET /exercises/:key response into a single exercise object.
 * Guards against the historical bug where numeric-looking slugs hit the list
 * endpoint (PHP is_numeric("-22") === true) and returned an array.
 */
export function normalizeExerciseDetailPayload(res, requestedKey = '') {
  const payload = res?.data !== undefined ? res.data : res;
  const key = String(requestedKey || '').trim();

  if (Array.isArray(payload)) {
    if (!key) return null;
    const found = payload.find(
      (e) =>
        e &&
        (String(e.slug ?? '') === key ||
          String(e.id ?? '') === key ||
          String(e.exercise_id ?? '') === key)
    );
    return found && typeof found === 'object' ? found : null;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (!payload.name && !payload.id && !payload.slug) {
    return null;
  }

  return payload;
}
