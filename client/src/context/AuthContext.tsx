import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../features/auth/auth.api';
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../features/auth/auth.types';
import {
  clearAccessToken,
  setAccessToken,
  setAuthFailureHandler,
} from '../lib/tokenStore';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // On refresh failure (e.g. expired/rotated cookie), clear the session so
  // the router redirects to /login.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  // Rehydrate the session on load: try a silent refresh, then fetch the user.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken, user: refreshedUser } = await authApi.refresh();
        if (!active) return;
        setAccessToken(accessToken);
        setUser(refreshedUser);
      } catch {
        clearAccessToken();
        if (active) setUser(null);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { accessToken, user: loggedIn } = await authApi.login(credentials);
    setAccessToken(accessToken);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const { accessToken, user: created } = await authApi.register(credentials);
    setAccessToken(accessToken);
    setUser(created);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [user, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
