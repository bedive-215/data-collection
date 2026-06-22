import React from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useAuthStore } from "@/stores/authStore";
import BlockedBanner from "@/components/common/BlockedBanner";

export const AuthProvider = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const loginFromOAuthData = useAuthStore((s) => s.loginFromOAuthData);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const loading = useAuthStore((s) => s.loading);
  const isBlocked = useAuthStore((s) => s.isBlocked);

  const value = {
    user,
    accessToken,
    loading,
    isBlocked,
    login,
    loginWithOAuth,
    loginFromOAuthData,
    logout,
    register: (p) => useAuthStore.getState().register(p),
    verifyEmail: (p) => useAuthStore.getState().verifyEmail(p),
    resendVerifyCode: (p) => useAuthStore.getState().resendVerifyCode(p),
    forgotPassword: (p) => useAuthStore.getState().forgotPassword(p),
    verifyResetCode: (p) => useAuthStore.getState().verifyResetCode(p),
    resetPassword: (p) => useAuthStore.getState().resetPassword(p),
    refreshTokens: () => useAuthStore.getState().refreshTokens(),
    setUser: (u) => useAuthStore.getState().setUser(u),
    setBlocked: (b) => useAuthStore.getState().setBlocked(b),
  };

  return (
    <AuthContext.Provider value={value}>
      {isBlocked ? <BlockedBanner /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
