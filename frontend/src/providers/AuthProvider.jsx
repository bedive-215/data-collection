import React, { useState, useEffect, useCallback, useRef } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import apiClient from "@/api/apiClient";
import BlockedBanner from "@/components/common/BlockedBanner";

const ACCESS_TOKEN_KEY = "access_token";

const decodeJWT = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
};

const buildUserFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  return {
    user_id:   decoded.user_id || decoded.id || decoded.sub || null,
    email:     decoded.email || null,
    full_name: decoded.full_name || decoded.name || decoded.display_name || decoded.given_name || null,
    role:      decoded.role || decoded.roles || null,
  };
};

// ── Helper extract access token từ nhiều shape response ──────────────
const extractAccessToken = (data) =>
  data?.access_token ??
  data?.accessToken  ??
  data?.token        ??
  data?.data?.access_token ??
  data?.data?.token  ??
  null;

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || null);
  const [loading, setLoading]     = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const isRefreshingRef   = useRef(false);
  const refreshPromiseRef = useRef(null);

  // ── accessTokenRef: luôn sync với state, dùng trong interceptor ───
  const accessTokenRef = useRef(accessToken);

  const persistTokens = useCallback((access) => {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    accessTokenRef.current = access; // sync ref NGAY LẬP TỨC
    setAccessToken(access);
  }, []);

  // ── Refresh Tokens ─────────────────────────────────────────────────
  const refreshTokens = useCallback(async () => {
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;

    refreshPromiseRef.current = authService
      .refreshToken()
      .then((res) => {
        const body      = res?.data ?? res;
        const newAccess = extractAccessToken(body);

        if (newAccess) {
          persistTokens(newAccess);
          const newUser = buildUserFromToken(newAccess);
          if (newUser) setUser(newUser);
          return { access_token: newAccess };
        }

        // Không có token → coi như expired
        throw new Error("No access token in refresh response");
      })
      .catch((err) => {
        console.warn("Refresh failed:", err?.message);
        persistTokens(null);
        setUser(null);
        return { expired: true };
      })
      .finally(() => {
        isRefreshingRef.current   = false;
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [persistTokens]);

  // ── Merge user từ body response ───────────────────────────────────
  const mergeUserFromBody = (baseUser, fromBody) => {
    if (!fromBody || typeof fromBody !== "object") return baseUser;
    return {
      ...baseUser,
      user_id:      fromBody.user_id      ?? fromBody.id   ?? baseUser?.user_id   ?? null,
      email:        fromBody.email        ?? baseUser?.email                       ?? null,
      full_name:    fromBody.full_name    ?? fromBody.name ?? baseUser?.full_name  ?? null,
      role:         fromBody.role         ?? baseUser?.role                        ?? null,
      gender:       fromBody.gender       ?? baseUser?.gender                      ?? null,
      phone_number: fromBody.phone_number ?? baseUser?.phone_number               ?? null,
      avatar:       fromBody.avatar       ?? baseUser?.avatar                      ?? null,
    };
  };

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (payload) => {
    const res       = await authService.login(payload);
    const data      = res?.data ?? res;
    const newAccess = extractAccessToken(data);

    // Persist TRƯỚC khi bất kỳ thứ gì khác chạy
    persistTokens(newAccess);

    let newUser  = buildUserFromToken(newAccess);
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    newUser = mergeUserFromBody(newUser, fromBody);
    if (newUser) setUser(newUser);

    return data;
  }, [persistTokens]);

  // ── Login OAuth ────────────────────────────────────────────────────
  const loginWithOAuth = useCallback(async (payload) => {
    const res       = await authService.loginWithOAuth(payload);
    const data      = res?.data ?? res;
    const newAccess = extractAccessToken(data);

    persistTokens(newAccess);

    let newUser    = buildUserFromToken(newAccess);
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    newUser = mergeUserFromBody(newUser, fromBody);
    if (newUser) setUser(newUser);

    return data;
  }, [persistTokens]);

  // ── Login From OAuth Data ─────────────────────────────────────────
  const loginFromOAuthData = useCallback((data) => {
    const newAccess = extractAccessToken(data);
    persistTokens(newAccess);

    let newUser    = newAccess ? buildUserFromToken(newAccess) : null;
    const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
    newUser = mergeUserFromBody(newUser, fromBody);
    if (newUser) setUser(newUser);
  }, [persistTokens]);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      persistTokens(null);
      setUser(null);
      setIsBlocked(false);
    }
  }, [persistTokens]);

  // ── Other Auth Actions (FIX: không gọi API 2 lần) ─────────────────
  const register         = useCallback((p) => authService.register(p).then((r) => r?.data ?? r), []);
  const verifyEmail      = useCallback((p) => authService.verifyEmail(p).then((r) => r?.data ?? r), []);
  const resendVerifyCode = useCallback((p) => authService.resendVerifyCode(p).then((r) => r?.data ?? r), []);
  const forgotPassword   = useCallback((p) => authService.forgotPassword(p).then((r) => r?.data ?? r), []);
  const verifyResetCode  = useCallback((p) => authService.verifyResetCode(p).then((r) => r?.data ?? r), []);
  const resetPassword    = useCallback((p) => authService.resetPassword(p).then((r) => r?.data ?? r), []);

  // ── Axios Interceptor ──────────────────────────────────────────────
  useEffect(() => {
    // Request interceptor: luôn gắn token mới nhất từ ref (không cần state)
    const reqInterceptor = apiClient.interceptors.request.use((config) => {
      const token = accessTokenRef.current;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    });

    const resInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const result = await refreshTokens();

          if (result?.expired) {
            persistTokens(null);
            setUser(null);
            window.location.href = "/login?session=expired";
            return Promise.reject(error);
          }

          const newAccess = result?.access_token;
          if (newAccess) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        }

        if (error.response?.status === 403) {
          const msg = error.response?.data?.message || "";
          if (msg.includes("khóa") || msg.includes("blocked") || msg.includes("banned")) {
            persistTokens(null);
            setUser(null);
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
  }, [refreshTokens, persistTokens]);

  // ── Init từ token có sẵn ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      accessTokenRef.current = token;
      const userObj = buildUserFromToken(token);
      if (userObj) setUser(userObj);
    }
    setLoading(false);
  }, []);

  const value = {
    user, accessToken, loading, isBlocked,
    login, loginWithOAuth, loginFromOAuthData, logout,
    register, verifyEmail, resendVerifyCode,
    forgotPassword, verifyResetCode, resetPassword,
    refreshTokens, setUser, setIsBlocked,
  };

  return (
    <AuthContext.Provider value={value}>
      {isBlocked ? <BlockedBanner /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;