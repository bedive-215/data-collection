import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, Clock, Zap,
  Trophy, Inbox, ArrowRight, Globe, Flame, Target,
  Sparkles, TrendingUp, Rocket, LayoutGrid, Calendar,
  Lock, Share, Link as LinkIcon, X, ExternalLink, Copy, Loader2,
  Users,
} from "lucide-react";
import { useResponse } from "@/providers/ResponseProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { ROUTERS } from "@/utils/constants";
import { SurveyCardHome, STATUS_MAP, C } from "@/components/survey/SurveyCardHome";

/* ── Share Modal ──────────────────────────────────────────────────── */
function ShareModal({ open, onClose, surveyTitle, shareUrl, loading, error, onGenerate }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

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
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn .16s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)",
          width: "100%", maxWidth: 440, overflow: "hidden",
          animation: "slideUp .22s cubic-bezier(.16,1,.3,1)",
          fontFamily: C.font,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, #4361ee, #6c7ef7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Share size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Chia sẻ khảo sát</div>
              <div style={{ fontSize: 11, color: C.textSub, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {surveyTitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textSub, transition: "all .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
              <button
                type="button"
                onClick={onGenerate}
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(255,255,255,0.8)",
                  color: "#ef4444", fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {shareUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "slideUp .2s ease" }}>
              {/* URL display */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px",
                background: "rgba(67,97,238,0.06)",
                borderRadius: 12,
                border: "1px solid rgba(67,97,238,0.18)",
                backdropFilter: "blur(8px)",
              }}>
                <LinkIcon size={13} color="#4f46e5" style={{ flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: 12, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'SF Mono','Fira Code',monospace",
                }}>
                  {shareUrl}
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px 0",
                    borderRadius: 11,
                    border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : "rgba(67,97,238,0.3)"}`,
                    background: copied ? "rgba(16,185,129,0.08)" : "rgba(67,97,238,0.06)",
                    color: copied ? "#10b981" : "#4f46e5",
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  {copied ? (
                    <><CheckCircle2 size={13} /> Đã sao chép!</>
                  ) : (
                    <><Copy size={13} /> Sao chép link</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(shareUrl, "_blank")}
                  style={{
                    width: 42,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 11,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "transparent",
                    color: C.textSub,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.borderColor = "rgba(67,97,238,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "12px 0",
                borderRadius: 12, border: "none",
                background: loading ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg,#4361ee,#6c7ef7)",
                color: loading ? C.textSub : "#fff",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: C.font,
                boxShadow: loading ? "none" : "0 4px 14px rgba(67,97,238,0.35)",
                transition: "all .2s",
              }}
            >
              {loading ? (
                <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang tạo link...</>
              ) : (
                <><LinkIcon size={15} /> Tạo link chia sẻ</>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

function GlassmorphCard({ children, style = {}, delay = 0, hover = true }) {
  const base = {
    background: C.surface,
    backdropFilter: "blur(24px) saturate(190%)",
    WebkitBackdropFilter: "blur(24px) saturate(190%)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 22,
    padding: 24,
    animation: `slideInUp 0.8s ease-out ${delay}s both`,
    transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.22s ease",
    boxShadow: "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)",
    ...style,
  };
  return (
    <div
      style={base}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.95) inset, 0 18px 44px rgba(79,70,229,0.12), 0 0 0 1px rgba(99,102,241,0.12)";
        e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)";
        e.currentTarget.style.borderColor = C.glassBorder;
      } : undefined}
    >
      {children}
    </div>
  );
}

function WelcomeHero({ loading, doneCount, pendingCount, totalCount, onOpenSurveys }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "28px 30px 30px",
        borderRadius: 28,
        overflow: "hidden",
        background: "linear-gradient(148deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.48) 55%, rgba(238,242,255,0.65) 100%)",
        backdropFilter: "blur(26px)",
        WebkitBackdropFilter: "blur(26px)",
        border: "1px solid rgba(255,255,255,0.82)",
        boxShadow: "0 2px 0 rgba(255,255,255,0.95) inset, 0 24px 56px rgba(15,23,42,0.08), 0 48px 90px rgba(79,70,229,0.1)",
        animation: "slideInUp 0.72s ease-out both",
        flex: "1 1 320px",
        minHeight: 220,
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 28 }}>
        <div
          style={{
            position: "absolute",
            top: "-60%",
            left: "-30%",
            width: "55%",
            height: "220%",
            background: "linear-gradient(118deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.15) 58%, transparent 100%)",
            animation: "shimmerSweep 7s ease-in-out infinite",
            transform: "rotate(-18deg)",
            willChange: "transform",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          width: 88,
          height: 88,
          borderRadius: 22,
          background: "linear-gradient(135deg, rgba(129,140,248,0.45), rgba(244,114,182,0.25))",
          opacity: 0.85,
          transform: "rotate(-16deg)",
          pointerEvents: "none",
          filter: "blur(1px)",
          animation: "floatAccent 10s ease-in-out infinite",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(67,97,238,0.35)",
            }}
          >
            <LayoutGrid size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textSub,
              fontFamily: C.font,
            }}
          >
            Trang chủ
          </span>
        </div>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "clamp(26px, 4vw, 34px)",
            fontWeight: 900,
            lineHeight: 1.15,
            fontFamily: C.font,
            background: "linear-gradient(120deg,#0f172a 0%,#4f46e5 42%,#db2777 88%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "titleAurora 8s ease-in-out infinite alternate",
          }}
        >
          Chào mừng trở lại
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: C.textSub, lineHeight: 1.55, maxWidth: 440, fontFamily: C.font }}>
          Theo dõi tiến độ khảo sát công khai, mở nhanh bản thảo của bạn và vào không gian khảo sát khi cần.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={onOpenSurveys}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: C.font,
              color: "#fff",
              background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
              boxShadow: "0 4px 14px rgba(67,97,238,0.35)",
              transition: "transform .15s, box-shadow .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 22px rgba(67,97,238,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(67,97,238,0.35)";
            }}
          >
            Không gian khảo sát <ArrowRight size={14} />
          </button>
          <span style={{ fontSize: 11, color: C.textDim, fontFamily: C.font }}>
            {loading ? "Đang tải…" : `${doneCount}/${totalCount} đã hoàn thành · ${pendingCount} còn lại`}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressHeroCard({ doneCount, pendingCount, totalCount, loading }) {
  return (
    <div
      style={{
        flex: "1 1 280px",
        maxWidth: 420,
        borderRadius: 26,
        padding: "28px 26px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        animation: "slideInUp 0.8s ease-out 0.08s both",
        background: "linear-gradient(148deg,#4361ee 0%,#6c7ef7 45%,#a855f7 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 2px 0 rgba(255,255,255,0.2) inset, 0 20px 48px rgba(67,97,238,0.35)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
        minHeight: 220,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.25) inset, 0 26px 56px rgba(79,70,229,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.2) inset, 0 20px 48px rgba(67,97,238,0.35)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent)",
          borderRadius: "50%",
          opacity: 0.6,
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -24,
          left: -24,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent)",
          borderRadius: "50%",
          opacity: 0.55,
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, fontFamily: C.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Rocket size={26} color="rgba(255,255,255,0.95)" />
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.92 }}>
            Tiến độ công khai
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 900, marginBottom: 22, marginTop: 0, lineHeight: 1.15 }}>
          {loading ? "…" : `${doneCount}/${totalCount}`}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 11, opacity: 0.88, marginBottom: 4 }}>Đã xong</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{loading ? "—" : doneCount}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 11, opacity: 0.88, marginBottom: 4 }}>Chưa làm</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{loading ? "—" : pendingCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoCard({ children, size = "normal", style = {}, delay = 0 }) {
  return (
    <GlassmorphCard
      style={{
        gridColumn: size === "wide" ? "span 2" : "span 1",
        gridRow: size === "tall" ? "span 2" : "span 1",
        minHeight: size === "tall" ? "400px" : "auto",
        ...style,
      }}
      delay={delay}
    >
      {children}
    </GlassmorphCard>
  );
}

function BentoStatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <BentoCard delay={delay}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", fontFamily: C.font }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color}18, ${color}35)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            border: `1px solid ${color}28`,
          }}
        >
          <Icon size={26} color={color} strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textSub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}
          >
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>{sub}</div>}
        </div>
      </div>
    </BentoCard>
  );
}

function ActivityBento({ activity, delay }) {
  return (
    <BentoCard delay={delay}>
      <div style={{ display: "flex", gap: 12, fontFamily: C.font }}>
        <div
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            borderRadius: 12,
            background: activity.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <activity.Icon size={22} color={activity.iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4, marginTop: 0 }}>
            {activity.title}
          </h4>
          <p style={{ fontSize: 11, color: C.textDim, margin: "0 0 8px" }}>{activity.sub}</p>
          <span style={{ fontSize: 12, fontWeight: 700, color: activity.xpColor }}>{activity.xp}</span>
        </div>
      </div>
    </BentoCard>
  );
}

function ChallengeBento() {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: "26px 24px",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
        animation: "slideInUp 0.8s ease-out 0.35s both",
        background: "linear-gradient(148deg,#6366f1 0%,#a855f7 48%,#ec4899 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 2px 0 rgba(255,255,255,0.18) inset, 0 18px 44px rgba(99,102,241,0.35)",
        cursor: "default",
        fontFamily: C.font,
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
        minHeight: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.22) inset, 0 24px 52px rgba(236,72,153,0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.18) inset, 0 18px 44px rgba(99,102,241,0.35)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -36,
          right: -36,
          width: 140,
          height: 140,
          background: "radial-gradient(circle, rgba(255,255,255,0.2), transparent)",
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Flame size={26} color="#fbbf24" />
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.92 }}>
            Thử thách
          </span>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, marginTop: 0 }}>Cuối tuần</h3>
        <p style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 18, opacity: 0.95 }}>
          Hoàn thành <strong>5 khảo sát</strong> trong <strong>48 giờ</strong> để nhận <strong>Bonus 2000 XP</strong>
        </p>
        <button
          type="button"
          style={{
            width: "100%",
            padding: "12px 0",
            background: "rgba(255,255,255,0.95)",
            color: C.primary,
            fontWeight: 800,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: C.font,
            transition: "transform .15s, box-shadow .15s",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
          }}
        >
          Tham gia
        </button>
      </div>
    </div>
  );
}

const ACTIVITIES = [
  { Icon: CheckCircle2, iconColor: "#10b981", iconBg: "#d1fae5", title: "Khảo sát sức khỏe", sub: "Hoàn thành · 2 giờ trước", xp: "+250 XP", xpColor: "#10b981" },
  { Icon: Trophy, iconColor: "#f59e0b", iconBg: "#fef3c7", title: "Đạt cấp 12", sub: "Thành tích · Hôm qua", xp: "+500 XP", xpColor: "#f59e0b" },
  { Icon: Target, iconColor: "#4f46e5", iconBg: "#e0e7ff", title: "Thói quen ăn uống", sub: "Hoàn thành · 1 ngày trước", xp: "+150 XP", xpColor: "#4f46e5" },
];

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.items)) return val.items;
  return [];
}

function SectionHeading({ children, style = {} }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0, fontFamily: C.font, ...style }}>
      {children}
    </h2>
  );
}

const primaryBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
  border: "none",
  padding: "9px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontFamily: C.font,
  boxShadow: "0 4px 14px rgba(67,97,238,0.35)",
  transition: "transform .15s, box-shadow .15s",
};

const successBtn = {
  ...primaryBtn,
  background: "linear-gradient(135deg,#10b981,#059669)",
  boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { getAllMyResponses } = useResponse();
  const { mySurveys, publicSurveys, fetchMySurveys, fetchPublicSurveys, shareLink, closeSurvey } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Share modal state
  const [shareModal, setShareModal] = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });

  const fetchData = async () => {
    try {
      setLoading(true);

      const responsesRes = await getAllMyResponses().catch(() => null);
      const responsesList = toArray(responsesRes);
      setDoneSurveyIds(new Set(responsesList.map((r) => r.survey_id ?? r.surveyId)));

      await Promise.all([fetchMySurveys(1, 20), fetchPublicSurveys()]);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const surveyPath = (id) => ROUTERS.USER.SURVEY_TAKE.replace(":surveyId", id);
  const responsePath = (id) => ROUTERS.USER.SURVEY_RESPONSE.replace(":surveyId", id);

  const handleStart = (id) => navigate(surveyPath(id));

  // Share: open modal (generate link on demand)
  const handleShare = useCallback((surveyId) => {
    const survey = mySurveys.find((s) => s.id === surveyId);
    setShareModal({ open: true, surveyId, surveyTitle: survey?.title || "", shareUrl: "", loading: false, error: "" });
  }, [mySurveys]);

  const handleGenerateLink = async () => {
    setShareModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await shareLink(shareModal.surveyId);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
      setShareModal((prev) => ({ ...prev, shareUrl: url, loading: false }));
    } catch {
      setShareModal((prev) => ({ ...prev, loading: false, error: "Tạo link thất bại. Vui lòng thử lại." }));
    }
  };

  // Lock: close survey and refresh immediately
  const handleLock = useCallback(async (surveyId) => {
    try {
      await closeSurvey(surveyId);
      // Update local state immediately
      setDoneSurveyIds((prev) => {
        const next = new Set(prev);
        next.add(surveyId);
        return next;
      });
      // Refresh surveys
      await fetchMySurveys(1, 20);
    } catch (err) {
      console.error("Lock error:", err);
    }
  }, [closeSurvey, fetchMySurveys]);

  const pendingCount = publicSurveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount = publicSurveys.filter((s) => doneSurveyIds.has(s.id)).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: C.font,
        padding: "16px 18px 48px",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <AnimatedSurveyBackdrop />

      <div style={{ maxWidth: 1260, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 22,
            marginBottom: 36,
          }}
        >
          <WelcomeHero
            loading={loading}
            doneCount={doneCount}
            pendingCount={pendingCount}
            totalCount={publicSurveys.length}
            onOpenSurveys={() => navigate(ROUTERS.USER.SURVEYS)}
          />
          <ProgressHeroCard
            doneCount={doneCount}
            pendingCount={pendingCount}
            totalCount={publicSurveys.length}
            loading={loading}
          />
        </div>

        <div style={{ marginBottom: 36 }}>
          <SectionHeading style={{ marginBottom: 18 }}>Thống kê nhanh</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
            <BentoStatCard icon={ClipboardList} label="Đã hoàn thành" value={loading ? "—" : String(doneCount)} sub={`trên ${publicSurveys.length} khảo sát`} color="#4f46e5" delay={0.1} />
            <BentoStatCard icon={Zap} label="Chưa làm" value={loading ? "—" : String(pendingCount)} sub="Đang chờ bạn" color="#f59e0b" delay={0.15} />
            <BentoStatCard icon={Trophy} label="Điểm thưởng" value="12.450" sub="+250 hôm nay" color="#10b981" delay={0.2} />
            <BentoStatCard icon={TrendingUp} label="Cấp độ" value="12" sub="Nâng cao" color="#a855f7" delay={0.25} />
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <SectionHeading>My Surveys</SectionHeading>
            <button
              type="button"
              onClick={() => navigate(ROUTERS.USER.MY_SURVEYS)}
              style={primaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(67,97,238,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(67,97,238,0.35)";
              }}
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    background: C.surface,
                    borderRadius: 40,
                    height: 240,
                    animation: "pulse 2s ease-in-out infinite",
                    border: `1px solid ${C.glassBorder}`,
                  }}
                />
              ))}
            </div>
          ) : mySurveys.length === 0 ? (
            <GlassmorphCard>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Inbox size={40} color={C.textDim} style={{ marginBottom: 16 }} />
                <p style={{ color: C.textSub, fontSize: 14, fontFamily: C.font }}>Chưa có khảo sát nào</p>
              </div>
            </GlassmorphCard>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
              {mySurveys.slice(0, 5).map((survey, i) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={i}
                  onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                  type="my"
                  onShare={handleShare}
                  onLock={handleLock}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <SectionHeading>Khảo sát công khai</SectionHeading>
            <button
              type="button"
              onClick={() => navigate(ROUTERS.USER.SURVEYS)}
              style={successBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(16,185,129,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(16,185,129,0.32)";
              }}
            >
              Mở không gian khảo sát <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    background: C.surface,
                    borderRadius: 40,
                    height: 240,
                    animation: "pulse 2s ease-in-out infinite",
                    border: `1px solid ${C.glassBorder}`,
                  }}
                />
              ))}
            </div>
          ) : publicSurveys.length === 0 ? (
            <GlassmorphCard>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Globe size={40} color={C.textDim} style={{ marginBottom: 16 }} />
                <p style={{ color: C.textSub, fontSize: 14, fontFamily: C.font }}>Hiện không có khảo sát công khai</p>
              </div>
            </GlassmorphCard>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
              {publicSurveys.slice(0, 5).map((survey, i) => {
                const done = doneSurveyIds.has(survey.id);
                return (
                  <SurveyCardHome
                    key={survey.id}
                    survey={survey}
                    index={i}
                    overrideStatus={done ? "COMPLETED" : null}
                    onClick={() => (done ? navigate(responsePath(survey.id)) : handleStart(survey.id))}
                    type="public"
                  />
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionHeading style={{ marginBottom: 18 }}>Hoạt động & thử thách</SectionHeading>
          <div
            className="home-act-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(260px, 1fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {ACTIVITIES.map((activity, i) => (
                <ActivityBento key={i} activity={activity} delay={0.45 + i * 0.08} />
              ))}
            </div>
            <ChallengeBento />
          </div>
        </div>
      </div>

      <ShareModal
        open={shareModal.open}
        onClose={() => setShareModal((p) => ({ ...p, open: false }))}
        surveyTitle={shareModal.surveyTitle}
        shareUrl={shareModal.shareUrl}
        loading={shareModal.loading}
        error={shareModal.error}
        onGenerate={handleGenerateLink}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInUp   { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float       { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-14px) } }
        @keyframes pulse       { 0%,100% { opacity:.65 } 50% { opacity:1 } }
        @keyframes shimmerSweep{0%{transform:rotate(-18deg) translateX(-55%);}100%{transform:rotate(-18deg) translateX(155%);}}
        @keyframes floatAccent{0%,100%{transform:rotate(-16deg) translate(0,0);}50%{transform:rotate(-12deg) translate(-6px,8px);}}
        @keyframes titleAurora{0%{background-position:0% 50%;}100%{background-position:100% 50%;}}
        * { box-sizing:border-box }
        button { font-family:'Plus Jakarta Sans','DM Sans','Inter',sans-serif }
        @media (max-width: 960px) {
          .home-act-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .home-act-grid > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
