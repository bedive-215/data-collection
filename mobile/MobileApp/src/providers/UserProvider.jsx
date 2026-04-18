// src/providers/UserProvider.jsx
import React, { createContext, useState, useCallback, useContext } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userService from "../services/userService";

const UserContext = createContext(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

// ============================
// Provider
// ============================
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Helper
  // ============================
  const getToken = async () => {
    if (user && (user.token || user.access_token)) {
      return user.token ?? user.access_token;
    }
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) return token;
      const token2 = await AsyncStorage.getItem("token");
      return token2 ?? null;
    } catch {
      return null;
    }
  };

  const handleAlert = (title, message) => Alert.alert(title, message);

  const confirmAlert = (title, message) =>
    new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Huỷ", onPress: () => resolve(false), style: "cancel" },
        { text: "Đồng ý", onPress: () => resolve(true) },
      ]);
    });

  // ============================
  // Fetch My Info
  // ============================
  const fetchMyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUserInfo();
      const serverUser = res.data?.user ?? res.data?.data ?? null;
      if (!serverUser) throw new Error("Invalid user data from server");

      const normalized = {
        user_id: serverUser.user_id ?? serverUser.id ?? serverUser._id ?? null,
        full_name: serverUser.full_name ?? serverUser.name ?? "",
        email: serverUser.email ?? "",
        phone_number: serverUser.phone_number ?? serverUser.phone ?? "",
        date_of_birth: serverUser.date_of_birth ?? "",
        avatar: serverUser.avatar
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
      const msg = err?.response?.data?.message || "Không thể tải thông tin người dùng";
      setError(msg);
      setUser(null);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================
  // Update My Info
  // ============================
   const updateMyInfo = async (payload) => {
    setLoading(true);
    try {
      await userService.updateMe(payload);
      Alert.alert("Thành công", "Cập nhật thông tin thành công");
    } catch (err) {
      console.error("Update user error:", err);
      Alert.alert("Lỗi", "Cập nhật thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Fetch user by ID
  // ============================
  const fetchUserById = async (userId) => {
    setLoading(true);
    try {
      const response = await userService.getUserById(userId);
      return response.data?.data ?? response.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tìm thấy người dùng";
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Fetch list users (admin)
  // ============================
  const fetchListUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await userService.getListOfUser(params);
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Lấy danh sách thất bại";
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Remove user (admin)
  // ============================
  const removeUser = async (userId) => {
    const ok = await confirmAlert("Xác nhận", "Bạn có chắc chắn muốn xóa người dùng này?");
    if (!ok) return false;

    setLoading(true);
    try {
      await userService.deleteUser(userId);
      handleAlert("Thành công", "Xóa người dùng thành công");
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || "Xóa thất bại";
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Reviews
  // ============================
  const fetchReviewsByProduct = async (productId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getReviewsByProduct(productId, params);
      return response.data?.data ?? response.data ?? [];
    } catch (err) {
      const msg = err?.response?.data?.message || "Không lấy được đánh giá";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const response = await userService.addReview(payload, token);
      handleAlert("Thành công", "Đăng đánh giá thành công");
      return response.data?.data ?? response.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng đánh giá thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId, options = {}) => {
    const ok = await confirmAlert("Xác nhận", "Bạn có chắc chắn muốn xóa đánh giá này?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      await userService.deleteUserReview(reviewId, token);
      handleAlert("Thành công", "Xóa đánh giá thành công");
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || "Xóa đánh giá thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Clear error & logout
  // ============================
  const clearError = () => setError(null);
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
    fetchReviewsByProduct,
    addReview,
    deleteReview,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
