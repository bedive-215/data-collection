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

/* ─────────────────────────────────────────────────────────────────────
 * normalize: chuẩn hóa question từ BE response về FE format
 *
 * BE trả về type uppercase (khớp Joi enum):
 *   "TEXT" | "PARAGRAPH" | "EMAIL" | "DATE" | "NUMBER" |
 *   "RATING" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "DROPDOWN"
 *
 * Nếu BE (sequelize) lưu lowercase → cũng được xử lý qua BE_TO_FE_TYPE
 * ───────────────────────────────────────────────────────────────────── */
const BE_TO_FE_TYPE = {
  // lowercase legacy
  text:            "TEXT",
  paragraph:       "PARAGRAPH",
  email:           "EMAIL",
  date:            "DATE",
  number:          "NUMBER",
  rating:          "RATING",
  single_choice:   "SINGLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  dropdown:        "DROPDOWN",
  linear_scale:   "LINEAR_SCALE",
  time:            "TIME",
  file_upload:     "FILE_UPLOAD",
  // uppercase passthrough
  TEXT:            "TEXT",
  PARAGRAPH:       "PARAGRAPH",
  EMAIL:           "EMAIL",
  DATE:            "DATE",
  NUMBER:          "NUMBER",
  RATING:          "RATING",
  SINGLE_CHOICE:   "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  DROPDOWN:        "DROPDOWN",
  LINEAR_SCALE:    "LINEAR_SCALE",
  TIME:            "TIME",
  FILE_UPLOAD:     "FILE_UPLOAD",
};

/**
 * Normalize option từ BE response
 * BE trả về options[] dạng object { id, label, value, order_index, is_other }
 * Cũng handle legacy string[] nếu có
 */
const normalizeOption = (opt, index) => {
  if (typeof opt === "string") {
    return {
      id:          index,
      label:       opt,
      value:       opt,
      order_index: index,
      is_other:    false,
      image_url:   null,
      media_type:  null,
    };
  }
  return {
    id:          opt.id,
    label:       opt.label ?? "",
    value:       opt.value ?? "",
    order_index: opt.order_index ?? index,
    is_other:    opt.is_other ?? false,
    image_url:   opt.image_url ?? null,
    media_type:  opt.media_type ?? null,
  };
};

/**
 * Normalize question từ BE → FE format
 * Hỗ trợ cả hai key: "options" (mới, BE chuẩn) và "option" (legacy)
 */
const normalize = (q) => ({
  id:                     q.id,
  survey_id:              q.survey_id,
  section_id:             q.section_id || null,
  content:                q.content,
  description:            q.description || null,
  placeholder:            q.placeholder || null,
  type:                   BE_TO_FE_TYPE[q.type] ?? "TEXT",
  required:               q.required ?? true,
  order_index:            q.order_index ?? 0,
  settings:               q.settings ?? {},
  media_url:              q.media_url || null,
  media_type:             q.media_type || null,
  condition:              q.condition || null,
  hidden_from_analytics: q.hidden_from_analytics ?? false,
  next_question_id:       q.next_question_id || null,
  next_section_id:        q.next_section_id || null,
  options: (q.options ?? q.option ?? []).map(normalizeOption),
});

const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  /* ── CREATE ─────────────────────────────────────────────────────
   * payload đúng BE Joi schema (mở rộng):
   *   { content, type (uppercase), required, order_index, settings,
   *     description?, placeholder?, section_id?, media_url?, media_type?,
   *     condition?, hidden_from_analytics?, next_question_id?, next_section_id?,
   *     options: [{ label, value, order_index?, is_other? }] }
   * ─────────────────────────────────────────────────────────────── */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    try {
      const res  = await questionService.createQuestions(surveyId, payload);
      const data = res.data;
      const created = normalize(data.question);
      if (!created?.id) throw new Error("BE không trả về question.id");
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

  /* ── GET BY SURVEY ──────────────────────────────────────────────
   * BE res: { message, count, questions[] }
   * questions[i].options: [{ id, label, value, order_index, is_other }]
   * ─────────────────────────────────────────────────────────────── */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    try {
      const res  = await questionService.getQuestionsBySurvey(surveyId);
      const data = res.data;

      const list = (data.questions || []).map(normalize);
      setQuestions(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách câu hỏi thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── UPDATE ─────────────────────────────────────────────────────
   * payload đúng BE Joi schema:
   *   { content?, type? (uppercase), required?, settings?,
   *     options?: [{ label, value, order_index?, is_other? }] }
   * BE res: { message, question } — question có thể không có options
   * → fetch lại để sync
   * ─────────────────────────────────────────────────────────────── */
  const updateQuestion = async (questionId, surveyId, payload) => {
    setLoading(true);
    try {
      const res  = await questionService.updateQuestion(questionId, surveyId, payload);
      const data = res.data;

      // Fetch lại để đảm bảo options được sync đầy đủ
      await fetchQuestionsBySurvey(surveyId);

      toast.success("Cập nhật câu hỏi thành công!");
      return normalize(data.question);
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật câu hỏi thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── DELETE ─────────────────────────────────────────────────────
   * BE res: { message }
   * ─────────────────────────────────────────────────────────────── */
  const deleteQuestion = async (questionId, surveyId) => {
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

    setLoading(true);
    try {
      await questionService.deleteQuestion(questionId, surveyId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("Xóa câu hỏi thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa câu hỏi thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── REORDER ────────────────────────────────────────────────────
   * payload: [{ id, order_index }]
   * BE res:  { message }
   * ─────────────────────────────────────────────────────────────── */
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

      toast.success("Sắp xếp câu hỏi thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Sắp xếp thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── BULK CREATE ────────────────────────────────────────────────
   * payload: [{ content, type, required, order_index, settings,
   *             options: [{ label, value }] }]
   * BE res:  { message, total, questions[] }
   * ─────────────────────────────────────────────────────────────── */
  const bulkCreateQuestions = async (surveyId, questionsPayload) => {
    setLoading(true);
    try {
      await questionService.bulkCreateQuestions(surveyId, questionsPayload);

      const createdList = await fetchQuestionsBySurvey(surveyId);
      toast.success("Tạo hàng loạt câu hỏi thành công!");
      return createdList;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo hàng loạt thất bại";
      toast.error(msg);
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