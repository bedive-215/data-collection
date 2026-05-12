// src/services/questionService.js
import apiClient from "@/api/apiClient";

export const questionService = {
  // 🟢 Tạo 1 question (kèm options nếu có)
  createQuestions: (surveyId, payload) =>
    apiClient.post(`/api/v1/questions/survey/${surveyId}`, payload),

  // 🟢 Lấy tất cả question theo survey
  getQuestionsBySurvey: (surveyId) =>
    apiClient.get(`/api/v1/questions/survey/${surveyId}`),

  // 🟡 Update 1 question
  updateQuestion: (questionId, surveyId, payload) =>
    apiClient.patch(`/api/v1/questions/${questionId}/survey/${surveyId}`, payload),

  // 🔴 Xóa question
  deleteQuestion: (questionId, surveyId) =>
    apiClient.delete(`/api/v1/questions/${questionId}/survey/${surveyId}`),

  // 🔵 Reorder questions — payload: [{ id, order_index }]
  reorderQuestions: (surveyId, payload) =>
    apiClient.patch(`/api/v1/questions/survey/${surveyId}/reorder`, payload),

  // BE: req.body.questions (mảng). Cho phép gọi với array hoặc { questions }.
  bulkCreateQuestions: (surveyId, payload) =>
    apiClient.post(
      `/api/v1/questions/survey/${surveyId}/bulk`,
      Array.isArray(payload) ? { questions: payload } : payload,
    ),

  /** AI: { mode: 'parse'|'generate', rawText?, surveyTitle?, surveyDescription?, count? } */
  aiSuggestQuestions: (surveyId, body) =>
    apiClient.post(`/api/v1/questions/${surveyId}/ai/suggest`, body),
};

export default questionService;