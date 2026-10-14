import { useEffect, useState } from 'react';
import { privacyBadges } from '../services/api';
import { visiblePrivacyBadges } from '../utils/privacyBadges';

export function usePrivacyBadges(placement) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    let cancelled = false;
    privacyBadges
      .list()
      .then((res) => {
        if (cancelled) return;
        const all = visiblePrivacyBadges(res?.data?.badges || []);
        setBadges(placement ? all.filter((badge) => badge.placement === placement) : all);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  return badges;
}
