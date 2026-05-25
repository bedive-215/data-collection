// ─── SurveyCard.jsx ──────────────────────────────────────────────────
// Modern survey card — sharp corners, thin accent bar, compact layout.
// Supports variants: "user" | "owner" | "admin" | "compact" | "list"
// ─────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CalendarDays,
  Clock,
  Lock,
  Share,
  Users,
  Globe,
  Mail,
  UserPlus,
} from "lucide-react";

/* ── Color Token ───────────────────────────────────────────────────── */
const C = {
  primary:       "#4f46e5",
  primaryLight:  "rgba(79,70,229,0.1)",
  primaryBorder: "rgba(79,70,229,0.25)",
  success:       "#10b981",
  successLight:  "rgba(16,185,129,0.1)",
  warning:       "#f59e0b",
  warningLight:  "rgba(245,158,11,0.1)",
  error:         "#ef4444",
  errorLight:    "rgba(239,68,68,0.1)",
  gray:          "#94a3b8",
  grayLight:     "rgba(100,116,139,0.1)",
  text:          "#0f172a",
  textSub:       "#64748b",
  textDim:       "#94a3b8",
  border:        "#e2e8f0",
  font:          "'Plus Jakarta Sans', 'DM Sans', sans-serif",
};

/* ── Status config — pastel harmonious with backdrop blobs ─────────── */
export const STATUS_CONFIG = {
  ACTIVE: {
    label:      "Đang mở",
    color:       "#0284c7",
    accent:      "#0284c7",
    barBg:       "#e0f2fe",
    pillBg:      "rgba(2,132,199,0.08)",
    pillBorder:  "rgba(2,132,199,0.2)",
    pillText:    "#0369a1",
  },
  DRAFT: {
    label:      "Nháp",
    color:       "#6366f1",
    accent:      "#6366f1",
    barBg:       "#ede9fe",
    pillBg:      "rgba(99,102,241,0.08)",
    pillBorder:  "rgba(99,102,241,0.2)",
    pillText:    "#4f46e5",
  },
  EXPIRED: {
    label:      "Hết hạn",
    color:       "#db2777",
    accent:      "#db2777",
    barBg:       "#fce7f3",
    pillBg:      "rgba(219,39,119,0.08)",
    pillBorder:  "rgba(219,39,119,0.2)",
    pillText:    "#be185d",
  },
  CLOSED: {
    label:      "Đã đóng",
    color:       "#94a3b8",
    accent:      "#94a3b8",
    barBg:       "#f1f5f9",
    pillBg:      "rgba(100,116,139,0.08)",
    pillBorder:  "rgba(100,116,139,0.2)",
    pillText:    "#64748b",
  },
  SCHEDULED: {
    label:      "Lên lịch",
    color:       "#d97706",
    accent:      "#d97706",
    barBg:       "#fef3c7",
    pillBg:      "rgba(217,119,6,0.08)",
    pillBorder:  "rgba(217,119,6,0.2)",
    pillText:    "#b45309",
  },
  COMPLETED: {
    label:      "Đã hoàn thành",
    color:       "#059669",
    accent:      "#059669",
    barBg:       "#d1fae5",
    pillBg:      "rgba(5,150,105,0.08)",
    pillBorder:  "rgba(5,150,105,0.2)",
    pillText:    "#047857",
  },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.DRAFT;
}

/* ── Status Badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"4px 10px", borderRadius:999,
      background: cfg.pillBg,
      border:`1px solid ${cfg.pillBorder}`,
    }}>
      {status === "ACTIVE" && (
        <span style={{
          width:6, height:6, borderRadius:"50%",
          background:cfg.accent, flexShrink:0, display:"inline-block",
        }} />
      )}
      <span style={{
        fontSize:10, fontWeight:700,
        color:cfg.pillText,
        letterSpacing:"0.05em", textTransform:"uppercase",
        fontFamily:C.font,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ── Participants Avatars ──────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg:"#dbeafe", color:"#1d4ed8" },
  { bg:"#dcfce7", color:"#15803d" },
  { bg:"#fce7f3", color:"#be185d" },
  { bg:"#fef3c7", color:"#92400e" },
  { bg:"#ede9fe", color:"#6d28d9" },
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
    <div style={{ display:"flex", alignItems:"center" }}>
      <div style={{ display:"flex" }}>
        {visible.map((p, i) => {
          const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div key={p.id || i} title={p.email || p.name || ""} style={{
              width:28, height:28, borderRadius:"50%", border:"2px solid white",
              background:ac.bg, color:ac.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:9, fontWeight:700,
              marginLeft: i === 0 ? 0 : -8,
              zIndex: visible.length - i, position:"relative", flexShrink:0,
            }}>
              {getInitials(p.name, p.email)}
            </div>
          );
        })}
      </div>
      {extra > 0 && (
        <div style={{
          width:28, height:28, borderRadius:"50%", border:"2px solid white",
          background:"#f1f5f9", color:"#64748b",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:9, fontWeight:700, marginLeft:-8, zIndex:0, position:"relative",
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
  if (mins < 1)   return "Vừa xong";
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7)   return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day:"2-digit", month:"short" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day:"2-digit", month:"short", year:"numeric" });
}

function fmtExpiry(survey) {
  if (!survey || !survey.end_at) return null;
  const end = new Date(survey.end_at);
  return { text: `Hết hạn ${end.toLocaleDateString("vi-VN", { day:"2-digit", month:"short", year:"numeric" })}`, expired: end < new Date() };
}

/* ──────────────────────────────────────────────────────────────────── */
/* Main SurveyCard                                                    */
/* Variants: "user" | "owner" | "admin" | "compact" | "list"         */
/* ──────────────────────────────────────────────────────────────────── */
export default function SurveyCard({
  survey,
  index = 0,
  variant = "user",
  onEdit,
  onDelete,
  onShare,
  onPublish,
  onViewAnalytics,
  onClick,
  onLock,
  onInvite,
  onBulkInvite,
  onGetParticipants,
  onDeleteParticipant,
  selected = false,
  checked = false,
  onSelect,
  participants,
}) {
  const navigate = useNavigate();
  const isOwner   = variant === "owner";
  const isAdmin   = variant === "admin";
  const isCompact = variant === "compact";
  const isList    = variant === "list";

  const status      = survey?.status;
  const isPublished = survey?.is_published;
  const cfg         = getStatusConfig(status);
  const surveyParts = participants || survey?.participants;
  const accentColor = cfg.accent;

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
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 14px",
          background:"#fff",
          borderRadius:12,
          border:`1px solid ${selected ? C.primaryBorder : "#e2e8f0"}`,
          boxShadow: selected ? "0 0 0 2px rgba(79,70,229,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
          cursor:"pointer",
          transition:"all 0.2s ease",
        }}
      >
        {onSelect && (
          <input type="checkbox" checked={checked}
            onChange={() => onSelect(survey.id)}
            onClick={e => e.stopPropagation()}
            style={{ accentColor:C.primary, width:15, height:15, flexShrink:0, cursor:"pointer" }}
          />
        )}
        <div style={{
          width:34, height:34, borderRadius:9,
          background:`${accentColor}14`,
          border:`1.5px solid ${accentColor}30`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          <FileText size={16} color={accentColor} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {survey.title}
          </div>
          <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>
            {formatDate(survey.created_at)}
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
          display:"flex", alignItems:"center", gap:14,
          padding:"14px 16px",
          background:"#fff",
          borderRadius:12,
          border:`1px solid ${selected ? C.primaryBorder : "#e2e8f0"}`,
          boxShadow: selected ? "0 0 0 2px rgba(79,70,229,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
          cursor:"pointer",
          transition:"all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateX(3px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateX(0)"; e.currentTarget.style.boxShadow = selected ? "0 0 0 2px rgba(79,70,229,0.12)" : "0 1px 4px rgba(0,0,0,0.04)"; }}
      >
        {onSelect && (
          <input type="checkbox" checked={checked}
            onChange={() => onSelect(survey.id)}
            onClick={e => e.stopPropagation()}
            style={{ accentColor:C.primary, width:15, height:15, flexShrink:0, cursor:"pointer" }}
          />
        )}
        <div style={{
          width:40, height:40, borderRadius:10,
          background:`${accentColor}14`,
          border:`1.5px solid ${accentColor}30`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          <FileText size={18} color={accentColor} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
            {survey.title}
          </div>
          <div style={{ fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {survey.description || "Không có mô tả"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <StatusBadge status={status} />
          {isPublished && <Globe size={14} color={C.primary} />}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, color:C.textDim, fontSize:12, flexShrink:0 }}>
          {formatRelativeTime(survey.created_at)}
        </div>
        <ParticipantsAvatars participants={surveyParts} />
      </div>
    );
  }

  /* ── Grid card variant (default) ───────────────────── */
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{`
        .sc-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          font-family: 'Plus Jakarta Sans','DM Sans',sans-serif;
          display: flex;
          flex-direction: column;
        }
        .sc-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1);
          border-color: ${accentColor}50;
        }
        .sc-bar { background: ${accentColor}; transition: background 0.2s; }
        .sc-card:hover .sc-bar { opacity: 0.8; }
      `}</style>

      <article
        className="sc-card"
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Accent bar */}
        <div className="sc-bar" style={{ height:4 }} />

        {/* Card body */}
        <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:0, flex:1 }}>

          {/* Header: badge + actions */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12, gap:8 }}>

            <StatusBadge status={status} />

            {/* Action buttons */}
            <div style={{ display:"flex", gap:4, flexShrink:0 }} onClick={e => e.stopPropagation()}>
              {(isOwner || isAdmin) && onLock && (
                <CardActionBtn label="Khóa / Đóng" onClick={() => onLock(survey.id)} hovered={hovered} accent={C.gray}>
                  <Lock size={13} />
                </CardActionBtn>
              )}
              {onShare && (
                <CardActionBtn label="Chia sẻ" onClick={() => onShare(survey.id)} hovered={hovered}>
                  <Share size={13} />
                </CardActionBtn>
              )}
              {onInvite && (
                <CardActionBtn label="Mời" onClick={() => onInvite(survey.id)} hovered={hovered}>
                  <Mail size={13} />
                </CardActionBtn>
              )}
              {onBulkInvite && (
                <CardActionBtn label="Mời hàng loạt" onClick={() => onBulkInvite(survey.id)} hovered={hovered}>
                  <UserPlus size={13} />
                </CardActionBtn>
              )}
              {onGetParticipants && (
                <CardActionBtn label="Người tham gia" onClick={() => onGetParticipants(survey.id)} hovered={hovered}>
                  <Users size={13} />
                </CardActionBtn>
              )}
              {onPublish && (
                <CardActionBtn
                  label={isPublished ? "Bỏ công khai" : "Công khai"}
                  onClick={() => onPublish(survey.id)}
                  hovered={hovered}
                  accent={isPublished ? C.warning : undefined}
                >
                  {isPublished ? <Lock size={13} /> : <Globe size={13} />}
                </CardActionBtn>
              )}
            </div>
          </div>

          {/* Icon + title */}
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
            <div style={{
              width:42, height:42, borderRadius:10,
              background:`${accentColor}14`,
              border:`1.5px solid ${accentColor}30`,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={`${accentColor}bb`}>
                <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <h2 style={{
                margin:0, fontSize:14, fontWeight:700,
                color:C.text, lineHeight:1.35,
                letterSpacing:"-0.01em",
                fontFamily:C.font,
                overflow:"hidden", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                marginBottom:3,
              }}>
                {survey.title}
              </h2>
              {survey.description ? (
                <p style={{
                  margin:0, fontSize:12, fontWeight:400,
                  color:C.textSub, lineHeight:1.5,
                  overflow:"hidden", display:"-webkit-box",
                  WebkitLineClamp:1, WebkitBoxOrient:"vertical",
                  fontFamily:C.font,
                }}>
                  {survey.description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            paddingTop:10, marginTop:"auto", gap:6,
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{
                  width:24, height:24, borderRadius:6,
                  background:"#f8fafc",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <CalendarDays size={11} color={C.textDim} />
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:C.textSub, fontFamily:C.font }}>
                  {formatDate(survey.created_at)}
                </span>
              </div>
              {(() => { const exp = fmtExpiry(survey); return exp ? (
                <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:30 }}>
                  <Clock size={10} color={exp.expired ? "#db2777" : C.textDim} />
                  <span style={{ fontSize:10, fontWeight:600, color:exp.expired ? "#db2777" : C.textDim, fontFamily:C.font }}>
                    {exp.text}
                  </span>
                </div>
              ) : null; })()}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {isPublished && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, color:C.success, fontFamily:C.font }}>
                  <Globe size={10} /> Công khai
                </span>
              )}
              <ParticipantsAvatars participants={surveyParts} />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

/* ── Card action button ─────────────────────────────────────── */
function CardActionBtn({ label, onClick, children, hovered, accent, danger }) {
  const [pressed, setPressed] = useState(false);
  const baseColor  = danger ? C.error : accent || C.textDim;
  const baseBg     = danger ? C.errorLight : accent ? `${accent}10` : "transparent";
  const baseBorder = danger ? "rgba(239,68,68,0.15)" : accent ? `${accent}25` : "#e2e8f0";
  const active = pressed || hovered;
  const bg     = active ? (danger ? "rgba(239,68,68,0.1)" : accent ? `${accent}18` : C.primaryLight) : baseBg;
  const color  = active ? baseColor : C.textDim;
  const border = active ? (danger ? "rgba(239,68,68,0.3)" : accent ? `${accent}40` : C.primaryBorder) : baseBorder;

  return (
    <button
      aria-label={label}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width:28, height:28, borderRadius:7,
        border:`1px solid ${border}`,
        background:bg,
        cursor:"pointer", display:"flex",
        alignItems:"center", justifyContent:"center",
        color, padding:0, flexShrink:0,
        transition:"all 0.15s ease",
        transform: pressed ? "scale(0.93)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}
