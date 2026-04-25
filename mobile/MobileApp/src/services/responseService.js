// src/services/responseService.js
import apiClient from "../api/apiClient";

export const responseService = {
  // 🟢 Submit survey
  submitSurvey: async (surveyId, payload) => {
    const res = await apiClient.post(
      `/api/v1/responses/surveys/${surveyId}`,
      payload
    );
    return res.data;
  },

  // 🟢 Lấy response của chính mình trong survey
  getMySubmission: async (surveyId) => {
    const res = await apiClient.get(
      `/api/v1/responses/${surveyId}/me`
    );
    return res.data;
  },

  // 🔴 Admin: lấy response của 1 user trong survey
  getUserSubmission: async (surveyId, userId) => {
    const res = await apiClient.get(
      `/api/v1/responses/admin/surveys/${surveyId}/users/${userId}`
    );
    return res.data;
  },

  // 🟢 Lấy tất cả response của mình
  getAllMyResponses: async () => {
    const res = await apiClient.get(
      `/api/v1/responses/me`
    );
    return res.data;
  },

  // 🔴 Admin: lấy tất cả response của 1 user
  getAllUserResponses: async (userId) => {
    const res = await apiClient.get(
      `/api/v1/responses/admin/users/${userId}`
    );
    return res.data;
  },
};

export default responseService;