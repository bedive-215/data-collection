// ─── SurveyCardHome.jsx ────────────────────────────────────────────────
// Compact portrait survey card — premium flat design with glassmorphism
// icon area, status badge, centered content. Used in Home.jsx and MySurveysPage.jsx.
// ─────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  Lock, Share, BarChart3, Edit2, Trash2, Globe,
  Eye, Clock, CalendarDays, FileText,
} from "lucide-react";

export const C = {
  surface: "#ffffff",
  text:    "#0b1c30",
  textSub: "#464554",
  textDim: "#767586",
  font:    "'Plus Jakarta Sans','DM Sans',sans-serif",
};

/* ── Participant role themes ─────────────────────────────── */
export const ROLE_THEME = {
  editor:    { label:"Chỉnh sửa",  accent:"#7c3aed", bg:"rgba(124,58,237,0.12)",  text:"#6d28d9", border:"rgba(124,58,237,0.22)" },
  viewer:    { label:"Xem câu hỏi", accent:"#0284c7", bg:"rgba(2,132,199,0.10)",  text:"#0369a1", border:"rgba(2,132,199,0.20)" },
  respondent:{ label:"Làm khảo sát", accent:"#059669", bg:"rgba(5,150,105,0.10)",   text:"#047857", border:"rgba(5,150,105,0.20)" },
};

/* ── Status themes ─────────────────────────────────────────────── */
const STATUS_THEME = {
  ACTIVE:    { label:"Đang mở",      accent:"#6366f1", bg:"rgba(99,102,241,0.10)",  pillBg:"rgba(99,102,241,0.10)", pillText:"#4648d4", pillBorder:"rgba(99,102,241,0.18)", mesh:"linear-gradient(135deg, #f0f2ff 0%, #e8ebff 50%, #dde2ff 100%)" },
  DRAFT:     { label:"Nháp",          accent:"#94a3b8", bg:"rgba(148,163,184,0.10)", pillBg:"rgba(148,163,184,0.10)", pillText:"#64748b", pillBorder:"rgba(148,163,184,0.18)", mesh:"linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 50%, #e8ecf2 100%)" },
  EXPIRED:   { label:"Hết hạn",       accent:"#ef4444", bg:"rgba(239,68,68,0.10)",   pillBg:"rgba(239,68,68,0.10)",   pillText:"#dc2626", pillBorder:"rgba(239,68,68,0.18)", mesh:"linear-gradient(135deg, #fff5f5 0%, #ffe8e8 50%, #ffd9d9 100%)" },
  CLOSED:    { label:"Đã đóng",        accent:"#9ca3af", bg:"rgba(156,163,175,0.08)", pillBg:"rgba(156,163,175,0.08)", pillText:"#6b7280", pillBorder:"rgba(156,163,175,0.15)", mesh:"linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #eceef1 100%)" },
  SCHEDULED: { label:"Lên lịch",       accent:"#0284c7", bg:"rgba(2,132,199,0.10)",   pillBg:"rgba(2,132,199,0.10)",   pillText:"#0369a1", pillBorder:"rgba(2,132,199,0.18)", mesh:"linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #cce9fb 100%)" },
  COMPLETED: { label:"Đã hoàn thành",  accent:"#059669", bg:"rgba(5,150,105,0.10)",   pillBg:"rgba(5,150,105,0.10)",   pillText:"#047857", pillBorder:"rgba(5,150,105,0.18)", mesh:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #c4e4ce 100%)" },
};
export const STATUS_MAP = STATUS_THEME;

function getTheme(status) {
  return STATUS_THEME[status?.toUpperCase()] || STATUS_THEME.DRAFT;
}

/* ── Category → emoji + color map ──────────────────────────────── */
const CAT_EMOJI = {
  education:    { emoji:"📚", bg:"#fef9ec", color:"#92711a" },
  feedback:     { emoji:"💬", bg:"#eef4ff", color:"#1d4ed8" },
  research:     { emoji:"🔬", bg:"#f3eeff", color:"#6d28d9" },
  health:       { emoji:"🏥", bg:"#eef9f2", color:"#15803d" },
  marketing:    { emoji:"📣", bg:"#fdf0f6", color:"#be185d" },
  customer:     { emoji:"⭐", bg:"#fff6ed", color:"#c2410c" },
  event:        { emoji:"🎉", bg:"#fef0ff", color:"#a21caf" },
  product:      { emoji:"📦", bg:"#e8faf8", color:"#0d9488" },
  hr:           { emoji:"👥", bg:"#f4f6f8", color:"#475569" },
  satisfaction: { emoji:"😊", bg:"#f5fbe8", color:"#4d7c0f" },
};

function getEmoji(category) {
  const key = (category || "").toLowerCase().trim();
  return CAT_EMOJI[key] || { emoji:"📋", bg:"#f4f6f8", color:"#475569" };
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("vi-VN", { day:"2-digit", month:"short", year:"numeric" });
}

function getExpiry(survey) {
  if (!survey?.end_at) return null;
  const end = new Date(survey.end_at);
  const isExpired = end < new Date();
  return { text: end.toLocaleDateString("vi-VN", { day:"2-digit", month:"short" }), isExpired };
}

const AV_COLORS = [
  { bg:"#f3eeff", color:"#7c3aed" },
  { bg:"#fdf0f6", color:"#be185d" },
  { bg:"#eef4ff", color:"#1d4ed8" },
  { bg:"#eef9f2", color:"#15803d" },
  { bg:"#fff6ed", color:"#c2410c" },
];

export function ParticipantsAvatars({ participants, max = 3 }) {
  if (!participants?.length) return null;
  const vis   = participants.slice(0, max);
  const extra  = participants.length - max;
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      {vis.map((p, i) => {
        const av = AV_COLORS[i % AV_COLORS.length];
        return (
          <div key={p.id || i} style={{
            width:24, height:24, borderRadius:"50%",
            border:"2px solid #fff",
            background:av.bg, color:av.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, fontWeight:700,
            marginLeft: i === 0 ? 0 : -6,
            zIndex: vis.length - i, position:"relative",
            fontFamily:C.font,
          }}>
            {(p.name || p.email || "?")[0].toUpperCase()}
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{
          width:24, height:24, borderRadius:"50%",
          border:"2px solid #fff",
          background:"#f4f6f8", color:"#64748b",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:9, fontWeight:700, marginLeft:-6,
          fontFamily:C.font,
        }}>+{extra}</div>
      )}
    </div>
  );
}

/* ── Status dot ─────────────────────────────────────────── */
function StatusDot() {
  return (
    <span style={{
      width:6, height:6, borderRadius:"50%",
      background:"#10b981", flexShrink:0,
      display:"inline-block",
      boxShadow:"0 0 8px rgba(16, 185, 129, 0.4)",
    }}/>
  );
}

/* ── Icon type → SVG path (file icon, amber) ──────────────── */
function SurveyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b" style={{ filter:"drop-shadow(0 1px 2px rgba(245,158,11,0.3))" }}>
      <path d="M14,2H6C4.89,2 4,2.89 4,4V20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20V8L14,2M13,9V3.5L18.5,9H13Z"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SurveyCardHome — premium portrait card (matching Lumina Elite template)
   ═══════════════════════════════════════════════════════════════════ */
export function SurveyCardHome({
  survey,
  index = 0,
  onClick,
  type = "my",
  overrideStatus = null,
  onShare,
  onLock,
  onEdit,
  onDelete,
  onPublish,
  onViewAnalytics,
  onViewResponses,
  onExpiredClick,
  onSaveEdit,
  isOwner: isOwnerProp = null,
  creatorName = null,
  participantRole = null,
}) {
  const isOwner  = isOwnerProp !== null ? isOwnerProp : (type === "my");
  const status   = overrideStatus || survey?.status;
  const theme    = getTheme(status);
  const isPub    = survey?.is_published;
  const expiry   = getExpiry(survey);
  const cat      = getEmoji(survey?.category);
  const roleTheme = participantRole ? (ROLE_THEME[participantRole.toLowerCase()] || null) : null;
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const isExpired = expiry?.isExpired;

  const handleCardClick = () => {
    if (isExpired && isOwner && onExpiredClick) {
      onExpiredClick(survey);
    } else if (onViewResponses) {
      onViewResponses(survey.id, survey.title);
    } else if (onClick) {
      onClick(survey);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditTitle(survey?.title || "");
    setEditEndAt(survey?.end_at ? new Date(survey.end_at).toISOString().slice(0, 16) : "");
    setIsEditing(true);
  };

  const handleEditSave = async (e) => {
    e?.stopPropagation();
    if (!editTitle.trim() || !onSaveEdit) return;
    if (editEndAt) {
      const selected = new Date(editEndAt);
      if (selected <= new Date()) return;
    }
    setEditSaving(true);
    try {
      await onSaveEdit(survey.id, { title: editTitle.trim(), end_at: editEndAt || undefined });
      setIsEditing(false);
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
  };

  const responseCount = survey?.response_count ?? survey?.responseCount ?? survey?.responses_count ?? 0;

  return (
    <>
      <style>{`
        .sch-card {
          background: #ffffff;
          border: 1px solid rgba(199, 196, 215, 0.3);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 0.25s cubic-bezier(.22,1,.36,1),
            box-shadow 0.25s ease,
            border-color 0.2s ease;
          font-family: 'Plus Jakarta Sans','DM Sans',sans-serif;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-shadow: 0 4px 24px -2px rgba(11, 28, 48, 0.05), 0 2px 8px -2px rgba(11, 28, 48, 0.03);
          position: relative;
        }
        .sch-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(11, 28, 48, 0.09), 0 3px 8px rgba(11, 28, 48, 0.04);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .sch-action-btn {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(199, 196, 215, 0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sch-action-btn:hover {
          background: #ffffff;
          border-color: #4648d4;
          color: #4648d4;
          transform: translateY(-1px);
        }
        .sch-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #e5eeff;
          border: 1px solid rgba(99, 102, 241, 0.18);
          font-size: 10px;
          font-weight: 700;
          color: #464554;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-family: 'Plus Jakarta Sans','DM Sans',sans-serif;
        }
        .sch-badge-pop {
          animation: sch-pop 0.4s cubic-bezier(.34,1.56,0.64,1) both;
        }
        @keyframes sch-pop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .sch-pulse {
          animation: sch-pulse-anim 2.4s ease-in-out infinite;
        }
        @keyframes sch-pulse-anim {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .sch-edit-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(199, 196, 215, 0.4);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #464554;
        }
        .sch-edit-btn:hover {
          color: #4648d4;
          border-color: #4648d4;
          transform: scale(1.05);
        }
        .sch-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: #e5eeff;
          border: 1px solid rgba(199, 196, 215, 0.2);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sch-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(to right, transparent, rgba(118, 117, 134, 0.4), transparent);
          margin: 4px 0;
        }
      `}</style>

      <article
        className="sch-card"
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "radial-gradient(circle at top left, #f8faff, #f1f3ff 50%, #fcfaff 100%)",
        }}
      >
        {/* ── HEADER: Status + Actions ──────────────────────────────── */}
        <header style={{
          padding: "16px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          {/* Status badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sch-badge-pop sch-status-pill" style={{
              background: theme.pillBg,
              borderColor: theme.pillBorder,
              color: theme.pillText,
            }}>
              {status === "ACTIVE" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#10b981", flexShrink: 0,
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
                  animation: "sch-pulse-anim 2.4s ease-in-out infinite",
                }}/>
              )}
              {status === "COMPLETED" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#059669", flexShrink: 0,
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(5, 150, 105, 0.4)",
                }}/>
              )}
              {status === "EXPIRED" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#ef4444", flexShrink: 0,
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)",
                }}/>
              )}
              {status === "DRAFT" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#94a3b8", flexShrink: 0,
                  display: "inline-block",
                }}/>
              )}
              {status === "SCHEDULED" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#0284c7", flexShrink: 0,
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(2, 132, 199, 0.4)",
                }}/>
              )}
              {status === "CLOSED" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#9ca3af", flexShrink: 0,
                  display: "inline-block",
                }}/>
              )}
              {theme.label}
            </div>

            {/* Public badge */}
            {isPub && (
              <div className="sch-badge-pop" style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 9999,
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.18)",
                fontSize: 9, fontWeight: 700, color: "#059669",
                letterSpacing: "0.02em",
              }}>
                <Globe size={9} /> Công khai
              </div>
            )}

            {/* Participant role badge */}
            {roleTheme && (
              <div className="sch-badge-pop" style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 9999,
                background: roleTheme.bg,
                border: `1px solid ${roleTheme.border}`,
                fontSize: 9, fontWeight: 700,
                color: roleTheme.text,
                letterSpacing: "0.02em",
                fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
              }}>
                {participantRole === "editor" && <Edit2 size={9} />}
                {participantRole === "viewer" && <Eye size={9} />}
                {participantRole === "respondent" && <FileText size={9} />}
                {roleTheme.label}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
            {onViewAnalytics && (
              <button
                className="sch-action-btn"
                style={{ width: 28, height: 28, borderRadius: 8, color: "#464554" }}
                title="Phân tích"
                onClick={() => onViewAnalytics(survey.id)}
              >
                <BarChart3 size={13} />
              </button>
            )}
            {onShare && (
              <button
                className="sch-action-btn"
                style={{ width: 28, height: 28, borderRadius: 8, color: "#464554" }}
                title="Chia sẻ"
                onClick={() => onShare(survey.id)}
              >
                <Share size={13} />
              </button>
            )}
            {onLock && (
              <button
                className="sch-action-btn"
                style={{ width: 28, height: 28, borderRadius: 8, color: "#464554" }}
                title="Bảo mật"
                onClick={() => onLock(survey.id)}
              >
                <Lock size={13} />
              </button>
            )}
          </div>
        </header>

        {/* ── MAIN: Icon + Title + Description ──────────────────────── */}
        <main style={{
          padding: "8px 24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}>
          {/* Icon + Edit overlay */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div className="sch-icon-wrap">
              {survey?.category ? (
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
              ) : (
                <SurveyIcon />
              )}
            </div>
            {isOwner && onSaveEdit && (
              <button
                className="sch-edit-btn"
                style={{ position: "absolute", bottom: -4, right: -4 }}
                title="Chỉnh sửa"
                onClick={handleEditClick}
              >
                <Edit2 size={11} />
              </button>
            )}
          </div>

          {/* Title */}
          {!isEditing ? (
            <div style={{ width: "100%", marginBottom: 6 }}>
              <h2 style={{
                margin: 0,
                fontSize: 18, fontWeight: 700,
                color: "#0b1c30", lineHeight: 1.3,
                fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                marginBottom: 4,
              }}>
                {survey?.title || "Không có tiêu đề"}
              </h2>
            </div>
          ) : (
            <div style={{ width: "100%", marginBottom: 8, textAlign: "left" }}>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.key === "Enter" && handleEditSave(e)}
                placeholder="Tên khảo sát"
                style={{
                  width: "100%",
                  marginBottom: 6,
                  fontSize: 18, fontWeight: 700,
                  color: "#0b1c30", lineHeight: 1.3,
                  fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                  border: "1.5px solid #4648d4",
                  borderRadius: 8, padding: "6px 10px",
                  outline: "none",
                  background: "#fff",
                  boxShadow: "0 0 0 3px rgba(70,72,212,0.1)",
                }}
              />
              {/* Inline date edit */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 10px",
                background: "rgba(70,72,212,0.04)",
                border: "1px solid rgba(70,72,212,0.15)",
                borderRadius: 8, marginBottom: 8,
              }}>
                <CalendarDays size={11} color="#4648d4" style={{ flexShrink: 0 }}/>
                <input
                  type="datetime-local"
                  value={editEndAt}
                  onChange={e => setEditEndAt(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, padding: "3px 6px",
                    border: "1.5px solid #4648d4",
                    borderRadius: 5, fontSize: 11,
                    outline: "none",
                    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                    color: "#0b1c30",
                    background: "#fff",
                  }}
                />
                <button
                  onClick={handleEditSave}
                  style={{
                    padding: "3px 10px",
                    background: editSaving ? "#94a3b8" : "linear-gradient(135deg,#4648d4,#6366f1)",
                    border: "none", borderRadius: 5,
                    color: "#fff", fontSize: 10, fontWeight: 700,
                    cursor: editSaving ? "not-allowed" : "pointer",
                    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                  }}
                >
                  {editSaving ? "..." : "Lưu"}
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: "3px 8px",
                    background: "#f4f6f8",
                    border: "1px solid #e8ecf2", borderRadius: 5,
                    color: "#64748b", fontSize: 10, fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                  }}
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {!isEditing && survey?.description ? (
            <p style={{
              margin: 0,
              fontSize: 12, color: "#464554",
              lineHeight: 1.55,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
              marginBottom: 8,
            }}>
              {survey.description}
            </p>
          ) : null}

          {/* Category tag */}
          {survey?.category && !isEditing && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 6,
              background: cat.bg,
              border: `1px solid ${cat.color}28`,
              marginBottom: 8, alignSelf: "center",
            }}>
              <span style={{ fontSize: 10 }}>{cat.emoji}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: cat.color,
                fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                textTransform: "capitalize",
              }}>
                {survey.category}
              </span>
            </div>
          )}

          {/* "View your answers" — completed, public */}
          {!isOwner && status === "COMPLETED" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 6,
              background: "rgba(5,150,105,0.06)",
              border: "1px solid rgba(5,150,105,0.14)",
              marginBottom: 8, alignSelf: "center",
            }}>
              <Eye size={10} color="#059669"/>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                Xem đáp án của bạn
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="sch-divider" style={{ marginTop: 4, marginBottom: 2 }}/>
        </main>

        {/* ── FOOTER: Deadline + Assignee ────────────────────────────── */}
        <footer style={{
          padding: "8px 24px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Deadline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{
              fontSize: 9, color: "#767586",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 2,
            }}>
              {isExpired ? "Đã hết hạn" : "Hết hạn"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={13} color={expiry?.isExpired ? "#ef4444" : "#767586"} style={{ opacity: 0.6 }}/>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: expiry?.isExpired ? "#ef4444" : "#0b1c30",
                fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
              }}>
                {expiry?.text || "—"}
              </span>
            </div>
          </div>

          {/* Right side: responses + avatars */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {responseCount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: "rgba(70,72,212,0.06)",
                border: "1px solid rgba(70,72,212,0.12)",
              }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#4648d4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4648d4", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                  {responseCount}
                </span>
              </div>
            )}
            <ParticipantsAvatars participants={survey?.participants}/>
          </div>
        </footer>
      </article>
    </>
  );
}

/* ── ShareModal ─────────────────────────────────────────────── */
export function ShareModal({ open, onClose, surveyTitle, shareUrl, loading, error, onGenerate }) {
  const [copied, setCopied] = useState(false);
  React.useEffect(() => { if (!open) setCopied(false); }, [open]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea"); el.value = shareUrl;
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(15,23,42,0.45)",
      backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, animation:"smFade .16s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16,
        border:"1px solid #e8ecf2",
        boxShadow:"0 20px 48px rgba(0,0,0,0.10)",
        width:"100%", maxWidth:440, overflow:"hidden",
        animation:"smUp .2s cubic-bezier(.16,1,.3,1)",
        fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f4f6f8" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 3px 12px rgba(99,102,241,0.28)" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={18} cy={5} r={3}/><circle cx={6} cy={12} r={3}/><circle cx={18} cy={19} r={3}/><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/></svg>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#0b1c30" }}>Chia sẻ khảo sát</div>
              <div style={{ fontSize:11.5, color:"#94a3b8", maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{surveyTitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:"1px solid #e8ecf2",
            background:"transparent", cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", color:"#94a3b8",
            transition:"all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="#f4f6f8"; e.currentTarget.style.color="#64748b"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
          </button>
        </div>

        <div style={{ padding:"18px 20px" }}>
          {error && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:10, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.12)", marginBottom:12 }}>
              <span style={{ fontSize:12, color:"#ef4444" }}>{error}</span>
              <button onClick={onGenerate} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid rgba(239,68,68,0.12)", background:"transparent", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer" }}>Thử lại</button>
            </div>
          )}

          {shareUrl ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(99,102,241,0.04)", borderRadius:10, border:"1px solid rgba(99,102,241,0.08)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span style={{ flex:1, fontSize:12, color:"#334155", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"monospace" }}>{shareUrl}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleCopy} style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"10px 0", borderRadius:10,
                  border:`1.5px solid ${copied ? "rgba(5,150,105,0.30)" : "rgba(99,102,241,0.20)"}`,
                  background: copied ? "rgba(5,150,105,0.05)" : "transparent",
                  color: copied ? "#059669" : "#6366f1",
                  fontSize:12.5, fontWeight:700, cursor:"pointer",
                  fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
                  transition:"all .2s",
                }}>
                  {copied
                    ? <span style={{display:"flex",alignItems:"center",gap:5}}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!</span>
                    : <span style={{display:"flex",alignItems:"center",gap:5}}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={9} y={9} width={13} height={13} rx={2} ry={2}/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Sao chép link</span>
                  }
                </button>
                <button onClick={() => window.open(shareUrl, "_blank")} style={{
                  width:40, display:"flex", alignItems:"center", justifyContent:"center",
                  borderRadius:10, border:"1px solid #e8ecf2",
                  background:"transparent", color:"#94a3b8", cursor:"pointer",
                  transition:"all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="#f4f6f8"; e.currentTarget.style.color="#64748b"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points={15}/><polyline points={9}/><line x1={10} y1={14} x2={21} y2={3}/></svg>
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onGenerate} disabled={loading} style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              width:"100%", padding:"12px 0", borderRadius:12, border:"none",
              background: loading
                ? "linear-gradient(135deg,#e2e8f0,#f1f5f9)"
                : "linear-gradient(135deg,#6366f1,#818cf8)",
              color: loading ? "#94a3b8" : "#fff",
              fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
              boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              transition:"all .2s",
            }}>
              {loading
                ? <span style={{display:"flex",alignItems:"center",gap:6}}><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{animation:"smSpin 1s linear infinite"}}/><span>Đang tạo link...</span></span>
                : <span style={{display:"flex",alignItems:"center",gap:6}}><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>Tạo link chia sẻ</span></span>
              }
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes smFade { from{opacity:0} to{opacity:1} }
        @keyframes smUp   { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes smSpin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
