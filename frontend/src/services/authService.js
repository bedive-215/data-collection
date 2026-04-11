// src/services/authService.js
import apiClient from "@/api/apiClient";

export const authService = {
  register: (payload) => apiClient.post("/api/v1/auth/register", payload),

  login: (payload) => apiClient.post("/api/v1/auth/login", payload),

  verifyEmail: (payload) => apiClient.post("/api/v1/auth/verify", payload),

  resendVerifyCode: (payload) =>
    apiClient.post("/api/v1/auth/verification-code/resend", payload),

  refreshToken: (payload) =>
    apiClient.post("/api/v1/auth/refresh-token", payload),

  logout: (payload) => apiClient.post("/api/v1/auth/logout", payload),

  loginWithOAuth: (payload) =>
    apiClient.post("/api/v1/auth/login/oauth", payload),

  forgotPassword: (payload) =>
    apiClient.post("/api/v1/auth/forgot-password", payload),

  verifyResetCode: (payload) =>
    apiClient.post("/api/v1/auth/verify-reset-code", payload),

  resetPassword: (payload) =>
    apiClient.post("/api/v1/auth/reset-password", payload),
};

export default authService;
