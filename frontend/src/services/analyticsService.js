import apiClient from "../api/apiClient";

const BASE_URL = "/api/v1/analytics";

const getNoCacheHeaders = () => ({
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
});

const analyticsService = {
  // Dashboard - overview tổng hợp
  getDashboard: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/dashboard`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Survey analytics - full per-question
  getSurveyAnalytics: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Completion stats
  getCompletionStats: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/completion`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Response trend
  getResponseTrend: (surveyId, groupBy = "day", params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/trend`, {
      params: { ...params, group_by: groupBy, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Individual responses
  getIndividualResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/responses`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Question analytics
  getQuestionAnalytics: (questionId, surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/questions/${questionId}/survey/${surveyId}`, {
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Cross-tabulation
  getCrossTab: (surveyId, questionA, questionB, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/crosstab`, {
      params: { ...params, question_a: questionA, question_b: questionB, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Date heatmap
  getDateHeatmap: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/heatmap`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Filtered responses (search + status)
  getFilteredResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`${BASE_URL}/surveys/${surveyId}/responses/filtered`, { 
      params: { ...params, _t: ts },
      headers: getNoCacheHeaders()
    });
  },

  // Export CSV
  exportCSV: (surveyId, params = {}) => {
    const token = localStorage.getItem("access_token");
    const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
    return { url: `${API_BASE}${BASE_URL}/surveys/${surveyId}/export?${query}`, token };
  },
};

export default analyticsService;
