import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import starService, { STAR_REWARDS } from "./star.service.js";
import achievementService from "./achievement.service.js";
import leaderboardService from "./leaderboard.service.js";
import notificationService from "./notification.service.js";

// Helpers: luôn dùng UTC để tránh lệch ngày do timezone server
function todayUTC() {
    return new Date().toISOString().split("T")[0];
}

function yesterdayUTC() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split("T")[0];
}

// Chuyển DATEONLY field (có thể là Date object hoặc string) về string YYYY-MM-DD để so sánh chính xác
function toDateString(val) {
    if (!val) return null;
    if (typeof val === "string") return val.split("T")[0];
    return new Date(val).toISOString().split("T")[0];
}

const STREAK_BONUS_TIERS = [
    { minStreak: 7,  multiplier: 2.0 },
    { minStreak: 4,  multiplier: 1.5 },
    { minStreak: 1,  multiplier: 1.0 },
];

class DailyCheckinService {
    constructor() {
        this.User = models.User;
        this.DailyCheckin = models.DailyCheckin;
        this.sequelize = models.sequelize;
    }

    _getMultiplier(streakCount) {
        for (const tier of STREAK_BONUS_TIERS) {
            if (streakCount >= tier.minStreak) {
                return tier.multiplier;
            }
        }
        return 1.0;
    }

    /**
     * Điểm danh hằng ngày
     */
    async checkin(userId, ipAddress = null, deviceInfo = null) {
        const today = todayUTC();
        const yesterday = yesterdayUTC();

        const transaction = await this.sequelize.transaction();

        try {
            // Kiểm tra đã điểm danh hôm nay chưa
            const existingCheckin = await this.DailyCheckin.findOne({
                where: {
                    user_id: userId,
                    checkin_date: today,
                },
                transaction,
            });

            if (existingCheckin) {
                throw new AppError("Bạn đã điểm danh hôm nay rồi. Hẹn gặp bạn ngày mai!", 400);
            }

            // Lấy thông tin user
            const user = await this.User.findByPk(userId, {
                lock: transaction.LOCK.UPDATE,
                transaction,
            });

            if (!user) {
                throw new AppError("User not found", 404);
            }

            // Tính streak — chuyển last_checkin_date về string để so sánh chính xác
            const lastDate = toDateString(user.last_checkin_date);
            let newStreakCount = 1;

            if (lastDate === yesterday) {
                // Tiếp tục streak
                newStreakCount = (user.streak_count || 0) + 1;
            } else if (lastDate === today) {
                // Đã checkin hôm nay rồi
                throw new AppError("Bạn đã điểm danh hôm nay rồi!", 400);
            }
            // else: streak reset về 1

            // Tính multiplier
            const multiplier = this._getMultiplier(newStreakCount);
            const starsEarned = Math.floor(STAR_REWARDS.DAILY_CHECKIN_BASE * multiplier);

            // Lưu checkin
            await this.DailyCheckin.create({
                user_id: userId,
                checkin_date: today,
                stars_earned: starsEarned,
                streak_count: newStreakCount,
                multiplier,
                ip_address: ipAddress,
                device_info: deviceInfo,
            }, { transaction });

            // Cập nhật user
            await user.update({
                last_checkin_date: today,
                streak_count: newStreakCount,
                highest_streak: Math.max(user.highest_streak || 0, newStreakCount),
            }, { transaction });

            // Cộng sao
            await starService.addStars(
                userId,
                starsEarned,
                newStreakCount >= 7 ? "STREAK_BONUS" : "DAILY_CHECKIN",
                newStreakCount >= 7
                    ? `Điểm danh liên tiếp ${newStreakCount} ngày - Bonus x${multiplier}!`
                    : `Điểm danh ngày thứ ${newStreakCount}`,
                { streak_count: newStreakCount, multiplier, checkin_date: today },
                { externalTransaction: transaction },
            );

            // Kiểm tra achievements — pass transaction to avoid deadlock
            await achievementService.checkAndUnlock(userId, "checkin", {
                streak_count: newStreakCount,
            }, { externalTransaction: transaction });

            await transaction.commit();

            // Gửi notification streak milestone (7, 30, 100 ngày)
            const milestoneStreaks = [7, 30, 100];
            if (milestoneStreaks.includes(newStreakCount) || newStreakCount > (user.highest_streak || 0)) {
                notificationService.notifyStreakMilestone({
                    userId,
                    streakCount: newStreakCount,
                    multiplier,
                    starsEarned,
                    isNewRecord: newStreakCount > (user.highest_streak || 0),
                }).catch(err => console.error("notifyStreakMilestone error:", err));
            }

            return {
                message: "Điểm danh thành công!",
                stars_earned: starsEarned,
                streak_count: newStreakCount,
                multiplier,
                total_streak: newStreakCount,
                highest_streak: Math.max(user.highest_streak || 0, newStreakCount),
                is_new_streak_record: newStreakCount > (user.highest_streak || 0),
                next_bonus_tier: this._getNextBonusTier(newStreakCount),
                bonus_message: this._getBonusMessage(newStreakCount, multiplier),
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Kiểm tra đã điểm danh hôm nay chưa
     */
    async hasCheckedInToday(userId) {
        const today = todayUTC();

        const checkin = await this.DailyCheckin.findOne({
            where: {
                user_id: userId,
                checkin_date: today,
            },
        });

        return {
            checked_in: !!checkin,
            checkin_data: checkin || null,
        };
    }

    /**
     * Lấy lịch sử điểm danh
     */
    async getCheckinHistory(userId, { page = 1, limit = 30 } = {}) {
        const offset = (page - 1) * limit;

        const { count, rows } = await this.DailyCheckin.findAndCountAll({
            where: { user_id: userId },
            offset,
            limit,
            order: [["checkin_date", "DESC"]],
        });

        return {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            history: rows.map(c => ({
                id: c.id,
                checkin_date: c.checkin_date,
                stars_earned: c.stars_earned,
                streak_count: c.streak_count,
                multiplier: c.multiplier,
                created_at: c.created_at,
            })),
        };
    }

    /**
     * Lấy streak hiện tại của user
     */
    async getCurrentStreak(userId) {
        const user = await this.User.findByPk(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const today = todayUTC();
        const yesterday = yesterdayUTC();
        const lastDate = toDateString(user.last_checkin_date);

        // Kiểm tra streak còn active không
        const isActive = lastDate === today || lastDate === yesterday;

        const multiplier = this._getMultiplier(user.streak_count || 0);

        return {
            current_streak: isActive ? (user.streak_count || 0) : 0,
            highest_streak: user.highest_streak || 0,
            last_checkin_date: user.last_checkin_date,
            is_active: isActive,
            checked_in_today: lastDate === today,
            current_multiplier: multiplier,
            can_checkin: lastDate !== today,
            next_bonus_tier: this._getNextBonusTier(user.streak_count || 0),
        };
    }

    _getNextBonusTier(currentStreak) {
        if (currentStreak < 4) {
            return { days_needed: 4 - currentStreak, next_multiplier: 1.5 };
        }
        if (currentStreak < 7) {
            return { days_needed: 7 - currentStreak, next_multiplier: 2.0 };
        }
        return null; // Đã đạt max
    }

    _getBonusMessage(streakCount, multiplier) {
        if (multiplier >= 2.0) {
            return `Wow! Bạn đang có streak ${streakCount} ngày với bonus x2! Tiếp tục giữ streak nhé!`;
        }
        if (multiplier >= 1.5) {
            return `Tuyệt vời! Streak ${streakCount} ngày với bonus x1.5. Còn ${7 - streakCount} ngày nữa để đạt x2!`;
        }
        if (streakCount >= 4) {
            return `Tốt lắm! Streak ${streakCount} ngày. Còn ${7 - streakCount} ngày nữa để đạt bonus x2!`;
        }
        return `Chào mừng bạn! Điểm danh ${streakCount} ngày liên tiếp. Đạt 4 ngày để nhận bonus x1.5!`;
    }
}

export default new DailyCheckinService();
