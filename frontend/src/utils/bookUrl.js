/**
 * Build booking URLs with pre-selection query params.
 * Plain `/book` opens the normal empty wizard.
 */

export function bookDoctorUrl(doctorId, opts = {}) {
  if (!doctorId) return '/book';
  const params = new URLSearchParams();
  if (opts.type) params.set('type', opts.type);
  if (opts.date) params.set('date', opts.date);
  if (opts.time) params.set('time', opts.time);
  if (opts.packageId) params.set('package_id', String(opts.packageId));
  if (opts.treatmentPackageId) params.set('treatment_package_id', String(opts.treatmentPackageId));
  const q = params.toString();
  const base = `/doctors/${doctorId}/book`;
  return q ? `${base}?${q}` : base;
}

export function bookClinicUrl(clinicId) {
  if (!clinicId) return '/book?type=clinic';
  return `/book?type=clinic&clinic_id=${clinicId}`;
}

export function bookTreatmentUrl(treatment) {
  if (!treatment) return '/book';
  const params = new URLSearchParams();
  if (treatment.slug) params.set('treatment', treatment.slug);
  else if (treatment.title) params.set('pain_type', treatment.title);
  const q = params.toString();
  return q ? `/book?${q}` : '/book';
}

export function bookConditionUrl(condition) {
  if (!condition) return '/book';
  const params = new URLSearchParams();
  if (condition.slug) params.set('condition', condition.slug);
  else if (condition.title) params.set('condition_title', condition.title);
  const q = params.toString();
  return q ? `/book?${q}` : '/book';
}

/** Map exercise body_area to booking pain_type labels */
const EXERCISE_BODY_PAIN = {
  back: 'Back Pain',
  neck: 'Neck Pain',
  knee: 'Knee Pain',
  shoulder: 'Shoulder Pain',
  general: 'Other',
};

export function bookExerciseUrl(exercise) {
  if (!exercise) return '/book';
  const params = new URLSearchParams();
  const pain = EXERCISE_BODY_PAIN[exercise.body_area] || 'Other';
  params.set('pain_type', pain);
  const desc = exercise.name
    ? `Help with ${exercise.name} and related ${exercise.body_area || 'general'} exercises`
    : pain;
  params.set('pain_description', desc);
  return `/book?${params.toString()}`;
}

export function bookPackageUrl(slug, extra = {}) {
  if (!slug) return '/packages';
  const params = new URLSearchParams();
  if (extra.doctor_id) params.set('doctor_id', String(extra.doctor_id));
  if (extra.pain_type) params.set('pain_type', extra.pain_type);
  const q = params.toString();
  const base = `/packages/book/${encodeURIComponent(slug)}`;
  return q ? `${base}?${q}` : base;
}

/** Match treatment/condition title to admin pain-type labels */
export function matchPainTypeLabel(title, painTypes = []) {
  if (!title) return '';
  const cleaned = title.replace(/\s+treatment$/i, '').replace(/\s+rehabilitation$/i, '').trim();
  if (painTypes.includes(cleaned)) return cleaned;
  const lower = cleaned.toLowerCase();
  const hit = painTypes.find(
    (p) => lower.includes(p.toLowerCase()) || p.toLowerCase().includes(lower.split(' ')[0])
  );
  return hit || cleaned;
}

export function bookPainAreaUrl(painLabel, extra = {}) {
  const params = new URLSearchParams();
  if (painLabel) params.set('pain_type', painLabel);
  if (extra.pain_description) params.set('pain_description', extra.pain_description);
  const q = params.toString();
  return q ? `/book?${q}` : '/book';
}

export function matchHomeConditionLabel(title, homeConditions = []) {
  if (!title || !homeConditions.length) return '';
  const lower = title.toLowerCase();
  return homeConditions.find((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower.split(' ')[0])) || '';
}
