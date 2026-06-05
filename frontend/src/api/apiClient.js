// src/api/apiClient.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true, // only if you need cookies
  headers: {
    Accept: "application/json",
    // Do NOT force Content-Type here globally, let request-specific logic set it.
  },
});

// Attach token if present (use same key your AuthProvider uses)
// Requirement: đừng check token khi user vừa vào /login.
// => chỉ gắn Authorization khi URL hiện tại KHÔNG phải trang login.
apiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    const isOnLoginPage =
      typeof window !== "undefined" &&
      window.location &&
      String(window.location.pathname).startsWith("/login");

    const token = localStorage.getItem("access_token") || null;
    if (!isOnLoginPage && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If sending FormData, allow browser to set Content-Type including boundary
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers["Content-Type"]) delete config.headers["Content-Type"];
    } else if (config.data !== undefined && config.data !== null && typeof config.data !== "string") {
      // for object payloads, set JSON content-type
      config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
    }

    // debug log (remove in production)
    // console.debug("[apiClient] ->", config.method?.toUpperCase(), config.url, { payloadType: typeof config.data, payload: config.data });

    return config;
  },
  (err) => Promise.reject(err)
);


// Response interceptor: try to refresh token on 401 and retry (basic example)
apiClient.interceptors.response.use(
  (response) => response, // return full response to keep callers consistent
  async (error) => {
    const originalRequest = error?.config;

    // If 401 and not retried yet -> try refresh
    // NOTE: chỉ refresh khi request thực sự cần auth (tránh bắn lúc mở web làm user bị gán session expired giả)
    const isOnLoginPage =
      typeof window !== "undefined" &&
      window.location &&
      String(window.location.pathname).startsWith("/login");

    if (
      !isOnLoginPage &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest?.url &&
      !String(originalRequest.url).includes("/api/v1/auth/refresh-token")
    ) {

      originalRequest._retry = true;
      try {
        // refresh token nằm trong cookie httpOnly (backend đọc cookie)
        // gọi refresh KHÔNG cần gửi refresh_token trong body.
        // Quan trọng: endpoint dùng authMiddleware.checkAuth -> phải có access token.
        // Dùng chính apiClient để đảm bảo interceptors/config nhất quán
        const refreshRes = await apiClient.post(
          "/api/v1/auth/refresh-token",
          {},
          {
            withCredentials: true,
          }
        );



        const newAccess = refreshRes?.data?.access_token ?? refreshRes?.data?.accessToken ?? refreshRes?.data?.token;
        const newRefresh = refreshRes?.data?.refresh_token ?? refreshRes?.data?.refreshToken ?? null;

        // Backend refresh endpoint (checkAuth) chỉ trả access token qua body
        // refresh token vẫn nằm ở cookie httpOnly, không lưu localStorage.
        if (newAccess) {
          // Không lưu access token vào localStorage để tránh state lệch cookie-only.
          // Chỉ cập nhật header cho request retry.
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        }


      } catch (e) {
        // refresh failed -> clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login?session=expired";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
