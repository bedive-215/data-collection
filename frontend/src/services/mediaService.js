// src/services/mediaService.js
import apiClient from "@/api/apiClient";

const mediaService = {
  // Upload question media (image/video)
  uploadQuestionMedia: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/api/v1/media/question-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res?.data?.data ?? res?.data;
  },

  // Upload option media (image/video)
  uploadOptionMedia: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/api/v1/option-media/option-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res?.data?.data ?? res?.data;
  },
};

export default mediaService;
