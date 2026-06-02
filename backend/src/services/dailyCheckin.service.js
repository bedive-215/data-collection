import models from "#models/index.js";
import { AppError } from "#middlewares/handleException.middlware.js";
import { STAR_REWARDS } from "#domain/star.domain.js";

import starService from "./star.service.js";
import eventBus from "#events/eventBus.js";
import { CHECKIN_EVENTS } from "#events/dailyCheckin/dailyCheckin.event.js";

import { withTransaction } from "#utils/transaction.js";
import { todayUTC, yesterdayUTC, toDateString, getMultiplier } from "#helpers/dailyCheckin.helper.js";
import { getNextBonusTier, getBonusMessage } from "#domain/dailyCheckin.domain.js";

class DailyCheckinService {
    constructor() {
        this.User         = models.User;
        this.DailyCheckin = models.DailyCheckin;
        this.sequelize    = models.sequelize;
    }

    async checkin(userId, ipAddress = null, deviceInfo = null) {
        const today     = todayUTC();
        const yesterday = yesterdayUTC();

        const result = await withTransaction(this.sequelize, null, async (t) => {
            const [existing, user] = await Promise.all([
                this.DailyCheckin.findOne({ where: { user_id: userId, checkin_date: today }, transaction: t }),
                this.User.findByPk(userId, { lock: t.LOCK.UPDATE, transaction: t }),
            ]);

            if (existing) throw new AppError("Bạn đã điểm danh hôm nay rồi. Hẹn gặp bạn ngày mai!", 400);
            if (!user)    throw new AppError("User not found", 404);

            const lastDate      = toDateString(user.last_checkin_date);
            const newStreak     = lastDate === yesterday ? (user.streak_count || 0) + 1 : 1;
            const multiplier    = getMultiplier(newStreak);
            const starsEarned   = Math.floor(STAR_REWARDS.DAILY_CHECKIN_BASE * multiplier);
            const isStreakBonus = newStreak >= 7;
            const isNewRecord   = newStreak > (user.highest_streak || 0);
            const highestStreak = Math.max(user.highest_streak || 0, newStreak);

            await Promise.all([
                this.DailyCheckin.create({
                    user_id: userId, checkin_date: today,
                    stars_earned: starsEarned, streak_count: newStreak,
                    multiplier, ip_address: ipAddress, device_info: deviceInfo,
                }, { transaction: t }),
                user.update({
                    last_checkin_date: today,
                    streak_count:      newStreak,
                    highest_streak:    highestStreak,
                }, { transaction: t }),
            ]);

            await starService.addStars(
                userId, starsEarned,
                isStreakBonus ? "STREAK_BONUS" : "DAILY_CHECKIN",
                isStreakBonus
                    ? `Điểm danh liên tiếp ${newStreak} ngày - Bonus x${multiplier}!`
                    : `Điểm danh ngày thứ ${newStreak}`,
                { streak_count: newStreak, multiplier, checkin_date: today },
                { externalTransaction: t },
            );

            return { newStreak, multiplier, starsEarned, isNewRecord, highestStreak };
        });

       
        await eventBus.emitAsync(CHECKIN_EVENTS.COMPLETED, {
            userId,
            streakCount:  result.newStreak,
            starsEarned:  result.starsEarned,
            multiplier:   result.multiplier,
            isNewRecord:  result.isNewRecord,
            checkinDate:  today,
        });

        return {
            message:              "Điểm danh thành công!",
            stars_earned:         result.starsEarned,
            streak_count:         result.newStreak,
            multiplier:           result.multiplier,
            total_streak:         result.newStreak,
            highest_streak:       result.highestStreak,
            is_new_streak_record: result.isNewRecord,
            next_bonus_tier:      getNextBonusTier(result.newStreak),
            bonus_message:        getBonusMessage(result.newStreak, result.multiplier),
        };
    }

    async hasCheckedInToday(userId) {
        const checkin = await this.DailyCheckin.findOne({
            where: { user_id: userId, checkin_date: todayUTC() },
        });
        return { checked_in: !!checkin, checkin_data: checkin || null };
    }

    async getCheckinHistory(userId, { page = 1, limit = 30 } = {}) {
        const { count, rows } = await this.DailyCheckin.findAndCountAll({
            where: { user_id: userId },
            offset: (page - 1) * limit, limit,
            order: [["checkin_date", "DESC"]],
        });
        return {
            total: count, page,
            totalPages: Math.ceil(count / limit),
            history: rows.map(({ id, checkin_date, stars_earned, streak_count, multiplier, created_at }) =>
                ({ id, checkin_date, stars_earned, streak_count, multiplier, created_at })
            ),
        };
    }

    async getCurrentStreak(userId) {
        const user = await this.User.findByPk(userId);
        if (!user) throw new AppError("User not found", 404);

        const today    = todayUTC();
        const lastDate = toDateString(user.last_checkin_date);
        const isActive = lastDate === today || lastDate === yesterdayUTC();
        const streak   = user.streak_count || 0;

        return {
            current_streak:     isActive ? streak : 0,
            highest_streak:     user.highest_streak || 0,
            last_checkin_date:  user.last_checkin_date,
            is_active:          isActive,
            checked_in_today:   lastDate === today,
            current_multiplier: getMultiplier(streak),
            can_checkin:        lastDate !== today,
            next_bonus_tier:    getNextBonusTier(streak),
        };
    }
}

export default new DailyCheckinService();