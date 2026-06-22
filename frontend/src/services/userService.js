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

  getUserStats: (id) => apiClient.get(`/api/v1/users/${id}/stats`),

  getListOfUser: (params) =>
    apiClient.get("/api/v1/users", { params }),

  updateUserRole: (id, role) =>
    apiClient.patch(`/api/v1/users/${id}/role`, { role }),

  blockUser: (id, reason) =>
    apiClient.patch(`/api/v1/users/${id}/block`, { reason }),

  unblockUser: (id) =>
    apiClient.patch(`/api/v1/users/${id}/unblock`),

  deleteUser: (id) =>
    apiClient.delete(`/api/v1/users/${id}`),
};

export default userService;
