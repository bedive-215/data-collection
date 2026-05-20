// src/services/starService.js
import apiClient from "../api/apiClient";

const starService = {
  getBalance: () => apiClient.get("/api/v1/gamification/balance"),

  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/api/v1/gamification/history?${query}`);
  },

  getRankInfo: () => apiClient.get("/api/v1/gamification/rank-info"),
};

export default starService;
