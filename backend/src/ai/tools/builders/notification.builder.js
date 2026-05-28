import { formatDate } from "../../../helpers/aiChat.helper.js";

export function buildNotificationListMessage(notifications, unreadCount) {
  const header = buildHeader(unreadCount);

  if (!notifications.length) {
    return `${header}\n\nBạn không có thông báo nào.`;
  }

  const items = notifications.map(buildNotificationItem);

  return [
    header,
    "",
    items.join("\n\n"),
    "",
    buildFooter(unreadCount),
  ]
    .filter(Boolean)
    .join("\n");
}


function buildHeader(unreadCount) {
  if (unreadCount > 0) {
    return `Thông báo (${unreadCount} chưa đọc)`;
  }
  return "Thông báo";
}

function buildNotificationItem(notification) {
  const { title, message, created_at, read } = notification;
  const status = read ? "[Đã đọc]" : "[Chưa đọc]";

  return [
    `${status} ${title}`,
    message,
    `_${formatDate(created_at)}_`,
  ].join("\n");
}

function buildFooter(unreadCount) {
  if (!unreadCount) {
    return "Bạn đã xem tất cả thông báo.";
  }

  return "\nNhấn vào thông báo để đánh dấu đã đọc.";
}