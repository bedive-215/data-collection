export const STATUS_CONFIG = {
  ACTIVE:    { label: "Đang mở",        color: "#0284c7", accent: "#6366f1", pillBg: "rgba(99,102,241,0.10)", pillText: "#4648d4", pillBorder: "rgba(99,102,241,0.18)" },
  DRAFT:     { label: "Nháp",           color: "#6366f1", accent: "#94a3b8", pillBg: "rgba(148,163,184,0.10)", pillText: "#64748b", pillBorder: "rgba(148,163,184,0.18)" },
  EXPIRED:   { label: "Hết hạn",        color: "#db2777", accent: "#ef4444", pillBg: "rgba(239,68,68,0.10)", pillText: "#dc2626", pillBorder: "rgba(239,68,68,0.18)" },
  CLOSED:    { label: "Đã đóng",        color: "#94a3b8", accent: "#9ca3af", pillBg: "rgba(156,163,175,0.08)", pillText: "#6b7280", pillBorder: "rgba(156,163,175,0.15)" },
  SCHEDULED: { label: "Lên lịch",       color: "#d97706", accent: "#0284c7", pillBg: "rgba(2,132,199,0.10)", pillText: "#0369a1", pillBorder: "rgba(2,132,199,0.18)" },
  COMPLETED: { label: "Đã hoàn thành",  color: "#059669", accent: "#059669", pillBg: "rgba(5,150,105,0.10)", pillText: "#047857", pillBorder: "rgba(5,150,105,0.18)" },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.DRAFT;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return "Không rõ";
  const date = new Date(dateStr);
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
}

export function getExpiry(survey) {
  if (!survey?.end_at) return null;
  const end = new Date(survey.end_at);
  return {
    text: end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" }),
    isExpired: end < new Date(),
  };
}

export const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#6d28d9" },
];

export function getInitials(name, email) {
  if (name) return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}

export function StatusBadge({ status, pillBg, pillText, pillBorder }) {
  const cfg = getStatusConfig(status);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      background: pillBg || cfg.pillBg,
      border: `1px solid ${pillBorder || cfg.pillBorder}`,
    }}>
      {status === "ACTIVE" && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "inline-block",}} />
      )}
      <span style={{ fontSize: 10, fontWeight: 700, color: pillText || cfg.pillText, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {cfg.label}
      </span>
    </div>
  );
}

export function SurveyCardSkeleton() {
  return (
    <div style={{
      borderRadius: 12, overflow: "hidden", background: "#fff",
      border: "1px solid rgba(199,196,215,0.3)", minHeight: 320,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: 70, height: 20, borderRadius: 999, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ padding: "8px 24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: 16, borderRadius: 6, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "60%", height: 12, borderRadius: 6, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "8px 24px 16px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: 70, height: 16, borderRadius: 6, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 50, height: 24, borderRadius: 12, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

export function ParticipantsAvatars({ participants, max = 3, size = 28 }) {
  if (!participants?.length) return null;
  const visible = participants.slice(0, max);
  const extra = participants.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((p, i) => {
        const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <div key={p.id || i} title={p.email || p.name || ""} style={{
            width: size, height: size, borderRadius: "50%", border: "2px solid #fff",
            background: ac.bg, color: ac.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: Math.round(size * 0.32), fontWeight: 700,
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.28),
            zIndex: visible.length - i, position: "relative", flexShrink: 0,
          }}>
            {getInitials(p.name, p.email)}
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: "50%", border: "2px solid #fff",
          background: "#f1f5f9", color: "#64748b",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.round(size * 0.32), fontWeight: 700,
          marginLeft: -Math.round(size * 0.28), position: "relative",
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}
