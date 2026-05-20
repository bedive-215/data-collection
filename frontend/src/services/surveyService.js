import apiClient from "../api/apiClient";

const BASE_URL = "/api/v1/survey";

const surveyService = {

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  createSurvey: (payload) =>
    apiClient.post(BASE_URL, payload),

  // ─────────────────────────────
  // MY SURVEYS
  // ─────────────────────────────
  getMySurveys: (params) =>
    apiClient.get(`${BASE_URL}/me`, { params }),

  // ─────────────────────────────
  // ADMIN - BY USER ID
  // ─────────────────────────────
  getSurveyByUserId: (userId, params) =>
    apiClient.get(`${BASE_URL}/users/${userId}`, { params }),

  // ─────────────────────────────
  // ADMIN - ALL
  // ─────────────────────────────
  getAllSurveys: (params) =>
    apiClient.get(BASE_URL, { params }),

  // ─────────────────────────────
  // PUBLIC
  // ─────────────────────────────
  getPublicSurveys: (params) =>
    apiClient.get(`${BASE_URL}/public`, { params }),

  // ─────────────────────────────
  // DETAIL (UUID FIX IMPORTANT)
  // ─────────────────────────────
  getSurveyById: (surveyId) =>
    apiClient.get(`${BASE_URL}/${surveyId}`),

  getSurveyByAccessToken: (surveyId, accessToken) =>
    apiClient.get(`${BASE_URL}/${surveyId}`, {
      params: { access_token: accessToken },
    }),

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  updateSurvey: (surveyId, payload) =>
    apiClient.put(`${BASE_URL}/${surveyId}`, payload),

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  deleteSurveyById: (surveyId) =>
    apiClient.delete(`${BASE_URL}/${surveyId}`),

  // ─────────────────────────────
  // STATUS CONTROL
  // ─────────────────────────────
  closeSurvey: (surveyId) =>
    apiClient.patch(`${BASE_URL}/${surveyId}/close`),

  publishSurvey: (surveyId, payload = {}) =>
    apiClient.patch(`${BASE_URL}/${surveyId}/publish`, payload),

  // ─────────────────────────────
  // SHARE LINK
  // ─────────────────────────────
  shareSurveyLink: (surveyId) =>
    apiClient.patch(`${BASE_URL}/${surveyId}/share`),

  // ─────────────────────────────
  // INVITE SINGLE
  // ─────────────────────────────
  inviteSurvey: (surveyId, payload) =>
    apiClient.post(`${BASE_URL}/${surveyId}/invite`, payload),

  // ─────────────────────────────
  // INVITE BULK
  // ─────────────────────────────
  bulkInviteSurvey: (surveyId, payload) =>
    apiClient.post(`${BASE_URL}/${surveyId}/invite/bulk`, payload),

  // ─────────────────────────────
  // PARTICIPANTS
  // ─────────────────────────────
  getParticipants: (surveyId, params = {}) =>
    apiClient.get(`${BASE_URL}/${surveyId}/participants`, { params }),

  deleteParticipant: (surveyId, pid) =>
    apiClient.delete(`${BASE_URL}/${surveyId}/participants/${pid}`),

  // ─────────────────────────────
  // SECTIONS (PAGES)
  // ─────────────────────────────
  // Mounted at /api/v1/sections → GET/POST /api/v1/sections/surveys/:survey_id/sections
  getSections: (surveyId) =>
    apiClient.get(`/api/v1/sections/surveys/${surveyId}/sections`),

  createSection: (surveyId, payload) =>
    apiClient.post(`/api/v1/sections/surveys/${surveyId}/sections`, payload),

  updateSection: (sectionId, payload) =>
    apiClient.patch(`/api/v1/sections/${sectionId}`, payload),

  deleteSection: (sectionId) =>
    apiClient.delete(`/api/v1/sections/${sectionId}`),

  reorderSections: (surveyId, sections) =>
    apiClient.patch(`/api/v1/sections/surveys/${surveyId}/sections/reorder`, { sections }),

  bulkCreateSections: (surveyId, sections) =>
    apiClient.post(`/api/v1/sections/surveys/${surveyId}/sections/bulk`, { sections }),

  // ─────────────────────────────
  // MEDIA UPLOAD
  // ─────────────────────────────
  uploadQuestionMedia: (formData) =>
    apiClient.post("/api/v1/media/question-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

};

export default surveyService;