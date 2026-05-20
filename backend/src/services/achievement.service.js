import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import starService from "./star.service.js";
import notificationService from "./notification.service.js";

// ============================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================
export const ACHIEVEMENTS_DEF = {
    // SURVEY CREATION
    FIRST_SURVEY: {
        code: "FIRST_SURVEY",
        name: "Người mới",
        description: "Tạo khảo sát đầu tiên",
        icon: "🌱",
        category: "SURVEY_CREATION",
        star_reward: 20,
        tier: "BRONZE",
        condition_type: "SURVEY_COUNT",
        condition_value: 1,
    },
    FIVE_SURVEYS: {
        code: "FIVE_SURVEYS",
        name: "Khảo sát viên",
        description: "Tạo 5 khảo sát",
        icon: "📝",
        category: "SURVEY_CREATION",
        star_reward: 50,
        tier: "SILVER",
        condition_type: "SURVEY_COUNT",
        condition_value: 5,
    },
    TEN_SURVEYS: {
        code: "TEN_SURVEYS",
        name: "Chuyên gia khảo sát",
        description: "Tạo 10 khảo sát",
        icon: "🏆",
        category: "SURVEY_CREATION",
        star_reward: 100,
        tier: "GOLD",
        condition_type: "SURVEY_COUNT",
        condition_value: 10,
    },
    FIFTY_SURVEYS: {
        code: "FIFTY_SURVEYS",
        name: "Bậc thầy khảo sát",
        description: "Tạo 50 khảo sát",
        icon: "👑",
        category: "SURVEY_CREATION",
        star_reward: 250,
        tier: "PLATINUM",
        condition_type: "SURVEY_COUNT",
        condition_value: 50,
    },
    HUNDRED_SURVEYS: {
        code: "HUNDRED_SURVEYS",
        name: "Huyền thoại khảo sát",
        description: "Tạo 100 khảo sát",
        icon: "💎",
        category: "SURVEY_CREATION",
        star_reward: 500,
        tier: "DIAMOND",
        condition_type: "SURVEY_COUNT",
        condition_value: 100,
    },

    // PARTICIPATION
    FIRST_RESPONSE: {
        code: "FIRST_RESPONSE",
        name: "Người tham gia",
        description: "Hoàn thành khảo sát đầu tiên",
        icon: "🎯",
        category: "PARTICIPATION",
        star_reward: 20,
        tier: "BRONZE",
        condition_type: "RESPONSE_COUNT",
        condition_value: 1,
    },
    TEN_RESPONSES: {
        code: "TEN_RESPONSES",
        name: "Khách quen",
        description: "Hoàn thành 10 khảo sát",
        icon: "🙋",
        category: "PARTICIPATION",
        star_reward: 50,
        tier: "SILVER",
        condition_type: "RESPONSE_COUNT",
        condition_value: 10,
    },
    FIFTY_RESPONSES: {
        code: "FIFTY_RESPONSES",
        name: "Người tích cực",
        description: "Hoàn thành 50 khảo sát",
        icon: "🚀",
        category: "PARTICIPATION",
        star_reward: 150,
        tier: "GOLD",
        condition_type: "RESPONSE_COUNT",
        condition_value: 50,
    },
    HUNDRED_RESPONSES: {
        code: "HUNDRED_RESPONSES",
        name: "Siêu sao khảo sát",
        description: "Hoàn thành 100 khảo sát",
        icon: "⭐",
        category: "PARTICIPATION",
        star_reward: 300,
        tier: "PLATINUM",
        condition_type: "RESPONSE_COUNT",
        condition_value: 100,
    },

    // SOCIAL - Người tham gia đầu tiên
    FIRST_RESPONDER_ACH: {
        code: "FIRST_RESPONDER",
        name: "Người đi đầu",
        description: "Là người đầu tiên hoàn thành một khảo sát",
        icon: "🏃",
        category: "SOCIAL",
        star_reward: 30,
        tier: "BRONZE",
        condition_type: "FIRST_RESPONSE_ACH",
        condition_value: 1,
    },

    // SURVEY với 100 người tham gia
    VIRAL_SURVEY: {
        code: "VIRAL_SURVEY",
        name: "Khảo sát viral",
        description: "Có 100 người tham gia khảo sát của bạn",
        icon: "🦠",
        category: "SOCIAL",
        star_reward: 200,
        tier: "GOLD",
        condition_type: "SURVEY_RESPONSES",
        condition_value: 100,
    },

    // STREAK achievements
    STREAK_3: {
        code: "STREAK_3",
        name: "Kiên trì",
        description: "Điểm danh 3 ngày liên tiếp",
        icon: "🔥",
        category: "STREAK",
        star_reward: 15,
        tier: "BRONZE",
        condition_type: "STREAK",
        condition_value: 3,
    },
    STREAK_7: {
        code: "STREAK_7",
        name: "Cam kết",
        description: "Điểm danh 7 ngày liên tiếp",
        icon: "💪",
        category: "STREAK",
        star_reward: 40,
        tier: "SILVER",
        condition_type: "STREAK",
        condition_value: 7,
    },
    STREAK_30: {
        code: "STREAK_30",
        name: "Tháng nóng",
        description: "Điểm danh 30 ngày liên tiếp",
        icon: "🔥",
        category: "STREAK",
        star_reward: 150,
        tier: "GOLD",
        condition_type: "STREAK",
        condition_value: 30,
    },
    STREAK_100: {
        code: "STREAK_100",
        name: "Siêu streak",
        description: "Điểm danh 100 ngày liên tiếp",
        icon: "🌟",
        category: "STREAK",
        star_reward: 500,
        tier: "DIAMOND",
        condition_type: "STREAK",
        condition_value: 100,
    },

    // RANK achievements
    RANK_SILVER: {
        code: "RANK_SILVER",
        name: "Vượt qua đồng",
        description: "Đạt rank Bạc (500 sao)",
        icon: "🥈",
        category: "RANK",
        star_reward: 50,
        tier: "SILVER",
        condition_type: "RANK",
        condition_value: 500,
    },
    RANK_GOLD: {
        code: "RANK_GOLD",
        name: "Vàng rực rỡ",
        description: "Đạt rank Vàng (2000 sao)",
        icon: "🥇",
        category: "RANK",
        star_reward: 100,
        tier: "GOLD",
        condition_type: "RANK",
        condition_value: 2000,
    },
    RANK_PLATINUM: {
        code: "RANK_PLATINUM",
        name: "Bạch kim",
        description: "Đạt rank Bạch Kim (5000 sao)",
        icon: "💎",
        category: "RANK",
        star_reward: 200,
        tier: "PLATINUM",
        condition_type: "RANK",
        condition_value: 5000,
    },
    RANK_DIAMOND: {
        code: "RANK_DIAMOND",
        name: "Kim cương",
        description: "Đạt rank Kim Cương (10000 sao)",
        icon: "💠",
        category: "RANK",
        star_reward: 500,
        tier: "DIAMOND",
        condition_type: "RANK",
        condition_value: 10000,
    },

    // TOTAL STARS
    STARS_1000: {
        code: "STARS_1000",
        name: "Nghìn sao",
        description: "Tích lũy 1000 sao",
        icon: "✨",
        category: "SPECIAL",
        star_reward: 50,
        tier: "SILVER",
        condition_type: "TOTAL_STARS",
        condition_value: 1000,
    },
    STARS_5000: {
        code: "STARS_5000",
        name: "Năm nghìn sao",
        description: "Tích lũy 5000 sao",
        icon: "🌈",
        category: "SPECIAL",
        star_reward: 150,
        tier: "GOLD",
        condition_type: "TOTAL_STARS",
        condition_value: 5000,
    },
    STARS_10000: {
        code: "STARS_10000",
        name: "Vạn sao",
        description: "Tích lũy 10000 sao",
        icon: "🌌",
        category: "SPECIAL",
        star_reward: 300,
        tier: "PLATINUM",
        condition_type: "TOTAL_STARS",
        condition_value: 10000,
    },
};

// ============================================================
// ACHIEVEMENT CATEGORY ORDER
// ============================================================
export const ACHIEVEMENT_CATEGORY_ORDER = [
    "STREAK",
    "SURVEY_CREATION",
    "PARTICIPATION",
    "SOCIAL",
    "SPECIAL",
    "RANK",
];

class AchievementService {
    constructor() {
        this.User = models.User;
        this.Achievement = models.Achievement;
        this.UserAchievement = models.UserAchievement;
        this.Survey = models.Survey;
        this.Response = models.Response;
        this.StarTransaction = models.StarTransaction;
        this.sequelize = models.sequelize;
    }

    /**
     * Seed tất cả achievements vào DB (chạy 1 lần)
     */
    async seedAchievements() {
        const achievements = Object.values(ACHIEVEMENTS_DEF);
        const results = [];

        for (const ach of achievements) {
            const [record, created] = await this.Achievement.findOrCreate({
                where: { code: ach.code },
                defaults: {
                    code: ach.code,
                    name: ach.name,
                    description: ach.description,
                    icon: ach.icon,
                    category: ach.category,
                    star_reward: ach.star_reward,
                    tier: ach.tier,
                    condition_type: ach.condition_type,
                    condition_value: ach.condition_value,
                    is_active: true,
                },
            });
            results.push({ code: ach.code, created });
        }

        return results;
    }

    /**
     * Kiểm tra và unlock achievements sau một trigger
     * @param {string} userId
     * @param {string} trigger - loại trigger (survey_created, survey_completed, checkin, etc.)
     * @param {object} data - dữ liệu kèm theo
     */
    async checkAndUnlock(userId, trigger, data = {}, options = {}) {
        const { externalTransaction = null } = options;
        const unlockedAchievements = [];

        const isOwnTransaction = !externalTransaction;
        const transaction = externalTransaction || await this.sequelize.transaction();

        try {
            const user = await this.User.findByPk(userId, { transaction });
            if (!user) {
                if (isOwnTransaction) await transaction.rollback();
                throw new AppError("User not found", 404);
            }

            // Lấy tất cả achievements chưa unlock
            const allAchievements = await this.Achievement.findAll({
                where: { is_active: true },
                include: [{
                    model: this.UserAchievement,
                    as: "user_achievements",
                    where: { user_id: userId },
                    required: false,
                }],
            });

            // Filter chưa unlock
            const lockedAchievements = allAchievements.filter(
                a => !a.user_achievements || a.user_achievements.length === 0
            );

            for (const achievement of lockedAchievements) {
                let shouldUnlock = false;
                let progress = 0;

                switch (achievement.condition_type) {
                    case "SURVEY_COUNT": {
                        const count = await this.Survey.count({
                            where: { created_by: userId },
                        });
                        progress = count;
                        shouldUnlock = count >= achievement.condition_value;
                        break;
                    }

                    case "RESPONSE_COUNT": {
                        const count = await this.Response.count({
                            where: { user_id: userId, status: "COMPLETED" },
                        });
                        progress = count;
                        shouldUnlock = count >= achievement.condition_value;
                        break;
                    }

                    case "STREAK": {
                        progress = user.streak_count || 0;
                        shouldUnlock = progress >= achievement.condition_value;
                        break;
                    }

                    case "TOTAL_STARS": {
                        progress = user.total_stars_earned || 0;
                        shouldUnlock = progress >= achievement.condition_value;
                        break;
                    }

                    case "RANK": {
                        progress = user.total_stars_earned || 0;
                        shouldUnlock = progress >= achievement.condition_value;
                        break;
                    }

                    case "FIRST_RESPONSE_ACH": {
                        if (data.is_first_responder) {
                            shouldUnlock = true;
                            progress = 1;
                        }
                        break;
                    }

                    case "SURVEY_RESPONSES": {
                        if (data.survey_id) {
                            const count = await this.Response.count({
                                where: {
                                    survey_id: data.survey_id,
                                    status: "COMPLETED",
                                },
                            });
                            // Chỉ creator mới unlock được
                            if (data.is_creator) {
                                progress = count;
                                shouldUnlock = count >= achievement.condition_value;
                            }
                        }
                        break;
                    }

                    default:
                        break;
                }

                if (shouldUnlock) {
                    // Tạo user_achievement
                    await this.UserAchievement.create({
                        user_id: userId,
                        achievement_id: achievement.id,
                        progress,
                        is_unlocked: true,
                        unlocked_at: new Date(),
                        notification_sent: false,
                    }, { transaction });

                    // Cộng sao reward — reuse external transaction to avoid deadlock
                    await starService.addStars(
                        userId,
                        achievement.star_reward,
                        "ACHIEVEMENT_REWARD",
                        `Mở khóa huy hiệu: ${achievement.name}`,
                        { achievement_code: achievement.code, achievement_id: achievement.id },
                        { externalTransaction: transaction },
                    );

                    // Gửi notification mở khóa huy hiệu
                    notificationService.notifyAchievementUnlocked({
                        userId,
                        achievement: {
                            code: achievement.code,
                            name: achievement.name,
                            icon: achievement.icon,
                            description: achievement.description,
                            tier: achievement.tier,
                            star_reward: achievement.star_reward,
                        },
                    }).catch(err => console.error("notifyAchievementUnlocked error:", err));

                    unlockedAchievements.push({
                        code: achievement.code,
                        name: achievement.name,
                        icon: achievement.icon,
                        description: achievement.description,
                        tier: achievement.tier,
                        star_reward: achievement.star_reward,
                    });
                } else {
                    // Cập nhật progress
                    const existing = await this.UserAchievement.findOne({
                        where: { user_id: userId, achievement_id: achievement.id },
                        transaction,
                    });

                    if (existing) {
                        await existing.update({ progress }, { transaction });
                    }
                }
            }

            if (isOwnTransaction) {
                await transaction.commit();
            }

            return {
                unlocked: unlockedAchievements,
                count: unlockedAchievements.length,
            };

        } catch (err) {
            if (isOwnTransaction) await transaction.rollback();
            throw err;
        }
    }

    /**
     * Lấy danh sách achievements của user
     */
    async getUserAchievements(userId) {
        const user = await this.User.findByPk(userId);
        if (!user) throw new AppError("User not found", 404);

        // Lấy tất cả achievements
        const allAchievements = await this.Achievement.findAll({
            where: { is_active: true },
            order: [["category", "ASC"], ["condition_value", "ASC"]],
        });

        // Lấy achievements của user
        const userAchievements = await this.UserAchievement.findAll({
            where: { user_id: userId },
            include: [{
                model: this.Achievement,
                as: "achievement",
            }],
        });

        const userAchMap = Object.fromEntries(
            userAchievements.map(ua => [ua.achievement_id, ua])
        );

        // Lấy tất cả user_achievements để tính progress
        const allUserAchievements = await this.UserAchievement.findAll({
            where: { user_id: userId },
            attributes: ["achievement_id", "progress", "is_unlocked"],
        });
        const progressMap = Object.fromEntries(
            allUserAchievements.map(ua => [ua.achievement_id, ua])
        );

        // Group by category
        const result = {};
        for (const cat of ACHIEVEMENT_CATEGORY_ORDER) {
            result[cat] = [];
        }

        for (const ach of allAchievements) {
            const ua = progressMap[ach.id];
            const isUnlocked = ua?.is_unlocked || false;
            const progress = ua?.progress || 0;

            result[ach.category].push({
                id: ach.id,
                code: ach.code,
                name: ach.name,
                description: ach.description,
                icon: ach.icon,
                tier: ach.tier,
                category: ach.category,
                star_reward: ach.star_reward,
                condition_value: ach.condition_value,
                is_unlocked: isUnlocked,
                progress,
                progress_percent: Math.min(100, Math.floor((progress / ach.condition_value) * 100)),
                unlocked_at: ua?.unlocked_at || null,
            });
        }

        return {
            categories: result,
            total_unlocked: allAchievements.filter(a =>
                progressMap[a.id]?.is_unlocked
            ).length,
            total_achievements: allAchievements.length,
        };
    }

    /**
     * Lấy achievements mới nhất (cho notification)
     */
    async getRecentUnlocks(userId, limit = 5) {
        const recent = await this.UserAchievement.findAll({
            where: { user_id: userId, is_unlocked: true },
            include: [{
                model: this.Achievement,
                as: "achievement",
            }],
            order: [["unlocked_at", "DESC"]],
            limit,
        });

        return recent.map(ua => ({
            id: ua.id,
            code: ua.achievement.code,
            name: ua.achievement.name,
            icon: ua.achievement.icon,
            description: ua.achievement.description,
            star_reward: ua.achievement.star_reward,
            tier: ua.achievement.tier,
            unlocked_at: ua.unlocked_at,
        }));
    }
}

export default new AchievementService();
