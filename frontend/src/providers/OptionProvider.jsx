// src/providers/OptionProvider.jsx
import React, { createContext, useState, useContext } from "react";
import optionService from "../services/optionService";
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
   * GET /questions/:question_id/survey/:survey_id
   * BE trả về: { message, count, data: [...] }
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
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
   * CREATE
   * POST /questions/:question_id/survey/:survey_id
   * BE nhận: { label, value?, order_index?, is_other? }
   * ───────────────────────────────────────────── */
  const createOption = async (questionId, surveyId, content) => {
    if (!content || !content.trim()) {
      toast.error("Content không được để trống");
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
   * PATCH /options/:option_id/survey/:survey_id
   * BE nhận: { label?, value?, order_index?, is_other? }
   * ───────────────────────────────────────────── */
  const updateOption = async (optionId, questionId, surveyId, payload) => {
    if (!payload || Object.keys(payload).length === 0) {
      toast.error("Không có dữ liệu để cập nhật");
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
   * DELETE /options/:option_id/survey/:survey_id
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

      toast.success("Xóa option thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa option thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ─────────────────────────────────────────────
   * BULK CREATE
   * POST /questions/:question_id/survey/:survey_id/bulk
   * BE nhận: { options: string[] }
   * ───────────────────────────────────────────── */
  const bulkCreateOptions = async (questionId, surveyId, contentArray) => {
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
      const res = await optionService.bulkCreateOptions(questionId, surveyId, {
        options: cleaned,
      });
      const data = res.data ?? res;
      const newOptions = data.data ?? data.options ?? [];

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