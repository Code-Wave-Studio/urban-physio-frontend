/** Show default "Partner clinic" badge only when no admin-assigned badges exist. */
export function showPartnerClinicBadge(clinic) {
  const badges = clinic?.badges;
  return !Array.isArray(badges) || badges.length === 0;
}
