/**
 * Shared Skeleton Components
 * Dùng chung cho cả admin (dark) và user (light)
 */
import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

// ─── CORE SHIMMER ─────────────────────────────────────────────────────────────
export function Shimmer({ width = "100%", height = 20, radius = 12, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(128,128,128,0.08) 25%, rgba(128,128,128,0.14) 50%, rgba(128,128,128,0.08) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.6s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ─── TEXT LINE ─────────────────────────────────────────────────────────────────
export function SkeletonText({ lines = 1, lastWidth = "60%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Shimmer key={i} height={14} />
      ))}
      <Shimmer height={14} width={lastWidth} />
    </div>
  );
}

// ─── AVATAR ────────────────────────────────────────────────────────────────────
export function SkeletonAvatar({ size = 40 }) {
  return <Shimmer width={size} height={size} radius={size / 2} />;
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function SkeletonCard({ theme = "dark" }) {
  const isDark = theme === "dark";
  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
      borderRadius: 18,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SkeletonAvatar size={42} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Shimmer width="55%" height={14} />
          <Shimmer width="35%" height={12} />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div style={{ display: "flex", gap: 8 }}>
        <Shimmer width={80} height={30} radius={8} />
        <Shimmer width={60} height={30} radius={8} />
      </div>
    </div>
  );
}

// ─── ANALYTICS STAT CARD SKELETON ───────────────────────────────────────────────
export function SkeletonStatCard({ theme = "dark" }) {
  const isDark = theme === "dark";
  return (
    <div style={{
      background: isDark
        ? "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))"
        : "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))",
      border: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.15)"}`,
      borderRadius: 18,
      padding: "20px 22px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Shimmer width={90} height={11} radius={6} />
          <Shimmer width={120} height={30} radius={8} />
        </div>
        <Shimmer width={44} height={44} radius={12} />
      </div>
    </div>
  );
}

// ─── ANALYTICS CHART SKELETON ──────────────────────────────────────────────────
export function SkeletonChart({ height = 280, theme = "dark" }) {
  const isDark = theme === "dark";
  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
      borderRadius: 18,
      padding: 22,
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Shimmer width={36} height={36} radius={10} />
        <Shimmer width={140} height={16} radius={8} />
      </div>
      <Shimmer height={height} radius={12} />
    </div>
  );
}

// ─── QUESTION CARD SKELETON ────────────────────────────────────────────────────
export function SkeletonQuestionCard({ theme = "dark" }) {
  const isDark = theme === "dark";
  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
      borderRadius: 18,
      padding: "18px 22px",
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Shimmer width={42} height={42} radius={12} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Shimmer width="75%" height={14} radius={7} />
          <div style={{ display: "flex", gap: 8 }}>
            <Shimmer width={90} height={22} radius={8} />
            <Shimmer width={70} height={22} radius={8} />
          </div>
        </div>
        <Shimmer width={32} height={32} radius={10} />
      </div>
    </div>
  );
}

// ─── TABLE ROW SKELETON ────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 5, theme = "dark" }) {
  const isDark = theme === "dark";
  return (
    <div style={{
      display: "flex",
      gap: 12,
      padding: "14px 18px",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      alignItems: "center",
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Shimmer key={i} height={14} radius={6} style={{ flex: 1 }} />
      ))}
    </div>
  );
}

// ─── FULL PAGE SKELETON ────────────────────────────────────────────────────────
export function SkeletonAnalyticsPage({ theme = "dark" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} theme={theme} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <SkeletonChart height={260} theme={theme} />
        <SkeletonChart height={260} theme={theme} />
      </div>

      {/* More charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SkeletonChart height={260} theme={theme} />
        <SkeletonChart height={260} theme={theme} />
      </div>

      {/* Question cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map(i => <SkeletonQuestionCard key={i} theme={theme} />)}
      </div>
    </div>
  );
}

// Retry Section (dùng chung)
export function RetrySection({ error, onRetry, isLoading, children, theme = "dark" }) {
  const isDark = theme === "dark";
  if (isLoading) return <>{children}</>;

  if (error) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)"}`,
        borderRadius: 18, gap: 12, textAlign: "center",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
          border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertTriangle size={22} color="#ef4444" />
        </div>
        <p style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b", margin: 0, fontWeight: 600 }}>
          Không tải được dữ liệu
        </p>
        <p style={{ fontSize: 11, color: isDark ? "#475569" : "#94a3b8", margin: 0 }}>
          {error?.message || error || "Đã xảy ra lỗi"}
        </p>
        <button onClick={onRetry} style={{
          marginTop: 4, padding: "8px 20px", borderRadius: 10,
          border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.25)"}`,
          background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
          color: isDark ? "#818cf8" : "#6366f1", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Inject animation keyframes once
if (typeof document !== "undefined") {
  if (!document.getElementById("skeleton-keyframes")) {
    const s = document.createElement("style");
    s.id = "skeleton-keyframes";
    s.textContent = `
      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(s);
  }
}
