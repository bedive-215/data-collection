// src/services/surveyService.js
import apiClient from "../api/apiClient";

export const surveyService = {
  // 🟢 Tạo survey (admin)
  createSurvey: (payload) =>
    apiClient.post("/api/v1/survey", payload),

  // 🟢 Lấy survey theo ID
  getSurveyById: (surveyId) =>
    apiClient.get(`/api/v1/survey/${surveyId}`),

  // 🟢 Lấy survey theo user (admin)
  getSurveyByUserId: (userId) =>
    apiClient.get(`/api/v1/surveys/users/${userId}`),

  // 🔴 Xoá survey (admin)
  deleteSurveyById: (surveyId) =>
    apiClient.delete(`/api/v1/survey/${surveyId}`),
    // 🟢 Lấy tất cả survey
  getAllSurveys: (params) =>
    apiClient.get("/api/v1/survey", { params }),

};

export default surveyService;