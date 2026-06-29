export function googleMapsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function geolocationErrorMessage(err) {
  switch (err?.code) {
    case 1:
      return 'Location permission denied. Allow location in your browser settings, then try again.';
    case 2:
      return 'Location unavailable. Check GPS or Wi‑Fi and try again.';
    case 3:
      return 'Location timed out. Try again or place the pin manually on the map.';
    default:
      return 'Could not detect your location. Drag the pin on the map instead.';
  }
}

function readGeolocationPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('unsupported'), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/** High-accuracy first; fall back to coarse GPS if slow or timed out. */
export async function fetchDevicePosition() {
  const accurate = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
  const coarse = { enableHighAccuracy: false, timeout: 25000, maximumAge: 120000 };
  try {
    return await readGeolocationPosition(accurate);
  } catch (err) {
    if (err?.code === 3 || err?.code === 2) {
      return readGeolocationPosition(coarse);
    }
    throw err;
  }
}

export function resolveMapPosition(initialLat, initialLng, fallbackCoords) {
  if (initialLat != null && initialLng != null) {
    return { lat: Number(initialLat), lng: Number(initialLng) };
  }
  if (fallbackCoords?.lat != null && fallbackCoords?.lng != null) {
    return { lat: Number(fallbackCoords.lat), lng: Number(fallbackCoords.lng) };
  }
  return null;
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
