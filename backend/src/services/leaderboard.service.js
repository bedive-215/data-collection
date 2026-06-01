import { Op } from "sequelize";
import models from "../models/index.js";
import { WEEKLY_PRIZES } from "../domain/star.domain.js";

import { weekStart, monthStart, getUserStars } from "../helpers/leaderboard.helper.js";

import { PERIOD_FIELD } from "../domain/leaderBoard.domain.js";
import { cache } from "../helpers/cache.helper.js";


class LeaderboardService {
    constructor() {
        this.User           = models.User;
        this.StarTransaction = models.StarTransaction;
        this.DailyCheckin   = models.DailyCheckin;
        this.Survey         = models.Survey;
        this.Response       = models.Response;
        this.Rank           = models.Rank;
    }

    _getPeriodLabel(period) {
        if (period === "WEEKLY")   return `Tuần này (${weekStart().toLocaleDateString("vi-VN")})`;
        if (period === "MONTHLY")  { const n = new Date(); return `Tháng ${n.getMonth() + 1}/${n.getFullYear()}`; }
        if (period === "ALL_TIME") return "Tất cả thời gian";
        return period;
    }

    async _findUsers({ where = {}, period = "WEEKLY", limit }) {
        return this.User.findAll({
            where: { role: "user", ...where },
            attributes: [
                "id", "full_name", "email", "avatar",
                "star_balance", "total_stars_earned", "current_rank",
                "weekly_stars", "monthly_stars", "streak_count", "highest_streak",
            ],
            order: [[PERIOD_FIELD[period], "DESC"]],
            limit,
        });
    }

    async getLeaderboard(period = "WEEKLY", limit = 10) {
        const safeLimit = Number.isFinite(limit) ? limit : 10;
        const normalizedLimit = Math.max(1, Math.min(50, safeLimit));

        const cacheKey = `lb:${period}:top:${normalizedLimit}`;
        const ttlSeconds = period === "ALL_TIME" ? 60 * 60 : 60 * 10;

        return cache.getOrSetJSON({
            key: cacheKey,
            ttlSeconds,
            fetcher: async () => {
                const where = period === "WEEKLY"
                    ? { updated_at: { [Op.gte]: weekStart() } }
                    : {};

                const users = await this._findUsers({ where, period, limit: normalizedLimit });

                return {
                    period,
                    period_label: this._getPeriodLabel(period),
                    updated_at: new Date(),
                    top: users.map((user, i) => ({
                        rank: i + 1,
                        user_id: user.id,
                        full_name: user.full_name,
                        avatar: user.avatar,
                        stars: getUserStars(user, period),
                        current_rank: user.current_rank,
                        streak_count: user.streak_count,
                        weekly_prize: period === "WEEKLY" ? (WEEKLY_PRIZES[i] || null) : null,
                    })),
                };
            }
        });

    }


    async getUserRank(userId, period = "WEEKLY") {
        const cacheKey = `lb:${period}:user_rank:${userId}`;
        const ttlSeconds = period === "ALL_TIME" ? 60 * 60 : 60 * 5;

        return cache.getOrSetJSON({
            key: cacheKey,
            ttlSeconds,
            fetcher: async () => {
                const user = await this.User.findByPk(userId);
                if (!user) throw new Error("User not found");

                const field = PERIOD_FIELD[period];
                const stars = getUserStars(user, period);

                const [ahead, totalUsers] = await Promise.all([
                    this.User.count({ where: { role: "user", [field]: { [Op.gt]: stars } } }),
                    this.User.count({ where: { role: "user" } }),
                ]);

                return {
                    user_id: userId, period,
                    period_label: this._getPeriodLabel(period),
                    rank: ahead + 1,
                    total_users: totalUsers,
                    stars,
                    percentile: Math.round(((totalUsers - ahead) / totalUsers) * 100),
                };
            }
        });

    }


    async getTop5WithPrizes() {
        const cacheKey = `lb:WEEKLY:top5_prizes`;
        const ttlSeconds = 60 * 10;

        return cache.getOrSetJSON({
            key: cacheKey,
            ttlSeconds,
            fetcher: async () => {
                const users = await this._findUsers({ where: { updated_at: { [Op.gte]: weekStart() } }, period: "WEEKLY", limit: 5 });
                return {
                    period: "WEEKLY",
                    period_label: `Tuần này (${weekStart().toLocaleDateString("vi-VN")})`,
                    winners: users.map((user, i) => ({
                        rank: i + 1,
                        user_id: user.id,
                        full_name: user.full_name,
                        avatar: user.avatar,
                        current_rank: user.current_rank,
                        weekly_stars: user.weekly_stars,
                        prize: WEEKLY_PRIZES[i]?.prize || null,
                        is_winner: true,
                    })),
                };
            }
        });
    }


    async getLastWeekWinners() {
        const end = new Date();
        end.setDate(end.getDate() - end.getDay());
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const top5 = await this._findUsers({ period: "WEEKLY", limit: 5 });
        return {
            week_start: start,
            week_end: end,
            winners: top5.map((user, i) => ({
                rank: i + 1,
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                prize: WEEKLY_PRIZES[i]?.prize || null,
            })),
        };
    }

    async getUserComparison(userId) {
        const cacheKey = `lb:${"comparison"}:user:${userId}`;
        const ttlSeconds = 60 * 3;

        return cache.getOrSetJSON({
            key: cacheKey,
            ttlSeconds,
            fetcher: async () => {
                const user = await this.User.findByPk(userId);
                if (!user) throw new Error("User not found");

                const [weekly, monthly, all_time] = await Promise.all([
                    this.getUserRank(userId, "WEEKLY"),
                    this.getUserRank(userId, "MONTHLY"),
                    this.getUserRank(userId, "ALL_TIME"),
                ]);

                return {
                    weekly, monthly, all_time,
                    summary: {
                        weekly_stars: user.weekly_stars,
                        monthly_stars: user.monthly_stars,
                        total_stars: user.total_stars_earned,
                        current_rank: user.current_rank,
                        streak_count: user.streak_count,
                    },
                };
            },
        });
    }


    async updatePeriodicStars(userId, starsEarned) {
        const user = await this.User.findByPk(userId);
        if (!user) return;

        const now  = new Date();
        const wStart = weekStart();
        const mStart = monthStart();
        const updates = {};

        updates.weekly_stars = (!user.weekly_stars_updated_at || user.weekly_stars_updated_at < wStart)
            ? starsEarned : (user.weekly_stars || 0) + starsEarned;
        updates.weekly_stars_updated_at = now;

        updates.monthly_stars = (!user.monthly_stars_updated_at || user.monthly_stars_updated_at < mStart)
            ? starsEarned : (user.monthly_stars || 0) + starsEarned;
        updates.monthly_stars_updated_at = now;

        await user.update(updates);
    }

    async resetWeeklyStars() {
        await this.User.update({ weekly_stars: 0 }, { where: { role: "user" } });
        // Invalidate cache (best-effort: delete known keys)
        await cache.del([
            `lb:WEEKLY:top5_prizes`,
        ]);
        return { success: true, message: "Weekly stars reset" };
    }

    async resetMonthlyStars() {
        await this.User.update({ monthly_stars: 0 }, { where: { role: "user" } });
        // Invalidate cache best-effort
        // Note: cache.del only deletes exact keys; wildcard invalidation is not supported here.
        await cache.del([
            `lb:MONTHLY:top:10`,
            `lb:${"comparison"}:user:${userId}:*`,
        ]);

        return { success: true, message: "Monthly stars reset" };
    }


}

export default new LeaderboardService();