// Register.jsx - Dark Theme with Video
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";

const schemaStep1 = yup.object({
  full_name: yup.string().required("auth.required"),
  date_of_birth: yup.string().required("auth.required"),
  phone_number: yup.string().required("auth.required"),
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schemaStep1) });

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
      });

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

        {/* ========== RIGHT SIDE: Register Form ========== */}
        <div className="flex w-full flex-col items-center justify-center bg-[#050505] lg:w-1/2 relative p-6 min-h-screen">
          {/* Background Ambient Glows - hidden on mobile */}
          <div className="hidden lg:block absolute top-[-10%] right-[-5%] h-[300px] w-[300px] rounded-full bg-[#0f83f0]/10 blur-[100px]" />
          <div className="hidden lg:block absolute bottom-[-10%] left-[-5%] h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />

          <div className="w-full max-w-[440px] z-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#0f83f0]">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                {step === 1 ? "Tạo tài khoản" : "Xác minh email"}
              </h2>
              <p className="text-gray-400">
                {step === 1
                  ? "Đăng ký để trải nghiệm dịch vụ của chúng tôi."
                  : "Nhập mã xác minh đã được gửi đến email của bạn."}
              </p>
            </div>

            {/* Glass Card */}
            <div className="backdrop-blur-[20px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Segmented Control */}
              <div className="mb-8 flex rounded-xl bg-black/40 p-1.5 border border-white/5">
                <Link
                  to="/login"
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors text-center"
                >
                  Đăng nhập
                </Link>
                <button className="relative flex-1 rounded-lg bg-[#1c252e] py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/10 transition-all">
                  Đăng ký
                </button>
              </div>

              {/* STEP 1: Registration Form */}
              {step === 1 && (
                <form onSubmit={handleSubmit(onSubmitStep1)} className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Họ và tên</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        {...register("full_name")}
                        placeholder="Nguyễn Văn A"
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 outline-none border-0 appearance-none text-sm"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-red-400 text-xs mt-1">{t(errors.full_name.message)}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Ngày sinh</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        {...register("date_of_birth")}
                        className="h-12 w-full border-none bg-transparent px-3 text-white outline-none border-0 appearance-none text-sm"
                      />
                    </div>
                    {errors.date_of_birth && (
                      <p className="text-red-400 text-xs mt-1">{t(errors.date_of_birth.message)}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Số điện thoại</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        {...register("phone_number")}
                        placeholder="0912345678"
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 outline-none border-0 appearance-none text-sm"
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="text-red-400 text-xs mt-1">{t(errors.phone_number.message)}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        {...register("email")}
                        placeholder="email@example.com"
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 outline-none border-0 appearance-none text-sm"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{t(errors.email.message)}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Mật khẩu</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        placeholder="••••••••"
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 outline-none border-0 appearance-none text-sm"
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
                      "Đăng ký"
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: OTP Verification */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-400">
                    Mã xác minh đã gửi đến <span className="text-white font-medium">{email}</span>
                  </p>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Mã xác minh (OTP)</label>
                    <div className="flex items-center rounded-lg bg-black/30 px-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Nhập mã 6 chữ số..."
                        className="h-12 w-full border-none bg-transparent px-3 text-white placeholder-gray-600 outline-none border-0 appearance-none text-sm tracking-widest"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {otpMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-sm">{otpMessage}</p>
                    </div>
                  )}

                  <button
                    onClick={onSubmitVerify}
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#0f83f0] py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(15,131,240,0.5)] transition-all hover:bg-[#0f83f0]/90 hover:scale-[1.01] hover:shadow-[0_0_25px_-5px_rgba(15,131,240,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xác minh...
                      </div>
                    ) : (
                      "Xác minh email"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-center text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ← Quay lại
                  </button>
                </div>
              )}
            </div>

            {/* Terms */}
            <p className="mt-8 text-center text-xs text-gray-600">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2">
                Chính sách bảo mật
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
