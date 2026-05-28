export function mapNotification(n) {
  const d = n.dataValues || n;

  return {
    id: d.id,
    type: d.type ?? null,
    title: d.title,
    message: d.message,
    data: d.data ?? null,
    read: d.read,
    readAt: d.read_at ?? d.readAt ?? null,
    created_at: d.created_at ?? d.createdAt ?? null,
  };
}