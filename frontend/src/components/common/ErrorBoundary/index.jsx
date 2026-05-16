/**
 * ErrorBoundary — Bắt lỗi React component
 */
import React, { Component } from "react";
import { RefreshCw, AlertTriangle, Home, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── ERROR DISPLAY ──────────────────────────────────────────────────────────────
function ErrorDisplay({ error, resetError, isAdmin = false, goBack }) {
  const navigate = useNavigate();
  const theme = isAdmin
    ? { bg: "#080c1a", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#f8fafc", textSub: "#94a3b8", textDim: "#475569", primary: "#6366f1" }
    : { bg: "#f0f2f8", surface: "#ffffff", border: "rgba(0,0,0,0.08)", text: "#111827", textSub: "#4b5563", textDim: "#9ca3af", primary: "#6366f1" };

  const isSmallError = !error || error === "Unknown error" || error?.includes?.("Unexpected end");

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: theme.bg,
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: "40px 36px",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: isSmallError ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${isSmallError ? "rgba(99,102,241,0.2)" : "rgba(239,68,68,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          {isSmallError
            ? <AlertTriangle size={32} color={theme.primary} strokeWidth={1.8} />
            : <AlertTriangle size={32} color="#ef4444" strokeWidth={1.8} />
          }
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
          {isSmallError ? "Đã xảy ra lỗi" : "Oops! Có gì đó không ổn"}
        </h2>

        <p style={{ fontSize: 14, color: theme.textSub, marginBottom: 28, lineHeight: 1.6 }}>
          {isSmallError
            ? "Trang này gặp sự cố khi tải dữ liệu. Thử tải lại hoặc quay lại trang trước."
            : "Chúng tôi đã ghi nhận lỗi này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn."
          }
        </p>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {goBack && (
            <button
              onClick={goBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "11px 20px",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                color: theme.textSub,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textSub; }}
            >
              <ChevronLeft size={15} />
              Quay lại
            </button>
          )}

          <button
            onClick={resetError}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #7c5df7)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)"; }}
          >
            <RefreshCw size={15} />
            Thử lại
          </button>

          <button
            onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/user/home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "11px 18px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              color: theme.textSub,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textSub; }}
          >
            <Home size={15} />
            Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION ERROR BOUNDARY ─────────────────────────────────────────────────────
/**
 * Dùng cho từng section riêng biệt trong page
 * <SectionErrorBoundary sectionName="Chart Area" onRetry={refetch}>
 */
export function SectionErrorBoundary({ children, sectionName, onRetry, theme = "dark", style = {} }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          borderRadius: 18,
          padding: "40px 24px",
          textAlign: "center",
          ...style,
        }}>
          <AlertTriangle size={28} color={theme === "dark" ? "#475569" : "#9ca3af"} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: theme === "dark" ? "#475569" : "#9ca3af", marginBottom: 16 }}>
            {sectionName ? `"${sectionName}" không thể tải` : "Phần này không thể tải"}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                background: "transparent",
                color: theme === "dark" ? "#94a3b8" : "#4b5563",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <RefreshCw size={13} />
              Thử lại
            </button>
          )}
        </div>
      }
      onError={(error) => console.error(`[SectionErrorBoundary] ${sectionName}:`, error)}
    >
      {children}
    </ErrorBoundary>
  );
}

// ─── CLASS ERROR BOUNDARY (legacy) ─────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error?.message || error || "Unknown error" };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error?.message || error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, resetError: this.resetError })
          : this.props.fallback;
      }
      return (
        <ErrorDisplay
          error={this.state.error}
          resetError={this.resetError}
          isAdmin={this.props.isAdmin}
          goBack={this.props.goBack}
        />
      );
    }
    return this.props.children;
  }
}

// ─── SECTION RETRY WRAPPER ─────────────────────────────────────────────────────
/**
 * Wrapper đơn giản cho retry logic — dùng thay thế cho section-level error boundary
 * Khi error, hiển thị inline retry button thay vì blank screen
 */
export function RetrySection({ children, error, onRetry, isLoading, theme = "dark", height = 200 }) {
  const isDark = theme === "dark";

  if (error && !isLoading) {
    return (
      <div style={{
        height,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}>
        <AlertTriangle size={32} color={isDark ? "#475569" : "#9ca3af"} strokeWidth={1.5} />
        <p style={{ fontSize: 13, color: isDark ? "#475569" : "#9ca3af" }}>
          Không tải được dữ liệu
        </p>
        <button
          onClick={onRetry}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            background: "transparent",
            color: isDark ? "#94a3b8" : "#4b5563",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <RefreshCw size={13} />
          Thử lại
        </button>
      </div>
    );
  }

  return children;
}
