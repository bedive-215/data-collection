import StarController from "../controllers/star.controller.js";
import DailyCheckinController from "../controllers/dailyCheckin.controller.js";
import AchievementController from "../controllers/achievement.controller.js";
import LeaderboardController from "../controllers/leaderboard.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Router } from "express";

const route = Router();

// ============================================================
// STAR ROUTES
// ============================================================
route.get("/balance", authMiddleware.auth.bind(authMiddleware), StarController.getBalance);
route.get("/history", authMiddleware.auth.bind(authMiddleware), StarController.getTransactionHistory);
route.get("/rank-info", authMiddleware.auth.bind(authMiddleware), StarController.getRankInfo);

// Admin
route.patch(
    "/admin/adjust",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    StarController.adminAdjustStars
);

// ============================================================
// DAILY CHECKIN ROUTES
// ============================================================
route.post(
    "/checkin",
    authMiddleware.auth.bind(authMiddleware),
    DailyCheckinController.checkin
);
route.get(
    "/checkin/status",
    authMiddleware.auth.bind(authMiddleware),
    DailyCheckinController.getCheckinStatus
);
route.get(
    "/checkin/history",
    authMiddleware.auth.bind(authMiddleware),
    DailyCheckinController.getHistory
);
route.get(
    "/checkin/streak",
    authMiddleware.auth.bind(authMiddleware),
    DailyCheckinController.getCurrentStreak
);

// ============================================================
// ACHIEVEMENT ROUTES
// ============================================================
route.get(
    "/achievements",
    authMiddleware.auth.bind(authMiddleware),
    AchievementController.getUserAchievements
);
route.get(
    "/achievements/recent",
    authMiddleware.auth.bind(authMiddleware),
    AchievementController.getRecentUnlocks
);

// Admin - seed achievements
route.post(
    "/achievements/seed",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    AchievementController.seedAchievements
);

// ============================================================
// LEADERBOARD ROUTES
// ============================================================
route.get(
    "/leaderboard",
    authMiddleware.auth.bind(authMiddleware),
    LeaderboardController.getLeaderboard
);
route.get(
    "/leaderboard/my-rank",
    authMiddleware.auth.bind(authMiddleware),
    LeaderboardController.getUserRank
);
route.get(
    "/leaderboard/top5",
    authMiddleware.auth.bind(authMiddleware),
    LeaderboardController.getTop5WithPrizes
);
route.get(
    "/leaderboard/comparison",
    authMiddleware.auth.bind(authMiddleware),
    LeaderboardController.getUserComparison
);

// Admin - reset leaderboard
route.post(
    "/leaderboard/reset/weekly",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    LeaderboardController.adminResetWeekly
);
route.post(
    "/leaderboard/reset/monthly",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    LeaderboardController.adminResetMonthly
);

export default route;
