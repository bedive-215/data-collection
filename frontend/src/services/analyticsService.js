import axios from "axios";

const BASE_URL = "/api/v1";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Chống cache
  config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  config.headers["Pragma"] = "no-cache";
  config.headers["Expires"] = "0";
  return config;
});

const analyticsService = {
  // Dashboard - overview tổng hợp
  getDashboard: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/dashboard`, { params: { ...params, _t: ts } });
  },

  // Survey analytics - full per-question
  getSurveyAnalytics: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}`, { params: { ...params, _t: ts } });
  },

  // Completion stats
  getCompletionStats: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/completion`, { params: { ...params, _t: ts } });
  },

  // Response trend
  getResponseTrend: (surveyId, groupBy = "day", params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/trend`, {
      params: { ...params, group_by: groupBy, _t: ts },
    });
  },

  // Individual responses
  getIndividualResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/responses`, { params: { ...params, _t: ts } });
  },

  // Question analytics
  getQuestionAnalytics: (questionId, surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/questions/${questionId}/survey/${surveyId}`, {
      params: { ...params, _t: ts },
    });
  },

  // Cross-tabulation
  getCrossTab: (surveyId, questionA, questionB, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/crosstab`, {
      params: { ...params, question_a: questionA, question_b: questionB, _t: ts },
    });
  },

  // Date heatmap
  getDateHeatmap: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/heatmap`, { params: { ...params, _t: ts } });
  },

  // Filtered responses (search + status)
  getFilteredResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return axiosInstance.get(`/analytics/surveys/${surveyId}/responses/filtered`, { params: { ...params, _t: ts } });
  },

  // Export CSV
  exportCSV: (surveyId, params = {}) => {
    const token = localStorage.getItem("access_token");
    const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return { url: `/api/v1/analytics/surveys/${surveyId}/export?${query}`, token };
  },
};

export default analyticsService;
