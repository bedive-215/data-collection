// src/services/userService.js
import apiClient from "@/api/apiClient";

export const userService = {
  getUserInfo: () => apiClient.get("/api/v1/users/me"),
  // GET /me - Lấy thông tin user hiện tại

  // PATCH /me - Cập nhật thông tin user hiện tại (có upload avatar)
  updateUserInfo: (payload) => {
    const formData = new FormData();

    // Nếu có avatar file
    if (payload.avatar) {
      formData.append("avatar", payload.avatar);
    }

    // Append các field khác
    Object.keys(payload).forEach((key) => {
      if (key !== "avatar" && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    return apiClient.patch("/api/v1/users/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // GET /:id - Lấy thông tin user theo ID
  getUserById: (id) => apiClient.get(`/api/v1/users/${id}`),

  // GET / - Lấy danh sách user (chỉ admin)
  getListOfUser: (params, token) =>
    apiClient.get("/api/v1/users", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  // DELETE /:id - Xóa user (admin)
  deleteUser: (id, token) =>
    apiClient.delete(`/api/v1/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Reviews endpoints (router:
   *  router.get('/product/:product_id', getReviewsByProduct);
   *  router.post('/', authMiddleware.auth, addReview);
   *  router.delete('/:id', authMiddleware.auth, deleteUserReview);
   * )
   * Giả định base path trên server là /api/v1/reviews
   */

  // GET /product/:product_id - Lấy danh sách review theo product
  getReviewsByProduct: (productId, params) =>
    apiClient.get(`/api/v1/reviews/product/${productId}`, {
      params,
    }),

  // POST / - Thêm review (yêu cầu auth)
  // payload: { product_id, rating, comment, ... }
  addReview: (payload, token) =>
    apiClient.post("/api/v1/reviews", payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // DELETE /:id - Xóa review của user (yêu cầu auth)
  deleteUserReview: (id, token) =>
    apiClient.delete(`/api/v1/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default userService;
