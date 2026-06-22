// Register.jsx — Matches Home Page Background (AnimatedSurveyBackdrop)
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
import { DS } from "@/utils/authDesignTokens";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

const schemaStep1 = yup.object({
  full_name: yup.string().required("auth.required"),
  date_of_birth: yup.string().required("auth.required"),
  phone_number: yup.string().required("auth.required"),
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
  gender: yup.string().required("auth.required").oneOf(["MALE", "FEMALE", "OTHER"], "auth.required")});

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, verifyEmail } = useAuth();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: yupResolver(schemaStep1) });
  const [otp, setOtp] = useState("");

  const onSubmitStep1 = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      await registerUser({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number,
        email: data.email,
        password: data.password,
        gender: data.gender});
      setEmail(data.email);
      setStep(2);
      setOtpMessage("Mã xác minh đã được gửi đến email của bạn.");
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVerify = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await verifyEmail({ email, otp });
      setOtpMessage("Xác minh thành công!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Mã xác minh không đúng.");
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: "-0.4px" }}>
              {step === 1 ? "Tạo tài khoản" : "Xác minh email"}
            </h2>
            <p style={{ fontSize: 14, color: DS.textSecondary, margin: "3px 0 0" }}>
              {step === 1 ? "Đăng ký để bắt đầu" : "Nhập mã đã gửi đến email"}
            </p>
          </div>
        </div>

        {/* Segmented tabs — both equal */}
        <div style={{ display: "flex", borderRadius: 16, padding: 5, background: DS.segBg, marginBottom: 28 }}>
          <Link to="/login" style={{ flex: 1, borderRadius: 12, padding: "13px 16px", background: "transparent", border: "1px solid transparent", color: DS.segInactiveText, fontWeight: 500, fontSize: 14, fontFamily: DS.font, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Đăng nhập
          </Link>
          <button style={{ flex: 1, borderRadius: 12, padding: "13px 16px", background: DS.segActiveBg, border: `1px solid ${DS.segActiveBorder}`, color: DS.segActiveText, fontWeight: 700, fontSize: 14, fontFamily: DS.font}}>
            Đăng ký
          </button>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmitStep1)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full name */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Họ và tên</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type="text" {...register("full_name")} placeholder="Nguyễn Văn A"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {errors.full_name && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.full_name.message)}</p>}
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Số điện thoại</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type="text" {...register("phone_number")} placeholder="0912345678"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {errors.phone_number && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.phone_number.message)}</p>}
            </div>

            {/* Date of birth */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Ngày sinh</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type="date" {...register("date_of_birth")}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              </div>
              {errors.date_of_birth && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.date_of_birth.message)}</p>}
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Giới tính</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ value: "MALE", label: "Nam" }, { value: "FEMALE", label: "Nữ" }, { value: "OTHER", label: "Khác" }].map((opt) => {
                  const sel = watch("gender") === opt.value;
                  return (
                    <label key={opt.value} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 8px", borderRadius: DS.inputRadius, background: sel ? DS.genderSelectedBg : DS.genderUnselectedBg, border: `1.5px solid ${sel ? DS.genderSelectedBorder : DS.genderUnselectedBorder}`, color: sel ? DS.genderSelectedText : DS.genderUnselectedText, fontSize: 13, fontWeight: 600, fontFamily: DS.font, cursor: "pointer"}}>
                      <input type="radio" value={opt.value} {...register("gender")} style={{ display: "none" }} />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              {errors.gender && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.gender.message)}</p>}
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Mật khẩu</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type={showPassword ? "text" : "password"} {...register("password")} placeholder="••••••••"
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
              {errors.password && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.password.message)}</p>}
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
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang xử lý...</> : "Đăng ký"}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: DS.textSecondary, margin: 0 }}>
              Mã đã gửi đến <span style={{ fontWeight: 600, color: DS.textPrimary }}>{email}</span>
            </p>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Mã xác minh</label>
              <div style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = DS.inputBorderFocus }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
              >
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập mã 6 chữ số..."
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 12px", fontSize: 16, color: DS.inputText, fontFamily: DS.font, letterSpacing: "0.2em" }} />
              </div>
            </div>
            {errorMessage && (
              <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}>
                <p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p>
              </div>
            )}
            {otpMessage && (
              <div style={{ borderRadius: 12, padding: "12px 16px", background: DS.successBg, border: `1px solid ${DS.successBorder}` }}>
                <p style={{ fontSize: 13, color: DS.successText, margin: 0 }}>{otpMessage}</p>
              </div>
            )}
            <button onClick={onSubmitVerify} disabled={loading}
              style={{ height: 52, width: "100%", background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", borderRadius: DS.radiusButton, color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.65 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)" } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}
            >
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Đang xác minh...</> : "Xác minh email"}
            </button>
            <button type="button" onClick={() => setStep(1)}
              style={{ background: "none", border: "none", cursor: "pointer", color: DS.textMuted, fontSize: 13, fontFamily: DS.font, fontWeight: 500, padding: "8px 0"}}
              onMouseEnter={e => e.currentTarget.style.color = DS.textSecondary}
              onMouseLeave={e => e.currentTarget.style.color = DS.textMuted}
            >
              ← Quay lại
            </button>
          </div>
        )}

        <p style={{ fontSize: 12, color: DS.textMuted, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          Bằng cách đăng ký, bạn đồng ý với <a href="#" style={{ color: DS.textSecondary, textDecoration: "underline", textUnderlineOffset: 2 }}>Điều khoản</a> và <a href="#" style={{ color: DS.textSecondary, textDecoration: "underline", textUnderlineOffset: 2 }}>Chính sách bảo mật</a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
