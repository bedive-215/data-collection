import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, Clock, Zap,
  Trophy, Inbox, ArrowRight, Globe, Flame, Target,
  Sparkles, TrendingUp, Rocket, LayoutGrid,
} from "lucide-react";
import { useResponse } from "@/providers/ResponseProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { ROUTERS } from "@/utils/constants";

const STATUS_MAP = {
  ACTIVE: { label: "Đang mở", color: "#10b981", bg: "#d1fae5" },
  DRAFT: { label: "Nháp", color: "#6b7280", bg: "#f3f4f6" },
  EXPIRED: { label: "Hết hạn", color: "#dc2626", bg: "#fee2e2" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706", bg: "#fef3c7" },
  CLOSED: { label: "Đã đóng", color: "#6b7280", bg: "#f3f4f6" },
  COMPLETED: { label: "Đã hoàn thành", color: "#06b6d4", bg: "#cffafe" },
};

/* Đồng bộ SurveysLayout — C */
const C = {
  surface: "rgba(255,255,255,0.78)",
  surfaceHigh: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(255,255,255,0.55)",
  primary: "#4f46e5",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  font: "'DM Sans','Inter',sans-serif",
  thumbGrads: [
    "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
    "conic-gradient(from 0deg at 50% 50%, #a8edea, #fed6e3, #ff9999, #a8edea)",
    "conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #f093fb, #667eea)",
    "conic-gradient(from 0deg at 50% 50%, #f5af19, #f12711, #fa709a, #f5af19)",
    "conic-gradient(from 0deg at 50% 50%, #4facfe, #00f2fe, #43e97b, #4facfe)",
    "conic-gradient(from 0deg at 50% 50%, #30cfd0, #330867, #a8edea, #30cfd0)",
  ],
};

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

function SurveyCardHome({ survey, index, onClick, type = "my", overrideStatus = null }) {
  const gradient = C.thumbGrads[index % C.thumbGrads.length];
  const effectiveStatus = overrideStatus || survey.status;
  const isCompleted = effectiveStatus === "COMPLETED";
  const isClosed = effectiveStatus === "CLOSED";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{
        background: C.surfaceHigh,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.22s ease",
        opacity: isClosed ? 0.55 : 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: `slideInUp 0.8s ease-out ${0.1 + index * 0.08}s both`,
        boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 12px 28px rgba(15,23,42,0.08)",
        border: "1px solid rgba(255,255,255,0.75)",
        fontFamily: C.font,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.95) inset, 0 18px 40px rgba(79,70,229,0.14)";
        e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.9) inset, 0 12px 28px rgba(15,23,42,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.75)";
      }}
    >
      <div
        style={{
          height: 132,
          background: isClosed ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)" : gradient,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, rgba(255,255,255,0.12), transparent 50%, rgba(0,0,0,0.04))" }} />
        <Sparkles size={48} color={isClosed ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.22)"} strokeWidth={0.8} />

        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          {effectiveStatus && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                color: STATUS_MAP[effectiveStatus]?.color,
                background: STATUS_MAP[effectiveStatus]?.bg,
                border: `1px solid ${STATUS_MAP[effectiveStatus]?.color}35`,
              }}
            >
              {STATUS_MAP[effectiveStatus]?.label}
            </span>
          )}
        </div>

        {survey.is_published && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 9,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              color: "#059669",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.28)",
            }}
          >
            <Globe size={10} /> Live
          </div>
        )}
      </div>

      <div style={{ padding: "18px 18px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.text,
            marginBottom: 8,
            marginTop: 0,
            lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {survey.title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: C.textSub,
            lineHeight: 1.5,
            marginBottom: 12,
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {survey.description || "Không có mô tả"}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textDim }}>
            <Clock size={12} />
            {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
          </div>

          {type === "public" && !isCompleted && (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
                color: "#fff",
                border: "none",
                boxShadow: "0 3px 12px rgba(67,97,238,0.3)",
              }}
            >
              Bắt đầu
            </span>
          )}

          {type === "public" && isCompleted && (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(14,165,233,0.12)",
                color: "#0369a1",
                border: "1px solid rgba(14,165,233,0.25)",
              }}
            >
              Xem chi tiết
            </span>
          )}
        </div>
      </div>
    </div>
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
  const { mySurveys, publicSurveys, fetchMySurveys, fetchPublicSurveys } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: C.surface,
                    borderRadius: 20,
                    height: 300,
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {mySurveys.slice(0, 4).map((survey, i) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={i}
                  onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                  type="my"
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: C.surface,
                    borderRadius: 20,
                    height: 300,
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {publicSurveys.slice(0, 4).map((survey, i) => {
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInUp   { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float       { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-14px) } }
        @keyframes pulse       { 0%,100% { opacity:.65 } 50% { opacity:1 } }
        @keyframes shimmerSweep{0%{transform:rotate(-18deg) translateX(-55%);}100%{transform:rotate(-18deg) translateX(155%);}}
        @keyframes floatAccent{0%,100%{transform:rotate(-16deg) translate(0,0);}50%{transform:rotate(-12deg) translate(-6px,8px);}}
        @keyframes titleAurora{0%{background-position:0% 50%;}100%{background-position:100% 50%;}}
        * { box-sizing:border-box }
        button { font-family:'DM Sans','Inter',sans-serif }
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
