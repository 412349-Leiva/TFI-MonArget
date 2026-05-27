import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types/auth';
import type { AuthResponse, RegisterPayload } from '../types/auth';
import { authService } from '../services/auth';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_TOKEN = 'monargent_token';
const STORAGE_USER = 'monargent_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_USER);
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response.token) {
      setToken(response.token);
      setUser((current: AuthUser | null) => current ?? { name: response.email ?? email, email: response.email ?? email });
    }
    return response;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    if (response.token) {
      setToken(response.token);
      setUser({ name: payload.name, lastname: payload.lastname, email: payload.email, verified: true });
    } else {
      setUser({ name: payload.name, lastname: payload.lastname, email: payload.email, verified: false });
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}