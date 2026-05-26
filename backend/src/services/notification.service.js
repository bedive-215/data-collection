import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

import { STAR_TYPE_LABELS, RANK_META, ROLE_LABEL } from "../domain/notification.domain.js";

import { mapNotification } from "../mappers/notification.mapper.js";

const fmtDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });

class NotificationService {
    constructor() {
        this.Notification      = models.Notification;
        this.User              = models.User;
        this.Survey            = models.Survey;
        this.Response          = models.Response;
        this.SurveyParticipant = models.SurveyParticipant;
    }
    
    async _notifyAdmins(payload) {
        const admins = await this.User.findAll({ where: { role: "admin" } });
        await Promise.all(admins.map(a => this.createNotification({ userId: a.id, ...payload })));
    }

    async _responseCount(surveyId) {
        return this.Response.count({ where: { survey_id: surveyId } });
    }
    
    async createNotification({ userId, type, title, message, data = null }) {
        try {
            const n = await this.Notification.create({
                user_id:   userId,
                survey_id: data?.surveyId || null,
                type, title, message, data,
            });

            console.log(`[NotificationService] Created ${n.id} for user ${userId}, type: ${type}`);

            const emit = () => {
                if (!global.emitToUser) {
                    console.warn(`[NotificationService] emitToUser not ready, retrying in 1s for user ${userId}`);
                    return setTimeout(emit, 1000);
                }
                global.emitToUser(userId, "notification", {
                    id: n.id, type, title, message,
                    createdAt: n.created_at,
                    read: false,
                    ...data && {
                        surveyId:        data.surveyId        || null,
                        responseId:      data.responseId      || null,
                        inviterId:       data.inviterId       || null,
                        inviterName:     data.inviterName     || null,
                        responderId:     data.responderId     || null,
                        responderName:   data.responderName   || null,
                        role:            data.role            || null,
                        surveyTitle:     data.surveyTitle     || null,
                        surveyEndAt:     data.surveyEndAt     || null,
                        participantId:   data.participantId   || null,
                        participantName: data.participantName || null,
                    },
                });
            };
            emit();
            return n;
        } catch (err) {
            console.error("Error creating notification:", err);
        }
    }


    async notifySurveyResponse({ survey, responder, responseId }) {
        const owner = await this.User.findByPk(survey.created_by);
        if (!owner || owner.id === responder.id) return;

        const responderName  = responder.full_name || responder.email;
        const responseCount  = await this._responseCount(survey.id);
        const sharedData     = {
            surveyId: survey.id, surveyTitle: survey.title,
            responseId, responderId: responder.id, responderName,
            createdBy: survey.created_by,
        };

        await this.createNotification({
            userId: owner.id,
            type: "SURVEY_RESPONSE",
            title: "Có người trả lời khảo sát",
            message: `${responderName} đã trả lời khảo sát "${survey.title}"`,
            data: { ...sharedData, surveyEndAt: survey.end_at, responseCount: responseCount || 1 },
        });

        await this._notifyAdmins({
            type: "SURVEY_RESPONSE",
            title: "Người dùng trả lời khảo sát",
            message: `${responderName} đã trả lời khảo sát "${survey.title}"`,
            data: sharedData,
        });
    }

    async notifySurveyInvitation({ survey, inviteeEmail, inviter, role }) {
        const [invitee, roleLabel] = [
            await this.User.findOne({ where: { email: inviteeEmail } }),
            ROLE_LABEL(role),
        ];
        const expireInfo = survey.end_at
            ? `Hạn: ${fmtDate(survey.end_at)}`
            : "Không có thời hạn";
        const baseData = {
            surveyId: survey.id, surveyTitle: survey.title, surveyEndAt: survey.end_at,
            role, roleLabel, createdBy: survey.created_by,
        };

        if (invitee) {
            await this.createNotification({
                userId: invitee.id,
                type: "SURVEY_INVITATION",
                title: "Bạn được mời tham gia khảo sát",
                message: `${inviter.full_name || inviter.email} đã mời bạn tham gia khảo sát "${survey.title}" với vai trò ${roleLabel}`,
                data: {
                    ...baseData,
                    surveyDescription: survey.description,
                    inviterId: inviter.id,
                    inviterName: inviter.full_name || inviter.email,
                    inviterAvatar: inviter.avatar_url || null,
                    accessType: survey.access_type,
                    expireInfo,
                },
            });
        }

        await this.createNotification({
            userId: inviter.id,
            type: "SURVEY_INVITATION_SENT",
            title: "Lời mời khảo sát đã được gửi",
            message: `Lời mời tham gia khảo sát "${survey.title}" đã được gửi tới ${inviteeEmail} với vai trò ${roleLabel}`,
            data: { ...baseData, inviteeEmail },
        });
    }

    async notifyNewParticipant({ survey, participantEmail, participantId }) {
        if (survey.created_by === participantId) return;

        let participantName = participantEmail;
        try {
            const u = await this.User.findByPk(participantId);
            if (u) participantName = u.full_name || u.email;
        } catch (_) { /* ignore */ }

        await this.createNotification({
            userId: survey.created_by,
            type: "NEW_PARTICIPANT",
            title: "Có người tham gia khảo sát",
            message: `${participantName} đã tham gia khảo sát "${survey.title}"`,
            data: {
                surveyId: survey.id, surveyTitle: survey.title, surveyEndAt: survey.end_at,
                participantId, participantName, participantEmail,
                responseCount: (await this._responseCount(survey.id)) || 0,
                createdBy: survey.created_by,
            },
        });
    }

    async notifySurveyPublished({ survey }) {
        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_PUBLISHED",
            title: "Khảo sát đã được công khai",
            message: `Khảo sát "${survey.title}" của bạn đã được công khai và sẵn sàng nhận câu trả lời`,
            data: {
                surveyId: survey.id, surveyTitle: survey.title,
                surveyEndAt: survey.end_at, surveyDescription: survey.description,
                createdBy: survey.created_by,
            },
        });
    }

    async notifySurveyExpired({ survey }) {
        const responseCount = await this._responseCount(survey.id);
        const baseData = { surveyId: survey.id, surveyTitle: survey.title, createdBy: survey.created_by };

        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_EXPIRED",
            title: "Khảo sát đã hết hạn",
            message: `Khảo sát "${survey.title}" đã hết hạn vào ${fmtDate(survey.end_at)} — ${responseCount} câu trả lời`,
            data: {
                ...baseData,
                surveyEndAt: survey.end_at, surveyDescription: survey.description,
                responseCount: responseCount || 0,
            },
        });

        await this._notifyAdmins({
            type: "SURVEY_EXPIRED",
            title: "Khảo sát đã hết hạn",
            message: `Khảo sát "${survey.title}" (ID: ${survey.id}) đã hết hạn`,
            data: baseData,
        });
    }

    async notifySurveyClosed({ survey }) {
        const responseCount = await this._responseCount(survey.id);
        const baseData = { surveyId: survey.id, surveyTitle: survey.title, createdBy: survey.created_by };

        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_CLOSED",
            title: "Khảo sát đã đóng",
            message: `Khảo sát "${survey.title}" đã được đóng lại — ${responseCount} câu trả lời`,
            data: { ...baseData, surveyEndAt: survey.end_at, responseCount: responseCount || 0 },
        });

        const participants = await this.SurveyParticipant.findAll({ where: { survey_id: survey.id } });
        await Promise.all(
            participants
                .filter(p => p.user_id)
                .map(p => this.createNotification({
                    userId: p.user_id,
                    type: "SURVEY_CLOSED",
                    title: "Khảo sát đã đóng",
                    message: `Khảo sát "${survey.title}" mà bạn tham gia đã đóng lại`,
                    data: baseData,
                }))
        );
    }

    async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        const where = { user_id: userId, ...(unreadOnly && { read: false }) };
        const [{ rows, count }, unreadCount] = await Promise.all([
            this.Notification.findAndCountAll({
                where, order: [["created_at", "DESC"]],
                limit, offset: (page - 1) * limit,
            }),
            this.Notification.count({ where: { user_id: userId, read: false } }),
        ]);
        return {
            notifications: rows.map(n => mapNotification(n)),
            total: count, unreadCount, page,
            totalPages: Math.ceil(count / limit),
        };
    }

    async getUnreadCount(userId) {
        return this.Notification.count({ where: { user_id: userId, read: false } });
    }

    async _findOwned(userId, notificationId) {
        const n = await this.Notification.findOne({ where: { id: notificationId, user_id: userId } });
        if (!n) throw new AppError("Notification not found", 404);
        return n;
    }

    async markAsRead(userId, notificationId) {
        await (await this._findOwned(userId, notificationId)).update({ read: true, read_at: new Date() });
        return { message: "Notification marked as read" };
    }

    async markAllAsRead(userId) {
        await this.Notification.update(
            { read: true, read_at: new Date() },
            { where: { user_id: userId, read: false } }
        );
        return { message: "All notifications marked as read" };
    }

    async deleteNotification(userId, notificationId) {
        await (await this._findOwned(userId, notificationId)).destroy();
        return { message: "Notification deleted" };
    }

    async deleteReadNotifications(userId) {
        const count = await this.Notification.destroy({ where: { user_id: userId, read: true } });
        return { message: "Read notifications deleted", count };
    }

    async notifyStarEarned({ userId, amount, type, description, balanceAfter, multiplier = 1 }) {
        const label = STAR_TYPE_LABELS[type] || "Nhận sao";
        const bonus = multiplier > 1 ? ` (x${multiplier})` : "";
        await this.createNotification({
            userId,
            type: "STAR_EARNED",
            title: `⭐ +${amount} sao${bonus}!`,
            message: `${label}: +${amount} sao. Số dư: ${balanceAfter} sao. ${description || ""}`.trim(),
            data: { amount, type, balance_after: balanceAfter, multiplier, description },
        });
    }

    async notifyStreakMilestone({ userId, streakCount, multiplier, starsEarned, isNewRecord }) {
        const TIER_MSG = {
            7:   "🔥 Bạn đã đạt streak 7 ngày! Nhận bonus x2!",
            30:  "💪 Wow! 30 ngày liên tiếp - Bạn là người kiên trì!",
            100: "🌟 Siêu streak 100 ngày! Bạn là huyền thoại!",
        };
        const hasBonus = streakCount >= 7;
        await this.createNotification({
            userId,
            type: "STREAK_MILESTONE",
            title: hasBonus ? `🔥 Streak ${streakCount} ngày - Bonus x2!` : `🔥 Streak ${streakCount} ngày!`,
            message: `${TIER_MSG[streakCount] || `🔥 Streak ${streakCount} ngày - Bonus x${multiplier}!`} +${starsEarned} sao${hasBonus ? " (x2 multiplier)" : ""}${isNewRecord ? " 🏆 Kỷ lục mới!" : ""}`,
            data: { streak_count: streakCount, multiplier, stars_earned: starsEarned, is_new_record: isNewRecord },
        });
    }

    async notifyAchievementUnlocked({ userId, achievement: a }) {
        await this.createNotification({
            userId,
            type: "ACHIEVEMENT_UNLOCKED",
            title: `🏅 Mở khóa: ${a.name}!`,
            message: `Bạn đã đạt được huy hiệu "${a.name}" - ${a.description}. Nhận +${a.star_reward} sao!`,
            data: {
                achievement_code: a.code, achievement_name: a.name,
                achievement_icon: a.icon, achievement_tier: a.tier,
                star_reward: a.star_reward,
            },
        });
    }

    async notifyRankUp({ userId, oldRank, newRank, starsNeeded, totalStars }) {
        const { emoji, name } = RANK_META[newRank];
        await this.createNotification({
            userId,
            type: "RANK_UP",
            title: `${emoji} Thăng rank: ${name}!`,
            message: `Chúc mừng bạn đã thăng lên ${name}! Tổng sao: ${totalStars.toLocaleString("vi-VN")}. Keep it up!`,
            data: {
                old_rank: oldRank, new_rank: newRank,
                rank_emoji: emoji, rank_name: name,
                stars_needed: starsNeeded, total_stars: totalStars,
            },
        });
    }

    async notifySurveyDeleted({ userId, surveyTitle }) {
        await this.createNotification({
            userId,
            type: "SURVEY_DELETED_PENALTY",
            title: "⚠️ Sao đã bị thu hồi",
            message: `Khảo sát "${surveyTitle}" đã bị xóa. -30 sao đã được thu hồi.`,
            data: { survey_title: surveyTitle, penalty_amount: 30 },
        });
    }

    async notifyLeaderboardUpdate({ userId, newRank, period, stars, percentile }) {
        const periodLabel = period === "WEEKLY" ? "Tuần này" : period === "MONTHLY" ? "Tháng này" : "All-time";
        await this.createNotification({
            userId,
            type: "LEADERBOARD_UPDATE",
            title: `🏆 Top ${newRank} - ${periodLabel}!`,
            message: `Bạn đang đứng ở vị trí #${newRank} với ${stars?.toLocaleString("vi-VN")} sao. Top ${percentile}% người chơi!`,
            data: { rank: newRank, period, stars, percentile },
        });
    }

    async notifyTop5Prize({ userId, rank, prize, period }) {
        const periodLabel = period === "WEEKLY" ? "tuần này" : "tháng này";
        await this.createNotification({
            userId,
            type: "TOP_PRIZE",
            title: `🎉 Chúc mừng! Top ${rank}!`,
            message: `Bạn đã đạt Top ${rank} ${periodLabel}! Phần thưởng: ${prize}`,
            data: { rank, prize, period },
        });
    }
}

export default new NotificationService();