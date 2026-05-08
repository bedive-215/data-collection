// src/providers/QuestionProvider.jsx
// React Native — thay toast (react-toastify) bằng Alert + ToastAndroid/Snackbar
// window.confirm → Alert.alert với callback
import React, { createContext, useState, useContext, useCallback } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import questionService from "../services/questionService";

export const QuestionContext = createContext();

export const useQuestion = () => {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error("useQuestion must be used within QuestionProvider");
  return ctx;
};

/* ─────────────────────────────────────────────────────────────────────
 * Toast helper — thay react-toastify
 * Android: ToastAndroid (native)
 * iOS:     Alert (không có native toast, dùng Alert ngắn gọn)
 * Nếu project bạn dùng thư viện như react-native-toast-message hoặc
 * @baronha/bling thì thay hàm showToast bên dưới cho phù hợp.
 * ───────────────────────────────────────────────────────────────────── */
const showToast = (message, type = "success") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // iOS fallback — nếu có thư viện toast thì dùng thay
    Alert.alert(type === "success" ? "✓ Thành công" : "✗ Lỗi", message);
  }
};

/* ─────────────────────────────────────────────────────────────────────
 * Confirm helper — thay window.confirm
 * Trả về Promise<boolean> để dùng await
 * ───────────────────────────────────────────────────────────────────── */
const confirmAction = (message) =>
  new Promise((resolve) => {
    Alert.alert(
      "Xác nhận",
      message,
      [
        { text: "Hủy",    style: "cancel",      onPress: () => resolve(false) },
        { text: "Xác nhận", style: "destructive", onPress: () => resolve(true)  },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

/* ─────────────────────────────────────────────────────────────────────
 * BE_TO_FE_TYPE — map type từ BE (lowercase hoặc uppercase) → FE enum
 * ───────────────────────────────────────────────────────────────────── */
const BE_TO_FE_TYPE = {
  // lowercase legacy
  text:            "TEXT",
  paragraph:       "PARAGRAPH",
  email:           "EMAIL",
  date:            "DATE",
  time:            "TIME",
  file_upload:     "FILE_UPLOAD",
  number:          "NUMBER",
  rating:          "RATING",
  single_choice:   "SINGLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  dropdown:        "DROPDOWN",

  // uppercase passthrough
  TEXT:            "TEXT",
  PARAGRAPH:       "PARAGRAPH",
  EMAIL:           "EMAIL",
  DATE:            "DATE",
  TIME:            "TIME",
  FILE_UPLOAD:     "FILE_UPLOAD",
  NUMBER:          "NUMBER",
  RATING:          "RATING",
  SINGLE_CHOICE:   "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  DROPDOWN:        "DROPDOWN",
};

/* ─────────────────────────────────────────────────────────────────────
 * normalizeOption — normalize option từ BE response
 * ───────────────────────────────────────────────────────────────────── */
const normalizeOption = (opt, index) => {
  if (typeof opt === "string") {
    return {
      id:          index,
      label:       opt,
      value:       opt,
      order_index: index,
      is_other:    false,
    };
  }
  return {
    id:          opt.id,
    label:       opt.label ?? "",
    value:       opt.value ?? "",
    order_index: opt.order_index ?? index,
    is_other:    opt.is_other ?? false,
  };
};

/* ─────────────────────────────────────────────────────────────────────
 * normalize — normalize question từ BE → FE format
 * ───────────────────────────────────────────────────────────────────── */
const normalize = (q) => ({
  id:          q.id,
  survey_id:   q.survey_id,
  content:     q.content,
  type:        BE_TO_FE_TYPE[q.type] ?? "TEXT",
  required:    q.required ?? true,
  order_index: q.order_index ?? 0,
  settings:    q.settings ?? null,
  options:     (q.options ?? q.option ?? []).map(normalizeOption),
});

/* ─────────────────────────────────────────────────────────────────────
 * QuestionProvider
 * ───────────────────────────────────────────────────────────────────── */
const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  /* ── CREATE ─────────────────────────────────────────────────────── */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    try {
      const res     = await questionService.createQuestions(surveyId, payload);
      const created = normalize(res.data.question);
      if (!created?.id) throw new Error("BE không trả về question.id");

      setQuestions((prev) => [...prev, created]);
      showToast("Tạo câu hỏi thành công!");
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo câu hỏi thất bại";
      setError(msg);
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── GET BY SURVEY ──────────────────────────────────────────────── */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    try {
      const res  = await questionService.getQuestionsBySurvey(surveyId);
      const list = (res.data.questions || []).map(normalize);
      setQuestions(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách câu hỏi thất bại";
      setError(msg);
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── UPDATE ─────────────────────────────────────────────────────── */
  const updateQuestion = async (questionId, surveyId, payload) => {
    setLoading(true);
    try {
      const res = await questionService.updateQuestion(questionId, payload);
      await fetchQuestionsBySurvey(surveyId);
      showToast("Cập nhật câu hỏi thành công!");
      return normalize(res.data.question);
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật câu hỏi thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── DELETE ─────────────────────────────────────────────────────── */
  const deleteQuestion = async (questionId) => {
  setLoading(true);
    try {
      await questionService.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showToast("Xóa câu hỏi thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa câu hỏi thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── REORDER ────────────────────────────────────────────────────── */
  const reorderQuestions = async (surveyId, orderedItems) => {
    setLoading(true);
    try {
      await questionService.reorderQuestions(surveyId, orderedItems);

      setQuestions((prev) => {
        const indexMap = Object.fromEntries(
          orderedItems.map((item) => [item.id, item.order_index])
        );
        return [...prev].sort(
  (a, b) =>
    (indexMap[a.id] ?? a.order_index ?? 0) -
    (indexMap[b.id] ?? b.order_index ?? 0)
);
      });

      showToast("Sắp xếp câu hỏi thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Sắp xếp thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── BULK CREATE ────────────────────────────────────────────────── */
  const bulkCreateQuestions = async (surveyId, questionsPayload) => {
    setLoading(true);
    try {
      await questionService.bulkCreateQuestions(surveyId, questionsPayload);
      const createdList = await fetchQuestionsBySurvey(surveyId);
      showToast("Tạo hàng loạt câu hỏi thành công!");
      return createdList;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo hàng loạt thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuestionContext.Provider
      value={{
        questions,
        loading,
        error,

        createQuestion,         // (surveyId, payload) → question
        fetchQuestionsBySurvey, // (surveyId) → question[]
        updateQuestion,         // (questionId, surveyId, payload) → void
        deleteQuestion,         // (questionId) → void
        reorderQuestions,       // (surveyId, [{ id, order_index }]) → void
        bulkCreateQuestions,    // (surveyId, payload[]) → question[]

        setQuestions,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;