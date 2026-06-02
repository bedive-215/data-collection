import models from "#models/index.js";
import { AppError } from "#middlewares/handleException.middlware.js";

import { STAR_REWARDS, RANK_CONFIG } from "#domain/star.domain.js";
import { getRankFromStars, getRankProgress } from "#helpers/star.helper.js";

import { withTransaction } from "#utils/transaction.js";

import { mapTransaction } from "#mappers/star.mapper.js";

import eventBus from "#events/eventBus.js";
import { STAR_EVENTS } from "#events/star/star.event.js";

class StarService {
    constructor() {
        const { User, StarTransaction, sequelize } = models;
        Object.assign(this, { User, StarTransaction, sequelize });
    }

    // core add/ deduct stars
    async _adjustStars(userId, amount, type, description, metadata = {}, options = {}) {
        const { refId = null, refType = null, externalTransaction = null } = options;

        return withTransaction(this.sequelize, externalTransaction, async (transaction) => {
            const user = await this.User.findByPk(userId, {
                lock: transaction.LOCK.UPDATE,
                transaction,
            });
            if (!user) throw new AppError("User not found", 404);

            const balanceAfter = Math.max(0, (user.star_balance || 0) + amount);
            const totalEarnedAfter = amount > 0
                ? (user.total_stars_earned || 0) + amount
                : Math.max(0, (user.total_stars_earned || 0) + amount); // deduct dùng amount âm

            await user.update({ star_balance: balanceAfter, total_stars_earned: totalEarnedAfter }, { transaction });

            const tx = await this.StarTransaction.create({
                user_id: userId,
                amount,
                type,
                description,
                metadata,
                balance_after: balanceAfter,
                ref_id: refId,
                ref_type: refType,
            }, { transaction });

            const newRank = getRankFromStars(totalEarnedAfter);
            const rankChanged = newRank.name !== user.current_rank;
            if (rankChanged) await user.update({ current_rank: newRank.name }, { transaction });

            // Side effects sau commit
            if (amount > 0) {
                eventBus.emit(STAR_EVENTS.PERIODIC_UPDATE, { userId, amount });

                eventBus.emit(STAR_EVENTS.EARNED, {
                    userId, amount, type, description, balanceAfter,
                    multiplier: metadata?.multiplier || 1,
                });

                if (rankChanged) {
                    eventBus.emit(STAR_EVENTS.RANK_UP, {
                        userId,
                        oldRank: user.current_rank,
                        newRank: newRank.name,
                        starsNeeded: 0,
                        totalStars: totalEarnedAfter,
                    });
                }
            } else {
                eventBus.emit(STAR_EVENTS.PENALTY, { 
                    userId,
                    type: "STAR_PENALTY",
                    title: `⚠️ ${amount} sao`,
                    message: `${description} | Số dư: ${balanceAfter} sao`,
                    data: { amount, balance_after: balanceAfter, description },
                });
            }

            return {
                transaction_id: tx.id,
                amount_changed: amount,
                balance_after: balanceAfter,
                total_stars: totalEarnedAfter,
                current_rank: newRank.name,
                rank_changed: rankChanged,
                old_rank: user.current_rank,
                new_rank: newRank.name,
            };
        });
    }

    async addStars(userId, amount, type, description = "", metadata = {}, options = {}) {
        return this._adjustStars(userId, Math.abs(amount), type, description, metadata, options);
    }

    async deductStars(userId, amount, type, description, metadata = {}, options = {}) {
        return this._adjustStars(userId, -Math.abs(amount), type, description, metadata, options);
    }

    // reverse transaction
    async reverseTransaction(transactionId, reason = "Reversed", externalTransaction = null) {
        const originalTx = await this.StarTransaction.findByPk(transactionId);
        if (!originalTx) throw new AppError("Transaction not found", 404);
        if (originalTx.is_reversed) throw new AppError("Transaction already reversed", 400);

        return withTransaction(this.sequelize, externalTransaction, async (transaction) => {
            if (originalTx.amount > 0) {
                const user = await this.User.findByPk(originalTx.user_id, {
                    lock: transaction.LOCK.UPDATE,
                    transaction,
                });
                await user.update({
                    star_balance: Math.max(0, user.star_balance - originalTx.amount),
                    total_stars_earned: Math.max(0, user.total_stars_earned - originalTx.amount),
                }, { transaction });
            }

            await originalTx.update({ is_reversed: true }, { transaction });
            return { success: true, message: "Transaction reversed" };
        });
    }


    async handleStartSurvey(userId, surveyId) {
        return this.addStars(
            userId, STAR_REWARDS.CREATE_SURVEY, "CREATE_SURVEY",
            "Tạo khảo sát mới",
            { survey_id: surveyId },
            { refId: surveyId, refType: "survey" }
        );
    }

    async handleStartSurveyDeleted(userId, surveyId) {
        return this.deductStars(
            userId, STAR_REWARDS.SURVEY_CANCELLED_PENALTY, "PENALTY",
            "Thu hồi sao do khảo sát bị xóa",
            { survey_id: surveyId },
            { refId: surveyId, refType: "survey" }
        );
    }

    async rewardSubmitSurvey(userId, surveyId, responseId) {
        const completedCount = await models.Response.count({
            where: { survey_id: surveyId, status: "COMPLETED" },
        });

        const RESPONDER_REWARDS = [
            { stars: STAR_REWARDS.FIRST_RESPONDER, type: "FIRST_RESPONDER", desc: "Người tham gia đầu tiên - Phần thưởng đặc biệt!" },
            { stars: STAR_REWARDS.SECOND_RESPONDER, type: "SECOND_RESPONDER", desc: "Người tham gia thứ 2 - Rất nhanh!" },
            { stars: STAR_REWARDS.THIRD_RESPONDER, type: "THIRD_RESPONDER", desc: "Người tham gia thứ 3" },
        ];

        const reward = RESPONDER_REWARDS[completedCount - 1] || {
            stars: STAR_REWARDS.LATER_RESPONDER,
            type: "LATER_RESPONDER",
            desc: `Người tham gia thứ ${completedCount}`,
        };

        const result = await this.addStars(
            userId, reward.stars, reward.type, reward.desc,
            { survey_id: surveyId, order: completedCount },
            { refId: responseId, refType: "response" }
        );

        return { ...result, order: completedCount, reward_type: reward.type };
    }

    async rewardCreatorForRespondent(creatorId, surveyId, responderUserId) {
        return this.addStars(
            creatorId, STAR_REWARDS.CREATOR_BONUS_PER_RESPONDENT, "SURVEY_CREATOR_BONUS",
            "Có người tham gia khảo sát của bạn",
            { survey_id: surveyId, responder_user_id: responderUserId },
            { refId: surveyId, refType: "survey" }
        );
    }

    async rewardDailyCheckin(userId, streakCount, multiplier) {
        const stars = Math.floor(STAR_REWARDS.DAILY_CHECKIN_BASE * multiplier);
        const isStreak = streakCount >= 7;
        return this.addStars(
            userId, stars,
            isStreak ? "STREAK_BONUS" : "DAILY_CHECKIN",
            isStreak ? `Điểm danh liên tiếp ${streakCount} ngày - Bonus x${multiplier}!` : `Điểm danh ngày ${streakCount}`,
            { streak_count: streakCount, multiplier }
        );
    }

    async rewardAchievement(userId, achievementCode, starReward) {
        return this.addStars(
            userId, starReward, "ACHIEVEMENT_REWARD",
            `Mở khóa huy hiệu: ${achievementCode}`,
            { achievement_code: achievementCode }
        );
    }

    async adminAdjustStars(userId, amount, reason, adminId) {
        if (amount === 0) throw new AppError("Amount cannot be zero", 400);
        return this.addStars(
            userId, amount, "ADMIN_ADJUST",
            `[Admin ${adminId}] ${reason}`,
            { admin_id: adminId, reason }
        );
    }


    async getBalance(userId) {
        const user = await this.User.findByPk(userId);
        if (!user) throw new AppError("User not found", 404);

        const totalStars = user.total_stars_earned || 0;
        const { rank, nextRank, progress, starsNeeded } = getRankProgress(totalStars);

        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const lastDate = user.last_checkin_date
            ? new Date(user.last_checkin_date).toISOString().split("T")[0]
            : null;
        const isStreakActive = lastDate === today || lastDate === yesterdayStr;

        const recentTransactions = await this.StarTransaction.findAll({
            where: { user_id: userId, is_reversed: false },
            order: [["created_at", "DESC"]],
            limit: 10,
        });

        return {
            user_id: user.id,
            star_balance: user.star_balance,
            total_stars_earned: totalStars,
            weekly_stars: user.weekly_stars || 0,
            monthly_stars: user.monthly_stars || 0,
            current_rank: user.current_rank,
            rank_info: { ...rank, next: nextRank, progress_to_next: progress, stars_needed: starsNeeded },
            streak_count: user.streak_count,
            active_streak: isStreakActive ? user.streak_count : 0,
            highest_streak: user.highest_streak,
            last_checkin_date: user.last_checkin_date,
            recent_transactions: recentTransactions.map(mapTransaction),
        };
    }

    async getTransactionHistory(userId, { page = 1, limit = 20, type = null } = {}) {
        const where = { user_id: userId, is_reversed: false };
        if (type) where.type = type;

        const { count, rows } = await this.StarTransaction.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit,
            order: [["created_at", "DESC"]],
        });

        return {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            transactions: rows.map(tx => ({
                ...mapTransaction(tx),
                balance_after: tx.balance_after,
                ref_id: tx.ref_id,
                ref_type: tx.ref_type,
            })),
        };
    }

    getRankInfo(totalStars) {
        const { rank, nextRank, progress, starsNeeded } = getRankProgress(totalStars);
        return { current: rank, next: nextRank, progress_to_next: progress, stars_needed: starsNeeded };
    }
}

export default new StarService();