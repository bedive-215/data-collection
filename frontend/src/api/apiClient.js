import axios from "axios";
import authService from "@/services/authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const setToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
};

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const isOnLoginPage =
    typeof window !== "undefined" &&
    String(window.location.pathname).startsWith("/login");
  const token = getToken();
  if (!isOnLoginPage && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (config.data !== undefined && config.data !== null && typeof config.data !== "string") {
    config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || "";
      if (msg.includes("khóa") || msg.includes("blocked") || msg.includes("banned")) {
        setToken(null);
        window.location.href = "/login?blocked=true";
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await authService.refreshToken();
        const body = res?.data ?? res;
        const newAccess = body?.access_token ?? body?.accessToken ?? body?.token ?? body?.data?.access_token ?? null;

        if (newAccess) {
          setToken(newAccess);
          processQueue(null, newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        }

        throw new Error("No access token in refresh response");
      } catch (refreshError) {
        processQueue(refreshError, null);
        setToken(null);
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
