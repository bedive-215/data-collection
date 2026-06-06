import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import apiClient from "@/api/apiClient";
import BlockedBanner from "@/components/common/BlockedBanner";

const ACCESS_TOKEN_KEY = "access_token";

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
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  /* ============================
        Persist Tokens
        refresh token nằm trong httpOnly cookie
        → chỉ lưu access token ở localStorage
     ============================ */
  const persistTokens = (access) => {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      setAccessToken(access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setAccessToken(null);
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
      full_name:
        decoded.full_name ||
        decoded.name ||
        decoded.display_name ||
        decoded.given_name ||
        null,
      role: decoded.role || decoded.roles || null,
    };
  };

  /* ============================
       Refresh Tokens
       Cookie httpOnly tự gửi kèm request
       → không cần đọc/gửi refresh token thủ công
   ============================ */
  const refreshTokens = useCallback(async () => {
    if (isRefreshing) return { waiting: true };

    try {
      setIsRefreshing(true);

      // withCredentials: true → browser tự gửi cookie refresh token
      const res = await authService.refreshToken();
      const data = res?.data ?? res;

      const newAccess = data?.access_token ?? data?.accessToken;

      if (newAccess) {
        persistTokens(newAccess);
        const newUser = buildUserFromToken(newAccess);
        if (newUser) setUser(newUser);
      }

      setIsRefreshing(false);
      return data;
    } catch (err) {
      console.error("Refresh token failed", err);
      setIsRefreshing(false);
      persistTokens(null);
      setUser(null);
      return { expired: true };
    }
  }, [isRefreshing]);

  /* ============================
             LOGIN
     ============================ */
  const login = async (payload) => {
    const res = await authService.login(payload);
    const data = res?.data ?? res;

    const newAccess = data?.access_token ?? data?.accessToken;
    persistTokens(newAccess);

    let newUser = buildUserFromToken(newAccess);
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    if (fromBody && typeof fromBody === "object") {
      newUser = {
        ...newUser,
        user_id: fromBody.user_id ?? fromBody.id ?? newUser?.user_id,
        email: fromBody.email ?? newUser?.email,
        full_name: fromBody.full_name ?? fromBody.name ?? newUser?.full_name,
        role: fromBody.role ?? newUser?.role,
      };
    }
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
    persistTokens(newAccess);

    let newUser = buildUserFromToken(newAccess);
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    if (fromBody && typeof fromBody === "object") {
      newUser = {
        ...newUser,
        user_id: fromBody.user_id ?? fromBody.id ?? newUser?.user_id,
        email: fromBody.email ?? newUser?.email,
        full_name: fromBody.full_name ?? fromBody.name ?? newUser?.full_name,
        role: fromBody.role ?? newUser?.role,
      };
    }
    if (newUser) setUser(newUser);

    return data;
  };

  /* ============================
       LOGIN FROM OAUTH DATA
       Dùng khi đã có API response
       sẵn (không gọi API lại).
     ============================ */
  const loginFromOAuthData = useCallback((data) => {
    const newAccess =
      data?.access_token ?? data?.accessToken ??
      data?.token ?? data?.data?.access_token ?? data?.data?.token;

    persistTokens(newAccess);

    let newUser = newAccess ? buildUserFromToken(newAccess) : null;
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    if (fromBody && typeof fromBody === "object") {
      newUser = {
        ...newUser,
        user_id: fromBody.user_id ?? fromBody.id ?? newUser?.user_id ?? null,
        email: fromBody.email ?? newUser?.email ?? null,
        full_name: fromBody.full_name ?? fromBody.name ?? newUser?.full_name ?? null,
        role: fromBody.role ?? newUser?.role ?? null,
        gender: fromBody.gender ?? null,
        phone_number: fromBody.phone_number ?? null,
        avatar: fromBody.avatar ?? null,
      };
    }
    if (newUser) setUser(newUser);
  }, []);

  /* ============================
              LOGOUT
     ============================ */
  const logout = async () => {
    try {
      // Backend sẽ xóa cookie refresh token khi gọi logout
      await authService.logout().catch(() => {});
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setAccessToken(null);
      setUser(null);
      setIsBlocked(false);
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
        const token = accessToken || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
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

          const result = await refreshTokens();

          // Đang có refresh khác chạy → thử lại với token hiện tại
          if (result?.waiting) {
            const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            if (currentToken) {
              originalRequest.headers["Authorization"] = `Bearer ${currentToken}`;
              return apiClient(originalRequest);
            }
          }

          // Refresh thành công → retry request gốc
          const newAccess = result?.access_token ?? result?.accessToken;
          if (newAccess) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }

          // Refresh thất bại → redirect login (silent)
          persistTokens(null);
          setUser(null);
          window.location.href = "/login?session=expired";
          return Promise.reject(error);
        }

        // Blocked user
        if (error.response?.status === 403) {
          const msg = error.response?.data?.message || "";
          if (
            msg.includes("khóa") ||
            msg.includes("bị khóa") ||
            msg.includes("banned") ||
            msg.includes("blocked")
          ) {
            persistTokens(null);
            setUser(null);
            setIsBlocked(true);
            window.location.href = "/login?blocked=true";
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
    loading,
    isBlocked,

    login,
    loginWithOAuth,
    loginFromOAuthData,
    logout,
    register,
    verifyEmail,
    resendVerifyCode,
    forgotPassword,
    verifyResetCode,
    resetPassword,

    refreshTokens,
    setUser,
    setIsBlocked,
  };

  return (
    <AuthContext.Provider value={value}>
      {isBlocked ? <BlockedBanner /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;