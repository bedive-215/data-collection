// src/services/questionService.js
import apiClient from "../api/apiClient";

export const questionService = {
  // 🟢 Tạo câu hỏi (admin)
  createQuestion: (surveyId, payload) =>
    apiClient.post(`/api/v1/questions/${surveyId}`, payload),

  // 🟢 Lấy tất cả câu hỏi của survey (admin)
  getQuestionsBySurvey: (surveyId) =>
    apiClient.get(`/api/v1/questions/${surveyId}`),

  // 🔴 Xóa câu hỏi (admin)
  deleteQuestion: (questionId) =>
    apiClient.delete(`/api/v1/questions/${questionId}`),
};

export default questionService;