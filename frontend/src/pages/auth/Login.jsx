// Login.jsx — Matches Home Page Background (AnimatedSurveyBackdrop)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { ROUTERS } from "@/utils/constants";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "@/api/apiClient";

import { DS } from "@/utils/authDesignTokens";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

// ── Schemas ────────────────────────────────────────────────────────────────
const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword")});

const extraSchema = yup.object({
  phone_number: yup
    .string()
    .required("Số điện thoại không được bỏ trống")
    .matches(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải đúng định dạng YYYY-MM-DD"),
  gender: yup.string().required("Vui lòng chọn giới tính").oneOf(["MALE", "FEMALE", "OTHER"])});

// ── InputWrapper định nghĩa NGOÀI component → không bị re-create mỗi render ──
const INPUT_WRAPPER_STYLE = {
  display: "flex",
  alignItems: "center",
  borderRadius: DS.inputRadius,
  background: DS.inputBg,
  border: `1.5px solid ${DS.inputBorder}`,
  height: 52,
  padding: "0 16px",
  };

const InputWrapper = ({ children, onFocusCapture, onBlurCapture }) => (
  <div
    style={INPUT_WRAPPER_STYLE}
    onFocusCapture={onFocusCapture}
    onBlurCapture={onBlurCapture}
  >
    {children}
  </div>
);

// ── Alert boxes ────────────────────────────────────────────────────────────
const SessionAlert = ({ message }) => (
  <div style={{ borderRadius: 14, padding: "13px 16px", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ fontSize: 13, color: "#1E40AF", margin: 0 }}>{message}</p>
    </div>
  </div>
);

const BlockedAlert = ({ message }) => (
  <div style={{ borderRadius: 14, padding: "13px 16px", background: "#FEF2F2", border: "1px solid #FECACA" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      <p style={{ fontSize: 13, color: "#991B1B", margin: 0 }}>{message}</p>
    </div>
  </div>
);

// ── Spinner ────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18, color = "white", borderColor = "rgba(255,255,255,0.35)" }) => (
  <div style={{
    width: size, height: size,
    border: `2.5px solid ${borderColor}`,
    borderTopColor: color,
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0}} />
);

// ── Main component ─────────────────────────────────────────────────────────
export default function Login() {
  const { t } = useTranslation();
  // ✅ Thêm loginFromOAuthData vào destructure
  const { login, loginFromOAuthData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [missingFields, setMissingFields] = useState(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;

  const googleClientLoaded = useRef(false);
  const gsiInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  // Check query params once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session") === "expired") {
      setSessionExpired(true);
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.history.replaceState({}, "", "/login");
    }
    if (params.get("blocked") === "true") {
      setIsBlocked(true);
      setErrorMessage("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  // Load Google GSI script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleClientLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => { googleClientLoaded.current = true; };
    script.onerror = () => { googleClientLoaded.current = false; };
    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID]);

  // Init GSI
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const interval = setInterval(() => {
      if (!googleClientLoaded.current || gsiInitialized.current || !window.google) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const idToken = response?.credential;
            if (!idToken) { setErrorMessage("Không nhận được token từ Google"); return; }
            await handleGoogleTokenReceived(idToken);
          }});
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline", size: "large", text: "signin_with",
            locale: "vi", shape: "rectangular", width: "100%"});
        }
        gsiInitialized.current = true;
        clearInterval(interval);
      } catch (err) {
        console.error("GSI init error:", err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleClick = () => {
    if (!window.google || !gsiInitialized.current) return;
    window.google.accounts.id.prompt();
  };

  const handleGoogleTokenReceived = async (idToken) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");
      const res = await apiClient.post("/api/v1/auth/login/oauth", { token: idToken });
      if (res.data.status === "incomplete" || res.data.code === "PROFILE_INCOMPLETE") {
        setMissingFields(res.data.missing_fields || {});
        setTempToken(res.data.temp_token || idToken);
        setShowExtraForm(true);
        setOauthLoading(false);
        return;
      }
      handleSuccessfulLogin(res.data);
    } catch (err) {
      if (err?.response?.data?.code === "PROFILE_INCOMPLETE") {
        const missing = {};
        (err.response.data.required_fields || []).forEach(f => { missing[f] = true; });
        setMissingFields(missing);
        setTempToken(err.response.data.temp_token || null);
        setShowExtraForm(true);
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || "Google login failed");
      }
      setOauthLoading(false);
    }
  };

  const navigateByRole = (role) => {
    if (role === "admin") navigate(ROUTERS.ADMIN.DASHBOARD);
    else if (role === "user") navigate(ROUTERS.USER.HOME);
    else navigate("/");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await login({ email: data.email, password: data.password });
      const role = res?.user?.role || res?.role || res?.data?.user?.role || res?.data?.role;
      if (!role) throw new Error("Missing role");
      navigateByRole(role);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitExtra = async (formData) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");
      const payload = { token: tempToken };
      if (missingFields?.phone_number) payload.phone_number = formData.phone_number;
      if (missingFields?.date_of_birth) payload.date_of_birth = formData.date_of_birth;
      if (missingFields?.gender) payload.gender = formData.gender;
      const res = await apiClient.post("/api/v1/auth/login/oauth", payload);
      handleSuccessfulLogin(res.data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Không thể hoàn tất.");
      setOauthLoading(false);
    }
  };

  // ✅ FIX CHÍNH: gọi loginFromOAuthData thay vì chỉ lưu localStorage
  // loginFromOAuthData sẽ:
  //   1. persistTokens → setAccessToken (state) → localStorage
  //   2. setUser trong AuthProvider
  //   3. UserProvider nhận accessToken thay đổi → fetchMyInfo() → GenderGuard pass
  const handleSuccessfulLogin = (data) => {
    loginFromOAuthData(data);

    const role =
      data?.user?.role ||
      data?.data?.user?.role ||
      data?.role ||
      data?.data?.role ||
      "user";

    closeExtraForm();
    setOauthLoading(false);
    navigateByRole(role);
  };

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const {
    register: registerExtra,
    handleSubmit: handleSubmitExtra,
    formState: { errors: extraErrors },
    watch: watchExtra,
    reset: resetExtraForm,
    clearErrors: clearExtraErrors} = useForm({ resolver: yupResolver(extraSchema), mode: "onChange" });

  const closeExtraForm = useCallback(() => {
    setShowExtraForm(false);
    setTempToken(null);
    setMissingFields(null);
    resetExtraForm();
    clearExtraErrors();
    setErrorMessage("");
  }, [resetExtraForm, clearExtraErrors]);

  const focusRingOn = useCallback((e) => {
    e.currentTarget.style.borderColor = DS.inputBorderFocus
  }, []);
  const focusRingOff = useCallback((e) => {
    e.currentTarget.style.borderColor = DS.inputBorder
  }, []);
  const inputFocusOn = useCallback((e) => {
    e.target.style.borderColor = DS.inputBorderFocus
  }, []);
  const inputFocusOff = useCallback((e) => {
    e.target.style.borderColor = DS.inputBorder
  }, []);

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "#F8FAFC",
      fontFamily: DS.font,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden"}}>
      <AnimatedSurveyBackdrop />

      {/* Main card */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: DS.cardBg,
        backdropFilter: `${DS.cardBlur} saturate(190%)`,
        WebkitBackdropFilter: `${DS.cardBlur} saturate(190%)`,
        borderRadius: "28px",
        border: `1px solid ${DS.cardBorder}`,
        padding: "44px",
        position: "relative", zIndex: 1}}>
        {/* Top decorative bar */}
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)",
          width: 120, height: 5,
          background: `linear-gradient(90deg, transparent, ${DS.primary}, ${DS.primaryEnd}, transparent)`,
          borderRadius: "0 0 6px 6px"}} />

        {/* Brand + header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: `linear-gradient(145deg, ${DS.primary}, ${DS.primaryEnd})`,
            display: "flex", alignItems: "center", justifyContent: "center",

            flexShrink: 0}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: "-0.4px" }}>Chào mừng trở lại</h2>
            <p style={{ fontSize: 14, color: DS.textSecondary, margin: "3px 0 0" }}>Đăng nhập để tiếp tục</p>
          </div>
        </div>

        {/* Segmented tabs */}
        <div style={{ display: "flex", borderRadius: 16, padding: 5, background: DS.segBg, marginBottom: 28 }}>
          <button style={{
            flex: 1, borderRadius: 12, padding: "13px 16px",
            background: DS.segActiveBg,
            border: `1px solid ${DS.segActiveBorder}`,
            color: DS.segActiveText, fontWeight: 700, fontSize: 14,
            fontFamily: DS.font,
            }}>
            Đăng nhập
          </button>
          <Link to="/register" style={{
            flex: 1, borderRadius: 12, padding: "13px 16px",
            background: "transparent",
            border: "1px solid transparent",
            color: DS.segInactiveText, fontWeight: 500, fontSize: 14,
            fontFamily: DS.font, textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center"}}>
            Đăng ký
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Email</label>
            <InputWrapper onFocusCapture={focusRingOn} onBlurCapture={focusRingOff}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DS.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" {...register("email")} placeholder="email@example.com"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 14px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
            </InputWrapper>
            {errors.email && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.email.message)}</p>}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: DS.textSecondary }}>Mật khẩu</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: DS.primary, textDecoration: "none", fontFamily: DS.font, fontWeight: 500 }}>Quên mật khẩu?</Link>
            </div>
            <InputWrapper onFocusCapture={focusRingOn} onBlurCapture={focusRingOff}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DS.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input type={showPassword ? "text" : "password"} {...register("password")} placeholder="••••••••"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 14px", fontSize: 15, color: DS.inputText, fontFamily: DS.font }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: DS.textMuted, flexShrink: 0 }}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </InputWrapper>
            {errors.password && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{t(errors.password.message)}</p>}
          </div>

          {sessionExpired && <SessionAlert message={errorMessage} />}
          {isBlocked && <BlockedAlert message={errorMessage} />}
          {!sessionExpired && !isBlocked && errorMessage && (
            <div style={{ borderRadius: 14, padding: "13px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}>
              <p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              height: 54, width: "100%",
              background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`,
              border: "none", borderRadius: 16,
              color: "white", fontSize: 15, fontWeight: 700, fontFamily: DS.font,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.65 : 1}}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)" } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}
          >
            {loading
              ? <><Spinner />Đang xử lý...</>
              : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Tiếp tục</>
            }
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: DS.divider }} />
          <span style={{ fontSize: 12, color: DS.textMuted, fontWeight: 500 }}>Hoặc đăng nhập với</span>
          <div style={{ flex: 1, height: 1, background: DS.divider }} />
        </div>

        {/* Google OAuth */}
        <div style={{ position: "relative", width: "100%", height: 54 }}>
          <div ref={googleButtonRef} style={{ position: "absolute", inset: 0, opacity: 0.01, pointerEvents: "auto" }} />
          <div
            onClick={handleGoogleClick}
            style={{
              position: "absolute", inset: 0,
              background: DS.inputBg,
              border: `1.5px solid ${DS.inputBorder}`,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", pointerEvents: "none"}}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(67,97,238,0.3)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DS.inputBorder }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: DS.textPrimary, marginLeft: 10, fontFamily: DS.font }}>Đăng nhập với Google</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: DS.textMuted, textAlign: "center", marginTop: 28, lineHeight: 1.7 }}>
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <a href="#" style={{ color: DS.textSecondary, textDecoration: "underline", textUnderlineOffset: 2, fontWeight: 500 }}>Điều khoản</a>
          {" "}và{" "}
          <a href="#" style={{ color: DS.textSecondary, textDecoration: "underline", textUnderlineOffset: 2, fontWeight: 500 }}>Chính sách bảo mật</a>
        </p>
      </div>

      {/* Extra info modal */}
      {showExtraForm && missingFields && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(15,23,42,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24}}>
          <div style={{
            background: "white", borderRadius: 24, padding: 40,
            width: "100%", maxWidth: 460,

            animation: "slideUp 0.2s ease"}}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>Hoàn tất thông tin</h3>
                <p style={{ fontSize: 13, color: DS.textSecondary, margin: "3px 0 0" }}>Vui lòng cung cấp thêm thông tin</p>
              </div>
            </div>
            <form onSubmit={handleSubmitExtra(onSubmitExtra)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {missingFields.phone_number && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Số điện thoại <span style={{ color: DS.errorText }}>*</span></label>
                  <input type="text" {...registerExtra("phone_number")} placeholder="0912345678"
                    style={{ width: "100%", height: 52, borderRadius: 14, background: DS.inputBg, border: `1.5px solid ${DS.inputBorder}`, padding: "0 16px", fontSize: 15, color: DS.inputText, fontFamily: DS.font, outline: "none", boxSizing: "border-box" }}
                    onFocus={inputFocusOn} onBlur={inputFocusOff} />
                  {extraErrors.phone_number && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{extraErrors.phone_number.message}</p>}
                </div>
              )}
              {missingFields.date_of_birth && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Ngày sinh <span style={{ color: DS.errorText }}>*</span></label>
                  <input type="date" {...registerExtra("date_of_birth")} max={new Date().toISOString().split("T")[0]}
                    style={{ width: "100%", height: 52, borderRadius: 14, background: DS.inputBg, border: `1.5px solid ${DS.inputBorder}`, padding: "0 16px", fontSize: 15, color: DS.inputText, fontFamily: DS.font, outline: "none", boxSizing: "border-box" }}
                    onFocus={inputFocusOn} onBlur={inputFocusOff} />
                  {extraErrors.date_of_birth && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{extraErrors.date_of_birth.message}</p>}
                </div>
              )}
              {missingFields.gender && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 8 }}>Giới tính <span style={{ color: DS.errorText }}>*</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ value: "MALE", label: "Nam" }, { value: "FEMALE", label: "Nữ" }, { value: "OTHER", label: "Khác" }].map((opt) => {
                      const sel = watchExtra("gender") === opt.value;
                      return (
                        <label key={opt.value} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 8px", borderRadius: DS.inputRadius, background: sel ? DS.genderSelectedBg : DS.genderUnselectedBg, border: `1.5px solid ${sel ? DS.genderSelectedBorder : DS.genderUnselectedBorder}`, color: sel ? DS.genderSelectedText : DS.genderUnselectedText, fontSize: 13, fontWeight: 600, fontFamily: DS.font, cursor: "pointer"}}>
                          <input type="radio" value={opt.value} {...registerExtra("gender")} style={{ display: "none" }} />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  {extraErrors.gender && <p style={{ fontSize: 12, color: DS.errorText, marginTop: 6 }}>{extraErrors.gender.message}</p>}
                </div>
              )}
              {errorMessage && (
                <div style={{ borderRadius: 14, padding: "13px 16px", background: DS.errorBg, border: `1px solid ${DS.errorBorder}` }}>
                  <p style={{ fontSize: 13, color: DS.errorText, margin: 0 }}>{errorMessage}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={closeExtraForm}
                  style={{ flex: 1, height: 52, borderRadius: 16, background: "#f8fafc", border: `1.5px solid ${DS.inputBorder}`, color: DS.textSecondary, fontFamily: DS.font, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Hủy
                </button>
                <button type="submit" disabled={oauthLoading}
                  style={{ flex: 1, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${DS.primary}, ${DS.primaryEnd})`, border: "none", color: "white", fontFamily: DS.font, fontSize: 14, fontWeight: 600, cursor: oauthLoading ? "not-allowed" : "pointer", opacity: oauthLoading ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {oauthLoading ? <><Spinner size={16} />Đang xử lý...</> : "Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading overlay (Google OAuth) */}
      {oauthLoading && !showExtraForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(248,250,252,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24}}>
          <div style={{
            background: "white", borderRadius: 24, padding: "44px 52px",
            textAlign: "center",
            width: "100%", maxWidth: 360,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
            <Spinner size={52} color={DS.primary} borderColor="rgba(67,97,238,0.15)" />
            <p style={{ fontSize: 16, fontWeight: 600, color: DS.textPrimary, marginTop: 18 }}>
              Đang xử lý đăng nhập...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}