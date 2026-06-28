/**
 * Admin Design System — Warm Dark Premium Theme
 * Dùng cho toàn bộ admin dashboard
 * Phiên bản: v2 — thống nhất màu sắc, loại bỏ xung đột
 */

// ─── SHARED CHART COLORS (standalone export) ───────────────────────────────────
export const chartColors = ["#5B4EE8","#6366F1","#8B5CF6","#10B981","#3B82F6","#EC4899","#EF4444","#14B8A6"];

// ─── ADMIN DARK THEME ────────────────────────────────────────────────────────
export const adminTheme = {
  // ─── Nền & Bề mặt ────────────────────────────────────────────────────
  bg:           "#F0EBF8",
  bgSecondary:  "#FFFFFF",
  surface:      "#FFFFFF",
  surfaceHover: "#F3F4F7",
  surfaceActive:"rgba(59,130,246,0.08)",
  surfaceGlass: "rgba(255,255,255,0.9)",

  // ─── Border ────────────────────────────────────────────────────────────
  border:        "#E8E6F0",
  borderHover:   "#D1D5DB",
  borderActive:  "rgba(59,130,246,0.4)",

  // ─── Text ─────────────────────────────────────────────────────────────
  text:       "#111827",
  textSub:    "#374151",
  textDim:    "#9CA3AF",

  // ─── Màu chính (Xanh lam — chủ đạo) ───────────────────────────────
  primary:       "#3B82F6",
  primaryHover:  "#2563EB",
  primaryDim:   "rgba(59,130,246,0.12)",
  primaryBorder: "rgba(59,130,246,0.3)",

  // ─── Màu phụ (Xanh lam — cho data visualization) ──────────────────────
  secondary:     "#3B82F6",
  secondaryDim:  "rgba(59,130,246,0.12)",

  // ─── Accent ───────────────────────────────────────────────────────────
  accent:        "#60A5FA",
  accentDim:     "rgba(96,165,250,0.12)",

  // ─── Trạng thái ──────────────────────────────────────────────────────
  success:      "#10B981",
  successDim:   "rgba(16,185,129,0.12)",
  warning:      "#F59E0B",
  warningDim:   "rgba(245,158,11,0.12)",
  error:       "#EF4444",
  errorDim:    "rgba(239,68,68,0.12)",
  info:        "#3B82F6",
  infoDim:     "rgba(59,130,246,0.12)",

  // ─── Chart colors ─────────────────────────────────────────────────────
  chartColors: ["#3B82F6","#60A5FA","#10B981","#F59E0B","#EC4899","#EF4444","#8B5CF6","#14B8A6"],

  // ─── Typography ───────────────────────────────────────────────────────
  font:     "'Plus Jakarta Sans', 'Inter', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",

  // ─── Border radius ────────────────────────────────────────────────────
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 18,
  radiusXl: 24,

  // ─── Shadows ──────────────────────────────────────────────────────────
  shadow:          "0 4px 24px rgba(0,0,0,0.06)",
  shadowSm:        "0 2px 12px rgba(0,0,0,0.04)",
  shadowPrimary:   "0 4px 20px rgba(59,130,246,0.2)",
  shadowCard:      "0 8px 32px rgba(0,0,0,0.08)",
  shadowGlow:      "0 0 40px rgba(59,130,246,0.06)",
};

// ─── USER LIGHT THEME ─────────────────────────────────────────────────────────
export const userTheme = {
  bg:           "#F8F9FC",
  bgSecondary:  "#FFFFFF",
  surface:      "#FFFFFF",
  surfaceHover: "#F3F4F7",
  surfaceActive:"rgba(59,130,246,0.06)",
  surfaceGlass: "rgba(255,255,255,0.9)",
  border:        "rgba(0,0,0,0.07)",
  borderHover:   "rgba(0,0,0,0.12)",
  borderActive:  "rgba(59,130,246,0.35)",
  text:       "#111827",
  textSub:    "#4B5563",
  textDim:    "#9CA3AF",
  primary:       "#3B82F6",
  primaryHover:  "#2563EB",
  primaryDim:   "rgba(59,130,246,0.08)",
  primaryBorder: "rgba(59,130,246,0.2)",
  secondary:     "#3B82F6",
  secondaryDim:  "rgba(59,130,246,0.08)",
  accent:        "#60A5FA",
  accentDim:     "rgba(96,165,250,0.08)",
  success:      "#10B981",
  successDim:   "rgba(16,185,129,0.08)",
  warning:      "#F59E0B",
  warningDim:   "rgba(245,158,11,0.08)",
  error:       "#EF4444",
  errorDim:    "rgba(239,68,68,0.08)",
  info:        "#3B82F6",
  infoDim:     "rgba(59,130,246,0.08)",
  chartColors: ["#3B82F6","#60A5FA","#10B981","#F59E0B","#EC4899","#EF4444","#8B5CF6","#14B8A6"],
  font:     "'Plus Jakarta Sans', 'Inter', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 18,
  radiusXl: 24,
  shadow:      "0 4px 24px rgba(15,23,42,0.06)",
  shadowSm:    "0 2px 12px rgba(15,23,42,0.04)",
  shadowPrimary:"0 4px 20px rgba(59,130,246,0.2)",
  shadowCard:   "0 8px 32px rgba(15,23,42,0.08)",
  shadowGlow:   "0 0 40px rgba(59,130,246,0.06)",
};

// ─── QUESTION TYPE BADGES ──────────────────────────────────────────────────────
export const questionTypeBadge = {
  SINGLE_CHOICE:   { label: "Một lựa chọn", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  MULTIPLE_CHOICE:{ label: "Nhiều lựa chọn", bg: "rgba(96,165,250,0.12)", color: "#60A5FA" },
  DROPDOWN:        { label: "Dropdown", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  RATING:          { label: "Đánh giá", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  NUMBER:          { label: "Số", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  DATE:            { label: "Ngày", bg: "rgba(16,185,129,0.12)", color: "#10B981" },
  TEXT:            { label: "Văn bản", bg: "rgba(236,72,153,0.12)", color: "#EC4899" },
  PARAGRAPH:       { label: "Đoạn văn", bg: "rgba(239,68,68,0.12)", color: "#EF4444" },
  EMAIL:           { label: "Email", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
};

// ─── DATE RANGE PRESETS ────────────────────────────────────────────────────────
export const DATE_PRESETS = [
  { label: "Hôm nay",    value: "today" },
  { label: "7 ngày",    value: "7d" },
  { label: "30 ngày",   value: "30d" },
  { label: "Tháng này", value: "this_month" },
  { label: "Tháng trước",value: "last_month" },
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
    to:   preset !== "custom" ? end.toISOString().split("T")[0]   : null,
  };
}

// ─── FORMATTING HELPERS ───────────────────────────────────────────────────────
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

// ─── GLOBAL CSS (inject vào document) ─────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.15); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.25); }

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
