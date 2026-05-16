import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class NotificationService {
    constructor() {
        this.Notification = models.Notification;
        this.User = models.User;
        this.Survey = models.Survey;
        this.Response = models.Response;
        this.SurveyParticipant = models.SurveyParticipant;
    }

    async createNotification({ userId, type, title, message, data = null }) {
        try {
            const notification = await this.Notification.create({
                user_id: userId,
                survey_id: data?.surveyId || null,
                type,
                title,
                message,
                data
            });

            console.log(`[NotificationService] Created notification ${notification.id} for user ${userId}, type: ${type}`);

            const emit = () => {
                if (global.emitToUser) {
                    console.log(`[NotificationService] EMIT to userId: ${userId}`);
                    global.emitToUser(userId, "notification", {
                        id: notification.id,
                        type,
                        title,
                        message,
                        surveyId: data?.surveyId || null,
                        responseId: data?.responseId || null,
                        inviterId: data?.inviterId || null,
                        inviterName: data?.inviterName || null,
                        responderId: data?.responderId || null,
                        responderName: data?.responderName || null,
                        role: data?.role || null,
                        surveyTitle: data?.surveyTitle || null,
                        surveyEndAt: data?.surveyEndAt || null,
                        participantId: data?.participantId || null,
                        participantName: data?.participantName || null,
                        createdAt: notification.created_at,
                        read: false
                    });
                } else {
                    console.warn(`[NotificationService] global.emitToUser not ready, retrying in 1s for user ${userId}`);
                    setTimeout(emit, 1000);
                }
            };
            emit();

            return notification;
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    }

    async notifySurveyResponse({ survey, responder, responseId }) {
        const surveyOwner = await this.User.findByPk(survey.created_by);

        if (surveyOwner && surveyOwner.id !== responder.id) {
            const responseCount = await this.Response.count({
                where: { survey_id: survey.id }
            });

            await this.createNotification({
                userId: surveyOwner.id,
                type: "SURVEY_RESPONSE",
                title: "Có người trả lời khảo sát",
                message: `${responder.full_name || responder.email} đã trả lời khảo sát "${survey.title}"`,
                data: {
                    surveyId: survey.id,
                    surveyTitle: survey.title,
                    surveyEndAt: survey.end_at,
                    responseId,
                    responderId: responder.id,
                    responderName: responder.full_name || responder.email,
                    responseCount: responseCount || 1,
                    createdBy: survey.created_by
                }
            });

            await this._notifyAdmins({
                type: "SURVEY_RESPONSE",
                title: "Người dùng trả lời khảo sát",
                message: `${responder.full_name || responder.email} đã trả lời khảo sát "${survey.title}"`,
                data: {
                    surveyId: survey.id,
                    surveyTitle: survey.title,
                    responseId,
                    responderId: responder.id,
                    responderName: responder.full_name || responder.email,
                    createdBy: survey.created_by
                }
            });
        }
    }

    async notifySurveyInvitation({ survey, inviteeEmail, inviter, role }) {
        const invitee = await this.User.findOne({ where: { email: inviteeEmail } });
        const inviterAvatar = inviter.avatar_url || null;

        const roleLabel = role === "editor" ? "Biên tập viên"
            : role === "viewer" ? "Người xem"
            : role === "respondent" ? "Người trả lời" : role;

        const expireDate = survey.end_at
            ? `Hạn: ${new Date(survey.end_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}`
            : "Không có thời hạn";

        if (invitee) {
            await this.createNotification({
                userId: invitee.id,
                type: "SURVEY_INVITATION",
                title: "Bạn được mời tham gia khảo sát",
                message: `${inviter.full_name || inviter.email} đã mời bạn tham gia khảo sát "${survey.title}" với vai trò ${roleLabel}`,
                data: {
                    surveyId: survey.id,
                    surveyTitle: survey.title,
                    surveyEndAt: survey.end_at,
                    surveyDescription: survey.description,
                    inviterId: inviter.id,
                    inviterName: inviter.full_name || inviter.email,
                    inviterAvatar: inviterAvatar,
                    role,
                    roleLabel,
                    accessType: survey.access_type,
                    expireInfo: expireDate,
                    createdBy: survey.created_by
                }
            });
        }

        // Notify inviter about the invitation sent
        await this.createNotification({
            userId: inviter.id,
            type: "SURVEY_INVITATION_SENT",
            title: "Lời mời khảo sát đã được gửi",
            message: `Lời mời tham gia khảo sát "${survey.title}" đã được gửi tới ${inviteeEmail} với vai trò ${roleLabel}`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                surveyEndAt: survey.end_at,
                inviteeEmail,
                role,
                roleLabel,
                createdBy: survey.created_by
            }
        });
    }

    async notifyNewParticipant({ survey, participantEmail, participantId }) {
        if (survey.created_by === participantId) return;

        let participantName = participantEmail;
        try {
            const participant = await this.User.findByPk(participantId);
            if (participant) participantName = participant.full_name || participant.email;
        } catch (_) { /* ignore */ }

        const responseCount = await this.Response.count({
            where: { survey_id: survey.id }
        });

        await this.createNotification({
            userId: survey.created_by,
            type: "NEW_PARTICIPANT",
            title: "Có người tham gia khảo sát",
            message: `${participantName} đã tham gia khảo sát "${survey.title}"`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                surveyEndAt: survey.end_at,
                participantId,
                participantName,
                participantEmail,
                responseCount: responseCount || 0,
                createdBy: survey.created_by
            }
        });
    }

    async notifySurveyExpired({ survey }) {
        const responseCount = await this.Response.count({
            where: { survey_id: survey.id }
        });

        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_EXPIRED",
            title: "Khảo sát đã hết hạn",
            message: `Khảo sát "${survey.title}" đã hết hạn vào ${new Date(survey.end_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })} — ${responseCount} câu trả lời`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                surveyEndAt: survey.end_at,
                surveyDescription: survey.description,
                responseCount: responseCount || 0,
                createdBy: survey.created_by
            }
        });

        await this._notifyAdmins({
            type: "SURVEY_EXPIRED",
            title: "Khảo sát đã hết hạn",
            message: `Khảo sát "${survey.title}" (ID: ${survey.id}) đã hết hạn`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                createdBy: survey.created_by
            }
        });
    }

    async notifySurveyPublished({ survey }) {
        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_PUBLISHED",
            title: "Khảo sát đã được công khai",
            message: `Khảo sát "${survey.title}" của bạn đã được công khai và sẵn sàng nhận câu trả lời`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                surveyEndAt: survey.end_at,
                surveyDescription: survey.description,
                createdBy: survey.created_by
            }
        });
    }

    async notifySurveyClosed({ survey }) {
        const responseCount = await this.Response.count({
            where: { survey_id: survey.id }
        });

        await this.createNotification({
            userId: survey.created_by,
            type: "SURVEY_CLOSED",
            title: "Khảo sát đã đóng",
            message: `Khảo sát "${survey.title}" đã được đóng lại — ${responseCount} câu trả lời`,
            data: {
                surveyId: survey.id,
                surveyTitle: survey.title,
                surveyEndAt: survey.end_at,
                responseCount: responseCount || 0,
                createdBy: survey.created_by
            }
        });

        const participants = await this.SurveyParticipant.findAll({
            where: { survey_id: survey.id }
        });

        for (const participant of participants) {
            if (participant.user_id) {
                await this.createNotification({
                    userId: participant.user_id,
                    type: "SURVEY_CLOSED",
                    title: "Khảo sát đã đóng",
                    message: `Khảo sát "${survey.title}" mà bạn tham gia đã đóng lại`,
                    data: {
                        surveyId: survey.id,
                        surveyTitle: survey.title,
                        createdBy: survey.created_by
                    }
                });
            }
        }
    }

    async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        const offset = (page - 1) * limit;
        const where = { user_id: userId };

        if (unreadOnly) {
            where.read = false;
        }

        const { rows, count } = await this.Notification.findAndCountAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset
        });

        const unreadCount = await this.Notification.count({
            where: {
                user_id: userId,
                read: false
            }
        });

        return {
            notifications: rows.map(n => this._mapNotification(n)),
            total: count,
            unreadCount,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    async getUnreadCount(userId) {
        return await this.Notification.count({
            where: {
                user_id: userId,
                read: false
            }
        });
    }

    async markAsRead(userId, notificationId) {
        const notification = await this.Notification.findOne({
            where: {
                id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        await notification.update({
            read: true,
            read_at: new Date()
        });

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
        const notification = await this.Notification.findOne({
            where: {
                id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        await notification.destroy();

        return { message: "Notification deleted" };
    }

    async deleteReadNotifications(userId) {
        const deleted = await this.Notification.destroy({
            where: {
                user_id: userId,
                read: true
            }
        });

        return {
            message: "Read notifications deleted",
            count: deleted
        };
    }

    async _notifyAdmins({ type, title, message, data }) {
        const admins = await this.User.findAll({
            where: { role: "admin" }
        });

        for (const admin of admins) {
            await this.createNotification({
                userId: admin.id,
                type,
                title,
                message,
                data
            });
        }
    }

    _mapNotification(notification) {
        return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: notification.read,
            readAt: notification.read_at,
            createdAt: notification.created_at
        };
    }
}

export default new NotificationService();
