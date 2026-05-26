export function mapNotification(n) {
    return {
        id: n.id, type: n.type, title: n.title,
        message: n.message, data: n.data,
        read: n.read, readAt: n.read_at, createdAt: n.created_at,
    };
}
