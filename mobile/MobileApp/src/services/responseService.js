// src/services/responseService.js
import apiClient from "../api/apiClient";

export const responseService = {
  // 🟢 Submit survey (anonymous hoặc user)
  submitSurvey: async (surveyId, payload) => {
    const res = await apiClient.post(
      `/api/v1/responses/${surveyId}/submit`,
      payload
    );
    return res.data;
  },

  // 🟢 Lấy submission của chính mình theo survey
  getMySubmission: async (surveyId) => {
    const res = await apiClient.get(
      `/api/v1/responses/${surveyId}/submissions/me`
    );
    return res.data;
  },

  // 🔴 Admin: lấy submission của 1 user theo survey
  getUserSubmission: async (surveyId, userId) => {
    const res = await apiClient.get(
      `/api/v1/responses/${surveyId}/submission/${userId}`
    );
    return res.data;
  },

  // 🟢 Lấy tất cả response của user hiện tại
  getAllMyResponses: async () => {
    const res = await apiClient.get(`/api/v1/responses`);
    return res.data;
  },

  // 🔴 Admin: lấy tất cả response của 1 user
  getAllUserResponses: async (userId) => {
    const res = await apiClient.get(
      `/api/v1/responses/users/${userId}`
    );
    return res.data;
  },
};

export default responseService;