// src/services/userService.js
import apiClient from "../api/apiClient";

const USER_BASE = "/api/v1/users";
const REVIEW_BASE = "/api/v1/reviews";

export const userService = {
  /* =========================
   *         USER
   * ========================= */

  // GET /me
  getUserInfo: () =>
    apiClient.get(`${USER_BASE}/me`),

  // PATCH /me - update profile (GỬI JSON, KHÔNG CÓ AVATAR)
 updateMe: (payload = {}) => {
  console.log("📝 userService.updateMe called");
  console.log("📝 Payload received:", payload);

  // ✅ Kiểm tra xem có avatar không
  const hasAvatar = payload.avatar && payload.avatar.uri;

  console.log("📷 Has avatar?", hasAvatar);

  // 🔥 NẾU CÓ AVATAR → GỬI FORMDATA
  if (hasAvatar) {
    console.log("📦 Creating FormData (with avatar)...");
    
    const formData = new FormData();

    // Append avatar
    formData.append("avatar", {
      uri: payload.avatar.uri,
      name: payload.avatar.fileName || "avatar.jpg",
      type: payload.avatar.type || "image/jpeg",
    });

    console.log("📷 Avatar appended:", {
      uri: payload.avatar.uri,
      name: payload.avatar.fileName || "avatar.jpg",
      type: payload.avatar.type || "image/jpeg",
    });

    // Append các field khác
    if (payload.full_name !== undefined && payload.full_name !== null) {
      formData.append("full_name", payload.full_name);
    }

    if (payload.phone_number !== undefined && payload.phone_number !== null) {
      formData.append("phone_number", payload.phone_number);
    }

    if (payload.date_of_birth !== undefined && payload.date_of_birth !== null) {
      formData.append("date_of_birth", payload.date_of_birth);
    }

    console.log("📦 Sending FormData to API...");

    return apiClient.patch(`${USER_BASE}/me`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // 🔥 NẾU KHÔNG CÓ AVATAR → GỬI JSON
  console.log("📦 Creating JSON (no avatar)...");
  
  const data = {};

  // Chỉ thêm các field có giá trị vào data
  if (payload.full_name !== undefined && payload.full_name !== null) {
    data.full_name = payload.full_name;
  }

  if (payload.phone_number !== undefined && payload.phone_number !== null) {
    data.phone_number = payload.phone_number;
  }

  if (payload.date_of_birth !== undefined && payload.date_of_birth !== null) {
    data.date_of_birth = payload.date_of_birth;
  }

  console.log("📦 Final JSON data:", JSON.stringify(data, null, 2));
  console.log("📦 Sending JSON to API...");

  // ✅ Gửi JSON với Content-Type: application/json
  return apiClient.patch(`${USER_BASE}/me`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
},

  // GET /:id
  getUserById: (id) =>
    apiClient.get(`${USER_BASE}/${id}`),

  // GET / (admin)
  getListOfUser: (params = {}) =>
    apiClient.get(USER_BASE, { params }),

  // DELETE /:id (admin)
  deleteUser: (id) =>
    apiClient.delete(`${USER_BASE}/${id}`),

  /* =========================
   *         REVIEWS
   * ========================= */

  // GET /product/:product_id
  getReviewsByProduct: (productId, params = {}) =>
    apiClient.get(
      `${REVIEW_BASE}/product/${productId}`,
      { params }
    ),

  // POST /
  addReview: (payload) =>
    apiClient.post(REVIEW_BASE, payload),

  // DELETE /:id
  deleteUserReview: (id) =>
    apiClient.delete(`${REVIEW_BASE}/${id}`),
};

export default userService;