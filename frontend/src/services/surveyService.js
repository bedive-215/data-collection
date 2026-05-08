import apiClient from "../api/apiClient";

const BASE_URL = "/api/v1/survey";

const surveyService = {
  // CREATE
  createSurvey: (payload) =>
    apiClient.post(BASE_URL, payload),

  // GET MY SURVEYS
  getMySurveys: (params) =>
    apiClient.get(`${BASE_URL}/me`, { params }),

  // GET SURVEYS BY USER ID (ADMIN)
  getSurveyByUserId: (userId, params) =>
    apiClient.get(`${BASE_URL}/users/${userId}`, { params }),

  // GET ALL SURVEYS (ADMIN)
  getAllSurveys: (params) =>
    apiClient.get(BASE_URL, { params }),

  // GET PUBLIC SURVEYS
  getPublicSurveys: (params) =>
    apiClient.get(`${BASE_URL}/public`, { params }),

  // GET SURVEY DETAIL
  getSurveyById: (surveyId) =>
    apiClient.get(`${BASE_URL}/${surveyId}`),

  // GET SURVEY DETAIL WITH ACCESS TOKEN
  getSurveyByAccessToken: (surveyId, accessToken) =>
    apiClient.get(
      `${BASE_URL}/${surveyId}?access_token=${accessToken}`
    ),

  // UPDATE SURVEY
  updateSurvey: (surveyId, payload) =>
    apiClient.put(`${BASE_URL}/${surveyId}`, payload),

  // DELETE SURVEY
  deleteSurveyById: (surveyId) =>
    apiClient.delete(`${BASE_URL}/${surveyId}`),

  // CLOSE SURVEY
  closeSurvey: (surveyId) =>
    apiClient.patch(`${BASE_URL}/${surveyId}/close`),

  // PUBLISH / UNPUBLISH SURVEY
  publishSurvey: (surveyId, payload) =>
    apiClient.patch(
      `${BASE_URL}/${surveyId}/publish`,
      payload
    ),

  // CREATE SHARE LINK
  shareSurveyLink: (surveyId) =>
    apiClient.patch(`${BASE_URL}/${surveyId}/share`),

  // INVITE USER
  inviteSurvey: (surveyId, payload) =>
    apiClient.post(
      `${BASE_URL}/${surveyId}/invite`,
      payload
    ),
};

export default surveyService;