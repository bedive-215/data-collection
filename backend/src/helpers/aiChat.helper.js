export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getStatusEmoji(status) {
  return {
    ACTIVE: "🟢",
    SCHEDULED: "🟡",
    CLOSED: "⚫",
  }[status] || "⚫";
}