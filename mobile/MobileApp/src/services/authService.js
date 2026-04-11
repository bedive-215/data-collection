// src/services/authService.js
import apiClient from "../api/apiClient";
// ⬆️ dùng relative path (React Native không support @ alias nếu chưa config)

const authService = {
  register: (payload) =>
    apiClient.post("/api/v1/auth/register", payload),

  login: (payload) =>
    apiClient.post("/api/v1/auth/login", payload),

  verifyEmail: (payload) =>
    apiClient.post("/api/v1/auth/verify", payload),

  resendVerifyCode: (payload) =>
    apiClient.post("/api/v1/auth/verification-code/resend", payload),

  refreshToken: (payload) =>
    apiClient.post("/api/v1/auth/refresh-token", payload),

  logout: () =>
    apiClient.post("/api/v1/auth/logout"),

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
