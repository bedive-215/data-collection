import apiClient from '../api/apiClient';

const BASE_URL = '/api/v1/notifications';

const notificationService = {
  // GET /api/v1/notifications - Lấy danh sách thông báo
  getNotifications: (params = {}) =>
    apiClient.get(BASE_URL, { params }),

  // GET /api/v1/notifications/unread-count - Lấy số thông báo chưa đọc
  getUnreadCount: () =>
    apiClient.get(BASE_URL + '/unread-count'),

  // PUT /api/v1/notifications/:id/read - Đánh dấu 1 thông báo đã đọc
  markAsRead: (notificationId) =>
    apiClient.put(BASE_URL + '/' + notificationId + '/read'),

  // PUT /api/v1/notifications/read-all - Đánh dấu tất cả đã đọc
  markAllAsRead: () =>
    apiClient.put(BASE_URL + '/read-all'),

  // DELETE /api/v1/notifications/read - Xóa tất cả thông báo đã đọc
  deleteReadNotifications: () =>
    apiClient.delete(BASE_URL + '/read'),

  // DELETE /api/v1/notifications/:id - Xóa 1 thông báo
  deleteNotification: (notificationId) =>
    apiClient.delete(BASE_URL + '/' + notificationId),
};

export default notificationService;
