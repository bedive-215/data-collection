// src/services/apiClient.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ React Native KHÔNG có import.meta.env
// 👉 Dùng env thủ công hoặc react-native-config
const BASE_URL = "https://impeditive-incredible-jordy.ngrok-free.dev"; 
// Android Emulator: 10.0.2.2 = localhost
// Device thật: dùng IP máy tính (VD: 192.168.1.10)

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * =====================
 * REQUEST INTERCEPTOR
 * =====================
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Nếu là FormData → để axios tự set Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (
      config.data &&
      typeof config.data === "object" &&
      !(config.data instanceof String)
    ) {
      config.headers["Content-Type"] =
        config.headers["Content-Type"] || "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * =====================
 * RESPONSE INTERCEPTOR
 * =====================
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh-token`,
          { refresh_token: refreshToken }
        );

        const newAccess =
          res.data?.access_token ||
          res.data?.accessToken ||
          res.data?.token;

        const newRefresh =
          res.data?.refresh_token ||
          res.data?.refreshToken;

        if (newAccess) {
          await AsyncStorage.setItem("access_token", newAccess);
          if (newRefresh) {
            await AsyncStorage.setItem("refresh_token", newRefresh);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        }
      } catch (err) {
        await AsyncStorage.multiRemove([
          "access_token",
          "refresh_token",
        ]);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
