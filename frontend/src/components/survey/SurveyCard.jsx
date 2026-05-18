// ─── SurveyCard.jsx ──────────────────────────────────────────────────
// Premium Survey Card — matches the exact design from the provided HTML template.
// Variants: "user" (public surveys — no lock), "owner" (MySurveys — has lock)
// ─────────────────────────────────────────────────────────────────────

import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  Lock,
  Share,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Globe,
  Clock,
} from "lucide-react";

/* ── Color Token ───────────────────────────────────────────────────── */
const C = {
  primary:       "#4f46e5",
  primaryLight:  "rgba(79,70,229,0.12)",
  primaryBorder: "rgba(79,70,229,0.25)",
  success:       "#10b981",
  successLight:  "rgba(16,185,129,0.12)",
  warning:       "#f59e0b",
  warningLight:  "rgba(245,158,11,0.12)",
  error:         "#ef4444",
  errorLight:    "rgba(239,68,68,0.12)",
  gray:          "#6b7280",
  grayLight:     "rgba(107,114,128,0.12)",
  text:          "#0f172a",
  textSub:       "#64748b",
  textDim:       "#94a3b8",
  font:          "'Plus Jakarta Sans', 'DM Sans', sans-serif",
};

/* ── Status config ──────────────────────────────────────────────────── */
export const STATUS_CONFIG = {
  ACTIVE: {
    label:      "Đang mở",
    color:      C.success,
    bg:         C.successLight,
    border:     "rgba(16,185,129,0.25)",
    pulseColor: "#10b981",
    meshGrad:   "radial-gradient(at 0% 0%, hsla(168, 64%, 85%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(335, 76%, 92%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(45, 89%, 90%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(196, 81%, 90%, 1) 0px, transparent 50%), radial-gradient(at 50% 50%, hsla(271, 72%, 93%, 1) 0px, transparent 50%), #ffffff",
    iconBg:     "rgba(255,255,255,0.25)",
    iconInner:  "rgba(255,255,255,0.35)",
  },
  DRAFT: {
    label:      "Nháp",
    color:      C.gray,
    bg:         C.grayLight,
    border:     "rgba(107,114,128,0.2)",
    pulseColor: null,
    meshGrad:   "radial-gradient(at 0% 0%, hsla(215, 20%, 95%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(220, 13%, 91%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(215, 13%, 86%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(215, 16%, 90%, 1) 0px, transparent 50%), #f3f4f6",
    iconBg:     "rgba(255,255,255,0.25)",
    iconInner:  "rgba(255,255,255,0.35)",
  },
  EXPIRED: {
    label:      "Hết hạn",
    color:      C.error,
    bg:         C.errorLight,
    border:     "rgba(239,68,68,0.2)",
    pulseColor: null,
    meshGrad:   "radial-gradient(at 0% 0%, hsla(0, 86%, 95%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(0, 86%, 90%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(0, 86%, 85%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(0, 80%, 92%, 1) 0px, transparent 50%), #fef2f2",
    iconBg:     "rgba(255,255,255,0.25)",
    iconInner:  "rgba(255,255,255,0.35)",
  },
  CLOSED: {
    label:      "Đã đóng",
    color:      C.gray,
    bg:         C.grayLight,
    border:     "rgba(107,114,128,0.2)",
    pulseColor: null,
    meshGrad:   "radial-gradient(at 0% 0%, hsla(215, 20%, 95%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(220, 13%, 91%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(215, 13%, 86%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(215, 16%, 90%, 1) 0px, transparent 50%), #f8fafc",
    iconBg:     "rgba(255,255,255,0.2)",
    iconInner:  "rgba(255,255,255,0.3)",
  },
  SCHEDULED: {
    label:      "Lên lịch",
    color:      C.warning,
    bg:         C.warningLight,
    border:     "rgba(245,158,11,0.2)",
    pulseColor: null,
    meshGrad:   "radial-gradient(at 0% 0%, hsla(48, 96%, 95%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(48, 92%, 90%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(45, 93%, 85%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(48, 96%, 92%, 1) 0px, transparent 50%), #fffbeb",
    iconBg:     "rgba(255,255,255,0.25)",
    iconInner:  "rgba(255,255,255,0.35)",
  },
  COMPLETED: {
    label:      "Đã hoàn thành",
    color:      "#06b6d4",
    bg:         "rgba(6,182,212,0.12)",
    border:     "rgba(6,182,212,0.2)",
    pulseColor: null,
    meshGrad:   "radial-gradient(at 0% 0%, hsla(187, 92%, 95%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(188, 86%, 92%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(189, 80%, 88%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(186, 84%, 93%, 1) 0px, transparent 50%), #ecfeff",
    iconBg:     "rgba(255,255,255,0.25)",
    iconInner:  "rgba(255,255,255,0.35)",
  },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.DRAFT;
}

/* ── Pulse dot animation ───────────────────────────────────────────── */
function PulseDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.75,
        animation: "surveyPulse 2s ease-out infinite",
      }} />
      <span style={{
        position: "relative", display: "inline-block",
        width: 8, height: 8, borderRadius: "50%",
        background: color,
      }} />
      <style>{`
        @keyframes surveyPulse {
          0%   { transform: scale(0.8); opacity: 0.75; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

/* ── Status Badge (glass style) ──────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.4)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.5)",
    }}>
      {cfg.pulseColor && <PulseDot color={cfg.pulseColor} />}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: cfg.color,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: C.font,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ── IconButton (glass style, top-right) ────────────────────────── */
function ActionButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 36, height: 36,
        borderRadius: 12,
        background: "rgba(255,255,255,0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.5)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#374151",
        transition: "all 0.3s ease",
        boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.75)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}
    >
      {children}
    </button>
  );
}

/* ── Participants Avatars ──────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#6d28d9" },
];

function getInitials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}

function ParticipantsAvatars({ participants, max = 3 }) {
  if (!participants || participants.length === 0) return null;
  const visible = participants.slice(0, max);
  const extra   = participants.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex" }}>
        {visible.map((p, i) => {
          const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div
              key={p.id || i}
              title={p.email || p.name || ""}
              style={{
                width: 32, height: 32,
                borderRadius: "50%",
                border: "2px solid white",
                background: ac.bg,
                color: ac.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                marginLeft: i === 0 ? 0 : -8,
                zIndex: visible.length - i,
                position: "relative",
                flexShrink: 0,
              }}
            >
              {getInitials(p.name, p.email)}
            </div>
          );
        })}
      </div>
      {extra > 0 && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid white", background: "#f1f5f9",
          color: C.textSub, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 9, fontWeight: 700,
          marginLeft: -8, zIndex: 0, position: "relative",
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ── Date helpers ─────────────────────────────────────────────────── */
function formatRelativeTime(dateStr) {
  if (!dateStr) return "Không rõ";
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now - date;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7)  return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
}

/* ──────────────────────────────────────────────────────────────────── */
/* Main SurveyCard
/* Variants:
/*   "user"    — public surveys page, no lock button
/*   "owner"   — MySurveys, has lock + share + analytics buttons
/*   "admin"   — admin dark theme, has all action buttons
/*   "compact" — single-line compact row
/*   "list"    — list row variant
/* ──────────────────────────────────────────────────────────────────── */
export default function SurveyCard({
  survey,
  index = 0,
  variant = "user",   // "user" | "owner" | "admin" | "compact" | "list"
  // Navigation / callbacks
  onEdit,
  onDelete,
  onShare,
  onPublish,
  onViewAnalytics,
  onClick,
  onLock,
  // Selection
  selected = false,
  checked = false,
  onSelect,
  // Meta
  participants,
}) {
  const navigate  = useNavigate();
  const isOwner  = variant === "owner";
  const isAdmin  = variant === "admin";
  const isCompact = variant === "compact";
  const isList    = variant === "list";

  const status     = survey?.status;
  const isPublished = survey?.is_published;
  const isClosed    = status === "CLOSED";
  const cfg         = getStatusConfig(status);
  const surveyParts = participants || survey?.participants;

  const handleCardClick = () => {
    if (onClick) { onClick(survey); return; }
    const route = isAdmin
      ? `/admin/surveys/${survey.id}/analytics`
      : `/user/my-surveys/${survey.id}/studio`;
    navigate(route);
  };

  /* ── Compact variant ─────────────────────── */
  if (isCompact) {
    return (
      <div
        onClick={handleCardClick}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px",
          background: "#fff",
          borderRadius: 14,
          border: `1px solid ${selected ? C.primaryBorder : "#e8ecf5"}`,
          boxShadow: selected ? "0 0 0 2px rgba(79,70,229,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = C.primaryBorder; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#e8ecf5"; }}
      >
        {onSelect && (
          <input type="checkbox" checked={checked}
            onChange={() => onSelect(survey.id)}
            onClick={e => e.stopPropagation()}
            style={{ accentColor: C.primary, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
          />
        )}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: cfg.bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FileText size={18} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {survey.title}
          </div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
            {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
    );
  }

  /* ── List variant ────────────────────────── */
  if (isList) {
    return (
      <div
        onClick={handleCardClick}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 18px",
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${selected ? C.primaryBorder : "#e8ecf5"}`,
          boxShadow: selected ? "0 0 0 2px rgba(79,70,229,0.15)" : "0 1px 6px rgba(0,0,0,0.04)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateX(4px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateX(0)";
          e.currentTarget.style.boxShadow = selected ? "0 0 0 2px rgba(79,70,229,0.15)" : "0 1px 6px rgba(0,0,0,0.04)";
        }}
      >
        {onSelect && (
          <input type="checkbox" checked={checked}
            onChange={() => onSelect(survey.id)}
            onClick={e => e.stopPropagation()}
            style={{ accentColor: C.primary, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
          />
        )}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: cfg.meshGrad,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FileText size={22} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
            {survey.title}
          </div>
          <div style={{ fontSize: 12, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {survey.description || "Không có mô tả"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <StatusBadge status={status} />
          {isPublished && <Globe size={14} color={C.primary} style={{ flexShrink: 0 }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.textDim, fontSize: 12, flexShrink: 0 }}>
          <Clock size={13} />
          <span>{formatRelativeTime(survey.created_at)}</span>
        </div>
        <ParticipantsAvatars participants={surveyParts} />
      </div>
    );
  }

  /* ── Grid card variant ───────────────────── */
  return (
    <article
      onClick={handleCardClick}
      style={{
        background: "#fff",
        borderRadius: 40,
        border: `1px solid rgba(0,0,0,0.05)`,
        overflow: "hidden",
        boxShadow: "0 32px 64px -16px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        width: "100%",
        position: "relative",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 48px 80px -24px rgba(0,0,0,0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 32px 64px -16px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Top Section: Mesh Gradient Header ── */}
      <section style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        height: 144,   // h-36
        background: cfg.meshGrad,
        flexShrink: 0,
      }}>
        {/* Status Badge — top left */}
        <div style={{
          position: "absolute", top: 16, left: 20, zIndex: 10,
        }}>
          <StatusBadge status={status} />
        </div>

        {/* Action Buttons — top right */}
        <div style={{
          position: "absolute", top: 16, right: 20, zIndex: 10,
          display: "flex", gap: 8,
        }}>
          {/* Lock button — only for owner/admin pages */}
          {(isOwner || isAdmin) && onLock && (
            <ActionButton onClick={e => { e.stopPropagation(); onLock(survey.id); }} title="Khóa khảo sát">
              <Lock size={16} />
            </ActionButton>
          )}
          {/* Share button */}
          {onShare && (
            <ActionButton onClick={e => { e.stopPropagation(); onShare(survey.id); }} title="Chia sẻ">
              <Share size={16} />
            </ActionButton>
          )}
          {/* Analytics button — owner/admin */}
          {(isOwner || isAdmin) && onViewAnalytics && (
            <ActionButton onClick={e => { e.stopPropagation(); onViewAnalytics(survey.id); }} title="Phân tích">
              <BarChart3 size={16} />
            </ActionButton>
          )}
          {/* Edit button — owner/admin */}
          {(isOwner || isAdmin) && onEdit && (
            <ActionButton onClick={e => { e.stopPropagation(); onEdit(survey.id); }} title="Chỉnh sửa">
              <Edit size={16} />
            </ActionButton>
          )}
          {/* Publish toggle — owner/admin */}
          {(isOwner || isAdmin) && onPublish && (
            <ActionButton onClick={e => { e.stopPropagation(); onPublish(survey.id); }} title={isPublished ? "Bỏ công khai" : "Công khai"}>
              {isPublished ? <Lock size={16} /> : <Globe size={16} />}
            </ActionButton>
          )}
          {/* Delete button — owner/admin */}
          {(isOwner || isAdmin) && onDelete && (
            <ActionButton onClick={e => { e.stopPropagation(); onDelete(survey.id); }} title="Xóa">
              <Trash2 size={16} />
            </ActionButton>
          )}
        </div>

        {/* Central Document Icon */}
        <div style={{
          width: 80, height: 80,
          borderRadius: 28,
          background: cfg.iconBg,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 8px 32px rgba(31,38,135,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.5s ease",
          position: "relative", zIndex: 5,
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            background: cfg.iconInner,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FileText size={28} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
          </div>
        </div>

        {/* Bottom Blur Edge */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 32,
          background: "linear-gradient(to top, #fff, transparent)",
          pointerEvents: "none",
        }} />
      </section>

      {/* ── Bottom Section: Content ── */}
      <section style={{
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "20px 32px 16px",
        gap: 12,
        flex: 1,
      }}>
        {/* Title */}
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            transition: "transform 0.3s ease",
          }}>
            {survey.title}
          </h2>
          <p style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: C.textSub,
            lineHeight: 1.6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            opacity: 0.85,
          }}>
            {survey.description || "Không có mô tả"}
          </p>
        </div>

        {/* Footer Info */}
        <div style={{
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 14,
          marginTop: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px solid #e8ecf5",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={16} color={C.textDim} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Cập nhật
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>
                {formatRelativeTime(survey.updated_at || survey.created_at)}
              </div>
            </div>
          </div>
          <ParticipantsAvatars participants={surveyParts} />
        </div>
      </section>
    </article>
  );
}
