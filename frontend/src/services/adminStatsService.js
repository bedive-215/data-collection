// src/services/adminStatsService.js
import apiClient from "@/api/apiClient";

export const adminStatsService = {
  // 🟢 Tổng quan hệ thống
  getOverview: () =>
    apiClient.get("/api/v1/admin-stats/overview"),

  // 🟢 Thống kê survey theo ngày (7 ngày gần nhất)
  getSurveyByDay: () =>
    apiClient.get("/api/v1/admin-stats/survey-by-day"),

  // 🟢 Dashboard tổng hợp
  getDashboard: () =>
    apiClient.get("/api/v1/admin-stats/dashboard"),

  // 🟢 Tổng số user đã trả lời survey
  getTotalUsersAnswered: () =>
    apiClient.get("/api/v1/admin-stats/answered-users"),

  // 🟢 Số user đã trả lời theo survey_id
  getUsersAnsweredBySurvey: (surveyId) =>
    apiClient.get(`/api/v1/admin-stats/answered-users/${surveyId}`),
};

export default adminStatsService;