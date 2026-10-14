import { useEffect, useState } from 'react';
import { TELE_REHAB_PAGE_NAME_DEFAULT } from '../constants/telephysioDefaults';
import { telephysio } from '../services/api';

let cachedName = '';
let pending = null;
let generation = 0;
const listeners = new Set();

function readName(payload) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const name = String(data?.page_name || data?.sections?.page_name || '').trim();
  return name || TELE_REHAB_PAGE_NAME_DEFAULT;
}

function loadPageName() {
  if (cachedName) return Promise.resolve(cachedName);
  if (!pending) {
    const gen = generation;
    pending = telephysio
      .settings()
      .then((res) => {
        const next = readName(res);
        if (gen !== generation) return cachedName || TELE_REHAB_PAGE_NAME_DEFAULT;
        cachedName = next;
        return next;
      })
      .catch(() => {
        if (gen === generation) pending = null;
        return cachedName || TELE_REHAB_PAGE_NAME_DEFAULT;
      });
  }
  return pending;
}

/** Drop the cached name after an admin save so open navigation picks up the new label. */
export function invalidateTeleRehabPageName() {
  generation += 1;
  cachedName = '';
  pending = null;
  listeners.forEach((listener) => listener());
}

export function labelForTeleRehabLink(to, label, pageName) {
  if (to !== '/telephysio') return label;
  return pageName || TELE_REHAB_PAGE_NAME_DEFAULT;
}

/** Canonical Tele-Rehab display name from the public settings payload. */
export function useTeleRehabPageName() {
  const [name, setName] = useState(cachedName || TELE_REHAB_PAGE_NAME_DEFAULT);

  useEffect(() => {
    let cancelled = false;
    const apply = () => {
      const seen = generation;
      loadPageName().then((next) => {
        if (!cancelled && seen === generation) setName(next || TELE_REHAB_PAGE_NAME_DEFAULT);
      });
    };
    listeners.add(apply);
    apply();
    return () => {
      cancelled = true;
      listeners.delete(apply);
    };
  }, []);

  return name || TELE_REHAB_PAGE_NAME_DEFAULT;
}
