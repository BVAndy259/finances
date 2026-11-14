'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  refreshSession,
  setAccessToken,
} from './api-client';
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    refreshSession()
      .then((auth) => {
        if (active) {
          setUser(auth.user);
        }
      })
      .catch(() => {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const auth = await apiFetch<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(input) },
      false,
    );

    setAccessToken(auth.accessToken);
    setUser(auth.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const auth = await apiFetch<AuthResponse>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(input) },
      false,
    );

    setAccessToken(auth.accessToken);
    setUser(auth.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }, false);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
