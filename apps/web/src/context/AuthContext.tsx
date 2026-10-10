import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from "@personal-ecommerce/shared";
import { api, setAccessToken } from "../lib/apiClient";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didInitRef = useRef(false);

  useEffect(() => {
    // /auth/refresh rotates the refresh token (one-time use), so it isn't safe to call twice in
    // quick succession - React 19 StrictMode double-invokes effects in development, and without
    // this guard the second call fails because the first already rotated the cookie out from
    // under it, silently logging a just-refreshed user back out.
    if (didInitRef.current) return;
    didInitRef.current = true;

    api
      .post<AuthResponse>("/auth/refresh")
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await api.post<AuthResponse>("/auth/login", input);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api.post<AuthResponse>("/auth/register", input);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
