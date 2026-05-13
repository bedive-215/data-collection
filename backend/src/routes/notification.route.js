import express from "express";
import notificationController from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const auth = new authMiddleware();

router.use(auth.auth);

router.get("/", notificationController.getNotifications.bind(notificationController));

router.get("/unread-count", notificationController.getUnreadCount.bind(notificationController));

router.put("/read-all", notificationController.markAllAsRead.bind(notificationController));

router.delete("/read", notificationController.deleteReadNotifications.bind(notificationController));

router.put("/:id/read", notificationController.markAsRead.bind(notificationController));

router.delete("/:id", notificationController.deleteNotification.bind(notificationController));

export default router;
