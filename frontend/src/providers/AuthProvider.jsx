import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import apiClient from "@/api/apiClient";
import BlockedBanner from "@/components/common/BlockedBanner";
import { AlertTriangle, LogIn, X } from "lucide-react";

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
  const [isBlocked, setIsBlocked] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

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
    const newRefresh = data?.refresh_token ?? data?.refreshToken;

    persistTokens(newAccess, newRefresh);

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
              LOGOUT
     ============================ */
  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setAccessToken(null);
      setRefreshToken(null);
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
        const token =
          accessToken || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
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
          } else {
            // Refresh failed -> show modal to confirm redirect to login
            persistTokens(null, null);
            setUser(null);
            setShowSessionExpired(true);
            return Promise.reject(error);
          }
        }

        // Blocked user
        if (error.response?.status === 403) {
          const msg = error.response?.data?.message || "";
          if (msg.includes("khóa") || msg.includes("bị khóa") || msg.includes("banned") || msg.includes("blocked")) {
            persistTokens(null, null);
            setUser(null);
            setIsBlocked(true);
            window.location.href = "/login?blocked=true";
          }
        }

        // Other 401 errors (token invalid without retry opportunity) -> show modal to confirm redirect to login
        if (error.response?.status === 401 && originalRequest._retry) {
          persistTokens(null, null);
          setUser(null);
          setShowSessionExpired(true);
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
    isBlocked,

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
    setIsBlocked,
    setShowSessionExpired,
  };

  return <AuthContext.Provider value={value}>
      {isBlocked ? <BlockedBanner /> : children}
      {showSessionExpired && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: 32,
            maxWidth: 420, width: "100%", textAlign: "center",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            animation: "slideInUp 0.3s ease-out",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <AlertTriangle size={32} color="#d97706" />
            </div>
            <h3 style={{
              fontSize: 20, fontWeight: 800, marginBottom: 12,
              color: "#1f2937", fontFamily: "'DM Sans', sans-serif",
            }}>
              Phiên đăng nhập hết hạn
            </h3>
            <p style={{
              fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowSessionExpired(false)}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  border: "1px solid #e5e7eb", background: "white",
                  fontSize: 14, fontWeight: 600, color: "#6b7280",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowSessionExpired(false);
                  window.location.href = "/login?session=expired";
                }}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  border: "none", background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  fontSize: 14, fontWeight: 600, color: "white",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <LogIn size={16} />
                Đăng nhập lại
              </button>
            </div>
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
            @keyframes slideInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
          `}</style>
        </div>
      )}
    </AuthContext.Provider>;
};

export default AuthProvider;
