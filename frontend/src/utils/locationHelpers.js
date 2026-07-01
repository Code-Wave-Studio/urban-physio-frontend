export function googleMapsUrl(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return `https://www.google.com/maps/search/?api=1&query=${la},${ln}`;
}

export function homeVisitMapUrl(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const pin = googleMapsUrl(meta.map_latitude, meta.map_longitude);
  if (pin) return pin;
  const q = [meta.full_address, meta.landmark, meta.city, meta.pincode].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

/** True on phones / small touch viewports where GPS needs a user tap for the browser prompt. */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(max-width: 767px)').matches) return true;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ''
  );
}

/** @returns {'granted'|'prompt'|'denied'|'unknown'} */
export async function queryGeolocationPermission() {
  if (!navigator.permissions?.query) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/** Desktop may auto-prompt; mobile browsers require a user gesture for the native permission dialog. */
export async function canAutoRequestGeolocation() {
  const permission = await queryGeolocationPermission();
  if (permission === 'granted') return true;
  if (permission === 'denied') return false;
  return !isMobileDevice();
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
