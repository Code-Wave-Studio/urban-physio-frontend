import { useCallback, useEffect, useMemo, useState } from 'react';
import { clinicPortal } from '../services/api';

/**
 * Loads clinic portal identity + RBAC (portal_role, permissions, switch capability).
 */
export default function useClinicPortal() {
  const [me, setMe] = useState(null);
  const [clinicId, setClinicId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clinicPortal.me();
      const data = res.data || res;
      setMe(data);
      setClinicId(data.clinic?.id || null);
      return data;
    } catch (e) {
      setError(e.message || 'Failed to load clinic');
      setMe(null);
      setClinicId(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const portalRole = me?.portal_role || 'receptionist';
  const permissions = me?.permissions || [];
  const canSwitchAdmin = !!me?.can_switch_admin;
  const isAdminMode = portalRole === 'clinic_admin';

  const can = useMemo(
    () => (perm) => !perm || permissions.includes(perm),
    [permissions]
  );

  return {
    me,
    clinic: me?.clinic || null,
    clinicId,
    portalReady: !!me?.portal_ready,
    portalRole,
    permissions,
    canSwitchAdmin,
    isAdminMode,
    can,
    loading,
    error,
    reload,
  };
}
