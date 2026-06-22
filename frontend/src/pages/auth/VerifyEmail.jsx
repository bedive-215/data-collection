// VerifyEmail.jsx — Matches Home Page Background (AnimatedSurveyBackdrop)
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DS } from "@/utils/authDesignTokens";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

const schema = yup.object({ email: yup.string().required("auth.required").email("auth.invalidEmail") });

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await verifyEmail({ email: data.email });
      setSent(true);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể gửi email xác minh.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = () => ({
    display: "flex",
    alignItems: "center",
    borderRadius: DS.inputRadius,
    background: DS.inputBg,
    border: `1.5px solid ${DS.inputBorder}`,
    height: DS.inputHeight,
    padding: "0 16px",
    });

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F8FAFC", fontFamily: DS.font, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AnimatedSurveyBackdrop />
      </div>

      <div style={{
        width: "100%", maxWidth: 480,
        background: DS.cardBg,
        backdropFilter: `${DS.cardBlur} saturate(190%)`,
        WebkitBackdropFilter: `${DS.cardBlur} saturate(190%)`,
        borderRadius: "28px",
        border: `1px solid ${DS.cardBorder}`,
        padding: "44px",
        position: "relative",
        zIndex: 1}}>
        {/* Top decorative bar */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 5, background: `linear-gradient(90deg, transparent, ${DS.primary}, ${DS.primaryEnd}, transparent)`, borderRadius: "0 0 6px 6px" }} />

        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(145deg, ${DS.primary}, ${DS.primaryEnd})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: "-0.4px" }}>Xác minh email</h2>
            <p style={{ fontSize: 14, color: DS.textSecondary, margin: "3px 0 0" }}>
              {sent ? "Đã gửi liên kết đến email của bạn." : "Nhập email để nhận liên kết xác minh."}
            </p>
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: DS.formGap }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Email</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type="email" {...register("email")} placeholder="email@example.com"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.email.message)}</p>}
            </div>
            {errorMessage && (
              <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}>
                <p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ height: 52, width: "100%", background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", borderRadius: DS.radiusButton, color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.65 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)" } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang gửi...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Gửi liên kết xác minh</>
              )}
            </button>
          </form>
        ) : (
          /* SUCCESS STATE */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: DS.successBg, border: `2px solid ${DS.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={DS.successText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: DS.textPrimary, margin: "0 0 8px" }}>Email đã được gửi!</h3>
              <p style={{ fontSize: 14, color: DS.textSecondary, margin: 0, lineHeight: 1.6 }}>
                Vui lòng kiểm tra hộp thư và nhấp vào liên kết<br />để xác minh tài khoản của bạn.
              </p>
            </div>
            <div style={{ width: "100%", padding: "16px 20px", borderRadius: 14, background: "rgba(67,97,238,0.04)", border: "1px solid rgba(67,97,238,0.1)", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 12, color: DS.textMuted }}>Email có thể nằm trong thư rác (Spam)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: DS.textSecondary }}>Email xác minh có hiệu lực trong 24 giờ</span>
              </div>
            </div>
            <Link to="/login"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", fontFamily: DS.font, padding: "14px 28px", borderRadius: DS.radiusButton, background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, marginTop: 4 }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Quay lại đăng nhập
            </Link>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: DS.textMuted, textDecoration: "none", fontFamily: DS.font}}>
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyEmailPage;
