import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiGet, apiPost, getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((token, profile) => {
    setStoredToken(token);
    setUser(profile);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiPost(
      '/api/auth/login',
      { email, password },
      { auth: false }
    );
    applySession(data.access_token, data.user);
    return data;
  }, [applySession]);

  const signup = useCallback(async (email, password) => {
    const data = await apiPost(
      '/api/auth/signup',
      { email, password },
      { auth: false }
    );
    applySession(data.access_token, data.user);
    return data;
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;
    // fallback so startup does not hang on loading
    const bootstrapTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setStoredToken(null);
        setUser(null);
        setReady(true);
      }
    }, 12000);
    async function hydrate() {
      if (!getStoredToken()) {
        window.clearTimeout(bootstrapTimeout);
        setReady(true);
        return;
      }
      try {
        const me = await apiGet('/api/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          setStoredToken(null);
          setUser(null);
        }
      } finally {
        window.clearTimeout(bootstrapTimeout);
        if (!cancelled) setReady(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTimeout);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
    }),
    [user, ready, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
