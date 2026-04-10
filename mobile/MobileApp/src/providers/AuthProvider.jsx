// AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../services/authService";
import apiClient from "../api/apiClient";

// ============================
// Constants
// ============================
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ============================
// Context
// ============================
const AuthContext = createContext(null);

// ============================
// Decode JWT safely
// ============================
const decodeJWT = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    const decoded = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
};

// ============================
// Provider
// ============================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================
  // Persist tokens in AsyncStorage
  // ============================
  const persistTokens = async (access, refresh) => {
    if (access) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
      setAccessToken(access);
    } else {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      setAccessToken(null);
    }

    if (refresh) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      setRefreshToken(refresh);
    } else {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      setRefreshToken(null);
    }
  };

  // ============================
  // Build user object from JWT
  // ============================
  const buildUserFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    return {
      user_id: decoded.user_id || decoded.id || decoded.sub,
      email: decoded.email || null,
      role: decoded.role || decoded.roles || null,
    };
  };

  // ============================
  // Refresh tokens
  // ============================
  const refreshTokens = useCallback(async () => {
    if (!refreshToken || isRefreshing) return null;
    try {
      setIsRefreshing(true);
      const res = await authService.refreshToken({ refresh_token: refreshToken });
      const data = res?.data ?? res;

      const newAccess = data?.access_token ?? data?.accessToken;
      const newRefresh = data?.refresh_token ?? data?.refreshToken;

      if (newAccess || newRefresh) {
        await persistTokens(newAccess, newRefresh);
        const newUser = buildUserFromToken(newAccess);
        if (newUser) setUser(newUser);
      }

      setIsRefreshing(false);
      return data;
    } catch (err) {
      console.error("Refresh token failed:", err);
      await persistTokens(null, null);
      setUser(null);
      setIsRefreshing(false);
      return null;
    }
  }, [refreshToken, isRefreshing]);

  // ============================
  // Login
  // ============================
  const login = async (payload) => {
    const res = await authService.login(payload);
    const data = res?.data ?? res;

    const newAccess = data?.access_token ?? data?.accessToken;
    const newRefresh = data?.refresh_token ?? data?.refreshToken;

    await persistTokens(newAccess, newRefresh);
    const newUser = buildUserFromToken(newAccess);
    if (newUser) setUser(newUser);

    return data;
  };
  
  const loginWithOAuth = useCallback(async (payload) => {
    try {
      const res = await authService.loginWithOAuth(payload);
      const data = res?.data ?? res;

      // Lấy access và refresh token từ API
      const newAccess = data?.access_token ?? data?.accessToken;
      const newRefresh = data?.refresh_token ?? data?.refreshToken;

      // Lưu vào AsyncStorage
      await persistTokens(newAccess, newRefresh);

      // Build user từ access token
      const newUser = buildUserFromToken(newAccess);
      if (newUser) setUser(newUser);

      return data;
    } catch (err) {
      console.error("Login OAuth lỗi:", err);
      throw err;
    }
  }, []);
  // ============================
  // Logout
  // ============================
  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      await persistTokens(null, null);
      setUser(null);
    }
  };

  // ============================
  // Register
  // ============================
  const register = async (payload) => {
    const res = await authService.register(payload);
    return res?.data ?? res;
  };

  const verifyEmail = async (payload) => {
    const res = await authService.verifyEmail(payload);
    return res?.data ?? res;
  };

  const resendVerifyCode = async (payload) => {
    const res = await authService.resendVerifyCode(payload);
    return res?.data ?? res;
  };

  const forgotPassword = async (payload) => {
    const res = await authService.forgotPassword(payload);
    return res?.data ?? res;
  };

  const verifyResetCode = async (payload) => {
    const res = await authService.verifyResetCode(payload);
    return res?.data ?? res;
  };

  const resetPassword = async (payload) => {
    const res = await authService.resetPassword(payload);
    return res?.data ?? res;
  };

  // ============================
  // Axios interceptor
  // ============================
  useEffect(() => {
    const reqInterceptor = apiClient.interceptors.request.use(
  (config) => {
    if (!config.headers) config.headers = {};

    // ❌ BỎ token cho OAuth login
    if (
      accessToken &&
      !config.url.includes("/auth/login/oauth")
    ) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


    const resInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshed = await refreshTokens();

          if (refreshed?.access_token || refreshed?.accessToken) {
            const newAccess = refreshed?.access_token ?? refreshed?.accessToken ?? accessToken;
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(reqInterceptor);
      apiClient.interceptors.response.eject(resInterceptor);
    };
  }, [accessToken, refreshTokens]);

  // ============================
  // Init tokens from storage
  // ============================
  useEffect(() => {
    const init = async () => {
      const storedAccess = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (storedAccess) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);

        const userObj = buildUserFromToken(storedAccess);
        if (userObj) setUser(userObj);
      }

      setLoading(false);
    };
    init();
  }, []);

  // ============================
  // Provider value
  // ============================
  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated: !!user,
 loginWithOAuth,
    login,
    logout,
    register,
    verifyEmail,
    resendVerifyCode,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    refreshTokens,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================
// Hook
// ============================
export const useAuth = () => useContext(AuthContext);
