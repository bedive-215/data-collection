export function buildNotificationListMessage(notifications, unreadCount) {
    const header = `🔔 **Thông báo**${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""
        }`;

    if (!notifications.length) {
        return buildList(header, ["Bạn không có thông báo nào."]);
    }

    const lines = notifications.map((n) => {
        const prefix = n.is_read ? "  " : "🔵";

        return [
            `${prefix} **${n.title}**`,
            `   ${n.message}`,
            `   📅 ${formatDate(n.created_at)}`,
        ].join("\n");
    });

    return buildList(header, lines);
}