// src/providers/QuestionProvider.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import questionService from "../services/questionService";

export const QuestionContext = createContext();

export const useQuestion = () => {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error("useQuestion must be used within QuestionProvider");
  return ctx;
};

// ─── Helper thay thế toast ───────────────────────────────────────────
const showToast = (message, type = "success") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(type === "error" ? "Lỗi" : "Thông báo", message);
  }
};

/* ─────────────────────────────────────────────────────────────────────
 * Type mapping BE → FE
 * ───────────────────────────────────────────────────────────────────── */
const BE_TO_FE_TYPE = {
  text: "TEXT", paragraph: "PARAGRAPH", email: "EMAIL",
  date: "DATE", number: "NUMBER", rating: "RATING",
  single_choice: "SINGLE_CHOICE", multiple_choice: "MULTIPLE_CHOICE",
  dropdown: "DROPDOWN", linear_scale: "LINEAR_SCALE",
  time: "TIME", file_upload: "FILE_UPLOAD",
  TEXT: "TEXT", PARAGRAPH: "PARAGRAPH", EMAIL: "EMAIL",
  DATE: "DATE", NUMBER: "NUMBER", RATING: "RATING",
  SINGLE_CHOICE: "SINGLE_CHOICE", MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  DROPDOWN: "DROPDOWN", LINEAR_SCALE: "LINEAR_SCALE",
  TIME: "TIME", FILE_UPLOAD: "FILE_UPLOAD",
};

const normalizeOption = (opt, index) => {
  if (typeof opt === "string") {
    return { id: index, label: opt, value: opt, order_index: index, is_other: false, image_url: null, media_type: null };
  }
  return {
    id: opt.id,
    label: opt.label ?? "",
    value: opt.value ?? "",
    order_index: opt.order_index ?? index,
    is_other: opt.is_other ?? false,
    image_url: opt.image_url ?? null,
    media_type: opt.media_type ?? null,
  };
};

const normalize = (q) => ({
  id: q.id,
  survey_id: q.survey_id,
  section_id: q.section_id || null,
  content: q.content,
  description: q.description || null,
  placeholder: q.placeholder || null,
  type: BE_TO_FE_TYPE[q.type] ?? "TEXT",
  required: q.required ?? true,
  order_index: q.order_index ?? 0,
  settings: q.settings ?? {},
  media_url: q.media_url || null,
  media_type: q.media_type || null,
  condition: q.condition || null,
  hidden_from_analytics: q.hidden_from_analytics ?? false,
  next_question_id: q.next_question_id || null,
  next_section_id: q.next_section_id || null,
  options: (q.options ?? q.option ?? []).map(normalizeOption),
});

const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ── CREATE ────────────────────────────────────────────────────── */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    try {
      const res = await questionService.createQuestions(surveyId, payload);
      const data = res.data;
      const created = normalize(data.question);
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

  /* ── GET BY SURVEY ─────────────────────────────────────────────── */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    try {
      const res = await questionService.getQuestionsBySurvey(surveyId);
      const data = res.data;
      const list = (data.questions || []).map(normalize);
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

  /* ── UPDATE ────────────────────────────────────────────────────── */
  const updateQuestion = async (questionId, surveyId, payload) => {
    setLoading(true);
    try {
      const res = await questionService.updateQuestion(questionId, surveyId, payload);
      const data = res.data;
      await fetchQuestionsBySurvey(surveyId);
      showToast("Cập nhật câu hỏi thành công!");
      return normalize(data.question);
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật câu hỏi thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── DELETE ───────────────────────────────────────────────────── */
  const deleteQuestion = async (questionId, surveyId) => {
    setLoading(true);
    try {
      await questionService.deleteQuestion(questionId, surveyId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showToast("Xóa câu hỏi thành công!");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa câu hỏi thất bại";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── REORDER ───────────────────────────────────────────────────── */
  const reorderQuestions = async (surveyId, orderedItems) => {
    setLoading(true);
    try {
      await questionService.reorderQuestions(surveyId, orderedItems);
      setQuestions((prev) => {
        const indexMap = Object.fromEntries(
          orderedItems.map((item) => [item.id, item.order_index])
        );
        return [...prev].sort((a, b) => indexMap[a.id] - indexMap[b.id]);
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

  /* ── BULK CREATE ───────────────────────────────────────────────── */
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
        createQuestion,
        fetchQuestionsBySurvey,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        bulkCreateQuestions,
        setQuestions,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;