import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { clinicPortal } from '../services/api';

/**
 * Shared clinic portal identity store — one /me fetch for all consumers
 * (shell + page) instead of duplicate requests per mount.
 */

const ClinicPortalContext = createContext(null);

let store = {
  me: null,
  clinicId: null,
  loading: true,
  error: null,
  version: 0,
};
let inflight = null;
const listeners = new Set();

function emit() {
  store = { ...store, version: store.version + 1 };
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return store;
}

function isClinicPortalUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    const role = user?.role_slug;
    return role === 'clinic' || role === 'clinic_staff';
  } catch {
    return false;
  }
}

async function loadMe(force = false) {
  if (!isClinicPortalUser()) {
    store = {
      me: null,
      clinicId: null,
      loading: false,
      error: null,
      version: store.version + 1,
    };
    emit();
    return null;
  }

  if (inflight && !force) {
    return inflight;
  }
  store = { ...store, loading: true, error: null };
  emit();

  inflight = (async () => {
    try {
      const res = await clinicPortal.me();
      const data = res.data || res;
      store = {
        me: data,
        clinicId: data.clinic?.id || null,
        loading: false,
        error: null,
        version: store.version + 1,
      };
      emit();
      return data;
    } catch (e) {
      store = {
        me: null,
        clinicId: null,
        loading: false,
        error: e.message || 'Failed to load clinic',
        version: store.version + 1,
      };
      emit();
      throw e;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Reset cache on logout / account switch. */
export function resetClinicPortalStore() {
  store = {
    me: null,
    clinicId: null,
    loading: false,
    error: null,
    version: store.version + 1,
  };
  inflight = null;
  emit();
}

/**
 * Provider is optional — the shared store works without it.
 * Mounting the provider ensures an initial load for the portal subtree.
 */
export function ClinicPortalProvider({ children }) {
  useEffect(() => {
    loadMe().catch(() => {});
  }, []);

  return (
    <ClinicPortalContext.Provider value={true}>
      {children}
    </ClinicPortalContext.Provider>
  );
}

export function useClinicPortalStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    loadMe().catch(() => {});
  }, []);

  const reload = useCallback(async () => loadMe(true), []);

  const portalRole = snap.me?.portal_role || 'receptionist';
  const permissions = snap.me?.permissions || [];
  const canSwitchAdmin = !!snap.me?.can_switch_admin;
  const isAdminMode = portalRole === 'clinic_admin';

  const can = useMemo(
    () => (perm) => !perm || permissions.includes(perm),
    [permissions]
  );

  return {
    me: snap.me,
    clinic: snap.me?.clinic || null,
    clinicId: snap.clinicId,
    portalReady: !!snap.me?.portal_ready,
    portalRole,
    permissions,
    canSwitchAdmin,
    isAdminMode,
    can,
    loading: snap.loading,
    error: snap.error,
    reload,
  };
}

export function useOptionalClinicPortalContext() {
  return useContext(ClinicPortalContext);
}

export default ClinicPortalContext;
