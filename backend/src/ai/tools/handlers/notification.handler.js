import Notification  from "../../../models/index.js";
import { buildNotificationListMessage } from "../builders/notification.builder.js";
import { mapNotification } from "../../../mappers/notification.mapper.js";

export async function getNotificationList({ args, user }) {
  const notifications = await Notification.findAll({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
    limit: 10,
    attributes: ["id", "title", "message", "is_read", "created_at"],
  });

  const mapped = notifications.map(mapNotification);

  const unreadCount = mapped.filter((n) => !n.is_read).length;

  return {
    data: {
      notifications: mapped,
      unread_count: unreadCount,
    },
    message: buildNotificationListMessage(mapped, unreadCount),
    meta: { tool: "get_notifications" },
  };
}