import { useClinicPortalStore } from '../contexts/ClinicPortalContext';

/**
 * Loads clinic portal identity + RBAC (portal_role, permissions, switch capability).
 * Backed by a shared store so Shell + page share one /me request.
 */
export default function useClinicPortal() {
  return useClinicPortalStore();
}
