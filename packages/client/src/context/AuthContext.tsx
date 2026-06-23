import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { isAxiosError } from "axios";
import { AuthContext } from "@/context/auth-context";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  setAuthHandlers,
} from "@/lib/api";
import * as authApi from "@/lib/authApi";
import type { User } from "@/lib/authApi";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthHandlers({
      onTokenRefreshed: (token) => setToken(token),
      onAuthFailed: () => {
        setToken(null);
        setUser(null);
      },
    });
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await authApi.getMe();
        setToken(token);
        setUser(currentUser);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken: token, user: loggedInUser } = await authApi.login(email, password);
    setAccessToken(token);
    setToken(token);

    try {
      const { user: fullUser } = await authApi.getMe();
      setUser(fullUser);
    } catch {
      setUser(loggedInUser);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!accessToken,
      isLoading,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
