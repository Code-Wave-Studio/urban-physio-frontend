import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../services/api';
import { resetClinicPortalStore } from './ClinicPortalContext';
import {
  extractAuthSession,
  hasStoredToken,
  normalizeAuthUser,
  readStoredUser,
} from '../utils/authSession';

const AuthContext = createContext(null);

function persistSession(token, user) {
  const t = typeof token === 'string' ? token.trim() : '';
  if (!t || !user) return false;
  localStorage.setItem('token', t);
  localStorage.setItem('user', JSON.stringify(user));
  return true;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetClinicPortalStore();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      clearSession();
      return null;
    }
    try {
      const res = await auth.me();
      const payload = normalizeAuthUser(res);
      if (payload) {
        setUser(payload);
        localStorage.setItem('user', JSON.stringify(payload));
        return payload;
      }
    } catch (err) {
      if (err?.status === 401) {
        clearSession();
        return null;
      }
      /* keep stored session for transient network errors */
    }
    const cached = readStoredUser();
    if (cached) setUser(cached);
    return cached;
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem('token')?.trim();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const cached = readStoredUser();
      if (cached) setUser(cached);

      try {
        const res = await auth.me();
        if (cancelled) return;
        const payload = normalizeAuthUser(res);
        if (payload) {
          setUser(payload);
          localStorage.setItem('user', JSON.stringify(payload));
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          clearSession();
        }
        /* Keep token + cached user on transient errors until explicit logout */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const applyAuthResponse = async (res) => {
    const session = extractAuthSession(res);
    if (!session?.token || !session?.user) {
      throw new Error('Invalid login response from server');
    }
    persistSession(session.token, session.user);
    setUser(session.user);
    try {
      const fresh = await refreshUser();
      return fresh || session.user;
    } catch {
      return session.user;
    }
  };

  /** `portal` keeps the patient / doctor / clinic sign-in pages separate. */
  const login = async (email, password, portal = null) => {
    try {
      const res = await auth.login({ email, password, ...(portal ? { portal } : {}) });
      return await applyAuthResponse(res);
    } catch (err) {
      if (err.errors?.needs_verification) {
        const e = new Error(err.message);
        e.needsVerification = true;
        e.email = err.errors.email || email;
        throw e;
      }
      throw err;
    }
  };

  const register = async (data) => {
    const res = await auth.register(data);
    return res?.data ?? res;
  };

  const verifyOtp = async (email, otp, extra = {}) => {
    const res = await auth.verifyOtp({ email, otp, ...extra });
    return applyAuthResponse(res);
  };

  const phoneVerifyOtp = async (phone, otp, role = 'patient') => {
    const res = await auth.phoneVerifyOtp({ phone, otp, role });
    return applyAuthResponse(res);
  };

  const resendOtp = async (email) => auth.resendOtp({ email });

  const googleLogin = async (idToken, role, extra = {}) => {
    const res = await auth.googleLogin({
      id_token: idToken,
      ...(role ? { role } : {}),
      ...extra,
    });
    return applyAuthResponse(res);
  };

  const forgotPassword = async (email) => auth.forgotPassword({ email });

  const resetPassword = async (token, password) => auth.resetPassword({ token, password });

  const logout = () => clearSession();

  const hasRole = (...roles) => user && roles.includes(user.role_slug);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOtp,
        phoneVerifyOtp,
        resendOtp,
        googleLogin,
        forgotPassword,
        resetPassword,
        logout,
        hasRole,
        setUser,
        refreshUser,
        hasStoredToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
