/**
 * Design System — Shared design tokens cho toàn bộ app
 * Dùng chung cho cả admin (dark) và user (light)
 */

// ─── ADMIN DARK THEME ────────────────────────────────────────────────────────
export const adminTheme = {
  bg: "#080c1a",
  bgSecondary: "#0d1224",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  surfaceActive: "rgba(99,102,241,0.08)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.12)",
  borderActive: "rgba(99,102,241,0.35)",
  text: "#f8fafc",
  textSub: "#94a3b8",
  textDim: "#475569",
  primary: "#6366f1",
  primaryHover: "#7c7ff7",
  primaryDim: "rgba(99,102,241,0.12)",
  primaryBorder: "rgba(99,102,241,0.3)",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.12)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.12)",
  error: "#ef4444",
  errorDim: "rgba(239,68,68,0.12)",
  violet: "#a855f7",
  violetDim: "rgba(168,85,247,0.12)",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  font: "'DM Sans', 'Inter', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 18,
  radiusXl: 24,
  shadow: "0 4px 24px rgba(0,0,0,0.3)",
  shadowSm: "0 2px 12px rgba(0,0,0,0.2)",
  shadowPrimary: "0 4px 20px rgba(99,102,241,0.3)",
};

// ─── USER LIGHT THEME ─────────────────────────────────────────────────────────
export const userTheme = {
  bg: "#f0f2f8",
  bgSecondary: "#ffffff",
  surface: "#ffffff",
  surfaceHover: "#f8fafc",
  surfaceActive: "rgba(99,102,241,0.05)",
  border: "rgba(0,0,0,0.08)",
  borderHover: "rgba(99,102,241,0.2)",
  borderActive: "rgba(99,102,241,0.35)",
  text: "#111827",
  textSub: "#4b5563",
  textDim: "#9ca3af",
  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primaryDim: "rgba(99,102,241,0.08)",
  primaryBorder: "rgba(99,102,241,0.2)",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.08)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.08)",
  error: "#ef4444",
  errorDim: "rgba(239,68,68,0.08)",
  violet: "#a855f7",
  violetDim: "rgba(168,85,247,0.08)",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  font: "'DM Sans', 'Inter', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 18,
  radiusXl: 24,
  shadow: "0 4px 24px rgba(15,23,42,0.06)",
  shadowSm: "0 2px 12px rgba(15,23,42,0.04)",
  shadowPrimary: "0 4px 20px rgba(99,102,241,0.25)",
};

// ─── CHART COLORS ─────────────────────────────────────────────────────────────
export const chartColors = [
  "#6366f1", "#a855f7", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#8b5cf6", "#f97316"
];

// ─── QUESTION TYPE BADGES ──────────────────────────────────────────────────────
export const questionTypeBadge = {
  SINGLE_CHOICE:   { label: "Một lựa chọn", bg: "#e0e7ff", color: "#6366f1" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", bg: "#f3e8ff", color: "#a855f7" },
  DROPDOWN:        { label: "Dropdown", bg: "#ede9fe", color: "#7c3aed" },
  RATING:          { label: "Đánh giá", bg: "#fef3c7", color: "#f59e0b" },
  NUMBER:          { label: "Số", bg: "#cffafe", color: "#06b6d4" },
  DATE:            { label: "Ngày", bg: "#d1fae5", color: "#10b981" },
  TEXT:            { label: "Văn bản", bg: "#fce7f3", color: "#ec4899" },
  PARAGRAPH:       { label: "Đoạn văn", bg: "#fee2e2", color: "#ef4444" },
  EMAIL:           { label: "Email", bg: "#fef9c3", color: "#eab308" },
};

// ─── DATE RANGE PRESETS ────────────────────────────────────────────────────────
export const DATE_PRESETS = [
  { label: "Hôm nay",   value: "today" },
  { label: "7 ngày",   value: "7d" },
  { label: "30 ngày",  value: "30d" },
  { label: "Tháng này", value: "this_month" },
  { label: "Tháng trước", value: "last_month" },
  { label: "Tùy chỉnh", value: "custom" },
];

export function resolveDatePreset(preset) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last_month":
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return { from: null, to: null };
  }

  return {
    from: preset !== "custom" ? start.toISOString().split("T")[0] : null,
    to: preset !== "custom" ? end.toISOString().split("T")[0] : null,
  };
}

// ─── FORMATTING HELPERS ────────────────────────────────────────────────────────
export function formatNumber(n) {
  if (typeof n !== "number") return n ?? "—";
  return n.toLocaleString("vi-VN");
}

export function formatPercent(n) {
  if (typeof n !== "number") return "—";
  return `${n.toFixed(1)}%`;
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}p ${s}s`;
}

export function truncate(str, max = 50) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── ANIMATION KEYFRAMES (inject vào document) ─────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.3); }

  input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
`;

export function injectGlobalCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("survey-design-system")) return;
  const style = document.createElement("style");
  style.id = "survey-design-system";
  style.textContent = GLOBAL_CSS;
  document.head.appendChild(style);
}
