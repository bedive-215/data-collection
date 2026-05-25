import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { mapAchievement } from "../mappers/achivement.mapper.js";
import { evaluateCondition } from "../helpers/evaluateCondition.js";

import { ACHIEVEMENTS_DEF, ACHIEVEMENT_CATEGORY_ORDER } from "../domain/achivement.domain.js";

import starService from "./star.service.js";

import eventBus from "../events/eventBus.js";
import { ACHIEVEMENT_EVENTS } from "../events/achivenent/achivement.event.js";
import { START_EVENTS } from "../events/start/start.event.js";

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
        const { externalTransaction = null } = options;
        const isOwnTransaction = !externalTransaction;
        const transaction = externalTransaction || await this.sequelize.transaction();

        try {
            const user = await this.User.findByPk(userId, { transaction });
            if (!user) throw new AppError("User not found", 404);

            // Lấy tất cả achievements chưa unlock của user
            const allAchievements = await this.Achievement.findAll({
                where: { is_active: true },
                include: [{
                    model: this.UserAchievement,
                    as: "user_achievements",
                    where: { user_id: userId },
                    required: false,
                }],
            });

            const lockedAchievements = allAchievements.filter(
                a => !a.user_achievements?.length
            );

            if (!lockedAchievements.length) {
                if (isOwnTransaction) await transaction.commit();
                return { unlocked: [], count: 0 };
            }

            // Pre-fetch counts 1 lần thay vì query trong loop
            const [surveyCount, responseCount] = await Promise.all([
                this.Survey.count({ where: { created_by: userId } }),
                this.Response.count({ where: { user_id: userId, status: "COMPLETED" } }),
            ]);

            const starBalance = user.total_stars_earned || 0;
            const streakCount = user.streak_count || 0;

            const unlockedAchievements = [];

            for (const achievement of lockedAchievements) {
                const { shouldUnlock, progress } = evaluateCondition(achievement, {
                    surveyCount,
                    responseCount,
                    starBalance,
                    streakCount,
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

                await starService.addStars(
                    userId,
                    achievement.star_reward,
                    "ACHIEVEMENT_REWARD",
                    `Mở khóa huy hiệu: ${achievement.name}`,
                    { achievement_code: achievement.code, achievement_id: achievement.id },
                    { externalTransaction: transaction },
                );

                eventBus.emit(ACHIEVEMENT_EVENTS.NOTIFY_UNLOCKED, {
                    userId,
                    achievement: this._mapAchievement(achievement),
                });

                unlockedAchievements.push(mapAchievement(achievement));
            }

            if (isOwnTransaction) await transaction.commit();

            return { unlocked: unlockedAchievements, count: unlockedAchievements.length };

        } catch (err) {
            if (isOwnTransaction) await transaction.rollback();
            throw err;
        }
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