// ─── SurveyCardHome.jsx ────────────────────────────────────────────────
// Premium Survey Card — identical design to the web SurveyCard component.
// Variants: "my" (MySurveys — has lock + share), "public" (no actions)
// ─────────────────────────────────────────────────────────────────────

import React from "react";
import {
  FileText, Calendar, Lock, Share, BarChart3,
  Edit, Trash2, Globe,
  X, Link as LinkIcon, ExternalLink,
  Copy, CheckCircle2, Loader2,
} from "lucide-react";

/* ── Color Token (matches SurveyCard) ────────────────────────────── */
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
  font:          "'Plus Jakarta Sans','DM Sans',sans-serif",
};

/* ── Status config (matches SurveyCard STATUS_CONFIG) ────────────── */
export const STATUS_CONFIG_MOBILE = {
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

// Legacy export alias for backward compatibility
export const STATUS_MAP = STATUS_CONFIG_MOBILE;
export const SC = {
  surface: "rgba(255,255,255,0.78)",
  surfaceHigh: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(255,255,255,0.55)",
  primary: "#4f46e5",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  font: "'Plus Jakarta Sans','DM Sans','Inter',sans-serif",
  thumbGrads: [
    "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
    "conic-gradient(from 0deg at 50% 50%, #a8edea, #fed6e3, #ff9999, #a8edea)",
    "conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #f093fb, #667eea)",
    "conic-gradient(from 0deg at 50% 50%, #f5af19, #f12711, #fa709a, #f5af19)",
    "conic-gradient(from 0deg at 50% 50%, #4facfe, #00f2fe, #43e97b, #4facfe)",
    "conic-gradient(from 0deg at 50% 50%, #30cfd0, #330867, #a8edea, #30cfd0)",
  ],
};

function getStatusConfig(status) {
  return STATUS_CONFIG_MOBILE[status?.toUpperCase()] || STATUS_CONFIG_MOBILE.DRAFT;
}

/* ── Pulse dot animation (matches SurveyCard) ─────────────────────── */
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

/* ── Status Badge — glass style (matches SurveyCard) ─────────────── */
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

/* ── ActionButton — glass style (matches SurveyCard) ─────────────── */
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

/* ── Participants Avatars (matches SurveyCard) ─────────────────────── */
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

export function ParticipantsAvatars({ participants, max = 3 }) {
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

/* ── Date formatter (matches SurveyCard) ─────────────────────────── */
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
/* SurveyCardHome — identical design to SurveyCard (web)              */
/* type: "my" (has lock/share) | "public" (no actions)               */
/* overrideStatus: force a status (e.g. "COMPLETED")                */
/* onClick: card click handler                                        */
/* onShare(surveyId): open share modal                               */
/* onLock(surveyId): close survey                                     */
/* ──────────────────────────────────────────────────────────────────── */
export function SurveyCardHome({
  survey,
  index = 0,
  onClick,
  type = "my",
  overrideStatus = null,
  onShare,
  onLock,
  // Extended action callbacks (for mobile owner card)
  onEdit,
  onDelete,
  onPublish,
  onViewAnalytics,
}) {
  const isOwner   = type === "my";
  const status    = overrideStatus || survey?.status;
  const cfg       = getStatusConfig(status);
  const isPublished = survey?.is_published;
  const surveyParts  = survey?.participants;

  const handleCardClick = () => {
    if (onClick) { onClick(survey); return; }
  };

  return (
    <article
      onClick={handleCardClick}
      style={{
        background: "#fff",
        borderRadius: 40,
        border: "1px solid rgba(0,0,0,0.05)",
        overflow: "hidden",
        boxShadow: "0 32px 64px -16px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        width: "100%",
        position: "relative",
        fontFamily: C.font,
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
        height: 144,
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
          {/* Lock button */}
          {isOwner && onLock && (
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
          {/* Analytics button */}
          {isOwner && onViewAnalytics && (
            <ActionButton onClick={e => { e.stopPropagation(); onViewAnalytics(survey.id); }} title="Phân tích">
              <BarChart3 size={16} />
            </ActionButton>
          )}
          {/* Edit button */}
          {isOwner && onEdit && (
            <ActionButton onClick={e => { e.stopPropagation(); onEdit(survey.id); }} title="Chỉnh sửa">
              <Edit size={16} />
            </ActionButton>
          )}
          {/* Publish toggle */}
          {isOwner && onPublish && (
            <ActionButton onClick={e => { e.stopPropagation(); onPublish(survey.id); }} title={isPublished ? "Bỏ công khai" : "Công khai"}>
              {isPublished ? <Lock size={16} /> : <Globe size={16} />}
            </ActionButton>
          )}
          {/* Delete button */}
          {isOwner && onDelete && (
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

/* ── ShareModal — shared across all pages (kept for backward compat) ── */
export function ShareModal({ open, onClose, surveyTitle, shareUrl, loading, error, onGenerate }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => { if (!open) setCopied(false); }, [open]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "fadeIn .16s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 24, border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)",
          width: "100%", maxWidth: 440, overflow: "hidden",
          animation: "slideUp .22s cubic-bezier(.16,1,.3,1)",
          fontFamily: C.font,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #4361ee, #6c7ef7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Chia sẻ khảo sát</div>
              <div style={{ fontSize: 11, color: C.textSub, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {surveyTitle}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, transition: "all .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
              <button type="button" onClick={onGenerate} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(255,255,255,0.8)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Thử lại
              </button>
            </div>
          )}

          {shareUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "slideUpAnim .2s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(67,97,238,0.06)", borderRadius: 12, border: "1px solid rgba(67,97,238,0.18)", backdropFilter: "blur(8px)" }}>
                <LinkIcon size={13} color="#4f46e5" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'SF Mono','Fira Code',monospace" }}>
                  {shareUrl}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={handleCopy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 11, border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : "rgba(67,97,238,0.3)"}`, background: copied ? "rgba(16,185,129,0.08)" : "rgba(67,97,238,0.06)", color: copied ? "#10b981" : "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                  {copied ? <><CheckCircle2 size={13} /> Đã sao chép!</> : <><Copy size={13} /> Sao chép link</>}
                </button>
                <button type="button" onClick={() => window.open(shareUrl, "_blank")} style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: C.textSub, cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.borderColor = "rgba(67,97,238,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={onGenerate} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: loading ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg,#4361ee,#6c7ef7)", color: loading ? C.textSub : "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: C.font, boxShadow: loading ? "none" : "0 4px 14px rgba(67,97,238,0.35)", transition: "all .2s" }}>
              {loading ? <><Loader2 size={15} style={{ animation: "spinAnim 1s linear infinite" }} /> Đang tạo link...</> : <><LinkIcon size={15} /> Tạo link chia sẻ</>}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes slideUpAnim { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

