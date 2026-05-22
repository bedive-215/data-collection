// ─── SurveyCardHome.jsx ────────────────────────────────────────────────
// Premium Survey Card — 100% match to reference HTML template.
// ─────────────────────────────────────────────────────────────────────

import React from "react";
import {
  Lock, Share, BarChart3, Edit, Trash2, Globe,
  X, Link as LinkIcon, ExternalLink, Copy, CheckCircle2, Loader2,
} from "lucide-react";

/* ─── SVG icons matching Material Symbols ─────────────────────────── */
// "description" — document with lines
function IconDescription({ size = 30, color = "rgba(255,255,255,0.95)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
  );
}

// "calendar_today"
function IconCalendar({ size = 20, color = "#94a3b8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM5 6V5h14v1H5z"/>
    </svg>
  );
}

/* ── Color / SC export (used by DashboardPage via `const C = SC`) ── */
export const C = {
  surface:     "rgba(255,255,255,0.78)",
  glassBorder: "rgba(255,255,255,0.55)",
  text:        "#0f172a",
  textSub:     "#64748b",
  textDim:     "#94a3b8",
  font:        "'Plus Jakarta Sans','DM Sans',sans-serif",
};

/* ── Status configs — mesh-gradient exact from HTML ──────────────── */
export const STATUS_CONFIG_MOBILE = {
  ACTIVE: {
    label:      "Đang mở",
    textColor:  "#166534",
    pulseInner: "#22c55e",
    pulseOuter: "#86efac",
    meshBg:     "#ffffff",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(152,68%,85%,0.55) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(320,75%,85%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(48,100%,80%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(188,65%,80%,0.52) 0px, transparent 50%)",
      "radial-gradient(at 50% 50%, hsla(268,65%,88%,0.38) 0px, transparent 50%)",
    ].join(","),
  },
  DRAFT: {
    label:     "Nháp",
    textColor: "#374151",
    pulseInner: null,
    meshBg:    "#f8fafc",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(215,40%,92%,0.55) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(220,25%,88%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(215,22%,85%,0.48) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(215,30%,90%,0.52) 0px, transparent 50%)",
    ].join(","),
  },
  EXPIRED: {
    label:     "Hết hạn",
    textColor: "#991b1b",
    pulseInner: null,
    meshBg:    "#fef2f2",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(0,86%,92%,0.55) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(0,78%,88%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(0,80%,85%,0.48) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(0,75%,90%,0.52) 0px, transparent 50%)",
    ].join(","),
  },
  CLOSED: {
    label:     "Đã đóng",
    textColor: "#374151",
    pulseInner: null,
    meshBg:    "#f8fafc",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(215,35%,90%,0.55) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(220,22%,86%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(215,24%,83%,0.48) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(215,28%,88%,0.52) 0px, transparent 50%)",
    ].join(","),
  },
  SCHEDULED: {
    label:     "Lên lịch",
    textColor: "#92400e",
    pulseInner: null,
    meshBg:    "#fffbeb",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(48,96%,90%,0.55) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(38,92%,85%,0.5) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(35,88%,82%,0.48) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(42,94%,88%,0.52) 0px, transparent 50%)",
    ].join(","),
  },
  COMPLETED: {
    label:     "Đã hoàn thành",
    textColor: "#0f766e",
    pulseInner: null,
    meshBg:    "#f0fdfa",
    meshImage: [
      "radial-gradient(at 0% 0%, hsla(152,68%,82%,0.4) 0px, transparent 50%)",
      "radial-gradient(at 100% 0%, hsla(188,65%,80%,0.38) 0px, transparent 50%)",
      "radial-gradient(at 100% 100%, hsla(165,62%,78%,0.36) 0px, transparent 50%)",
      "radial-gradient(at 0% 100%, hsla(178,65%,80%,0.38) 0px, transparent 50%)",
    ].join(","),
  },
};

export const STATUS_MAP = STATUS_CONFIG_MOBILE;

function getCfg(status) {
  return STATUS_CONFIG_MOBILE[status?.toUpperCase()] || STATUS_CONFIG_MOBILE.DRAFT;
}

/* ── Participants avatars — flex -space-x-3 ──────────────────────── */
const AV_COLORS = [
  { bg: "#e0e7ff", color: "#4338ca" }, // indigo-100 / indigo-600
  { bg: "#ffe4e6", color: "#be123c" }, // rose-100 / rose-600
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef3c7", color: "#92400e" },
];
function initials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}
export function ParticipantsAvatars({ participants, max = 3 }) {
  if (!participants?.length) return null;
  const vis   = participants.slice(0, max);
  const extra = participants.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {vis.map((p, i) => {
        const av = AV_COLORS[i % AV_COLORS.length];
        return (
          <div key={p.id || i} title={p.email || p.name || ""} style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "2px solid white",
            background: av.bg, color: av.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700,
            marginLeft: i === 0 ? 0 : -10,
            zIndex: vis.length - i, position: "relative", flexShrink: 0,
            fontFamily: C.font,
          }}>
            {initials(p.name, p.email)}
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: "2px solid white",
          background: "#f1f5f9", color: "#64748b",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, marginLeft: -10,
          zIndex: 0, position: "relative", fontFamily: C.font,
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ── Time formatter ──────────────────────────────────────────────── */
function fmtTime(survey) {
  if (!survey) return "Không rõ";
  const now = new Date();
  if (survey.end_at) {
    const end = new Date(survey.end_at);
    if (end < now) return `Hết hạn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
    return `Còn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  if (survey.start_at) {
    const s = new Date(survey.start_at);
    if (s > now) return `Sắp tới · ${s.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  return "Vừa xong";
}

/* ════════════════════════════════════════════════════════════════════
   SurveyCardHome — mirrors the reference HTML structure 1:1
   ════════════════════════════════════════════════════════════════════ */
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
  isOwner: isOwnerProp = null,
  creatorName = null,
}) {
  const isOwner = isOwnerProp !== null ? isOwnerProp : (type === "my");
  const status  = overrideStatus || survey?.status;
  const cfg     = getCfg(status);
  const isPublished = survey?.is_published;

  // ── Non-owner card uses muted header colors ──
  const headerBg     = isOwner ? cfg.meshBg : "#f8fafc";
  const headerImage = isOwner ? cfg.meshImage : [
    "radial-gradient(at 0% 0%, hsla(215,40%,92%,0.55) 0px, transparent 50%)",
    "radial-gradient(at 100% 0%, hsla(220,25%,88%,0.5) 0px, transparent 50%)",
    "radial-gradient(at 100% 100%, hsla(215,22%,85%,0.48) 0px, transparent 50%)",
    "radial-gradient(at 0% 100%, hsla(215,30%,90%,0.52) 0px, transparent 50%)",
  ].join(",");
  const cardBorder  = isOwner ? "1px solid #f1f5f9" : "1px solid rgba(108,126,247,0.25)";
  const cardShadow = isOwner
    ? "0 32px 64px -16px rgba(0,0,0,0.1)"
    : "0 8px 32px -8px rgba(108,126,247,0.18)";

  /* Glass button — w-9 h-9 rounded-xl glass-effect */
  const GlassBtn = ({ label, onClick: hdl, children }) => (
    <button
      aria-label={label}
      onClick={e => { e.stopPropagation(); hdl(); }}
      style={{
        width: 36, height: 36,            // w-9 h-9
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 12,                 // rounded-xl
        background: "rgba(255,255,255,0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.5)",
        cursor: "pointer",
        color: "#334155",                 // text-slate-700
        padding: 0, flexShrink: 0,
        transition: "background 0.3s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}
    >
      {children}
    </button>
  );

  return (
    <>
      <style>{`
        @keyframes htmlPulseDot {
          0%   { transform:scale(.95); box-shadow:0 0 0 0 rgba(34,197,94,.7); }
          70%  { transform:scale(1);   box-shadow:0 0 0 6px rgba(34,197,94,0); }
          100% { transform:scale(.95); box-shadow:0 0 0 0 rgba(34,197,94,0); }
        }
        .sc-card {
          transition: box-shadow .7s ease;
          cursor: pointer;
        }
        .sc-card:hover {
          box-shadow: 0 48px 80px -24px rgba(0,0,0,0.15) !important;
        }
        .sc-card:hover .sc-icon {
          transform: scale(1.05);
        }
        .sc-card:hover .sc-h2 {
          transform: translateX(4px);
        }
        .sc-icon { transition: transform .5s ease; }
        .sc-h2   { transition: transform .3s ease; }
      `}</style>

      {/*
        <article class="max-w-[420px] w-full bg-white rounded-[40px] overflow-hidden
          shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100
          transition-all duration-700 group">
      */}
      <article
        className="sc-card"
        onClick={() => onClick?.(survey)}
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#ffffff",
          borderRadius: 40,
          overflow: "hidden",
          boxShadow: cardShadow,
          border: cardBorder,
          fontFamily: C.font,
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* ── TopSection ── */}
        <section style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          height: 110,
          backgroundColor: headerBg,
          backgroundImage: headerImage,
          flexShrink: 0,
        }}>

          {/* Status Badge */}
          <div style={{
            position: "absolute", top: 12, left: 16, zIndex: 10,
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}>
            {cfg.pulseInner && (
              <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7, flexShrink: 0 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: cfg.pulseOuter, opacity: 0.7,
                  animation: "htmlPulseDot 2s infinite",
                }} />
                <span style={{
                  position: "relative", display: "inline-flex",
                  width: 7, height: 7, borderRadius: "50%",
                  background: cfg.pulseInner,
                }} />
              </span>
            )}
            <span style={{
              color: cfg.textColor,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              lineHeight: 1,
              fontFamily: C.font,
            }}>
              {cfg.label}
            </span>
          </div>

          {/* Action Bar */}
          <div style={{
            position: "absolute", top: 12, right: 16, zIndex: 10,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {isOwner ? (
              <>
                {onLock && (
                  <GlassBtn label="Khóa khảo sát" onClick={() => onLock(survey.id)}>
                    <Lock size={16} />
                  </GlassBtn>
                )}
                {onShare && (
                  <GlassBtn label="Chia sẻ" onClick={() => onShare(survey.id)}>
                    <Share size={16} />
                  </GlassBtn>
                )}
                {onViewAnalytics && (
                  <GlassBtn label="Phân tích" onClick={() => onViewAnalytics(survey.id)}>
                    <BarChart3 size={16} />
                  </GlassBtn>
                )}
                {onEdit && (
                  <GlassBtn label="Chỉnh sửa" onClick={() => onEdit(survey.id)}>
                    <Edit size={16} />
                  </GlassBtn>
                )}
                {onPublish && (
                  <GlassBtn label={isPublished ? "Bỏ công khai" : "Công khai"} onClick={() => onPublish(survey.id)}>
                    {isPublished ? <Lock size={16} /> : <Globe size={16} />}
                  </GlassBtn>
                )}
                {onDelete && (
                  <GlassBtn label="Xóa" onClick={() => onDelete(survey.id)}>
                    <Trash2 size={16} />
                  </GlassBtn>
                )}
              </>
            ) : (
              /* Non-owner: only delete button */
              onDelete && (
                <GlassBtn label="Xóa khảo sát" onClick={() => onDelete(survey.id)}>
                  <Trash2 size={16} />
                </GlassBtn>
              )
            )}
          </div>

          {/* Central Document Icon */}
          <div className="sc-icon" style={{
            width: 56, height: 56,
            borderRadius: 20,
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 8px 32px 0 rgba(31,38,135,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 5,
          }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: 9,
              background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconDescription size={20} color="rgba(255,255,255,0.95)" />
            </div>
          </div>

          {/* Bottom Blur Edge */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 24,
            background: "linear-gradient(to top, #ffffff, transparent)",
            pointerEvents: "none",
          }} />
        </section>

        {/* ── BottomSection ── */}
        <section style={{
          background: "#ffffff",
          display: "flex", flexDirection: "column",
          padding: "12px 18px",
          gap: 8,
        }}>

          {/* gap-8px */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <h2 className="sc-h2" style={{
              margin: 0,
              color: "#0F172A",
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              fontFamily: C.font,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}>
              {survey?.title || "Không có tiêu đề"}
            </h2>

            <p style={{
              margin: 0,
              color: "#64748B",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.5,
              opacity: 0.8,
              fontFamily: C.font,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}>
              {survey?.description || "Không có mô tả"}
            </p>
          </div>

          {/* Creator badge for non-owner surveys */}
          {!isOwner && (creatorName || survey?.creator?.full_name || survey?.creator?.email) && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:6,
              background:"rgba(108,126,247,0.08)",
              border:"1px solid rgba(108,126,247,0.2)",
              marginTop:2,
            }}>
              <span style={{fontSize:9, fontWeight:700, color:"#6c7ef7", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:C.font}}>
                Tạo bởi
              </span>
              <span style={{fontSize:10, fontWeight:600, color:"#475569", fontFamily:C.font}}>
                {creatorName || survey?.creator?.full_name || survey?.creator?.email}
              </span>
            </div>
          )}

          {/* Footer Info
              <div class="border-t border-slate-100 flex items-center justify-between mt-2 pt-4">
          */}
          <div style={{
            borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 6,
            paddingTop: 10,
          }}>

            {/* Left: calendar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30,
                background: "#f8fafc",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <IconCalendar size={15} color="#94a3b8" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: C.font,
                }}>
                  {isOwner ? "Cập nhật" : "Tạo"}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: "#475569",
                  fontFamily: C.font,
                }}>
                  {fmtTime(survey)}
                </span>
              </div>
            </div>

            {/* Right: avatars */}
            <ParticipantsAvatars participants={survey?.participants} />
          </div>
        </section>
      </article>
    </>
  );
}

/* ── ShareModal ──────────────────────────────────────────────────── */
export function ShareModal({ open, onClose, surveyTitle, shareUrl, loading, error, onGenerate }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => { if (!open) setCopied(false); }, [open]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "smFade .16s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 24, border: "1px solid rgba(255,255,255,0.55)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 440, overflow: "hidden",
        animation: "smUp .22s cubic-bezier(.16,1,.3,1)",
        fontFamily: C.font,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#4361ee,#6c7ef7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Chia sẻ khảo sát</div>
              <div style={{ fontSize: 11, color: C.textSub, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{surveyTitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
          ><X size={13} /></button>
        </div>
        {/* Body */}
        <div style={{ padding: 20 }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
              <button type="button" onClick={onGenerate} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(255,255,255,0.8)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Thử lại</button>
            </div>
          )}
          {shareUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(67,97,238,0.06)", borderRadius: 12, border: "1px solid rgba(67,97,238,0.18)" }}>
                <LinkIcon size={13} color="#4f46e5" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'SF Mono','Fira Code',monospace" }}>{shareUrl}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={handleCopy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 11, border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : "rgba(67,97,238,0.3)"}`, background: copied ? "rgba(16,185,129,0.08)" : "rgba(67,97,238,0.06)", color: copied ? "#10b981" : "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                  {copied ? <><CheckCircle2 size={13} /> Đã sao chép!</> : <><Copy size={13} /> Sao chép link</>}
                </button>
                <button type="button" onClick={() => window.open(shareUrl, "_blank")} style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: C.textSub, cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.borderColor = "rgba(67,97,238,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                ><ExternalLink size={14} /></button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={onGenerate} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: loading ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg,#4361ee,#6c7ef7)", color: loading ? C.textSub : "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: C.font, boxShadow: loading ? "none" : "0 4px 14px rgba(67,97,238,0.35)", transition: "all .2s" }}>
              {loading ? <><Loader2 size={15} style={{ animation: "smSpin 1s linear infinite" }} /> Đang tạo link...</> : <><LinkIcon size={15} /> Tạo link chia sẻ</>}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes smFade { from{opacity:0} to{opacity:1} }
        @keyframes smUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes smSpin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}