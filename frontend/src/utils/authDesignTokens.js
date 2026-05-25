/**
 * Auth Design System — Matching Home Page Background
 *
 * Uses AnimatedSurveyBackdrop (mesh gradient on #F8FAFC).
 * Card is frosted glass matching GlassmorphCard from Home.
 */

export const DS = {
  // ── Background: same as Home page ─────────────────────────────────
  // AnimatedSurveyBackdrop lives at: @/components/AnimatedSurveyBackdrop

  // ── Frosted glass card (matches GlassmorphCard in Home) ─────────────
  cardBg: "rgba(255,255,255,0.82)",
  cardBgOpaque: "#ffffff",
  cardBorder: "rgba(255,255,255,0.6)",
  cardBlur: "blur(24px)",
  cardShadow: "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 48px rgba(15,23,42,0.10)",
  cardRadius: "28px",
  cardPadding: "44px",

  // ── Primary accent ─────────────────────────────────────────────────
  primary: "#4361ee",
  primaryEnd: "#6c7ef7",
  primaryHover: "#3451d1",
  primaryGlow: "0 4px 14px rgba(67,97,238,0.35)",

  // ── Input ────────────────────────────────────────────────────────
  inputBg: "#ffffff",
  inputBorder: "rgba(0,0,0,0.08)",
  inputBorderFocus: "#4361ee",
  inputText: "#0f172a",
  inputPlaceholder: "#94a3b8",
  inputFocusRing: "rgba(67,97,238,0.12)",
  inputRadius: "14px",
  inputHeight: 52,

  // ── Text ─────────────────────────────────────────────────────────
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  textWhite: "#ffffff",
  textWhiteMuted: "rgba(255,255,255,0.75)",

  // ── Radius ───────────────────────────────────────────────────────
  radiusCard: "24px",
  radiusInput: "14px",
  radiusButton: "16px",

  // ── Spacing ──────────────────────────────────────────────────────
  formGap: "20px",

  // ── Font ──────────────────────────────────────────────────────────
  font: "'Plus Jakarta Sans','DM Sans',sans-serif",

  // ── Divider ─────────────────────────────────────────────────────
  divider: "rgba(0,0,0,0.08)",

  // ── Error / success ─────────────────────────────────────────────
  errorBg: "rgba(239,68,68,0.08)",
  errorBorder: "rgba(239,68,68,0.2)",
  errorText: "#dc2626",
  successBg: "rgba(34,197,94,0.08)",
  successBorder: "rgba(34,197,94,0.2)",
  successText: "#16a34a",

  // ── Segmented control ─────────────────────────────────────────────
  segBg: "rgba(0,0,0,0.04)",
  segActiveBg: "#ffffff",
  segActiveBorder: "rgba(67,97,238,0.25)",
  segActiveText: "#4361ee",
  segInactiveText: "#94a3b8",

  // ── Gender ────────────────────────────────────────────────────────
  genderSelectedBg: "rgba(67,97,238,0.08)",
  genderSelectedBorder: "rgba(67,97,238,0.3)",
  genderSelectedText: "#4361ee",
  genderUnselectedBg: "#ffffff",
  genderUnselectedBorder: "rgba(0,0,0,0.08)",
  genderUnselectedText: "#64748b",
};
