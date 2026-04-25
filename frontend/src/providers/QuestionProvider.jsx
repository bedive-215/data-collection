// src/providers/QuestionProvider.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import questionService from "@/services/questionService";
import { toast } from "react-toastify";

export const QuestionContext = createContext();

export const useQuestion = () => {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error("useQuestion must be used within QuestionProvider");
  return ctx;
};

const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ========= NORMALIZE ========= */
  const normalize = (q) => ({
    id: q.id,
    survey_id: q.survey_id,
    content: q.content,
    type: q.type,
    required: q.required,
    order_index: q.order_index,
    options: q.options || [],
  });

  /* ========= CREATE ========= */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    try {
      const res = await questionService.createQuestions(surveyId, payload);
      const data = res.data ?? res;

      const created = normalize(data.question);
      setQuestions((prev) => [...prev, created]);

      toast.success("Tạo câu hỏi thành công!");
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ========= GET ========= */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    try {
      const res = await questionService.getQuestionsBySurvey(surveyId);
      const data = res.data ?? res;

      const list = (data.questions || []).map(normalize);
      setQuestions(list);

      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Fetch thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========= UPDATE ========= */
  const updateQuestion = async (questionId, payload) => {
    try {
      const res = await questionService.updateQuestion(questionId, payload);
      const data = res.data ?? res;

      const updated = normalize(data.question);

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updated : q))
      );

      toast.success("Cập nhật thành công!");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || "Update thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ========= DELETE ========= */
  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Xóa câu hỏi?")) return;

    try {
      await questionService.deleteQuestion(questionId);

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));

      toast.success("Xóa thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Delete thất bại";
      toast.error(msg);
      throw err;
    }
  };

  /* ========= REORDER ========= */
  // FIX: payload phải dùng key "order_index" để khớp với BE
  // Đúng format: [{ id: 1, order_index: 0 }, { id: 2, order_index: 1 }, ...]
  const reorderQuestions = async (surveyId, payload) => {
    try {
      await questionService.reorderQuestions(surveyId, payload);

      // Cập nhật local state theo order_index mới
      setQuestions((prev) => {
        const map = Object.fromEntries(
          payload.map((i) => [i.id, i.order_index]) // ✅ dùng "order_index"
        );
        return [...prev].sort((a, b) => map[a.id] - map[b.id]);
      });

      toast.success("Sắp xếp thành công!");
    } catch (err) {
      toast.error("Reorder thất bại");
      throw err;
    }
  };

  /* ========= BULK UPDATE ========= */
  // FIX: BE trả về { message } không có "questions"
  // → Sau bulk update, fetch lại danh sách mới nhất từ server để đồng bộ state
  const bulkUpdateQuestions = async (surveyId, payload) => {
    try {
      await questionService.bulkUpdateQuestions(surveyId, payload);

      // BE không trả về questions sau bulk update
      // → Fetch lại để đảm bảo state luôn đúng
      const updatedList = await fetchQuestionsBySurvey(surveyId);

      toast.success("Bulk update thành công!");
      return updatedList;
    } catch (err) {
      toast.error("Bulk update thất bại");
      throw err;
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
        bulkUpdateQuestions,

        setQuestions,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;