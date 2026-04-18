// src/pages/user/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineUser, HiOutlineMapPin, HiOutlineShoppingBag,
  HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle,
  HiOutlinePencil, HiOutlineXMark, HiOutlineCheck
} from "react-icons/hi2";

const AvatarImage = React.memo(function AvatarImage({ src, alt = "Avatar", className = "", fallback = "/default-avatar.png", onBroken = null }) {
  const imgRef = useRef(null);
  const lastSrcRef = useRef(null);

  useEffect(() => {
    const final = src && typeof src === "string" && src.trim() !== "" ? src.trim() : fallback;
    if (lastSrcRef.current === final) return;
    lastSrcRef.current = final;
    const img = imgRef.current;
    if (!img) return;
    const handleError = () => { if (onBroken) onBroken(img.src); img.onerror = null; img.src = fallback; };
    img.onerror = handleError;
    img.src = final;
    return () => { img.onerror = null; };
  }, [src, fallback, onBroken]);

  return <img ref={imgRef} alt={alt} className={className} />;
});

export default function Profile() {
  const { user, loading: contextLoading, error, fetchMyInfo, updateMyInfo } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [previewAvatar, setPreviewAvatar] = useState("/default-avatar.png");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    avatar: null,
  });

  useEffect(() => {
    const load = async () => {
      await fetchMyInfo();
      setIsInitialLoad(false);
    };
    load();
  }, [fetchMyInfo]);

  useEffect(() => {
    if (user) {
      setPreviewAvatar(user.avatar || "/default-avatar.png");
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
    }
  }, [user]);

  const handleAvatarBroken = () => setPreviewAvatar("/default-avatar.png");

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChooseAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatar: file }));
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
  setSaveError(null);
  try {
    // Backend chỉ nhận 3 field này, không có email
    const payload = {
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim(),
      date_of_birth: form.date_of_birth,
    };

    await updateMyInfo(payload);
    await fetchMyInfo();
    setIsEditing(false);
  } catch (e) {
    setSaveError(e?.response?.data?.message || "Cập nhật thất bại, thử lại sau.");
    console.error(e);
  }
};

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
      setPreviewAvatar(user.avatar || "/default-avatar.png");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (isInitialLoad && contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-white flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <p className="text-red-500 text-center mt-10 bg-gradient-to-br from-blue-50 via-slate-50 to-white min-h-screen pt-32">
        {error}
      </p>
    );
  }

  const menuCards = [
    {
      href: "#personal-info",
      icon: HiOutlineUser,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Thông tin cá nhân",
      desc: "Cập nhật họ tên, số điện thoại và địa chỉ email chính thức của bạn.",
      onClick: () => setIsEditing(true),
    },
    {
      href: "/user/addresses",
      icon: HiOutlineMapPin,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Sổ địa chỉ",
      desc: "Quản lý các địa chỉ giao hàng và nhận hóa đơn thanh toán.",
    },
    {
      href: "/user/orders",
      icon: HiOutlineShoppingBag,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
      title: "Lịch sử mua hàng",
      desc: "Theo dõi đơn hàng, xem lại các hóa đơn và trạng thái vận chuyển.",
    },
    {
      href: "#security",
      icon: HiOutlineShieldCheck,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      title: "Bảo mật",
      desc: "Đổi mật khẩu, thiết lập xác thực 2 lớp và quản lý các thiết bị đã đăng nhập.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-white text-slate-800 pt-28 pb-12">
      <main className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">

        {/* ── Profile Header ── */}
        <header className="flex flex-col items-center mb-20 text-center">
          <div className="relative mb-8">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-white border-2 border-blue-200 shadow-md flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                <AvatarImage
                  src={previewAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  fallback="/default-avatar.png"
                  onBroken={handleAvatarBroken}
                />
              </div>
            </div>
            {isEditing && (
              <label className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white hover:bg-blue-600 transition-colors cursor-pointer shadow-md">
                <HiOutlinePencil className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleChooseAvatar} />
              </label>
            )}
          </div>

          {/* Tên — màu đậm rõ ràng */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            {form.full_name || user?.full_name || "User"}
          </h1>
          {/* Sub — xám trung tính, đủ tương phản */}
          <p className="text-slate-500 font-medium text-base">
            Thành viên Platinum • Tham gia từ 2023
          </p>
        </header>

        {/* ── Edit Modal ── */}
        {isEditing && (
          <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa thông tin</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Họ và tên", name: "full_name", type: "text", placeholder: "Nguyễn Văn A" },
                  { label: "Email", name: "email", type: "email", placeholder: "email@example.com" },
                  { label: "Số điện thoại", name: "phone_number", type: "tel", placeholder: "0901234567" },
                  { label: "Ngày sinh", name: "date_of_birth", type: "date", placeholder: "" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name}>
                    {/* Label — slate-700 đậm, dễ đọc */}
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={onChangeInput}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl 
  text-black !text-black placeholder:text-gray-400 
  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>

              {/* Hiển thị lỗi nếu có */}
              {saveError && (
                <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  {saveError}
                </p>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={contextLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-all font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow"
                >
                  {contextLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5" /> Lưu thay đổi</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Menu Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuCards.map((card, idx) => {
            const Icon = card.icon;
            const CardWrapper = card.onClick ? "button" : Link;
            const wrapperProps = card.onClick
              ? { onClick: card.onClick, type: "button" }
              : { to: card.href };

            return (
              <CardWrapper
                key={idx}
                {...wrapperProps}
                className="group bg-white border border-slate-200 p-8 rounded-3xl transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 relative overflow-hidden text-left w-full"
              >
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center mb-8 ${card.iconColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  {/* Title — slate-900 đậm nhất */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                  {/* Desc — slate-600 đủ tương phản trên nền trắng */}
                  <p className="text-slate-600 leading-relaxed max-w-sm text-sm">{card.desc}</p>
                </div>
                <div className="absolute right-8 bottom-8 text-slate-300 group-hover:text-blue-400 transition-colors">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* ── Logout ── */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-all text-slate-600 hover:text-red-600 group shadow-sm"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            <span className="font-semibold">Đăng xuất tài khoản</span>
          </button>
        </div>
      </main>
    </div>
  );
}