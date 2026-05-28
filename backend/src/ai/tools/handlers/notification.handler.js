import models  from "../../../models/index.js";
import { buildNotificationListMessage } from "../builders/notification.builder.js";
import { mapNotification } from "../../../mappers/notification.mapper.js";
import { Op } from "sequelize";
import { AppError } from "../../../middlewares/handleException.middlware.js";

const { Notification } = models;

export async function getNotificationList({ args, user }) {
  const notifications = await Notification.findAll({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
    limit: 10,
    attributes: ["id", "title", "message", "read", "created_at"],
  });

  const mapped = notifications.map(mapNotification);

  const unreadCount = mapped.filter((n) => !n.read).length;

  return {
    data: {
      notifications: mapped,
      unread_count: unreadCount,
    },
    _reply: buildNotificationListMessage(mapped, unreadCount),
    meta: { tool: "get_notifications" },
  };
}