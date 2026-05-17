// src/services/mediaService.js
import apiClient from "../api/apiClient";

/**
 * Tạo FormData tương thích React Native.
 * `file` có thể là:
 *   - object từ react-native-image-picker / expo-image-picker:
 *     { uri, type, fileName } hoặc { uri, mimeType, name }
 *   - object từ expo-document-picker:
 *     { uri, mimeType, name }
 */
const buildFormData = (fieldName, file) => {
  const formData = new FormData();
  formData.append(fieldName, {
    uri: file.uri,
    type: file.type ?? file.mimeType ?? "application/octet-stream",
    name: file.fileName ?? file.name ?? "upload",
  });
  return formData;
};

export const mediaService = {
  // Upload question media (image/video)
  uploadQuestionMedia: (file) => {
    const formData = buildFormData("file", file);
    return apiClient.post("/api/v1/media/question-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Upload option media (image/video)
  uploadOptionMedia: (file) => {
    const formData = buildFormData("file", file);
    return apiClient.post("/api/v1/option-media/option-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default mediaService;