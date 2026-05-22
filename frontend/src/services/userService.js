// src/services/userService.js
import apiClient from "@/api/apiClient";

export const userService = {
  getUserInfo: () => apiClient.get("/api/v1/users/me"),

  updateUserInfo: (payload) => {
    const { avatar, ...rest } = payload;
    return apiClient.patch("/api/v1/users/me", rest);
  },

  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.patch("/api/v1/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getUserById: (id) => apiClient.get(`/api/v1/users/${id}`),

  getUserStats: (id, token) =>
    apiClient.get(`/api/v1/users/${id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getListOfUser: (params, token) =>
    apiClient.get("/api/v1/users", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateUserRole: (id, role, token) =>
    apiClient.patch(`/api/v1/users/${id}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  blockUser: (id, reason, token) =>
    apiClient.patch(`/api/v1/users/${id}/block`, { reason }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  unblockUser: (id, token) =>
    apiClient.patch(`/api/v1/users/${id}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteUser: (id, token) =>
    apiClient.delete(`/api/v1/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getReviewsByProduct: (productId, params) =>
    apiClient.get(`/api/v1/reviews/product/${productId}`, { params }),

  addReview: (payload, token) =>
    apiClient.post("/api/v1/reviews", payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteUserReview: (id, token) =>
    apiClient.delete(`/api/v1/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default userService;
