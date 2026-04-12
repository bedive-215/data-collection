import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";

import questionService from "@/services/questionService";
import { toast } from "react-toastify";

export const QuestionContext = createContext();

export const useQuestion = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestion must be used within a QuestionProvider");
  }
  return context;
};

const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
        NORMALIZE
  ========================= */
  const normalize = (q) => ({
    id: q.id,
    survey_id: q.survey_id,
    content: q.content,
    type: q.type,
    required: q.required,
    order_index: q.order_index,
    options: q.options || [],
  });

  /* =========================
        CREATE QUESTION
  ========================= */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await questionService.createQuestion(surveyId, payload);
      const data = res.data ?? res;

      const created = normalize(data.question);

      setQuestions((prev) => [...prev, created]);

      toast.success("Tạo câu hỏi thành công!");
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo câu hỏi thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
        GET QUESTIONS BY SURVEY
  ========================= */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await questionService.getQuestionsBySurvey(surveyId);
      const data = res.data ?? res;

      const list = (data.questions || []).map(normalize);

      setQuestions(list);

      return list;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Không lấy được danh sách câu hỏi";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
        DELETE QUESTION
  ========================= */
  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?"))
      return false;

    setLoading(true);
    setError(null);

    try {
      await questionService.deleteQuestion(questionId);

      setQuestions((prev) =>
        prev.filter((q) => q.id !== questionId)
      );

      toast.success("Xóa câu hỏi thành công!");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa câu hỏi thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
        CLEAR ERROR
  ========================= */
  const clearError = () => setError(null);

  return (
    <QuestionContext.Provider
      value={{
        questions,
        loading,
        error,

        createQuestion,
        fetchQuestionsBySurvey,
        deleteQuestion,

        setQuestions,
        clearError,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;