// src/providers/OptionProvider.jsx
import React, { createContext, useState, useContext } from "react";
import optionService from "@/services/optionService";
import { toast } from "react-toastify";

export const OptionContext = createContext();

export const useOption = () => {
  const ctx = useContext(OptionContext);
  if (!ctx) throw new Error("useOption must be used within OptionProvider");
  return ctx;
};

const OptionProvider = ({ children }) => {
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);

  /* ─────────────────────────────────────────────
   * GET BY QUESTION
   * GET /questions/:question_id/options
   * BE trả về: { message, count, data: [...] }
   *   Mỗi option: { id, question_id, content, createdAt, updatedAt }
   * ───────────────────────────────────────────── */
  const fetchOptions = async (questionId) => {
    setLoading(true);
    try {
      const res = await optionService.getOptionsByQuestion(questionId);

      // axios bọc response trong res.data, hoặc có thể trả trực tiếp
      const body = res.data ?? res;

      // BE trả về { message, count, data: [...] }
      // Fallback thêm key `options` phòng trường hợp BE đổi shape
      const list = body.data ?? body.options ?? [];

      setOptions((prev) => ({ ...prev, [questionId]: list }));
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy option thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
   * CREATE
   * POST /questions/:question_id/options
   * BE nhận: content (string)
   * BE trả về: { message, option: { id, question_id, content, ... } }
   * ───────────────────────────────────────────── */
  const createOption = async (questionId, content) => {
    if (!content || !content.trim()) {
      toast.error("Content không được để trống");
      return;
    }

    try {
      const res = await optionService.createOption(questionId, content.trim());
      const data = res.data ?? res;
      const newOpt = data.option;

      setOptions((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), newOpt],
      }));

      toast.success("Thêm option thành công!");
      return newOpt;
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm option thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * UPDATE
   * PUT /options/:option_id
   * BE nhận: content (string)
   * BE trả về: { message, option: { id, question_id, content, ... } }
   * ───────────────────────────────────────────── */
  const updateOption = async (optionId, questionId, content) => {
    if (!content || !content.trim()) {
      toast.error("Content không được để trống");
      return;
    }

    try {
      const res = await optionService.updateOption(optionId, content.trim());
      const data = res.data ?? res;
      const updated = data.option;

      setOptions((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).map((opt) =>
          opt.id === optionId ? updated : opt
        ),
      }));

      toast.success("Cập nhật option thành công!");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật option thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * DELETE
   * DELETE /options/:option_id
   * BE trả về: { message }
   * ───────────────────────────────────────────── */
  const deleteOption = async (optionId, questionId) => {
    try {
      await optionService.deleteOption(optionId);

      setOptions((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter(
          (opt) => opt.id !== optionId
        ),
      }));

      toast.success("Xóa option thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa option thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * BULK CREATE
   * POST /questions/:question_id/options/bulk
   * BE nhận: options (string[])
   * BE trả về: { message, count, options[] }
   * ───────────────────────────────────────────── */
  const bulkCreateOptions = async (questionId, contentArray) => {
    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      toast.error("Danh sách option không hợp lệ");
      return;
    }

    const cleaned = contentArray.map((c) => c?.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error("Tất cả option đều rỗng");
      return;
    }

    try {
      const res = await optionService.bulkCreateOptions(questionId, cleaned);
      const data = res.data ?? res;
      const newOptions = data.options ?? data.data ?? [];

      setOptions((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), ...newOptions],
      }));

      toast.success(`Đã thêm ${newOptions.length} option thành công!`);
      return newOptions;
    } catch (err) {
      const msg = err.response?.data?.message || "Bulk create option thất bại";
      toast.error(msg);
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