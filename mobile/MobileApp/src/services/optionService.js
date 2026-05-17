// src/services/optionService.js
import apiClient from "../api/apiClient";

const optionService = {
  // Tạo 1 option
  createOption: (questionId, surveyId, payload) =>
    apiClient.post(
      `/api/v1/options/questions/${questionId}/survey/${surveyId}`,
      payload
    ),

  // Lấy option theo question
  getOptionsByQuestion: (questionId, surveyId) =>
    apiClient.get(
      `/api/v1/options/questions/${questionId}/survey/${surveyId}`
    ),

  // Update option
  updateOption: (optionId, surveyId, payload) =>
    apiClient.patch(
      `/api/v1/options/${optionId}/survey/${surveyId}`,
      payload
    ),

  // Xóa option
  deleteOption: (optionId, surveyId) =>
    apiClient.delete(
      `/api/v1/options/${optionId}/survey/${surveyId}`
    ),

  // Bulk tạo option
  bulkCreateOptions: (questionId, surveyId, payload) =>
    apiClient.post(
      `/api/v1/options/questions/${questionId}/survey/${surveyId}/bulk`,
      payload
    ),
};

export default optionService;