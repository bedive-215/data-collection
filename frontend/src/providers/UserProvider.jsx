// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { userService } from "@/services/userService";
import { toast } from "react-toastify";

// Tạo context
export const UserContext = createContext();

// Hook tiện lợi để dùng ở các component
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Provider chính
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper lấy token (tìm trong user trước, nếu không có thì localStorage)
  const getToken = () => {
    if (user && (user.token || user.access_token)) {
      return user.token ?? user.access_token;
    }
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  };

  // Lấy thông tin cá nhân (GET /me)
  const fetchMyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await userService.getUserInfo();

      const serverUser = res.data?.user ?? res.data?.data ?? null;
      if (!serverUser) {
        throw new Error("Invalid user data from server");
      }

      const normalized = {
        user_id: serverUser.user_id ?? serverUser.id ?? serverUser._id ?? null,

        // ⚡ GIỮ ĐÚNG TÊN GIỐNG UI
        full_name: serverUser.full_name ?? serverUser.name ?? "",
        email: serverUser.email ?? "",
        phone_number: serverUser.phone_number ?? serverUser.phone ?? "",
        date_of_birth: serverUser.date_of_birth ?? "",

        avatar:
          serverUser.avatar
            ? serverUser.avatar.startsWith("http") ||
              serverUser.avatar.startsWith("data:")
              ? serverUser.avatar
              : `${API_BASE_URL}${serverUser.avatar}`
            : null,

        address: serverUser.address ?? "",
        role: serverUser.role ?? null,
      };

      setUser(normalized);
      return normalized;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Không thể tải thông tin người dùng";
      setError(msg);
      setUser(null);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật thông tin cá nhân + avatar (PATCH /me)
  const updateMyInfo = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.updateUserInfo(payload);
      const updatedUser = response.data.data ?? response.data?.user ?? response.data;
      // Nếu server trả về object user, normalize cơ bản (giữ nguyên key UI)
      const normalized = {
        ...user,
        ...updatedUser,
      };
      setUser(normalized);
      toast.success("Cập nhật thông tin thành công!");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin user theo ID (GET /:id)
  const fetchUserById = async (userId) => {
    setLoading(true);
    try {
      const response = await userService.getUserById(userId);
      return response.data.data ?? response.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy người dùng";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách user (GET / - admin only)
  const fetchListUsers = async (params = {}) => {
    setLoading(true);
    try {
      // note: nếu cần token, có thể lấy từ getToken() và sửa userService.getListOfUser
      const response = await userService.getListOfUser(params);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa user (DELETE /:id - admin only)
  const removeUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return false;

    setLoading(true);
    try {
      await userService.deleteUser(userId);
      toast.success("Xóa người dùng thành công");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  //
  // --------------- Reviews related (mới thêm) ----------------
  //

  // GET /product/:product_id - Lấy reviews theo product
  const fetchReviewsByProduct = async (productId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getReviewsByProduct(productId, params);
      // server có thể trả data ở nhiều shape
      return response.data.data ?? response.data ?? [];
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được đánh giá";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // POST / - Thêm review (yêu cầu auth)
  // payload: { product_id, rating, comment, ... }
  const addReview = async (payload, options = {}) => {
    // options có thể chứa token nếu muốn override
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const response = await userService.addReview(payload, token);
      const created = response.data.data ?? response.data;
      toast.success("Đăng đánh giá thành công");
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng đánh giá thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // DELETE /:id - Xóa review của user (yêu cầu auth)
  const deleteReview = async (reviewId, options = {}) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      await userService.deleteUserReview(reviewId, token);
      toast.success("Xóa đánh giá thành công");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa đánh giá thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset lỗi
  const clearError = () => setError(null);

  // Logout thủ công
  const logout = () => {
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    clearError,
    fetchMyInfo,
    updateMyInfo,
    fetchUserById,
    fetchListUsers,
    removeUser,
    logout,
    setUser,

    // Reviews
    fetchReviewsByProduct,
    addReview,
    deleteReview,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
