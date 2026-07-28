import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Persist widget order + visibility in localStorage (per clinic + role).
 * No backend change — fully backward compatible.
 */
export default function useDashboardLayout(storageKey, defaultWidgets) {
  const defaults = useMemo(
    () => defaultWidgets.map((w) => ({ id: w.id, hidden: false })),
    [defaultWidgets]
  );

  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults.map((d) => ({ ...d }));
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaults.map((d) => ({ ...d }));
      const known = new Set(defaults.map((d) => d.id));
      const ordered = [];
      parsed.forEach((item) => {
        const id = typeof item === 'string' ? item : item?.id;
        if (!id || !known.has(id) || ordered.some((o) => o.id === id)) return;
        ordered.push({
          id,
          hidden: Boolean(typeof item === 'object' ? item.hidden : false),
        });
      });
      defaults.forEach((d) => {
        if (!ordered.some((o) => o.id === d.id)) ordered.push({ ...d });
      });
      return ordered;
    } catch {
      return defaults.map((d) => ({ ...d }));
    }
  }, [storageKey, defaults]);

  const [layout, setLayout] = useState(read);
  const [customize, setCustomize] = useState(false);

  useEffect(() => {
    setLayout(read());
    setCustomize(false);
  }, [read]);

  const persist = useCallback(
    (next) => {
      setLayout(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
    },
    [storageKey]
  );

  const reorder = useCallback(
    (fromId, toId) => {
      if (!fromId || !toId || fromId === toId) return;
      setLayout((prev) => {
        const next = [...prev];
        const from = next.findIndex((w) => w.id === fromId);
        const to = next.findIndex((w) => w.id === toId);
        if (from < 0 || to < 0) return prev;
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey]
  );

  const toggleHidden = useCallback(
    (id) => {
      setLayout((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, hidden: !w.hidden } : w));
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey]
  );

  const reset = useCallback(() => {
    persist(defaults.map((d) => ({ ...d })));
  }, [persist, defaults]);

  const visibleIds = useMemo(
    () => (customize ? layout.map((w) => w.id) : layout.filter((w) => !w.hidden).map((w) => w.id)),
    [layout, customize]
  );

  return {
    layout,
    customize,
    setCustomize,
    visibleIds,
    reorder,
    toggleHidden,
    reset,
    isHidden: (id) => Boolean(layout.find((w) => w.id === id)?.hidden),
  };
}
