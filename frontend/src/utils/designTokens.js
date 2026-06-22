export const C = {
  primary: "#4f46e5",
  primaryHover: "#4338ca",
  primaryLight: "#eef2ff",
  primaryBorder: "rgba(79,70,229,0.35)",

  bg: "#f0f2f6",
  surface: "rgba(255,255,255,0.78)",
  surfaceHigh: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(255,255,255,0.55)",

  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",

  border: "#e2e8f0",
  borderHover: "#cbd5e1",

  success: "#10b981",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  error: "#ef4444",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",

  font: "'DM Sans', 'Inter', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
};

export const glassCard = {
  background: C.surface,
  backdropFilter: "blur(22px) saturate(180%)",
  border: `1px solid ${C.glassBorder}`,
  borderRadius: "16px",

};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
};

export const borderRadius = {
  none: "0",
  sm: "6px",
  md: "8px",
  lg: "12px",
  full: "9999px",
};
