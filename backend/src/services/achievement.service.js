import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { mapAchievement } from "../mappers/achivement.mapper.js";
import { evaluateCondition } from "../helpers/evaluateCondition.helper.js";
import { withTransaction } from "../utils/transaction.js";

import { ACHIEVEMENTS_DEF, ACHIEVEMENT_CATEGORY_ORDER } from "../domain/achivement.domain.js";

import starService from "./star.service.js";

import eventBus from "../events/eventBus.js";
import { ACHIEVEMENT_EVENTS } from "../events/achivenent/achivement.event.js";
import { STAR_EVENTS } from "../events/star/star.event.js";

class AchievementService {
    constructor() {
        const { User, Achievement, UserAchievement, Survey, Response, StarTransaction, sequelize } = models;
        Object.assign(this, { User, Achievement, UserAchievement, Survey, Response, StarTransaction, sequelize });
    }

    async seedAchievements() {
        const achievements = Object.values(ACHIEVEMENTS_DEF);
        const results = await Promise.all(
            achievements.map(ach =>
                this.Achievement.findOrCreate({
                    where: { code: ach.code },
                    defaults: { ...ach, is_active: true },
                }).then(([, created]) => ({ code: ach.code, created }))
            )
        );
        return results;
    }

    async checkAndUnlock(userId, trigger, data = {}, options = {}) {
        return withTransaction(this.sequelize, options.externalTransaction, async (transaction) => {
            const user = await this.User.findByPk(userId, { transaction });
            if (!user) throw new AppError("User not found", 404);

            const allAchievements = await this.Achievement.findAll({
                where: { is_active: true },
                include: [{
                    model: this.UserAchievement,
                    as: "user_achievements",
                    where: { user_id: userId },
                    required: false,
                }],
            });

            const lockedAchievements = allAchievements.filter(a => !a.user_achievements?.length);
            if (!lockedAchievements.length) return { unlocked: [], count: 0 };

            const [surveyCount, responseCount] = await Promise.all([
                this.Survey.count({ where: { created_by: userId } }),
                this.Response.count({ where: { user_id: userId, status: "COMPLETED" } }),
            ]);

            const unlockedAchievements = [];

            for (const achievement of lockedAchievements) {
                const { shouldUnlock, progress } = this._evaluateCondition(achievement, {
                    surveyCount,
                    responseCount,
                    starBalance: user.total_stars_earned || 0,
                    streakCount: user.streak_count || 0,
                    data,
                });

                if (!shouldUnlock) continue;

                await this.UserAchievement.create({
                    user_id: userId,
                    achievement_id: achievement.id,
                    progress,
                    is_unlocked: true,
                    unlocked_at: new Date(),
                    notification_sent: false,
                }, { transaction });

                unlockedAchievements.push(this._mapAchievement(achievement));
            }

            if (!unlockedAchievements.length) return { unlocked: [], count: 0 };

            // Cộng tổng sao 1 lần sau khi xác định hết achievements
            const totalStarReward = unlockedAchievements.reduce((sum, a) => sum + a.star_reward, 0);
            await starService.addStars(
                userId,
                totalStarReward,
                "ACHIEVEMENT_REWARD",
                `Mở khóa ${unlockedAchievements.length} huy hiệu`,
                { achievements: unlockedAchievements.map(a => a.code) },
                { externalTransaction: transaction }
            );

            unlockedAchievements.forEach(achievement =>
                eventBus.emit(ACHIEVEMENT_EVENTS.NOTIFY_UNLOCKED, { userId, achievement })
            );

            return { unlocked: unlockedAchievements, count: unlockedAchievements.length };
        });
    }

    async getUserAchievements(userId) {
        const user = await this.User.findByPk(userId);
        if (!user) throw new AppError("User not found", 404);

        const [allAchievements, userAchievements] = await Promise.all([
            this.Achievement.findAll({
                where: { is_active: true },
                order: [["category", "ASC"], ["condition_value", "ASC"]],
            }),
            this.UserAchievement.findAll({
                where: { user_id: userId },
                attributes: ["achievement_id", "progress", "is_unlocked", "unlocked_at"],
            }),
        ]);

        const progressMap = Object.fromEntries(
            userAchievements.map(ua => [ua.achievement_id, ua])
        );

        const result = Object.fromEntries(ACHIEVEMENT_CATEGORY_ORDER.map(cat => [cat, []]));

        for (const ach of allAchievements) {
            const ua = progressMap[ach.id];
            const progress = ua?.progress || 0;

            result[ach.category].push({
                ...mapAchievement(ach),
                condition_value: ach.condition_value,
                is_unlocked: ua?.is_unlocked || false,
                progress,
                progress_percent: Math.min(100, Math.floor((progress / ach.condition_value) * 100)),
                unlocked_at: ua?.unlocked_at || null,
            });
        }

        return {
            categories: result,
            total_unlocked: userAchievements.filter(ua => ua.is_unlocked).length,
            total_achievements: allAchievements.length,
        };
    }

    async getRecentUnlocks(userId, limit = 5) {
        const recent = await this.UserAchievement.findAll({
            where: { user_id: userId, is_unlocked: true },
            include: [{ model: this.Achievement, as: "achievement" }],
            order: [["unlocked_at", "DESC"]],
            limit,
        });

        return recent.map(ua => ({
            id: ua.id,
            ...mapAchievement(ua.achievement),
            unlocked_at: ua.unlocked_at,
        }));
    }
}

export default new AchievementService();