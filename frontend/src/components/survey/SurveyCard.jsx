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
  Mail,
  UserPlus,
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
        animation: "pulseDot 2s infinite",
      }} />
      <span style={{
        position: "relative", display: "inline-block",
        width: 8, height: 8, borderRadius: "50%",
        background: color,
      }} />
      <style>{`
        @keyframes pulseDot {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </span>
  );
}

/* ── Status Badge — glass style ──────────────────────────────────── */
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

/* ── Shared button styles ─────────────────────────────────────── */
const chipBtn = {
  width: 24, height: 24, borderRadius: 6,
  border: `1px solid ${C.border}`, background: "transparent",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  color: C.textDim, transition: "all 0.15s",
};

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

/* ── Survey time formatter (matches mobile card) ─────────────────── */
function formatSurveyTime(survey) {
  if (!survey) return "Không rõ";
  const now = new Date();
  if (survey.end_at) {
    const end = new Date(survey.end_at);
    if (end < now) return `Hết hạn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
    return `Còn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  if (survey.start_at) {
    const start = new Date(survey.start_at);
    if (start > now) return `Sắp tới · ${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  return "Không giới hạn";
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
  // New callbacks to match MySurveysPage
  onInvite,
  onBulkInvite,
  onGetParticipants,
  onDeleteParticipant,
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
        border: "1px solid #f1f5f9",
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
      {/* ── Header: mesh gradient ── */}
      <div style={{
        height: 144,
        background: cfg.meshGrad,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Status Badge — top left */}
        <div style={{position:"absolute", top:16, left:24, zIndex:10}}>
          <StatusBadge status={status}/>
        </div>

        {/* Action Buttons — top right */}
        <div style={{position:"absolute", top:16, right:24, display:"flex", gap:8, zIndex:10}}
          onClick={e => e.stopPropagation()}
        >
          {/* Lock */}
          {(isOwner || isAdmin) && onLock && (
            <button onClick={() => onLock(survey.id)} title="Khóa / Đóng khảo sát"
              style={{width:36,height:36,borderRadius:12,background:"rgba(255,255,255,0.4)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.5)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#374151",transition:"all .3s ease",boxShadow:"0 8px 32px rgba(31,38,135,0.07)"}}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}>
              <Lock size={18}/>
            </button>
          )}
          {/* Share */}
          {onShare && (
            <button onClick={() => onShare(survey.id)} title="Chia sẻ"
              style={{width:36,height:36,borderRadius:12,background:"rgba(255,255,255,0.4)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.5)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#374151",transition:"all .3s ease",boxShadow:"0 8px 32px rgba(31,38,135,0.07)"}}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}>
              <Share size={18}/>
            </button>
          )}
        </div>

        {/* Central Document Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 28,
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 8px 32px rgba(31,38,135,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 5,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={28} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
          </div>
        </div>

        {/* Bottom Blur Edge */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 32, background: "linear-gradient(to top, white, transparent)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Content (pixel-perfect match) ── */}
      <div style={{
        background: "#fff",
        display: "flex", flexDirection: "column",
        padding: "16px 32px 16px",
        gap: 12, flex: 1,
      }}>
        {/* Title */}
        <div>
          <h2 style={{margin:0, fontSize:26, fontWeight:700, color:C.text, lineHeight:1.25, letterSpacing:"-0.025em", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", transition:"transform 0.3s ease"}}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; }}
          >
            {survey.title}
          </h2>
          <p style={{margin:"8px 0 0", fontSize:15, fontWeight:500, color:C.textSub, lineHeight:1.625, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", opacity:0.8}}>
            {survey.description || "Không có mô tả"}
          </p>
        </div>

        {/* Footer */}
        <div style={{borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, marginTop:2}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Calendar size={18} color={C.textDim}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.1em"}}>Cập nhật</div>
              <div style={{fontSize:14,fontWeight:600,color:C.textSub}}>
                {formatSurveyTime(survey)}
              </div>
            </div>
          </div>
          {/* Quick actions */}
          <div style={{display:"flex", gap:6}} onClick={e => e.stopPropagation()}>
            {onInvite && (
              <button onClick={() => onInvite(survey.id)} style={chipBtn} title="Mời"
                onMouseEnter={e => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                <Mail size={11}/>
              </button>
            )}
            {onBulkInvite && (
              <button onClick={() => onBulkInvite(survey.id)} style={chipBtn} title="Mời hàng loạt"
                onMouseEnter={e => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                <UserPlus size={11}/>
              </button>
            )}
            {onGetParticipants && (
              <button onClick={() => onGetParticipants(survey.id)} style={chipBtn} title="Người tham gia"
                onMouseEnter={e => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                <Users size={11}/>
              </button>
            )}
            {onPublish && (
              <button onClick={() => onPublish(survey.id)} style={{
                ...chipBtn,
                background: isPublished ? "rgba(245,158,11,0.12)" : "transparent",
                color: isPublished ? C.warning : C.textDim,
                borderColor: isPublished ? "rgba(245,158,11,0.25)" : C.border,
              }} title={isPublished ? "Bỏ công khai" : "Công khai"}
                onMouseEnter={e => { e.currentTarget.style.background = isPublished ? "rgba(245,158,11,0.2)" : C.primaryLight; e.currentTarget.style.color = isPublished ? C.warning : C.primary; e.currentTarget.style.borderColor = isPublished ? "rgba(245,158,11,0.35)" : C.primaryBorder; }}
                onMouseLeave={e => { e.currentTarget.style.background = isPublished ? "rgba(245,158,11,0.12)" : "transparent"; e.currentTarget.style.color = isPublished ? C.warning : C.textDim; e.currentTarget.style.borderColor = isPublished ? "rgba(245,158,11,0.25)" : C.border; }}>
                {isPublished ? <Lock size={11}/> : <Globe size={11}/>}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
