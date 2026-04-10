import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import apiClient from "@/api/apiClient";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/* ============================
   Decode JWT, safe & tolerant
   ============================ */
const decodeJWT = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    return JSON.parse(atob(payloadBase64));
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
};

/* ============================
       Auth Provider
   ============================ */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY) || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(REFRESH_TOKEN_KEY) || null
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ============================
        Persist Tokens
     ============================ */
  const persistTokens = (access, refresh) => {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      setAccessToken(access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setAccessToken(null);
    }

    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      setRefreshToken(refresh);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setRefreshToken(null);
    }
  };

  /* ============================
         Extract user from JWT
     ============================ */
  const buildUserFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    return {
      user_id: decoded.user_id || decoded.id || decoded.sub || null,
      email: decoded.email || null,
      role: decoded.role || decoded.roles || null,
    };
  };

  /* ============================
         Refresh Tokens
     ============================ */
  const refreshTokens = useCallback(async () => {
    if (!refreshToken || isRefreshing) return null;

    try {
      setIsRefreshing(true);

      const res = await authService.refreshToken({
        refresh_token: refreshToken,
      });

      const data = res?.data ?? res;

      const newAccess = data?.access_token ?? data?.accessToken;
      const newRefresh = data?.refresh_token ?? data?.refreshToken;

      if (newAccess || newRefresh) {
        persistTokens(newAccess, newRefresh);

        const newUser = buildUserFromToken(newAccess);
        if (newUser) setUser(newUser);
      }

      setIsRefreshing(false);
      return data;
    } catch (err) {
      console.error("Refresh token failed", err);

      setIsRefreshing(false);
      persistTokens(null, null);
      setUser(null);

      return null;
    }
  }, [refreshToken, isRefreshing]);

  /* ============================
             LOGIN
     ============================ */
  const login = async (payload) => {
    const res = await authService.login(payload);
    const data = res?.data ?? res;

    const newAccess = data?.access_token ?? data?.accessToken;
    const newRefresh = data?.refresh_token ?? data?.refreshToken;

    persistTokens(newAccess, newRefresh);

    const newUser = buildUserFromToken(newAccess);
    if (newUser) setUser(newUser);

    return data;
  };

  /* ============================
            LOGIN OAUTH
     ============================ */
  const loginWithOAuth = async (payload) => {
    const res = await authService.loginWithOAuth(payload);
    const data = res?.data ?? res;

    const newAccess = data?.access_token ?? data?.accessToken;
    const newRefresh = data?.refresh_token ?? data?.refreshToken;

    persistTokens(newAccess, newRefresh);

    const newUser = buildUserFromToken(newAccess);
    if (newUser) setUser(newUser);

    return data;
  };

  /* ============================
              LOGOUT
     ============================ */
  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      persistTokens(null, null);
      setUser(null);
    }
  };

  /* ============================
          OTHER AUTH ACTIONS
     ============================ */
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

  /* ============================
        Axios Interceptors
     ============================ */
  useEffect(() => {
    const reqInterceptor = apiClient.interceptors.request.use(
      (config) => {
        if (!config.headers) config.headers = {};
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
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

        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          const refreshed = await refreshTokens();

          if (refreshed?.access_token || refreshed?.accessToken) {
            const newAccess =
              refreshed.access_token ??
              refreshed.accessToken ??
              accessToken;

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

  /* ============================
        Init User From Token
     ============================ */
  useEffect(() => {
    if (accessToken) {
      const userObj = buildUserFromToken(accessToken);
      if (userObj) setUser(userObj);
    }
    setLoading(false);
  }, []);

  /* ============================
             PROVIDER VALUE
     ============================ */
  const value = {
    user,
    accessToken,
    refreshToken,
    loading,

    login,
    loginWithOAuth,
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

export default AuthProvider;
