// src/services/questionService.js
import apiClient from "@/api/apiClient";

export const questionService = {
  // 🟢 Tạo 1 question (kèm options nếu có)
  createQuestions: (surveyId, payload) =>
    apiClient.post(`/api/v1/questions/${surveyId}`, payload),

  // 🟢 Lấy tất cả question theo survey
  getQuestionsBySurvey: (surveyId) =>
    apiClient.get(`/api/v1/questions/${surveyId}`),

  // 🟡 Update 1 question
  updateQuestion: (questionId, payload) =>
    apiClient.patch(`/api/v1/questions/${questionId}`, payload),

  // 🔴 Xóa question
  deleteQuestion: (questionId) =>
    apiClient.delete(`/api/v1/questions/${questionId}`),

  // 🔵 Reorder questions — payload: [{ id, order_index }]
  reorderQuestions: (surveyId, payload) =>
    apiClient.patch(`/api/v1/questions/${surveyId}/reorder`, payload),

  // 🟣 Bulk CREATE questions — đổi PATCH → POST cho đúng BE route
  //    payload: [{ content, type, required, order_index, settings, options }]
  bulkCreateQuestions: (surveyId, payload) =>
    apiClient.post(`/api/v1/questions/${surveyId}/bulk`, payload),
};

export default questionService;