// src/services/checkinService.js
import apiClient from "../api/apiClient";

const checkinService = {
  checkin: () => apiClient.post("/api/v1/gamification/checkin"),

  getStatus: () => apiClient.get("/api/v1/gamification/checkin/status"),

  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/api/v1/gamification/checkin/history?${query}`);
  },

  getStreak: () => apiClient.get("/api/v1/gamification/checkin/streak"),
};

export default checkinService;
