/** SEO city listing URL helpers for clean public URLs. */

export const CITY_CLINIC_SEO_SUFFIX = '/physiotherapy-clinics';
export const CITY_DOCTOR_SEO_SUFFIX = '/physiotherapists';

export function cityClinicsSeoUrl(cityOrSlug) {
  const slug = typeof cityOrSlug === 'string' ? cityOrSlug : cityOrSlug?.slug;
  if (!slug) return '/clinics';
  return `/${encodeURIComponent(slug)}${CITY_CLINIC_SEO_SUFFIX}`;
}

export function cityDoctorsSeoUrl(cityOrSlug) {
  const slug = typeof cityOrSlug === 'string' ? cityOrSlug : cityOrSlug?.slug;
  if (!slug) return '/doctors';
  return `/${encodeURIComponent(slug)}${CITY_DOCTOR_SEO_SUFFIX}`;
}
