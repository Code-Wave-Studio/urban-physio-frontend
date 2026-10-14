import { useEffect, useState } from 'react';
import { kinestex } from '../services/api';

/**
 * Admin KinesteX gate as exposed by GET /kinestex/settings (enabled only when configured).
 * null while loading.
 */
export function useKinestexPublicStatus() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    kinestex
      .settings()
      .then((res) => {
        if (!cancelled) setActive(!!res?.data?.enabled);
      })
      .catch(() => {
        if (!cancelled) setActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return active;
}
