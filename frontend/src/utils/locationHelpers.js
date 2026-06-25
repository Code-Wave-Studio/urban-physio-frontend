export function googleMapsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function clinicMapsUrl(clinic) {
  if (!clinic) return null;
  if (clinic.google_maps_url?.trim()) return clinic.google_maps_url.trim();
  if (clinic.latitude && clinic.longitude) return googleMapsUrl(clinic.latitude, clinic.longitude);
  const q = [clinic.address, clinic.city_name, clinic.state_name].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function clinicLocationText(appt) {
  if (!appt || appt.consultation_type !== 'clinic') return null;
  const parts = [appt.clinic_name, appt.clinic_address].filter(Boolean);
  return parts.join(' — ') || appt.doctor_address || null;
}
