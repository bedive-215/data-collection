// ─── SurveyCardHome.jsx ────────────────────────────────────────────────
// Compact portrait survey card — gradient header, glassmorphism icon,
// clean content panel. Used in Home.jsx and MySurveysPage.jsx.
// ─────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  Lock, Share, BarChart3, Edit, Trash2, Globe,
  Eye, Clock, CalendarDays,
} from "lucide-react";

export const C = {
  surface: "#ffffff",
  text:    "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  font:    "'Plus Jakarta Sans','DM Sans',sans-serif",
};

/* ── Status themes ─────────────────────────────────────────────── */
const STATUS_THEME = {
  ACTIVE:    { label:"Đang mở",      accent:"#6366f1", mesh:"linear-gradient(135deg, #f0f2ff 0%, #e8ebff 50%, #dde2ff 100%)", pillBg:"rgba(99,102,241,0.10)",  pillText:"#4f46e5", pillBorder:"rgba(99,102,241,0.18)" },
  DRAFT:     { label:"Nháp",          accent:"#94a3b8", mesh:"linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 50%, #e8ecf2 100%)",              pillBg:"rgba(148,163,184,0.10)", pillText:"#64748b", pillBorder:"rgba(148,163,184,0.18)" },
  EXPIRED:   { label:"Hết hạn",       accent:"#ef4444", mesh:"linear-gradient(135deg, #fff5f5 0%, #ffe8e8 50%, #ffd9d9 100%)",              pillBg:"rgba(239,68,68,0.10)",   pillText:"#dc2626", pillBorder:"rgba(239,68,68,0.18)" },
  CLOSED:    { label:"Đã đóng",        accent:"#9ca3af", mesh:"linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #eceef1 100%)",              pillBg:"rgba(156,163,175,0.08)", pillText:"#6b7280", pillBorder:"rgba(156,163,175,0.15)" },
  SCHEDULED: { label:"Lên lịch",       accent:"#0284c7", mesh:"linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #cce9fb 100%)",              pillBg:"rgba(2,132,199,0.10)",   pillText:"#0369a1", pillBorder:"rgba(2,132,199,0.18)" },
  COMPLETED: { label:"Đã hoàn thành",  accent:"#059669", mesh:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #c4e4ce 100%)",              pillBg:"rgba(5,150,105,0.10)",   pillText:"#047857", pillBorder:"rgba(5,150,105,0.18)" },
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
            width:20, height:20, borderRadius:"50%",
            border:"2px solid #fff",
            background:av.bg, color:av.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:7, fontWeight:700,
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
          width:20, height:20, borderRadius:"50%",
          border:"2px solid #fff",
          background:"#f4f6f8", color:"#64748b",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:7, fontWeight:700, marginLeft:-6,
          fontFamily:C.font,
        }}>+{extra}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SurveyCardHome — compact portrait card
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
  isOwner: isOwnerProp = null,
  creatorName = null,
}) {
  const isOwner  = isOwnerProp !== null ? isOwnerProp : (type === "my");
  const status   = overrideStatus || survey?.status;
  const theme    = getTheme(status);
  const isPub    = survey?.is_published;
  const expiry   = getExpiry(survey);
  const cat      = getEmoji(survey?.category);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (onViewResponses) onViewResponses(survey.id, survey.title);
    else if (onClick)   onClick(survey);
  };

  const responseCount = survey?.response_count ?? survey?.responseCount ?? survey?.responses_count ?? 0;

  return (
    <>
      <style>{`
        .sc-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e8ecf2;
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
          box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
          position: relative;
        }
        .sc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.09), 0 3px 8px rgba(0,0,0,0.04);
          border-color: #d0d7e8;
        }
        .sc-pulse {
          animation: sc-pulse-anim 2.4s ease-in-out infinite;
        }
        @keyframes sc-pulse-anim {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .sc-float {
          animation: sc-float 5s ease-in-out infinite;
        }
        @keyframes sc-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50%       { transform: translate(-50%, -50%) translateY(-3px); }
        }
        .sc-badge-pop {
          animation: sc-pop 0.4s cubic-bezier(.34,1.56,0.64,1) both;
        }
        @keyframes sc-pop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <article
        className="sc-card"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── HEADER: gradient + icon ───────────────────────────── */}
        <div style={{
          height: 96,
          background: theme.mesh,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Top-left radial glow */}
          <div style={{
            position:"absolute", inset:0,
            background:"radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%)",
            pointerEvents:"none",
          }} />

          {/* Bottom fade */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            height: 28,
            background:"linear-gradient(to top, #fff 20%, transparent)",
            pointerEvents:"none",
          }} />

          {/* Floating icon */}
          <div className="sc-float" style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%, -50%)",
          }}>
            <div style={{
              width:52, height:52,
              borderRadius:14,
              background:"rgba(255,255,255,0.55)",
              backdropFilter:"blur(8px)",
              WebkitBackdropFilter:"blur(8px)",
              border:"1.5px solid rgba(255,255,255,0.7)",
              boxShadow:"0 6px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <div style={{
                width:28, height:28,
                borderRadius:8,
                background:"rgba(255,255,255,0.55)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
              }}>
                {cat.emoji}
              </div>
            </div>
          </div>

          {/* Status badge — top-left */}
          <div style={{position:"absolute", top:10, left:10, zIndex:10}}>
            <div className="sc-badge-pop" style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:6,
              background: theme.pillBg,
              border:`1px solid ${theme.pillBorder}`,
            }}>
              {status === "ACTIVE" && (
                <span style={{
                  width:5, height:5, borderRadius:"50%",
                  background:theme.accent, flexShrink:0,
                  display:"inline-block", className:"sc-pulse",
                }}/>
              )}
              <span style={{
                fontSize:9.5, fontWeight:700, color:theme.pillText,
                letterSpacing:"0.04em",
                fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
                whiteSpace:"nowrap",
              }}>{theme.label}</span>
            </div>

            {isPub && (
              <div className="sc-badge-pop" style={{
                marginTop:4,
                display:"inline-flex", alignItems:"center", gap:3,
                padding:"2px 7px", borderRadius:6,
                background:"rgba(255,255,255,0.55)",
                backdropFilter:"blur(6px)",
                WebkitBackdropFilter:"blur(6px)",
                border:"1px solid rgba(255,255,255,0.7)",
                fontSize:8.5, fontWeight:700, color:"#059669",
                letterSpacing:"0.02em",
              }}>
                <Globe size={8} /> Công khai
              </div>
            )}
          </div>

          {/* Owner action buttons — top-right */}
          {isOwner && (
            <div style={{position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:4, zIndex:10}} onClick={e => e.stopPropagation()}>
              {onViewAnalytics && <Abtn icon={<BarChart3 size={11}/>} label="Phân tích" on={() => onViewAnalytics(survey.id)} hovered={hovered} accent="#6366f1"/>}
              {onShare        && <Abtn icon={<Share size={11}/>}     label="Chia sẻ"   on={() => onShare(survey.id)}        hovered={hovered} accent="#6366f1"/>}
              {onEdit         && <Abtn icon={<Edit size={11}/>}       label="Chỉnh sửa" on={() => onEdit(survey.id)}         hovered={hovered} accent="#6366f1"/>}
              {onPublish      && <Abtn icon={isPub ? <Lock size={11}/> : <Globe size={11}/>} label={isPub ? "Bỏ công khai" : "Công khai"} on={() => onPublish(survey.id)} hovered={hovered} accent={isPub ? "#d97706" : "#059669"}/>}
              {onLock         && <Abtn icon={<Lock size={11}/>}      label="Khóa"      on={() => onLock(survey.id)}         hovered={hovered} accent="#d97706"/>}
              {onDelete       && <Abtn icon={<Trash2 size={11}/>}   label="Xóa"       on={() => onDelete(survey.id)}       hovered={hovered} danger/>}
            </div>
          )}
          {!isOwner && onViewResponses && status === "COMPLETED" && (
            <div style={{position:"absolute", top:10, right:10, zIndex:10}} onClick={e => e.stopPropagation()}>
              <Abtn icon={<Eye size={11}/>} label="Xem đáp án" on={() => onViewResponses(survey.id, survey.title)} hovered={hovered} accent="#059669"/>
            </div>
          )}
          {!isOwner && onDelete && (
            <div style={{position:"absolute", top:10, right:10, zIndex:10}} onClick={e => e.stopPropagation()}>
              <Abtn icon={<Trash2 size={11}/>} label="Xóa" on={() => onDelete(survey.id)} hovered={hovered} danger/>
            </div>
          )}
        </div>

        {/* ── CONTENT PANEL ─────────────────────────────────────── */}
        <div style={{
          background:"#fff",
          display:"flex", flexDirection:"column",
          padding:"12px 14px 12px",
          flex:1,
        }}>

          {/* Title */}
          <h2 style={{
            margin:0,
            fontSize:13.5, fontWeight:700,
            color:"#0f172a", lineHeight:1.3,
            fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            marginBottom:6,
          }}>
            {survey?.title || "Không có tiêu đề"}
          </h2>

          {/* Description */}
          {survey?.description ? (
            <p style={{
              margin:0,
              fontSize:11.5, color:"#64748b",
              lineHeight:1.55,
              overflow:"hidden", display:"-webkit-box",
              WebkitLineClamp:2, WebkitBoxOrient:"vertical",
              fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
              marginBottom:8,
            }}>
              {survey.description}
            </p>
          ) : (
            <div style={{marginBottom:6}}/>
          )}

          {/* Category tag */}
          {survey?.category && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:6,
              background:cat.bg,
              border:`1px solid ${cat.color}28`,
              marginBottom:8, alignSelf:"flex-start",
            }}>
              <span style={{fontSize:10}}>{cat.emoji}</span>
              <span style={{
                fontSize:10, fontWeight:700, color:cat.color,
                fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
                textTransform:"capitalize",
              }}>
                {survey.category}
              </span>
            </div>
          )}

          {/* "View your answers" — completed, public */}
          {!isOwner && status === "COMPLETED" && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:6,
              background:"rgba(5,150,105,0.06)",
              border:"1px solid rgba(5,150,105,0.14)",
              marginBottom:8, alignSelf:"flex-start",
            }}>
              <Eye size={10} color="#059669"/>
              <span style={{fontSize:10, fontWeight:700, color:"#059669", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
                Xem đáp án của bạn
              </span>
            </div>
          )}

          {/* Spacer */}
          <div style={{flex:1, minHeight:4}}/>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            paddingTop:8,
            borderTop:"1px solid #f4f6f8",
            marginTop:"auto",
          }}>
            <div style={{display:"flex", flexDirection:"column", gap:2}}>
              <div style={{display:"flex", alignItems:"center", gap:3}}>
                <CalendarDays size={9} color="#cbd5e1"/>
                <span style={{fontSize:9.5, fontWeight:600, color:"#94a3b8", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
                  {survey?.updated_at ? fmtDate(survey.updated_at) : survey?.created_at ? fmtDate(survey.created_at) : ""}
                </span>
              </div>
              {expiry && (
                <div style={{display:"flex", alignItems:"center", gap:3}}>
                  <Clock size={9} color={expiry.isExpired ? "#f472b6" : "#cbd5e1"}/>
                  <span style={{fontSize:9.5, fontWeight:600, color: expiry.isExpired ? "#ec4899" : "#94a3b8", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
                    Hết hạn {expiry.text}
                  </span>
                </div>
              )}
            </div>

            <div style={{display:"flex", alignItems:"center", gap:6}}>
              {responseCount > 0 && (
                <div style={{
                  display:"flex", alignItems:"center", gap:2,
                  padding:"2px 7px", borderRadius:6,
                  background:"rgba(99,102,241,0.05)",
                  border:"1px solid rgba(99,102,241,0.10)",
                }}>
                  <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span style={{fontSize:9.5, fontWeight:700, color:"#6366f1", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
                    {responseCount}
                  </span>
                </div>
              )}
              <ParticipantsAvatars participants={survey?.participants}/>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

/* ── Action button ─────────────────────────────────────────── */
function Abtn({ icon, label, on, hovered, accent, danger }) {
  const color   = danger ? (hovered ? "#ef4444" : "#d1d5db")
    : accent ? (hovered ? accent : "#e2e8f0") : "#e2e8f0";
  const bg      = danger ? (hovered ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.55)")
    : accent ? (hovered ? accent + "12" : "rgba(255,255,255,0.55)") : "rgba(255,255,255,0.55)";
  const border  = danger ? (hovered ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.55)")
    : accent ? (hovered ? accent + "30" : "rgba(255,255,255,0.55)") : "rgba(255,255,255,0.55)";
  const backdrop = hovered ? "blur(10px)" : "blur(6px)";
  const webkitBackdrop = hovered ? "blur(10px)" : "blur(6px)";

  return (
    <button
      aria-label={label}
      onClick={e => { e.stopPropagation(); on(); }}
      title={label}
      style={{
        width:26, height:26, borderRadius:8,
        border:`1px solid ${border}`,
        background:bg,
        backdropFilter:backdrop, WebkitBackdropFilter:webkitBackdrop,
        cursor:"pointer", display:"flex",
        alignItems:"center", justifyContent:"center",
        color, padding:0, flexShrink:0,
        transition:"all 0.15s ease",
        boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={e => {
        if (accent && !danger) {
          e.currentTarget.style.background = accent + "18";
          e.currentTarget.style.borderColor = accent + "40";
          e.currentTarget.style.boxShadow = `0 3px 10px ${accent}25`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bg;
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      {icon}
    </button>
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
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f4f6f8" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 3px 12px rgba(99,102,241,0.28)" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={18} cy={5} r={3}/><circle cx={6} cy={12} r={3}/><circle cx={18} cy={19} r={3}/><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/></svg>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>Chia sẻ khảo sát</div>
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

        {/* Body */}
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
