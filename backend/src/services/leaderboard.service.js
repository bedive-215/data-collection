import { Op, fn, col, literal } from "sequelize";
import models from "../models/index.js";
import { WEEKLY_PRIZES } from "../domain/star.domain.js";

export const LEADERBOARD_PERIODS = {
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    ALL_TIME: "ALL_TIME",
};

class LeaderboardService {
    constructor() {
        this.User = models.User;
        this.StarTransaction = models.StarTransaction;
        this.DailyCheckin = models.DailyCheckin;
        this.Survey = models.Survey;
        this.Response = models.Response;
        this.Rank = models.Rank;
    }

    _getWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return { startOfWeek, endOfWeek };
    }

    _getMonthRange() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startOfMonth, endOfMonth };
    }

    /**
     * Lấy leaderboard theo period
     * @param {string} period - WEEKLY | MONTHLY | ALL_TIME
     * @param {number} limit - số lượng top
     */
    async getLeaderboard(period = "WEEKLY", limit = 10) {
        let whereCondition = {};
        let dateField = "created_at";
        let orderByField = "weekly_stars";

        switch (period) {
            case "WEEKLY": {
                const { startOfWeek } = this._getWeekRange();
                whereCondition = {
                    updated_at: { [Op.gte]: startOfWeek },
                };
                orderByField = "weekly_stars";
                break;
            }
            case "MONTHLY": {
                // Lọc user có monthly_stars > 0 để leaderboard không toàn user 0 sao
                whereCondition = {
                    [Op.or]: [
                        { monthly_stars: { [Op.gt]: 0 } },
                        { monthly_stars: 0 }, // include users with 0 stars too
                    ],
                };
                orderByField = "monthly_stars";
                break;
            }
            case "ALL_TIME":
            default:
                orderByField = "total_stars_earned";
                break;
        }

        const users = await this.User.findAll({
            where: {
                role: "user",
                ...whereCondition,
            },
            attributes: [
                "id",
                "full_name",
                "email",
                "avatar",
                "star_balance",
                "total_stars_earned",
                "current_rank",
                "weekly_stars",
                "monthly_stars",
                "streak_count",
                "highest_streak",
            ],
            order: [[orderByField, "DESC"]],
            limit,
        });

        const topUsers = users.map((user, index) => {
            const stars = period === "ALL_TIME"
                ? user.total_stars_earned
                : period === "MONTHLY"
                    ? user.monthly_stars
                    : user.weekly_stars;

            const prize = index < WEEKLY_PRIZES.length
                ? WEEKLY_PRIZES[index]
                : null;

            return {
                rank: index + 1,
                user_id: user.id,
                full_name: user.full_name,
                avatar: user.avatar,
                stars,
                current_rank: user.current_rank,
                streak_count: user.streak_count,
                weekly_prize: period === "WEEKLY" ? prize : null,
            };
        });

        return {
            period,
            period_label: this._getPeriodLabel(period),
            updated_at: new Date(),
            top: topUsers,
        };
    }

    /**
     * Lấy rank của một user trong leaderboard
     */
    async getUserRank(userId, period = "WEEKLY") {
        let orderByField;
        switch (period) {
            case "MONTHLY": orderByField = "monthly_stars"; break;
            case "ALL_TIME": orderByField = "total_stars_earned"; break;
            default: orderByField = "weekly_stars";
        }

        const user = await this.User.findByPk(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const userStars = period === "ALL_TIME"
            ? user.total_stars_earned
            : period === "MONTHLY"
                ? user.monthly_stars
                : user.weekly_stars;

        // Đếm số người có stars lớn hơn user
        const rank = await this.User.count({
            where: {
                role: "user",
                [orderByField]: { [Op.gt]: userStars },
            },
        });

        const totalUsers = await this.User.count({
            where: { role: "user" },
        });

        return {
            user_id: userId,
            period,
            period_label: this._getPeriodLabel(period),
            rank: rank + 1,
            total_users: totalUsers,
            stars: userStars,
            percentile: Math.round(((totalUsers - rank) / totalUsers) * 100),
        };
    }

    /**
     * Lấy thông tin top 5 và phần thưởng
     */
    async getTop5WithPrizes() {
        const { startOfWeek } = this._getWeekRange();

        const top5 = await this.User.findAll({
            where: {
                role: "user",
                updated_at: { [Op.gte]: startOfWeek },
            },
            attributes: [
                "id", "full_name", "avatar", "current_rank",
                "weekly_stars", "total_stars_earned", "streak_count",
            ],
            order: [["weekly_stars", "DESC"]],
            limit: 5,
        });

        const result = top5.map((user, index) => {
            const prize = WEEKLY_PRIZES[index];
            return {
                rank: index + 1,
                user_id: user.id,
                full_name: user.full_name,
                avatar: user.avatar,
                current_rank: user.current_rank,
                weekly_stars: user.weekly_stars,
                prize: prize ? prize.prize : null,
                is_winner: index < 5,
            };
        });

        return {
            period: "WEEKLY",
            period_label: `Tuần này (${startOfWeek.toLocaleDateString("vi-VN")})`,
            winners: result,
        };
    }

    /**
     * Lấy danh sách người thắng giải tuần trước (cho admin)
     */
    async getLastWeekWinners() {
        const now = new Date();
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - now.getDay());
        lastWeekEnd.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        lastWeekStart.setHours(0, 0, 0, 0);

        const top5 = await this.User.findAll({
            where: {
                role: "user",
            },
            attributes: [
                "id", "full_name", "email", "avatar",
                "current_rank",
            ],
            order: [["weekly_stars", "DESC"]],
            limit: 5,
        });

        return {
            week_start: lastWeekStart,
            week_end: lastWeekEnd,
            winners: top5.map((user, index) => ({
                rank: index + 1,
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                prize: WEEKLY_PRIZES[index]?.prize || null,
            })),
        };
    }

    /**
     * Reset weekly stars (chạy mỗi tuần qua cron)
     */
    async resetWeeklyStars() {
        await this.User.update(
            { weekly_stars: 0 },
            { where: { role: "user" } }
        );
        return { success: true, message: "Weekly stars reset" };
    }

    /**
     * Reset monthly stars (chạy mỗi tháng qua cron)
     */
    async resetMonthlyStars() {
        await this.User.update(
            { monthly_stars: 0 },
            { where: { role: "user" } }
        );
        return { success: true, message: "Monthly stars reset" };
    }

    /**
     * Cập nhật weekly/monthly stars cho user
     */
    async updatePeriodicStars(userId, starsEarned) {
        const user = await this.User.findByPk(userId);
        if (!user) return;

        const updates = {};

        // Always update weekly and monthly
        const now = new Date();
        const { startOfWeek } = this._getWeekRange();
        const { startOfMonth } = this._getMonthRange();

        // Reset weekly if needed
        if (!user.weekly_stars_updated_at || user.weekly_stars_updated_at < startOfWeek) {
            updates.weekly_stars = starsEarned;
            updates.weekly_stars_updated_at = now;
        } else {
            updates.weekly_stars = (user.weekly_stars || 0) + starsEarned;
        }

        // Reset monthly if needed
        if (!user.monthly_stars_updated_at || user.monthly_stars_updated_at < startOfMonth) {
            updates.monthly_stars = starsEarned;
            updates.monthly_stars_updated_at = now;
        } else {
            updates.monthly_stars = (user.monthly_stars || 0) + starsEarned;
        }

        await user.update(updates);
    }

    /**
     * Lấy so sánh rank giữa các period
     */
    async getUserComparison(userId) {
        const user = await this.User.findByPk(userId);
        if (!user) throw new Error("User not found");

        const weeklyRank = await this.getUserRank(userId, "WEEKLY");
        const monthlyRank = await this.getUserRank(userId, "MONTHLY");
        const allTimeRank = await this.getUserRank(userId, "ALL_TIME");

        return {
            weekly: weeklyRank,
            monthly: monthlyRank,
            all_time: allTimeRank,
            summary: {
                weekly_stars: user.weekly_stars,
                monthly_stars: user.monthly_stars,
                total_stars: user.total_stars_earned,
                current_rank: user.current_rank,
                streak_count: user.streak_count,
            },
        };
    }

    _getPeriodLabel(period) {
        switch (period) {
            case "WEEKLY":
                const { startOfWeek } = this._getWeekRange();
                return `Tuần này (${startOfWeek.toLocaleDateString("vi-VN")})`;
            case "MONTHLY":
                const now = new Date();
                return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
            case "ALL_TIME":
                return "Tất cả thời gian";
            default:
                return period;
        }
    }
}

export default new LeaderboardService();
