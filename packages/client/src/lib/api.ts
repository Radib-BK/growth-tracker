import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

const ACCESS_TOKEN_KEY = "accessToken";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

type AuthHandlers = {
  onTokenRefreshed?: (token: string) => void;
  onAuthFailed?: () => void;
};

let authHandlers: AuthHandlers = {};

export function setAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function processRefreshQueue(token: string) {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/api/auth/refresh") ||
      originalRequest.url?.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post<{ accessToken: string }>("/api/auth/refresh");
      const newToken = data.accessToken;

      setAccessToken(newToken);
      authHandlers.onTokenRefreshed?.(newToken);
      processRefreshQueue(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      clearAccessToken();
      authHandlers.onAuthFailed?.();
      window.location.assign("/login");
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
