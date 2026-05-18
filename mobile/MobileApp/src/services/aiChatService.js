// src/services/aiChatService.js
import apiClient from "../api/apiClient";

export const chatWithAI = (message, history = []) =>
  apiClient.post("/api/v1/ai/chat", { message, history });

export default { chatWithAI };
