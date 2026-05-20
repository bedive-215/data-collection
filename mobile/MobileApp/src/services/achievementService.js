// src/services/achievementService.js
import apiClient from "../api/apiClient";

const achievementService = {
  getUserAchievements: () =>
    apiClient.get("/api/v1/gamification/achievements"),

  getRecentUnlocks: (limit = 5) =>
    apiClient.get(`/api/v1/gamification/achievements/recent?limit=${limit}`),
};

export default achievementService;
