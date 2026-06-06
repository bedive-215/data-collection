import axios from "axios";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { Accept: "application/json" },
});
apiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    const isOnLoginPage =
      typeof window !== "undefined" &&
      String(window.location.pathname).startsWith("/login");
    const token = localStorage.getItem("access_token") || null;
    if (!isOnLoginPage && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (config.data !== undefined && config.data !== null && typeof config.data !== "string") {
      config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
    }
    return config;
  },
  (err) => Promise.reject(err)
);
export default apiClient;