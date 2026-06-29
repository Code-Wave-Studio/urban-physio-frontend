/**
 * Map patient profile (+ primary address) into booking form fields.
 * Only fills empty fields so user edits are preserved.
 */
export function applyPatientProfileToBooking(form, profile) {
  if (!profile) return form;

  const primary = profile.primary_address || profile.addresses?.find((a) => a.is_primary) || null;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();

  const next = { ...form };

  if (!next.full_name?.trim() && fullName) next.full_name = fullName;
  if (!next.email?.trim() && profile.email) next.email = profile.email;
  if (!next.mobile?.trim() && profile.phone) next.mobile = profile.phone;
  if (!next.gender && profile.gender) next.gender = profile.gender;
  if (!next.age && profile.age != null) next.age = String(profile.age);

  const addrLine = primary?.full_address || profile.address || '';
  if (!next.patient_address?.trim() && addrLine) next.patient_address = addrLine;
  if (!next.full_address?.trim() && addrLine) next.full_address = addrLine;
  if (!next.landmark?.trim() && primary?.landmark) next.landmark = primary.landmark;
  if (!next.pincode?.trim() && primary?.pincode) next.pincode = primary.pincode;
  if (!next.city?.trim()) {
    next.city = primary?.city || primary?.city_name || profile.city_name || '';
  }
  // Map pin must be set manually on the home-visit map — never copy profile GPS.
  if (!next.medical_history?.trim() && profile.medical_notes) {
    next.medical_history = profile.medical_notes;
  }

  return next;
}
