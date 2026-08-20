import { isAxiosError } from "axios";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { clearAccessToken, getAccessToken, setAccessToken, setAuthHandlers } from "@/lib/api";
import * as authApi from "@/lib/authApi";
import type { User } from "@/lib/authApi";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      accessToken: getAccessToken(),
      isAuthenticated: !!getAccessToken(),
      isLoading: true,

      initialize: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ isLoading: false }, false, "auth/initialize:noToken");
          return;
        }

        try {
          const { user } = await authApi.getMe();
          set({ accessToken: token, isAuthenticated: true, user }, false, "auth/initialize:success");
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) {
            clearAccessToken();
            set({ accessToken: null, isAuthenticated: false, user: null }, false, "auth/initialize:unauthorized");
          }
        } finally {
          set({ isLoading: false }, false, "auth/initialize:done");
        }
      },

      login: async (email, password) => {
        const { accessToken: token, user: loggedInUser } = await authApi.login(email, password);
        setAccessToken(token);
        set({ accessToken: token, isAuthenticated: true }, false, "auth/login:tokenIssued");

        try {
          const { user: fullUser } = await authApi.getMe();
          set({ user: fullUser }, false, "auth/login:userLoaded");
        } catch {
          set({ user: loggedInUser }, false, "auth/login:fallbackUser");
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          clearAccessToken();
          set({ accessToken: null, isAuthenticated: false, user: null }, false, "auth/logout");
        }
      },

      setUser: (user) => set({ user }, false, "auth/setUser"),
    }),
    { name: "AuthStore", enabled: import.meta.env.DEV },
  ),
);

setAuthHandlers({
  onTokenRefreshed: (token) =>
    useAuthStore.setState({ accessToken: token }, false, "auth/tokenRefreshed"),
  onAuthFailed: () =>
    useAuthStore.setState(
      { accessToken: null, isAuthenticated: false, user: null },
      false,
      "auth/authFailed",
    ),
});
