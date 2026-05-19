// src/utils/constants.js
// Shared design tokens and route constants for React Native mobile app

export const APP_BRAND = {
  name: "InsightFlow",
  tagline: "Ask. Listen. Improve.",
};

/* ─── ROUTER NAME CONSTANTS (used by navigation.navigate()) ─── */
export const ROUTERS = {
  // Screen names for React Navigation
  // IMPORTANT: These must match the names registered in RootNavigator.js
  AUTH: {
    LOGIN: "Login",
    REGISTER: "Register",
    FORGOT_PASSWORD: "ForgotPassword",
  },
  MAIN: "MainApp",
  // Survey screens
  SURVEY_TAKE: "SurveyTake",
  MY_SURVEY_DETAIL: "MySurveyDetail",
  QUESTION_SCREEN: "QuestionScreen",
  SURVEY_STUDIO: "SurveyStudio",
  SURVEY_ANALYTICS: "SurveyAnalytics",
  PUBLIC_SURVEY_DETAIL: "PublicSurveyDetail",
  SURVEY_RESPONSE: "SurveyResponse",
  // Other
  NOTIFICATIONS: "Notifications",
};

/* ─── DESIGN TOKENS (matching web theme) ─── */
export const COLORS = {
  bg:           "#eef2ff",
  surface:      "rgba(255,255,255,0.90)",
  glassBorder:  "rgba(255,255,255,0.55)",
  border:       "rgba(99,102,241,0.1)",
  primary:      "#4f46e5",
  primaryLight: "rgba(79,70,229,0.14)",
  primaryGrad:  ["#4361ee", "#6c7ef7"],
  primaryBorder:"rgba(79,70,229,0.35)",
  text:         "#0f172a",
  textSub:      "#64748b",
  textDim:      "#94a3b8",
  error:        "#ef4444",
  errorBg:      "rgba(239,68,68,0.10)",
  errorBorder:  "rgba(239,68,68,0.25)",
  success:      "#10b981",
  successBg:    "rgba(16,185,129,0.10)",
  successBorder:"rgba(16,185,129,0.25)",
  warning:      "#f59e0b",
  warningBg:    "rgba(245,158,11,0.10)",
  warningBorder:"rgba(245,158,11,0.25)",
  white:        "#ffffff",
  gray50:       "#f9fafb",
  gray100:      "#f3f4f6",
  gray200:      "#e5e7eb",
  gray400:      "#9ca3af",
  gray500:      "#6b7280",
  gray700:      "#374151",
  gray900:      "#111827",
  thumbColors: [
    "#ffd6d6", "#d6eaff", "#e3d6ff",
    "#fff3d6", "#d6fff0", "#d6f0ff",
  ],
};

/* ─── STATUS MAP ─── */
export const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: "#059669", bg: "rgba(16,185,129,0.15)" },
  DRAFT:     { label: "Nháp",     color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  EXPIRED:   { label: "Hết hạn",  color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  CLOSED:    { label: "Đã đóng",  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  COMPLETED: { label: "Đã xong",   color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
};

/* ─── QUESTION TYPE LABELS ─── */
export const QUESTION_TYPES = {
  TEXT:            { label: "Văn bản ngắn",         color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  PARAGRAPH:       { label: "Đoạn văn",              color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EMAIL:           { label: "Email",                  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  DATE:            { label: "Ngày tháng",             color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  NUMBER:          { label: "Số",                     color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  RATING:          { label: "Xếp hạng",               color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",          color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn",        color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  DROPDOWN:        { label: "Danh sách thả",          color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  LINEAR_SCALE:    { label: "Phạm vi tuyến tính",     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  TIME:            { label: "Giờ",                    color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  FILE_UPLOAD:     { label: "Tải tệp lên",           color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};

/* ─── API BASE URL ─── */
export const API_BASE_URL = "https://unrestfully-nonforbearing-carlie.ngrok-free.dev";

/* ─── DATE PRESETS (for analytics) ─── */
export const DATE_PRESETS = [
  { label: "7 ngày",    value: "7d",   days: 7 },
  { label: "30 ngày",   value: "30d",  days: 30 },
  { label: "90 ngày",   value: "90d",  days: 90 },
  { label: "Tất cả",    value: "all",  days: null },
];

export function resolveDatePreset(preset) {
  if (preset === "all") return { from: null, to: null };
  const p = DATE_PRESETS.find(d => d.value === preset);
  if (!p || !p.days) return { from: null, to: null };
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - p.days);
  return {
    from: from.toISOString().split("T")[0],
    to:   to.toISOString().split("T")[0],
  };
}
