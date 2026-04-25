import apiClient from "../api/apiClient";

const surveyService = {
  createSurvey:      (payload)            => apiClient.post("/api/v1/survey", payload),
  getSurveyById:     (surveyId)           => apiClient.get(`/api/v1/survey/${surveyId}`),
  getSurveyByUserId: (userId)             => apiClient.get(`/api/v1/survey/users/${userId}`),
  getAllSurveys:      (params)             => apiClient.get("/api/v1/survey", { params }),
  deleteSurveyById:  (surveyId)           => apiClient.delete(`/api/v1/survey/${surveyId}`),
  updateSurvey:      (surveyId, payload)  => apiClient.put(`/api/v1/survey/${surveyId}`, payload),
};

export default surveyService;