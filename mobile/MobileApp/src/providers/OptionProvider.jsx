// src/providers/OptionProvider.jsx
import React, { createContext, useState, useContext } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import optionService from "../services/optionService";

export const OptionContext = createContext();

export const useOption = () => {
  const ctx = useContext(OptionContext);
  if (!ctx) throw new Error("useOption must be used within OptionProvider");
  return ctx;
};

// ─── Helper thay thế toast ───────────────────────────────────────────
const showToast = (message, type = "success") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // iOS: dùng Alert đơn giản (có thể thay bằng react-native-toast-message)
    Alert.alert(type === "error" ? "Lỗi" : "Thông báo", message);
  }
};

const OptionProvider = ({ children }) => {
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);

  /* ─────────────────────────────────────────────
   * GET BY QUESTION
   * ───────────────────────────────────────────── */
  const fetchOptions = async (questionId, surveyId) => {
    setLoading(true);
    try {
      const res = await optionService.getOptionsByQuestion(questionId, surveyId);
      const body = res.data ?? res;
      const list = body.data ?? body.options ?? [];
      setOptions((prev) => ({ ...prev, [questionId]: list }));
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy option thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
   * CREATE
   * ───────────────────────────────────────────── */
  const createOption = async (questionId, surveyId, content) => {
    if (!content || !content.trim()) {
      showToast("Content không được để trống", "error");
      return;
    }

    try {
      const res = await optionService.createOption(questionId, surveyId, {
        label: content.trim(),
      });
      const data = res.data ?? res;
      const newOpt = data.data ?? data.option;

      setOptions((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), newOpt],
      }));

      showToast("Thêm option thành công!");
      return newOpt;
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm option thất bại";
      showToast(msg, "error");
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * UPDATE
   * ───────────────────────────────────────────── */
  const updateOption = async (optionId, questionId, surveyId, payload) => {
    if (!payload || Object.keys(payload).length === 0) {
      showToast("Không có dữ liệu để cập nhật", "error");
      return;
    }

    try {
      const res = await optionService.updateOption(optionId, surveyId, payload);
      const data = res.data ?? res;
      const updated = data.data ?? data.option;

      setOptions((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).map((opt) =>
          opt.id === optionId ? updated : opt
        ),
      }));

      showToast("Cập nhật option thành công!");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật option thất bại";
      showToast(msg, "error");
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * DELETE
   * ───────────────────────────────────────────── */
  const deleteOption = async (optionId, questionId, surveyId) => {
    try {
      await optionService.deleteOption(optionId, surveyId);

      setOptions((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter(
          (opt) => opt.id !== optionId
        ),
      }));

      showToast("Xóa option thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa option thất bại";
      showToast(msg, "error");
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * BULK CREATE
   * ───────────────────────────────────────────── */
  const bulkCreateOptions = async (questionId, surveyId, contentArray) => {
    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      showToast("Danh sách option không hợp lệ", "error");
      return;
    }

    const cleaned = contentArray.map((c) => c?.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      showToast("Tất cả option đều rỗng", "error");
      return;
    }

    try {
      const res = await optionService.bulkCreateOptions(questionId, surveyId, {
        options: cleaned,
      });
      const data = res.data ?? res;
      const newOptions = data.data ?? data.options ?? [];

      setOptions((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), ...newOptions],
      }));

      showToast(`Đã thêm ${newOptions.length} option thành công!`);
      return newOptions;
    } catch (err) {
      const msg = err.response?.data?.message || "Bulk create option thất bại";
      showToast(msg, "error");
      throw err;
    }
  };

  return (
    <OptionContext.Provider
      value={{
        options,
        loading,
        fetchOptions,
        createOption,
        updateOption,
        deleteOption,
        bulkCreateOptions,
        setOptions,
      }}
    >
      {children}
    </OptionContext.Provider>
  );
};

export default OptionProvider;