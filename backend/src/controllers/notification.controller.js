import notificationService from "../services/notification.service.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;

            const result = await notificationService.getNotifications(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                unreadOnly: unreadOnly === "true"
            });

            res.status(200).json({
                message: "Get notifications successfully",
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService.getUnreadCount(userId);

            res.status(200).json({
                message: "Get unread count successfully",
                unreadCount: count
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            if (!id) {
                throw new AppError("Notification ID is required", 400);
            }

            const result = await notificationService.markAsRead(userId, id);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.markAllAsRead(userId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            if (!id) {
                throw new AppError("Notification ID is required", 400);
            }

            const result = await notificationService.deleteNotification(userId, id);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteReadNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.deleteReadNotifications(userId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new NotificationController();
