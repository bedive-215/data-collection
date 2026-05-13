// src/services/questionService.js
// React Native — giữ nguyên interface, chỉ đổi import path cho RN project
import apiClient from "../api/apiClient"; // axios instance của bạn (hoạt động bình thường trong RN)

const questionService = {
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
    apiClient.patch(`/api/v1/questions/survey/${surveyId}/reorder`, { questions: payload }),

  // 🟣 Bulk CREATE questions
  // payload: [{ content, type, required, order_index, settings, options }]
  bulkCreateQuestions: (surveyId, payload) =>
    apiClient.post(`/api/v1/questions/survey/${surveyId}/bulk`, { questions: payload }),
};

export default questionService;