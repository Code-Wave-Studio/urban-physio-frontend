import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

/** Redirect unauthenticated users to login before save actions. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (message = 'Please log in to continue') => {
    if (loading) return false;
    if (user) return true;
    const redirect = encodeURIComponent(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
    toast.error(message, { duration: 2500 });
    navigate(`/login?redirect=${redirect}`);
    return false;
  };

  return { user, loading, requireAuth };
}
