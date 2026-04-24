// src/services/optionService.js
import apiClient from "@/api/apiClient";

export const optionService = {
  // 🟢 Tạo 1 option
  createOption: (questionId, payload) =>
    apiClient.post(`/api/v1/options/${questionId}`, payload),

  // 🟢 Lấy option theo question
  getOptionsByQuestion: (questionId) =>
    apiClient.get(`/api/v1/options/${questionId}`),

  // 🟡 Update option
  updateOption: (optionId, payload) =>
    apiClient.patch(`/api/v1/options/${optionId}`, payload),

  // 🔴 Xóa option
  deleteOption: (optionId) =>
    apiClient.delete(`/api/v1/options/${optionId}`),

  // 🟣 Bulk tạo option
  bulkCreateOptions: (questionId, payload) =>
    apiClient.post(`/api/v1/options/${questionId}/bulk`, payload),
};

export default optionService;