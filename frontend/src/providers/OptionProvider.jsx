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

  /* ========= GET ========= */
  /* ========= GET ========= */
const fetchOptions = async (questionId) => {
  setLoading(true);
  try {
    const res = await optionService.getOptionsByQuestion(questionId);
    const raw = res.data ?? res;

    // API trả về { data: [...] } chứ không phải { options: [...] }
    const list = raw.data ?? raw.options ?? [];

    setOptions((prev) => ({ ...prev, [questionId]: list }));
    return list;
  } catch (err) {
    toast.error("Không lấy được option");
    throw err;
  } finally {
    setLoading(false);
  }
};

/* ========= CREATE ========= */
const createOption = async (questionId, payload) => {
  try {
    const res = await optionService.createOption(questionId, payload);
    const raw = res.data ?? res;

    // Tuỳ BE trả về: raw.data (object) hoặc raw.option
    const newOpt = raw.data ?? raw.option;

    setOptions((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), newOpt],
    }));

    toast.success("Thêm option thành công!");
    return newOpt;
  } catch (err) {
    toast.error("Thêm option thất bại");
    throw err;
  }
};

/* ========= UPDATE ========= */
const updateOption = async (optionId, questionId, payload) => {
  try {
    const res = await optionService.updateOption(optionId, payload);
    const raw = res.data ?? res;

    const updated = raw.data ?? raw.option;

    setOptions((prev) => ({
      ...prev,
      [questionId]: prev[questionId].map((opt) =>
        opt.id === optionId ? updated : opt
      ),
    }));

    toast.success("Update option thành công!");
  } catch (err) {
    toast.error("Update option thất bại");
    throw err;
  }
};

  /* ========= DELETE ========= */
  const deleteOption = async (optionId, questionId) => {
    try {
      await optionService.deleteOption(optionId);

      setOptions((prev) => ({
        ...prev,
        [questionId]: prev[questionId].filter(
          (opt) => opt.id !== optionId
        ),
      }));

      toast.success("Xóa option thành công!");
    } catch (err) {
      toast.error("Xóa option thất bại");
      throw err;
    }
  };

  /* ========= BULK ========= */
  const bulkCreateOptions = async (questionId, payload) => {
    try {
      const res = await optionService.bulkCreateOptions(questionId, payload);
      const data = res.data ?? res;

      setOptions((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), ...data.options],
      }));

      toast.success("Bulk option thành công!");
      return data.options;
    } catch (err) {
      toast.error("Bulk option thất bại");
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