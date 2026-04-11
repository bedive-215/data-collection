// ForgotPassword.jsx - Dark Theme
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const schemaEmail = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
});

const schemaCode = yup.object({
  code: yup.string().required("auth.required").min(4, "Mã không hợp lệ"),
});

const schemaReset = yup.object({
  newPassword: yup.string().required("auth.required").min(6, "Mật khẩu quá ngắn"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Mật khẩu không khớp"),
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

      await resetPassword({
        email,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Đặt lại mật khẩu thành công. Hãy đăng nhập lại!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans antialiased bg-[#050505] text-white overflow-x-hidden">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ========== LEFT SIDE: Video ========== */}
        <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-end p-12 overflow-hidden bg-gradient-to-br from-[#2b303b] to-[#15191e]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
          >
            <source src="/videos/hello.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

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

        {/* ========== RIGHT SIDE: Form ========== */}
        <div className="flex w-full flex-col items-center justify-center bg-[#050505] lg:w-1/2 relative p-6 min-h-screen">
          <div className="hidden lg:block absolute top-[-10%] right-[-5%] h-[300px] w-[300px] rounded-full bg-[#0f83f0]/10 blur-[100px]" />
          <div className="hidden lg:block absolute bottom-[-10%] left-[-5%] h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />

          <div className="w-full max-w-[440px] z-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#0f83f0]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                {step === 1 && "Quên mật khẩu"}
                {step === 2 && "Nhập mã xác nhận"}
                {step === 3 && "Đặt mật khẩu mới"}
              </h2>
              <p className="text-gray-400">
                {step === 1 && "Nhập email để nhận mã khôi phục"}
                {step === 2 && `Mã đã gửi đến: ${email}`}
                {step === 3 && "Đặt lại mật khẩu mới cho tài khoản"}
              </p>
            </div>

            <div className="backdrop-blur-[20px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">

              {/* STEP 1: Email */}
              {step === 1 && (
                <form onSubmit={formEmail.handleSubmit(handleSendEmail)} className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                    <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition-colors focus-within:border-[#0f83f0]/50 focus-within:bg-black/40 hover:border-white/20">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        {...formEmail.register("email")}
                        placeholder="email@example.com"
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-0 text-sm"
                      />
                    </div>
                    {formEmail.formState.errors.email && (
                      <p className="text-red-400 text-xs mt-1">{t(formEmail.formState.errors.email.message)}</p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-sm">{successMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#0f83f0] py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] transition-all hover:bg-[#0f83f0]/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Đang gửi..." : "Gửi mã khôi phục"}
                  </button>
                </form>
              )}

              {/* STEP 2: Code */}
              {step === 2 && (
                <form onSubmit={formCode.handleSubmit(handleVerifyCode)} className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Mã xác nhận</label>
                    <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition-colors focus-within:border-[#0f83f0]/50 focus-within:bg-black/40 hover:border-white/20">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <input
                        type="text"
                        {...formCode.register("code")}
                        placeholder="Nhập mã 4-6 số..."
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-0 text-sm tracking-widest"
                      />
                    </div>
                    {formCode.formState.errors.code && (
                      <p className="text-red-400 text-xs mt-1">{formCode.formState.errors.code.message}</p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-sm">{successMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#0f83f0] py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] transition-all hover:bg-[#0f83f0]/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Đang xác minh..." : "Xác minh mã"}
                  </button>
                </form>
              )}

              {/* STEP 3: Reset Password */}
              {step === 3 && (
                <form onSubmit={formReset.handleSubmit(handleResetPassword)} className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Mật khẩu mới</label>
                    <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition-colors focus-within:border-[#0f83f0]/50 focus-within:bg-black/40 hover:border-white/20">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        {...formReset.register("newPassword")}
                        placeholder="Nhập mật khẩu mới..."
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-0 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-white transition-colors"
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
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Xác nhận mật khẩu</label>
                    <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition-colors focus-within:border-[#0f83f0]/50 focus-within:bg-black/40 hover:border-white/20">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        {...formReset.register("confirmPassword")}
                        placeholder="Nhập lại mật khẩu..."
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-0 text-sm"
                      />
                    </div>
                    {formReset.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{formReset.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-sm">{successMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#0f83f0] py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] transition-all hover:bg-[#0f83f0]/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Đang đặt lại..." : "Đặt mật khẩu mới"}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-[#0f83f0] hover:text-[#0f83f0]/80 transition-colors">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-600">
              Bạn cần hỗ trợ?{" "}
              <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2">
                Liên hệ chúng tôi
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
