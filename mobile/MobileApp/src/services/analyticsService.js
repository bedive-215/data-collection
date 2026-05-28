// src/services/analyticsService.js
import apiClient from "../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const analyticsService = {
  // Dashboard - overview tổng hợp
  getDashboard: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/dashboard`, {
      params: { ...params, _t: ts },
    });
  },

  // AI Insights
  getAiInsights: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/ai-insights`, {
      params: { ...params, _t: ts },
    });
  },

  // Survey stats
  getSurveyStats: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/stats`, {
      params: { ...params, _t: ts },
    });
  },

  // Survey analytics - full per-question
  getSurveyAnalytics: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}`, {
      params: { ...params, _t: ts },
    });
  },

  // Completion stats
  getCompletionStats: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/completion`, {
      params: { ...params, _t: ts },
    });
  },

  // Response trend
  getResponseTrend: (surveyId, groupBy = "day", params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/trend`, {
      params: { ...params, group_by: groupBy, _t: ts },
    });
  },

  // Individual responses
  getIndividualResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/responses`, {
      params: { ...params, _t: ts },
    });
  },

  // Question analytics
  getQuestionAnalytics: (questionId, surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(
      `/api/v1/analytics/questions/${questionId}/survey/${surveyId}`,
      { params: { ...params, _t: ts } }
    );
  },

  // Cross-tabulation
  getCrossTab: (surveyId, questionA, questionB, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/crosstab`, {
      params: { ...params, question_a: questionA, question_b: questionB, _t: ts },
    });
  },

  // Date heatmap
  getDateHeatmap: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/heatmap`, {
      params: { ...params, _t: ts },
    });
  },

  // Filtered responses (search + status)
  getFilteredResponses: (surveyId, params = {}) => {
    const ts = Date.now();
    return apiClient.get(`/api/v1/analytics/surveys/${surveyId}/responses/filtered`, {
      params: { ...params, _t: ts },
    });
  },

  /**
   * Export CSV — React Native không dùng <a download>.
   * Trả về URL đầy đủ + token để caller tự xử lý
   * (ví dụ: dùng expo-file-system hoặc react-native-blob-util để tải file).
   */
  exportCSV: async (surveyId, params = {}) => {
    const token = await AsyncStorage.getItem("access_token");
    const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    const baseUrl = apiClient.defaults.baseURL ?? "";
    return {
      url: `${baseUrl}/api/v1/analytics/surveys/${surveyId}/export?${query}`,
      token,
    };
  },
};

export default analyticsService;