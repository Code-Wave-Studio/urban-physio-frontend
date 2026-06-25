const STORAGE_KEY = 'urbanphysio_fav_doctors';

export function getLocalFavourites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function setLocalFavourites(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.map(String)));
}

export function toggleLocalFavourite(doctorId) {
  const id = String(doctorId);
  const list = getLocalFavourites();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  setLocalFavourites(next);
  return next.includes(id);
}

export function isLocalFavourite(doctorId) {
  return getLocalFavourites().includes(String(doctorId));
}
