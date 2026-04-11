// Login.jsx - Dark Theme with Video
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { ROUTERS } from "@/utils/constants";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

// Validation schema for email/password login
const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

// Validation schema for extra info
const extraSchema = yup.object({
  phone_number: yup
    .string()
    .required("Số điện thoại không được bỏ trống")
    .matches(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải đúng định dạng YYYY-MM-DD"),
});

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const googleClientLoaded = useRef(false);
  const gsiInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  // Extra info modal state
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [missingFields, setMissingFields] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const {
    register: registerExtra,
    handleSubmit: handleSubmitExtra,
    formState: { errors: extraErrors },
    reset: resetExtraForm,
    clearErrors: clearExtraErrors,
  } = useForm({
    resolver: yupResolver(extraSchema),
    mode: "onChange"
  });

  // ====================== HANDLE EMAIL/PASSWORD ======================
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await login({ email: data.email, password: data.password });

      const role =
        res?.user?.role || res?.role || res?.data?.user?.role || res?.data?.role;

      if (!role) throw new Error("Missing role in response");

      

      if (role === "admin") {
        navigate(ROUTERS.ADMIN.DASHBOARD);
      } else if (role === "user") {
        navigate(ROUTERS.USER.HOME);
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Invalid email or password";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // ====================== HANDLE GOOGLE GSI SETUP ======================
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (googleClientLoaded.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleClientLoaded.current = true;
    };
    script.onerror = () => {
      googleClientLoaded.current = false;
    };

    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID]);

  const initGSI = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || gsiInitialized.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const idToken = response?.credential;
          if (!idToken) {
            setErrorMessage("Không nhận được token từ Google");
            return;
          }
          await handleGoogleTokenReceived(idToken);
        },
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          locale: "vi",
          shape: "pill",
        });
      }

      gsiInitialized.current = true;
    } catch (err) {
      console.error("GSI initialize error:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (googleClientLoaded.current && !gsiInitialized.current) {
        initGSI();
      }
      if (gsiInitialized.current) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ====================== HANDLE GOOGLE TOKEN RECEIVED ======================
  const handleGoogleTokenReceived = async (idToken) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");

      const res = await axios.post(`${API_URL}/api/v1/auth/login/oauth`, {
        token: idToken,
      });

      if (res.data.status === "incomplete" || res.data.code === "PROFILE_INCOMPLETE") {
        const missing = res.data.missing_fields || {};
        const tempTok = res.data.temp_token || idToken;

        setMissingFields(missing);
        setTempToken(tempTok);
        setShowExtraForm(true);
        setOauthLoading(false);
        return;
      }

      handleSuccessfulLogin(res.data);
    } catch (err) {
      if (err?.response?.data?.code === "PROFILE_INCOMPLETE") {
        const missing = {};
        const requiredFields = err.response.data.required_fields || [];

        requiredFields.forEach(field => {
          missing[field] = true;
        });

        const tempTok = err.response.data.temp_token || null;

        setMissingFields(missing);
        setTempToken(tempTok);
        setShowExtraForm(true);
      } else {
        const msg = err?.response?.data?.message || err?.message || "Google login failed";
        setErrorMessage(msg);
      }

      setOauthLoading(false);
    }
  };

  // ====================== HANDLE EXTRA INFO SUBMIT ======================
  const onSubmitExtra = async (formData) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");

      const payload = {
        token: tempToken,
      };

      if (missingFields?.phone_number) {
        payload.phone_number = formData.phone_number;
      }

      if (missingFields?.date_of_birth) {
        payload.date_of_birth = formData.date_of_birth;
      }

      const res = await axios.post(
        `${API_URL}/api/v1/auth/login/oauth`,
        payload
      );

      handleSuccessfulLogin(res.data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Không thể hoàn tất đăng ký. Vui lòng thử lại.";
      setErrorMessage(msg);
      setOauthLoading(false);
    }
  };

  // ====================== HANDLE SUCCESSFUL LOGIN ======================
  const handleSuccessfulLogin = (data) => {
    const accessToken =
      data?.access_token ||
      data?.accessToken ||
      data?.token ||
      data?.data?.access_token ||
      data?.data?.token;

    const refreshToken =
      data?.refresh_token ||
      data?.refreshToken ||
      data?.data?.refresh_token;

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    const userInfo = data?.user || data?.data?.user;
    if (userInfo) {
      localStorage.setItem("user", JSON.stringify(userInfo));
    }

    const role =
      data?.user?.role ||
      data?.role ||
      data?.data?.user?.role ||
      data?.data?.role ||
      "user";

    setShowExtraForm(false);
    setTempToken(null);
    setMissingFields(null);
    resetExtraForm();
    clearExtraErrors();
    setOauthLoading(false);

    if (role === "admin") {
      navigate(ROUTERS.ADMIN.DASHBOARD);
    } else if (role === "user") {
      navigate(ROUTERS.USER.HOME);
    } else {
      navigate("/");
    }
  };

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen w-full font-sans antialiased bg-[#050505] text-white overflow-x-hidden">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ========== LEFT SIDE: Video ========== */}
        <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-end p-12 overflow-hidden bg-gradient-to-br from-[#2b303b] to-[#15191e]">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
          >
            <source src="/videos/hello.mp4" type="video/mp4" />
          </video>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Content */}
          <div className="relative z-20 max-w-lg mb-10">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wider uppercase text-white backdrop-blur-md mb-6">
              Premium Series
            </span>
            <h1 className="text-5xl font-bold tracking-tight leading-tight text-white mb-4">
              Đổi mới <br />từng chi tiết.
            </h1>
            <p className="text-lg text-gray-300 font-light max-w-md">
              Trải nghiệm công nghệ đỉnh cao với thiết kế tinh xảo, hiệu năng vượt trội và đẳng cấp khác biệt.
            </p>
          </div>
        </div>

        {/* ========== RIGHT SIDE: Login Form ========== */}
        <div className="flex w-full flex-col items-center justify-center bg-[#050505] lg:w-1/2 relative p-6 min-h-screen">
          {/* Background Ambient Glows - hidden on mobile */}
          <div className="hidden lg:block absolute top-[-10%] right-[-5%] h-[300px] w-[300px] rounded-full bg-[#0f83f0]/10 blur-[100px]" />
          <div className="hidden lg:block absolute bottom-[-10%] left-[-5%] h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />

          <div className="w-full max-w-[440px] z-10">
            {/* Header */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#0f83f0]">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Chào mừng trở lại</h2>
              <p className="text-gray-400">Nhập thông tin đăng nhập của bạn để tiếp tục.</p>
            </div>

            {/* Glass Card */}
            <div className="backdrop-blur-[20px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Segmented Control */}
              <div className="mb-8 flex rounded-xl bg-black/40 p-1.5 border border-white/5">
                <button className="relative flex-1 rounded-lg bg-[#1c252e] py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/10 transition-all">
                  Đăng nhập
                </button>
                <Link
                  to="/register"
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors text-center"
                >
                  Đăng ký
                </Link>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Email Input */}
                <div className="group">
                  <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                  <div className="flex items-center rounded-lg bg-black/30 px-4">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="email@example.com"
                      className="h-12 w-full bg-transparent px-3 text-white placeholder-gray-500 outline-none border-0 appearance-none text-[15px]"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{t(errors.email.message)}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">Mật khẩu</label>
                    <Link to="/forgot-password" className="text-xs font-medium text-[#0f83f0] hover:text-[#0f83f0]/80 transition-colors">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="flex items-center rounded-lg bg-black/30 px-4">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••"
                      className="h-12 w-full bg-transparent px-3 text-white placeholder-gray-500 outline-none border-0 appearance-none text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">{t(errors.password.message)}</p>
                  )}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#0f83f0] py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] transition-all hover:bg-[#0f83f0]/90 hover:scale-[1.01] hover:shadow-[0_0_25px_-5px_rgba(15,131,240,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  ) : (
                    "Tiếp tục"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0e0e10] px-3 text-gray-500 tracking-wider font-medium">Hoặc tiếp tục với</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="flex justify-center">
                <div ref={googleButtonRef} />
              </div>
            </div>

            {/* Terms */}
            <p className="mt-8 text-center text-xs text-gray-600">
              Bằng cách tiếp tục, bạn đồng ý với{" "}
              <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2">
                Chính sách bảo mật
              </a>{" "}
              của chúng tôi.
            </p>
          </div>
        </div>
      </div>

      {/* EXTRA INFO MODAL */}
      {showExtraForm && missingFields && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-[20px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-md">
            <h3 className="text-xl font-bold mb-2 text-white">
              Hoàn tất thông tin
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Vui lòng cung cấp thêm thông tin để hoàn tất đăng ký
            </p>

            <form onSubmit={handleSubmitExtra(onSubmitExtra)} className="space-y-4">
              {missingFields.phone_number && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Số điện thoại <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerExtra("phone_number")}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#0f83f0]/50 transition"
                  />
                  {extraErrors.phone_number && (
                    <p className="text-red-400 text-xs mt-1">
                      {extraErrors.phone_number.message}
                    </p>
                  )}
                </div>
              )}

              {missingFields.date_of_birth && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Ngày sinh <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerExtra("date_of_birth")}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:outline-none focus:border-[#0f83f0]/50 transition"
                  />
                  {extraErrors.date_of_birth && (
                    <p className="text-red-400 text-xs mt-1">
                      {extraErrors.date_of_birth.message}
                    </p>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtraForm(false);
                    setTempToken(null);
                    setMissingFields(null);
                    resetExtraForm();
                    clearExtraErrors();
                    setErrorMessage("");
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={oauthLoading}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#0f83f0] text-white font-semibold shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] hover:bg-[#0f83f0]/90 transition disabled:opacity-50"
                >
                  {oauthLoading ? "Đang xử lý..." : "Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {oauthLoading && !showExtraForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-[20px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 border border-white/[0.08]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-[#0f83f0] rounded-full animate-spin" />
              <p className="text-gray-300 font-medium">
                Đang xử lý đăng nhập...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}