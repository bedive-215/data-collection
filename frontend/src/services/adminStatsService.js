import apiClient from "@/api/apiClient";

export const adminStatsService = {
  getOverview: () => apiClient.get("/api/v1/admin-stats/overview"),
  getSurveyByDay: (period) => apiClient.get(`/api/v1/admin-stats/survey-by-day?period=${period || "week"}`),
  getDashboard: () => apiClient.get("/api/v1/admin-stats/dashboard"),
  getTotalUsersAnswered: () => apiClient.get("/api/v1/admin-stats/answered-users"),
  getUsersAnsweredBySurvey: (surveyId) => apiClient.get(`/api/v1/admin-stats/answered-users/${surveyId}`),

  // New detailed endpoints
  getFullDashboard: (period) => apiClient.get(`/api/v1/admin-stats/full-dashboard?period=${period || "week"}`),
  getResponseTrend: (period) => apiClient.get(`/api/v1/admin-stats/response-trend?period=${period || "week"}`),
  getSurveyStatusDistribution: () => apiClient.get("/api/v1/admin-stats/survey-status"),
  getQuestionTypeDistribution: () => apiClient.get("/api/v1/admin-stats/question-types"),
  getRecentResponses: (limit = 10) => apiClient.get(`/api/v1/admin-stats/recent-responses?limit=${limit}`),
  getQuickStats: () => apiClient.get("/api/v1/admin-stats/quick-stats"),
};

export default adminStatsService;
