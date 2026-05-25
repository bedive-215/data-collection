// ForgotPassword.jsx — Matches Home Page Background (AnimatedSurveyBackdrop)
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DS } from "@/utils/authDesignTokens";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

const schemaEmail = yup.object({ email: yup.string().required("auth.required").email("auth.invalidEmail") });
const schemaCode = yup.object({ code: yup.string().required("auth.required").min(4, "Mã không hợp lệ") });
const schemaReset = yup.object({
  newPassword: yup.string().required("auth.required").min(6, "Mật khẩu quá ngắn"),
  confirmPassword: yup.string().oneOf([yup.ref("newPassword")], "Mật khẩu không khớp"),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const formEmail = useForm({ resolver: yupResolver(schemaEmail) });
  const formCode = useForm({ resolver: yupResolver(schemaCode) });
  const formReset = useForm({ resolver: yupResolver(schemaReset) });

  const handleSendEmail = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      await forgotPassword(data);
      setSuccessMessage("Email đã được gửi. Vui lòng kiểm tra hộp thư!");
      setEmail(data.email);
      setStep(2);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể gửi email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      await verifyResetCode({ email, code: data.code });
      setSuccessMessage("Xác minh thành công!");
      setStep(3);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Mã không đúng.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      await resetPassword({ email, newPassword: data.newPassword });
      setSuccessMessage("Đặt lại mật khẩu thành công. Hãy đăng nhập lại!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đặt lại mật khẩu.");
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
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  const stepTitles = ["Quên mật khẩu", "Nhập mã xác nhận", "Đặt mật khẩu mới"];
  const stepDescs = [
    "Nhập email để nhận mã khôi phục",
    `Mã đã gửi đến: ${email}`,
    "Đặt lại mật khẩu mới cho tài khoản",
  ];

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
        boxShadow: DS.cardShadow,
        padding: "44px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Top decorative bar */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 5, background: `linear-gradient(90deg, transparent, ${DS.primary}, ${DS.primaryEnd}, transparent)`, borderRadius: "0 0 6px 6px" }} />

        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(145deg, ${DS.primary}, ${DS.primaryEnd})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(67,97,238,0.35)", flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: "-0.4px" }}>{stepTitles[step - 1]}</h2>
            <p style={{ fontSize: 14, color: DS.textSecondary, margin: "3px 0 0" }}>{stepDescs[step - 1]}</p>
          </div>
        </div>

        {/* STEP 1 — Email */}
        {step === 1 && (
          <form onSubmit={formEmail.handleSubmit(handleSendEmail)} style={{ display: "flex", flexDirection: "column", gap: DS.formGap }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Email</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.inputFocusRing}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                <input type="email" {...formEmail.register("email")} placeholder="email@example.com"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {formEmail.formState.errors.email && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(formEmail.formState.errors.email.message)}</p>}
            </div>
            {errorMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}><p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p></div>}
            {successMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.successBg, border: `1px solid ${DS.successBorder}` }}><p style={{ fontSize: 13, color: DS.successText, margin: 0 }}>{successMessage}</p></div>}
            <button type="submit" disabled={loading}
              style={{ height: 52, width: "100%", background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", borderRadius: DS.radiusButton, color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font, cursor: loading ? "not-allowed" : "pointer", boxShadow: DS.primaryGlow, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: loading ? 0.65 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(67,97,238,0.45)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = DS.primaryGlow; }}
            >
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang gửi...</> : "Gửi mã khôi phục"}
            </button>
          </form>
        )}

        {/* STEP 2 — Code */}
        {step === 2 && (
          <form onSubmit={formCode.handleSubmit(handleVerifyCode)} style={{ display: "flex", flexDirection: "column", gap: DS.formGap }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Mã xác nhận</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.inputFocusRing}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                <input type="text" {...formCode.register("code")} placeholder="Nhập mã 4-6 số..."
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 16, color: DS.inputText, fontFamily: DS.font, letterSpacing: "0.15em" }} />
              </div>
              {formCode.formState.errors.code && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{formCode.formState.errors.code.message}</p>}
            </div>
            {errorMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}><p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p></div>}
            {successMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.successBg, border: `1px solid ${DS.successBorder}` }}><p style={{ fontSize: 13, color: DS.successText, margin: 0 }}>{successMessage}</p></div>}
            <button type="submit" disabled={loading}
              style={{ height: 52, width: "100%", background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", borderRadius: DS.radiusButton, color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font, cursor: loading ? "not-allowed" : "pointer", boxShadow: DS.primaryGlow, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: loading ? 0.65 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(67,97,238,0.45)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = DS.primaryGlow; }}
            >
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang xác minh...</> : "Xác minh mã"}
            </button>
          </form>
        )}

        {/* STEP 3 — Reset password */}
        {step === 3 && (
          <form onSubmit={formReset.handleSubmit(handleResetPassword)} style={{ display: "flex", flexDirection: "column", gap: DS.formGap }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Mật khẩu mới</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.inputFocusRing}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                <input type={showPassword ? "text" : "password"} {...formReset.register("newPassword")} placeholder="••••••••"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: DS.textMuted }}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {formReset.formState.errors.newPassword && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{formReset.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Xác nhận mật khẩu</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.inputFocusRing}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                <input type={showPassword ? "text" : "password"} {...formReset.register("confirmPassword")} placeholder="••••••••"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {formReset.formState.errors.confirmPassword && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{formReset.formState.errors.confirmPassword.message}</p>}
            </div>
            {errorMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}><p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p></div>}
            {successMessage && <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.successBg, border: `1px solid ${DS.successBorder}` }}><p style={{ fontSize: 13, color: DS.successText, margin: 0 }}>{successMessage}</p></div>}
            <button type="submit" disabled={loading}
              style={{ height: 52, width: "100%", background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", borderRadius: DS.radiusButton, color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font, cursor: loading ? "not-allowed" : "pointer", boxShadow: DS.primaryGlow, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: loading ? 0.65 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(67,97,238,0.45)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = DS.primaryGlow; }}
            >
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang đặt lại...</> : "Đặt mật khẩu mới"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: DS.primary, textDecoration: "none", fontFamily: DS.font }}>← Quay lại đăng nhập</Link>
        </div>

        <p style={{ fontSize: 12, color: DS.textMuted, textAlign: "center", marginTop: 24 }}>
          Bạn cần hỗ trợ? <a href="#" style={{ color: DS.textSecondary, textDecoration: "underline", textUnderlineOffset: 2 }}>Liên hệ chúng tôi</a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
