"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getApiBase } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "support" | "admin";
  is_active: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/auth/me`, { credentials: "include" });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logout() {
    await fetch(`${getApiBase()}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      refresh,
      logout,
    }),
    [user, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
