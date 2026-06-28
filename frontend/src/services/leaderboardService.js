// src/services/leaderboardService.js
import apiClient from "@/api/apiClient";

export const LEADERBOARD_PERIODS = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  ALL_TIME: "ALL_TIME",
};

export const leaderboardService = {
  getLeaderboard: (period = "WEEKLY", limit = 10) =>
    apiClient.get(
      `/api/v1/gamification/leaderboar?period=${period}&limit=${limit}`
    ),

  getUserRank: (period = "WEEKLY") =>
    apiClient.get(
      `/api/v1/gamification/leaderboard/my-rank?period=${period}`
    ),

  getTop5WithPrizes: () =>
    apiClient.get("/api/v1/gamification/leaderboard/top5"),

  getComparison: () =>
    apiClient.get("/api/v1/gamification/leaderboard/comparison"),
};

export default leaderboardService;
