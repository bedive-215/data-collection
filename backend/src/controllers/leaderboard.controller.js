import leaderboardService from "../services/leaderboard.service.js";
import { LEADERBOARD_PERIODS } from "../services/leaderboard.service.js";

class LeaderboardController {
    async getLeaderboard(req, res, next) {
        try {
            const { period = "WEEKLY", limit = 10 } = req.query;

            if (!Object.values(LEADERBOARD_PERIODS).includes(period)) {
                return res.status(400).json({
                    status: "error",
                    message: `Invalid period. Must be one of: ${Object.values(LEADERBOARD_PERIODS).join(", ")}`,
                });
            }

            const result = await leaderboardService.getLeaderboard(
                period,
                parseInt(limit)
            );

            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getUserRank(req, res, next) {
        try {
            const { period = "WEEKLY" } = req.query;

            if (!Object.values(LEADERBOARD_PERIODS).includes(period)) {
                return res.status(400).json({
                    status: "error",
                    message: `Invalid period.`,
                });
            }

            const result = await leaderboardService.getUserRank(req.user.id, period);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getTop5WithPrizes(req, res, next) {
        try {
            const result = await leaderboardService.getTop5WithPrizes();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getUserComparison(req, res, next) {
        try {
            const result = await leaderboardService.getUserComparison(req.user.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async adminResetWeekly(req, res, next) {
        try {
            if (req.user.role !== "admin") {
                return res.status(403).json({ status: "error", message: "Admin only" });
            }
            const result = await leaderboardService.resetWeeklyStars();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async adminResetMonthly(req, res, next) {
        try {
            if (req.user.role !== "admin") {
                return res.status(403).json({ status: "error", message: "Admin only" });
            }
            const result = await leaderboardService.resetMonthlyStars();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new LeaderboardController();
