import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import notificationService from "./notification.service.js";
import leaderboardService from "./leaderboard.service.js";

// ============================================================
// STAR REWARD CONFIG
// ============================================================
export const STAR_REWARDS = {
    // Điểm danh hằng ngày
    DAILY_CHECKIN_BASE: 50,
    DAILY_CHECKIN_MAX: 70,

    // Tạo khảo sát
    CREATE_SURVEY: 50,

    // Người tham gia khảo sát
    FIRST_RESPONDER: 100,
    SECOND_RESPONDER: 50,
    THIRD_RESPONDER: 30,
    LATER_RESPONDER: 20,

    // Người tạo được bonus khi có người tham gia
    CREATOR_BONUS_PER_RESPONDENT: 10,

    // Streak
    STREAK_BONUS_MULTIPLIER: 0.5, // +50% mỗi streak
    STREAK_MAX_MULTIPLIER: 2.0,

    // Referral
    REFERRAL_BONUS: 30,

    // Achievement
    ACHIEVEMENT_BASE_REWARD: 20,

    // Penalty
    SURVEY_CANCELLED_PENALTY: 30,
    ACCOUNT_VIOLATION_PENALTY: 100,
};

// ============================================================
// RANK CONFIG
// ============================================================
export const RANK_CONFIG = [
    { name: "BRONZE", minStars: 0,    maxStars: 499,    color: "#CD7F32", bonusMultiplier: 1.0,  icon: "🥉" },
    { name: "SILVER", minStars: 500,   maxStars: 1999,   color: "#C0C0C0", bonusMultiplier: 1.1,  icon: "🥈" },
    { name: "GOLD",   minStars: 2000,  maxStars: 4999,   color: "#FFD700", bonusMultiplier: 1.2,  icon: "🥇" },
    { name: "PLATINUM", minStars: 5000, maxStars: 9999,  color: "#E5E4E2", bonusMultiplier: 1.3,  icon: "💎" },
    { name: "DIAMOND", minStars: 10000, maxStars: null,  color: "#B9F2FF", bonusMultiplier: 1.5,  icon: "💠" },
];

// ============================================================
// PRIZE CONFIG (Top 5 Weekly)
// ============================================================
export const WEEKLY_PRIZES = [
    { rank: 1, prize: "Thẻ điện thoại 500.000đ", stars: null },
    { rank: 2, prize: "Thẻ điện thoại 300.000đ", stars: null },
    { rank: 3, prize: "Thẻ điện thoại 150.000đ", stars: null },
    { rank: 4, prize: "Thẻ điện thoại 70.000đ",  stars: null },
    { rank: 5, prize: "Thẻ điện thoại 30.000đ",  stars: null },
];

// ============================================================
// LEADERBOARD PERIOD CONFIG
// ============================================================
export const LEADERBOARD_PERIODS = {
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    ALL_TIME: "ALL_TIME",
};

class StarService {
    constructor() {
        this.User = models.User;
        this.StarTransaction = models.StarTransaction;
        this.sequelize = models.sequelize;
    }

    /**
     * Tính multiplier cho streak
     * streak_count = 1-3: multiplier = 1.0
     * streak_count = 4-6: multiplier = 1.5
     * streak_count = 7+: multiplier = 2.0
     */
    _calculateStreakMultiplier(streakCount) {
        if (streakCount >= 7) return 2.0;
        if (streakCount >= 4) return 1.5;
        return 1.0;
    }

    /**
     * Xác định rank dựa trên tổng sao
     */
    _getRankFromStars(totalStars) {
        for (let i = RANK_CONFIG.length - 1; i >= 0; i--) {
            if (totalStars >= RANK_CONFIG[i].minStars) {
                return RANK_CONFIG[i];
            }
        }
        return RANK_CONFIG[0];
    }

    /**
     * Lấy số sao base cho điểm danh (có streak bonus)
     */
    _getCheckinStars(streakCount) {
        const base = STAR_REWARDS.DAILY_CHECKIN_BASE;
        const multiplier = this._calculateStreakMultiplier(streakCount);
        return Math.floor(base * multiplier);
    }

    /**
     * CORE: Cộng sao cho user
     * @param {string} userId
     * @param {number} amount - số sao (+/-)
     * @param {string} type - loại giao dịch
     * @param {string} description
     * @param {object} metadata
     * @param {object} options
     */
    async addStars(userId, amount, type, description = "", metadata = {}, options = {}) {
        const { refId = null, refType = null, externalTransaction = null } = options;

        const isOwnTransaction = !externalTransaction;
        const transaction = externalTransaction || await this.sequelize.transaction();

        try {
            // Lock row để tránh race condition
            const user = await this.User.findByPk(userId, {
                lock: transaction.LOCK.UPDATE,
                transaction,
            });

            if (!user) {
                if (isOwnTransaction) await transaction.rollback();
                throw new AppError("User not found", 404);
            }

            const balanceAfter = Math.max(0, (user.star_balance || 0) + amount);
            const totalEarnedAfter = amount > 0
                ? (user.total_stars_earned || 0) + amount
                : user.total_stars_earned;

            // Cập nhật user
            await user.update({
                star_balance: balanceAfter,
                total_stars_earned: totalEarnedAfter,
            }, { transaction });

            // Ghi transaction log
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

            if (isOwnTransaction) {
                await transaction.commit();
            }

            // Sync weekly/monthly stars for leaderboard
            if (amount > 0) {
                leaderboardService.updatePeriodicStars(userId, amount)
                    .catch(err => console.error("updatePeriodicStars error:", err));
            }

            // Trả về kết quả kèm thông tin rank mới
            const newRank = this._getRankFromStars(totalEarnedAfter);
            const oldRank = user.current_rank;
            const rankChanged = newRank.name !== oldRank;

            if (rankChanged) {
                await user.update({ current_rank: newRank.name }, { transaction });
            }

            // Gửi notification cho người nhận sao (chỉ khi là cộng sao)
            if (amount > 0) {
                const multiplier = metadata?.multiplier || 1;
                notificationService.notifyStarEarned({
                    userId,
                    amount,
                    type,
                    description,
                    balanceAfter,
                    multiplier,
                }).catch(err => console.error("notifyStarEarned error:", err));

                // Nếu rank thay đổi → gửi notification thăng rank
                if (rankChanged) {
                    notificationService.notifyRankUp({
                        userId,
                        oldRank,
                        newRank: newRank.name,
                        starsNeeded: 0,
                        totalStars: totalEarnedAfter,
                    }).catch(err => console.error("notifyRankUp error:", err));
                }
            }

            return {
                transaction_id: tx.id,
                amount_added: amount,
                balance_after: balanceAfter,
                total_stars: totalEarnedAfter,
                current_rank: newRank.name,
                rank_changed: rankChanged,
                old_rank: oldRank,
                new_rank: newRank.name,
            };

        } catch (err) {
            if (isOwnTransaction) await transaction.rollback();
            throw err;
        }
    }

    /**
     * CORE: Trừ sao (rollback)
     */
    async deductStars(userId, amount, type, description, metadata = {}, options = {}) {
        const { refId = null, refType = null, externalTransaction = null } = options;

        const isOwnTransaction = !externalTransaction;
        const transaction = externalTransaction || await this.sequelize.transaction();

        try {
            const user = await this.User.findByPk(userId, {
                lock: transaction.LOCK.UPDATE,
                transaction,
            });

            if (!user) {
                if (isOwnTransaction) await transaction.rollback();
                throw new AppError("User not found", 404);
            }

            const newBalance = Math.max(0, (user.star_balance || 0) - amount);

            await user.update({
                star_balance: newBalance,
            }, { transaction });

            const tx = await this.StarTransaction.create({
                user_id: userId,
                amount: -amount,
                type,
                description,
                metadata,
                balance_after: newBalance,
                ref_id: refId,
                ref_type: refType,
            }, { transaction });

            if (isOwnTransaction) {
                await transaction.commit();
            }

            // Gửi notification khi bị thu hồi sao
            if (amount > 0) {
                notificationService.createNotification({
                    userId,
                    type: "STAR_PENALTY",
                    title: `⚠️ -${amount} sao`,
                    message: `${description} | Số dư: ${newBalance} sao`,
                    data: {
                        amount: -amount,
                        balance_after: newBalance,
                        description,
                    },
                }).catch(err => console.error("notify penalty error:", err));
            }

            return {
                transaction_id: tx.id,
                amount_deducted: amount,
                balance_after: newBalance,
            };

        } catch (err) {
            if (isOwnTransaction) await transaction.rollback();
            throw err;
        }
    }

    /**
     * Đảo ngược một transaction (khi survey bị xóa)
     */
    async reverseTransaction(transactionId, reason = "Reversed", externalTransaction = null) {
        const originalTx = await this.StarTransaction.findByPk(transactionId);

        if (!originalTx) {
            throw new AppError("Transaction not found", 404);
        }

        if (originalTx.is_reversed) {
            throw new AppError("Transaction already reversed", 400);
        }

        const isOwnTransaction = !externalTransaction;
        const transaction = externalTransaction || await this.sequelize.transaction();

        try {
            // Trừ sao tương ứng
            if (originalTx.amount > 0) {
                const user = await this.User.findByPk(originalTx.user_id, {
                    lock: transaction.LOCK.UPDATE,
                    transaction,
                });

                const newBalance = Math.max(0, user.star_balance - originalTx.amount);
                const newTotal = Math.max(0, user.total_stars_earned - originalTx.amount);

                await user.update({
                    star_balance: newBalance,
                    total_stars_earned: newTotal,
                }, { transaction });
            }

            // Đánh dấu đã reversed
            originalTx.is_reversed = true;
            await originalTx.save({ transaction });

            if (isOwnTransaction) {
                await transaction.commit();
            }

            return { success: true, message: "Transaction reversed" };

        } catch (err) {
            if (isOwnTransaction) await transaction.rollback();
            throw err;
        }
    }

    /**
     * Lấy số dư sao của user
     */
    async getBalance(userId) {
        const user = await this.User.findByPk(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const rank = this._getRankFromStars(user.total_stars_earned || 0);
        const nextRank = RANK_CONFIG.find(r => r.minStars > (user.total_stars_earned || 0));
        const progress = nextRank
            ? Math.floor(((user.total_stars_earned - rank.minStars) / (nextRank.minStars - rank.minStars)) * 100)
            : 100;

        const recentTransactions = await this.StarTransaction.findAll({
            where: { user_id: userId, is_reversed: false },
            order: [["created_at", "DESC"]],
            limit: 10,
        });

        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const lastDate = user.last_checkin_date
            ? (typeof user.last_checkin_date === "string"
                ? user.last_checkin_date.split("T")[0]
                : new Date(user.last_checkin_date).toISOString().split("T")[0])
            : null;
        const isStreakActive = lastDate === today || lastDate === yesterdayStr;

        return {
            user_id: user.id,
            star_balance: user.star_balance,
            total_stars_earned: user.total_stars_earned,
            weekly_stars: user.weekly_stars || 0,
            monthly_stars: user.monthly_stars || 0,
            current_rank: user.current_rank,
            rank_info: {
                ...rank,
                next: nextRank || null,
                progress_to_next: progress,
                stars_needed: nextRank ? nextRank.minStars - (user.total_stars_earned || 0) : 0,
            },
            streak_count: user.streak_count,
            active_streak: isStreakActive ? user.streak_count : 0,
            highest_streak: user.highest_streak,
            last_checkin_date: user.last_checkin_date,
            recent_transactions: recentTransactions.map(tx => ({
                id: tx.id,
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                created_at: tx.created_at,
            })),
        };
    }

    /**
     * Lấy lịch sử giao dịch sao
     */
    async getTransactionHistory(userId, { page = 1, limit = 20, type = null } = {}) {
        const offset = (page - 1) * limit;
        const where = { user_id: userId, is_reversed: false };

        if (type) {
            where.type = type;
        }

        const { count, rows } = await this.StarTransaction.findAndCountAll({
            where,
            offset,
            limit,
            order: [["created_at", "DESC"]],
        });

        return {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            transactions: rows.map(tx => ({
                id: tx.id,
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                balance_after: tx.balance_after,
                ref_id: tx.ref_id,
                ref_type: tx.ref_type,
                created_at: tx.created_at,
            })),
        };
    }

    /**
     * Cộng sao khi tạo survey
     */
    async rewardCreateSurvey(userId, surveyId) {
        return await this.addStars(
            userId,
            STAR_REWARDS.CREATE_SURVEY,
            "CREATE_SURVEY",
            `Tạo khảo sát mới`,
            { survey_id: surveyId },
            { refId: surveyId, refType: "survey" }
        );
    }

    /**
     * Cộng sao khi submit survey
     * Trả về số sao và thứ tự người tham gia
     */
    async rewardSubmitSurvey(userId, surveyId, responseId, isCreator = false) {
        // Đếm số người đã hoàn thành survey này
        const { Response } = models;
        const completedCount = await Response.count({
            where: {
                survey_id: surveyId,
                status: "COMPLETED",
            },
        });

        // Xác định số sao dựa trên thứ tự
        let stars = 0;
        let type = "RESPOND_SURVEY";
        let description = "";

        if (completedCount === 1) {
            stars = STAR_REWARDS.FIRST_RESPONDER;
            type = "FIRST_RESPONDER";
            description = "Người tham gia đầu tiên - Phần thưởng đặc biệt!";
        } else if (completedCount === 2) {
            stars = STAR_REWARDS.SECOND_RESPONDER;
            type = "SECOND_RESPONDER";
            description = "Người tham gia thứ 2 - Rất nhanh!";
        } else if (completedCount === 3) {
            stars = STAR_REWARDS.THIRD_RESPONDER;
            type = "THIRD_RESPONDER";
            description = "Người tham gia thứ 3";
        } else {
            stars = STAR_REWARDS.LATER_RESPONDER;
            type = "LATER_RESPONDER";
            description = `Người tham gia thứ ${completedCount}`;
        }

        const result = await this.addStars(
            userId,
            stars,
            type,
            description,
            { survey_id: surveyId, order: completedCount },
            { refId: responseId, refType: "response" }
        );

        return {
            ...result,
            order: completedCount,
            reward_type: type,
        };
    }

    /**
     * Cộng bonus cho người tạo survey khi có người tham gia
     */
    async rewardCreatorForRespondent(creatorId, surveyId, responderUserId) {
        const result = await this.addStars(
            creatorId,
            STAR_REWARDS.CREATOR_BONUS_PER_RESPONDENT,
            "SURVEY_CREATOR_BONUS",
            `Có người tham gia khảo sát của bạn`,
            { survey_id: surveyId, responder_user_id: responderUserId },
            { refId: surveyId, refType: "survey" }
        );

        return result;
    }

    /**
     * Trừ sao khi survey bị xóa (thu hồi phần thưởng tạo survey)
     */
    async penalizeSurveyDeleted(userId, surveyId) {
        return await this.deductStars(
            userId,
            STAR_REWARDS.SURVEY_CANCELLED_PENALTY,
            "PENALTY",
            `Thu hồi sao do khảo sát bị xóa`,
            { survey_id: surveyId },
            { refId: surveyId, refType: "survey" }
        );
    }

    /**
     * Cộng sao khi điểm danh hằng ngày
     */
    async rewardDailyCheckin(userId, streakCount, multiplier) {
        const stars = Math.floor(STAR_REWARDS.DAILY_CHECKIN_BASE * multiplier);

        return await this.addStars(
            userId,
            stars,
            streakCount >= 7 ? "STREAK_BONUS" : "DAILY_CHECKIN",
            streakCount >= 7
                ? `Điểm danh liên tiếp ${streakCount} ngày - Bonus x${multiplier}!`
                : `Điểm danh ngày ${streakCount}`,
            { streak_count: streakCount, multiplier },
        );
    }

    /**
     * Cộng sao khi nhận achievement
     */
    async rewardAchievement(userId, achievementCode, starReward) {
        return await this.addStars(
            userId,
            starReward,
            "ACHIEVEMENT_REWARD",
            `Mở khóa huy hiệu: ${achievementCode}`,
            { achievement_code: achievementCode },
        );
    }

    /**
     * Admin điều chỉnh sao thủ công
     */
    async adminAdjustStars(userId, amount, reason, adminId) {
        if (amount === 0) {
            throw new AppError("Amount cannot be zero", 400);
        }

        return await this.addStars(
            userId,
            amount,
            "ADMIN_ADJUST",
            `[Admin ${adminId}] ${reason}`,
            { admin_id: adminId, reason },
        );
    }

    /**
     * Lấy thông tin rank
     */
    getRankInfo(totalStars) {
        const rank = this._getRankFromStars(totalStars);
        const nextRank = RANK_CONFIG.find(r => r.minStars > totalStars);
        const progress = nextRank
            ? Math.floor(((totalStars - rank.minStars) / (nextRank.minStars - rank.minStars)) * 100)
            : 100;

        return {
            current: rank,
            next: nextRank || null,
            progress_to_next: progress,
            stars_needed: nextRank ? nextRank.minStars - totalStars : 0,
        };
    }
}

export default new StarService();
