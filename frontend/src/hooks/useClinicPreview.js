import { useEffect, useMemo, useState } from 'react';
import { clinics } from '../services/api';

export function useClinicPreview(clinic, open) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const merged = useMemo(() => {
    if (!clinic) return null;
    return { ...clinic, ...(detail || {}) };
  }, [clinic, detail]);

  useEffect(() => {
    if (!open || !clinic) {
      return undefined;
    }

    const key = clinic.slug || clinic.id;
    if (!key) return undefined;

    let active = true;
    setLoading(true);
    setDetail(null);

    clinics
      .get(key)
      .then((r) => r?.data ?? r)
      .then((profile) => {
        if (active && profile) setDetail(profile);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, clinic?.id, clinic?.slug]);

  return { clinic: merged, loading };
}
