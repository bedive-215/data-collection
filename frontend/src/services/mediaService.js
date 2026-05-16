// src/services/mediaService.js
import apiClient from "@/api/apiClient";

export const mediaService = {
  // Upload question media (image/video)
  uploadQuestionMedia: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/media/question-media", formData);
  },

  // Upload option media (image/video)
  uploadOptionMedia: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/option-media", formData);
  },
};

export default mediaService;
