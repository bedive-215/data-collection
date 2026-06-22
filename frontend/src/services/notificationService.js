import apiClient from "@/api/apiClient";

const notificationService = {
  getNotifications: (params = {}) =>
    apiClient.get("/api/v1/notifications", { params }),

  getUnreadCount: () =>
    apiClient.get("/api/v1/notifications/unread-count"),

  markAsRead: (id) =>
    apiClient.put(`/api/v1/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.put("/api/v1/notifications/read-all"),

  deleteNotification: (id) =>
    apiClient.delete(`/api/v1/notifications/${id}`),

  deleteReadNotifications: () =>
    apiClient.delete("/api/v1/notifications/read"),
};

export default notificationService;
